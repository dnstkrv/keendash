/* keendashd: keendash's web server and scheduler, the status JSON, and a JSON flattener for the collectors.
 *   keendashd serve <ip> <port> <www> [<https port>]
 *                                     serve the widgets on <ip>:<port> (prints the daemon's pid once the ports are bound);
 *                                     runs bin/tick 1 every minute and bin/tick 5 every 5 minutes, so no cron is needed.
 *                                     With an HTTPS port it also listens there on all addresses, for the web UI opened
 *                                     via KeenDNS, with the router's KeenDNS certificate (re-read every 6 hours), and
 *                                     prints the KeenDNS name on a second line; fails without the certificate.
 *                                     HTTPS requests are answered only with a live web UI session.
 *   keendashd status                  the /cgi-bin/status.cgi JSON, built from the output of bin/stats and bin/services
 *   keendashd json                    JSON on stdin -> "path<TAB>value" lines: records.0.series.title<TAB>Silo
 * Only libc (and Mbed TLS when built with KEENDASH_TLS): built static with musl for every Entware architecture
 * (scripts/build-ipk.sh). */
#define _GNU_SOURCE
#include <arpa/inet.h>
#include <ctype.h>
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
#ifdef KEENDASH_TLS
#include <mbedtls/ctr_drbg.h>
#include <mbedtls/entropy.h>
#include <mbedtls/net_sockets.h>
#include <mbedtls/pk.h>
#include <mbedtls/platform_util.h>
#include <mbedtls/ssl.h>
#include <mbedtls/x509_crt.h>
#endif

#define SHARE "/opt/share/keendash"
#define MAXCONN 16       /* parallel requests; more are dropped */
#define MAXBODY 65536    /* POST body */
#define MAXOUT (4 << 20) /* CGI output */

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
/* "tag|f2|f3..." lines as JSON arrays, one letter per field: s string, n number (0 if empty), N number or null;
 * a leading "=" prints the single field bare instead of an array */
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
      if (spec[j] == 's') jstr(b, f, n); else jnum(b, f, n, spec[j] == 'N' ? "null" : "0");
      f += n; if (*f == '|') f++;
    }
    if (!one) bs(b, "]");
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

