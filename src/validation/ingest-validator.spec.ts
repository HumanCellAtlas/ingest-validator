import IngestValidator from "./ingest-validator";

describe("Ingest validator tests", () =>{

    it("should correctly parse file formats from file names", () => {
        let fileName = "aaaa.fastq.gz";
        let format = IngestValidator.fileFormatFromFileName(fileName);
        expect(format).toBe("fastq.gz");
    });
});