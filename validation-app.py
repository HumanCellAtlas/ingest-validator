
from ingestapi import IngestApi
from validationprocessor import ValidationProcessor
import config
import messagereceiver

def initReceivers(url, queue, message_processor):
    # currently starts 1 handler thread, should have multiple threads
    messagereceiver.MessageReceiver(url=config.RABBITMQ_URL,
                                    queue=config.RABBITMQ_VALIDATION_QUEUE,
                                    message_processor=validation_processor)


if __name__ == '__main__':
    print("ingest url is " + config.INGEST_API_URL)
    ingest_api = IngestApi(ingest_url=config.INGEST_API_URL)
    validation_processor = ValidationProcessor(ingest_api=ingest_api)
    initReceivers(url=config.RABBITMQ_URL,
                  queue=config.RABBITMQ_VALIDATION_QUEUE,
                  message_processor=validation_processor)
