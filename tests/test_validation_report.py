from unittest import TestCase

from common.validationreport import ValidationReport


class TestValidationReport(TestCase):

    def test_from_job_results_dict(self):
        # given:
        report_map = { 'validation_state': 'VALID', 'validation_errors': [] }

        # when:
        report = ValidationReport.from_job_results_dict(report_map)

        # then:
        self.assertEqual(report_map['validation_state'], report.validation_state)
        self.assertEqual(0, len(report.error_reports))