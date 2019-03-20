import Promise from "bluebird";

interface IHandler {
    handle(msg: string): Promise<boolean>;
}

export default IHandler;
