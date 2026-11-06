/* keendashd: keendash's web server and scheduler, the status JSON, and a JSON flattener for the collectors.
 *   keendashd serve <ip> <port> <www>  serve the widgets on <ip>:<port> (prints the daemon's pid once the port is bound);
 *                                     runs bin/tick 1 every minute and bin/tick 5 every 5 minutes, so no cron is needed,
 *                                     and keeps the status JSON in /tmp/mnt/.keendash for the web UI over https
 *                                     (reading its "update" file there upgrades keendash, as update.cgi does)
 *   keendashd status                  the /cgi-bin/status.cgi JSON, built from the output of bin/stats, bin/services and
 *                                     bin/settings list, and the services' data in /tmp/keendash/x
 *   keendashd json                    JSON on stdin -> "path<TAB>value" lines: records.0.series.title<TAB>Silo
 *   keendashd kvjson                  a collector's "key value" / "table|a|b" lines on stdin -> a JSON object
 * Only libc: built static with musl for every Entware architecture (scripts/build-ipk.sh). */
#define _GNU_SOURCE
#include <arpa/inet.h>
#include <ctype.h>
#include <dirent.h>
#include <errno.h>
#include <fcntl.h>
#include <math.h>
#include <netinet/in.h>
#include <poll.h>
#include <signal.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

#define SHARE "/opt/share/keendash"
#define MAXCONN 16       /* parallel requests; more are dropped */
#define MAXBODY 65536    /* POST body */
#define MAXOUT (4 << 20) /* CGI output */
#define INBOX "/opt/var/lib/keendash/inbox" /* settings messages from the web UI; tests: KEENDASH_INBOX */
#define PUB "/tmp/mnt/.keendash" /* made by S81keendash; tests: KEENDASH_PUB */

/* ---- growable string ---- */
typedef struct { char *p; size_t n, cap; } buf;
static void bput(buf *b, const char *s, size_t n) {
  if (b->n + n + 1 > b->cap) {
    size_t c = b->cap ? b->cap : 4096;
    while (b->n + n + 1 > c) c *= 2;
    char *q = realloc(b->p, c);
    if (!q) { perror("keendashd"); exit(1); }
    b->p = q; b->cap = c;
  }
  memcpy(b->p + b->n, s, n); b->n += n; b->p[b->n] = 0;
}
static void bs(buf *b, const char *s) { bput(b, s, strlen(s)); }
static void bf(buf *b, const char *fmt, ...) {
  char t[512]; va_list a; va_start(a, fmt);
  int n = vsnprintf(t, sizeof t, fmt, a); va_end(a);
  if (n < 0) return;
  bput(b, t, (size_t)n < sizeof t ? (size_t)n : sizeof t - 1);
}
static void slurp(int fd, buf *b, size_t max) {
  char t[4096]; ssize_t r;
  bput(b, "", 0);
  while ((r = read(fd, t, sizeof t)) != 0) {
    if (r < 0) { if (errno == EINTR) continue; break; }
    if (b->n + r <= max) bput(b, t, r);
  }
}

