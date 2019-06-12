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
        this.ajvInstance = SchemaValidator._constructAjv(customKeywordValidators)
    }

    validateSingleSchema(inputSchema: any, inputObject: any) : Promise<ErrorObject[]> {
        inputSchema["$async"] = true;
        const schemaId: string = inputSchema['$id'];

        return new Promise((resolve, reject) => {
            const compiledSchemaPromise = this.getValidationFunction(inputSchema);

            compiledSchemaPromise.then((validate: ValidateFunction) => {
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

    getValidationFunction(inputSchema: any): Promise<ValidateFunction> {
        return SchemaValidator._getValidationFunction(inputSchema, this.validatorCache, this.ajvInstance);
    }

    static _getValidationFunction(inputSchema: any, validatorCache: {[key: string]: ValidateFunction}, ajv: Ajv):  Promise<ValidateFunction> {
        const schemaId: string = inputSchema['$id'];

        if(validatorCache[schemaId]) {
            return Promise.resolve(validatorCache[schemaId]);
        } else {
            return Promise.resolve(ajv.compileAsync(inputSchema));
        }
    }

    static _constructAjv(customKeywordValidators: CustomAjvKeyword[]) {
        const ajvInstance = new ajv({allErrors: true, schemaId: 'id', loadSchema: SchemaValidator._generateLoadSchemaRefFn()});
        ajvInstance.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
        SchemaValidator._addCustomKeywordValidators(ajvInstance, customKeywordValidators);

        return ajvInstance
    }

    static _addCustomKeywordValidators(ajvInstance: Ajv, customKeywordValidators: CustomAjvKeyword[]) {
        customKeywordValidators.forEach(customKeywordValidator => {
            ajvInstance = customKeywordValidator.configure(ajvInstance);
        });

        return ajvInstance;
    }

    static _generateLoadSchemaRefFn() {
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
}

export default SchemaValidator;