/**
 * Created by rolando on 07/08/2018.
 */

class ValidationReport {
    constructor(validationState, validationErrors) {
        this._validationState = validationState;
        this._validationErrors = validationErrors;
    }

    get validationErrors() {
        return this._validationErrors;
    }

    set validationErrors(value) {
        this._validationErrors = value;
    }

    get validationState() {
        return this._validationState;
    }

    set validationState(value) {
        this._validationState = value;
    }
}