/* ======================= status JSON ======================= */
typedef struct { char **l; int n; } lines;
static lines split(char *s) {
  lines L = { NULL, 0 }; int cap = 0;
  for (char *p = s; p && *p; ) {
    char *e = strchr(p, '\n');
    if (e) *e = 0;
    if (L.n == cap) { cap = cap ? cap * 2 : 256; L.l = realloc(L.l, cap * sizeof *L.l); if (!L.l) exit(1); }
    L.l[L.n++] = p;
    p = e ? e + 1 : NULL;
  }
  return L;
}
/* command output, the command from the environment for tests */
static lines cmd(const char *env, const char *dflt, buf *b) {
  const char *c = getenv(env);
  FILE *f = popen(c && *c ? c : dflt, "r");
  bput(b, "", 0);
  if (f) { slurp(fileno(f), b, MAXOUT); pclose(f); }
  return split(b->p);
}
static void jstr(buf *b, const char *s, size_t n) {
  bs(b, "\"");
  for (size_t i = 0; i < n; i++) {
    unsigned char c = s[i];
    if (c == '"' || c == '\\') { char e[2] = { '\\', (char)c }; bput(b, e, 2); }
    else if (c < 0x20) bf(b, "\\u%04x", c);
    else bput(b, (const char *)&c, 1);
  }
  bs(b, "\"");
}
/* s[0..n) as a JSON number into out; 0 when it is not a number */
static int num(const char *s, size_t n, char out[64]) {
  size_t i = 0;
  if (!n || n >= 64) return 0;
  if (s[i] == '-') i++;
  if (i < n && s[i] == '0') i++; else while (i < n && isdigit((unsigned char)s[i])) i++;
  if (i < n && s[i] == '.') { i++; if (i == n || !isdigit((unsigned char)s[i])) i = n + 1; while (i < n && isdigit((unsigned char)s[i])) i++; }
  if (i < n && (s[i] == 'e' || s[i] == 'E')) { i++; if (i < n && (s[i] == '+' || s[i] == '-')) i++; if (i == n || !isdigit((unsigned char)s[i])) i = n + 1; while (i < n && isdigit((unsigned char)s[i])) i++; }
  if (i == n && isdigit((unsigned char)s[n - 1])) { memcpy(out, s, n); out[n] = 0; return 1; }
  /* "007", "+5", ".5": valid for awk, not for JSON */
  char t[64], *e; memcpy(t, s, n); t[n] = 0;
  double d = strtod(t, &e);
  if (*e || e == t || !isfinite(d) || isspace((unsigned char)t[0])) return 0;
  snprintf(out, 64, "%.15g", d);
  return 1;
}
static void jnum(buf *b, const char *s, size_t n, const char *dflt) {
  char t[64];
  bs(b, num(s, n, t) ? t : dflt);
}
/* value of a "key value" line (awk's $2 where $1 == key) */
static const char *val(lines *L, const char *k, size_t *vn) {
  size_t kl = strlen(k);
  for (int i = 0; i < L->n; i++) {
    const char *s = L->l[i];
    while (*s == ' ' || *s == '\t') s++;
    if (strncmp(s, k, kl) || (s[kl] && s[kl] != ' ' && s[kl] != '\t')) continue;
    s += kl;
    while (*s == ' ' || *s == '\t') s++;
    *vn = strcspn(s, " \t\r");
    return s;
  }
  return NULL;
}
/* "json=stats ..." pairs; a missing or broken value is 0, or null with "json=?stats" */
static void kv(buf *b, lines *S, const char *spec) {
  char t[1024], *save, *w; int first = 1;
  snprintf(t, sizeof t, "%s", spec);
  for (w = strtok_r(t, " ", &save); w; w = strtok_r(NULL, " ", &save)) {
    char *k = strchr(w, '='), out[64]; size_t n;
    *k++ = 0;
    int null = *k == '?'; k += null;
    const char *v = val(S, k, &n);
    bf(b, "%s\"%s\":%s", first ? "" : ",", w, v && num(v, n, out) ? out : null ? "null" : "0");
    first = 0;
  }
}
/* comma-separated numbers, broken ones skipped */
static void nums(buf *b, const char *s, size_t n, char sep) {
  int first = 1; char out[64];
  for (size_t i = 0; i < n; ) {
    size_t j = i;
    while (j < n && s[j] != sep) j++;
    if (num(s + i, j - i, out)) { if (!first) bs(b, ","); bs(b, out); first = 0; }
    i = j + 1;
  }
}
/* one field: s string, n number (0 if empty), N number or null, v number or string, a comma list of strings */
static void fld(buf *b, const char *f, size_t n, char t) {
  char out[64];
  if (t == 's') jstr(b, f, n);
  else if (t == 'v') { if (num(f, n, out)) bs(b, out); else jstr(b, f, n); }
  else if (t == 'a') {
    bs(b, "[");
    for (size_t i = 0, j; i < n; i = j + 1) { j = i; while (j < n && f[j] != ',') j++; if (i) bs(b, ","); jstr(b, f + i, j - i); }
    bs(b, "]");
  } else jnum(b, f, n, t == 'N' ? "null" : "0");
}
/* "tag|f2|f3..." lines as JSON arrays, one fld() letter per field; a leading "=" prints the single field bare instead of an array */
static void rows(buf *b, lines *L, const char *tag, const char *spec) {
  size_t tl = strlen(tag); int first = 1, one = *spec == '=';
  spec += one;
  for (int i = 0; i < L->n; i++) {
    const char *f = L->l[i];
    if (strncmp(f, tag, tl) || f[tl] != '|') continue;
    f += tl + 1;
    bs(b, first ? (one ? "" : "[") : (one ? "," : ",["));
    first = 0;
    for (int j = 0; spec[j]; j++) {
      size_t n = strcspn(f, "|\r");
      if (j) bs(b, ",");
      fld(b, f, n, spec[j]);
      f += n; if (*f == '|') f++;
    }
    if (!one) bs(b, "]");
  }
}
/* the value of the first "tag|value" line as a string, null without one */
static void one(buf *b, lines *L, const char *tag) {
  size_t tl = strlen(tag);
  for (int i = 0; i < L->n; i++)
    if (!strncmp(L->l[i], tag, tl) && L->l[i][tl] == '|') { const char *v = L->l[i] + tl + 1; jstr(b, v, strcspn(v, "\r")); return; }
  bs(b, "null");
}
/* length of a collector's key ([a-z0-9_]+) followed by " " or "|" (into *sep), 0 for any other line */
static size_t kname(const char *s, char *sep) {
  size_t n = 0;
  while ((s[n] >= 'a' && s[n] <= 'z') || isdigit((unsigned char)s[n]) || s[n] == '_') n++;
  *sep = s[n];
  return n && (s[n] == ' ' || s[n] == '|') ? n : 0;
}
/* a collector's output as a JSON object: "key value" and "~key value" -> a number, a list of numbers ("1,2,3") or a string;
 * "table|a|b" lines -> "table":[["a","b"],...]; other lines are skipped, the first line of a key wins */
