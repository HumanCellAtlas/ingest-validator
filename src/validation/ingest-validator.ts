/**
 * Created by rolando on 08/08/2018.
 */
import ValidationReport from "../model/validation-report";

import Promise from "bluebird";
import IngestFileValidator from "../utils/ingest-client/ingest-file-validator";
import IngestClient from "../utils/ingest-client/ingest-client";
import {ErrorObject} from "ajv";
import SchemaValidator from "./schema-validator";
import ErrorReport from "../model/error-report";
import {NoDescribedBy, NoFileValidationImage} from "./ingest-validation-exceptions";
import R from "ramda";
import {FileAlreadyValidatedError, FileCurrentlyValidatingError} from "../utils/ingest-client/ingest-client-exceptions";
/**
 *
 * Wraps the generic validator, outputs errors in custom format.
 * Assumes documents have a describedBy
 *
 */
class IngestValidator {
    schemaValidator: SchemaValidator;
    fileValidator: IngestFileValidator;
    ingestClient: IngestClient;
    schemaCache: any;

    constructor(schemaValidator: SchemaValidator, fileValidator: IngestFileValidator, ingestClient: IngestClient) {
        this.schemaValidator = schemaValidator;
        this.fileValidator = fileValidator;
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
                .then(contentValidationReport => { return this.attemptFileValidation(contentValidationReport, document, documentType) })
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
                        reject(err);
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
        return Promise.resolve(R.map((ajvErr: ErrorObject) => new ErrorReport(ajvErr), errors));
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


    /**
     *
     * Only do file validation if schema validation passes for the resource and if
     * the resource is a file
     *
     * @param report
     * @param fileDocument
     * @param documentType
     *
     * @returns {Promise.<ValidationReport>}
     */
    attemptFileValidation(contentValidationReport: ValidationReport, fileDocument: any, documentType: string) : Promise<ValidationReport> {
        // proceed with data file validation if metadata doc validation passes
        if(documentType.toUpperCase() === 'FILE' && contentValidationReport.validationState.toUpperCase() == "VALID") {
            const fileName = fileDocument['fileName'];
            const fileFormat = IngestValidator.fileFormatFromFileName(fileName);

            // refresh document

            return new Promise((resolve, reject) => {
                const fileDocumentUrl = this.ingestClient.selfLinkForResource(fileDocument);
                this.ingestClient.retrieveMetadataDocument(fileDocumentUrl).then(doc => {
                    this.fileValidator.validateFile(fileDocument, fileFormat, fileName)
                        .then(validationJob => {
                            const fileValidatingReport = ValidationReport.validatingReport();
                            fileValidatingReport.validationJob = validationJob;
                            resolve(fileValidatingReport);
                        })
                        .catch(FileAlreadyValidatedError, err => {
                            console.info(`Request to validate File with name ${fileName} but it was already validated`);
                            resolve(contentValidationReport);
                        })
                        .catch(FileCurrentlyValidatingError, err => {
                            console.info(`Request to validate File with name ${fileName} but it's currently validating`);
                            resolve(ValidationReport.validatingReport());
                        })
                        .catch(NoFileValidationImage, err => {
                            console.info("No matching validation image for file with file name " + fileName);
                            resolve(contentValidationReport);
                        }).catch(err => {
                            console.error("ERROR: error requesting file validation job " + err);
                            reject(err);
                        });
                })
                    .catch( () => resolve(contentValidationReport));
            });
        } else {
            return Promise.resolve(contentValidationReport); // just return original report if not eligible for file validation
        }
    }

    /**
     *  returns file extension given a file name, e.g
     *  given aaaabbbcc.fastq, returns fastq
     *  given aaabbbccc.fastq.gz, returns fastq.gz
     *  given aaaabbbccc.fastq.tar.gz, returns fastq.tar.gz
     *
     * @param fileName
     */
    static fileFormatFromFileName(fileName: string): string {
        const ext: string = fileName.split(/[.](.+)/)[1];
        return ext ? ext : "";
    }
}

export default IngestValidator;