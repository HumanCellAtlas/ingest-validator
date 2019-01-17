import {EnumParams, ErrorObject, RequiredParams} from "ajv";

class ValidationError {
  dataPath: string;
  errors: string[];

  constructor(errorObject: ErrorObject) {
    if(errorObject.params.hasOwnProperty("missingProperty")) {
      const errorObjectParams = errorObject.params as RequiredParams;
      this.dataPath = errorObject.dataPath + "." + errorObjectParams.missingProperty;
    } else {
      this.dataPath = errorObject.dataPath;
    }

    if(errorObject.params.hasOwnProperty("allowedValues")) { // enum case
        const errorObjectParams = errorObject.params as EnumParams;
        this.errors = [errorObject.message + ": " + JSON.stringify(errorObjectParams.allowedValues)];
    } else {
      this.errors = [errorObject.message!];
    }
  }
}

export default ValidationError;