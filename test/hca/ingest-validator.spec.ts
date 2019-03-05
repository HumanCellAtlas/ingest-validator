/**
 * Created by rolando on 14/08/2018.
 */
import IngestValidator from "../../src/validation/ingest-validator";


test("file format from file name", () => {

    let fileName = "aaaa.fastq.gz";
    let format = IngestValidator.fileFormatFromFileName(fileName);
    expect(format).toBe("fastq.gz");

    fileName = "cookbook.json";
    format = IngestValidator.fileFormatFromFileName(fileName);
    expect(format).toBe("json");

});
