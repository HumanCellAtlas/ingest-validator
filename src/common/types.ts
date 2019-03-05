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
        checksums: FileChecksums,
        jobCompleted: boolean
    }

    export type FileSpecificResource = {
        content: {
            file_core : {
                file_format: string
            }
        }
        cloudUrl: string;
    }

    export type MetadataResource = {
        content: any;
        uuid: {
            uuid: string
        }
        _links: {
            self: {
                href: string
            }
        }
    }

    export type FileResource = FileSpecificResource & MetadataResource;

    export type ValidationPlan = {
        validationImage: FileValidationImage,
        fileCloudUrls: string[]
    }

    export type FastqValidationContext = {
        numFastqs: number,
        fastqUris: string[],
        pairedness: boolean
    }

    export type FastqValidationPlan = {
        doValidation: boolean,
        fastqValidationContext: FastqValidationContext;
    }
}

export = ts;