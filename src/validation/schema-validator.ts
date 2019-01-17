import {Ajv, ErrorObject, ValidateFunction} from "ajv";
import CustomAjvKeyword from "../custom/custom-ajv-keyword";
import Promise from "bluebird";
import ajv from "ajv";
import request from "request-promise";
import AppError from "../model/application-error";

class SchemaValidator {
    validatorCache: {[key: string]: ValidateFunction};
    customKeywordValidators: CustomAjvKeyword[];
    ajvInstance: Ajv;

    constructor(customKeywordValidators: CustomAjvKeyword[]){
        this.validatorCache = {};
        this.customKeywordValidators = customKeywordValidators;
        this.ajvInstance = new ajv({allErrors: true, schemaId: 'auto', loadSchema: this.generateLoadSchemaRefFn()});
    }

    generateLoadSchemaRefFn() {
        const schemaCache: {[key: string]: any} = {};

        const loadSchemaRefFn: (uri:string) => Promise<any> = (uri:string) => {
            if(schemaCache[uri]) {
                return Promise.resolve(schemaCache[uri]);
            } else {
                return new Promise((resolve, reject) => {
                    request({
                        method: "GET",
                        url: uri,
                        json: true
                    }).then((resp: any) => {
                        const loadedSchema = resp;
                        loadedSchema["$async"] = true;
                        schemaCache[uri] = loadedSchema;
                        resolve(loadedSchema);
                    }).catch((err: Error) => {
                        reject(err);
                    });
                });
            }
        };

        return loadSchemaRefFn;
    }




    validateSingleSchema(inputSchema: any, inputObject: any) : Promise<ErrorObject[]> {
        inputSchema["$async"] = true;
        const schemaId: string = inputSchema['$id'];

        return new Promise((resolve, reject) => {
            let compiledSchemaPromise: Promise<ValidateFunction>|null = null;
            if(this.validatorCache[schemaId]) {
                compiledSchemaPromise = Promise.resolve(this.validatorCache[schemaId]);
            } else {
                compiledSchemaPromise = Promise.resolve(this.ajvInstance.compileAsync(inputSchema));
            }

            compiledSchemaPromise!.then((validate: ValidateFunction) => {
                this.validatorCache[schemaId] = validate;
                Promise.resolve(validate(inputObject))
                    .then((data) => {
                            if (validate.errors) {
                                resolve(validate.errors);
                            } else {
                                resolve([]);
                            }
                        }
                    ).catch((err) => {
                    if (!(err instanceof ajv.ValidationError)) {
                        console.error("An error ocurred while running the validation.");
                        reject(new AppError("An error ocurred while running the validation."));
                    } else {
                        console.debug("debug", this.ajvInstance.errorsText(err.errors, {dataVar: inputObject.alias}));
                        resolve(err.errors);
                    }
                });
            }).catch((err) => {
                console.error("async schema compiled encountered and error");
                console.error(err.stack);
                reject(err);
            });
        });
    }
}

export default SchemaValidator;