from common.errorreport import ErrorReport
class ValidationReport:
    def __init__(self, validation_state="", error_reports=None):
        self.validation_state = validation_state
        self.error_reports = error_reports if error_reports is not None else list()  # list of ErrorReport

    def errors_to_dict(self):
        return [error.to_dict() for error in self.error_reports]

    @staticmethod
    def validation_report_ok():
        report = ValidationReport()
        report.validation_state = "VALID"
        return report

    @staticmethod
    def validation_report_validating():
        report = ValidationReport()
        report.validation_state = "VALIDATING"
        return report

    @staticmethod
    def unknown_exception_report(e):
        exception_report = ValidationReport("INVALID")
        exception_report.error_reports.append(ErrorReport(str(e)))
        return exception_report

    @staticmethod
    def from_dict(validation_report_dict: dict):
        report = ValidationReport()
        report.validation_state = validation_report_dict["validationState"]
        return report

    @staticmethod
    def from_job_results_dict(validation_report_dict: dict):
        report = ValidationReport()
        report.validation_state = validation_report_dict["validation_state"]
        report.error_reports = [ErrorReport(error["user_friendly_message"]) for error in validation_report_dict["validation_errors"]]
        return report