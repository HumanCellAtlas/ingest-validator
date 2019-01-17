import config from "config";
import request from "request-promise";
import Promise from "bluebird";

const olsConnectionConfig :any = config.get("OLS_API.connection");
const olsSearchUrl: string = olsConnectionConfig["scheme"] + "://" + olsConnectionConfig["host"] + ":" + olsConnectionConfig["port"] + "/api/search?q=";

class CurieExpansion {
    cachedOlsCurieResponses: any = {};
    constructor(){
        this.cachedOlsCurieResponses = {};
    }

    static isCurie(term: string) {
        let curie = true;
        if (term.split(":").length != 2 || term.includes("http")){
            curie = false;
        }
        return curie;
    }

    expandCurie(term: string) {
        const termUri = encodeURIComponent(term);
        const url = olsSearchUrl + termUri
            + "&exact=true&groupField=true&queryFields=obo_id";

        return new Promise((resolve, reject) => {
            let curieExpandResponsePromise: Promise<any>|null = null;

            if(this.cachedOlsCurieResponses[url]) {
                curieExpandResponsePromise = Promise.resolve(this.cachedOlsCurieResponses[url]);
            } else {
                curieExpandResponsePromise = request({
                    method: "GET",
                    url: url,
                    json: true
                }).promise();
            }

            curieExpandResponsePromise
                .then((resp: any) => {
                    this.cachedOlsCurieResponses[url] = resp;
                    let jsonBody = resp;
                    if (jsonBody.response.numFound === 1) {
                        resolve(jsonBody.response.docs[0].iri);
                    }
                    else {
                        reject("Could not retrieve IRI for " + term);
                    }
                }).catch(err => {
                reject(err)
            });
        });
    }
}

export default CurieExpansion;