import glob, json, os, urllib, requests, logging
import config

ENTITY_TYPE_LINKS = {
    "SAMPLE" : "samples",
    "ASSAY" : "assays",
    "ANALYSIS" : "analysis"
    # add file type

}

SEARCH_UUID_PATH = '/search/findByUuid?uuid='

class IngestApi:

    def __init__(self, ingest_url=None):
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