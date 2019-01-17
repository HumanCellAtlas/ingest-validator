/**
 * Created by rolando on 06/08/2018.
 */
import IHandler from "./handler";
import IngestClient from "../../utils/ingest-client/ingest-client";
import ValidationReport from "../../model/validation-report";

class FileValidationHandler implements IHandler{
    ingestClient: IngestClient;

    constructor(ingestClient: IngestClient) {
        this.ingestClient = ingestClient;
    }

    async handle(msg: string) {
        let msgContent = null;
        try {
            msgContent = JSON.parse(msg);
        } catch (err) {
            console.error("Failed to parse message content (ignoring): " + msg);
            return;
        }
        const validationJobId = msgContent['validation_id'];

        let validationOutput = null;
        try {
            validationOutput = JSON.parse(msgContent['stdout']);
        } catch (err) {
            console.error("Failed to JSON parse stdout in validation message (ignoring): " + msg);
            return;
        }

        const validationState = validationOutput['validation_state'];
        const validationErrors = validationOutput['validation_errors'];

        const validationReport = new ValidationReport(validationState, validationErrors);

        try {
            // TODO: extra GET request here could be cut out
            const fileDocument = await this.ingestClient.findFileByValidationId(validationJobId);
            const documentUrl = this.ingestClient.selfLinkForResource(fileDocument);
            await this.ingestClient.postValidationReport(documentUrl, validationReport);
        } catch(err) {
            console.error(err);
        }

    }
}

export default FileValidationHandler;