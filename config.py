import os

RABBITMQ_ACCESSION_QUEUE = 'ingest.metadata.accession.queue'
RABBITMQ_VALIDATION_QUEUE = 'ingest.metadata.validation.queue'

RABBITMQ_ACCESSION_QUEUE = os.environ.get('RABBITMQ_ACCESSION_QUEUE', RABBITMQ_ACCESSION_QUEUE)
RABBITMQ_VALIDATION_QUEUE = os.environ.get('RABBITMQ_VALIDATION_QUEUE', RABBITMQ_VALIDATION_QUEUE)

RABBITMQ_HOST = 'amqp://127.0.0.1'
RABBITMQ_PORT = '5672'
RABBITMQ_URL = RABBITMQ_HOST + ':' + RABBITMQ_PORT
RABBITMQ_URL = os.path.expandvars(os.environ.get('RABBIT_URL', RABBITMQ_URL))

INGEST_API_HOST = 'http://localhost'
INGEST_API_PORT = '8080'
INGEST_API_URL = INGEST_API_HOST + ':' + INGEST_API_PORT
INGEST_API_URL = os.path.expandvars(os.environ.get('INGEST_API', INGEST_API_URL))

UPLOAD_API_HOST = "https://upload.dev.data.humancellatlas.org"
UPLOAD_API_PORT = "443"
UPLOAD_API_URL = UPLOAD_API_HOST + ":" + UPLOAD_API_PORT
UPLOAD_API_URL = os.path.expandvars(os.environ.get('UPLOAD_API_URL', UPLOAD_API_URL))

UPLOAD_API_KEY = "zero-pupil-until-funny"
UPLOAD_API_KEY = os.path.expandvars(os.environ.get('UPLOAD_API_KEY', UPLOAD_API_KEY))

SCHEMA_VERSION = '4.0.0'
SCHEMA_BASE_URI = 'https://raw.githubusercontent.com/HumanCellAtlas/metadata-schema/'

ONTOLOGY_SCHEMA_BASE_URL = 'https://raw.githubusercontent.com/HumanCellAtlas/metadata-schema/4.4.0/json_schema/common/ontology'
ONTOLOGY_SCHEMA_BASE_URL = os.path.expandvars(os.environ.get('ONTOLOGY_SCHEMA_BASE_URL', ONTOLOGY_SCHEMA_BASE_URL))

JSON_SCHEMA_VALIDATION = "ACTIVE"
JSON_SCHEMA_VALIDATION = os.path.expandvars(os.environ.get('JSON_SCHEMA_VALIDATION', JSON_SCHEMA_VALIDATION))

OLS_VALIDATION = "ACTIVE"
OLS_VALIDATION = os.path.expandvars(os.environ.get('OLS_VALIDATION', OLS_VALIDATION))

FILE_VALIDATION = "ACTIVE"
FILE_VALIDATION = os.path.expandvars(os.environ.get('FILE_VALIDATION', FILE_VALIDATION))


FASTQ_VALIDATION_IMAGE = "quay.io/humancellatlas/ingest-fastq-validator"
FASTQ_VALIDATION_IMAGE = os.path.expandvars(os.environ.get('FASTQ_VALIDATION_IMAGE', FASTQ_VALIDATION_IMAGE))

FASTQ_GZ_VALIDATION_IMAGE = "quay.io/humancellatlas/ingest-fastq-validator"
FASTQ_VALIDATION_IMAGE = os.path.expandvars(os.environ.get('FASTQ_VALIDATION_IMAGE', FASTQ_VALIDATION_IMAGE))


FILE_VALIDATION_IMAGES = {"fastq": FASTQ_VALIDATION_IMAGE,
                          "fastq.gz": FASTQ_GZ_VALIDATION_IMAGE}

DEFAULT_VALIDATION_IMAGE = 'quay.io/humancellatlas/ingest-default-validator'
