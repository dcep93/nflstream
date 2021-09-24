#!/bin/bash

set -euo pipefail

cd app/nflstream
cd src/nflstream
printf "const recorded_sha = \"%s %s\";\nexport default recorded_sha;\n" "$(TZ='America/Los_Angeles' date)" "$(git rev-parse HEAD)" > recorded_sha.tsx
