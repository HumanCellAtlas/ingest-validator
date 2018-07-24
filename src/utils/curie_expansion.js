let request = require("request")
const logger = require("../winston");


module.exports = {

    isCurie: function(term){
        let curie = true;
        if (term.split(":").length != 2 || term.includes("http")){
                curie = false;
        }
        return curie;
    },

    expandCurie: function(term){

        const olsSearchUrl = "http://ontology.dev.data.humancellatlas.org/api/search?q=";

        const termUri = encodeURIComponent(term);
        const url = olsSearchUrl + termUri
            + "&exact=true&groupField=true&queryFields=obo_id";

        return new Promise((resolve, reject) => {
            request(url, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    let jsonBody = JSON.parse(body);
                    if (jsonBody.response.numFound === 1) {
                        logger.log("debug", "Term found");
                        resolve(jsonBody.response.docs[0].iri);
                    }
                    else {
                       reject("Could not retrieve IRI for " + term);
                    }
                }
                else {
                    reject(error)
                }
            });
        });

    }
};