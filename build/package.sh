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
rm -f ../markdown-viewer.zip
mkdir -p ../themes
mkdir -p ../vendor

# build deps
sh bootstrap/build.sh
sh csso/build.sh
sh markdown-it/build.sh
sh marked/build.sh
sh mathjax/build.sh
sh mdc/build.sh
sh mermaid/build.sh
sh mithril/build.sh
sh panzoom/build.sh
sh prism/build.sh
sh remark/build.sh
sh themes/build.sh $browser

# copy files, staged in dist/tmp so a loaded dist/markdown-viewer never sees a half copy
cd ..
mkdir -p dist/tmp/markdown-viewer
cp -r background content icons options popup themes vendor LICENSE dist/tmp/markdown-viewer/

# copy manifest.json
if [ "$browser" = "chrome" ]; then
  cp manifest.chrome.json dist/tmp/markdown-viewer/manifest.json
  cp manifest.chrome.json manifest.json
elif [ "$browser" = "firefox" ]; then
  cp manifest.firefox.json dist/tmp/markdown-viewer/manifest.json
  cp manifest.firefox.json manifest.json
fi

# swap the staged folder into dist/markdown-viewer
rm -rf dist/markdown-viewer dist/markdown-viewer.zip
mv dist/tmp/markdown-viewer dist/markdown-viewer
rm -rf dist/tmp

# zip is missing from Git Bash on Windows, fall back to the bundled bsdtar
archive () {
  if command -v zip > /dev/null; then
    zip -r "$1" "$2"
  else
    "$WINDIR/System32/tar.exe" -a -c -f "$1" "$2"
  fi
}

# archive the markdown-viewer folder itself
if [ "$browser" = "chrome" ]; then
  cd dist/
  archive markdown-viewer.zip markdown-viewer
  cd ..
# archive the contents of the markdown-viewer folder
elif [ "$browser" = "firefox" ]; then
  cd dist/markdown-viewer/
  archive ../markdown-viewer.zip .
  cd ../../
fi
