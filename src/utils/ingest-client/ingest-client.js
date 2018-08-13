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

    transitionDocumentState(entityUrl, validationState) {
        return this.retrieveMetadataDocument(entityUrl)
            .then(doc => {
                return request({
                    method: "PUT",
                    url: doc["_links"][validationState.toLowerCase()]["href"],
                    body: {},
                    json: true
                });
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
                body: JSON.stringify(patchPayload)
            }).then(resp => {
                resolve(resp);
            }).catch(err =>{
                reject(err);
            });
        });
    }

    postValidationReport(entityUrl, validationReport) {
        return this.transitionDocumentState(entityUrl, validationReport.validationState)
            .then(() => {return this.setValidationErrors(entityUrl, validationReport.validationErrors)})
            .then((resp) => {
                if(validationReport.validationJobId) {
                    return this.reportValidationJobId(entityUrl, validationReport.validationJobId);
                } else {
                    return Promise.resolve(resp);
                }
            });
    }

    fetchSchema(schemaUrl) {
        return request({
            method: "GET",
            url: schemaUrl,
            json: true,
        });
    }

    urlForCallbackLink(entityCallback) {
        return this.ingestUrl + entityCallback;
    }

    selfLinkForResource(resource) {
        return resource["_links"]["self"]["href"];
    }

    envelopesLinkForResource(resource) {
        return resource["_links"]["submissionEnvelopes"]["href"];
    }

    /**
     * gets envelopes associated with this metadata document
     * @param metadataDocument
     */
    envelopesForMetadataDocument(metadataDocument) {
        return new Promise((resolve, reject) => {
            request({
                method: "GET",
                url: this.envelopesLinkForResource(metadataDocument),
                json: true,
            }).then(resp => {
                // envelopes are embedded entities
                resolve(resp['_embedded']['submissionEnvelopes']);
            }).catch(err => {
                reject(err);
            });
        });
    }

    reportValidationJobId(fileDocumentUrl, validationJobId) {
        return request({
            method: "PATCH",
            url: fileDocumentUrl,
            body: {
                "validationId": validationJobId
            },
            json: true
        });
    }
}

module.exports = IngestClient;