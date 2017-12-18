from ontologyvalidator.ontologyvalidator import OntologyValidator
from schemavalidator.schemavalidator import SchemaValidator
from filevalidator.filevalidator import FileValidator
from common.validationreport import ValidationReport
from common.errorreport import ErrorReport
from common.missingschemaurlexception import MissingSchemaUrlException
import config
from functools import reduce

DO_JSON_SCHEMA_VALIDATION = config.JSON_SCHEMA_VALIDATION
DO_OLS_VALIDATION = config.OLS_VALIDATION
DO_FILE_VALIDATION = config.FILE_VALIDATION


def validate(metadata_document, entity_link, document_type):
    validation_reports = list()

    if DO_JSON_SCHEMA_VALIDATION == "ACTIVE":
        schema_validation_report = do_schema_validation(metadata_document)
        validation_reports.append(schema_validation_report)
        # file validation depends on successful schema validation
        if DO_FILE_VALIDATION == "ACTIVE" and document_type == "FILE" and schema_validation_report.validation_state == "VALID":
            file_validation_report = do_file_validation(metadata_document, entity_link)
            validation_reports.append(file_validation_report)

    if DO_OLS_VALIDATION == "ACTIVE":
        ontology_validation_report = do_ontology_validation(metadata_document)
        validation_reports.append(ontology_validation_report)

    # reduce the validation reports into a single report using merge_validation_reports() and an initial valid report
    return reduce(lambda validation_report, another_validation_report: merge_validation_reports(validation_report, another_validation_report),
                  validation_reports,
                  ValidationReport.validation_report_ok())


def do_file_validation(metadata_document: dict, entity_link: str):
    try:
        file_validator = FileValidator()
        file_validation_report = file_validator.validate(metadata_document, entity_link)
        return file_validation_report
    except Exception as e:
        return ValidationReport.unknown_exception_report(e)


def do_ontology_validation(metadata_document: dict):
    try:
        ontology_validator = OntologyValidator()
        ontology_validation_report = ontology_validator.validate(metadata_document)
        return ontology_validation_report
    except Exception as e:
        return ValidationReport.unknown_exception_report(e)


def do_schema_validation(metadata_document: dict):
    try:
        schema_validator = SchemaValidator()
        json_schema_url = schema_validator.extract_schema_url_from_document(metadata_document)
        json_schema = schema_validator.get_schema_from_url(json_schema_url)
        schema_validation_report = schema_validator.validate(metadata_document, json_schema)
        return schema_validation_report
    except MissingSchemaUrlException as e:
        missing_schema_report = ValidationReport("INVALID")
        missing_schema_report.error_reports.append(ErrorReport("No schema url specified at core.schema_url for this document. Please contact your broker"))
        return missing_schema_report
    except Exception as e:
        return ValidationReport.unknown_exception_report(e)

def merge_validation_reports(report_a, report_b):
    # if any report is INVALID, the final report is INVALID
    # otherwise, if any report is VALIDATING, the final report is VALIDATING
    # otherwise, the final report is VALID
    if report_a.validation_state == "INVALID" or report_b.validation_state == "INVALID":
        merged_validation_state = "INVALID"
    elif report_a.validation_state == "VALIDATING" or report_b.validation_state == "VALIDATING":
        merged_validation_state = "VALIDATING"
    else:
        merged_validation_state = "VALID"

    merged_validation_errors = list()
    merged_validation_errors.extend(report_a.error_reports)
    merged_validation_errors.extend(report_b.error_reports)

    return ValidationReport(merged_validation_state, merged_validation_errors)
