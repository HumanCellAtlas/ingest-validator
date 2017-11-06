from functools import reduce


class Validator:
    PLUS_CHAR = 43
    AT_CHAR = 64

    def __init__(self):
        self.validation_results = None
        pass

    def validate(self, file_path):
        records = self._parse_records(file_path)
        records_validation_results = (self._validate_record(r) for r in records)
        valid = reduce(lambda val_result, next_val_result: val_result and next_val_result, records_validation_results)

        return valid

    def _validate_record(self, record):
        return self._validate_identifier_line(record[0]) \
               and self._validate_bases(record[1]) \
               and self._validate_plus(record[2]) \
               and self._validate_qc(record[3]) \
               and self._validate_bases_length_equals_qc_length(record[1], record[3])

    def _validate_identifier_line(self, line):
        # is the first char @ ?
        has_at_char = line[0] == Validator.AT_CHAR
        # all ascii chars?
        all_ascii = Validator._all_ascii(line)
        return has_at_char and all_ascii

    def _validate_bases(self, line):
        # is each character either ATCG? TODO - there's more than this, use regex
        for char in line:
            if not (char == 65 or char == 84 or char == 67 or char == 71):
                return False
        return True

    def _validate_plus(self, line):
        # is the first char a plus sign?
        has_plus_char = line[0] == Validator.PLUS_CHAR
        return has_plus_char

    def _validate_qc(self, line):
        # TODO
        return True

    def _validate_bases_length_equals_qc_length(self, base_line, qc_line):
        return len(base_line) == len(qc_line)

    @staticmethod
    def _parse_records(file_path):
        with open(file_path, "rb") as file:
            record = list()  # a record is a list of 4 lines in the fastq
            for i in range(0, 4):
                record.append(file.readline().rstrip())

            yield record

    @staticmethod
    def _all_ascii(line):
        for char in line:
            if char > 128:
                return False
        return True
