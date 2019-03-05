/**
 *
 * Handles logic for doing fastq validation on File resources, as well as paired-fastq header validation
 *
 */
import R from "ramda";
import Promise from "bluebird";
import {
    FileResourceParseError,
    MetadataResourceParseError, SinglePairedEndSiblingAssertionError,
    SingleProcessAssertionError
} from "./fastq-validation-exceptions";
import IngestClient from "../../utils/ingest-client/ingest-client";
import {
    FileResource, FileValidationImage,
    MetadataResource,
    ValidationPlan
} from "../../common/types";
import IFileValidationModule from "../file-validation-module";

class FastqValidator implements IFileValidationModule{
    ingestClient: IngestClient;
    fastqValidationImage: FileValidationImage;

    constructor(ingestClient: IngestClient, fastqValidationImage: FileValidationImage) {
        this.ingestClient = ingestClient;
        this.fastqValidationImage = fastqValidationImage;
    }

    /**
     *
     * how do we validate this fastq or should we validate
     *
     * @param fileResource
     */

    isEligible(fileResource: FileResource): Promise<boolean> {
        return Promise.resolve(FastqValidator._isResourceEligible(fileResource, "FILE"));
    }

    run(fileResource: FileResource): Promise<ValidationPlan[]> {
        return new Promise<ValidationPlan[]>((resolve, reject) => {
            if(this.isPairedEnd(fileResource)) {
                const fileUrl = fileResource._links.self.href;
                this.getPairedEndSiblingFile(fileUrl).then(siblingFile => {
                    const fileUuids = R.map(fileResource => fileResource.uuid.uuid, [fileResource, siblingFile]);

                });
            } else {
                const fileUuid = fileResource.uuid.uuid;
                const validationLabel = "fastq-validation:sequence-data";
                const validationImage = this.fastqValidationImage;

            }
        });
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

    getPairedEndSiblingFile(fileUrl: string): Promise<FileResource> {
        return new Promise<FileResource>((resolve, reject) => {
            this.getDerivedProcessesForFile(fileUrl)
                .then((derivedProcesses: MetadataResource[])  => {
                    const numDerivedProcesses = derivedProcesses.length;
                    if(derivedProcesses.length != 1) {
                        return reject(new SingleProcessAssertionError(`Error: expected to find 1 derivedProcess for file at ${fileUrl} but found ${numDerivedProcesses}`))
                    } else {
                        const derivedProcess = derivedProcesses[0];
                        const derivedProcessUrl = derivedProcess._links.self.href;
                        this.getOutputFilesForProcess(derivedProcessUrl).then(outputFiles => {
                            const siblingFiles = R.filter(outputFile => outputFile._links.self.href != fileUrl, outputFiles);
                            const numSiblingFiles = siblingFiles.length;
                            if(numSiblingFiles != 1) {
                                reject(new SinglePairedEndSiblingAssertionError(`Error: expected to find 1 paired end sibling for file at ${fileUrl} but found ${numSiblingFiless}`))
                            } else {
                                const siblingFile = siblingFiles[0];
                                resolve(siblingFile);
                            }
                        });
                    }
                })
        });
    }

    getOutputFilesForProcess(processUrl: string): Promise<FileResource[]> {
        return new Promise<FileResource[]>((resolve, reject) => {
            this.ingestClient.retrieveEmbeddedEntities(processUrl, "derivedFiles", "files").then(outputFiles => {
                resolve(R.map(outputFile => FastqValidator._parseFileResource(outputFile), outputFiles));
            });
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