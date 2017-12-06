import ontologyvalidator.ontologyvalidator as ontologyvalidator
import schemavalidator.schemavalidator as schemavalidator
import common.validationreport as validationreport
import config
from functools import reduce

DO_JSON_SCHEMA_VALIDATION = config.JSON_SCHEMA_VALIDATION
DO_OLS_VALIDATION = config.OLS_VALIDATION

def validate(metadata_document):
    validation_reports = list()

    if DO_JSON_SCHEMA_VALIDATION == "ACTIVE":
        schema_validator = schemavalidator.SchemaValidator()
        json_schema_url = schema_validator.extract_schema_url_from_document(metadata_document)
        json_schema = schema_validator.get_schema_from_url(json_schema_url)
        schema_validation_report = schema_validator.validate(metadata_document, json_schema)
        validation_reports.append(schema_validation_report)

    if DO_OLS_VALIDATION == "ACTIVE":
        ontology_validator = ontologyvalidator.OntologyValidator()
        ontology_validation_report = ontology_validator.validate(metadata_document)
        validation_reports.append(ontology_validation_report)

    # reduce the validation reports into a single report using merge_validation_reports() and an initial valid report
    return reduce(lambda validation_report, another_validation_report: merge_validation_reports(validation_report, another_validation_report),
                  validation_reports,
                  validationreport.ValidationReport.validation_report_ok())


def merge_validation_reports(report_a, report_b):
    merged_validation_state = "VALID" if report_a.validation_state == "VALID" and report_b.validation_state == "VALID" else "INVALID"

    merged_validation_errors = list()
    merged_validation_errors.extend(report_a.error_reports)
    merged_validation_errors.extend(report_b.error_reports)

    return validationreport.ValidationReport(merged_validation_state, merged_validation_errors)