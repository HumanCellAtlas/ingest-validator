/**
 *
 * Handles logic for doing fastq validation on File resources, as well as paired-fastq header validation
 *
 */
import R from "ramda";
import {
    FileResourceParseError,
    MetadataResourceParseError,
    SingleProcessAssertionError
} from "./fastq-validation-exceptions";
import IngestClient from "../../utils/ingest-client/ingest-client";
import Promise from "bluebird";
import traverson from "traverson";
import {FastqValidationContext, FileResource, MetadataResource} from "../../common/types";

class FastqValidator {
    ingestClient: IngestClient;

    constructor(ingestClient: IngestClient) {
        this.ingestClient = ingestClient;
    }

    /**
     *
     * how do we validate this fastq or should we validate
     *
     * @param fileResource
     */
    determineValidationContext(fileResource: FileResource): FastqValidationContext|undefined {
        if(this.isPairedEnd(fileResource)){
            return undefined;
        }
    }

    isPairedEnd(fileResource: FileResource) : Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const fileUrl = fileResource._links.self.href;
            this.getDerivedProcessesForFile(fileUrl).then(derivedProcesses => {
                const numDerivedProcesses = derivedProcesses.length;
                if(numDerivedProcesses != 1) {
                    throw new SingleProcessAssertionError(`Error: expected to find 1 derivedProcess for file at ${fileUrl} but found ${numDerivedProcesses}`);
                } else {
                    const derivedProcess = FastqValidator._parseMetadataResource(derivedProcesses[0]);
                    this.getProtocolsForProcess(derivedProcess._links.self.href).then(protocolResources => {
                        resolve(FastqValidator._isProtocolPairedEnd(protocolResources))
                    });
                }
            })
        });
    }


    getDerivedProcessesForFile(fileUrl: string) : Promise<MetadataResource[]> {
        return new Promise<MetadataResource[]>((resolve, reject) => {
            this.ingestClient.retrieveEmbeddedEntities(fileUrl, "derivedProcesses", "processes").then(derivedProcesses => {
                    resolve(R.map(derivedProcess => FastqValidator._parseMetadataResource(derivedProcess), derivedProcesses));
            });
        });
    }

    getProtocolsForProcess(processUrl: string) : Promise<MetadataResource[]> {
        return new Promise<MetadataResource[]>((resolve, reject) => {
            this.ingestClient.retrieveEmbeddedEntities(processUrl, "protocols", "protocols").then(protocols => {
                resolve(R.map(derivedProcess => FastqValidator._parseMetadataResource(derivedProcess), protocols));
            });
        });
    }

    static _isResourceEligible(resource: any, resourceType: string): boolean {
        if(! FastqValidator._isFile(resourceType)) {
            return false;
        } else {
            try {
                const fileResource = FastqValidator._parseFileResource(resource);
                return FastqValidator._isFastq(fileResource);
            } catch (err) {
                if(err instanceof FileResourceParseError) {
                    return false;
                } else {
                    throw err;
                }
            }
        }
    }

    static _parseFileResource(resource: any) : FileResource {
        const metadataResource = FastqValidator._parseMetadataResource(resource);
        const fileResource = metadataResource as FileResource;
        if(R.path(["content", "file_core", "file_format"], fileResource) && R.path(["cloudUrl"], fileResource)) {
            return fileResource;
        } else {
            throw new FileResourceParseError();
        }
    }

    static _parseMetadataResource(resource: any) : MetadataResource {
        const metadataResource = resource as MetadataResource;
        if(R.path(["_links", "self", "href"], resource)) {
            return metadataResource;
        } else {
            throw new MetadataResourceParseError();
        }
    }

    static _isFastq(fileResource: FileResource): boolean {
        return fileResource.content.file_core.file_format.indexOf("fastq") != -1;
    }

    static _isFile(resourceType: string): boolean {
        return resourceType == "FILE";
    }

    static _isProtocolPairedEnd(sequencingProtocols: MetadataResource[]) : boolean {
        return R.any( (protocolResource) => protocolResource.content["paired_end"] == true, sequencingProtocols);
    }
}

export default FastqValidator;