#!/bin/bash

# set current working directory to directory of the shell script
cd "$(dirname "$0")"

# before
bun install

# copy
cp node_modules/bootstrap/dist/css/bootstrap.min.css ../../vendor/bootstrap.min.css

# after
rm -rf node_modules/
