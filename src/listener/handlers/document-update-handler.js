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
                documentContent = doc["content"];
                this.validator.autoValidate(documentContent).then(validationErrors => {
                    resolve(validationErrors);
                })
            }).catch(NoUuidError,(err) => {
                console.info("Document at " + callbackLink + " has no uuid, ignoring...");
                reject(err);
            }).catch(err => {
                console.error("Error validating document with callback link " + callbackLink);
                reject(err);
            })
        });

    }
}

module.exports = DocumentUpdateHandler;
