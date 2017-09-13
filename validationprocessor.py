import pika, logging, uuid, json, hashlib


class ValidationProcessor:
    def __init__(self, ingest_api):
        self.ingest_api = ingest_api
        self.logger = logging.getLogger(__name__)

    def run(self, message):
        params = json.loads(message)
        self.logger.info('Received: '+message)

        self._set_metadata_valid(params)

    def _set_metadata_valid(self, params):
        metadata_id = params['documentId']
        metadata_entity_type = str(params['documentType']).upper()
        metadata_callback_link = params['callbackLink']

        metadata_update = {}
        metadata_update['validationStatus'] = "Valid"

        self.logger.info('Patch metadata update:'+ json.dumps(metadata_update))
        self.ingest_api.set_valid(metadata_callback_link, metadata_entity_type, metadata_id)            


    def _get_checksum(self, string):
        
        m = hashlib.md5()
        m.update(string)
        return m.hexdigest()
