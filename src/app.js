/**
 * Created by rolando on 02/08/2018.
 */
const config = require('config');
const DocumentUpdateListener = require('./listener/document-update-listener');
const DocumentUpdateHandler = require('./listener/handlers/document-update-handler');
const Validator = require('./validation/validator');

const validator = Validator;
const ingestClient = null; // TODO; implement

const documentUpdateListener = (function(){
    const handler = new DocumentUpdateHandler(validator, ingestClient);

    const rabbitConnectionConfig = config.get("AMQP.metadataValidation.connection");
    const rabbitMessagingConfig = config.get("AMQP.metadataValidation.messaging");

    const exchange = rabbitMessagingConfig["exchange"];
    const queue = rabbitMessagingConfig["queueName"];

    return new DocumentUpdateListener(rabbitConnectionConfig, exchange, queue, handler);
})();


(function(){
    documentUpdateListener.start();
})();