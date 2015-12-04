#!/bin/sh

GIT_STATUS=$( git status -s | wc -l )

[ "$GIT_STATUS" -gt 0 ] && {
  git status
  echo
  echo "##################################################"
  echo "there's local changes in git not commited(pushed)!"
  echo "##################################################"
  echo
  echo "run 'git commit -a' to fix it. (also suggest to run a 'git push' after that)"
  echo
  exit 
}

BASE_DIR=$(cd "$(dirname "$0")"; pwd)

GAPPS_CONFIG="$BASE_DIR/../gapps.config.json"
GAPPS_CMD="$BASE_DIR/../node_modules/.bin/gapps"

[ -e $GAPPS_CONFIG ] || {
  echo "GAPPS_CONFIG not found!"
  exit 255
}

[ -e $GAPPS_CMD ] || {
  echo "GAPPS_CMD not exist!"
  echo "npm install first"
  exit 255
}

fileId=$(grep fileId "$GAPPS_CONFIG" | cut -d'"' -f4)
path=$(grep path "$GAPPS_CONFIG" | cut -d'"' -f4)
[ -n "$fileId" && -n "$path"] || {
  echo "fileId or path not found!"
  exit 255
}

echo -n "Start pulling GAS script id: $fileId from ggoogle drive... "

mv -f "$GAPPS_CONFIG" "${GAPPS_CONFIG}.bak"

cd "$BASE_DIR/.."
$GAPPS_CMD clone $fileId $path

echo "Done."
echo
