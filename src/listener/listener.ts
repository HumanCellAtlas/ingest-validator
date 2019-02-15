/**
 * Created by rolando on 02/08/2018.
 */
import {RabbitConnectionProperties} from "../common/types";
import amqp, {Message} from "amqplib";
import IHandler from "./handlers/handler";
import * as url from "url";


class Listener {
    exchange: string;
    exchangeType: string;
    queue: string;
    rabbitConnectionProperties: RabbitConnectionProperties;
    rabbitUrl: URL;
    handler?: IHandler;


    constructor(rabbitConnectionProperties: RabbitConnectionProperties, exchange: string, queue: string, exchangeType: string) {
        this.rabbitConnectionProperties = rabbitConnectionProperties;
        this.rabbitUrl = new url.URL(`${rabbitConnectionProperties.scheme}://${rabbitConnectionProperties.host}:${rabbitConnectionProperties.port}`);
        this.exchange = exchange;
        this.queue = queue;
        this.exchangeType = exchangeType;
    }

    start(){
        amqp.connect(String(this.rabbitUrl)).then((conn) => {
            return conn.createChannel();
        }).then(ch => {
            ch.assertExchange(this.exchange, this.exchangeType).then(() => {
                ch.assertQueue(this.queue, {durable: false}).then(() => {
                    ch.bindQueue(this.queue, this.exchange, this.queue).then(() => {
                        ch.prefetch(1).then(() => {
                            ch.consume(this.queue, (msg: Message|null) => {
                                this.handle(msg).then(success => {
                                    if(success) {
                                        ch.ack(msg!);
                                    } else {
                                        ch.nack(msg!);
                                    }
                                });
                            }, {noAck : false});
                        })
                    })
                })
            })

        })
    }

    setHandler(handler: IHandler) {
        this.handler = handler;
    }

    handle(msg: Message | null) : PromiseLike<boolean>{
        return this.handler!.handle(msg!.content.toString());
    }

}

export default Listener;