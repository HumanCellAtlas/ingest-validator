/**
 * Created by rolando on 07/08/2018.
 */
import ErrorReport from "./error-report";
import {ValidationJob} from "../common/types";

class ValidationReport {
    validationState: string;
    validationErrors: ErrorReport[];
    validationJob?: ValidationJob;

    constructor(validationState: string, validationErrors: ErrorReport[]) {
        this.validationState = validationState;
        this.validationErrors = validationErrors;
    }

    static okReport(): ValidationReport {
        return new ValidationReport("VALID", []);
    }

    static validatingReport(): ValidationReport {
        return new ValidationReport("VALIDATING", []);
    }

    setValidationJob(job: ValidationJob): void {
        this.validationJob = job;
        this.validationJob.validationReport = this;
    }
}

export default ValidationReport;