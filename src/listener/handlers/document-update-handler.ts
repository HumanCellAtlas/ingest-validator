/**
 * Created by rolando on 02/08/2018.
 */
import IngestValidator from "../../validation/ingest-validator";
import IngestClient from "../../utils/ingest-client/ingest-client";
import IHandler from "./handler";
import Promise from "bluebird";
import {NoCloudUrl, NoFileMetadata, NotEligibleForValidation} from "../../validation/ingest-validation-exceptions";
import {NoUuidError} from "../../utils/ingest-client/ingest-client-exceptions";
import ValidationReport from "../../model/validation-report";

class DocumentUpdateHandler implements IHandler {
    validator: IngestValidator;
    ingestClient: IngestClient;

    constructor(validator: IngestValidator, ingestClient: IngestClient) {
        this.validator = validator;
        this.ingestClient = ingestClient;
    }

    handle(msg: string) : Promise<boolean>{
        const msgJson = JSON.parse(msg);

        const callbackLink = msgJson['callbackLink'];
        const documentUrl = this.ingestClient.urlForCallbackLink(callbackLink);
        const documentType = msgJson['documentType'].toUpperCase();

        const handlePromise: Promise<void> = new Promise<void>((resolve, reject) => {
            this.ingestClient.getMetadataDocument(documentUrl)
                .then(doc => {return DocumentUpdateHandler.checkElegibleForValidation(doc)})
                .then(doc => {return this.checkEligibleForFileValidation(doc, documentType)})
                .then(doc => {return this.signalValidationStarted(doc)})
                .then(doc => {return this.validator.validate(doc, documentType)})
                .then(validationReport => {return this.ingestClient.postValidationReport(documentUrl, validationReport)})
                .then(resp => resolve(resp))
                .catch(NotEligibleForValidation, err => console.info("Document at " + documentUrl + " not eligible for validation, ignoring.."))
                .catch(NoCloudUrl, err => console.info("File document at " + documentUrl + " has no cloudUrl, ignoring.."))
                .catch(NoFileMetadata, err => console.info("File document at " + documentUrl + " has no metadata, ignoring.."))
                .catch(NoUuidError, err => console.info("Document at " + documentUrl + " has no uuid, ignoring..."))
                .catch(err => reject(err));
        });

        return handlePromise.then(() => {return Promise.resolve(true)}).catch(() => {return Promise.resolve(false)});
    }

    /**
     * check if the document is a File and if so does an existence check for an assigned cloudUrl.
     * returns/resolves the document in question if it passes the check, else throws/rejects-with an exception
     *
     * @param document
     * @param documentType
     */
    checkEligibleForFileValidation(document: any, documentType: string) : Promise<any> {
        return new Promise((resolve, reject) => {
            if(documentType === 'FILE'){
               if(!document['cloudUrl']) {
                   reject(new NoCloudUrl());
               } else if(!document['content']) {
                   reject (new NoFileMetadata())
               } else {
                   resolve(document);
               }
            } else {
                resolve(document);
            }
        });
    }

    /**
     *
     * Eligible if document is in DRAFT
     *
     * @param document
     * @param documentType
     */
    static checkElegibleForValidation(document: any) : Promise<any>{
        if(document['validationState'].toUpperCase() === 'DRAFT') {
            return Promise.resolve(document);
        } else {
            return Promise.reject(new NotEligibleForValidation());
        }
    }

    signalValidationStarted(document: any) : Promise<any> {
        const documentUrl = this.ingestClient.selfLinkForResource(document);
        return this.ingestClient.postValidationReport(documentUrl, ValidationReport.validatingReport());
    }
}

export default DocumentUpdateHandler;