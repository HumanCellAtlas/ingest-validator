/**
 * Created by rolando on 07/08/2018.
 */
import {AdditionalPropertiesParams, EnumParams, ErrorObject} from "ajv";

class ErrorReport {
    ajvError? : ErrorObject;
    message?: string;
    absoluteDataPath?: string;
    userFriendlyMessage?: string;

    constructor(ajvError?: ErrorObject) {
        this.ajvError = ajvError;

        if(this.ajvError) {
            this.constructWithAjvError(this.ajvError);
        }
    }

    constructUserFriendlyMessage() : void {
        if(this.absoluteDataPath === null) {
            throw new Error("Can't construct a user friendly message: absoluteDataPath of error not set");
        } else if(!this.message) {
            throw new Error("Can't construct a user friendly message: error message not set");
        } else {
            if(this.absoluteDataPath === "") {
                this.absoluteDataPath = "root of document";
            }
            // depending on the schema keyword that caused the validation error, may need to parse the AJV error obj differently
            if(this.ajvError) {
                const keyword = this.ajvError["keyword"];
                if(keyword === "additionalProperties") {
                    const additionalPropertyParams = this.ajvError.params as AdditionalPropertiesParams;
                    const additionalProperty = additionalPropertyParams.additionalProperty;

                    this.userFriendlyMessage = "Found disallowed additional property " + additionalProperty + " at " + this.absoluteDataPath;
                } else if(keyword === "enum") {
                    const allowedValuesParams = this.ajvError.params as EnumParams;
                    const allowedValues = allowedValuesParams.allowedValues;
                    this.userFriendlyMessage = this.absoluteDataPath + " " + this.message + ": " + "[" + allowedValues + "]";
                } else {
                    this.userFriendlyMessage = this.message + " at " + this.absoluteDataPath;
                }
            } else {
                this.userFriendlyMessage = this.message + " at " + this.absoluteDataPath;
            }
        }
    }

    constructWithAjvError(ajvError: ErrorObject) : void {
        this.absoluteDataPath = ajvError.dataPath;
        this.message = ajvError.message;

        this.constructUserFriendlyMessage();
    }
}

export default ErrorReport;