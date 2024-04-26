#!/usr/bin/env bash

set -e

CWD=$(dirname $(readlink -f "$0"))

rm -f "$CWD"/*.js
tsc -p "$CWD"
chmod 744 "$CWD/convertSchema.js"
node "$CWD/convertSchema.js"