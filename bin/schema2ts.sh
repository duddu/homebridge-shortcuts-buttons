#!/usr/bin/env bash

set -e

CWD=$(dirname $(readlink -f "$0"))

rm -f "$CWD"/*.js
tsc -p "$CWD"
chmod 744 "$CWD/schema2ts.js"
node "$CWD/schema2ts.js"