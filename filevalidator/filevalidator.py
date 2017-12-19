from filevalidator.filevalidateutil import FileValidationUtil
from common.validationreport import ValidationReport
import config
import json
from ingestapi import IngestApi

INGEST_API_URL = config.INGEST_API_URL
UPLOAD_API_URL = config.UPLOAD_API_URL

"""
requests the file validation jobs from the upload service
"""
class FileValidator:
    def __init__(self, upload_validation_service_url=None, ingest_api_url=None):
        self.upload_validation_service_url = upload_validation_service_url if upload_validation_service_url is not None else UPLOAD_API_URL
        self.ingest_api_url = ingest_api_url if ingest_api_url is not None else INGEST_API_URL
        self.ingest_api = IngestApi(self.ingest_api_url)

        self.util = FileValidationUtil(self.ingest_api_url)

    def validate(self, file_document, entity_link):
        # upload-area-uuid is the same as the envelope uuid
        upload_area_uuid = self.util.get_envelope_uuid_of_file_entity(entity_link)
        file_name = file_document["filename"]
        validation_image_url = self.util.determine_validation_job_to_perform(file_document)
        validation_job_id = self.util.request_file_validation_job(validation_image_url, upload_area_uuid, file_name)
        self.util.assign_validation_job_id_to_file_document(entity_link, validation_job_id)

        file_validation_report = ValidationReport.validation_report_validating()
        return file_validation_report

    def handle_upload_job_results(self, results_message: str):
        # results should be a JSON object in a string
        results = json.loads(results_message)
        validation_id = results["validation_id"]
        file_entity = self.util.get_file_entity_given_validation_id(validation_id)
        validation_report = self.util.extract_validation_report_from_job_results(results)
        self.ingest_api.post_validation_report_full_url(file_entity["_links"]["self"]["href"], validation_report)
        self.ingest_api.transition_document_validation_state_to(file_entity, validation_report.validation_state)
