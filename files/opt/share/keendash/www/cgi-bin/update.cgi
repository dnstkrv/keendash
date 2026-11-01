#!/bin/sh
# POST: upgrade keendash in the background. Only from a page on this router (same host as ours, any port):
# a plain POST skips CORS preflight, so the Origin check here is what stops other sites.
o=${HTTP_ORIGIN#*://}; o=${o%%[:/]*}
if [ "$REQUEST_METHOD" != POST ] || [ -z "$o" ] || [ "$o" != "${HTTP_HOST%%:*}" ]; then
  printf 'Status: 403 Forbidden\r\nContent-Type: text/plain\r\n\r\nforbidden\n'
  exit 0
fi
/opt/share/keendash/bin/update run
printf 'Content-Type: application/json\r\nAccess-Control-Allow-Origin: %s\r\nCache-Control: no-store\r\n\r\n{"ok":1}\n' "$HTTP_ORIGIN"
