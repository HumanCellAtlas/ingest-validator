import flatten_json
import hashlib
from common.criticalvalidationexception import CriticalValidationException


class ChecksumUtil:
    '''
    calculates a checksum for a piece of metadata by flattening the json, sorting and
    hashing concatenations of the iterated values
    '''
    def calculate_checksum(self, metadata_document: dict, document_type: str):
        if document_type == "FILE":
            return self.calculate_checksum_file(metadata_document)
        elif document_type == "SAMPLE":
            return self.calculate_checksum_sample(metadata_document)
        elif document_type == "ASSAY":
            return self.calculate_checksum_assay(metadata_document)
        elif document_type == "PROJECT":
            return self.calculate_checksum_project(metadata_document)
        elif document_type == "ANALYSIS":
            return self.calculate_checksum_analysis(metadata_document)
        elif document_type == "PROTOCOL":
            return self.calculate_checksum_protocol(metadata_document)


    def calculate_checksum_file(self, file_document):
        '''
        for files, we can reliably use the provided checksum in determining the validation checksum
        :param file_document:
        :return: checksum of the file's metadata
        '''
        return file_document["checksums"]["md5"] if file_document["checksums"] else ""

    def calculate_checksum_sample(self, sample_document):
        '''
        for samples, should base the checksum entirely on the "content" field
        :param sample_document:
        :return: sample_document validation checksum
        '''
        return self.calculate_content_checksum(sample_document)

    def calculate_checksum_assay(self, assay_document):
        '''
        for now just calculate based on the content field. In future might consider taking
        into consideration the files linked to the assay?
        :param assay_document:
        :return:  assay_document validation checksum
        '''
        return self.calculate_content_checksum(assay_document)

    def calculate_checksum_project(self, project_document):
        '''
        :param project_document:
        :return:  assay_document validation checksum
        '''
        return self.calculate_content_checksum(project_document)

    def calculate_checksum_protocol(self, protocol_document):
        '''
        :param assay_document:
        :return:  protocol_document validation checksum
        '''
        return self.calculate_content_checksum(protocol_document)

    def calculate_checksum_analysis(self, analysis_document):
        '''
        for now just calculate based on the content field. In future might consider taking
        into consideration the files linked to the analysis?
        :param assay_document:
        :return:  analysis_document validation checksum
        '''
        return self.calculate_content_checksum(analysis_document)

    def calculate_content_checksum(self, metadata_document: dict):
        try:
            metadata_content = metadata_document["content"]
            flattened_document = flatten_json.flatten(metadata_content)
            concatenated_values = ""
            for key,value in sorted(flattened_document.items()):
                concatenated_values += str(value)
            checksum = hashlib.md5()
            checksum.update(concatenated_values.encode('utf-8'))
            checksum_bytes = checksum.digest()
            return checksum_bytes
        except KeyError as e:
            raise CriticalValidationException("Expected content field on metadata document but none found")
