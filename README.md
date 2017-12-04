<a href="https://codeclimate.com/github/HumanCellAtlas/ingest-validator/maintainability"><img src="https://api.codeclimate.com/v1/badges/acb71b5e1472ff38cbb2/maintainability" /></a>
<a href="https://codecov.io/gh/HumanCellAtlas/ingest-validator">
  <img src="https://codecov.io/gh/HumanCellAtlas/ingest-validator/branch/master/graph/badge.svg" alt="Codecov" />
</a>
[![Build Status](https://travis-ci.org/HumanCellAtlas/ingest-validator.svg?branch=master)](https://travis-ci.org/HumanCellAtlas/ingest-validator)

# HCA ingest validation service

Scripts for metadata validation 

## Python's `virtualenv`

To easily facilitate development for this project, `virtualenv` tool for Python is used to package together all the 
necessary modules with their respective specific versions. The documentation for setting up `virtualenv` can be found 
on [Python 3's official documentation](https://packaging.python.org/guides/installing-using-pip-and-virtualenv).

### Development Environment

This project has been set up with a `development` environment through Python's `virtualenv`. To activate development, 
the following command be can be executed relative the the project's root directory.

    source development/bin/activate
    
Alternatively, the `source` command can be replaced with the `.` command:

    . development/bin/activate
    
When the virtual environment is activated, the command line prompt should indicate its name. To leave the virtual environment, the following command is used:

    deactivate  
 
## Dependencies

### Packaged Dependencies with `virtualenv`

With `virtualenv`, it is possible to package requirements in the virtual environments themselves. When working inside a 
virtual environment, any dependencies installed through `pip` will automatically be added as part of that particular 
environment. It is then advised that the changes in the environment related to newly installed dependencies be 
committed as part of version control.

### Installing Dependencies

With most of the dependencies already added as part of the virtual environment, the scripts should run successfully when
the correct virtual environment is active. However, it is also best to keep a list of dependencies that can be installed
in batch through `pip`. 

Such dependencies are listed in the [`requirements.txt`](requirements.txt) and may be installed in batch through the
following command:

```
pip install -r requirements.txt
```


# CLI application 
## Validation service

This script listens for messages from ingest API messaging queue and validates each metadata created in the ingest service

```
python validation-app.py
```

Metadata JSON documents are validated against specified schemas. <a href="https://github.com/HumanCellAtlas/metadata-schema/tree/master/json_schema">A list of the current applicable schemas are located here</a>.
Documents must specify the schema against which they are to be validated. The URL of the schema must be located at the JSON path core.schema_url within the JSON document
After validation has completed, a validation report will be attached to the metadata document living in the ingestion-infrastructure database at api.ingest.dev.data.humancellatlas.org
