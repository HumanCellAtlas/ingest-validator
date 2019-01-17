/**
 * Created by rolando on 07/08/2018.
 */
import ErrorReport from "./error-report";

class ValidationReport {
    validationState: string;
    validationErrors: ErrorReport[];
    validationJobId?: string;

    constructor(validationState: string, validationErrors: ErrorReport[], validationJobId?: string) {
        this.validationState = validationState;
        this.validationErrors = validationErrors;
        this.validationJobId = validationJobId;
    }

    static okReport(): ValidationReport {
        return new ValidationReport("VALID", [],);
    }

    static validatingReport(): ValidationReport {
        return new ValidationReport("VALIDATING", []);
    }
}

export default ValidationReport;