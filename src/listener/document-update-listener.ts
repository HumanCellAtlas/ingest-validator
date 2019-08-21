/**
 * Created by rolando on 01/08/2018.
 */
import {RabbitConnectionProperties, RabbitMessagingProperties} from "../common/types";
import IHandler from "./handlers/handler";
import Listener from "./listener";

class DocumentUpdateListener {
    rabbitConnectionProperties: RabbitConnectionProperties;
    rabbitMessagingProperties: RabbitMessagingProperties;

    handler: IHandler;
    listener: Listener;

    constructor(rabbitConnectionProperties: RabbitConnectionProperties, rabbitMessagingProperties: RabbitMessagingProperties, handler: IHandler) {
        this.rabbitConnectionProperties = rabbitConnectionProperties;
        this.rabbitMessagingProperties = rabbitMessagingProperties;
        this.handler = handler;
        this.listener = new Listener(rabbitConnectionProperties, rabbitMessagingProperties);
        this.listener.setHandler(this.handler);
    }

    start() : void {
        this.listener.start();
    }
}

export default DocumentUpdateListener;