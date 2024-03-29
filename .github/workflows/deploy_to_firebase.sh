#!/bin/bash

set -euo pipefail

cd app
export GOOGLE_APPLICATION_CREDENTIALS="gac.json"
echo "$1" > "$GOOGLE_APPLICATION_CREDENTIALS"
npm install -g firebase-tools@11.13.0
gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"
firebase deploy
