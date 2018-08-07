/**
 * Created by rolando on 06/08/2018.
 */

const Promise = require('bluebird');

class FileValidationHandler {
    constructor(ingestClient) {
        this.ingestClient = ingestClient;
    }

    async handle(msg) {
        const msgContent =JSON.parse(msg.content);

        const validationJobId = msgContent['validation_id'];
        const validationState = msgContent['validation_state'];
        const validationErrors = msgContent['validation_errors'];

        try {
            const fileDocument = await this.ingestClient.findFileByValidationId(validationJobId);
            await this.ingestClient.transitionDocumentState(fileDocument, validationState);
            const documentUrl = this.ingestClient.selfLinkForResource(fileDocument);
            await this.ingestClient.setValidationErrors(documentUrl, validationErrors);
        } catch(err) {
            console.error(err);
        }

    }
}

module.exports = FileValidationHandler;