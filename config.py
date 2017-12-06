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

SCHEMA_VERSION = '4.0.0'
SCHEMA_BASE_URI = 'https://raw.githubusercontent.com/HumanCellAtlas/metadata-schema/'

ONTOLOGY_SCHEMA_BASE_URL = 'https://raw.githubusercontent.com/HumanCellAtlas/metadata-schema/v5_prototype/json_schema/common/ontology'
ONTOLOGY_SCHEMA_BASE_URL = os.path.expandvars(os.environ.get('ONTOLOGY_SCHEMA_BASE_URL', ONTOLOGY_SCHEMA_BASE_URL))

JSON_SCHEMA_VALIDATION = "ACTIVE"
JSON_SCHEMA_VALIDATION = os.path.expandvars(os.environ.get('JSON_SCHEMA_VALIDATION', JSON_SCHEMA_VALIDATION))

OLS_VALIDATION = "ACTIVE"
OLS_VALIDATION = os.path.expandvars(os.environ.get('OLS_VALIDATION', OLS_VALIDATION))
