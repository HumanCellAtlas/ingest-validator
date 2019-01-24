/**
 * Created by rolando on 12/08/2018.
 */
import Promise from "bluebird";
import {FileValidationImage, FileValidationRequest, UploadApiConnectionProperties} from "../../common/types";
import IngestClient from "./ingest-client";
import request from "request-promise";
import R from "ramda";
import {NoFileValidationJob} from "../../validation/ingest-validation-exceptions";
import UploadClient from "../upload-client/upload-client";
import {FileAlreadyValidatedError} from "./ingest-client-exceptions";

class IngestFileValidator {
    fileValidationImages: FileValidationImage[];
    ingestClient: IngestClient;
    uploadClient: UploadClient;

    constructor(uploadClient: UploadClient, fileValidationImages: FileValidationImage[], ingestClient: IngestClient) {
        this.fileValidationImages = fileValidationImages;
        this.ingestClient = ingestClient;
        this.uploadClient = uploadClient
    }

    /**
     *
     * Validates a data file in File resource. Throws an exception if the File resource already has a validation job
     * associated with its current checksums
     *
     * @param fileResource
     * @param fileFormat
     * @param fileName
     */
    validateFile(fileResource: any, fileFormat: string, fileName: string) : Promise<string> {
        return this
            .assertNotAlreadyValidated(fileResource)
            .then(fileResource => {return this.uploadAreaForFile(fileResource)})
            .then(uploadAreaUuid => {
                const imageUrl = this.imageFor(fileFormat)!.imageUrl;
                return IngestFileValidator._validateFile(fileName, uploadAreaUuid, imageUrl, this.uploadClient)
            });
    }

    static _validateFile(fileName: string, uploadAreaUuid: string, imageUrl: string, uploadClient: UploadClient) : Promise<string> {
        const fileValidationRequest: FileValidationRequest = {
            fileName: fileName,
            uploadAreaUuid: uploadAreaUuid,
            validationImageUrl: imageUrl
        };

        return uploadClient.requestFileValidationJob(fileValidationRequest);
    }

    assertNotAlreadyValidated(fileResource: any) : Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const fileDocumentUrl = this.ingestClient.selfLinkForResource(fileResource);

            this.ingestClient.getValidationJob(fileDocumentUrl).then(validationJob => {
                if(! validationJob) {
                    resolve(fileResource);
                } else {
                    this.ingestClient.getFileChecksums(fileDocumentUrl).then(fileChecksums => {
                        const fileSha1 = fileChecksums.sha1;
                        const validatedSha1 = validationJob.checksums.sha1;
                        if(fileSha1 == validatedSha1) {
                            reject(new FileAlreadyValidatedError());
                        } else {
                            resolve(fileResource);
                        }
                    });
                }
            });
        });
    }

    imageFor(fileFormat: string) : FileValidationImage|undefined {
        return IngestFileValidator._imageFor(fileFormat, this.fileValidationImages);
    }

    static _imageFor(fileFormat: string, fileValidationImages: FileValidationImage[]) : FileValidationImage|undefined {
        return R.find(R.propEq('fileFormat', fileFormat), fileValidationImages);
    }

    uploadAreaForFile(fileDocument: string) : Promise<string> {
        return new Promise((resolve, reject) => {
            this.ingestClient.envelopesForMetadataDocument(fileDocument)
                .then((envelopes: any[]) => {
                    const envelope = envelopes[0]; // assuming there is at least 1 envelope
                    const uploadAreaId = envelope["stagingDetails"]["stagingAreaUuid"]["uuid"];
                    resolve(uploadAreaId);
                })
                .catch(err => {
                    console.error("ERROR: Error retrieving upload area ID for file at " + this.ingestClient.selfLinkForResource(fileDocument));
                    reject(err);
                });
        });
    }
}

export default IngestFileValidator;