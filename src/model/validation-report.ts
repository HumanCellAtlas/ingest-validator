/**
 * Created by rolando on 07/08/2018.
 */
import ErrorReport from "./error-report";
import {ValidationJob} from "../common/types";

class ValidationReport {
    validationState: string;
    validationErrors: ErrorReport[];
    validationJob?: ValidationJob;

    constructor(validationState: string, validationErrors: ErrorReport[], validationJob?: ValidationJob) {
        this.validationState = validationState;
        this.validationErrors = validationErrors;
        this.validationJob = validationJob;
    }

    static okReport(): ValidationReport {
        return new ValidationReport("VALID", []);
    }

    static validatingReport(): ValidationReport {
        return new ValidationReport("VALIDATING", []);
    }

    static invalidReport(validationErrors: ErrorReport[]): ValidationReport {
        return new ValidationReport("INVALID", validationErrors);
    }
}

export default ValidationReport;