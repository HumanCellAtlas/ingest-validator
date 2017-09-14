from optparse import OptionParser

from ingestapi import IngestApi
from validationprocessor import ValidationProcessor
from messagereceiver import MessageReceiver
import config

if __name__ == '__main__':

    print("ingest url is " + config.INGEST_API_URL)
    ingest_api = IngestApi(ingest_url=config.INGEST_API_URL)
    validation_processor = ValidationProcessor(ingest_api=ingest_api)

    MessageReceiver(url=config.RABBITMQ_URL,
                    queue=config.RABBITMQ_VALIDATION_QUEUE,
                    message_processor=validation_processor) 

