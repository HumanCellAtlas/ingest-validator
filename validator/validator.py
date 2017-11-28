import jsonschema
import requests
from functools import reduce


class ErrorReport:
    """
    A user friendly error message, along with corresponding ValidationError
    """
    def __init__(self, message="", validation_error=None):
        self.message = message
        self.validation_error = validation_error
        
    def to_dict(self):
        error_report_dict = dict()

        error_report_dict["user_friendly_message"] = self.message
        
        error_report_dict["validation_error"] = dict()
        error_report_dict["validation_error"]["absolute_path"] = list(self.validation_error.absolute_path)
        error_report_dict["validation_error"]["path"] = list(self.validation_error.path)
        error_report_dict["validation_error"]["message"] = self.validation_error.message
        error_report_dict["validation_error"]["instance"] = self.validation_error.instance
        error_report_dict["validation_error"]["schema_path"] = list(self.validation_error.schema_path)
        error_report_dict["validation_error"]["absolute_schema_path"] = list(self.validation_error.absolute_schema_path)
        error_report_dict["validation_error"]["validator"] = self.validation_error.validator
        error_report_dict["validation_error"]["validator_value"] = self.validation_error.validator_value

        return error_report_dict


class ValidationReport:
    def __init__(self):
        self.validation_state = ""
        self.error_reports = list()  # list of ErrorReport

    def errors_to_dict(self):
        return [error.to_dict() for error in self.error_reports]

    @staticmethod
    def validation_report_ok():
        report = ValidationReport()
        report.validation_state = "VALID"
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
        validation_report.validation_state = "INVALID"
        
        for error in validator.iter_errors(instance=metadata):
            validation_report.error_reports.append(ErrorReport(generate_error_message(error), error))

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
    try:
        return metadata_document["core"]["schema_url"]
    except KeyError as e:
        raise("Could not find schema_url")


def get_schema_from_url(schema_url):
    return requests.get(schema_url).json()
