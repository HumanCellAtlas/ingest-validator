import Promise from "bluebird";
import {NotRetryableError} from "./ingest-client/ingest-client-exceptions";

/**
 * Created by prabhat on 23/08/2019.
 */

export class Client {

    clientBaseUrl: string;
    clientApiKey?: string;

    constructor(baseUrl: string, apiKey?: string) {
        this.clientBaseUrl = baseUrl;
        this.clientApiKey = apiKey;
    }

    retry(maxRetries: number, func: Function, args: any[], retryMessage: string) {
        return this._retry(0, maxRetries, null, func, args, retryMessage);
    }

    _retry(attemptsSoFar: number, maxRetries: number, prevErr: Error|null, func: Function, args: any[], retryMessage: string) {
        if(attemptsSoFar === maxRetries) {
            return Promise.reject(prevErr);
        } else {
            const boundFunc = func.bind(this);
            return Promise.delay(50).then(() => {
                return boundFunc.apply(null, args)
                    .then( (allGood: any) => {return Promise.resolve(allGood)})
                    .catch( (err: Error) => {
                        if(err instanceof NotRetryableError) {
                            return Promise.reject(err);
                        } else {
                            const incAttempts = attemptsSoFar + 1;
                            console.info(retryMessage + " :: Attempt # " + incAttempts + " out of " + maxRetries);
                            return this._retry(attemptsSoFar + 1, maxRetries, err, func, args, retryMessage);
                        }
                    });
            });
        }
    }

}
