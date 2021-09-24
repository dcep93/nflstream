#!/bin/bash

set -euo pipefail

cd app/nflstream
npm install
yarn build
rm -rf node_modules
