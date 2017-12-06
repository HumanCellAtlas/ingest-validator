import os
import unittest

from validator.fastq import Validator


class TestFastqFileValidation(unittest.TestCase):

    @classmethod
    def setUp(self):
        self.validator = Validator()

    #### single record tests###

    def test_validates_ascii(self):
        results = self.validator.validate(os.path.abspath("test_files/fastq/valid_ascii.fastq"))
        self.assertTrue(results)

    def test_fails_with_invalid_ascii(self):
        results = self.validator.validate("test_files/fastq/invalid_ascii.fastq")
        self.assertFalse(results)

    def test_correct_number_of_lines_and_valid_ascii(self):
        results = self.validator.validate("test_files/fastq/correct_num_lines_valid_ascii.fastq")
        self.assertTrue(results)

    def test_no_plus_char_on_third_line(self):
        results = self.validator.validate("test_files/fastq/no_plus_char.fastq")
        self.assertFalse(results)

    def test_no_ampersand_as_first_char(self):
        results = self.validator.validate("test_files/fastq/no_at_symbol_first_line.fastq")
        self.assertFalse(results)

    def test_big_record(self):
        results = self.validator.validate('test_files/fastq/big.fastq')
        self.assertTrue(results)

    ### multiple record tests###

    def test_validates_ascii_multiple_records(self):
        results = self.validator.validate(os.path.abspath("test_files/fastq/multiple_valid-ascii.fastq"))
        self.assertTrue(results)

    def test_invalid_multiple_records(self):
        results = self.validator.validate('test_files/fastq/multiple_non-matching-lengths.fastq')
        self.assertFalse(results)
