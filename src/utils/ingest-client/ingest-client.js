/**
 * Created by rolando on 01/08/2018.
 */
const request = require('request-promise');
const exceptions = require('./ingest-client-exceptions');
const NoUuidError = exceptions.NoUuidError;

class IngestClient {
    constructor(ingestUrl) {
        this.ingestUrl = ingestUrl;
    }

    getMetadataDocument(entityCallback) {
        const entityUrl = this.urlFor(entityCallback);

        return new Promise((resolve, reject) => {
            request({
                method: "GET",
                url: entityUrl,
                json: true
            }).then(resp => {
                resolve(resp.body);
            }).catch(err => {
                reject(err);
            });
        });
    }

    getMetadataDocumentUuid(entityCallback) {
        return new Promise((resolve, reject) => {
            this.getMetadataDocument(entityCallback).then(doc => {
                if(doc["uuid"] && doc["uuid"]["uuid"]) {
                    resolve(doc["uuid"]["uuid"]);
                } else {
                    reject(new NoUuidError("document at " + entityCallback + "has no UUID"));
                }
            }).catch(err => {
                reject(err);
            })
        });

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