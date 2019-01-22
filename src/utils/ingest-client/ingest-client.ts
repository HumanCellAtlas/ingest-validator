/**
 * Created by rolando on 01/08/2018.
 */
import config from "config";
import request from "request-promise";
import R from "ramda";

request.defaults({
    family: 4,
    pool: {
        maxSockets: config.get("INGEST_API.maxConnections")
    }
});

import Promise from "bluebird";


import {NoUuidError, NotRetryableError, RetryableError, LinkNotFoundOnResource} from "./ingest-client-exceptions";
import {IngestConnectionProperties} from "../../common/types";
import ValidationReport from "../../model/validation-report";

class IngestClient {
    ingestUrl: string;
    constructor(connectionConfig: IngestConnectionProperties) {
        this.ingestUrl = `${connectionConfig.scheme}://${connectionConfig.host}:${connectionConfig.port}`;
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
        return new Promise<any[]>((resolve, reject) => {
            this.retrieve(entityUrl)
                .then(doc => {
                    if(! IngestClient.pathExistsInDoc(["_links", entityLink], doc)) {
                        throw new LinkNotFoundOnResource(`Error: Resource at ${entityUrl} has no link "${entityLink}"`);
                    } else {
                        this.retrieve(doc["_links"][entityLink]["href"]).then(embeddedEntites => {
                            resolve(embeddedEntites["_embedded"][entityType]);
                        });
                    }
                })
        });
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
    getMetadataDocument(entityUrl: string) {
        return new Promise((resolve, reject) => {
            this.retrieveMetadataDocument(entityUrl).then((doc: any) => {
                if(doc["uuid"] && doc["uuid"]["uuid"]) {
                    resolve(doc);
                } else {
                    throw new NoUuidError("document at " + entityUrl + "has no UUID");
                }
            }).catch(NoUuidError, (err) => {
                reject(err);
            })
        });
    }

    transitionDocumentState(...args: any[]) : Promise<any> {
        return this.retry(5, this._transitionDocumentState.bind(this), args, "Retrying transitionDocumentState()")
    }

    _transitionDocumentState(entityUrl: string, validationState: string) : Promise<any> {
        return new Promise((resolve, reject) => {
            this.retrieveMetadataDocument(entityUrl).then((doc: any) => {
                    if(doc['validationState'].toUpperCase() === validationState.toUpperCase()) {
                        reject(new NotRetryableError("Failed to transition document; document was already in the target state"));
                    } else {
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
        const findByValidationUrl = this.ingestUrl + "/files/search/findByValidationId?validationId=" + validationId;

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
            console.info("posting a valid report")
        }

        return new Promise<any>((resolve, reject) => {
            this.transitionDocumentState(entityUrl, validationReport.validationState).then(() => {
                this.setValidationErrors(entityUrl, validationReport.validationErrors).then((resp: any) => {
                    if(validationReport.validationJobId) {
                        resolve(this.reportValidationJobId(entityUrl, validationReport.validationJobId));
                    } else {
                        resolve(resp);
                    }
                }).catch(err => {
                    console.info("here now");
                    reject(err);
                });
            }).catch(err => {
                console.info("here now");
                reject(err);
            });
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
        return this.ingestUrl + entityCallback;
    }

    selfLinkForResource(resource: any) {
        return resource["_links"]["self"]["href"];
    }

    envelopesLinkForResource(resource: any) {
        return resource["_links"]["submissionEnvelopes"]["href"];
    }

    /**
     * gets envelopes associated with this metadata document
     * @param metadataDocument
     */
    envelopesForMetadataDocument(metadataDocument: any) : Promise<any[]> {
        return new Promise((resolve, reject) => {
            request({
                method: "GET",
                url: this.envelopesLinkForResource(metadataDocument),
                json: true,
            }).then(resp => {
                // envelopes are embedded entities
                resolve(resp['_embedded']['submissionEnvelopes']);
            }).catch(err => {
                reject(err);
            });
        });
    }

    reportValidationJobId(fileDocumentUrl: string, validationJobId: string) {
        return request({
            method: "PATCH",
            url: fileDocumentUrl,
            body: {
                "validationId": validationJobId
            },
            json: true
        });
    }

    retry(maxRetries: number, func: Function, args: any[], retryMessage: string) {
        return this._retry(0, maxRetries, null, func, args, retryMessage);
    }

    _retry(attemptsSoFar: number, maxRetries: number, prevErr: Error|null, func: Function, args: any[], retryMessage: string) {
        if(attemptsSoFar === maxRetries) {
            return Promise.reject(prevErr);
        } else {
            const boundFunc = func.bind(this);
            return Promise.delay(50).then(() => {
                return boundFunc.apply(null, args)
                    .then( (allGood: any) => {return Promise.resolve(allGood)})
                    .catch(NotRetryableError, (err: NotRetryableError) => {
                        return Promise.reject(err);
                    })
                    .catch( (err: Error) => {
                        const incAttempts = attemptsSoFar + 1;
                        console.info(retryMessage + " :: Attempt # " + incAttempts + " out of " + maxRetries);
                        return this._retry(attemptsSoFar + 1, maxRetries, err, func, args, retryMessage);
                    });
            });
        }
    }

    static pathExistsInDoc(path: string[], doc: any) : boolean {
        return !!R.path(path, doc);
    }
}

export default IngestClient;