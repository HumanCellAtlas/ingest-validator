import glob, json, os, urllib, requests, logging
import config

ENTITY_TYPE_LINKS = {
    "SAMPLE" : "samples",
    "ASSAY" : "assays",
    "ANALYSIS" : "analysis",
    "PROTOCOL" : "protocols",
    "PROJECT" : "projects",
    "FILE" : "files"
}

SEARCH_UUID_PATH = '/search/findByUuid?uuid='

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

    def set_valid(self, callback_link, metadata_type, metadata_id):
        metadata_type = ENTITY_TYPE_LINKS[metadata_type]
        resource_url = self.ingest_url + "/" + metadata_type + "/" + metadata_id

        # if it's a File, only validate is the cloudUrl is present
        if metadata_type == 'files':
            file_resource = json.load(urllib.urlopen(resource_url))
            file_cloud_url = file_resource["cloudUrl"]
            if file_cloud_url == None or file_cloud_url == "":
                return

        # first set to validating
        resource_url_links_response = urllib.urlopen(resource_url)
        resource_url_links = json.load(resource_url_links_response)['_links']
        set_resource_validating_url = resource_url_links['validating']['href']

        r = requests.put(set_resource_validating_url, data={}, headers=self.headers)
        if r.status_code != requests.codes.ok:
            self.logger.error(str(r))

        # then set to valid
        resource_url_links_response = urllib.urlopen(resource_url)
        resource_url_links = json.load(resource_url_links_response)['_links']
        set_resource_valid_url = resource_url_links['valid']['href']

        r = requests.put(set_resource_valid_url, data={}, headers=self.headers)
        if r.status_code != requests.codes.ok:
            self.logger.error(str(r))

