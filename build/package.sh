#!/bin/bash

# exit if any of the intermediate steps fail
set -e

browser=$1

if [ -z "$browser" ]; then
  echo "Specify target browser"
  echo "chrome, firefox"
  exit 1
fi

# set current working directory to directory of the shell script
cd "$(dirname "$0")"

# cleanup
rm -rf ../themes
rm -rf ../vendor
rm -rf ../dist/tmp
rm -f ../nimbus-markdown.zip
mkdir -p ../themes
mkdir -p ../vendor

# build deps
sh bootstrap/build.sh
sh csso/build.sh
sh markdown-it/build.sh
sh mathjax/build.sh
sh mdc/build.sh
sh mermaid/build.sh
sh mithril/build.sh
sh panzoom/build.sh
sh prism/build.sh
sh themes/build.sh $browser

# copy files, staged in dist/tmp so a loaded dist/nimbus-markdown never sees a half copy
cd ..
mkdir -p dist/tmp/nimbus-markdown
cp -r background content icons options popup themes vendor LICENSE dist/tmp/nimbus-markdown/

# copy manifest.json
if [ "$browser" = "chrome" ]; then
  cp manifest.chrome.json dist/tmp/nimbus-markdown/manifest.json
  cp manifest.chrome.json manifest.json
elif [ "$browser" = "firefox" ]; then
  cp manifest.firefox.json dist/tmp/nimbus-markdown/manifest.json
  cp manifest.firefox.json manifest.json
fi

# swap the staged folder into dist/nimbus-markdown
rm -rf dist/nimbus-markdown dist/nimbus-markdown.zip
mv dist/tmp/nimbus-markdown dist/nimbus-markdown
rm -rf dist/tmp

# zip is missing from Git Bash on Windows, fall back to the bundled bsdtar
archive () {
  if command -v zip > /dev/null; then
    zip -r "$1" "$2"
  else
    "$WINDIR/System32/tar.exe" -a -c -f "$1" "$2"
  fi
}

# archive the nimbus-markdown folder itself
if [ "$browser" = "chrome" ]; then
  cd dist/
  archive nimbus-markdown.zip nimbus-markdown
  cd ..
# archive the contents of the nimbus-markdown folder
elif [ "$browser" = "firefox" ]; then
  cd dist/nimbus-markdown/
  archive ../nimbus-markdown.zip .
  cd ../../
fi
