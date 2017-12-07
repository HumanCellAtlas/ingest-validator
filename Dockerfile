FROM frolvlad/alpine-python3
MAINTAINER Alegria Aclan "aaclan@ebi.ac.uk"

RUN mkdir /app
COPY config.py messagereceiver.py validationprocessor.py ingestapi.py validation-app.py requirements.txt /app/
ADD validator /app/validator

WORKDIR /app

RUN pip install -r /app/requirements.txt

ENV INGEST_API=http://localhost:8080

EXPOSE 5000
ENTRYPOINT ["python"]
CMD ["validation-app.py"]
