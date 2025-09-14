#!/bin/bash

set -euo pipefail

cd app
export GOOGLE_APPLICATION_CREDENTIALS="gac.json"
echo "$1" > "$GOOGLE_APPLICATION_CREDENTIALS"
npm install firebase-tools@11.13.0 --no-audit
gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"
npx firebase deploy
