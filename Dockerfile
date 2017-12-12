FROM python:3.6.3-alpine
MAINTAINER Alegria Aclan "aaclan@ebi.ac.uk"

RUN mkdir /app
COPY config.py messagereceiver.py validationprocessor.py ingestapi.py validation-app.py requirements.txt /app/
ADD validator /app/validator
ADD common /app/common
ADD ontologyvalidator /app/ontologyvalidator
ADD schemavalidator /app/schemavalidator


WORKDIR /app

RUN pip install -r /app/requirements.txt

ENV INGEST_API=http://localhost:8080
ENV ONTOLOGY_SCHEMA_BASE_URL=https://github.com/HumanCellAtlas/metadata-schema/tree/4.2.0/json_schema/ontology_json
ENV JSON_SCHEMA_VALIDATION=ACTIVE
ENV OLS_VALIDATION=ACTIVE

EXPOSE 5000
ENTRYPOINT ["python"]
CMD ["validation-app.py"]