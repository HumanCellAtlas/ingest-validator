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
        metadata_uuid = params['uuid']['uuid']
        metadata_entity_type = params['entityType']

        metadata_update = {}
        metadata_update['validationStatus'] = "Valid"

        if metadata_entity_type ==  "FILE" and not params['cloudUrl']:
            self.logger.info('File url is not existing')
            metadata_update['validationStatus'] = "Invalid"

        self.logger.info('Patch metadata update:'+ json.dumps(metadata_update))
        self.ingest_api.update_entity_by_uuid(metadata_entity_type, metadata_uuid, json.dumps(metadata_update))            


    def _get_checksum(self, string):
        
        m = hashlib.md5()
        m.update(string)
        return m.hexdigest()