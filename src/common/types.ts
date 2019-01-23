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
}

export = ts;