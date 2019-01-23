namespace ts {
    export type RabbitConnectionProperties = {
        scheme: string;
        host: string;
        port: number;
    }

    export type HttpConnectionProperties = {
        scheme: string;
        host: string;
        port: number;
    }

    export type IngestConnectionProperties = HttpConnectionProperties;
    export type UploadApiConnectionProperties = HttpConnectionProperties;

    export type FileValidationImage = {
        fileFormat: string;
        imageUrl: string;
    }

    export type FileValidationRequest = {
        fileName: string,
        uploadAreaUuid: string,
        validationImageUrl: string
    }

    export type FileChecksums = {
        sha1: string,
        sha256: string,
        crc32c: string,
        s3_etag: string
    }

    export type ValidationJob = {
        validationId: string,
        checksums: FileChecksums
    }
}

export = ts;