static void kvjson(buf *o, const char *text) {
  char *t = strdup(text), sep, ps, out[64]; int first = 1;
  if (!t) exit(1);
  lines L = split(t);
  bs(o, "{");
  for (int i = 0; i < L.n; i++) {
    const char *s = L.l[i] + (L.l[i][0] == '~'); size_t k = kname(s, &sep), m = strcspn(s, "\r");
    if (!k) continue;
    int seen = 0;
    for (int j = 0; j < i && !seen; j++) { const char *p = L.l[j] + (L.l[j][0] == '~'); seen = kname(p, &ps) == k && !strncmp(p, s, k); }
    if (seen) continue;
    bs(o, first ? "\"" : ",\""); first = 0;
    bput(o, s, k); bs(o, "\":");
    if (sep == ' ') {
      const char *v = s + k + 1; size_t vn = m - k - 1;
      int list = memchr(v, ',', vn) != NULL;
      for (size_t x = 0, y; list && x <= vn; x = y + 1) { y = x; while (y < vn && v[y] != ',') y++; list = num(v + x, y - x, out); }
      if (list) { bs(o, "["); nums(o, v, vn, ','); bs(o, "]"); } else fld(o, v, vn, 'v');
      continue;
    }
    for (int j = i; j < L.n; j++) {
      const char *p = L.l[j] + (L.l[j][0] == '~');
      if (kname(p, &ps) != k || ps != '|' || strncmp(p, s, k)) continue;
      bs(o, j == i ? "[[" : ",[");
      p += k + 1;
      for (int c = 0;; c++) { size_t n = strcspn(p, "|\r"); if (c) bs(o, ","); fld(o, p, n, 'v'); p += n; if (*p != '|') break; p++; }
      bs(o, "]");
    }
    bs(o, "]");
  }
  bs(o, "}");
  free(t); free(L.l);
}

/* graph history: the first word of each line of <tmp>/<key> */
static void series(buf *b, const char *dir, const char *k) {
  char p[512], l[128], out[64]; int first = 1;
  snprintf(p, sizeof p, "%s/%s", dir, k);
  FILE *f = fopen(p, "r");
  if (!f) return;
  while (fgets(l, sizeof l, f)) {
    char *s = l; while (*s == ' ' || *s == '\t') s++;
    if (num(s, strcspn(s, " \t\r\n"), out)) { if (!first) bs(b, ","); bs(b, out); first = 0; }
  }
  fclose(f);
}
/* first line of a file into t, its length (0 if there is no file) */
static size_t line1(const char *path, char *t, size_t sz) {
  size_t n = 0;
  FILE *f = fopen(path, "r");
  if (!f) return 0;
  if (fgets(t, sz, f)) n = strcspn(t, "\r\n");
  fclose(f);
  return n;
}

/* "inst|id|type|name|url|user|set,...|map|hosts|every|snap" lines (bin/settings list): the collector's data from <tmp>/x/<id> (null before its first run) goes before the map */
static void insts(buf *o, lines *L, const char *tmp) {
  int first = 1;
  for (int i = 0; i < L->n; i++) {
    const char *id = L->l[i] + 5, *f = id;
    if (strncmp(L->l[i], "inst|", 5)) continue;
    size_t idn = strcspn(id, "|\r"); int fd = -1; char p[512];
    bs(o, first ? "[" : ",["); first = 0;
    for (int j = 0; j < 6; j++) { size_t n = strcspn(f, "|\r"); if (j) bs(o, ","); fld(o, f, n, j == 5 ? 'a' : 's'); f += n; if (*f == '|') f++; }
    /* ids are [a-z0-9-] (bin/settings apply); anything else is not a file name */
    if (idn && idn < 64 && strspn(id, "abcdefghijklmnopqrstuvwxyz0123456789-") >= idn) {
      snprintf(p, sizeof p, "%s/x/%.*s", tmp, (int)idn, id); fd = open(p, O_RDONLY | O_CLOEXEC);
    }
    if (fd < 0) bs(o, ",null");
    else { buf d = { 0 }; slurp(fd, &d, MAXOUT); close(fd); bs(o, ","); kvjson(o, d.p); free(d.p); }
    for (int j = 0; j < 4; j++) { size_t n = strcspn(f, "|\r"); bs(o, ","); fld(o, f, n, 's'); f += n; if (*f == '|') f++; }
    bs(o, "]");
  }
}

