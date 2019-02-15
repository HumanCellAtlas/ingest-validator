/**
 * Created by rolando on 06/08/2018.
 */
import IHandler from "./handler";
import IngestClient from "../../utils/ingest-client/ingest-client";
import ValidationReport from "../../model/validation-report";
import {ValidationJob} from "../../common/types";
import Promise from "bluebird";

class FileValidationHandler implements IHandler{
    ingestClient: IngestClient;

    constructor(ingestClient: IngestClient) {
        this.ingestClient = ingestClient;
    }

    handle(msg: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let msgContent = null;
            try {
                msgContent = JSON.parse(msg);
            } catch (err) {
                console.error("Failed to parse message content (ignoring): " + msg);
                resolve(true);
            }
            const validationJobId = msgContent['validation_id'];

            let validationOutput = null;
            try {
                validationOutput = JSON.parse(msgContent['stdout']);
            } catch (err) {
                console.error("Failed to JSON parse stdout in validation message (ignoring): " + msg);
                resolve(true);
            }

            const validationState = validationOutput['validation_state'];
            const validationErrors = validationOutput['validation_errors'];

            const validationReport = new ValidationReport(validationState, validationErrors);

            // TODO: extra GET request here could be cut out

            this.ingestClient.findFileByValidationId(validationJobId).then(fileDocument => {
                const validationJob: ValidationJob = fileDocument["validationJob"];
                validationJob.jobCompleted = true;
                validationReport.validationJob = validationJob;
                const documentUrl = this.ingestClient.selfLinkForResource(fileDocument);
                this.ingestClient.postValidationReport(documentUrl, validationReport).then(() => {
                    resolve(true);
                }).catch(error => {
                    console.error(error);
                    resolve(false);
                });
            });
        });
    }
}

export default FileValidationHandler;