#!/bin/bash

set -euo pipefail

cd app/nflstream
mkdir -p node_modules
npm install
yarn build
