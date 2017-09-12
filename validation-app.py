from optparse import OptionParser

from ingestapi import IngestApi
from validationprocessor import ValidationProcessor
from messagereceiver import MessageReceiver
import config

if __name__ == '__main__':

    ingest_api = IngestApi(ingest_url=config.INGEST_API_URL)
    print config.INGEST_API_URL
    validation_processor = ValidationProcessor(ingest_api=ingest_api)

    MessageReceiver(host=config.RABBITMQ_HOST,
                    port=config.RABBITMQ_PORT,
                    queue=config.RABBITMQ_VALIDATION_QUEUE,
                    message_processor=validation_processor) 

