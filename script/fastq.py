class Fastq:

    def __init__(self, validator):
        self.validator = validator

    def execute(self, file_path):
        self.validator.validate(file_path)