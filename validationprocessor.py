import pika, logging, uuid, json, hashlib, requests, time

class ValidationProcessor:
    def __init__(self, ingest_api):
        self.ingest_api = ingest_api
        self.logger = logging.getLogger(__name__)
        self.headers = {'Content-type': 'application/json', 'Accept': 'application/json'}

    def run(self, message):
        params = json.loads(message)

        entity_link = params['callbackLink']
        document_type = params['documentType'].upper()

        self.logger.info('Received message. Callback link: ' + entity_link)

        if self.ingest_api.start_validation(entity_link, document_type):
            if self.ingest_api.simulate_validation(entity_link):
                if self.ingest_api.end_validation(entity_link):
                    self.logger.info("Completed validation of '" + entity_link + "'!")
                else:
                    self.logger.error("Validation failed for '" + entity_link + "': could not end validation")
            else:
                self.logger.error("Validation failed for '" + entity_link + "': could not simulate validation")
        else:
            self.logger.error("Validation failed for '" + entity_link + "': could not start validation")