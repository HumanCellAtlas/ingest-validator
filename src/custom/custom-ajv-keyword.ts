import {Ajv} from "ajv";

interface CustomAjvKeyword {
    configure(ajv: Ajv) : Ajv;
    keywordFunction() : Function;
    isAsync() : Boolean;
}

export default CustomAjvKeyword;