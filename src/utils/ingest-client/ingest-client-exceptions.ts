/**
 * Created by rolando on 06/08/2018.
 */

namespace ingestClientExceptions {
    export class NoUuidError extends Error {}
    export class RetryableError extends Error {}
    export class NotRetryableError extends Error {}
    export class AlreadyInStateError extends NotRetryableError {}


}

export = ingestClientExceptions;