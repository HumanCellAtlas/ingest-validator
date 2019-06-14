import SchemaValidator from "./schema-validator";
import CustomAjvKeyword from "../custom/custom-ajv-keyword";
import {Ajv, KeywordDefinition, SchemaValidateFunction} from "ajv";


describe("Schema validator tests", () => {

    class MockCustomKeywordClass implements CustomAjvKeyword {
        keywordName: string;

        constructor(keywordName: string) {
            this.keywordName = keywordName;
        }

        configure(ajv: Ajv) {

            const keywordDefinition: KeywordDefinition = {
                async: this.isAsync(),
                type: "string",
                validate: this.keywordFunction(),
                errors: true
            };

            ajv.addKeyword("test_keyword", keywordDefinition);
            return ajv;
        };

        keywordFunction() : SchemaValidateFunction {
            return () => {
                return new Promise((resolve, reject) => {
                    resolve();
                });
            };
        };

        isAsync(): boolean {
            return true;
        }
    }

    it("should attach custom keywords to its ajv instance", () => {
        const mockKeywordName = "test_keyword";
        const mockKeyword = new MockCustomKeywordClass(mockKeywordName);
        const schemaValidator = new SchemaValidator([mockKeyword]);
        expect(schemaValidator.ajvInstance.getKeyword(mockKeywordName)).toBeTruthy();
   });
});