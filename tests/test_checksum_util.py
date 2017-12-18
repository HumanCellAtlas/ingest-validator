import os
import unittest
import json
from checksumutil.checksumutil import ChecksumUtil
BASE_PATH = os.path.dirname(__file__)

class TestChecksumUTil(unittest.TestCase):
    def test_calculate_checksum_content(self):
        with open(BASE_PATH + "/test_files/metadata_documents/sample_document.json") as sample_doc_file:
            util = ChecksumUtil()
            sample_doc_no_content = json.load(sample_doc_file)
            sample_doc = {"content": sample_doc_no_content}
            precalculated_checksum = b't\xef\xab$\x1d|/\xca1\x96;\x92\x08\x8fb9'
            checksum = util.calculate_content_checksum(sample_doc)
            assert checksum == precalculated_checksum

            # re-order the fields and assert that the checksum remains
            core_object = dict(sample_doc["content"]["core"])
            specimen_object = dict(sample_doc["content"]["specimen_from_organism"])
            del sample_doc["content"]["core"]
            del sample_doc["content"]["specimen_from_organism"]

            sample_doc["content"]["specimen_from_organism"] = specimen_object
            sample_doc["content"]["core"] = core_object

            another_checksum = util.calculate_content_checksum(sample_doc)
            assert another_checksum == precalculated_checksum

            # change values and assert that the checksum changes
            del sample_doc["content"]["core"]
            yet_another_checksum = util.calculate_content_checksum(sample_doc)
            assert not (yet_another_checksum == precalculated_checksum)