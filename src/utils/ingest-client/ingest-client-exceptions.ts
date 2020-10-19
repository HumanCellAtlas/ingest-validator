/**
 * Created by rolando on 06/08/2018.
 */

namespace ingestClientExceptions {
    export class NoUuidError extends Error {}
    export class NoContentError extends Error {}
    export class RetryableError extends Error {}
    export class NotRetryableError extends Error {}
    export class AlreadyInStateError extends NotRetryableError {}
    export class LinkNotFoundOnResource extends Error {}
    export class FileAlreadyValidatedError extends Error {}
    export class FileCurrentlyValidatingError extends Error {}
    export class EntityNotFoundError extends Error {}

}

export = ingestClientExceptions;