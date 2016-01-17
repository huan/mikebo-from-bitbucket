cat $1/*.js \
  | grep -iv ^\\s*$ \
  | grep -v ^\\s*// \
  | grep  -v ^\\s*/\\* \
  | grep -v ^\\s*\\* \
  | wc -l
