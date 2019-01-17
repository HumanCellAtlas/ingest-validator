/**
 * Created by rolando on 10/08/2018.
 */
namespace ingestValidatorExceptions {
    export class NoDescribedBy extends Error {}
    export class NoFileValidationJob extends Error {}
    export class NoCloudUrl extends Error {}
    export class NotEligibleForValidation extends Error {}

}

export = ingestValidatorExceptions;