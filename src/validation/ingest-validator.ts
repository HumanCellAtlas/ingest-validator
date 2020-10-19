/**
 * Created by rolando on 08/08/2018.
 */
import ValidationReport from "../model/validation-report";

import Promise from "bluebird";
import IngestClient from "../utils/ingest-client/ingest-client";
import {ErrorObject} from "ajv";
import SchemaValidator from "./schema-validator";
import ErrorReport from "../model/error-report";
import {NoDescribedBy, SchemaRetrievalError} from "./ingest-validation-exceptions";
import R from "ramda";

/**
 *
 * Wraps the generic validator, outputs errors in custom format.
 * Assumes documents have a describedBy
 *
 */
class IngestValidator {
    schemaValidator: SchemaValidator;
    ingestClient: IngestClient;
    schemaCache: any;

    constructor(schemaValidator: SchemaValidator, ingestClient: IngestClient) {
        this.schemaValidator = schemaValidator;
        this.ingestClient = ingestClient;
        this.schemaCache = {};
    }

    validate(document: any, documentType: string) : Promise<ValidationReport> {
        const documentContent = document["content"];
        if(! documentContent["describedBy"]) {
            return Promise.reject(new NoDescribedBy("describedBy is a required field"));
        } else {
            let schemaUri = documentContent["describedBy"];

            return this.getSchema(schemaUri)
                .then(schema => {return IngestValidator.insertSchemaId(schema)})
                .then(schema => {return this.schemaValidator.validateSingleSchema(schema, documentContent)})
                .then(valErrors => {return IngestValidator.parseValidationErrors(valErrors)})
                .then(parsedErrors => {return IngestValidator.generateValidationReport(parsedErrors)})
                .catch(SchemaRetrievalError, err => {
                    const errReport = new ErrorReport(`Failed to retrieve schema at ${schemaUri}`);
                    return Promise.resolve(ValidationReport.invalidReport([errReport]));
                })
        }
    }

    getSchema(schemaUri: string): Promise<string> {
        if(! this.schemaCache[schemaUri]) {
            return new Promise((resolve, reject) => {
                this.ingestClient.fetchSchema(schemaUri)
                    .then(schema => {
                        this.schemaCache[schemaUri] = schema;
                        resolve(schema);
                    })
                    .catch(err => {
                        reject(new SchemaRetrievalError(err));
                    })
            });
        } else {
            return Promise.resolve(this.schemaCache[schemaUri]);
        }
    }

    static insertSchemaId(schema: any) : Promise<any> {
        if(schema["id"]) {
            schema["$id"] = schema["id"];
        }
        return Promise.resolve(schema);
    }

    /**
     * Ingest error reports from ajvError objects
     * @param errors
     */
    static parseValidationErrors(errors: ErrorObject[]) : Promise<ErrorReport[]> {
        return Promise.resolve(R.map((ajvErr: ErrorObject) => ErrorReport.constructWithAjvError(ajvErr), errors));
    }

    static generateValidationReport(errors: ErrorReport[]) : Promise<ValidationReport> {
        let report = null;

        if(errors.length > 0) {
            report = new ValidationReport("INVALID", errors);
        } else {
            report =  ValidationReport.okReport();
        }

        return Promise.resolve(report);
    }

}

export default IngestValidator;
