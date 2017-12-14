from filevalidator.filevalidateutil import FileValidationUtil
from common.validationreport import ValidationReport
import config

INGEST_API_URL = config.INGEST_API_URL
UPLOAD_API_URL = config.UPLOAD_API_URL

"""
requests the file validation jobs from the upload service
"""
class FileValidator:
    def __init__(self, upload_validation_service_url=None, ingest_api_url=None):
        self.upload_validation_service_url = upload_validation_service_url if upload_validation_service_url is not None else UPLOAD_API_URL
        self.ingest_api_url = ingest_api_url if ingest_api_url is not None else ingest_api_url

        self.util = FileValidationUtil()

    def validate(self, file_document, entity_link):
        # upload-area-uuid is the same as the envelope uuid
        upload_area_uuid = self.util.get_envelope_uuid_of_file_entity(entity_link)
        file_name = file_document["filename"]
        validation_image_url = self.util.determine_validation_job_to_perform(file_document)
        validation_job_id = self.util.request_file_validation_job(validation_image_url, upload_area_uuid, file_name)

        file_validation_report = ValidationReport.validation_report_validating()
        return file_validation_report

