/**
 * Created by rolando on 12/08/2018.
 */
import Promise from "bluebird";
import {FileValidationImage, UploadApiConnectionProperties} from "../../common/types";
import IngestClient from "./ingest-client";
import request from "request-promise";
import R from "ramda";
import {NoFileValidationJob} from "../../validation/ingest-validation-exceptions";


class IngestFileValidator {
    uploadApiConnectionProperties: UploadApiConnectionProperties;
    fileValidationUrl: string;
    fileValidationServiceApiKey: string;
    fileValidationImages: FileValidationImage[];
    ingestClient: IngestClient;

    constructor(connectionConfig: UploadApiConnectionProperties, apiKey: string, fileValidationImages: FileValidationImage[], ingestClient: IngestClient) {
        this.uploadApiConnectionProperties = connectionConfig;
        this.fileValidationUrl = connectionConfig["scheme"] + "://" + connectionConfig["host"] + ":" + connectionConfig["port"];
        this.fileValidationServiceApiKey = apiKey;
        this.fileValidationImages = fileValidationImages;
        this.ingestClient = ingestClient;
    }

    requestFileValidationJob(fileDocument: any, fileFormat: string, fileName: string) : Promise<string> {
        return new Promise((resolve, reject) => {
            this.uploadAreaForFile(fileDocument)
                .then((uploadAreaId: string) => {
                    const validationImage = this.imageFor(fileFormat);
                    if(! validationImage) {
                        reject(new NoFileValidationJob());
                    } else {
                        const imageUrl = validationImage.imageUrl;
                        const validateFileUrl = this.fileValidationUrl + "/v1/area/" + uploadAreaId + "/" + encodeURIComponent(fileName) + "/validate";
                        request({
                            method: "PUT",
                            url: validateFileUrl,
                            json: true,
                            headers: {
                                "Api-key" : this.fileValidationServiceApiKey
                            },
                            body: {
                                "validator_image": imageUrl
                            }
                        }).then((resp: any) => {
                            resolve(resp['validation_id']);
                        }).catch((err: Error) => {
                            console.error("ERROR: Failed to request a validation job for file at " + this.ingestClient.selfLinkForResource(fileDocument));
                            reject(err);
                        });
                        }
                });

        });
    }

    imageFor(fileFormat: string) : FileValidationImage|undefined {
        return R.find(R.propEq('fileFormat', fileFormat), this.fileValidationImages);
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