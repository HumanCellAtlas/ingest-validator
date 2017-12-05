import ontologyvalidator.ontologyvalidator as ontologyvalidator
import schemavalidator.schemavalidator as schemavalidator
import common.validationreport as validationreport

def validate(metadata_document):
    schema_validator = schemavalidator.SchemaValidator()
    json_schema_url = schema_validator.extract_schema_url_from_document(metadata_document)
    json_schema = schema_validator.get_schema_from_url(json_schema_url)
    schema_validation_report = schema_validator.validate(metadata_document, json_schema)

    ontology_validator = ontologyvalidator.OntologyValidator()
    ontology_validation_report = ontology_validator.validate(metadata_document)

    return merge_validation_reports(schema_validation_report, ontology_validation_report)


def merge_validation_reports(report_a, report_b):
    merged_validation_state = "VALID" if report_a.validation_state == "VALID" and report_b.validation_state == "VALID" else "INVALID"

    merged_validation_errors = list()
    merged_validation_errors.extend(report_a.error_reports)
    merged_validation_errors.extend(report_b.error_reports)

    return validationreport.ValidationReport(merged_validation_state, merged_validation_errors)