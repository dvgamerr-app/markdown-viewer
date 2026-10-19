#!/bin/bash

# set current working directory to directory of the shell script
cd "$(dirname "$0")"

# before
bun install
mkdir -p tmp

# mdc.min.js
bun x rollup --config rollup.mjs --input mdc.mjs --file tmp/mdc.js
bun x terser --compress --mangle -- tmp/mdc.js > tmp/mdc.min.js

# mdc.min.css
bun x sass --quiet-deps --silence-deprecation=import --no-source-map --load-path=node_modules/ mdc.scss tmp/mdc.css
bun x csso --input tmp/mdc.css --output tmp/mdc.min.css

# copy
cp tmp/mdc.min.* ../../vendor/

# after
rm -rf node_modules/ tmp/
