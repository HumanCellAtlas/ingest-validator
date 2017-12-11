class Validator:
    PLUS_CHAR = 43
    AT_CHAR = 64

    def __init__(self):
        self.validation_results = None
        self.sequence_symbols = list()
        for symbol in "ACTGN.":
            self.sequence_symbols.append(ord(symbol))
        self.quality_score_symbols = list()
        for symbol in "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ\
            [\]^_`abcdefghijklmnopqrstuvwxyz{|}~":
            self.quality_score_symbols.append(ord(symbol))

    def validate(self, file_path):
        valid = True
        with open(file_path, 'rb') as source:
            record = list()
            for line in source:
                if not valid:
                    break
                line = line.rstrip()
                line_is_not_empty = line # added for readability
                if line_is_not_empty:
                    record.append(line)
                    record_is_ready = len(record) == 4
                    if record_is_ready:
                        valid = valid and self._validate_record(record)
                        record.clear()
                else:
                    valid = False
            valid = valid and len(record) == 0
        return valid

    def _validate_record(self, record):
        valid_identifier = self._validate_identifier_line(record[0])
        valid_bases = self._validate_bases(record[1])
        valid_plus = self._validate_plus(record[2])
        valid_quality_scores = self._validate_quality_scores(record[3])
        equal_lengths = self._validate_bases_length_equals_qc_length(record[1], record[3])
        return valid_identifier and valid_bases and valid_plus and valid_quality_scores \
               and equal_lengths

    def _validate_identifier_line(self, line):
        # is the first char @ ?
        has_at_char = line[0] == Validator.AT_CHAR
        # all ascii chars?
        all_ascii = Validator._all_ascii(line)
        return has_at_char and all_ascii

    #TODO implement case insensitive check
    def _validate_bases(self, line):
        valid = False
        has_n_char = False
        has_period = False
        for symbol in line:
            valid = symbol in self.sequence_symbols
            if valid:
                if symbol == ord("N"):
                    has_n_char = True
                if symbol == ord("."):
                    has_period = True
        return valid and not has_n_char or not has_period

    def _validate_plus(self, line):
        # is the first char a plus sign?
        has_plus_char = line[0] == Validator.PLUS_CHAR
        return has_plus_char

    def _validate_quality_scores(self, line):
        for symbol in line:
            if symbol not in self.quality_score_symbols:
                return False;
        return True

    def _validate_bases_length_equals_qc_length(self, base_line, qc_line):
        base_length = len(base_line)
        quality_length = len(qc_line)
        return base_length == quality_length

    @staticmethod
    def _all_ascii(line):
        for char in line:
            if char > 128:
                return False
        return True
