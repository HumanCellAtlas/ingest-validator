import os
import unittest
import config
from filevalidator.filevalidateutil import FileValidationUtil
from unittest import mock


BASE_PATH = os.path.dirname(__file__)

class TestFileValidation(unittest.TestCase):

    def mocked_get(*args, **keywargs):
        class MockResponse:
            def __init__(self, json_data, status_code):
                self.json_data = json_data
                self.status_code = status_code

            def json(self):
                return self.json_data

        if args[0] == "http://mock-ingest-api/files/mock-file-entity":
            return MockResponse({"_links":
                                     {"submissionEnvelopes":
                                          {"href":"http://mock-ingest-api/files/mock-file-entity/submissionEnvelopes"}
                                      }
                                 }, 200)
        elif args[0] == "http://mock-ingest-api/files/mock-file-entity/submissionEnvelopes":
            return MockResponse({"_embedded":
                                     {"submissionEnvelopes":
                                          [
                                              {"uuid":
                                                   {"uuid": "mock-uuid"}
                                               }
                                          ]
                                     }
            }, 200)
        else:
            return MockResponse({"status_code": 400}, 400)

    def mocked_put(*args, **keywargs):
        class MockResponse:
            def __init__(self, json_data, status_code):
                self.json_data = json_data
                self.status_code = status_code

            def json(self):
                return self.json_data

        if args[0] == "http://mock-upload-api/v1/area/mock-area-uuid/mock-file-name":
            return MockResponse({"validation_id": "mock-validation-job-id"}, 200)

    def mocked_patch(*args, **keywargs):
        class MockResponse:
            def __init__(self, json_data, status_code):
                self.json_data = json_data
                self.status_code = status_code

            def json(self):
                return self.json_data

        if args[0] == "http://mock-ingest-api/files/mock-file-entity":
            payload = keywargs["data"]
            validation_id = payload["validationId"]
            return MockResponse({"validationId": validation_id}, 200)


    @mock.patch('requests.get', side_effect=mocked_get)
    @mock.patch.object(config, 'INGEST_API_URL', "http://mock-ingest-api")
    def test_get_envelope_uuid_from_file_entity_link(self, mocked_get):
        util = FileValidationUtil()
        envelope_uuid = util.get_envelope_uuid_of_file_entity("/files/mock-file-entity")
        assert envelope_uuid == "mock-uuid"

    @mock.patch.object(config, 'INGEST_API_URL', "http://mock-ingest-api")
    def test_extract_file_extensions_from_file_name(self):
        util = FileValidationUtil()
        file_name = "abcdefg.fastq.tar.gz"
        extension = util.extract_file_extension(file_name)
        assert extension == "fastq.tar.gz"

    @mock.patch.object(config, 'FILE_VALIDATION_IMAGES', {"mockformat.tar.gz": "quay.io/mock-format-validator"})
    def test_determine_validation_job_to_perform(self):
        util = FileValidationUtil("http://mock-ingest-api")
        mock_file_document = {"fileName": "mockfile.mockformat.tar.gz"}
        validation_job_image = util.determine_validation_job_to_perform(mock_file_document)
        assert validation_job_image == "quay.io/mock-format-validator"

    @mock.patch('requests.put', side_effect=mocked_put)
    @mock.patch.object(config, 'UPLOAD_API_URL', "http://mock-upload-api")
    @mock.patch.object(config, 'FILE_VALIDATION_IMAGES', {"mockformat.tar.gz" : "quay.io/mock-format-validator"})
    def test_file_validation_service_job_request(self, mocked_put):
        util = FileValidationUtil("http://mock-ingest-api")
        mock_file_document = {"fileName": "mockfile.mockformat.tar.gz"}
        validation_job_image = util.determine_validation_job_to_perform(mock_file_document)

        validation_job_uuid = util.request_file_validation_job(validation_job_image, "mock-area-uuid", "mock-file-name")
        assert validation_job_uuid == "mock-validation-job-id"


    @mock.patch('requests.patch', side_effect=mocked_patch)
    def test_assign_validation_job_id_to_file(self, mocked_patch):
        util = FileValidationUtil("http://mock-ingest-api")
        validation_job_uuid = "mock-job-uuid"
        assign_validation_job_id_reponse = util.assign_validation_job_id_to_file_document("/files/mock-file-entity", validation_job_uuid)
        assert assign_validation_job_id_reponse["validationId"] == validation_job_uuid

    def test_extract_validation_report_from_validation_job_results(self):
        util = FileValidationUtil("http://mock-ingest-api")
        report = util.extract_validation_report_from_job_results({'stderr': '', 'stdout': '{"validationState": "VALID", "validationErrors": []}'})
        assert report.validation_state == "VALID"