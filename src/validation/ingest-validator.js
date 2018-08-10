/**
 * Created by rolando on 08/08/2018.
 */
const Promise = require('bluebird');
const NoDescribedBy = require('ingest-validation-exceptions').NoDescribedBy;

/**
 *
 * Wraps the generic validator, outputs errors in custom format.
 * Assumes documents have a describedBy
 *
 */
class IngestValidator {
    constructor(validator, ingestClient) {
        this.validator = validator;
        this.ingestClient = ingestClient
    }

    validate(documentContent) {
        if(! documentContent["describedBy"]) {
            return Promise.reject(new NoDescribedBy("describedBy is a required field"));
        } else {
            let schemaUri = documentContent["describedBy"];

            return this.ingestClient.fetchSchema(schemaUri)
                .then(schema => {return this.insertSchemaId(schema)})
                .then(schema => {return this.validator.validateSingleSchema(schema, documentContent)})
                .then(valErrors => {return this.parseValidationErrors(valErrors)});
        }
    }

    insertSchemaId(schema) {
        schema["$id"] = schema["id"]
        return Promise.resolve(schema);
    }

    parseValidationErrors(errors){
        // TODO: return errors how we want them
    }
}