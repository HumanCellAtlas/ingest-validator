import os
import unittest
import config
import json
from filevalidator.filevalidateutil import FileValidationUtil
from filevalidator.filevalidator import FileValidator
from unittest import mock

BASE_PATH = os.path.dirname(__file__)


class TestFileValidation(unittest.TestCase):

    @staticmethod
    def dump_json(dict_obj: dict):
        return json.dumps(dict_obj)

    def mocked_get(*args, **keywargs):
        class MockResponse:
            def __init__(self, json_data, status_code, url):
                self.json_data = json_data
                self.status_code = status_code
                self.url = url
                self.content = TestFileValidation.dump_json(json_data)

            def json(self):
                return self.json_data

        if args[0] == "http://mock-ingest-api/files/mock-file-entity" or args[0] == "http://mock-ingest-api/files/search/findByValidationId?validationId=mock-job-uuid":
            return MockResponse({"_links":
                                     {"submissionEnvelopes":
                                          {"href": "http://mock-ingest-api/files/mock-file-entity/submissionEnvelopes"},
                                      "self":
                                          {"href": "http://mock-ingest-api/files/mock-file-entity"},
                                      "valid": {
                                          "href": "http://mock-ingest-api/files/mock-file-entity/validEvent"},
                                      "validating":
                                          {"href": "http://mock-ingest-api/files/mock-file-entity/validatingEvent"},
                                      "invalid":
                                          {"href": "http://mock-ingest-api/files/mock-file-entity/invalidEvent"},
                                      },
                                 "cloudUrl": "mock-cloud-url"
                                 }, 200, args[0])
        elif args[0] == "http://mock-ingest-api/files/mock-file-entity/submissionEnvelopes":
            return MockResponse({"_embedded":
                {"submissionEnvelopes":
                    [
                        {"uuid":
                             {"uuid": "mock-uuid"}
                         }
                    ]
                }
            }, 200, args[0])
        else:
            return MockResponse({"status_code": 400}, 400, args[0])

    def mocked_put(*args, **keywargs):
        class MockResponse:
            def __init__(self, json_data, status_code, url):
                self.json_data = json_data
                self.status_code = status_code
                self.url = url
                self.content = TestFileValidation.dump_json(json_data)

            def json(self):
                return self.json_data

        if args[0] == "http://mock-upload-api/v1/area/mock-area-uuid/mock-file-name/validate":
            return MockResponse({"validation_id": "mock-validation-job-id"}, 200, args[0])
        elif args[0] == "http://mock-ingest-api/files/mock-file-entity/invalidEvent":
            return MockResponse({}, 200, args[0])
        elif args[0] == "http://mock-ingest-api/files/mock-file-entity/validEvent":
            return MockResponse({}, 200, args[0])
        elif args[0] == "http://mock-ingest-api/files/mock-file-entity/validatingEvent":
            return MockResponse({}, 200, args[0])

    def mocked_patch(*args, **keywargs):
        class MockResponse:
            def __init__(self, json_data, status_code, url):
                self.json_data = json_data
                self.status_code = status_code
                self.url = url
                self.content = TestFileValidation.dump_json(json_data)

            def json(self):
                return self.json_data

        if args[0] == "http://mock-ingest-api/files/mock-file-entity":
            payload = json.loads(keywargs["data"])
            validation_id = payload["validationId"] if "validationId" in payload else ""
            return MockResponse({"validationId": validation_id}, 200, args[0])

    def mocked_post(*args, **keywargs):
        class MockResponse:
            def __init__(self, json_data, status_code, url):
                self.json_data = json_data
                self.status_code = status_code
                self.url = url
                self.content = TestFileValidation.dump_json(json_data)

            def json(self):
                return self.json_data

        if args[0] == "http://mock-ingest-api/files/mock-file-entity":
            return MockResponse({}, 200, args[0])


    @mock.patch('requests.get', side_effect=mocked_get)
    @mock.patch.object(config, 'INGEST_API_URL', "http://mock-ingest-api")
    def test_get_envelope_uuid_from_file_entity_link(self, mocked_get):
        util = FileValidationUtil()
        envelope_uuid = util.get_envelope_uuid_of_file_entity("/files/mock-file-entity")
        assert envelope_uuid == "mock-uuid"

    @mock.patch('requests.get', side_effect=mocked_get)
    @mock.patch.object(config, 'INGEST_API_URL', "http://mock-ingest-api")
    def test_get_cloud_url_from_file_entity_link(self, mocked_get):
        util = FileValidationUtil()
        cloud_url = util.get_cloud_url_of_file_entity("/files/mock-file-entity")
        assert cloud_url == "mock-cloud-url"

    @mock.patch.object(config, 'INGEST_API_URL', "http://mock-ingest-api")
    def test_extract_file_extensions_from_file_name(self):
        util = FileValidationUtil()
        file_name = "abcdefg.fastq.tar.gz"
        extension = util.extract_file_extension(file_name)
        assert extension == "fastq.tar.gz"

    @mock.patch.object(config, 'FILE_VALIDATION_IMAGES', {"mockformat.tar.gz": "quay.io/mock-format-validator"})
    def test_determine_validation_job_to_perform(self):
        util = FileValidationUtil("http://mock-ingest-api")
        mock_file_document = {"filename": "mockfile.mockformat.tar.gz"}
        validation_job_image = util.determine_validation_job_to_perform(mock_file_document)
        assert validation_job_image == "quay.io/mock-format-validator"

    def test_determine_validation_job_no_result(self):
        # given:
        util = FileValidationUtil()
        file_metadata = {'filename': 'some_file.txt'}

        # when:
        image_name = util.determine_validation_job_to_perform(file_metadata)

        # then:
        self.assertEqual(config.DEFAULT_VALIDATION_IMAGE, image_name)

    @mock.patch('requests.put', side_effect=mocked_put)
    @mock.patch.object(config, 'UPLOAD_API_URL', "http://mock-upload-api")
    @mock.patch.object(config, 'FILE_VALIDATION_IMAGES', {"mockformat.tar.gz": "quay.io/mock-format-validator"})
    def test_file_validation_service_job_request(self, mocked_put):
        util = FileValidationUtil("http://mock-ingest-api")
        mock_file_document = {"filename": "mockfile.mockformat.tar.gz"}
        validation_job_image = util.determine_validation_job_to_perform(mock_file_document)

        validation_job_uuid = util.request_file_validation_job(validation_job_image, "mock-area-uuid", "mock-file-name")
        assert validation_job_uuid == "mock-validation-job-id"

    @mock.patch('requests.patch', side_effect=mocked_patch)
    def test_assign_validation_job_id_to_file(self, mocked_patch):
        util = FileValidationUtil("http://mock-ingest-api")
        validation_job_uuid = "mock-job-uuid"
        assign_validation_job_id_reponse = util.assign_validation_job_id_to_file_document("/files/mock-file-entity",
                                                                                          validation_job_uuid)
        assert assign_validation_job_id_reponse["validationId"] == validation_job_uuid

    def test_extract_validation_report_from_validation_job_results(self):
        util = FileValidationUtil("http://mock-ingest-api")
        report = util.extract_validation_report_from_job_results({'stderr': '',
                                                                  'stdout': '{"validation_state": "VALID", "validation_errors": []}'})
        assert report.validation_state == "VALID"

        invalid_report = util.extract_validation_report_from_job_results({'stderr': '',
                                                                          'stdout': '{"validation_state": "INVALID", "validation_errors": [{"user_friendly_message": "some error message"}]}'})
        assert len(invalid_report.error_reports) == 1 and len(invalid_report.errors_to_dict()) == 1

    @mock.patch('requests.get', side_effect=mocked_get)
    @mock.patch('requests.post', side_effect=mocked_post)
    @mock.patch('requests.patch', side_effect=mocked_patch)
    @mock.patch('requests.put', side_effect=mocked_put)
    def test_handle_job_results(self, mocked_get, mocked_post, mocked_patch, mocked_put):
        job_results = {'stderr': '',
                       'stdout': '{"validation_state": "INVALID", "validation_errors": [{"user_friendly_message": "some error message"}]}',
                       'validation_id': 'mock-job-uuid'}
        file_validator = FileValidator("http://mock-upload-api", "http://mock-ingest-api")
        try:
            file_validator.handle_upload_job_results(json.dumps(job_results))
            assert True
        except Exception as e:
            assert False

