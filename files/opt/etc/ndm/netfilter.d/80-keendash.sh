#!/bin/sh
# keendash: open keendashd's HTTPS port (/tmp/keendash/tls/port, written by S81keendash while HTTPS is on).
# NDMS rebuilds the firewall from time to time and runs this hook afterwards, S81keendash runs it at start.
# NDMS's PATH has no /opt/sbin, where Entware's iptables is; -w waits for the xtables lock NDMS may still hold.
# The rule carries a comment: plain "--dport N -j ACCEPT" rules get removed within seconds on some routers
# (another firewall manager cleaning up); without the comment module a plain rule is the fallback.
PATH=/opt/sbin:/opt/bin:/usr/sbin:/usr/bin:/sbin:/bin
[ "$type" = iptables ] && [ "$table" = filter ] || exit 0
p=$(cat /tmp/keendash/tls/port 2>/dev/null)
[ -n "$p" ] || exit 0
iptables -w -C INPUT -p tcp --dport "$p" -m comment --comment keendash -j ACCEPT 2>/dev/null ||
  iptables -w -I INPUT -p tcp --dport "$p" -m comment --comment keendash -j ACCEPT 2>/dev/null ||
  iptables -w -C INPUT -p tcp --dport "$p" -j ACCEPT 2>/dev/null || iptables -w -I INPUT -p tcp --dport "$p" -j ACCEPT
exit 0
