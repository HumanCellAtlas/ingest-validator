import unittest
from unittest import mock
import os
import json
import validator.validator as validator


BASE_PATH = os.path.dirname(__file__)


class TestValidator(unittest.TestCase):

    class MockResponse:
        def __init__(self, json_data, status_code):
            self.json_data = json_data
            self.status_code = status_code

        def json(self):
            return self.json_data

    def mocked_schema_get_404(*args, **keywargs):
        return TestValidator.MockResponse(None, 404)

    @mock.patch('requests.get', side_effect=mocked_schema_get_404)
    def test_schema_validation_unknown_schema(self, mocked_schema_get_404):
        with open(BASE_PATH + "/test_files/metadata_documents/biomaterial_document.json") as sample_document_file:
            metadata_document = json.load(sample_document_file)
            validation_report = validator.do_schema_validation(metadata_document)
            assert (validation_report.validation_state == "INVALID")
            assert (len(validation_report.error_reports) == 1)
            assert (metadata_document['describedBy'] in validation_report.error_reports[0].message)
