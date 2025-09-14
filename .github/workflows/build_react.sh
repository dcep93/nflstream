#!/bin/bash

set -euo pipefail

cd app/nflstream
ls node_modules
npm install
yarn build
