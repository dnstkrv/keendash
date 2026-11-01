#!/bin/sh
PATH=/opt/sbin:/opt/bin:/opt/usr/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PATH
printf 'Content-Type: application/json; charset=utf-8\r\n'
printf 'Access-Control-Allow-Origin: *\r\nCache-Control: no-store\r\n\r\n'
S=$(/opt/share/keendash/bin/stats)
V=$(/opt/share/keendash/bin/services)
v() { printf '%s\n' "$S" | awk -v k="$1" '$1==k{print $2; f=1; exit} END{if(!f) print 0}'; }
vn() { printf '%s\n' "$S" | awk -v k="$1" '$1==k{print $2; f=1; exit} END{if(!f) print "null"}'; }
ser() { f=/tmp/keendash/$1; [ -s "$f" ] && awk 'NR>1{printf ","}{printf "%s",$1}' "$f"; }
rows() { printf '%s\n' "$S" | awk -F'|' -v t="$1" '$1==t{ gsub(/"/,"",$2); '"$2"' }'; }

printf '{"now":%s,"tabs":[' "$(date +%s)"
printf '%s\n' "$S" | awk -F'|' '$1=="tab"{printf "%s\"%s\"", (n++?",":""), $2}'
printf '],"svc":['
printf '%s\n' "$V" | awk -F'|' '$1=="svc"{gsub(/"/,"",$2); gsub(/"/,"",$4); printf "%s[\"%s\",%s,\"%s\"]", (n++?",":""), $2,$3,$4}'
printf '],"web":['
printf '%s\n' "$V" | awk -F'|' '$1=="web"{gsub(/"/,"",$4); printf "%s[\"%s\",%s,\"%s\"]", (n++?",":""), $2,$3,$4}'
printf '],"telemt":{"ok":%s,"conn":%s,"users":%s,"cfg":%s,"up":%s,"bad":%s,"list":[' "$(v telemt_ok)" "$(v telemt_conn)" "$(v telemt_users)" "$(v telemt_cfg)" "$(v telemt_up)" "$(v telemt_bad)"
rows u 'printf "%s[\"%s\",%s,%s,%s]", (n++?",":""), $2,$3,$4,$5'
printf ']},"awg":{"up":%s,"total":%s,"tun":[' "$(v awg_up)" "$(v awg_total)"
rows tun 'printf "%s[\"%s\",%s,%s,%s,%s]", (n++?",":""), $2,$3,$4,$5,$6'
printf '],"px":['
rows px 'printf "%s[\"%s\",\"%s\",%s,%s,%s,\"%s\"]", (n++?",":""), $2,$3,$4,($5==""?0:$5),($6==""?"null":$6),$7'
printf ']},"firc":{"domains":%s,"groups":%s,"enabled":%s,"list":[' "$(v firc_domains)" "$(v firc_groups)" "$(v firc_enabled)"
rows g 'printf "%s[\"%s\",\"%s\",%s,%s]", (n++?",":""), $2,$3,$4,$5'
printf ']},"ascn":{"ips":%s,"subnets":%s,"honeypot":%s,"candidates":%s,"bans":[' "$(v ascn_ips)" "$(v ascn_subnets)" "$(v ascn_honeypot)" "$(v ascn_candidates)"
rows b 'printf "%s[\"%s\",\"%s\",%s,\"%s\"]", (n++?",":""), $2,$3,$4,$5'
printf ']},"nfq":{"run":%s,"pkts":%s,"drop":%s,"up":%s,"mem":%s,"user":%s,"auto":%s,"excl":%s,"ipsets":%s,"today":%s,"ev":[' "$(v nfq_running)" "$(v nfq_pkts)" "$(v nfq_drop)" "$(v nfq_up)" "$(v nfq_mem)" "$(v nfq_user)" "$(v nfq_auto)" "$(v nfq_excl)" "$(v nfq_ipsets)" "$(v nfq_today)"
rows n 'gsub(/"/,"",$3); gsub(/"/,"",$4); printf "%s[\"%s\",\"%s\",\"%s\"]", (n++?",":""), $2,$3,$4'
printf '],"mon":['
rows m 'printf "%s[\"%s\",%s,%s,%s]", (n++?",":""), $2,$3,$4,$5'
printf ']},"hydra":{"run":%s,"up":%s,"mem":%s,"keys":%s,"ips":%s,"list":[' "$(v hr_running)" "$(v hr_up)" "$(v hr_mem)" "$(v hr_keys)" "$(v hr_ips)"
rows hr 'printf "%s[\"%s\",%s,%s,%s,%s]", (n++?",":""), $2,$3,$4,$5,$6'
printf ']},"sys":{"load":%s,"mem":%s,"memtotal":%s,"temp":%s,"disk":%s,"free":%s,"up":%s}' "$(v sys_load)" "$(v sys_mem)" "$(v sys_memtotal)" "$(vn sys_temp)" "$(v sys_disk)" "$(v sys_free)" "$(v sys_uptime)"
printf ',"series":{'
sep=''
for k in telemt_conn telemt_octets awg_bytes awg_up firc_domains ascn_ips ascn_honeypot nfq_pkts nfq_auto hr_ips sys_load sys_mem sys_temp; do
  printf '%s"%s":[%s]' "$sep" "$k" "$(ser $k)"; sep=','
done
printf '}'
# update: installed version, newer one from the feed (bin/update check), upgrade in progress
cur=$(awk '/^Version:/{print $2}' /opt/lib/opkg/info/keendash.control 2>/dev/null)
new=$(cat /tmp/keendash/upd.new 2>/dev/null); [ "$new" = "$cur" ] && new=
busy=0; [ -f /tmp/keendash/upd.busy ] && kill -0 "$(cat /tmp/keendash/upd.busy)" 2>/dev/null && busy=1
printf ',"upd":{"cur":"%s","new":"%s","busy":%s}}\n' "$cur" "$new" "$busy"
