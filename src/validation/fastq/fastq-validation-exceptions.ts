namespace fastqValidatorExceptions {
    export class FileResourceParseError extends Error {}
    export class MetadataResourceParseError extends Error {}
    export class SingleProcessAssertionError extends Error {}
    export class SinglePairedEndSiblingAssertionError extends Error {}
}

export = fastqValidatorExceptions