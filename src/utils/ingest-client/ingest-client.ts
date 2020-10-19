/**
 * Created by rolando on 01/08/2018.
 */
import config from "config";
import request from "request-promise";
import R from "ramda";
import Promise from "bluebird";
import {
    NoUuidError,
    NoContentError,
    NotRetryableError,
    LinkNotFoundOnResource,
    AlreadyInStateError,
    EntityNotFoundError
} from "./ingest-client-exceptions";
import {FileChecksums, IngestConnectionProperties, ValidationJob} from "../../common/types";
import ValidationReport from "../../model/validation-report";
import {StatusCodeError} from "request-promise/errors";
import {RejectMessageException} from "../../listener/messging-exceptions";
import {Client} from "../client";


request.defaults({
    family: 4,
    pool: {
        maxSockets: config.get("INGEST_API.maxConnections")
    }
});


class IngestClient extends Client {

    constructor(connectionConfig: IngestConnectionProperties) {
        const ingestUrl = `${connectionConfig.scheme}://${connectionConfig.host}:${connectionConfig.port}`;
        super(ingestUrl);
    }

    retrieve(entityUrl: string) : Promise<any>{
        return new Promise((resolve, reject) => {
            request({
                method: "GET",
                url: entityUrl,
                json: true
            }).then(resp => {
                resolve(resp);
            }).catch(err => {
                reject(err);
            });
        });
    }

    retrieveEmbeddedEntities(entityUrl: string, entityLink: string, entityType: string) : Promise<any[]> {
        return this.retrieve(entityUrl)
            .then(doc => {
                if(! IngestClient.pathExistsInDoc(["_links", entityLink], doc)) {
                    return Promise.reject(new LinkNotFoundOnResource(`Error: Resource at ${entityUrl} has no link "${entityLink}"`));
                } else {
                    return this.retrieve(doc["_links"][entityLink]["href"]).then(embeddedEntites => {
                        return Promise.resolve(embeddedEntites["_embedded"][entityType]);
                    });
                }
            })!
    }


    retrieveMetadataDocument(entityUrl: string) : Promise<any>{
        return this.retrieve(entityUrl);
    }

    /**
     *
     * Retrieves the metadata document, but throws a NoUuidError if the document has no uuid
     *
     * @param entityUrl
     * @returns {Promise} resolving to the metadata document JSON
     */
    getMetadataDocument(entityUrl: string): Promise<any> {
        return this.retrieveMetadataDocument(entityUrl).then((doc: any) => {
            if(!(doc["uuid"] && doc["uuid"]["uuid"])) {
                return Promise.reject(new NoUuidError("document at " + entityUrl + "has no UUID"));
            }
            if(!doc['content']) {
                return Promise.reject(new NoContentError())
            }
            return Promise.resolve(doc)
        })
    }

    transitionDocumentState(...args: any[]) : Promise<any> {
        return this.retry(5, this._transitionDocumentState.bind(this), args, "Retrying transitionDocumentState()")
    }

    _transitionDocumentState(entityUrl: string, validationState: string) : Promise<any> {
        return new Promise((resolve, reject) => {
            this.retrieveMetadataDocument(entityUrl).then((doc: any) => {
                    if(doc['validationState'].toUpperCase() === validationState.toUpperCase()) {
                        reject(new AlreadyInStateError("Failed to transition document; document was already in the target state"));
                    } else {
                        if(doc["_links"][validationState.toLowerCase()]) {
                            request({
                                method: "PUT",
                                url: doc["_links"][validationState.toLowerCase()]["href"],
                                body: {},
                                json: true
                            }).then(resp => {
                                resolve(resp);
                            }).catch(err => {
                                reject(err);
                            });
                        } else {
                            reject(new NotRetryableError(`Failed to transition document; document in state ${doc['validationState']} cannot enter state ${validationState}`));
                        }
                    }
                }).catch(err => {
                    reject(err);
            });
        });
    }

    setValidationErrors(...args: any[]) {
        return this.retry(5, this._setValidationErrors.bind(this), args, "Retrying setValidationErrors()")
    }

