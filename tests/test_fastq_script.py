from unittest import TestCase
from unittest.mock import MagicMock

from script.fastq import Fastq
from validator.fastq import Validator

class TestFastqScript(TestCase):

    def test_returns_exit_0_when_valid(self):
        # given:
        validator = Validator()
        validator.validate = MagicMock(name='validate')

        # and:
        fastq = Fastq(validator)

        # when:
        path_to_file = 'path/to/file.fastq'
        fastq.execute(path_to_file)

        # then:
        validator.validate.assert_called_once_with(path_to_file)