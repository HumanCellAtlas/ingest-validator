interface IHandler {
    handle(msg: string): PromiseLike<boolean>;
}

export default IHandler;
