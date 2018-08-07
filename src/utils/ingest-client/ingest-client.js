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

    retrieveMetadataDocument(entityUrl) {
        return request({
                method: "GET",
                url: entityUrl,
                json: true
        });
    }

    /**
     *
     * Retrieves the metadata document, but throws a NoUuidError if the document has no uuid
     *
     * @param entityUrl
     * @returns {Promise} resolving to the metadata document JSON
     */
    getMetadataDocument(entityUrl) {
        return new Promise((resolve, reject) => {
            this.retrieveMetadataDocument(entityUrl).then(doc => {
                if(doc["uuid"] && doc["uuid"]["uuid"]) {
                    resolve(doc);
                } else {
                    throw new NoUuidError("document at " + entityUrl + "has no UUID");
                }
            }).catch(NoUuidError, (err) => {
                reject(err);
            })
        });
    }

    setDocumentState(entityUrl, validationState){
        const patchPayload = {
          "validationState" : validationState
        };

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

    transitionDocumentState(document, validationState) {
        const validationStateTransitionUrl = document["_links"][validationState.toLowerCase()]["href"];

        return request({
            method: "PUT",
            url: validationStateTransitionUrl,
            body: {},
            json: true
        });
    }

    findFileByValidationId(validationId) {
        // TODO: determine search endpoint by following rels; cache the result
        const findByValidationUrl = this.ingestUrl + "/files/search/findByValidationId?validationId=" + validationId;

        return request({
                method: "GET",
                url: findByValidationUrl,
                json: true
        });
    }

    setValidationErrors(entityUrl, validationErrors) {
        const patchPayload = {
            "validationErrors" : validationErrors
        };

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

    urlForCallbackLink(entityCallback) {
        return this.ingestUrl + entityCallback;
    }

    selfLinkForResource(resource) {
        return resource["_links"]["self"]["href"];
    }
}

module.exports = IngestClient;