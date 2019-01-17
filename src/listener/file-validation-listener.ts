import {RabbitConnectionProperties} from "../common/types";
import IHandler from "./handlers/handler";
import Listener from "./listener";

/**
 * Created by rolando on 01/08/2018.
 */

class FileValidationListener {
    rabbitConnectionProperties: RabbitConnectionProperties;
    exchange: string;
    exchangeType: string;
    queue: string;
    handler: IHandler;
    listener: Listener;

    constructor(rabbitConnectionProperties: RabbitConnectionProperties, exchange: string, queue: string, handler: IHandler, exchangeType: string) {
        this.rabbitConnectionProperties = rabbitConnectionProperties;
        this.exchange = exchange;
        this.exchangeType = exchangeType;
        this.queue = queue;
        this.handler = handler;
        this.listener = new Listener(rabbitConnectionProperties, exchange, queue, exchangeType);
        this.listener.setHandler(this.handler);
    }

    start(){
        this.listener.start();
    }
}

export default FileValidationListener;