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

type FileSpecificResource = {
    content: {
        fileCore : {
            fileFormat: string
        }
    }
    cloudUrl: string;
}

type MetadataResource = {
    content: any;
    _links: {
        self: {
            href: string
        }
    }
}

type FileResource = FileSpecificResource & MetadataResource;


type FastqValidationContext = {
    numFastqs: number,
    fastqUris: string[],
    pairedness: boolean
}

type FastqValidationPlan = {
    doValidation: boolean,
    fastqValidationContext: FastqValidationContext;
}

type Traverson = typeof traverson;

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
    static determineValidationContext(fileResource: FileResource): FastqValidationContext|undefined {
        return undefined;
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
        if(R.path(["content", "fileCore", "fileFormat"], fileResource) && R.path(["cloudUrl"], fileResource)) {
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


    static _isPairedEnd(fileResource: FileResource, ingestClient: IngestClient) : Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const fileUrl = fileResource._links.self.href;
            FastqValidator._getDerivedProcessesForFile(fileUrl, ingestClient).then(derivedProcesses => {
                const numDerivedProcesses = derivedProcesses.length;
                if(numDerivedProcesses != 1) {
                    throw new SingleProcessAssertionError(`Error: expected to find 1 derivedProcess for file at ${fileUrl} but found ${numDerivedProcesses}`);
                } else {
                    const derivedProcess = FastqValidator._parseMetadataResource(derivedProcesses[0]);
                    ingestClient.retrieveEmbeddedEntities(derivedProcess._links.self.href, "protocols", "protocols").then(protocols => {
                        const protocolResources: MetadataResource[] = R.map(protocol => FastqValidator._parseMetadataResource(protocol), protocols);
                        resolve(R.any( (protocolResource) => protocolResource.content["paired_end"] == true, protocolResources))
                    });
                }
            })
        });
    }

    // static _isSmartSeq2(fileResource: FileResource, ingestClient: IngestClient) : Promise<boolean> {
    //
    // }

    static _getDerivedProcessesForFile(fileUrl: string, ingestClient: IngestClient) : Promise<MetadataResource[]> {
        return new Promise<MetadataResource[]>((resolve, reject) => {
            ingestClient.retrieveEmbeddedEntities(fileUrl, "derivedProcesses", "processes").then(derivedProcesses => {
                    resolve(R.map(derivedProcess => FastqValidator._parseMetadataResource(derivedProcess), derivedProcesses));
            });
        });
    }

    static _getProtocolsForProcess(processUrl: string, ingestClient: IngestClient) : Promise<MetadataResource[]> {
        return new Promise<MetadataResource[]>((resolve, reject) => {
            ingestClient.retrieveEmbeddedEntities(processUrl, "protocols", "protocols").then(protocols => {
                resolve(R.map(derivedProcess => FastqValidator._parseMetadataResource(derivedProcess), protocols));
            });
        });
    }

    static _isFastq(fileResource: FileResource): boolean {
        return fileResource.content.fileCore.fileFormat.indexOf("fastq") != -1;
    }

    static _isFile(resourceType: string): boolean {
        return resourceType == "FILE";
    }
}

export default FastqValidator;