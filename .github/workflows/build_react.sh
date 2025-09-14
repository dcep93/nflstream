#!/bin/bash

set -euo pipefail

mkdir -p /tmp/github-cache

cd app/nflstream
npm install
yarn build

mv node_modules /tmp/github-cache
