import pika, logging, json

class MessageReceiver:
    def __init__(self, url=None, queue=None, message_processor=None):
        self.message_processor = message_processor

        logging.basicConfig(level=logging.INFO)
        
        self.logger = logging.getLogger(__name__)

        connection = pika.BlockingConnection(pika.URLParameters(url))
        channel = connection.channel()
        channel.queue_declare(queue=queue)

        def callback(ch, method, properties, body):
            try:
                self.logger.debug("Received:" + str(body))
                self.message_processor.run(message=json.loads(body))

            except Exception as e:
                self.logger.exception(str(e))

        channel.basic_consume(callback, queue=queue, no_ack=True)
        self.logger.info("Waiting for messages...")
        channel.start_consuming()