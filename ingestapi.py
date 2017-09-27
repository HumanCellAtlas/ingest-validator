import glob, json, os, urllib, requests, logging, time, urlparse
from requests import HTTPError

ENTITY_TYPE_LINKS = {
    "SAMPLE" : "samples",
    "ASSAY" : "assays",
    "ANALYSIS" : "analyses",
    "PROTOCOL" : "protocols",
    "PROJECT" : "projects",
    "FILE" : "files"
}

SEARCH_UUID_PATH = '/search/findByUuid?uuid='
MAX_RETRIES = 3


class IngestApi:
    def __init__(self, ingest_url=None):
        self.ingest_url = ingest_url

        reply = urllib.urlopen(ingest_url)
        self.links = json.load(reply)['_links']
        
        self.logger = logging.getLogger(__name__)
        self.headers = {'Content-type': 'application/json', 'Accept': 'application/json'}

    def update_entity_by_uuid(self, entity_type, uuid, json_str):
        entity_url = self.get_entity_url_by_uuid(entity_type, uuid)
        r = requests.patch(entity_url, data=json_str, headers=self.headers)
        
        if r.status_code != requests.codes.ok:
            self.logger.error(str(r))

    def get_entity_url_by_uuid(self, entity_type, uuid):
        metadata_type = ENTITY_TYPE_LINKS[entity_type]
        entity_index_url = self.links[metadata_type]['href'].rsplit('{')[0]
        entity_find_by_uuid_url = entity_index_url + SEARCH_UUID_PATH + uuid
        entity_response = urllib.urlopen(entity_find_by_uuid_url)
        entity_url = json.load(entity_response)['_links']['self']['href']
        return entity_url

    def get_resource_callback(self, callback_link):
        resource_url = self.ingest_url + callback_link
        resource_response = urllib.urlopen(resource_url)
        resource = json.load(resource_response)
        return resource

    def start_validation(self, entity_path, document_type):
        # will loop for MAX_RETRIES in case of error
        updated = False
        retries = 0

        while retries < MAX_RETRIES:
            # do a GET request to test if validating link is present
            entity_url = urlparse.urljoin(self.ingest_url, entity_path)
            entity_response = requests.get(entity_url)
            etag = entity_response.headers['ETag']

            metadata_document = json.loads(entity_response.text)

            # check the response is a document we want to validate
            if not self.is_eligible(metadata_document, document_type):
                self.logger.debug("Target document isn't eligible for validation")
                return

            # check the response is indeed ready to start validating
            if self.is_ready_to_validate(metadata_document):
                if etag:
                    # set the etag header so we get 412 if someone beats us to set validating
                    self.headers['If-Match'] = etag
                self.logger.debug(self.headers)

                validating_link = metadata_document['_links']['validating']['href']
                transition_response = requests.put(validating_link, data={}, headers=self.headers)

                try:
                    transition_response.raise_for_status()
                    updated = True
                    break
                except HTTPError:
                    self.logger.error(str(transition_response))
                    retries += 1
                    self.logger.info('retries: ' + str(retries))
                # if transition_response.status_code != requests.codes.ok:
                #     self.logger.error(str(transition_response))
                #     retries +=1
                #     self.logger.info('retries: ' + str(retries))
                # else:
                #     updated = True
                #     break
            else:
                self.logger.info('Target document ' + str(entity_path) + ' is not ready to validate, ignoring')
                updated = False
                break
        return updated

    def simulate_validation(self, entity_path):
        self.logger.info("Validating '" + entity_path + "'...")
        time.sleep(10)
        self.logger.info("Validation of '" + entity_path + "' done!")
        return True

    def end_validation(self, entity_path):
        # will loop for MAX_RETRIES in case of error
        updated = False
        retries = 0

        while retries < MAX_RETRIES:
            # do a GET request to test if validating link is present
            entity_url = urlparse.urljoin(self.ingest_url, entity_path)
            entity_response = requests.get(entity_url)
            etag = entity_response.headers['ETag']

            metadata_document = json.loads(entity_response.text)

            # check the response is validating and can be finished
            if self.is_validating(metadata_document):
                if etag:
                    # set the etag header so we get 412 if someone beats us to set validating
                    self.headers['If-Match'] = etag
                self.logger.debug(self.headers)

                validating_link = metadata_document['_links']['valid']['href']
                transition_response = requests.put(validating_link, data={}, headers=self.headers)

                try:
                    transition_response.raise_for_status()
                    updated = True
                    break
                except HTTPError:
                    self.logger.error(str(transition_response))
                    retries += 1
                    self.logger.info('retries: ' + str(retries))
                # if transition_response.status_code != requests.codes.ok:
                #     self.logger.error(str(transition_response))
                #     retries +=1
                #     self.logger.info('retries: ' + str(retries))
                # else:
                #     updated = True
                #     break
            else:
                self.logger.info('Target document ' + str(entity_path) +
                                 ' cannot be set as valid (maybe already finished?), ignoring')
                updated = False
                break
        return updated

    def is_eligible(self, metadata_document, document_type):
        # check is we should validate this metadata_document
        # for now, we only validate if the document has a uuid, and only files if they also have a cloudUrl
        uuid = metadata_document['uuid']
        if not uuid:
            self.logger.info('No uuid, discarding message')
            return False
        else:
            # uuid is set, so check if it's a file...
            if document_type == 'FILE':
                # ... and it is, so check whether cloud_url is set
                file_cloud_url = metadata_document['cloudUrl']
                if file_cloud_url:
                    # this is a file with a set cloud_url, so can be validated
                    return True
                else:
                    # if not, this isn't eligible
                    self.logger.info("no cloudUrl, discarding....")
                    return False
            else:
                # ... which it isn't so we can validate
                return True

    def is_ready_to_validate(self, metadata_document):
        # test for presence of 'validating' link
        resource_links = metadata_document['_links']
        if 'validating' in resource_links:
            return True
        else:
            return False

    def is_validating(self, metadata_document):
        # test for presence of 'valid' link
        resource_links = metadata_document['_links']
        if 'valid' in resource_links:
            return True
        else:
            return False
