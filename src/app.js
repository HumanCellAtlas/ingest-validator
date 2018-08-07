/**
 * Created by rolando on 02/08/2018.
 */
const config = require('config');

const DocumentUpdateListener = require('./listener/document-update-listener');
const DocumentUpdateHandler = require('./listener/handlers/document-update-handler');

const FileValidationListener = require('./listener/file-validation-listener');
const FileValidationHandler = require('./listener/handlers/file-validation-handler');

const Validator = require('./validation/validator');
const IngestClient = require('./utils/ingest-client/ingest-client');

const validator = Validator;

const ingestClient = (() => {
    const ingestConnectionConfig = config.get("INGEST_API.connection");
    return new IngestClient(ingestConnectionConfig);
})();


const documentUpdateListener = (() => {
    const handler = new DocumentUpdateHandler(validator, ingestClient);

    const rabbitConnectionConfig = config.get("AMQP.metadataValidation.connection");
    const rabbitMessagingConfig = config.get("AMQP.metadataValidation.messaging");

    const exchange = rabbitMessagingConfig["exchange"];
    const queue = rabbitMessagingConfig["queueName"];
    const exchangeType = rabbitConnectionConfig["exchangeType"];

    return new DocumentUpdateListener(rabbitConnectionConfig, exchange, queue, handler, exchangeType);
})();

const fileValidationListener = (() => {
    const handler = new FileValidationHandler(ingestClient);

    const rabbitConnectionConfig = config.get("AMQP.fileValidationResults.connection");
    const rabbitMessagingConfig = config.get("AMQP.fileValidationResults.messaging");


    const exchange = rabbitMessagingConfig["exchange"];
    const queue = rabbitMessagingConfig["queueName"];
    const exchangeType = rabbitConnectionConfig["exchangeType"];

    return new FileValidationListener(rabbitConnectionConfig, exchange, queue, handler, exchangeType);
})();


(function(){
    documentUpdateListener.start();
    fileValidationListener.start();
})();