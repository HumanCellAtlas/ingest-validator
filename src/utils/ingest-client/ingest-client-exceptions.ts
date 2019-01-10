/**
 * Created by rolando on 06/08/2018.
 */

class NoUuidError extends Error {}
class RetryableError extends Error {}
class NotRetryableError extends Error {}
class AlreadyInStateError extends NotRetryableError {}

module.exports = {
    "NoUuidError" : NoUuidError,
    "RetryableError": RetryableError,
    "NotRetryableError": NotRetryableError
};