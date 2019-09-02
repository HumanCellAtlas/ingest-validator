import Promise from "bluebird";
import request from "request-promise";
import {FileValidationRequest, UploadApiConnectionProperties} from "../../common/types";
import {Client} from "../client";

class UploadClient extends Client {

    constructor(uploadApiConnectionProperties: UploadApiConnectionProperties, uploadApiKey: string) {
        const baseUrl =  uploadApiConnectionProperties["scheme"] + "://" + uploadApiConnectionProperties["host"] + ":" + uploadApiConnectionProperties["port"];
        super(baseUrl, uploadApiKey);
    }

    requestFileValidationJob(validationRequest: FileValidationRequest) : Promise<string> {
        return this.retry(5, this._requestFileValidationJob.bind(this), [validationRequest], "Retrying requestFileValidationJob()");
    }

    _requestFileValidationJob(validationRequest: FileValidationRequest) : Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const uploadAreaUuid = validationRequest.uploadAreaUuid;
            const fileName = validationRequest.fileName;
            const imageUrl = validationRequest.validationImageUrl;

            const validateFileUrl = this.clientBaseUrl + "/v1/area/" + uploadAreaUuid + "/" + encodeURIComponent(fileName) + "/validate";
            request({
                method: "PUT",
                url: validateFileUrl,
                json: true,
                headers: {
                    "Api-key" : this.clientApiKey
                },
                body: {
                    "validator_image": imageUrl
                }
            }).then((resp: any) => {
                resolve(resp['validation_id']);
            }).catch((err: Error) => {
                console.error(`ERROR: Failed to request a validation job for file with name ${fileName} at upload area ${uploadAreaUuid} with validation image ${imageUrl}`);
                reject(err);
            });
        });
    }
}

export default UploadClient;