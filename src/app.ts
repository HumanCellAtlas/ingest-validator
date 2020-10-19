/**
 * Created by rolando on 02/08/2018.
 */
import config from "config";
import IngestClient from "./utils/ingest-client/ingest-client";
import DocumentUpdateListener from "./listener/document-update-listener";
import FileValidationHandler from "./listener/handlers/file-validation-handler";
import FileValidationListener from "./listener/file-validation-listener";
import IngestFileValidator from "./utils/ingest-client/ingest-file-validator";
import {
    FileValidationImage,
    IngestConnectionProperties,
    RabbitConnectionProperties,
    RabbitMessagingProperties,
    UploadApiConnectionProperties
} from "./common/types";
import R from "ramda";
import IngestValidator from "./validation/ingest-validator";
import DocumentUpdateHandler from "./listener/handlers/document-update-handler";
import SchemaValidator from "./validation/schema-validator";
import GraphRestriction from "./custom/graph-restriction";
import UploadClient from "./utils/upload-client/upload-client";
/** Pre-setup: Configuring HTTP agents and DNS caching **/

const dnscache = require('dnscache')({
    "enable" : true,
    "ttl" : 300,
    "cachesize" : 1000
});

/** ------------------------------- **/

const schemaValidator = (() => {
    const ontologyValidatorKeyword = new GraphRestriction("graph_restriction");
    return new SchemaValidator([ontologyValidatorKeyword]);
})();

const ingestClient = (() => {
    const ingestConnectionConfig = config.get("INGEST_API.connection") as IngestConnectionProperties;
    return new IngestClient(ingestConnectionConfig);
})();

const uploadClient = (() => {
    const uploadApiConnectionProperties = config.get("UPLOAD_API.connection") as UploadApiConnectionProperties;
    const apiKey = config.get("UPLOAD_API.apiKey") as string;
    return new UploadClient(uploadApiConnectionProperties, apiKey);
})();

const ingestFileValidator = (() => {
    const validationImageConfigs = Object.entries(config.get("FILE_VALIDATION_IMAGES"));
    const validationImages: FileValidationImage[] = R.map((configEntry: any[]) => { return {fileFormat: configEntry[0], imageUrl: configEntry[1]}}, validationImageConfigs);
    return new IngestFileValidator(uploadClient, validationImages, ingestClient);
})();

const ingestValidator = (() => {
    return new IngestValidator(schemaValidator, ingestClient);
})();

const documentUpdateListener = (() => {
    const handler = new DocumentUpdateHandler(ingestValidator, ingestFileValidator, ingestClient);

    const rabbitConnectionConfig = config.get("AMQP.metadataValidation.connection") as RabbitConnectionProperties;
    const rabbitMessagingConfig = config.get("AMQP.metadataValidation.messaging") as RabbitMessagingProperties;

    return new DocumentUpdateListener(rabbitConnectionConfig, rabbitMessagingConfig, handler);
})();


const fileValidationListener = (() => {
    const handler = new FileValidationHandler(ingestClient);

    const rabbitConnectionConfig = config.get("AMQP.fileValidationResults.connection") as RabbitConnectionProperties;
    const rabbitMessagingConfig = config.get("AMQP.fileValidationResults.messaging") as RabbitMessagingProperties;

    return new FileValidationListener(rabbitConnectionConfig, rabbitMessagingConfig, handler);
})();


function begin() {
    documentUpdateListener.start();
    fileValidationListener.start();
}

begin();