static void status(buf *o) {
  buf sb = { 0 }, vb = { 0 };
  lines S = cmd("KEENDASH_STATS", SHARE "/bin/stats", &sb), V = cmd("KEENDASH_SERVICES", SHARE "/bin/services", &vb);
  const char *tmp = getenv("KEENDASH_TMP");
  if (!tmp || !*tmp) tmp = "/tmp/keendash";

  bf(o, "{\"now\":%ld,\"tabs\":[", (long)time(NULL)); rows(o, &S, "tab", "=s");
  bs(o, "],\"svc\":["); rows(o, &V, "svc", "sns");
  bs(o, "],\"web\":["); rows(o, &V, "web", "sns");
  bs(o, "],\"ndp\":["); rows(o, &V, "ndp", "ssnn");
  bs(o, "],\"telemt\":{"); kv(o, &S, "ok=telemt_ok conn=telemt_conn users=telemt_users cfg=telemt_cfg up=telemt_up bad=telemt_bad");
  bs(o, ",\"list\":["); rows(o, &S, "u", "snnn");
  bs(o, "]},\"awg\":{"); kv(o, &S, "up=awg_up total=awg_total nokey=awg_nokey");
  bs(o, ",\"tun\":["); rows(o, &S, "tun", "snnnn");
  bs(o, "],\"px\":["); rows(o, &S, "px", "ssnnNs");
  bs(o, "]},\"firc\":{"); kv(o, &S, "domains=firc_domains groups=firc_groups enabled=firc_enabled");
  bs(o, ",\"list\":["); rows(o, &S, "g", "ssnn");
  bs(o, "]},\"ascn\":{"); kv(o, &S, "ips=ascn_ips subnets=ascn_subnets honeypot=ascn_honeypot candidates=ascn_candidates");
  bs(o, ",\"bans\":["); rows(o, &S, "b", "ssns");
  bs(o, "]},\"nfq\":{"); kv(o, &S, "run=nfq_running pkts=nfq_pkts drop=nfq_drop up=nfq_up mem=nfq_mem user=nfq_user auto=nfq_auto excl=nfq_excl ipsets=nfq_ipsets today=nfq_today");
  bs(o, ",\"ev\":["); rows(o, &S, "n", "sss");
  bs(o, "],\"mon\":["); rows(o, &S, "m", "snnn");
  bs(o, "]},\"hydra\":{"); kv(o, &S, "run=hr_running up=hr_up mem=hr_mem keys=hr_keys ips=hr_ips");
  bs(o, ",\"list\":["); rows(o, &S, "hr", "snnnn");
  bs(o, "]},\"ts\":{"); kv(o, &S, "run=ts_running up=ts_up mem=ts_mem online=ts_online total=ts_total");
  bs(o, ",\"self\":["); rows(o, &S, "tss", "sssssnss");
  bs(o, "],\"list\":["); rows(o, &S, "tsp", "ssnnnssnnnns");
  bs(o, "]},\"sys\":{"); kv(o, &S, "load=sys_load mem=sys_mem memtotal=sys_memtotal temp=?sys_temp disk=sys_disk free=sys_free up=sys_uptime");
  bs(o, "},\"series\":{");
  static const char *ser[] = { "telemt_conn", "telemt_octets", "awg_bytes", "awg_up", "firc_domains", "ascn_ips", "ascn_honeypot",
                               "nfq_pkts", "nfq_auto", "hr_ips", "ts_bytes", "ts_online", "sys_load", "sys_mem", "sys_temp" };
  for (size_t i = 0; i < sizeof ser / sizeof *ser; i++) { bf(o, "%s\"%s\":[", i ? "," : "", ser[i]); series(o, tmp, ser[i]); bs(o, "]"); }
  /* s.<id>.<key>: graph history of the services' "~key" values (bin/ext) */
  DIR *dd = opendir(tmp);
  for (struct dirent *de; dd && (de = readdir(dd)); )
    if (!strncmp(de->d_name, "s.", 2) && de->d_name[2]) { bs(o, ","); jstr(o, de->d_name + 2, strlen(de->d_name + 2)); bs(o, ":["); series(o, tmp, de->d_name); bs(o, "]"); }
  if (dd) closedir(dd);

  /* bin/settings list: the web UI's settings, the services' types and instances */
  buf cb = { 0 }; lines C = cmd("KEENDASH_SETTINGS", SHARE "/bin/settings list", &cb);
  bs(o, "},\"cfg\":{\"vol\":"); one(o, &C, "vol");
  bs(o, ",\"rev\":"); one(o, &C, "rev");
  bs(o, ",\"err\":"); one(o, &C, "err");
  bs(o, ",\"hide\":{\"page\":["); rows(o, &C, "hide|page", "=s");
  bs(o, "],\"main\":["); rows(o, &C, "hide|main", "=s");
  bs(o, "]},\"cols\":["); rows(o, &C, "col", "=a");
  bs(o, "],\"lay\":["); rows(o, &C, "lay", "ssnns");
  bs(o, "]},\"types\":["); rows(o, &C, "type", "sssas");
  bs(o, "],\"inst\":["); insts(o, &C, tmp);
  bs(o, "]");
  free(cb.p); free(C.l);

  /* update: installed version, a newer one from the feed (bin/update check), an upgrade in progress */
  char cur[128] = "", nw[128] = "", pid[32] = "", p[512]; size_t cn = 0, nn = 0, pn = 0;
  FILE *f = fopen("/opt/lib/opkg/info/keendash.control", "r");
  if (f) {
    char l[256];
    while (fgets(l, sizeof l, f)) if (!strncmp(l, "Version:", 8)) {
      char *s = l + 8; while (*s == ' ') s++;
      cn = strcspn(s, " \t\r\n"); if (cn >= sizeof cur) cn = 0;
      memcpy(cur, s, cn); break;
    }
    fclose(f);
  }
  snprintf(p, sizeof p, "%s/upd.new", tmp); nn = line1(p, nw, sizeof nw);
  if (nn == cn && !memcmp(nw, cur, cn)) nn = 0;
  snprintf(p, sizeof p, "%s/upd.busy", tmp); pn = line1(p, pid, sizeof pid);
  pid[pn] = 0;
  int busy = pn && atoi(pid) > 0 && kill(atoi(pid), 0) == 0;
  bs(o, ",\"upd\":{\"cur\":"); jstr(o, cur, cn);
  bs(o, ",\"new\":"); jstr(o, nw, nn);
  bf(o, ",\"busy\":%d}}\n", busy);
  free(sb.p); free(vb.p); free(S.l); free(V.l);
}

