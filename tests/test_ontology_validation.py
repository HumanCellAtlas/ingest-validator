import unittest
import os
import ontologyvalidator.ontologyvalidateutil as ontology_validate_util
import ontologyvalidator.ontologyvalidator as validator
import json
from unittest import mock


BASE_PATH = os.path.dirname(__file__)

class TestOntologyValidation(unittest.TestCase):
    def test_find_ontology_fields_in_document(self):
        util = ontology_validate_util.OntologyValidationUtil()

        with open(BASE_PATH + "/test_files/metadata_documents/sample_document.json") as document_file:
            document = json.load(document_file)
            fields_found = util.find_ontology_terms_in_document(document)
            assert(len(fields_found) == 1 and fields_found[0][0] == "specimen_from_organism.organ.ontology")

    def test_generate_ontology_schema_file_name_from_ontology_field(self):
        util = ontology_validate_util.OntologyValidationUtil()
        assert(util.get_ontology_schema_file_name_from_ontology_field("specimen_from_organism.organ.ontology") == "organ_ontology.json")
        assert(util.get_ontology_schema_file_name_from_ontology_field("xxxxx.yyyy.xxxx.organ.ontology") == "organ_ontology.json")
        try:
            # should throw an exception
            util.get_ontology_schema_file_name_from_ontology_field("xxxxx.organ.onlololology")
            assert False
        except Exception as e:
            assert True

    def mocked_get(*args, **keywargs):
        class MockResponse:
            def __init__(self, json_data, status_code):
                self.json_data = json_data
                self.status_code = status_code

            def json(self):
                return self.json_data

        with open(BASE_PATH + "/test_files/schema/test_body_part_ontology_schema.json") as ontology_schema:
            return MockResponse(json.load(ontology_schema), 200)

    @mock.patch('requests.get', side_effect=mocked_get)
    def test_retrieve_ontology_validation_schema(self, mock_get):
        with open(BASE_PATH + "/test_files/schema/test_body_part_ontology_schema.json") as ontology_schema_file:
            mocked_schema = json.load(ontology_schema_file)
            util = ontology_validate_util.OntologyValidationUtil()
            retrieved_schema = util.retrieve_ontology_schema("https://somewhere-on-github/versionX/ontology_schemas", "body_part_ontology.json")
            # asserting 2 schemas are equal if the set of keys in each is equal to set of keys in the other
            assert(set(retrieved_schema.keys()).issubset(mocked_schema.keys()) and set(mocked_schema.keys()).issubset(retrieved_schema.keys()))

    def test_generate_ols_query_from_ontology_validation_schema_and_ontology_term(self):
        with open(BASE_PATH + "/test_files/schema/test_body_part_ontology_schema.json") as ontology_schema_file:
            ontology_schema_document = json.load(ontology_schema_file)
            util = ontology_validate_util.OntologyValidationUtil()
            query_dict = util.generate_ols_query(ontology_schema_document, "UBERON_000ABCDEFG")
            assert(len(query_dict.keys()) == 4)

    def test_lookup_ontology_terms(self):
        with open(BASE_PATH + "/test_files/schema/test_body_part_ontology_schema.json") as ontology_schema_file:
            ontology_schema_document = json.load(ontology_schema_file)
            util = ontology_validate_util.OntologyValidationUtil()
            should_pass_query_dict = util.generate_ols_query(ontology_schema_document, "UBERON_0000178")
            lookup = util.lookup_ontology_term(should_pass_query_dict)

            assert lookup.json()["response"]["numFound"] >= 1

            should_fail_query_dict = util.generate_ols_query(ontology_schema_document, "UBERON_doesnt_exist")
            lookup = util.lookup_ontology_term(should_fail_query_dict)

            assert lookup.json()["response"]["numFound"] == 0


    def test_ontology_validate(self):
        with open(BASE_PATH + "/test_files/metadata_documents/sample_document.json") as document_file:
            ontology_validator = validator.OntologyValidator(None)
            ontology_validation_report = ontology_validator.validate(json.load(document_file))

            assert ontology_validation_report.validation_state == "VALID" and len(ontology_validation_report.error_reports) == 0
