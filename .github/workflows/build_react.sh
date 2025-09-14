#!/bin/bash

set -euo pipefail

cd app/nflstream
npm install --no-audit
yarn build
