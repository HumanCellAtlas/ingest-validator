import pika, logging, uuid, json, hashlib, requests, time

class ValidationProcessor:
    def __init__(self, ingest_api):
        self.ingest_api = ingest_api
        self.logger = logging.getLogger(__name__)
        self.headers = {'Content-type': 'application/json', 'Accept': 'application/json'}

    def run(self, message):
        params = json.loads(message)
        self.logger.info('Received message. Callback link: ' + params['callbackLink'])
         
        metadata_document = self.ingest_api.get_resource_callback(params['callbackLink'])
        
        # decide what to do with document
        document_validation_state = metadata_document['validationState'].upper()
        if document_validation_state == 'DRAFT':
            self._set_metadata_validating(params['callbackLink'], params['documentType'].upper(), params['documentId'])
        elif document_validation_state == 'VALIDATING':
            self._set_metadata_valid(params['callbackLink'], params['documentType'].upper(), params['documentId'])
        elif document_validation_state == 'VALID':
            self.logger.info('received a document for processing that was valid')
        else:
            self.logger.info('received a document in an unexcepted validation state: ' + document_validation_state)
            

    # returns 0 if successfuly set the document to 'validating'
    # returns 1 if does not need to set document to 'validating' because it's already been set to 'validating' or had no uuid/cloudUrl
    # returns -1 if failed to set document to 'validating'
    def _set_metadata_validating(self, callback_link, metadata_type, metadata_id):
        metadata_document = self.ingest_api.get_resource_callback(callback_link)

        # if it's a file and doesn't have a cloudUrl then leave it in DRAFT
        if metadata_type == 'FILE':
            file_cloud_url = metadata_document['cloudUrl']
            if file_cloud_url == None or file_cloud_url == '':
                self.logger.info("no cloudUrl, discarding....")
                return 1


        # if it isn't accessioned (i.e has a uuid), wait til it does
        uuid = metadata_document['uuid']
        if (uuid == None) or (not 'uuid' in uuid) or (uuid['uuid'] == ''):
            self.logger.info("no uuid, discarding....")
            return 1

        poll_count = 5
        for i in range(0, poll_count):

            resource_links = metadata_document['_links']
            if 'validating' in resource_links:
                set_resource_validating_url = resource_links['validating']['href']
                r = requests.put(set_resource_validating_url, data={}, headers=self.headers)
                sc = r.status_code
                if sc == requests.codes.ok or sc == requests.codes.accepted:
                    self.logger.info('successfully set document to validating')
                    return 0
                else:
                    self.logger.info('status code ' + str(sc) + ' when trying to set document to validating')
                    # if the code was 409, then maybe another validator did it?
                    if sc == requests.codes.conflict:
                        metadata_document = self.ingest_api.get_resource_callback(callback_link)
                        resource_links = metadata_document['_links']
                        if not 'validating' in resource_links:
                            # assume another validator set it to 'validating'
                            return 1
            else:
                time.sleep(0.5)

        self.logger.error('failed to put metadata document into VALIDATING state after ' + str(poll_count) + ' attempts')
        return -1


    # returns 0 if successfuly set the document to 'valid'
    # returns 1 if does not need to set document to 'valid' because it's already been set to 'valid'
    # returns -1 if failed to set document to 'valid'
    def _set_metadata_valid(self, callback_link, metadata_type, metadata_id):
        metadata_document = self.ingest_api.get_resource_callback(callback_link)

        poll_count = 5
        for i in range(0, poll_count):

            resource_links = metadata_document['_links']
            if 'valid' in resource_links: # i.e we can now validate
                set_resource_valid_url = resource_links['valid']['href']
                r = requests.put(set_resource_valid_url, data={}, headers=self.headers)
                sc = r.status_code
                if sc == requests.codes.ok or sc == requests.codes.accepted:
                    self.logger.info(str(r))
                    return 0
                else:
                    self.logger.info('status code ' + str(sc) + ' when trying to set document to valid')
                    # if the code was 409, then maybe another validator did it?
                    if sc == requests.codes.conflict: 
                        metadata_document = self.ingest_api.get_resource_callback(callback_link)
                        resource_links = metadata_document['_links']
                        if not 'validating' in resource_links:
                            # assume another validator set it to 'validating'
                            return 1
            else:
                time.sleep(0.5)

        self.logger.error('failed to put metadata document into VALIDATING state after ' + str(poll_count) + ' attempts')
        return -1


    def _get_checksum(self, string):
        
        m = hashlib.md5()
        m.update(string)
        return m.hexdigest()
