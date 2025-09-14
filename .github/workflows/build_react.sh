#!/bin/bash

set -euo pipefail

cd app/nflstream
mkdir -p node_modules
ls node_modules
echo 8
npm install
yarn build
ls node_modules
echo 12
