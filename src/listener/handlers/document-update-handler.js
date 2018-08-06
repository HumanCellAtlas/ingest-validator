/**
 * Created by rolando on 02/08/2018.
 */
const Promise = require('bluebird');
const NoUuidError = require('../../utils/ingest-client/ingest-client-exceptions').NoUuidError;

class DocumentUpdateHandler {
    constructor(validator, ingestClient) {
        this.validator = validator;
        this.ingestClient = ingestClient;
    }

    handle(msg) {
        let callbackLink = JSON.parse(msg.content)['callbackLink'];

        return new Promise((resolve, reject) => {
            this.ingestClient.getMetadataDocument(callbackLink).then(doc => {
                const documentContent = doc["content"];
                this.validator.autoValidate(documentContent).then(validationErrors => {
                    this.ingestClient.setValidationErrors(callbackLink, validationErrors).then(resp => {
                        console.info("Patched validation errors to document at " + callbackLink);
                        resolve(resp);
                    })
                }).catch(err => {
                    console.error("Error validating document with callback link " + callbackLink);
                    reject(err);
                })
            }).catch(NoUuidError, (err) => {
                console.info("Document at " + callbackLink + " has no uuid, ignoring...");
            }).catch(err => {
                console.error("Document at " + callbackLink + " has no uuid, ignoring...");
            });
        });
    }
}

module.exports = DocumentUpdateHandler;