/**
 * Created by rolando on 06/08/2018.
 */
import IHandler from "./handler";
import IngestClient from "../../utils/ingest-client/ingest-client";
import ValidationReport from "../../model/validation-report";
import {ValidationJob} from "../../common/types";
import Promise from "bluebird";
import {RejectMessageException} from "../messging-exceptions";
import {StatusCodeError} from "request-promise/errors";
import ErrorReport from "../../model/error-report";
import {ErrorObject} from "ajv";

class FileValidationHandler implements IHandler{
    ingestClient: IngestClient;

    constructor(ingestClient: IngestClient) {
        this.ingestClient = ingestClient;
    }

    // msg contains fileValidationResult from Upload srv
    handle(msg: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let msgContent: any = null;
            try {
                msgContent = JSON.parse(msg);
            } catch (err) {
                console.error("Failed to parse message content (ignoring): " + msg);
                resolve(true);
            }
            const validationJobId = msgContent['validation_id'];

            let validationReport: ValidationReport;
            try {
                let validationOutput = JSON.parse(msgContent['stdout']);
                const validationState = validationOutput['validation_state'];
                const validationErrors = validationOutput['validation_errors'];

                validationReport = new ValidationReport(validationState, validationErrors);
            } catch (err) {
                console.error("Failed to JSON parse stdout in validation message (ignoring): " + msg);
                let errReport = new ErrorReport();
                errReport.message = "Failed to JSON parse stdout from upload service";
                validationReport = new ValidationReport("INVALID", [errReport]);
            }

            // TODO: extra GET request here could be cut out

            this.ingestClient.findFileByValidationId(validationJobId).then(fileDocument => {
                const validationJob: ValidationJob = fileDocument["validationJob"];
                validationJob.jobCompleted = true;
                validationReport.setValidationJob(validationJob); // moved cyclic ref in class

                const documentUrl = this.ingestClient.selfLinkForResource(fileDocument);
                this.ingestClient.postValidationReport(documentUrl, validationReport).then(() => {
                    resolve(true);
                }).catch(error => {
                    console.error(error);
                    resolve(false);
                });
            }).catch(StatusCodeError, err => {
                if(err.statusCode >= 400 && err.statusCode < 500) {
                    console.error(err);
                    console.error(`Rejecting message: ${JSON.stringify(msgContent)}`);
                    reject(new RejectMessageException());
                }
                resolve(false);
            });
        });
    }
}

export default FileValidationHandler;