/* ======================= JSON flattener ======================= */
/* Same output as the grep | awk flattener it replaces: object keys and array indexes joined with ".";
 * in strings \" \/ \\ are decoded (other escapes stay as they are), tab and | become spaces. */
static int json(void) {
  enum { MAXD = 64 };
  char T[MAXD + 1] = { 0 }; long N[MAXD + 1] = { 0 }; int W[MAXD + 1] = { 0 }; char *K[MAXD + 1] = { 0 };
  int d = 0, c;
  buf v = { 0 };
  while ((c = getchar()) != EOF) {
    if (c == '{' || c == '[') {
      if (++d <= MAXD) { T[d] = (char)c; N[d] = 0; W[d] = c == '{'; free(K[d]); K[d] = strdup(""); }
      continue;
    }
    if (c == '}' || c == ']') { if (d > 0) d--; continue; }
    if (c == ',') { if (d > 0 && d <= MAXD) { if (T[d] == '[') N[d]++; else W[d] = 1; } continue; }
    if (c == ':') { if (d > 0 && d <= MAXD) W[d] = 0; continue; }
    v.n = 0; bput(&v, "", 0);
    if (c == '"') {
      int done = 0;
      while ((c = getchar()) != EOF && c != '\n') {
        if (c == '"') { done = 1; break; }
        if (c == '\\') {
          int e = getchar();
          if (e == EOF || e == '\n') break;
          if (e != '"' && e != '/' && e != '\\') bput(&v, "\\", 1);
          c = e;
        }
        if (c == '\t' || c == '|') c = ' ';
        char ch = (char)c; bput(&v, &ch, 1);
      }
      if (!done) continue;
    } else if (isalnum(c) || c == '-' || c == '+' || c == '.') {
      do { char ch = (char)c; bput(&v, &ch, 1); } while ((c = getchar()) != EOF && (isalnum(c) || c == '-' || c == '+' || c == '.'));
      if (c != EOF) ungetc(c, stdin);
    } else continue;
    if (d > MAXD) continue;
    if (d > 0 && T[d] == '{' && W[d]) { free(K[d]); K[d] = strdup(v.p); continue; }
    for (int i = 1; i <= d; i++) {
      if (i > 1) putchar('.');
      if (T[i] == '{') fputs(K[i] ? K[i] : "", stdout); else printf("%ld", N[i]);
    }
    printf("\t%s\n", v.p);
  }
  return 0;
}

/* ======================= web server ======================= */
static void writeall(int fd, const char *p, size_t n) {
  while (n) {
    ssize_t w = write(fd, p, n);
    if (w < 0) { if (errno == EINTR) continue; return; }
    p += w; n -= w;
  }
}
static void reply(int c, int head, const char *st, const char *hdrs, const char *body, size_t n) {
  buf b = { 0 };
  bf(&b, "HTTP/1.1 %s\r\n", st); bs(&b, hdrs);
  bf(&b, "Content-Length: %lu\r\nConnection: close\r\n\r\n", (unsigned long)n);
  if (!head && n) bput(&b, body, n);
  writeall(c, b.p, b.n);
  free(b.p);
}
static void fail(int c, const char *st) { reply(c, 0, st, "Content-Type: text/plain\r\n", st, strlen(st)); }
/* a + b + c into out; 0 if it does not fit */
static int join(char *out, size_t sz, const char *a, const char *b, const char *c) {
  size_t la = strlen(a), lb = strlen(b), lc = strlen(c);
  if (la + lb + lc >= sz) return 0;
  memcpy(out, a, la); memcpy(out + la, b, lb); memcpy(out + la + lb, c, lc + 1);
  return 1;
}

static const char *mime(const char *p) {
  static const char *m[][2] = { { ".html", "text/html; charset=utf-8" }, { ".css", "text/css; charset=utf-8" },
    { ".js", "application/javascript; charset=utf-8" }, { ".json", "application/json; charset=utf-8" },
    { ".svg", "image/svg+xml" }, { ".ico", "image/x-icon" }, { ".png", "image/png" } };
  const char *e = strrchr(p, '.');
  for (size_t i = 0; e && i < sizeof m / sizeof *m; i++) if (!strcmp(e, m[i][0])) return m[i][1];
  return "application/octet-stream";
}

typedef struct { const char *method, *path, *query, *host, *origin, *ctype, *body; size_t blen; int head; char addr[64]; } request;

