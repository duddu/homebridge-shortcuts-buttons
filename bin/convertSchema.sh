#!/usr/bin/env bash

set -e

CWD=$(dirname $(readlink -f "$0"))
OUT="$CWD/convertSchema.js"

rimraf "$OUT"
tsc -p "$CWD"
chmod 744 "$OUT"
node --disable-warning=ExperimentalWarning "$OUT" || node "$OUT"