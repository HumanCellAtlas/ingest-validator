FROM frolvlad/alpine-python3
MAINTAINER Alegria Aclan "aaclan@ebi.ac.uk"

RUN mkdir /app
COPY config.py ingestapi.py validation-app.py requirements.txt start_up.sh /app/

RUN chmod +x /app/start_up.sh

ADD validator /app/validator
ADD common /app/common
ADD ontologyvalidator /app/ontologyvalidator
ADD schemavalidator /app/schemavalidator
ADD filevalidator /app/filevalidator
ADD listeners /app/listeners
ADD processor /app/processor


WORKDIR /app

RUN pip install -r /app/requirements.txt

ENV INGEST_API=http://localhost:8080
ENV ONTOLOGY_SCHEMA_BASE_URL=https://github.com/HumanCellAtlas/metadata-schema/tree/4.2.0/json_schema/ontology_json
ENV JSON_SCHEMA_VALIDATION=ACTIVE
ENV OLS_VALIDATION=ACTIVE

EXPOSE 5000
ENTRYPOINT ["/app/start_up.sh"]
