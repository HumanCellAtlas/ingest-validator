import unittest
import os

from validator import Validator

class TestFastqFileValidation(unittest.TestCase):
  #### single record tests###
  def test_validates_ascii(self):
    validator = Validator()

    results = validator.validate(os.path.abspath("data/valid_ascii.fastq"))

    self.assertTrue(results)

  def test_fails_with_invalid_ascii(self):
    validator = Validator()

    results = validator.validate("data/invalid_ascii.fastq")

    self.assertFalse(results)

  def test_correct_number_of_lines_and_valid_ascii(self):
    validator = Validator()

    results = validator.validate("data/correct_num_lines_valid_ascii.fastq")

    self.assertTrue(results)

  def test_no_plus_char_on_third_line(self):
    validator = Validator()

    results = validator.validate("data/no_plus_char.fastq")

    self.assertFalse(results)

  def test_no_ampersand_as_first_char(self):
    validator = Validator()

    results = validator.validate("data/no_at_symbol_first_line.fastq")

    self.assertFalse(results)

  ### multiple record tests###

  def test_validates_ascii_multiple_records(self):
    validator = Validator()

    results = validator.validate(os.path.abspath("data/big.fastq"))

    self.assertTrue(results)