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

        const documentUrl = this.ingestClient.urlForCallbackLink(JSON.parse(msg.content)['callbackLink']);

        return new Promise((resolve, reject) => {
            this.ingestClient.getMetadataDocument(documentUrl).then(doc => {
                const documentContent = doc["content"];
                this.validator.autoValidate(documentContent).then(validationErrors => {
                    this.ingestClient.setValidationErrors(documentUrl, validationErrors).then(resp => {
                        console.info("Patched validation errors to document at " + documentUrl);
                        resolve(resp);
                    })
                }).catch(err => {
                    console.error("Error validating document with at " + documentUrl);
                    reject(err);
                })
            }).catch(NoUuidError, (err) => {
                console.info("Document at " + documentUrl + " has no uuid, ignoring...");
            }).catch(err => {
                console.error(err);
            });
        });
    }
}

module.exports = DocumentUpdateHandler;