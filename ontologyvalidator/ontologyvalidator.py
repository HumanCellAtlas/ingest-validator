import ontologyvalidator.ontologyvalidateutil as ontologyvalidateutil
import config
import logging
from common.errorreport import ErrorReport
from common.validationreport import ValidationReport
from common.criticalvalidationexception import CriticalValidationException
from common.skipvalidationexception import SkipValidationException


class OntologyValidator:

    def __init__(self, schema_base_url=None):
        self.util = ontologyvalidateutil.OntologyValidationUtil()
        self.schema_base_url = schema_base_url if schema_base_url else config.ONTOLOGY_SCHEMA_BASE_URL
        self.logger = logging.getLogger(__name__)


    def validate(self, metadata_document):
        try:
            return self.generate_validation_report(metadata_document)
        except CriticalValidationException as e:
            self.logger.critical(e, exc_info=True)

    def generate_validation_report(self, metadata_document):
        # generate a validation report for each instance of an ontology term in the document

        error_reports = list()

        for (ontology_term_field_path, ontology_term_id) in self.util.find_ontology_terms_in_document(metadata_document):
            try:
                file_name = self.util.get_ontology_schema_file_name_from_ontology_field(ontology_term_field_path)
                schema = self.util.retrieve_ontology_schema(self.schema_base_url, file_name)
                lookup_query = self.util.generate_ols_query(schema, ontology_term_id)
                lookup_response = self.util.lookup_ontology_term(lookup_query)

                if lookup_response.json()["response"]["numFound"] == 0:
                    error_reports.append(self.generate_error_report(ontology_term_field_path, ontology_term_id, lookup_response, metadata_document))
            except SkipValidationException as e:
                self.logger.info(str(e))
                continue

        validation_report = ValidationReport()

        if len(error_reports) == 0:
            validation_report = ValidationReport.validation_report_ok()
        else:
            validation_report.error_reports = error_reports
            validation_report.validation_state = "INVALID"

        return validation_report

    def generate_error_report(self, ontology_term_field_path, ontology_term_id, ols_lookup_response, metadata_document):
        error_message = "Error: ontology id \"{}\" at {} was not found in OLS or failed to validate against the metadata schema. Query generated: {}".format(ontology_term_id, ontology_term_field_path, ols_lookup_response.url)

        ontology_validation_error = OntologyValidationError()
        ontology_validation_error.absolute_path = ontology_term_field_path
        ontology_validation_error.path = ontology_term_field_path.split(".")[-2]
        ontology_validation_error.message = error_message
        ontology_validation_error.instance = metadata_document

        error_report = ErrorReport(error_message, ontology_validation_error, "ontology schema")

        return error_report


class OntologyValidationError:
    """
    Made to resemble the jsonschema ValidationError class for uniformity
    """
    def __init__(self):
        self.absolute_path = ""
        self.path = ""
        self.message = ""
        self.instance = dict()
