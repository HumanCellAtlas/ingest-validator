import config
import requests
import json
from common.validationreport import ValidationReport
from functools import reduce

class FileValidationUtil:

    def __init__(self, ingest_api_url=None):
        self.ingest_api_url = ingest_api_url if ingest_api_url is not None else config.INGEST_API_URL

    def get_envelope_uuid_of_file_entity(self, entity_link: str):
        entity = requests.get(self.ingest_api_url + entity_link).json()
        envelopes_link = entity["_links"]["submissionEnvelopes"]["href"]
        envelopes = requests.get(envelopes_link).json()
        envelope_uuid = envelopes["_embedded"]["submissionEnvelopes"][0]["uuid"]["uuid"]
        return envelope_uuid

    def determine_validation_job_to_perform(self, file_document: dict):
        # attempt to figure out the file type
        file_extension = self.extract_file_extension(file_document["fileName"])
        # lookup the file extension and file required docker image
        validation_image_url = config.FILE_VALIDATION_IMAGES[file_extension]
        return validation_image_url


    '''
    requests a validation job using the upload service's file validation API and returns the validation job ID
    '''
    def request_file_validation_job(self, validator_image_url: str, upload_area_uuid: str, file_name: str):
        request_url = config.UPLOAD_API_URL + "/v1/area/" + upload_area_uuid + "/" + file_name
        return requests.put(request_url, data={"validator_image": validator_image_url}).json()["validation_id"]


    def assign_validation_job_id_to_file_document(self, entity_link, job_id):
        return requests.patch(self.ingest_api_url + entity_link, data={"validationId": job_id}).json()

    '''
    returns file extension given a file name, e.g
    given aaaabbbcc.fastq, returns fastq
    given aaabbbccc.fastq.gz, returns fastq.gz
    given aaaabbbccc.fastq.tar.gz, returns fastq.tar.gz
    '''
    def extract_file_extension(self, file_name: str):
        return reduce(lambda extension, subsequent_extension: extension + "." + subsequent_extension, file_name.split(".")[1:])

    def extract_validation_report_from_job_results(self, job_results: dict):
        if not job_results["stderr"]:
            validation_report_dict = json.loads(job_results["stdout"])
            return ValidationReport.from_dict(validation_report_dict)

    def get_validation_report_from_validation_job_result(self, job_result: dict):
        # we're expecting a stringified JSON object here
        validation_report_string = job_result["stdout"]
        validation_report_dict = json.loads(validation_report_string)
        return validation_report_dict

    def get_file_entity_given_validation_id(self, validation_id):
        query_url = self.ingest_api_url + "/files/search/findByValidationId?validationId=" + validation_id
        search_results = requests.get(query_url)
        file_entity = search_results.json()
        return file_entity