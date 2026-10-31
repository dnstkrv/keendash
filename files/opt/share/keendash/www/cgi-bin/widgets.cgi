#!/bin/sh
# Lists widget scripts (widgets/*.js) for the Keenetic UI loader
printf 'Content-Type: application/json; charset=utf-8\r\n'
printf 'Access-Control-Allow-Origin: *\r\nCache-Control: no-store\r\n\r\n'
cd /opt/share/keendash/www/widgets 2>/dev/null || { echo '[]'; exit 0; }
printf '['
sep=''
for f in *.js; do
  [ -f "$f" ] || continue
  printf '%s"%s"' "$sep" "$f"; sep=','
done
printf ']\n'
