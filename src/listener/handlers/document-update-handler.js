/**
 * Created by rolando on 02/08/2018.
 */

class DocumentUpdateHandler {
    constructor(validator, ingestClient) {
        this.validator = validator;
        this.ingestClient = ingestClient;
    }

    handle(msg) {
        let callbackLink = JSON.parse(msg.content)['callbackLink'];
        // TODO; retrieve the document and maybe validate it
    }
}

module.exports = DocumentUpdateHandler;
