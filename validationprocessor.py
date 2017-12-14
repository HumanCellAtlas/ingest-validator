import logging, json, validator.validator as validator


class ValidationProcessor:
    def __init__(self, ingest_api):
        self.ingest_api = ingest_api
        self.logger = logging.getLogger(__name__)
        self.headers = {'Content-type': 'application/json', 'Accept': 'application/json'}

    def run(self, message):
        entity_link = message['callbackLink']
        document_type = message['documentType'].upper()


        self.logger.debug('Received message. Callback link: ' + entity_link)
        # get the metadata document
        document = self.ingest_api.get_resource_callback(entity_link)
        # ready to be validated === resource['links'].contains("validating")
        if self.ingest_api.is_ready_to_validate(document):
            if self.ingest_api.is_eligible(document, document_type):
                # mark it "validating"
                if self.ingest_api.transition_document_validation_state_to(document, "validating"):
                    document_content = document["content"]
                    validation_report = validator.validate(document_content, entity_link, document_type)
                    validated_document = self.ingest_api.post_validation_report(entity_link, validation_report).json()
                    self.ingest_api.transition_document_validation_state_to(validated_document, validation_report.validation_state)
