#/bin/bash

echo "start bell setup"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo current $DIR

python -m pip install -r requirements.txt


export FLASK_APP=serve.py
gunicorn --bind=0.0.0.0 --timeout 600 "serve.py"

echo "end bell setup"

python serve.py