static void cgi(int c, const char *file, request *r) {
  int in[2], out[2];
  if (pipe(in)) { fail(c, "500 Internal Server Error"); return; }
  if (pipe(out)) { close(in[0]); close(in[1]); fail(c, "500 Internal Server Error"); return; }
  pid_t p = fork();
  if (p == 0) {
    char e[11][600];
    snprintf(e[0], sizeof e[0], "REQUEST_METHOD=%s", r->method);
    snprintf(e[1], sizeof e[1], "QUERY_STRING=%s", r->query);
    snprintf(e[2], sizeof e[2], "CONTENT_LENGTH=%lu", (unsigned long)r->blen);
    snprintf(e[3], sizeof e[3], "CONTENT_TYPE=%s", r->ctype);
    snprintf(e[4], sizeof e[4], "HTTP_HOST=%s", r->host);
    snprintf(e[5], sizeof e[5], "HTTP_ORIGIN=%s", r->origin);
    snprintf(e[6], sizeof e[6], "SCRIPT_NAME=%s", r->path);
    snprintf(e[7], sizeof e[7], "REMOTE_ADDR=%s", r->addr);
    snprintf(e[8], sizeof e[8], "GATEWAY_INTERFACE=CGI/1.1");
    snprintf(e[9], sizeof e[9], "SERVER_PROTOCOL=HTTP/1.1");
    snprintf(e[10], sizeof e[10], "PATH=/opt/sbin:/opt/bin:/opt/usr/bin:/usr/sbin:/usr/bin:/sbin:/bin");
    char *env[12]; for (int i = 0; i < 11; i++) env[i] = e[i]; env[11] = NULL;
    char *argv[] = { (char *)file, NULL };
    dup2(in[0], 0); dup2(out[1], 1);
    close(in[0]); close(in[1]); close(out[0]); close(out[1]);
    execve(file, argv, env);
    _exit(127);
  }
  close(in[0]); close(out[1]);
  if (p > 0 && r->blen) writeall(in[1], r->body, r->blen);
  close(in[1]);
  buf o = { 0 };
  slurp(out[0], &o, MAXOUT);
  close(out[0]);
  if (p > 0) waitpid(p, NULL, 0);
  /* CGI headers end at the first empty line; "Status:" becomes the status line */
  char *h = o.p, *body = strstr(h, "\r\n\r\n"), *lf = strstr(h, "\n\n");
  size_t skip = 4;
  if (!body || (lf && lf < body)) { body = lf; skip = 2; }
  if (p < 0 || !body) { fail(c, "502 Bad Gateway"); free(o.p); return; }
  *body = 0; body += skip;
  buf hd = { 0 }; char st[64] = "200 OK";
  bput(&hd, "", 0);
  for (char *l = strtok(h, "\r\n"); l; l = strtok(NULL, "\r\n")) {
    if (!strncasecmp(l, "Status:", 7)) { l += 7; while (*l == ' ') l++; snprintf(st, sizeof st, "%s", l); }
    else { bs(&hd, l); bs(&hd, "\r\n"); }
  }
  reply(c, r->head, st, hd.p, body, o.n - (body - o.p));
  free(o.p); free(hd.p);
}

