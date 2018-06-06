import unittest
import os
import ontologyvalidator.ontologyvalidateutil as ontology_validate_util
import ontologyvalidator.ontologyvalidator as validator
from common.missingschemaurlexception import MissingSchemaUrlException
from common.missingontologyclassexception import MissingOntologyClassException
import json
from unittest import mock


BASE_PATH = os.path.dirname(__file__)

class TestOntologyValidation(unittest.TestCase):
    def test_find_ontology_fields_in_document(self):
        util = ontology_validate_util.OntologyValidationUtil()

        with open(BASE_PATH + "/test_files/metadata_documents/biomaterial_document.json") as document_file:
            document = json.load(document_file)
            fields_found = util.find_ontology_terms_in_document(document)
            assert(len(fields_found) == 2 and (fields_found[0][0] == "development_stage.ontology" or fields_found[0][0] == "genus_species.0.ontology"))

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


    def mocked_ols_query(*args, **keywargs):
        class MockResponse:
            def __init__(self, json_data, status_code):
                self.json_data = json_data
                self.status_code = status_code

            def json(self):
                return self.json_data

        return MockResponse({"_embedded":
                                 {"terms": [{"iri": "http://mock-ontology-library/obo/UBERON_0000465"}]}},
                            200)

    def mocked_ols_lookup(*args, **keywargs):
        class MockResponse:
            def __init__(self, json_data, status_code):
                self.json_data = json_data
                self.status_code = status_code

            def json(self):
                return self.json_data

        return MockResponse({"_embedded":
                                 {"terms": [{"iri": "http://mock-ontology-library/obo/UBERON_0000465"}]}},
                            200)

    def mock_get_ols_class_fail(*args, **keywargs):
        raise MissingOntologyClassException("can't find ontology class")


    @mock.patch('requests.get', side_effect=mocked_get)
    def test_retrieve_ontology_validation_schema(self, mock_get):
        with open(BASE_PATH + "/test_files/schema/test_body_part_ontology_schema.json") as ontology_schema_file:
            mocked_schema = json.load(ontology_schema_file)
            util = ontology_validate_util.OntologyValidationUtil()
            retrieved_schema = util.retrieve_ontology_schema("https://somewhere-on-github/versionX/ontology_schemas", "body_part_ontology.json")
            # asserting 2 schemas are equal if the set of keys in each is equal to set of keys in the other
            assert(set(retrieved_schema.keys()).issubset(mocked_schema.keys()) and set(mocked_schema.keys()).issubset(retrieved_schema.keys()))

    @mock.patch('requests.get', side_effect=mocked_ols_query)
    def test_generate_ols_query_from_ontology_validation_schema_and_ontology_term(self, mocked_ols_get):
        with open(BASE_PATH + "/test_files/schema/test_body_part_ontology_schema.json") as ontology_schema_file:
            ontology_schema_document = json.load(ontology_schema_file)
            util = ontology_validate_util.OntologyValidationUtil("http://mock-ols/api")
            query_dict = util.generate_ols_query(ontology_schema_document, "UBERON_000ABCDEFG")
            assert(len(query_dict.keys()) == 4)



    def test_ontology_validate(self):
        with open(BASE_PATH + "/test_files/metadata_documents/biomaterial_document.json") as document_file:
            ontology_validator = validator.OntologyValidator("http://ontology.dev.data.humancellatlas.org/api")
            ontology_validation_report = ontology_validator.validate(json.load(document_file))

            assert ontology_validation_report.validation_state == "VALID" and len(ontology_validation_report.error_reports) == 0

    @mock.patch.object(ontology_validate_util.OntologyValidationUtil, 'get_iri_for_ontology_class', mock_get_ols_class_fail)
    def test_ontology_validation_unknown_root_term(self):
        with open(BASE_PATH + "/test_files/metadata_documents/biomaterial_document.json") as document_file:
            ontology_validator = validator.OntologyValidator("http://ontology.dev.data.humancellatlas.org/api")
            ontology_validation_report = ontology_validator.validate(json.load(document_file))

            assert ontology_validation_report.validation_state == "INVALID"
            assert len(ontology_validation_report.error_reports) == 2  # 2 ontology terms in the doc so 2 errors

    def test_extract_schema_url_from_metadata_no_schema_url(self):
        with open(BASE_PATH + "/test_files/metadata_documents/biomaterial_document.json") as sample_document_file:
            metadata_document = json.load(sample_document_file)
            del metadata_document["describedBy"]
            util = ontology_validate_util.OntologyValidationUtil()
            try:
                schema_url = util.extract_schema_url_from_document(metadata_document)
                assert False
            except MissingSchemaUrlException as e:
                assert True

    def test_extract_reference_url_from_schema_no_reference_url(self):
        with open(BASE_PATH + "/test_files/schema/donor_organism.json") as sample_schema_file:
            metadata_schema = json.load(sample_schema_file)
            del metadata_schema["properties"]["biomaterial_core"]["$ref"]
            util = ontology_validate_util.OntologyValidationUtil()
            try:
                schema_url = util.extract_reference_url_from_schema(metadata_schema["properties"]["biomaterial_core"])
                assert False
            except MissingSchemaUrlException as e:
                    assert True
