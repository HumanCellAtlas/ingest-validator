/**
 * Created by rolando on 01/08/2018.
 */
const request = require('request-promise');

class IngestClient {
    constructor(ingestUrl) {
        this.ingestUrl = ingestUrl;
    }

    setDocumentState(entityCallback, validationState){
        patchPayload = {
          "validationState" : validationState
        };

        const entityUrl = this.urlFor(entityCallback);

        return new Promise((resolve, reject) => {
            request({
                method: "PATCH",
                url: entityUrl,
                json: true,
                data: patchPayload
            }).then(resp => {
                resolve(resp);
            }).catch(err => {
                reject(err);
            })
        });
    }

    setValidationErrors(entityCallback, validationErrors) {
        patchPayload = {
            "validationErrors" : validationErrors
        };

        const entityUrl = this.urlFor(entityCallback);

        return new Promise((resolve, reject) => {
            request({
                method: "PATCH",
                url: entityUrl,
                json: true,
                data: patchPayload
            }).then(resp => {
                resolve(resp);
            }).catch(err =>{
                reject(err);
            });
        });
    }


    urlFor(entityCallback) {
        return this.ingestUrl + entityCallback;
    }
}

module.exports = IngestClient;