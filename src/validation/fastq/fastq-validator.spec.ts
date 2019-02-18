import FastqValidator from "./fastq-validator";
import IngestClient from "../../utils/ingest-client/ingest-client";
import {FileResource, IngestConnectionProperties, MetadataResource} from "../../common/types";

describe("Fastq validator tests", () => {

    const mockFastqValidatorInstance = () => {
        const mockIngestConnectionParams: IngestConnectionProperties = {
            scheme: "http",
            host: "mock-ingest-host",
            port: 80
        };

        const mockIngestClient: IngestClient = new IngestClient(mockIngestConnectionParams);
        return new FastqValidator(mockIngestClient);
    };

    const mockFileResource: any = {
        content: {
            file_core: {
                file_format: "fastq.gz"
            }
        },
        cloudUrl: "s3://mock-cloud-url",
        _links : {
            self: {
                href: "http://mock-file-resource-uri"
            }
        }
    };


    test("it should correctly determine if a metadata resource is a file", () => {
        const resourceType: string = "FILE";
        expect(FastqValidator._isFile(resourceType)).toBeTruthy();
    });

    test("it should identify fastqs from the file-format file of File resources", () => {
        const mockFileResource: FileResource = {
            content: {
                file_core: {
                    file_format: "fastq.gz"
                }
            },
            cloudUrl: "s3://mock-cloud-url",
            _links : {
                self: {
                    href: "http://mock-file-resource-uri"
                }
            }
        };

        expect(FastqValidator._isFastq(mockFileResource)).toBeTruthy();

        mockFileResource.content.file_core.file_format = "fastq";
        expect(FastqValidator._isFastq(mockFileResource)).toBeTruthy();
    });


    test("it should parse metadata resources", () => {
        const parsedMockFileResource: MetadataResource = FastqValidator._parseMetadataResource(mockFileResource);
        expect(parsedMockFileResource).toMatchObject(mockFileResource);
    });

    test("it should parse File resources", () => {
        const parsedMockFileResource: MetadataResource = FastqValidator._parseFileResource(mockFileResource);
        expect(parsedMockFileResource).toMatchObject(mockFileResource);
    });

    test("it should correctly determine if a metatdata resource is eligible for fastq validation", () => {
        expect(FastqValidator._isResourceEligible(mockFileResource, "FILE")).toBeTruthy();
        expect(FastqValidator._isResourceEligible(mockFileResource, "BIOMATERIAL")).toBeFalsy();

        const mockNonFileResource: MetadataResource = {
            content: {
                some_field: "some value"
            },
            _links : {
                self: {
                    href: "http://mock-file-resource-uri"
                }
            }
        };

        expect(FastqValidator._isResourceEligible(mockNonFileResource, "FILE")).toBeFalsy();
    });
});