static void handle(int c, const char *www) {
  char q[8192]; size_t n = 0; char *end = NULL;
  request r; memset(&r, 0, sizeof r);
  alarm(20); /* slow or stuck client */
  while (!end) {
    if (n == sizeof q - 1) { fail(c, "431 Request Header Fields Too Large"); return; }
    ssize_t k = read(c, q + n, sizeof q - 1 - n);
    if (k < 0 && errno == EINTR) continue;
    if (k <= 0) return;
    n += k; q[n] = 0;
    end = strstr(q, "\r\n\r\n");
  }
  *end = 0;
  char *body = end + 4, *sp, *hl, *t;
  size_t have = n - (body - q);
  r.method = q;
  if (!(sp = strchr(q, ' '))) { fail(c, "400 Bad Request"); return; }
  *sp = 0; t = sp + 1;
  if (!(sp = strchr(t, ' '))) { fail(c, "400 Bad Request"); return; }
  *sp = 0;
  hl = strstr(sp + 1, "\r\n");
  r.host = r.origin = r.ctype = "";
  long clen = 0;
  for (char *l = hl ? strtok(hl + 2, "\r\n") : NULL; l; l = strtok(NULL, "\r\n")) {
    char *v = strchr(l, ':');
    if (!v) continue;
    *v++ = 0; while (*v == ' ') v++;
    if (!strcasecmp(l, "Host")) r.host = v;
    else if (!strcasecmp(l, "Origin")) r.origin = v;
    else if (!strcasecmp(l, "Content-Type")) r.ctype = v;
    else if (!strcasecmp(l, "Content-Length")) clen = atol(v);
  }
  if ((sp = strchr(t, '?'))) { *sp = 0; r.query = sp + 1; } else r.query = "";
  r.path = t;
  r.head = !strcmp(r.method, "HEAD");
  int post = !strcmp(r.method, "POST");
  if (!r.head && !post && strcmp(r.method, "GET")) { fail(c, "405 Method Not Allowed"); return; }
  if (*t != '/' || strstr(t, "..") || t[strspn(t, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-/")]) {
    fail(c, "400 Bad Request"); return;
  }
  struct sockaddr_in a; socklen_t al = sizeof a;
  if (!getpeername(c, (struct sockaddr *)&a, &al)) inet_ntop(AF_INET, &a.sin_addr, r.addr, sizeof r.addr);

  if (post) {
    if (clen < 0 || clen > MAXBODY) { fail(c, "413 Payload Too Large"); return; }
    char *b = malloc(clen + 1);
    size_t got = have < (size_t)clen ? have : (size_t)clen;
    if (!b) { fail(c, "500 Internal Server Error"); return; }
    memcpy(b, body, got);
    while (got < (size_t)clen) {
      ssize_t k = read(c, b + got, clen - got);
      if (k < 0 && errno == EINTR) continue;
      if (k <= 0) return;
      got += k;
    }
    r.body = b; r.blen = got;
  }

  size_t tl = strlen(t);
  char file[1024];
  if (!join(file, sizeof file, www, t, t[tl - 1] == '/' ? "index.html" : "")) { fail(c, "414 URI Too Long"); return; }
  if (!strcmp(t, "/cgi-bin/status.cgi")) {
    buf o = { 0 };
    status(&o);
    reply(c, r.head, "200 OK", "Content-Type: application/json; charset=utf-8\r\nAccess-Control-Allow-Origin: *\r\nCache-Control: no-store\r\n", o.p, o.n);
    free(o.p);
    return;
  }
  /* file = www + path (+ index.html) */
  if (!strncmp(t, "/cgi-bin/", 9) && tl > 13 && !strcmp(t + tl - 4, ".cgi") && !strchr(t + 9, '/')) {
    if (access(file, X_OK)) fail(c, "404 Not Found"); else cgi(c, file, &r);
    return;
  }
  if (post) { fail(c, "405 Method Not Allowed"); return; }
  struct stat st; int fd = open(file, O_RDONLY | O_CLOEXEC);
  if (fd < 0 || fstat(fd, &st) || !S_ISREG(st.st_mode)) { if (fd >= 0) close(fd); fail(c, "404 Not Found"); return; }
  buf o = { 0 }; char h[128];
  slurp(fd, &o, MAXOUT); close(fd);
  snprintf(h, sizeof h, "Content-Type: %s\r\n", mime(file));
  reply(c, r.head, "200 OK", h, o.p, o.n);
  free(o.p);
}

static time_t mono(void) { struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t); return t.tv_sec; }
static void woken(int s) { (void)s; } /* SIGCHLD interrupts poll(), so finished children are reaped at once */
static pid_t tick(const char *what) {
  pid_t p = fork();
  if (p == 0) { execl(SHARE "/bin/tick", "tick", what, (char *)NULL); _exit(127); }
  return p > 0 ? p : 0;
}

/* The web UI over https can't load keendash's http port (mixed content), but it reads files under /tmp/mnt through
 * its own /storage/ path, which nginx serves only to a logged-in user. A read is seen there as the file's atime
 * moving past its mtime (relatime). 1 if <name> in that directory was read since its last write, -1 if it is missing */
static int was_read(const char *name, char *f, size_t fn) {
  const char *d = getenv("KEENDASH_PUB");
  struct stat st;
  if (!d || !*d) d = PUB;
  if (stat(d, &st) || !S_ISDIR(st.st_mode)) return 0;
  snprintf(f, fn, "%s/%s", d, name);
  if (stat(f, &st)) return -1;
  return st.st_atim.tv_sec > st.st_mtim.tv_sec || (st.st_atim.tv_sec == st.st_mtim.tv_sec && st.st_atim.tv_nsec > st.st_mtim.tv_nsec);
}

/* the status JSON, rebuilt only while someone reads it */
static pid_t publish(void) {
  char f[512], t[520];
  if (!was_read("status.json", f, sizeof f)) return 0;
  pid_t p = fork();
  if (p == 0) {
    signal(SIGCHLD, SIG_DFL);
    buf o = { 0 }; status(&o);
    snprintf(t, sizeof t, "%s.tmp", f);
    int fd = open(t, O_WRONLY | O_CREAT | O_TRUNC | O_CLOEXEC, 0644);
    if (fd >= 0) { writeall(fd, o.p, o.n); close(fd); rename(t, f); }
    _exit(0);
  }
  return p > 0 ? p : 0;
}

/* the card's update button over https reads the empty "update" file: then upgrade (S81keendash makes the file) */
static pid_t upgrade(void) {
  char f[512];
  if (was_read("update", f, sizeof f) != 1) return 0;
  utimensat(AT_FDCWD, f, NULL, 0); /* atime = mtime again: one read, one run */
  const char *u = getenv("KEENDASH_UPDATE");
  pid_t p = fork();
  if (p == 0) { execl("/bin/sh", "sh", "-c", u && *u ? u : SHARE "/bin/update run", (char *)NULL); _exit(127); }
  return p > 0 ? p : 0;
}

/* the web UI drops settings messages into the inbox: while it has files (ls skips dotfiles too), apply them */
static pid_t settings(void) {
  const char *d = getenv("KEENDASH_INBOX"), *a = getenv("KEENDASH_APPLY");
  DIR *dd = opendir(d && *d ? d : INBOX);
  struct dirent *e; int any = 0;
  if (!dd) return 0;
  while (!any && (e = readdir(dd))) any = e->d_name[0] != '.';
  closedir(dd);
  if (!any) return 0;
  pid_t p = fork();
  if (p == 0) { execl("/bin/sh", "sh", "-c", a && *a ? a : SHARE "/bin/settings apply", (char *)NULL); _exit(127); }
  return p > 0 ? p : 0;
}

static int serve(const char *ip, const char *port, const char *www) {
  struct sockaddr_in a; memset(&a, 0, sizeof a);
  a.sin_family = AF_INET; a.sin_port = htons((unsigned short)atoi(port));
  if (inet_pton(AF_INET, ip, &a.sin_addr) != 1) { fprintf(stderr, "keendashd: bad address %s\n", ip); return 1; }
  int l = socket(AF_INET, SOCK_STREAM | SOCK_CLOEXEC, 0), one = 1;
  if (l < 0 || setsockopt(l, SOL_SOCKET, SO_REUSEADDR, &one, sizeof one) || bind(l, (struct sockaddr *)&a, sizeof a) || listen(l, 32)) {
    fprintf(stderr, "keendashd: %s:%s: %s\n", ip, port, strerror(errno)); return 1;
  }
  pid_t p = fork();
  if (p < 0) { perror("keendashd"); return 1; }
  if (p) { printf("%d\n", (int)p); return 0; }
  setsid();
  if (chdir("/")) {}
  int z = open("/dev/null", O_RDWR);
  if (z >= 0) { dup2(z, 0); dup2(z, 1); dup2(z, 2); if (z > 2) close(z); }
  /* started from opkg or nohup: undo inherited "ignore", children and scripts need the defaults */
  signal(SIGPIPE, SIG_DFL); signal(SIGHUP, SIG_DFL);
  struct sigaction sa; memset(&sa, 0, sizeof sa);
  sa.sa_handler = woken; sigaction(SIGCHLD, &sa, NULL);

  time_t next1 = 0, next5 = 0, nextp = 0, nextu = 0, nextt = 0;
  pid_t t1 = 0, t5 = 0, tp = 0, tu = 0, ts = 0; int conns = 0;
  for (;;) {
    pid_t w;
    while ((w = waitpid(-1, NULL, WNOHANG)) > 0) { if (w == t1) t1 = 0; else if (w == t5) t5 = 0; else if (w == tp) tp = 0; else if (w == tu) tu = 0; else if (w == ts) ts = 0; else conns--; }
    time_t now = mono();
    /* a run still going when the next one is due is skipped, not doubled */
    if (now >= next1) { if (!t1) t1 = tick("1"); next1 = now + 60; }
    if (now >= next5) { if (!t5) t5 = tick("5"); next5 = now + 300; }
    /* the card asks every 30 s: the JSON it gets is at most ~20 s old */
    if (now >= nextp) { if (!tp) tp = publish(); nextp = now + 15; }
    if (now >= nextu) { if (!tu) tu = upgrade(); nextu = now + 5; }
    if (now >= nextt) { if (!ts) ts = settings(); nextt = now + 5; }
    time_t next = next1 < next5 ? next1 : next5;
    if (nextp < next) next = nextp;
    if (nextu < next) next = nextu;
    if (nextt < next) next = nextt;
    struct pollfd pf = { l, POLLIN, 0 };
    if (poll(&pf, 1, (int)(next - now) * 1000) <= 0) continue;
    int c = accept4(l, NULL, NULL, SOCK_CLOEXEC);
    if (c < 0) continue;
    while ((w = waitpid(-1, NULL, WNOHANG)) > 0) { if (w == t1) t1 = 0; else if (w == t5) t5 = 0; else if (w == tp) tp = 0; else if (w == tu) tu = 0; else if (w == ts) ts = 0; else conns--; }
    if (conns >= MAXCONN) { close(c); continue; }
    pid_t h = fork();
    if (h == 0) { signal(SIGCHLD, SIG_DFL); close(l); handle(c, www); close(c); _exit(0); }
    if (h > 0) conns++;
    close(c);
  }
}

int main(int argc, char **argv) {
  if (argc == 5 && !strcmp(argv[1], "serve")) return serve(argv[2], argv[3], argv[4]);
  if (argc == 2 && !strcmp(argv[1], "status")) { buf o = { 0 }; status(&o); fwrite(o.p, 1, o.n, stdout); return 0; }
  if (argc == 2 && !strcmp(argv[1], "json")) return json();
  if (argc == 2 && !strcmp(argv[1], "kvjson")) {
    buf i = { 0 }, o = { 0 }; slurp(0, &i, MAXOUT); kvjson(&o, i.p); bs(&o, "\n"); fwrite(o.p, 1, o.n, stdout); return 0;
  }
  fprintf(stderr, "usage: keendashd serve <ip> <port> <www> | status | json | kvjson\n");
  return 2;
}
