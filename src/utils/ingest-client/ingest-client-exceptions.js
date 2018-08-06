/**
 * Created by rolando on 06/08/2018.
 */

function NoUuidError(message="") {
    this.message = message;
    this.name = "NoUuidError";
    Error.captureStackTrace(this, NoUuidError);
}
NoUuidError.prototype = Object.create(Error.prototype);
NoUuidError.prototype.constructor = NoUuidError;

module.exports = {
    "NoUuidError" : NoUuidError
};