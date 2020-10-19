import IngestValidator from "./ingest-validator";
import SchemaValidator from "./schema-validator";
import IngestClient from "../utils/ingest-client/ingest-client";
import Promise from "bluebird";
import * as TypeMoq from "typemoq";
import ValidationReport from "../model/validation-report";


describe("Ingest validator tests", () =>{

    it("should correctly parse file formats from file resources", () => {
        let fileResource = {
            "content": {
                "file_core": {
                    "format": "fastq.gz"
                }
            }
        };
        let format = fileResource['content']['file_core']['format'];
        expect(format).toBe("fastq.gz");
    });

    it("should return an INVALID ValidationReport when describedBy schema can't be retrieved", () => {
        const mockSchemaValidator: TypeMoq.IMock<SchemaValidator> = TypeMoq.Mock.ofType<SchemaValidator>();
        const mockIngestClient: TypeMoq.IMock<IngestClient> = TypeMoq.Mock.ofType<IngestClient>();

        const badUrl = "badUrl";
        mockIngestClient
            .setup(mockInstance => mockInstance.fetchSchema(TypeMoq.It.isValue(badUrl)))
            .returns(() => Promise.reject(new Error()));

        const ingestValidator = new IngestValidator(mockSchemaValidator.object, mockIngestClient.object);
        const documentErroneousDescribedBy: object = {
            "content": {
                "describedBy": "badUrl"
            }
        };

        ingestValidator.validate(documentErroneousDescribedBy, "someDocumentType")
            .then((rep: ValidationReport) => {
                expect(rep.validationState).toBe("INVALID");
            })
    });
});
