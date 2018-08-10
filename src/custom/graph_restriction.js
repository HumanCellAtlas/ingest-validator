let Ajv = require("ajv");
const request = require("request");
const logger = require("../winston");
const CustomAjvError = require("../model/custom-ajv-error");
const curies = require ("../utils/curie_expansion");


async function callCurieExpansion(terms){
    let expanded = terms.map(async(t) => {
      if (curies.isCurie(t)){
          const iri = await curies.expandCurie(t);
          return iri;
      }
      else {
        return t
      }
    });

    const iris = await Promise.all(expanded);
    return iris;
}

module.exports = function graph_restriction(ajv) {

  function findChildTerm(schema, data) {
    return new Promise((resolve, reject) => {
      let parentTerms = schema.classes;
      const ontologyIds = schema.ontologies;
      let errors = [];

      if(parentTerms && ontologyIds) {
          const olsSearchUrl = "http://ontology.dev.data.humancellatlas.org/api/search?q=";

          callCurieExpansion(parentTerms).then((iris) => {

              const parentTerm = iris.join(",");
              const ontologyId = ontologyIds.join(",").replace(/obo:/g, "");

              const termUri = encodeURIComponent(data);
              const url = olsSearchUrl + termUri
                  + "&exact=true&groupField=true&allChildrenOf=" + encodeURIComponent(parentTerm)
                  + "&ontology=" + ontologyId + "&queryFields=obo_id";

              logger.log("debug", `Evaluating graph_restriction, query url: [${url}]`);
              request(url, (error, response, body) => {
                  let jsonBody = JSON.parse(body);

                  if (jsonBody.response.numFound === 1) {
                      logger.log("debug", "It's a child term!");
                  } else if (jsonBody.response.numFound === 0) {
                      logger.log("debug", `Provided term is not child of [${parentTerm}]`);
                      errors.push({
                          keyword: "graph_restriction",
                          message: `Provided term is not child of [${parentTerm}]`
                      });
                  } else {
                      errors.push({
                          keyword: "graph_restriction",
                          message: "Something went wrong while validating term, try again."
                      });
                  }
                  reject(new Ajv.ValidationError(errors));
              });
          }).catch(err => {
              errors.push({
                  keyword: "graph_restriction",
                  message: err
              });
              reject(new Ajv.ValidationError(errors));
          });
      }
        else {
          errors.push({
              keyword: "graph_restriction",
              message: "Missing required variable in schema graph_restriction, required properties are: parentTerm and ontologyId."
          });
          reject(new Ajv.ValidationError(errors));
        }
      });
  }

  graph_restriction.definition = {
    async: true,
    type: "string",
    validate: findChildTerm,
    errors: true
  };

  ajv.addKeyword("graph_restriction", graph_restriction.definition);
  return ajv;
};
