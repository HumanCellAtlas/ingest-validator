/**
 * Created by rolando on 06/08/2018.
 */

class NoUuidError extends Error {
    constructor(...args) {
        super(...args);
    }
}

module.exports = {
    "NoUuidError" : NoUuidError
};