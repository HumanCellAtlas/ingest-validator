/**
 * Created by rolando on 02/08/2018.
 */
const amqp = require('amqplib');

class Listener {
    constructor(rabbitConnectionProperties, exchange, queue) {
        this.rabbitConnectionProperties = rabbitConnectionProperties;
        this.rabbitUrl = rabbitConnectionProperties["scheme"] + "://" + rabbitConnectionProperties["host"] + ":" + rabbitConnectionProperties["port"];
        this.exchange = exchange;
        this.queue = queue;
    }

    start(){
        amqp.connect(this.rabbitUrl).then(conn => {
            return conn.createChannel();
        }).then(ch => {
            ch.assertExchange(this.exchange, 'topic').then(() => {
                ch.assertQueue(this.queue, {durable: false}).then(() => {
                    ch.prefetch(1).then(() => {
                        ch.consume(this.queue, (msg) => {
                            this.handle(msg);
                        }, {noAck : true});
                    })
                })
            })

        })
    }

    setHandler(handler) {
        this.handler = handler;
    }

    handle(msg){
        this.handler.handle(msg);
    }

}

module.exports = Listener;