import unittest
from unittest import mock
from common.missingschemaurlexception import MissingSchemaUrlException
import os
import schemavalidator.schemavalidator as validator
import config
import json

BASE_PATH = os.path.dirname(__file__)
SCHEMA_VERSION = config.SCHEMA_VERSION
SCHEMA_BASE_URI = config.SCHEMA_BASE_URI

class TestSchemaValidation(unittest.TestCase):

    def mocked_get(*args, **keywargs):
        class MockResponse:
            def __init__(self, json_data, status_code):
                self.json_data = json_data
                self.status_code = status_code

            def json(self):
                return self.json_data

        with open(BASE_PATH + "/test_files/schema/sample.json") as sample_schema:
            return MockResponse(json.load(sample_schema), 200)

    @mock.patch('requests.get', side_effect=mocked_get)
    def test_get_validation_schema(self, mock_get):
        schema_validator = validator.SchemaValidator()
        schema = schema_validator.get_schema_from_url("https://mock-schemas.org/v1/sample.json")
        assert(schema is not None and len(schema) > 0)

    def test_extract_schema_url_from_metadata(self):
        with open(BASE_PATH + "/test_files/metadata_documents/sample_document.json") as sample_document_file:
            metadata_document = json.load(sample_document_file)
            schema_validator = validator.SchemaValidator()
            schema_url = schema_validator.extract_schema_url_from_document(metadata_document)
            assert(schema_url is not None and len(schema_url) > 0)

    def test_extract_schema_url_from_metadata_no_schema_url(self):
        with open(BASE_PATH + "/test_files/metadata_documents/sample_document.json") as sample_document_file:
            metadata_document = json.load(sample_document_file)
            del metadata_document["core"]["schema_url"]
            schema_validator = validator.SchemaValidator()
            try:
                schema_url = schema_validator.extract_schema_url_from_document(metadata_document)
                assert False
            except MissingSchemaUrlException as e:
                assert True

    def test_validate_sample_should_pass(self):
        with open(BASE_PATH + "/test_files/schema/sample.json") as sample_schema:
            schema = json.load(sample_schema)
            with open(BASE_PATH + "/test_files/metadata_documents/sample_document.json") as sample_document_file:
                metadata_document = json.load(sample_document_file)
                schema_validator = validator.SchemaValidator()
                report = schema_validator.validate(metadata_document, schema)
                assert (report.validation_state == "VALID")

    def test_validate_sample_should_fail(self):
        with open(BASE_PATH + "/test_files/schema/sample.json") as sample_schema:
            schema = json.load(sample_schema)
            with open(BASE_PATH + "/test_files/metadata_documents/sample_document_invalid.json") as sample_document_file:
                metadata_document = json.load(sample_document_file)
                schema_validator = validator.SchemaValidator()
                report = schema_validator.validate(metadata_document, schema)
                assert (report.validation_state == "INVALID")
