/**
 * Created by rolando on 01/08/2018.
 */
const request = require('request-promise');
const Promise = require('bluebird');
const exceptions = require('./ingest-client-exceptions');
const NoUuidError = exceptions.NoUuidError;

class IngestClient {
    constructor(connectionConfig) {
        this.ingestUrl = connectionConfig["scheme"] + "://" + connectionConfig["host"] + ":" + connectionConfig["port"];
    }

    retrieveMetadataDocument(entityCallback) {
        const entityUrl = this.urlFor(entityCallback);

        return new Promise((resolve, reject) => {
            request({
                method: "GET",
                url: entityUrl,
                json: true
            }).then(resp => {
                resolve(resp);
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     *
     * Retrieves the metadata document, but throws a NoUuidError if the document has no uuid
     *
     * @param entityCallback
     * @returns {Promise} resolving to the metadata document JSON
     */
    getMetadataDocument(entityCallback) {
        return new Promise((resolve, reject) => {
            this.retrieveMetadataDocument(entityCallback).then(doc => {
                if(doc["uuid"] && doc["uuid"]["uuid"]) {
                    resolve(doc);
                } else {
                    throw new NoUuidError("document at " + entityCallback + "has no UUID");
                }
            }).catch(NoUuidError, (err) => {
                reject(err);
            })
        });
    }

    setDocumentState(entityCallback, validationState){
        const patchPayload = {
          "validationState" : validationState
        };

        const entityUrl = this.urlFor(entityCallback);

        return new Promise((resolve, reject) => {
            request({
                method: "PATCH",
                url: entityUrl,
                json: true,
                body: patchPayload
            }).then(resp => {
                resolve(resp);
            }).catch(err => {
                reject(err);
            })
        });
    }

    setValidationErrors(entityCallback, validationErrors) {
        const patchPayload = {
            "validationErrors" : validationErrors
        };

        const entityUrl = this.urlFor(entityCallback);

        return new Promise((resolve, reject) => {
            request({
                method: "PATCH",
                url: entityUrl,
                json: true,
                body: patchPayload
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