static void status(buf *o) {
  buf sb = { 0 }, vb = { 0 };
  lines S = cmd("KEENDASH_STATS", SHARE "/bin/stats", &sb), V = cmd("KEENDASH_SERVICES", SHARE "/bin/services", &vb);
  const char *tmp = getenv("KEENDASH_TMP"), *v; size_t n;
  if (!tmp || !*tmp) tmp = "/tmp/keendash";

  bf(o, "{\"now\":%ld,\"tabs\":[", (long)time(NULL)); rows(o, &S, "tab", "=s");
  bs(o, "],\"svc\":["); rows(o, &V, "svc", "sns");
  bs(o, "],\"web\":["); rows(o, &V, "web", "sns");
  bs(o, "],\"telemt\":{"); kv(o, &S, "ok=telemt_ok conn=telemt_conn users=telemt_users cfg=telemt_cfg up=telemt_up bad=telemt_bad");
  bs(o, ",\"list\":["); rows(o, &S, "u", "snnn");
  bs(o, "]},\"awg\":{"); kv(o, &S, "up=awg_up total=awg_total");
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
  /* third-party services: "ok" is null until bin/ext has asked the API once */
  bs(o, "]},\"agh\":{"); kv(o, &S, "ok=?agh_ok");
  bs(o, ",\"url\":"); v = val(&S, "agh_url", &n); jstr(o, v ? v : "", v ? n : 0);
  bs(o, ","); kv(o, &S, "q=agh_q b=agh_b ms=agh_ms days=agh_days fon=agh_fon fall=agh_fall rules=agh_rules upd=agh_upd");
  bs(o, ",\"sq\":["); if ((v = val(&S, "agh_sq", &n))) nums(o, v, n, ',');
  bs(o, "],\"sb\":["); if ((v = val(&S, "agh_sb", &n))) nums(o, v, n, ',');
  bs(o, "],\"top\":["); rows(o, &S, "ab", "sn");
  bs(o, "],\"cl\":["); rows(o, &S, "ac", "ssn");
  bs(o, "],\"last\":["); rows(o, &S, "al", "nss");
  bs(o, "]},\"media\":{\"svc\":["); rows(o, &S, "ms", "ss");
  bs(o, "],\"qb\":{"); kv(o, &S, "ok=?qb_ok dl=qb_dl up=qb_up n=qb_n");
  bs(o, ",\"list\":["); rows(o, &S, "qbt", "snnn");
  bs(o, "]},\"plex\":{"); kv(o, &S, "ok=?pl_ok streams=pl_streams");
  bs(o, ",\"list\":["); rows(o, &S, "pls", "ssns");
  bs(o, "],\"libs\":["); rows(o, &S, "pll", "ssn");
  bs(o, "]},\"sonarr\":{"); kv(o, &S, "ok=?sn_ok queue=sn_queue missing=?sn_missing");
  bs(o, ",\"list\":["); rows(o, &S, "snq", "snn");
  bs(o, "],\"cal\":["); rows(o, &S, "snc", "nssn");
  bs(o, "]},\"radarr\":{"); kv(o, &S, "ok=?rd_ok queue=rd_queue missing=?rd_missing");
  bs(o, ",\"list\":["); rows(o, &S, "rdq", "snn");
  bs(o, "],\"cal\":["); rows(o, &S, "rdc", "nss");
  bs(o, "]},\"prowlarr\":{"); kv(o, &S, "ok=?pw_ok all=pw_all on=pw_on bad=pw_bad q=pw_q g=pw_g fail=pw_fail");
  bs(o, ",\"list\":["); rows(o, &S, "pwb", "=s");
  bs(o, "]},\"overseerr\":{"); kv(o, &S, "ok=?ov_ok pending=ov_pending processing=ov_processing available=ov_available total=ov_total");
  bs(o, "},\"immich\":{"); kv(o, &S, "ok=?im_ok photos=im_photos videos=im_videos usage=im_usage");
  bs(o, ",\"list\":["); rows(o, &S, "imu", "snnn");
  bs(o, "]}},\"sys\":{"); kv(o, &S, "load=sys_load mem=sys_mem memtotal=sys_memtotal temp=?sys_temp disk=sys_disk free=sys_free up=sys_uptime");
  bs(o, "},\"series\":{");
  static const char *ser[] = { "telemt_conn", "telemt_octets", "awg_bytes", "awg_up", "firc_domains", "ascn_ips", "ascn_honeypot",
                               "nfq_pkts", "nfq_auto", "hr_ips", "qb_dl", "qb_up", "sys_load", "sys_mem", "sys_temp" };
  for (size_t i = 0; i < sizeof ser / sizeof *ser; i++) { bf(o, "%s\"%s\":[", i ? "," : "", ser[i]); series(o, tmp, ser[i]); bs(o, "]"); }

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
  bs(o, "},\"upd\":{\"cur\":"); jstr(o, cur, cn);
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
/* this request came over HTTPS: its client address, and the CORS headers for the web UI page it came from */
static int https; static char peer[64], cors[512], fqdn[256];

static void writeall(int fd, const char *p, size_t n) {
  while (n) {
    ssize_t w = write(fd, p, n);
    if (w < 0) { if (errno == EINTR) continue; return; }
    p += w; n -= w;
  }
}
static void reply(int c, int head, const char *st, const char *hdrs, const char *body, size_t n) {
  buf b = { 0 };
  bf(&b, "HTTP/1.1 %s\r\n", st);
  if (!https) bs(&b, hdrs);
  else {
    /* HTTPS requests carry the session cookie, so "*" is not allowed: only the page of this host may read the answer */
    for (const char *l = hdrs, *e; *l; l = e + (*e != 0)) {
      e = strchr(l, '\n'); if (!e) e = l + strlen(l);
      if (strncasecmp(l, "Access-Control-Allow-Origin:", 28)) bput(&b, l, e - l + (*e != 0));
    }
    bs(&b, cors);
  }
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

typedef struct { const char *method, *path, *query, *host, *origin, *ctype, *cookie, *ua, *body; size_t blen; int head; char addr[64]; } request;

/* HTTPS: is this a live Keenetic web UI session? NDMS answers that on nginx's internal auth endpoint, from the
 * browser's cookies (the session cookie's name differs per router) and its User-Agent. */
static int session(const char *cookie, const char *ua) {
  const char *e = getenv("KEENDASH_AUTH"); /* tests: ip:port */
  char ip[64] = "127.0.0.1"; int port = 79;
  if (e && *e) { const char *c = strchr(e, ':'); if (!c || c - e >= (int)sizeof ip) return 0; memcpy(ip, e, c - e); ip[c - e] = 0; port = atoi(c + 1); }
  if (!*cookie) return 0;
  struct sockaddr_in a; memset(&a, 0, sizeof a);
  a.sin_family = AF_INET; a.sin_port = htons((unsigned short)port);
  if (inet_pton(AF_INET, ip, &a.sin_addr) != 1) return 0;
  int s = socket(AF_INET, SOCK_STREAM | SOCK_CLOEXEC, 0);
  if (s < 0) return 0;
  if (connect(s, (struct sockaddr *)&a, sizeof a)) { close(s); return 0; }
  buf q = { 0 };
  bs(&q, "GET /auth HTTP/1.0\r\nHost: 127.0.0.1\r\nCookie: "); bs(&q, cookie);
  bs(&q, "\r\nUser-Agent: "); bs(&q, ua); bs(&q, "\r\n\r\n");
  writeall(s, q.p, q.n); free(q.p);
  char r[64]; size_t n = 0; ssize_t k;
  while (n < sizeof r - 1 && (k = read(s, r + n, sizeof r - 1 - n)) != 0) { if (k < 0) { if (errno == EINTR) continue; break; } n += k; }
  close(s); r[n] = 0;
  return !strncmp(r, "HTTP/1.", 7) && !strncmp(r + 8, " 200", 4);
}

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
  r.host = r.origin = r.ctype = r.cookie = r.ua = "";
  long clen = 0;
  for (char *l = hl ? strtok(hl + 2, "\r\n") : NULL; l; l = strtok(NULL, "\r\n")) {
    char *v = strchr(l, ':');
    if (!v) continue;
    *v++ = 0; while (*v == ' ') v++;
    if (!strcasecmp(l, "Host")) r.host = v;
    else if (!strcasecmp(l, "Origin")) r.origin = v;
    else if (!strcasecmp(l, "Content-Type")) r.ctype = v;
    else if (!strcasecmp(l, "Content-Length")) clen = atol(v);
    else if (!strcasecmp(l, "Cookie")) r.cookie = v;
    else if (!strcasecmp(l, "User-Agent")) r.ua = v;
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
  if (https) snprintf(r.addr, sizeof r.addr, "%s", peer);
  else if (!getpeername(c, (struct sockaddr *)&a, &al)) inet_ntop(AF_INET, &a.sin_addr, r.addr, sizeof r.addr);
  if (https) {
    /* CORS only for the web UI on this very host (any port): https://<Host without port> */
    size_t hn = strcspn(r.host, ":");
    if (!strncmp(r.origin, "https://", 8) && strlen(r.origin + 8) == hn && hn && !strncmp(r.origin + 8, r.host, hn)
        && strlen(r.origin) < sizeof cors - 128)
      snprintf(cors, sizeof cors, "Access-Control-Allow-Origin: %s\r\nAccess-Control-Allow-Credentials: true\r\nVary: Origin\r\n", r.origin);
    if (!session(r.cookie, r.ua)) { fail(c, "401 Unauthorized"); return; }
  }

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

#ifdef KEENDASH_TLS
static int tsend(void *fd, const unsigned char *p, size_t n) {
  ssize_t w = write(*(int *)fd, p, n);
  return w >= 0 ? (int)w : errno == EINTR ? MBEDTLS_ERR_SSL_WANT_WRITE : MBEDTLS_ERR_NET_SEND_FAILED;
}
static int trecv(void *fd, unsigned char *p, size_t n) {
  ssize_t r = read(*(int *)fd, p, n);
  return r >= 0 ? (int)r : errno == EINTR ? MBEDTLS_ERR_SSL_WANT_READ : MBEDTLS_ERR_NET_RECV_FAILED;
}
#define AGAIN(r) ((r) == MBEDTLS_ERR_SSL_WANT_READ || (r) == MBEDTLS_ERR_SSL_WANT_WRITE)

/* ---- inflate (RFC 1950/1951), for the router's config store ---- */
#define ZMAX (16 << 20)
typedef struct { const unsigned char *in; size_t n, pos; unsigned long bit; int cnt, bad; buf *out; } zs;
typedef struct { short count[16], sym[288]; } huff;
static int bits(zs *s, int need) {
  while (s->cnt < need) {
    if (s->pos >= s->n) { s->bad = 1; return 0; }
    s->bit |= (unsigned long)s->in[s->pos++] << s->cnt; s->cnt += 8;
  }
  int v = (int)(s->bit & ((1UL << need) - 1));
  s->bit >>= need; s->cnt -= need;
  return v;
}
/* canonical Huffman code from code lengths: < 0 over-subscribed, > 0 incomplete */
static int build(huff *h, const short *len, int n) {
  short offs[16]; int left = 1;
  memset(h->count, 0, sizeof h->count);
  for (int i = 0; i < n; i++) h->count[len[i]]++;
  if (h->count[0] == n) return 0;
  for (int l = 1; l < 16; l++) { left = (left << 1) - h->count[l]; if (left < 0) return -1; }
  offs[1] = 0;
  for (int l = 1; l < 15; l++) offs[l + 1] = offs[l] + h->count[l];
  for (int i = 0; i < n; i++) if (len[i]) h->sym[offs[len[i]]++] = (short)i;
  return left;
}
static int decode(zs *s, const huff *h) {
  int code = 0, first = 0, index = 0;
  for (int l = 1; l < 16; l++) {
    code |= bits(s, 1);
    if (s->bad) return -1;
    int c = h->count[l];
    if (code - c < first) return h->sym[index + code - first];
    index += c; first = (first + c) << 1; code <<= 1;
  }
  return -1;
}
static int codes(zs *s, const huff *lc, const huff *dc) {
  static const short lb[29] = { 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258 },
    le[29] = { 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0 },
    db[30] = { 1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577 },
    de[30] = { 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13 };
  for (;;) {
    int y = decode(s, lc);
    if (y < 0 || s->out->n > ZMAX) return -1;
    if (y < 256) { char ch = (char)y; bput(s->out, &ch, 1); continue; }
    if (y == 256) return 0;
    if ((y -= 257) >= 29) return -1;
    size_t len = lb[y] + bits(s, le[y]);
    int d = decode(s, dc);
    if (d < 0 || d >= 30) return -1;
    size_t dist = db[d] + bits(s, de[d]);
    if (s->bad || dist > s->out->n) return -1;
    while (len--) { char ch = s->out->p[s->out->n - dist]; bput(s->out, &ch, 1); }
  }
}
static int dynamic(zs *s) {
  static const short ord[19] = { 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 };
  short len[316] = { 0 }; huff lc, dc;
  int nl = bits(s, 5) + 257, nd = bits(s, 5) + 1, nc = bits(s, 4) + 4;
  if (s->bad || nl > 286 || nd > 30) return -1;
  for (int i = 0; i < nc; i++) len[ord[i]] = (short)bits(s, 3);
  if (build(&lc, len, 19)) return -1;
  for (int i = 0; i < nl + nd; ) {
    int y = decode(s, &lc), l = 0, rep;
    if (y < 0) return -1;
    if (y < 16) { len[i++] = (short)y; continue; }
    if (y == 16) { if (!i) return -1; l = len[i - 1]; rep = 3 + bits(s, 2); }
    else rep = y == 17 ? 3 + bits(s, 3) : 11 + bits(s, 7);
    if (s->bad || i + rep > nl + nd) return -1;
    while (rep--) len[i++] = (short)l;
  }
  if (!len[256]) return -1;
  int e = build(&lc, len, nl);
  if (e < 0 || (e > 0 && nl - lc.count[0] != 1)) return -1;
  e = build(&dc, len + nl, nd);
  if (e < 0 || (e > 0 && nd - dc.count[0] != 1)) return -1;
  return codes(s, &lc, &dc);
}
/* a zlib stream at p (no checksum check: the store's own text is checked) */
static int inflate(const unsigned char *p, size_t n, buf *out) {
  if (n < 2 || (p[0] & 15) != 8 || ((p[0] << 8) | p[1]) % 31 || (p[1] & 32)) return -1;
  zs s = { p, n, 2, 0, 0, 0, out };
  bput(out, "", 0);
  for (int last = 0; !last; ) {
    last = bits(&s, 1);
    int t = bits(&s, 2), r;
    if (s.bad) return -1;
    if (t == 0) {
      s.bit = 0; s.cnt = 0;
      if (s.pos + 4 > n) return -1;
      unsigned l = p[s.pos] | p[s.pos + 1] << 8, nl = p[s.pos + 2] | p[s.pos + 3] << 8;
      if (l != (~nl & 0xffff) || (s.pos += 4) + l > n) return -1;
      bput(out, (const char *)p + s.pos, l); s.pos += l; r = 0;
    } else if (t == 1) {
      static huff fl, fd; static int ready;
      if (!ready) {
        short l[288];
        for (int i = 0; i < 288; i++) l[i] = i < 144 ? 8 : i < 256 ? 9 : i < 280 ? 7 : 8;
        build(&fl, l, 288);
        for (int i = 0; i < 30; i++) l[i] = 5;
        build(&fd, l, 30); ready = 1;
      }
      r = codes(&s, &fl, &fd);
    } else r = t == 2 ? dynamic(&s) : -1;
    if (r) return -1;
  }
  return 0;
}

/* ---- the router's KeenDNS certificate (Let's Encrypt, renewed by the router itself) ----
 * NDMS keeps it in its config partitions (Config_1, Config_2): next to the startup-config there is a zlib-compressed
 * store of "NAME\0value\0" pairs, with ACME_CERT_<name>_CERT_PEM, _CHAIN_PEM, _DOMAIN_PEM (the key) and _ISSUE_DATE.
 * Read straight into memory: the key is never written to a file. */
static buf tcrt, tkey; /* PEM: certificate + chain, key */
static void wipe(buf *b) { if (b->p) { mbedtls_platform_zeroize(b->p, b->cap); free(b->p); } memset(b, 0, sizeof *b); }
/* the certificate for fqdn in an inflated store (NUL-terminated by bput), kept if newer than *best */
static void store(const char *s, size_t n, long *best) {
  char pre[300]; size_t pl = (size_t)snprintf(pre, sizeof pre, "ACME_CERT_%s_", fqdn);
  const char *crt = NULL, *chain = "", *key = NULL; long issue = 0;
  for (const char *p = s, *e; p < s + n && (e = memchr(p, 0, s + n - p)); p = e + 1) {
    const char *t = p + pl, *v = e + 1;
    if ((size_t)(e - p) <= pl || memcmp(p, pre, pl)) continue;
    if (!strcmp(t, "CERT_PEM")) crt = v;
    else if (!strcmp(t, "CHAIN_PEM")) chain = v;
    else if (!strcmp(t, "DOMAIN_PEM")) key = v;
    else if (!strcmp(t, "ISSUE_DATE")) issue = atol(v);
  }
  if (issue > *best && crt && key && !strncmp(crt, "-----BEGIN CERTIFICATE", 22) && strstr(key, "PRIVATE KEY")) {
    *best = issue; wipe(&tcrt); wipe(&tkey);
    bs(&tcrt, crt); bs(&tcrt, chain); bs(&tkey, key);
  }
}
/* 1 if found. The KeenDNS name from the router (tests: KEENDASH_NDNS), the partitions from /proc/mtd
 * (tests: KEENDASH_CONFIG, a list of files) */
static int keendns(void) {
  buf o = { 0 }; lines L = cmd("KEENDASH_NDNS", "ndmc -c 'show ndns' 2>/dev/null", &o);
  char nm[128] = "", dm[128] = "";
  for (int i = 0; i < L.n; i++) {
    const char *p = L.l[i] + strspn(L.l[i], " \t");
    if (!*nm && !strncmp(p, "name: ", 6)) sscanf(p + 6, "%127s", nm);
    if (!*dm && !strncmp(p, "domain: ", 8)) sscanf(p + 8, "%127s", dm);
  }
  free(L.l); free(o.p);
  if (!*nm || !*dm) return 0;
  snprintf(fqdn, sizeof fqdn, "%s.%s", nm, dm);
  char devs[1024] = "", *env = getenv("KEENDASH_CONFIG");
  if (env) snprintf(devs, sizeof devs, "%s", env);
  else {
    /* mtd6: 00080000 00020000 "Config_1" */
    FILE *f = fopen("/proc/mtd", "r"); char l[256], name[64]; int m;
    while (f && fgets(l, sizeof l, f))
      if (sscanf(l, "mtd%d: %*x %*x \"%63[^\"]\"", &m, name) == 2 && !strncasecmp(name, "config", 6))
        snprintf(devs + strlen(devs), sizeof devs - strlen(devs), "/dev/mtd%d ", m);
    if (f) fclose(f);
  }
  long best = 0;
  for (char *d = strtok(devs, " "); d; d = strtok(NULL, " ")) {
    int fd = open(d, O_RDONLY | O_CLOEXEC);
    if (fd < 0) continue;
    buf part = { 0 }; slurp(fd, &part, ZMAX); close(fd);
    const unsigned char *p = (const unsigned char *)part.p;
    for (size_t i = 0; i + 1 < part.n; i++)
      if (p[i] == 0x78 && (p[i + 1] == 0x01 || p[i + 1] == 0x5e || p[i + 1] == 0x9c || p[i + 1] == 0xda)) {
        buf z = { 0 };
        if (!inflate(p + i, part.n - i, &z)) store(z.p, z.n, &best);
        wipe(&z);
      }
    wipe(&part);
  }
  return best > 0;
}

/* one HTTPS connection (a child of the server): the TLS side here, the request itself is handled by handle()
 * as plain HTTP on the other end of a socket pair. Everything is set up per connection, after the fork: the random
 * generator gets its own seed, and a renewed certificate (re-read by the server) is used without a restart. */
static void tls(int c, const char *www) {
  mbedtls_entropy_context ent; mbedtls_ctr_drbg_context rng; mbedtls_x509_crt cert; mbedtls_pk_context pk;
  mbedtls_ssl_config cf; mbedtls_ssl_context s;
  mbedtls_entropy_init(&ent); mbedtls_ctr_drbg_init(&rng); mbedtls_x509_crt_init(&cert); mbedtls_pk_init(&pk);
  mbedtls_ssl_config_init(&cf); mbedtls_ssl_init(&s);
  alarm(20);
  if (mbedtls_ctr_drbg_seed(&rng, mbedtls_entropy_func, &ent, (const unsigned char *)"keendashd", 9)
      || mbedtls_x509_crt_parse(&cert, (const unsigned char *)tcrt.p, tcrt.n + 1)
      || mbedtls_pk_parse_key(&pk, (const unsigned char *)tkey.p, tkey.n + 1, NULL, 0, mbedtls_ctr_drbg_random, &rng)
      || mbedtls_ssl_config_defaults(&cf, MBEDTLS_SSL_IS_SERVER, MBEDTLS_SSL_TRANSPORT_STREAM, MBEDTLS_SSL_PRESET_DEFAULT))
    return;
  mbedtls_ssl_conf_rng(&cf, mbedtls_ctr_drbg_random, &rng);
  if (mbedtls_ssl_conf_own_cert(&cf, &cert, &pk) || mbedtls_ssl_setup(&s, &cf)) return;
  mbedtls_ssl_set_bio(&s, &c, tsend, trecv, NULL);
  int r;
  while ((r = mbedtls_ssl_handshake(&s))) if (!AGAIN(r)) return;
  int sp[2];
  if (socketpair(AF_UNIX, SOCK_STREAM | SOCK_CLOEXEC, 0, sp)) return;
  pid_t h = fork();
  if (h < 0) return;
  if (h == 0) { close(sp[0]); close(c); https = 1; handle(sp[1], www); _exit(0); }
  close(sp[1]);
  /* relay: the client's request to handle(), its answer back, until handle() is done */
  unsigned char b[16384]; int up = 1;
  for (;;) {
    struct pollfd pf[2] = { { up ? c : -1, POLLIN, 0 }, { sp[0], POLLIN, 0 } };
    if (up && mbedtls_ssl_get_bytes_avail(&s)) pf[0].revents = POLLIN; /* already decrypted, poll would not see it */
    else if (poll(pf, 2, -1) < 0) { if (errno == EINTR) continue; break; }
    if (up && pf[0].revents) {
      int n = mbedtls_ssl_read(&s, b, sizeof b);
      if (n > 0) writeall(sp[0], (char *)b, n);
      else if (!AGAIN(n)) { up = 0; shutdown(sp[0], SHUT_WR); }
    }
    if (pf[1].revents) {
      ssize_t n = read(sp[0], b, sizeof b);
      if (n < 0 && errno == EINTR) continue;
      if (n <= 0) break;
      for (ssize_t o = 0; o < n; ) {
        int w = mbedtls_ssl_write(&s, b + o, n - o);
        if (w > 0) o += w; else if (!AGAIN(w)) goto done;
      }
    }
  }
  mbedtls_ssl_close_notify(&s);
done:
  close(sp[0]);
  waitpid(h, NULL, 0);
}
#endif

static int listener(const char *ip, const char *port) {
  struct sockaddr_in a; memset(&a, 0, sizeof a);
  a.sin_family = AF_INET; a.sin_port = htons((unsigned short)atoi(port));
  if (inet_pton(AF_INET, ip, &a.sin_addr) != 1) { fprintf(stderr, "keendashd: bad address %s\n", ip); return -1; }
  int l = socket(AF_INET, SOCK_STREAM | SOCK_CLOEXEC, 0), one = 1;
  if (l < 0 || setsockopt(l, SOL_SOCKET, SO_REUSEADDR, &one, sizeof one) || bind(l, (struct sockaddr *)&a, sizeof a) || listen(l, 32)) {
    fprintf(stderr, "keendashd: %s:%s: %s\n", ip, port, strerror(errno));
    if (l >= 0) close(l);
    return -1;
  }
  return l;
}

static time_t mono(void) { struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t); return t.tv_sec; }
static void woken(int s) { (void)s; } /* SIGCHLD interrupts poll(), so finished children are reaped at once */
static pid_t tick(const char *what) {
  pid_t p = fork();
  if (p == 0) { execl(SHARE "/bin/tick", "tick", what, (char *)NULL); _exit(127); }
  return p > 0 ? p : 0;
}

/* tport: HTTPS, or NULL */
static int serve(const char *ip, const char *port, const char *www, const char *tport) {
  int l = listener(ip, port), tl = -1;
  if (l < 0) return 1;
#ifdef KEENDASH_TLS
  if (tport && (tl = listener("0.0.0.0", tport)) < 0) return 1;
  if (tport && !keendns()) { fprintf(stderr, "keendashd: no KeenDNS certificate on the router, HTTPS is off\n"); return 1; }
#else
  if (tport) { fprintf(stderr, "keendashd: built without HTTPS\n"); return 1; }
#endif
  pid_t p = fork();
  if (p < 0) { perror("keendashd"); return 1; }
  if (p) { printf("%d\n", (int)p); if (tl >= 0) printf("%s\n", fqdn); return 0; }
  setsid();
  if (chdir("/")) {}
  int z = open("/dev/null", O_RDWR);
  if (z >= 0) { dup2(z, 0); dup2(z, 1); dup2(z, 2); if (z > 2) close(z); }
  /* started from opkg or nohup: undo inherited "ignore", children and scripts need the defaults */
  signal(SIGPIPE, SIG_DFL); signal(SIGHUP, SIG_DFL);
  struct sigaction sa; memset(&sa, 0, sizeof sa);
  sa.sa_handler = woken; sigaction(SIGCHLD, &sa, NULL);

  time_t next1 = 0, next5 = 0;
#ifdef KEENDASH_TLS
  time_t nextc = mono() + 6 * 3600;
#endif
  pid_t t1 = 0, t5 = 0; int conns = 0;
  for (;;) {
    pid_t w;
    while ((w = waitpid(-1, NULL, WNOHANG)) > 0) { if (w == t1) t1 = 0; else if (w == t5) t5 = 0; else conns--; }
    time_t now = mono();
    /* a run still going when the next one is due is skipped, not doubled */
    if (now >= next1) { if (!t1) t1 = tick("1"); next1 = now + 60; }
    if (now >= next5) { if (!t5) t5 = tick("5"); next5 = now + 300; }
#ifdef KEENDASH_TLS
    /* a renewed certificate: read here, in the server, so the key stays in its memory */
    if (tl >= 0 && now >= nextc) { keendns(); nextc = now + 6 * 3600; }
#endif
    struct pollfd pf[2] = { { l, POLLIN, 0 }, { tl, POLLIN, 0 } };
    if (poll(pf, tl < 0 ? 1 : 2, (int)((next1 < next5 ? next1 : next5) - now) * 1000) <= 0) continue;
    int sec = !pf[0].revents;
    struct sockaddr_in a; socklen_t al = sizeof a;
    int c = accept4(sec ? tl : l, (struct sockaddr *)&a, &al, SOCK_CLOEXEC);
    if (c < 0) continue;
    while ((w = waitpid(-1, NULL, WNOHANG)) > 0) { if (w == t1) t1 = 0; else if (w == t5) t5 = 0; else conns--; }
    if (conns >= MAXCONN) { close(c); continue; }
    pid_t h = fork();
    if (h == 0) {
      signal(SIGCHLD, SIG_DFL); close(l); if (tl >= 0) close(tl);
#ifdef KEENDASH_TLS
      if (sec) { inet_ntop(AF_INET, &a.sin_addr, peer, sizeof peer); tls(c, www); close(c); _exit(0); }
#endif
      handle(c, www); close(c); _exit(0);
    }
    if (h > 0) conns++;
    close(c);
  }
}

int main(int argc, char **argv) {
  if ((argc == 5 || argc == 6) && !strcmp(argv[1], "serve")) return serve(argv[2], argv[3], argv[4], argc == 6 ? argv[5] : NULL);
  if (argc == 2 && !strcmp(argv[1], "status")) { buf o = { 0 }; status(&o); fwrite(o.p, 1, o.n, stdout); return 0; }
  if (argc == 2 && !strcmp(argv[1], "json")) return json();
  fprintf(stderr, "usage: keendashd serve <ip> <port> <www> [<https port>] | status | json\n");
  return 2;
}
