#!/bin/bash

set -euo pipefail

cd app/nflstream
npm install
yarn build
