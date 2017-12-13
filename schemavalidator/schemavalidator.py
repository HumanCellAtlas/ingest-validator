import jsonschema
import requests
import common.validationreport as validationreport
import common.errorreport as errorreport
from common.missingschemaurlexception import MissingSchemaUrlException
from functools import reduce


class SchemaValidator:

    def validate(self, metadata, schema):
        """
        given a json document(metadata) and a json-schema(schema), validates the
        schema and returns a ValidationReport
        """
        validator = jsonschema.Draft4Validator(schema=schema)
        if validator.is_valid(instance=metadata):
            return validationreport.ValidationReport.validation_report_ok()
        else:
            validation_report = validationreport.ValidationReport()
            validation_report.validation_state = "INVALID"

            for error in validator.iter_errors(instance=metadata):
                validation_report.error_reports.append(errorreport.ErrorReport(self.generate_error_message(error), error, "schema validation"))

            return validation_report


    def generate_error_message(self, error):
        """
        Given an error object, generates an error message
        :param error: a jsonschema ValidationError
        :return: error message string generated from the error
        """
        path_to_error_in_document = reduce((lambda key1, key2: str(key1) + "." + str(key2)), error.absolute_path) if len(error.absolute_path) > 0 else "root of document"
        return "Error: " + error.message + " at " + path_to_error_in_document


    def extract_schema_url_from_document(self, metadata_document):
        try:
            return metadata_document["core"]["schema_url"]
        except KeyError as e:
            raise MissingSchemaUrlException("Could not find schema url for this document")


    def get_schema_from_url(self, schema_url):
        return requests.get(schema_url).json()
