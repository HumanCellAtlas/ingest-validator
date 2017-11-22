import jsonschema
import requests
from functools import reduce


class ValidationReport:
    def __init__(self):
        self.document_state = ""
        self.error_messages = list()
        self.error_reports = list()

    @staticmethod
    def validation_report_ok():
        report = ValidationReport()
        report.document_state = "VALID"
        return report

VALIDATION_REPORT_OK = ValidationReport.validation_report_ok()

def validate(metadata, schema):
    """
    given a json document(metadata) and a json-schema(schema), validates the
    schema and returns a ValidationReport
    """
    validator = jsonschema.Draft4Validator(schema=schema)
    if validator.is_valid(instance=metadata):
        return VALIDATION_REPORT_OK
    else:
        validation_report = ValidationReport()
        validation_report.document_state = "INVALID"

        for error in validator.iter_errors(instance=metadata):
            validation_report.error_reports.append(error)
            validation_report.error_messages.append(generate_error_message(error))

        return validation_report


def generate_error_message(error):
    """
    Given an error object, generates an error message
    :param error: a jsonschema ValidationError
    :return: error message string generated from the error
    """
    path_to_error_in_document = reduce((lambda key1, key2: key1 + "." + key2), error.absolute_path) if len(error.absolute_path) > 0 else "root of document"
    return "Error: " + error.message + " at " + path_to_error_in_document


def extract_schema_url_from_document(metadata_document):
    return metadata_document["core"]["schema_url"]


def get_schema_from_url(schema_url):
    return requests.get(schema_url).json()