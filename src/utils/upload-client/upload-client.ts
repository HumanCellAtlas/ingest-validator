import Promise from "bluebird";
import request from "request-promise";
import {FileValidationRequest, UploadApiConnectionProperties} from "../../common/types";

class UploadClient {
    uploadApiConnectionProperties: UploadApiConnectionProperties;
    uploadUrl: string;
    uploadApiKey: string;

    constructor(uploadApiConnectionProperties: UploadApiConnectionProperties, uploadApiKey: string) {
        this.uploadApiConnectionProperties = uploadApiConnectionProperties;
        this.uploadUrl = uploadApiConnectionProperties["scheme"] + "://" + uploadApiConnectionProperties["host"] + ":" + uploadApiConnectionProperties["port"];
        this.uploadApiKey = uploadApiKey;
    }

    requestFileValidationJob(validationRequest: FileValidationRequest) : Promise<string> {
        return UploadClient._requestFileValidationJob(validationRequest, this.uploadUrl, this.uploadApiKey);
    }

    static _requestFileValidationJob(validationRequest: FileValidationRequest, uploadUrl: string, uploadApiKey: string) : Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const uploadAreaUuid = validationRequest.uploadAreaUuid;
            const fileName = validationRequest.fileName;
            const imageUrl = validationRequest.validationImageUrl;

            const validateFileUrl = uploadUrl + "/v1/area/" + uploadAreaUuid + "/" + encodeURIComponent(fileName) + "/validate";
            request({
                method: "PUT",
                url: validateFileUrl,
                json: true,
                headers: {
                    "Api-key" : uploadApiKey
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