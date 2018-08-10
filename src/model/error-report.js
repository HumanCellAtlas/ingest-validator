/**
 * Created by rolando on 07/08/2018.
 */

class ErrorReport {
    constructor(ajvError=null) {
        this.ajvError = ajvError;
        this.message = null;
        this.absoluteDataPath = null;
        this.userFriendlyMessage = null;

        if(ajvError) {
            this.constructWithAjvError(this.ajvError);
        }
    }

    constructUserFriendlyMessage() {
        if(!this.absoluteDataPath) {
            throw new Error("Can't construct a user friendly message: absoluteDataPath of error not set");
        } else if(!this.message) {
            throw new Error("Can't construct a user friendly message: error message not set");
        } else {
            this.userFriendlyMessage = message + " at " + this.absoluteDataPath;
        }
    }

    constructWithAjvError(ajvError) {
        this.absoluteDataPath = ajvError.dataPath;
        this.message = ajvError.message;

        this.constructUserFriendlyMessage();
    }
}