    _setValidationErrors(entityUrl: string, validationErrors: any[]) {
        const patchPayload = {
            "validationErrors" : validationErrors
        };

        return new Promise((resolve, reject) => {
            request({
                method: "PATCH",
                url: entityUrl,
                json: true,
                body: patchPayload
            }).then(resp => {
                resolve(resp);
            }).catch(err =>{
                reject(err);
            });
        });
    }

    findFileByValidationId(validationId: string) {
        // TODO: determine search endpoint by following rels; cache the result
        const findByValidationUrl = `${this.clientBaseUrl}/files/search/findByValidationJobValidationId?validationId=${validationId}`;

        return request({
                method: "GET",
                url: findByValidationUrl,
                json: true
        });
    }

    postValidationReport(entityUrl: string, validationReport: ValidationReport) : Promise<any>{
        if(! validationReport || ! validationReport.validationState) {
            console.info("Broken validation report");
        }

        if(validationReport.validationState.toUpperCase() === 'VALID') {
            console.info(`Posting a valid report for document ${entityUrl}`);
        }

        return  this.transitionDocumentState(entityUrl, validationReport.validationState)
                    .then(() => { return this.setValidationErrorsAndJob(entityUrl, validationReport)})
                    .catch(AlreadyInStateError, err => { return this.setValidationErrorsAndJob(entityUrl, validationReport)});
    }

    setValidationErrorsAndJob(entityUrl: string, validationReport: ValidationReport) : Promise<any> {
        return this.setValidationErrors(entityUrl, validationReport.validationErrors).then((resp: any) => {
            if(validationReport.validationJob) {
                return Promise.resolve(this.reportValidationJob(entityUrl, validationReport.validationJob));
            } else {
                return Promise.resolve(resp);
            }
        });
    }

    fetchSchema(schemaUrl: string) : Promise<any> {
        return new Promise<any>((resolve, reject) => {
            request({
                method: "GET",
                url: schemaUrl,
                json: true,
            })
                .then(resp => resolve(resp))
                .catch(err => reject(err));
        });
    }

    urlForCallbackLink(entityCallback: string) {
        return this.clientBaseUrl + entityCallback;
    }

    selfLinkForResource(resource: any): string {
        return resource["_links"]["self"]["href"];
    }

    envelopeLinkForResource(resource: any) {
        return resource["_links"]["submissionEnvelope"]["href"];
    }

    /**
     * gets envelopes associated with this metadata document
     * @param metadataDocument
     */
    envelopeForMetadataDocument(metadataDocument: any) : Promise<any> {
        return new Promise((resolve, reject) => {
            request({
                method: "GET",
                url: this.envelopeLinkForResource(metadataDocument),
                json: true,
            }).then(resp => {
                // envelopes are embedded entities
                resolve(resp);
            }).catch(err => {
                reject(err);
            });
        });
    }

    reportValidationJob(fileDocumentUrl: string, validationJob: ValidationJob) {
        this.retry(5, this._reportValidationJob.bind(this), [fileDocumentUrl, validationJob], "Retrying reportValidationJob()")
    }

    _reportValidationJob(fileDocumentUrl: string, validationJob: ValidationJob) {
        return request({
            method: "PATCH",
            url: fileDocumentUrl,
            body: {
                "validationJob": validationJob
            },
            json: true
        }).catch(StatusCodeError, error => {
            if(error.statusCode == 409) {
                return Promise.reject(new RejectMessageException())
            } else {
                return Promise.reject(error);
            }
        });
    }

    getFileChecksums(fileDocumentUrl: string) : Promise<FileChecksums> {
        return this
            .retrieveMetadataDocument(fileDocumentUrl)
            .then(fileResource => {return Promise.resolve(fileResource["checksums"] as FileChecksums)});
    }

    getValidationJob(fileDocumentUrl: string) : Promise<ValidationJob> {
        return this
            .retrieveMetadataDocument(fileDocumentUrl)
            .then(fileResource => {return Promise.resolve(fileResource["validationJob"] as ValidationJob)});
    }

    static pathExistsInDoc(path: string[], doc: any) : boolean {
        return !!R.path(path, doc);
    }
}

export default IngestClient;