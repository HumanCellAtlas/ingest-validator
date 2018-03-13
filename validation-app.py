import threading

import config
import logging
from listeners.filevalidationoutputlistener import FileValidationOutputListener
from listeners.metadatadocumentupdatelistener import MetadataDocumentUpdateListener


def initReceivers():
    # start a listener for the metadata document update queue
    metadata_validation_listener = MetadataDocumentUpdateListener(config.RABBITMQ_URL)
    t = threading.Thread(target=metadata_validation_listener.run)
    t.start()

    # start a listener for validation job completion messages coming from the upload-service
    file_validation_listener = FileValidationOutputListener(config.RABBITMQ_URL)
    t = threading.Thread(target=file_validation_listener.run)
    t.start()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)

    print("ingest url is " + config.INGEST_API_URL)
    initReceivers()
