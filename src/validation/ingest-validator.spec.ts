import IngestValidator from "./ingest-validator";
import SchemaValidator from "./schema-validator";
import IngestClient from "../utils/ingest-client/ingest-client";
import Promise from "bluebird";
import * as TypeMoq from "typemoq";
import IngestFileValidator from "../utils/ingest-client/ingest-file-validator";
import ValidationReport from "../model/validation-report";
import {IElixirValidator} from "../common/types";


describe("Ingest validator tests", () =>{

    it("should correctly parse file formats from file names", () => {
        let fileName = "aaaa.fastq.gz";
        let format = IngestValidator.fileFormatFromFileName(fileName);
        expect(format).toBe("fastq.gz");
    });

    it("should return an INVALID ValidationReport when describedBy schema can't be retrieved", () => {
        const mockSchemaValidator: TypeMoq.IMock<IElixirValidator> = TypeMoq.Mock.ofType<IElixirValidator>();
        const mockIngestClient: TypeMoq.IMock<IngestClient> = TypeMoq.Mock.ofType<IngestClient>();
        const mockFileValidator: TypeMoq.IMock<IngestFileValidator> = TypeMoq.Mock.ofType<IngestFileValidator>();

        const badUrl = "badUrl";
        mockIngestClient
            .setup(mockInstance => mockInstance.fetchSchema(TypeMoq.It.isValue(badUrl)))
            .returns(() => Promise.reject(new Error()));

        const ingestValidator = new IngestValidator(mockSchemaValidator.object, mockFileValidator.object, mockIngestClient.object);
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