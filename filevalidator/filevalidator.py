
class FileValidator:

    def __init__(self, upload_validation_service_url=""):
        self.upload_validation_service_url = upload_validation_service_url
        self.util = File