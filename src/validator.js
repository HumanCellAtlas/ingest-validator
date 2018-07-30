let Ajv = require("ajv");
let request = require("request")
const logger = require("./winston");
let IsChildTermOf = require("./custom/ischildtermof");
let IsValidTerm = require("./custom/isvalidterm");
const ValidationError = require("./model/validation-error");
const AppError = require("./model/application-error");

let ajv = new Ajv({allErrors: true, schemaId: 'auto', loadSchema: loadSchemaRef});
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
let isChildTermOf = new IsChildTermOf(ajv);
let isValidTerm = new IsValidTerm(ajv);

function convertToValidationErrors(ajvErrorObjects) {
  let localErrors = [];
  ajvErrorObjects.forEach( (errorObject) => {
    let tempValError = new ValidationError(errorObject);
    let index = localErrors.findIndex(valError => (valError.dataPath === tempValError.dataPath));

    if(index !== -1) {
      localErrors[index].errors.push(tempValError.errors[0]);
    } else {
      localErrors.push(tempValError);
    }
  });
  return localErrors;
}

function runValidation(inputSchema, inputObject) {
  logger.log("silly", "Running validation...");
  return new Promise((resolve, reject) => {
    var compiledSchemaPromise = ajv.compileAsync(inputSchema);
    compiledSchemaPromise.then((validate) => {
      Promise.resolve(validate(inputObject))
        .then((data) => {
              if (validate.errors) {
                  logger.log("debug", ajv.errorsText(validate.errors, {dataVar: inputObject.alias}));
                  resolve(convertToValidationErrors(validate.errors));
              } else {
                  resolve([]);
              }
          }
        ).catch((err, errors) => {
        if (!(err instanceof Ajv.ValidationError)) {
            logger.log("error", "An error ocurred while running the validation.");
            reject(new AppError("An error ocurred while running the validation."));
        } else {
            logger.log("debug", ajv.errorsText(err.errors, {dataVar: inputObject.alias}));
            resolve(convertToValidationErrors(err.errors));
        }
      });
    }).catch((err) => {
      console.log("async schema compiled encountered and error");
      reject(err);
    });
  });
}
/**
 *
 * Attempts "automatic" validation of a JSON document by picking the schema to use
 * from the document's "describedBy" field
 *
 * @param inputObject JSON document/object to validate
 */
function runAutoValidation(inputObject) {
  return new Promise((resolve, reject) => {
    if(! inputObject["describedBy"]) {
      reject(new Error("document to be validated has no describedBy field"));
    } else {
        let schemaUri = inputObject["describedBy"];
        let reqOptions = {
            method: "GET",
            url: schemaUri,
            json: true
        };
        request(reqOptions, (err, resp, body) => {
          if(resp.statusCode === 200) {
            let inputSchema = resp.body;
            inputSchema["$id"] = inputSchema["id"];
            runValidation(inputSchema, inputObject).then((allGood) => {
              resolve(allGood);
            }).catch((err) => {
              reject(err);
            });
          } else {
            reject(new Error("Error retrieving schema at uri " + schemaUri + "; status code " + err.statusCode));
          }
        });
    }
  });
}

function loadSchemaRef(uri) {
    let reqOptions = {
        method: "GET",
        url: uri,
        json: true
    };
    return new Promise((resolve, reject) => {
        request(reqOptions, (err,resp) => {
            if (resp.statusCode >= 400) {
                reject(new Error('Loading error: ' + resp.statusCode));
            } else {
                resolve(resp.body);
            }
        });
    });
}

module.exports = {};
module.exports.runValidation = runValidation;
module.exports.runAutoValidation = runAutoValidation;
