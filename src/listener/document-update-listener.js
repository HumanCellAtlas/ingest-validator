/**
 * Created by rolando on 01/08/2018.
 */
const Listener = require('./listener');
const Validator = require('../validation/validator');

class Handler {
    constructor(validator, ingestClient) {
        this.validator = validator;
        this.ingestClient = ingestClient;
    }

    handle(msg) {
        let callbackLink = JSON.parse(msg.content)['callbackLink'];
        // TODO; retrieve the document and maybe validate it
    }
}

class DocumentUpdateListener {
    constructor(rabbitUrl, exchange, queue) {
        this.rabbitUrl = rabbitUrl;
        this.exchange = exchange;
        this.queue = queue;
        this.handler = new Handler(Validator, null); // TODO; give the a handler an ingestClient
        this.listener = new Listener(rabbitUrl, exchange, queue);
        this.listener.setHandler(this.handler);
    }

    start(){
        this.listener.start();
    }
}

module.exports = DocumentUpdateListener;