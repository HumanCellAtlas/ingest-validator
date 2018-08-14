#!/usr/bin/env sh

echo "Attempting to connect to Ingest Core..."
until $(curl -sSf ${INGEST_API} > /dev/null); do
    printf "."
    sleep 5
done

echo "Ingest Core reached!"

python validation-app.py