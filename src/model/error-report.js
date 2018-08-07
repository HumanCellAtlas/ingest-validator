/**
 * Created by rolando on 07/08/2018.
 */

class ErrorReport{
    constructor(userFriendlyMessage="") {
        this._userFriendlyMessage = userFriendlyMessage;
    }

    get userFriendlyMessage() {
        return this._userFriendlyMessage;
    }

    set userFriendlyMessage(value) {
        this._userFriendlyMessage = value;
    }
}