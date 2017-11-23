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
        document_content = self.ingest_api.get_resource_callback(entity_link)["content"]
        schema_url_for_document = validator.extract_schema_url_from_document(document_content)
        schema = validator.get_schema_from_url(schema_url_for_document)
        validation_report = validator.validate(document_content, schema)
        self.ingest_api.post_validation_report(entity_link, validation_report)

