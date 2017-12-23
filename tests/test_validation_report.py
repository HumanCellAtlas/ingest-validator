from unittest import TestCase

from common.validationreport import ValidationReport


class TestValidationReport(TestCase):

    def test_from_job_results_dict(self):
        # given:
        report_map_valid = { 'validation_state': 'VALID', 'validation_errors': [] }

        # and:
        error_message = 'validation error'
        report_map_invalid = {  'validation_state': 'INVALID', 'validation_errors': [
            { 'user_friendly_message': error_message}
        ] }

        # when:
        report_valid = ValidationReport.from_job_results_dict(report_map_valid)
        report_invalid = ValidationReport.from_job_results_dict(report_map_invalid)

        # then:
        self.assertEqual(report_map_valid['validation_state'], report_valid.validation_state)
        self.assertEqual(0, len(report_valid.error_reports))

        # and:
        self.assertEqual(report_map_invalid['validation_state'], report_invalid.validation_state)
        self.assertEqual(1, len(report_invalid.error_reports))
        self.assertEqual(error_message, report_invalid.error_reports[0].message)

    def test_from_job_results_errors_optional(self):
        # given:
        report_map_no_errors = { 'validation_state': 'VALID' }

        # when:
        report = ValidationReport.from_job_results_dict(report_map_no_errors)

        # then:
        self.assertEqual(report_map_no_errors['validation_state'], report.validation_state)
        self.assertEqual(0, len(report.error_reports))