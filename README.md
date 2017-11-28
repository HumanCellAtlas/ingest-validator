<a href="https://codeclimate.com/github/HumanCellAtlas/ingest-validator/maintainability"><img src="https://api.codeclimate.com/v1/badges/acb71b5e1472ff38cbb2/maintainability" /></a>
<a href="https://codecov.io/gh/HumanCellAtlas/ingest-validator">
  <img src="https://codecov.io/gh/HumanCellAtlas/ingest-validator/branch/master/graph/badge.svg" alt="Codecov" />
</a>
# HCA ingest validation service

Scripts for metadata validation 
 
To run scripts locally you'll need python 2.7 and all the dependencies in [requirements.txt](requirements.txt).


```
pip install -r requirements.txt
```

# CLI application 
## Validation service

This script listens for messages from ingest API messaging queue and validates each metadata created in the ingest service

```
python validation-app.py
```

