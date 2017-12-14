from ingestapi import IngestApi
from validationprocessor import ValidationProcessor
from listeners.filevalidationoutputlistener import FileValidationOutputListener
import config
import messagereceiver
import threading

def initReceivers(url, queue, message_processor):
    # start a listener for the metadata queue
    t = threading.Thread(target=messagereceiver.MessageReceiver, args=(config.RABBITMQ_URL, config.RABBITMQ_VALIDATION_QUEUE, validation_processor))
    t.start()

    # start a listener for validation job completion messages coming from the upload-service
    file_validation_listener = FileValidationOutputListener(config.RABBITMQ_URL)
    t = threading.Thread(target=file_validation_listener.run)
    t.start()

if __name__ == '__main__':
    print("ingest url is " + config.INGEST_API_URL)
    ingest_api = IngestApi(ingest_url=config.INGEST_API_URL)
    validation_processor = ValidationProcessor(ingest_api=ingest_api)
    initReceivers(url=config.RABBITMQ_URL,
                  queue=config.RABBITMQ_VALIDATION_QUEUE,
                  message_processor=validation_processor)
