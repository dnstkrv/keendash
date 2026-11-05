/* "Сервисы" dashboard card for the Keenetic web UI: service status + tabs with details and sparkline graphs.
 * Clones a native dashboard card (styles match) and has its own drag-and-drop between native CDK columns. */
(function () {
  "use strict";
  if (window.__servicesWidget) return;
  window.__servicesWidget = true;

  /* base URL of keendash's web server; the loader injected by keendash sets window.__keendash.base */
  var BASE = (window.__keendash && window.__keendash.base) || ("http://" + location.hostname + ":8189/");
  /* over https the loader points BASE at the web UI's /storage/: keendashd keeps status.json there, rebuilt only
   * while it is read; nothing can be POSTed there, the update button reads keendash's "update" file instead */
  var ST = !!(window.__keendash && window.__keendash.st);
  var API = BASE + (ST ? "status.json" : "cgi-bin/status.cgi");
  var KEY = "ui.services.pos", TABKEY = "ui.services.tab", SKIPKEY = "ui.services.skip", MTABKEY = "ui.services.media";
  var ORDKEY = "ui.services.order", MORDKEY = "ui.services.morder";
  var TITLE = "Сервисы";
  var TABS = [["telemt", "telemt"], ["awg", "AWG"], ["firc", "firc"], ["nfqws", "nfqws"], ["hydra", "Hydra"], ["tailscale", "Tailscale"], ["ascn", "Antiscan"], ["sys", "Система"]];
  /* the group tabs (one per service group) go in front of this tab by default */
  var GRPAT = "ascn";
  /* tab id -> services whose web UI the "Открыть" link points to (link itself is auto-detected) */
  var TABSVC = { telemt: ["telemt-panel"], awg: ["awg-manager"], firc: ["firc"], nfqws: ["nfqws2", "nfqws"], hydra: ["hrweb"] };
  var TABWEB = { nfqws: /nfqws/i };
  var PXKIND = { "freeturn-server": "FreeTurn", "wdtt-server": "WDTT" };
  var OK = "#3ecf8e", BAD = "#ff6b6b", ACC = "#4da3ff", WARN = "#f5a623", OFF = "#7b8798";

  var row = null, bodyEl = null, lastData = null, dragging = false, placeholder = null, tabDrag = null;
  var tab = "telemt";
  /* upgrade started from this page: target version; upRun once update.cgi accepted it; upErr after a failed one */
  var upTo = "", upRun = false, upErr = false, upTimer = null, upAt = 0;
  try { tab = localStorage.getItem(TABKEY) || "telemt"; } catch (e) {}
  var mtab = "";
  try { mtab = localStorage.getItem(MTABKEY) || ""; } catch (e) {}

  /* the user's tab order (tabs are dragged to reorder); tabs not in it yet go after the saved ones, in default order */
  function ordered(list, key) {
    var o = [];
    try { o = JSON.parse(localStorage.getItem(key)) || []; } catch (e) {}
    function rank(t) { var i = o.indexOf(t[0]); return i < 0 ? o.length + list.indexOf(t) : i; }
    return list.slice().sort(function (a, b) { return rank(a) - rank(b); });
  }
  function loadPos() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } }
  function savePos(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  function columns() { return Array.prototype.slice.call(document.querySelectorAll(".ndw-drag-panel__column")); }
  function isRow(el) { return el.classList && el.classList.contains("ndw-drag-panel__row"); }
  function foreignRows(col) {
    return Array.prototype.filter.call(col.children, function (c) { return c !== row && c !== placeholder && isRow(c); });
  }
  function templateRow() {
    var seg = document.querySelector("ndw-segments-card");
    var r = seg && seg.closest(".ndw-drag-panel__row");
    if (!r) { var any = document.querySelector("ndw-dashboard-card"); r = any && any.closest(".ndw-drag-panel__row"); }
    return r;
  }

  /* ---------- rendering helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* KeenDNS web apps (d.ndp: [fqdn, host, port, upstream is the router itself]): with the web UI opened by the router's
   * domain name, a service published there is linked by its own name, http://<name>:<port> is usually closed from outside.
   * Keys: "host:port", and "@port" for the router's own services */
  var PROXY = {};
  function proxies(d) {
    var h = "." + location.hostname;
    PROXY = {};
    (d.ndp || []).forEach(function (p) {
      if (p[0].slice(-h.length) !== h) return;
      var u = "https://" + p[0] + "/";
      PROXY[p[1] + ":" + p[2]] = PROXY[p[1] + ":" + p[2]] || u;
      if (p[3]) PROXY["@" + p[2]] = PROXY["@" + p[2]] || u;
    });
  }
  function url(port) { return PROXY["@" + port] || "http://" + location.hostname + ":" + port + "/"; }
  function fmtBytes(b) {
    if (b == null || isNaN(b)) return "—";
    var u = ["Б", "КБ", "МБ", "ГБ", "ТБ"], i = 0;
    while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
    return (b >= 100 || i === 0 ? Math.round(b) : b.toFixed(1)) + " " + u[i];
  }
  function fmtDur(s) {
    s = Math.floor(s || 0);
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
    if (d) return d + "д " + h + "ч";
    if (h) return h + "ч " + m + "м";
    return Math.max(m, 0) + "м";
  }
  function rates(arr) {
    var out = [];
    for (var i = 1; i < arr.length; i++) out.push(Math.max(0, (arr[i] - arr[i - 1]) / 60));
    return out;
  }
  function spark(vals, color) {
    if (!vals || vals.length < 2) return '<div class="us-spark us-empty">набираются данные…</div>';
    var W = 200, H = 44, max = Math.max.apply(null, vals), min = 0;
    if (max <= 0) max = 1;
    var step = W / (vals.length - 1), pts = [];
    for (var i = 0; i < vals.length; i++) pts.push((i * step).toFixed(1) + "," + (H - 3 - (vals[i] - min) / (max - min) * (H - 8)).toFixed(1));
    var line = pts.join(" ");
    return '<svg class="us-spark" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none">' +
      '<polygon points="0,' + H + " " + line + " " + W + "," + H + '" fill="' + color + '" opacity=".16"/>' +
      '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
  }
  function blk(label, value, vals, color) {
    return '<div class="us-blk"><div class="us-bh"><span class="us-lbl">' + label + '</span><b class="us-val">' + value + "</b></div>" +
      (vals === null ? "" : spark(vals, color || ACC)) + "</div>";
  }
  function bar(pct, color) { return '<div class="us-bar"><i style="width:' + Math.min(100, Math.max(0, +pct || 0)) + '%;background:' + color + '"></i></div>'; }
  function note(text) { return '<div class="us-note">' + text + "</div>"; }
  function sec(text) { return '<div class="us-sec">' + text + "</div>"; }
  function dot(c) { return '<i class="us-dot" style="background:' + c + '"></i>'; }
  function line(color, left, right, dim) {
    return '<div class="us-row' + (dim ? " us-dim" : "") + '">' + dot(color) + '<span class="us-nm">' + left + '</span><span class="us-r">' + right + "</span></div>";
  }
  function last(a) { return a && a.length ? a[a.length - 1] : null; }
  function div(a, k) { return (a || []).map(function (x) { return x / k; }); }

  /* ---------- tabs ---------- */
  function tabTelemt(d, s) {
    var t = d.telemt || {}, tr = rates(s.telemt_octets || []), h;
    h = '<div class="us-grid">' + blk("Подключения", t.ok ? t.conn : "—", s.telemt_conn || [], ACC) +
      blk("Трафик", t.ok ? fmtBytes(last(tr)) + "/с" : "—", tr, OK) + "</div>";
    if (!t.ok) return h + note('<span style="color:' + BAD + '">API telemt недоступен</span>');
    var list = (t.list || []).slice().sort(function (a, b) { return b[3] - a[3]; });
    h += sec("Пользователи (" + t.users + " онлайн из " + t.cfg + ")");
    list.forEach(function (u) {
      h += line(u[1] > 0 ? OK : OFF, esc(u[0]), (u[1] > 0 ? u[1] + " подкл · " : "") + fmtBytes(u[3]), u[1] === 0);
    });
    return h + note("Аптайм telemt: <b>" + fmtDur(t.up) + "</b> · неудачных подключений: <b>" + t.bad + "</b>");
  }
  function tabAwg(d, s) {
    var a = d.awg || {}, ar = rates(s.awg_bytes || []), h = sec("Туннели");
    if (a.nokey) h += note('<span style="color:' + BAD + '">В awg-manager включён вход по паролю</span> · чтобы keendash видел туннели, сгенерируйте API-ключ в настройках awg-manager');
    (a.tun || []).forEach(function (x) {
      h += line(x[1] ? OK : OFF, esc(x[0]), x[1] ? "↓ " + fmtBytes(x[2]) + " · ↑ " + fmtBytes(x[3]) + " · " + fmtDur(x[4]) : "выключен", !x[1]);
    });
    h += '<div class="us-grid">' + blk("Трафик туннелей", fmtBytes(last(ar)) + "/с", ar, OK) +
      blk("Активных туннелей", a.up + " / " + a.total, s.awg_up || [], ACC) + "</div>";
    if ((a.px || []).length) h += sec("Раздача");
    (a.px || []).forEach(function (x) {
      var kind = PXKIND[x[1]] || x[1], r = [];
      if (x[4] !== null) r.push("клиентов " + x[4]);
      if (x[5]) r.push(":" + x[5]);
      r.push(fmtDur(x[3]));
      h += line(x[2] ? OK : OFF, esc(x[0] ? x[0] + " · " + kind : kind), x[2] ? esc(r.join(" · ")) : "остановлен", !x[2]);
    });
    return h;
  }
  // escapes of a YAML double-quoted string: \U0001F6D1, é, \x41, \", \\
  function yamlStr(v) {
    return String(v).replace(/\\(U[0-9a-fA-F]{8}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, function (m, e) {
      if (e.length > 1) try { return String.fromCodePoint(parseInt(e.slice(1), 16)); } catch (x) { return m; }
      return e === "n" || e === "t" ? " " : e;
    });
  }
  function tabFirc(d, s) {
    var f = d.firc || {}, list = (f.list || []).slice().sort(function (a, b) { return b[3] - a[3] || b[2] - a[2]; });
    var h = '<div class="us-grid">' + blk("Доменов в пуле", f.domains, s.firc_domains || [], ACC) +
      blk("Групп включено", f.enabled + " / " + f.groups, null) + "</div>" + sec("Группы по числу доменов");
    list.slice(0, 8).forEach(function (g) {
      h += line(g[2] ? OK : OFF, esc(yamlStr(g[0])) +(g[1] ? ' <span class="us-tag">' + esc(g[1]) + "</span>" : ""), g[3], !g[2]);
    });
    if (list.length > 8) h += note("и ещё " + (list.length - 8) + " групп");
    return h;
  }
  function ccTag(cc) {
    if (!cc) return "";
    var name = cc;
    try { name = new Intl.DisplayNames(["ru"], { type: "region" }).of(cc) || cc; } catch (e) {}
    return ' <span class="us-tag" title="' + esc(name) + '">' + esc(cc) + "</span>";
  }
  function tabAscn(d, s) {
    var c = d.ascn || {}, names = { ips: "адрес", subnets: "подсеть", honeypot: "ловушка" };
    var h = '<div class="us-grid">' + blk("Заблокировано адресов", c.ips, s.ascn_ips || [], BAD) +
      blk("Поймано ловушкой", c.honeypot, s.ascn_honeypot || [], ACC) + "</div>" +
      note("Подсетей в бане: <b>" + c.subnets + "</b> · под наблюдением: <b>" + c.candidates + "</b>");
    if ((c.bans || []).length) {
      h += sec("Последние в бане");
      c.bans.forEach(function (b) {
        h += line(b[0] === "honeypot" ? WARN : BAD, esc(b[1]) + ' <span class="us-tag">' + (names[b[0]] || b[0]) + "</span>" + ccTag(b[3]), "ещё " + fmtDur(b[2]));
      });
    }
    return h;
  }
  function evText(m) {
    var x = /^fail counter ([0-9]+)\/([0-9]+)/.exec(m);
    if (x) return "сбой " + x[1] + " из " + x[2];
    if (/retrans/i.test(m)) return "ретрансмиты";
    if (/duplicate/i.test(m)) return "уже в списке";
    return m;
  }
  function tabNfqws(d, s) {
    var n = d.nfq || {}, pr = rates(s.nfq_pkts || []), p = last(pr);
    var h = '<div class="us-grid">' + blk("Пакетов в обработке", (p == null ? "—" : (p >= 10 ? Math.round(p) : p.toFixed(1))) + " /с", pr, ACC) +
      blk("Доменов в автосписке", n.auto, s.nfq_auto || [], OK) + "</div>";
    h += line(n.run ? OK : BAD, "Процесс", n.run ? fmtDur(n.up) + " · " + (n.mem / 1024).toFixed(1) + " МБ" : "не запущен");
    h += line(n.drop > 0 ? BAD : OK, "Потеряно пакетов", n.drop);
    h += line(OK, "Списки доменов", "свои " + n.user + " · авто " + n.auto + " · исключения " + n.excl);
    h += line(OK, "IP-списков", n.ipsets);
    h += line(OK, "Событий автолиста сегодня", n.today);
    var mon = (n.mon || []).slice();
    if (!mon.length) mon = (d.nfq && d.nfq.mon) || [];
    if (mon.length) {
      var now = d.now || (Date.now() / 1000);
      mon.sort(function (a, b) { return (a[2] - b[2]) || (b[3] - a[3]); });
      h += sec("Доступность сайтов");
      mon.slice(0, 6).forEach(function (m) {
        var stale = now - m[1] > 10800;
        h += line(m[2] ? OK : BAD, esc(m[0]), m[2] ? m[3] + " мс" : "недоступен", stale);
      });
    }
    if ((n.ev || []).length) {
      h += sec("Последние события");
      n.ev.forEach(function (e) { h += line(WARN, esc(e[1]), esc(e[0]) + " · " + esc(evText(e[2]))); });
    }
    return h;
  }
  function tabHydra(d, s) {
    var y = d.hydra || {}, list = y.list || [];
    var h = '<div class="us-grid">' + blk("Адресов в маршрутизации", y.ips, s.hr_ips || [], ACC) +
      blk("Доменов в списках", y.keys, null) + "</div>";
    h += line(y.run ? OK : BAD, "hrneo", y.run ? fmtDur(y.up) + " · " + (y.mem / 1024).toFixed(1) + " МБ" : "не запущен");
    if (!list.length) return h + note("Правил нет — их можно добавить в HRweb");
    h += sec("Правила");
    list.forEach(function (t) {
      var ips = t[2] + t[3];
      h += line(ips ? OK : OFF, esc(t[0]) + ' <span class="us-tag">' + (t[4] ? "интерфейс" : "политика") + "</span>",
        (t[1] ? "доменов " + t[1] + " · " : "") + "адресов " + ips, !ips);
    });
    return h;
  }
  var TSSTATE = { Running: [OK, "подключён"], Starting: [WARN, "подключается"], NeedsLogin: [BAD, "нужен вход: tailscale up"],
    NeedsMachineAuth: [WARN, "ждёт одобрения в админке"], Stopped: [OFF, "остановлен: tailscale up"] };
  /* tailscale's LastSeen: ISO time, year 1 when it never was or the peer is online */
  function seen(iso, now) {
    var t = Date.parse(iso) / 1000;
    if (!(t > 0)) return "не в сети";
    return "был в сети " + (now - t > 30 * 86400 ? new Date(t * 1000).toLocaleDateString("ru-RU") : fmtDur(now - t) + " назад");
  }
  function tabTs(d, s) {
    var t = d.ts || {}, me = (t.self || [])[0], br = rates(s.ts_bytes || []), now = d.now || Date.now() / 1000;
    var h = '<div class="us-grid">' + blk("Трафик", fmtBytes(last(br)) + "/с", br, OK) +
      blk("Устройств в сети", (t.online || 0) + " / " + (t.total || 0), s.ts_online || [], ACC) + "</div>";
    h += line(t.run ? OK : BAD, "tailscaled", t.run ? fmtDur(t.up) + " · " + (t.mem / 1024).toFixed(1) + " МБ" : "не запущен");
    if (!t.run || !me) return h;
    /* this router: state, name, Tailscale address, home DERP region */
    var st = TSSTATE[me[0]] || [WARN, me[0] || "состояние неизвестно"], r = [st[1]];
    if (me[2]) r.push(me[2]);
    if (me[3]) r.push("DERP " + me[3]);
    h += line(st[0], '<span title="' + esc(me[1]) + '">Этот роутер</span>', esc(r.join(" · ")));
    var x = [];
    if (me[4]) x.push("выход в интернет через <b>" + esc(me[4]) + "</b>");
    if (me[5]) x.push("роутер предлагается как выходной узел");
    if (me[6]) x.push("раздаёт подсети: " + esc(me[6]));
    if (x.length) h += note(x.join(" · "));
    if (me[7]) h += note('<span style="color:' + WARN + '">' + esc(me[7]) + "</span>");
    /* peers: online first, then the most recently seen */
    var list = (t.list || []).slice().sort(function (a, b) { return b[2] - a[2] || (Date.parse(b[6]) || 0) - (Date.parse(a[6]) || 0); });
    if (list.length) h += sec("Устройства");
    list.slice(0, 8).forEach(function (p) {
      var tags = ' <span class="us-tag">' + esc(p[1]) + "</span>" + (p[9] ? ' <span class="us-tag">выход</span>' : p[10] ? ' <span class="us-tag">exit node</span>' : "") +
        (p[11] ? ' <span class="us-tag" title="' + esc(p[11]) + '">подсети</span>' : "");
      /* the connection type is known only while there is traffic */
      var rt = !p[2] ? seen(p[6], now) : !p[3] ? "в сети" : (p[4] ? "напрямую" : "через DERP" + (p[5] ? " " + p[5] : "")) + " · ↓ " + fmtBytes(p[7]) + " · ↑ " + fmtBytes(p[8]);
      h += line(p[2] ? OK : OFF, esc(p[0]) + tags, esc(rt), !p[2]);
    });
    if (list.length > 8) h += note("и ещё " + (list.length - 8) + " устройств");
    return h;
  }
  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function hhmm(t) { var x = new Date(t * 1000); return ("0" + x.getHours()).slice(-2) + ":" + ("0" + x.getMinutes()).slice(-2); }
  /* third-party services: ok is null until keendash's cron has asked their API once */
  var WAIT = "Данные появятся в течение минуты", NODATA = "нет данных (" + (ST ? "status.json" : "status.cgi") + " недоступен)";
  /* a third-party service's own address, with the router's loopback made reachable from the browser */
  function extUrl(u) {
    var m = /^http:\/\/([^\/:]+)(?::(\d+))?\/?$/.exec(u || "");
    if (m) {
      var p = m[2] || "80", k = /^(127\.0\.0\.1|localhost)$/.test(m[1]) ? "@" + p : m[1] + ":" + p;
      if (PROXY[k]) return PROXY[k];
    }
    return u ? u.replace(/\/\/(127\.0\.0\.1|localhost)(?=[:\/]|$)/, "//" + location.hostname).replace(/\/?$/, "/") : "";
  }
  function dm(t) { var x = new Date(t * 1000); return ("0" + x.getDate()).slice(-2) + "." + ("0" + (x.getMonth() + 1)).slice(-2); }
  /* Sonarr / Radarr: queue, missing, the coming week; cal(c) -> [left, right, dim] */
  function arrView(x, what, cal) {
    var h = line(x.queue ? ACC : OFF, "В очереди", x.queue);
    if (x.missing != null) h += line(x.missing ? WARN : OK, "Не скачано " + what, fmtN(+x.missing || 0));
    if ((x.list || []).length) {
      h += sec("Загружается");
      x.list.forEach(function (q) { h += line(ACC, esc(q[0]), q[1] + "%" + (q[2] >= 0 ? " · " + fmtDur(q[2]) : "")); });
    }
    if ((x.cal || []).length) {
      h += sec("Выходит на этой неделе");
      x.cal.forEach(function (c) { var r = cal(c); h += line(r[2] ? OFF : OK, r[0], r[1], r[2]); });
    }
    return h;
  }
  var RKIND = { c: "в кино", d: "цифровой релиз", p: "на диске" };
  /* AdGuard Home and Pi-hole: the two graphs, the note nt, top blocked domains, clients */
  function dnsView(x, nt) {
    var sq = [].concat(x.sq || []), sb = [].concat(x.sb || []);
    /* the stats period: 24 hourly points by default, 168 for a 7-day interval, daily points for longer ones */
    var per = x.days ? sq.length + " дн" : sq.length > 24 && sq.length % 24 === 0 ? sq.length / 24 + " дн" : sq.length + " ч";
    var h = '<div class="us-grid">' + blk("Запросов за " + per, fmtN(x.q), sq, ACC) +
      blk("Заблокировано", fmtN(x.b) + (x.q ? " · " + (x.b / x.q * 100).toFixed(1) + "%" : ""), sb, BAD) + "</div>" + note(nt);
    if ((x.top || []).length) {
      h += sec("Заблокировано чаще всего");
      x.top.forEach(function (t) { h += line(BAD, esc(t[0]), fmtN(t[1])); });
    }
    if ((x.cl || []).length) {
      h += sec("Активные клиенты");
      x.cl.forEach(function (c) { h += line(OK, c[0] ? esc(c[0]) + ' <span class="us-tag">' + esc(c[1]) + "</span>" : esc(c[1]), fmtN(c[2])); });
    }
    return h;
  }
  /* view of a service type: (its data, ser(key) -> the series "<id>.<key>", status) -> html */
  var VIEW = {
    agh: function (x, ser, d) {
      var h = dnsView(x, "Среднее время ответа <b>" + x.ms + " мс</b> · фильтров <b>" + x.fon + " из " + x.fall + "</b> · правил <b>" + fmtN(x.rules) + "</b>" +
        (x.upd ? " · обновлены <b>" + fmtDur((d.now || Date.now() / 1000) - x.upd) + "</b> назад" : ""));
      if ((x.last || []).length) {
        h += sec("Последние блокировки");
        x.last.forEach(function (c) { h += line(WARN, esc(c[1]), esc(c[2]) + " · " + hhmm(c[0])); });
      }
      return h;
    },
    pihole: function (x, ser, d) {
      return dnsView(x, "Доменов в списках <b>" + fmtN(x.rules) + "</b> · активных клиентов <b>" + fmtN(x.act) + "</b>" +
        (x.upd ? " · списки обновлены <b>" + fmtDur((d.now || Date.now() / 1000) - x.upd) + "</b> назад" : ""));
    },
    qb: function (x, ser) {
      var h = '<div class="us-grid">' + blk("Загрузка", fmtBytes(x.dl) + "/с", ser("dl"), ACC) + blk("Отдача", fmtBytes(x.up) + "/с", ser("up"), OK) + "</div>";
      if (!x.n) return h + note("Активных загрузок нет");
      h += sec("Загружается (" + x.n + ")");
      (x.list || []).forEach(function (t) {
        h += line(t[2] ? ACC : OFF, esc(t[0]), (t[1] / 10).toFixed(1) + "%" + (t[2] ? " · " + fmtBytes(t[2]) + "/с" : "") + (t[3] > 0 && t[3] < 8640000 ? " · " + fmtDur(t[3]) : ""), !t[2]);
      });
      if (x.n > (x.list || []).length) h += note("и ещё " + (x.n - (x.list || []).length));
      return h;
    },
    plex: function (x) {
      var h = line(x.streams ? OK : OFF, "Сейчас смотрят", x.streams);
      (x.list || []).forEach(function (p) { h += line(p[3] === "playing" ? OK : WARN, esc(p[1]), esc(p[0]) + " · " + p[2] + "%" + (p[3] === "paused" ? " · пауза" : "")); });
      if ((x.libs || []).length) {
        h += sec("Библиотеки");
        x.libs.forEach(function (l) { h += line(ACC, esc(l[0]), esc(fmtN(l[2]))); });
      }
      return h;
    },
    sonarr: function (x) { return arrView(x, "серий", function (c) { return [esc(c[1]) + " " + esc(c[2]), dm(c[0]) + " " + hhmm(c[0]), c[3]]; }); },
    radarr: function (x) { return arrView(x, "фильмов", function (c) { return [esc(c[1]), (RKIND[c[2]] || c[2]) + " · " + dm(c[0]), 0]; }); },
    prowlarr: function (x) {
      var h = line(x.bad ? WARN : OK, "Индексаторы", "включено " + x.on + " из " + x.all);
      h += line(x.fail ? WARN : ACC, "Запросов за 24 ч", fmtN(x.q) + (x.fail ? " · с ошибкой " + fmtN(x.fail) : ""));
      h += line(ACC, "Скачиваний за 24 ч", fmtN(x.g));
      if ((x.list || []).length) {
        h += sec("Отключены после ошибок");
        x.list.forEach(function (n) { h += line(BAD, esc(n[0]), ""); });
      }
      return h;
    },
    overseerr: function (x) {
      return line(x.pending ? WARN : OK, "Ждут одобрения", x.pending) + line(ACC, "В работе", x.processing) +
        line(OK, "Доступны", x.available) + line(OFF, "Всего запросов", x.total);
    },
    immich: function (x) {
      var h = '<div class="us-grid">' + blk("Фото", fmtN(x.photos), null) + blk("Видео", fmtN(x.videos), null) + blk("Занято", fmtBytes(x.usage), null) + "</div>";
      if ((x.list || []).length > 1) {
        h += sec("Пользователи");
        x.list.forEach(function (u) { h += line(ACC, esc(u[0]), fmtN(u[1]) + " фото · " + fmtN(u[2]) + " видео · " + fmtBytes(u[3])); });
      }
      return h;
    },
    /* x.h = [[address, code (0 = no answer), ms, percent over 24 h, "1,0,1" last cells]]; a one-cell history comes as a number */
    check: function (x) {
      var up = +x.up || 0, n = +x.n || 0, v = up + " из " + n;
      var h = '<div class="us-grid">' + blk("Доступно", up < n ? '<span style="color:' + BAD + '">' + v + "</span>" : v, null) + "</div>";
      (x.h || []).forEach(function (r) {
        var c = +r[1] || 0, s = "";
        String(r[4] == null ? "" : r[4]).split(",").filter(Boolean).slice(-30).forEach(function (k) { s += '<i class="' + (k === "1" ? "us-hu" : "us-hd") + '"></i>'; });
        h += line(c ? (c >= 500 ? WARN : OK) : BAD, esc(String(r[0]).replace(/^https:\/\//, "").replace(/\/$/, "")),
          (c ? c + " · " + (+r[2] || 0) + " мс" : "нет ответа") + " · " + (+r[3] || 0) + "%") + '<div class="us-hist">' + s + "</div>";
      });
      return h;
    }
  };
  /* x.state: Klipper print state; file, pct, el (s), left (s, -1 unknown), ext/ext_t and bed/bed_t in degrees */
  VIEW.moonraker = function (x, ser) {
    var S = { printing: ["Печатает", ACC], paused: ["Пауза", WARN], complete: ["Готово", OK], cancelled: ["Отменено", OFF], error: ["Ошибка", BAD], standby: ["Ожидание", OFF] };
    var s = S[x.state] || [esc(x.state), OFF], busy = x.state === "printing" || x.state === "paused";
    var t = function (a, b) { return (+a || 0) + (+b > 0 ? " / " + +b : "") + " °C"; };
    var h = line(s[1], s[0], x.file ? esc(x.file) : "");
    if (busy) h += bar(x.pct, s[1]) + note("Прошло <b>" + fmtDur(x.el) + "</b> · Осталось <b>" + (x.left >= 0 ? fmtDur(x.left) : "—") + "</b>");
    return h + '<div class="us-grid">' + blk("Сопло", t(x.ext, x.ext_t), ser("ext"), WARN) + blk("Стол", t(x.bed, x.bed_t), ser("bed"), ACC) + "</div>";
  };
  /* x.up, x.down: monitor counts; x.list = [[name, status 0 down|1 up|2 pending|3 maintenance, ms, percent up over 24 h or "", "1,0,2" last 30 statuses]] (20 at most); x.n: all monitors */
  VIEW.kuma = function (x) {
    var S = { 0: [BAD, "нет ответа"], 2: [WARN, "ожидание"], 3: [ACC, "обслуживание"] }, list = x.list || [];
    var h = '<div class="us-grid">' + blk("В работе", +x.up || 0, null) + blk("Упало", +x.down > 0 ? '<span style="color:' + BAD + '">' + +x.down + "</span>" : 0, null) + "</div>";
    list.forEach(function (m) {
      var t = S[m[1]], p = m[3] == null || m[3] === "" ? "" : +m[3] + "%", s = "";
      String(m[4] == null ? "" : m[4]).split(",").filter(Boolean).slice(-30).forEach(function (k) { s += '<i class="' + (k === "1" ? "us-hu" : k === "0" ? "us-hd" : "us-hp") + '"></i>'; });
      h += line(t ? t[0] : OK, esc(m[0]), [t ? t[1] : +m[2] > 0 ? +m[2] + " мс" : "", p].filter(Boolean).join(" · ") || "работает") + (s ? '<div class="us-hist">' + s + "</div>" : "");
    });
    return x.n > list.length ? h + note("и ещё " + (x.n - list.length)) : h;
  };
  /* x.ver, x.det + x.inf (detector, ms), x.used/x.total (bytes); x.cam = [[name, fps, detections/s, 1 when fps is 0]] */
  VIEW.frigate = function (x) {
    var h = '<div class="us-grid">' + blk("Версия", x.ver ? esc(x.ver) : "—", null) + blk("Детектор", x.det ? esc(x.det) + " · " + (+x.inf || 0) + " мс" : "—", null) +
      blk("Занято", x.total > 0 ? fmtBytes(x.used) + " из " + fmtBytes(x.total) : "—", null) + "</div>";
    (x.cam || []).forEach(function (c) { h += c[3] ? line(BAD, esc(c[0]), "нет потока") : line(OK, esc(c[0]), "FPS " + (+c[1] || 0) + " · детекций " + (+c[2] || 0) + "/с"); });
    return h;
  };
  /* x.e = [[label, state, unit]] */
  VIEW.ha = function (x) {
    var h = "";
    (x.e || []).forEach(function (e) {
      var s = String(e[1]);
      /* sensors send 25.4066666666667: one decimal from 1 up, two significant digits below */
      if (/^-?\d+\.\d+$/.test(s)) s = String(Math.abs(+s) >= 1 ? Math.round(s * 10) / 10 : +(+s).toPrecision(2));
      if (s === "unavailable" || s === "unknown") h += line(OFF, esc(e[0]), "недоступно", true);
      else h += line(s === "off" ? OFF : OK, esc(e[0]), s === "on" ? "Включено" : s === "off" ? "Выключено" : s === "" ? "—" : esc(s) + (e[2] ? " " + esc(e[2]) : ""));
    });
    return h || note("Добавьте сущности в поле «Что показывать»");
  };
  VIEW.jellyfin = VIEW.plex; VIEW.jellyseerr = VIEW.overseerr;
  function instOf(d) {
    return (d.inst || []).map(function (a) { return { id: a[0], type: a[1], name: a[2], url: a[3], user: a[4], set: a[5], x: a[6], map: a[7] || "", hosts: a[8] || "", every: a[9] || "" }; });
  }
  function typeOf(d, type) {
    var t = (d.types || []).filter(function (e) { return e[0] === type; })[0] || [];
    return { name: t[1] || type, group: t[2] || "Медиа", fields: t[3] || [], hint: t[4] || "" };
  }
  /* hidden in the settings: where is "page" or "main", name a tab, chip's service or instance id */
  function hidden(d, where, name) { return (((d.cfg || {}).hide || {})[where] || []).indexOf(name) >= 0; }
  /* generic view: up to 8 tiles from x.t = [[label, value, format n|b|bs|p|s|text]] */
  function tiles(x) {
    var h = "";
    (x.t || []).slice(0, 8).forEach(function (r) {
      var v = r[1], f = r[2], s;
      if (v == null || v === "" || (/^(b|bs|s)$/.test(f) && isNaN(+v))) s = "—";
      else if (f === "n") s = esc(fmtN(v));
      else if (f === "b") s = fmtBytes(+v);
      else if (f === "bs") s = fmtBytes(+v) + "/с";
      else if (f === "p") s = esc(v + "%");
      else if (f === "s") s = fmtDur(+v);
      else s = esc(v);
      h += blk(esc(r[0]), s, null);
    });
    return h && '<div class="us-grid">' + h + "</div>";
  }
  function instBody(i, d) {
    if (!i.x) return note(WAIT);
    if (!i.x.ok) return note('<span style="color:' + BAD + '">API ' + esc(i.name) + " недоступен</span> · проверьте настройки");
    return (VIEW[i.type] || tiles)(i.x, function (k) { return (d.series || {})[i.id + "." + k] || []; }, d);
  }
  /* the group tabs go before GRPAT, or last */
  function mix(found, extra) {
    var at = found.length;
    found.forEach(function (t, k) { if (t[0] === GRPAT) at = k; });
    return found.slice(0, at).concat(extra, found.slice(at));
  }
  /* instances of a group on the main card in the user's order; mtab is kept on one of them */
  function grpInst(d, g) {
    var l = instOf(d).filter(function (i) { return typeOf(d, i.type).group === g && !hidden(d, "main", i.id); });
    var o = ordered(l.map(function (i) { return [i.id, i]; }), MORDKEY).map(function (e) { return e[1]; });
    if (o.length && !o.some(function (i) { return i.id === mtab; })) mtab = o[0].id;
    return o;
  }
  function tabLinks(id, svc, web) {
    var re = TABWEB[id], out = [], names = TABSVC[id] || [];
    (web || []).forEach(function (w) {
      if ((re && re.test(w[2] || "")) || names.indexOf(w[0]) >= 0) out.push([w[2] || w[0], url(w[1])]);
    });
    if (!out.length) { var l = tabLink(id, svc); if (l) out.push(["", l]); }
    return out;
  }

  function tabSys(d, s) {
    var y = d.sys || {}, h, blocks;
    var memc = y.mem > 85 ? BAD : (y.mem > 70 ? WARN : ACC);
    blocks = blk("Нагрузка CPU", (y.load / 100).toFixed(2), div(s.sys_load, 100), ACC) + blk("Память", y.mem + "%", s.sys_mem || [], memc);
    if (y.temp !== null && y.temp !== undefined) {
      var tc = y.temp > 80 ? BAD : (y.temp > 70 ? WARN : OK);
      blocks += blk("Температура", y.temp + " °C", s.sys_temp || [], tc);
    }
    h = '<div class="us-grid">' + blocks + "</div>" +
      line(y.disk > 90 ? BAD : OK, "Диск /opt", y.disk + "% · свободно " + y.free + " МБ") +
      line(OK, "Оперативная память", y.memtotal + " МБ всего") +
      line(OK, "Аптайм роутера", fmtDur(y.up));
    return h;
  }

  function linkOf(x) {
    var l = x && x[2];
    if (!l) return "";
    return /^[0-9]+$/.test(l) ? url(l) : l;
  }
  function tabLink(id, svc) {
    var names = TABSVC[id] || [];
    for (var i = 0; i < names.length; i++)
      for (var j = 0; j < svc.length; j++) if (svc[j][0] === names[i] && svc[j][2]) return linkOf(svc[j]);
    return "";
  }

  function skipped() { try { return localStorage.getItem(SKIPKEY) || ""; } catch (e) { return ""; } }
  function updBar(u) {
    if (!u || !(upTo || u.busy || (u.new && u.new !== skipped()))) return "";
    var busy = !!(upTo || u.busy), v = upTo || u.new, t;
    if (busy) t = "Обновление keendash до <b>" + esc(v) + "</b>…";
    else if (upErr) t = '<span style="color:' + BAD + '">Не удалось обновить</span> · подробности в /tmp/keendash/upd.log';
    else t = "Доступна новая версия keendash <b>" + esc(v) + "</b> · установлена " + esc(u.cur);
    return '<div class="us-upd"><div class="us-upd-t">' + t + '</div><div class="us-upd-b">' +
      '<button type="button" class="us-upd-go" data-v="' + esc(v) + '"' + (busy ? " disabled" : "") + ">" + (busy ? "Обновление…" : "Обновить") + "</button>" +
      (busy ? "" : '<button type="button" class="us-upd-skip" data-v="' + esc(v) + '">Пропустить эту версию</button>') + "</div></div>";
  }
  function startUpdate(v) {
    upTo = v; upRun = false; upErr = false; upAt = Date.now(); render();
    fetch(BASE + (ST ? "update" : "cgi-bin/update.cgi"), ST ? { cache: "no-store" } : { method: "POST", cache: "no-store" })
      .then(function (r) { if (!r.ok) throw r.status; upRun = true; update(); })
      .catch(function () { upTo = ""; upErr = true; render(); });
  }
  function watchUpdate(u) {
    if (!u) return;
    if (u.busy && !upTo) { upTo = u.new; upRun = true; }
    if (!upTo || !upRun) return;
    /* the new widget only arrives with a page reload */
    if (u.cur === upTo) { location.reload(); return; }
    /* over https keendashd starts it within 5 s and status.json shows it up to ~20 s later */
    if (!u.busy && !(ST && Date.now() - upAt < 45000)) { upTo = ""; upRun = false; upErr = true; return; }
    clearTimeout(upTimer); upTimer = setTimeout(update, 3000);
  }

  var TABF = { telemt: tabTelemt, awg: tabAwg, firc: tabFirc, nfqws: tabNfqws, hydra: tabHydra, tailscale: tabTs, ascn: tabAscn, sys: tabSys };
  /* "Открыть" links of a tab; a third-party service may run anywhere: its own address (see extLink) */
  function extLink(i) { return i && i.url ? [["", extUrl(i.url)]] : []; }
  function openLinks(id, d) {
    return id === "tailscale" ? [["", "https://login.tailscale.com/admin/machines"]] : tabLinks(id, d.svc || [], d.web);
  }
  function openHtml(ls) {
    return ls.map(function (x) {
      return '<a class="us-open" href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + (ls.length > 1 ? esc(x[0]) + " ↗" : "Открыть ↗") + "</a>";
    }).join("");
  }

  function render() {
    /* a re-render would drop the tab being dragged; dragend renders */
    if (!bodyEl || tabDrag) return;
    var d = lastData, h = "";
    if (!d) { bodyEl.innerHTML = '<div class="us-note">загрузка…</div>'; return; }
    var svc = d.svc || [], have = d.tabs || ["sys"];
    proxies(d);
    var grps = [];
    instOf(d).forEach(function (i) {
      var g = typeOf(d, i.type).group;
      if (!hidden(d, "main", i.id) && !grps.some(function (e) { return e[1] === g; })) grps.push(["grp:" + g, g]);
    });
    var avail = ordered(mix(TABS.filter(function (t) { return have.indexOf(t[0]) >= 0 && !hidden(d, "main", t[0]); }), grps), ORDKEY);
    if (!avail.some(function (t) { return t[0] === tab; })) tab = avail.length ? avail[0][0] : "sys";
    var STATE = { 1: [OK, "работает"], 0: [BAD, "не запущен"], 2: [OFF, "отключён"], 3: [OFF, "состояние неизвестно"] };
    h += updBar(d.upd) + '<div class="us-chips">';
    var webBy = {}, nweb = {}, svcName = {};
    svc.forEach(function (x) { svcName[x[0].toLowerCase()] = x[0]; });
    (d.web || []).forEach(function (w) {
      nweb[w[0]] = (nweb[w[0]] || 0) + 1;
      /* a UI titled after another service (nfqws2-ui served by Entware lighttpd) belongs to that service */
      var o = svcName[(w[2] || "").toLowerCase()] || w[0];
      (webBy[o] = webBy[o] || []).push(w);
    });
    function chip(label, state, l, tip0) {
      var st = STATE[state] || STATE[3];
      var inner = dot(st[0]) + esc(label) + (l ? ' <span class="us-ext">↗</span>' : "");
      var tip = tip0 || (st[1] + (l ? " · открыть веб-интерфейс" : ""));
      return l ? '<a class="us-chip us-lnk" href="' + esc(l) + '" target="_blank" rel="noopener" title="' + esc(tip) + '">' + inner + "</a>"
               : '<span class="us-chip' + (state === 2 ? " us-dim" : "") + '" title="' + esc(tip) + '">' + inner + "</span>";
    }
    svc.forEach(function (x) {
      if (hidden(d, "main", x[0])) return;
      var ws = webBy[x[0]] || [];
      var own = ws.filter(function (w) { return w[0] === x[0]; }), got = ws.filter(function (w) { return w[0] !== x[0]; });
      if (nweb[x[0]] >= 2) {
        h += chip(x[0], x[1], got.length ? url(got[0][1]) : "");
        own.forEach(function (w) { h += chip(w[2] || (x[0] + ":" + w[1]), x[1], url(w[1]), x[0] + " · " + (w[2] || "порт " + w[1]) + " · открыть"); });
      } else h += chip(x[0], x[1], ws.length ? url(ws[0][1]) : nweb[x[0]] ? "" : linkOf(x));
    });
    h += '</div><div class="us-tabs"><div class="us-tl">';
    avail.forEach(function (t) { h += '<button type="button" draggable="true" class="us-tab' + (t[0] === tab ? " us-on" : "") + '" data-tab="' + esc(t[0]) + '">' + esc(t[1]) + "</button>"; });
    var gi = tab.slice(0, 4) === "grp:" ? grpInst(d, tab.slice(4)) : null, cur = gi && gi.filter(function (i) { return i.id === mtab; })[0];
    h += "</div>" + openHtml(gi ? extLink(cur) : openLinks(tab, d)) + "</div>";
    if (!gi) h += (TABF[tab] || tabTelemt)(d, d.series || {});
    else {
      if (gi.length > 1) {
        h += '<div class="us-sub">';
        gi.forEach(function (i) { h += '<button type="button" draggable="true" class="us-mt' + (i === cur ? " us-on" : "") + '" data-m="' + esc(i.id) + '">' + esc(i.name) + "</button>"; });
        h += "</div>";
      }
      h += cur ? instBody(cur, d) : note(WAIT);
    }
    bodyEl.innerHTML = h;
    /* re-rendering resets the tab strip's scroll: keep the active tab visible */
    var tl = bodyEl.querySelector(".us-tl"), on = tl && tl.querySelector(".us-on");
    if (on) { var a = on.getBoundingClientRect(), b = tl.getBoundingClientRect(); if (a.right > b.right) tl.scrollLeft += a.right - b.right; }
  }

  function update() {
    return fetch(API, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (d) {
        lastData = d; lost = false; sess(); watchUpdate(d.upd); render(); renderPage();
        /* status.json left from the last viewer: this read makes keendashd rebuild it within ~20 s */
        if (ST && d.now && Date.now() / 1000 - d.now > 60) { clearTimeout(upTimer); upTimer = setTimeout(update, 5000); }
      })
      .catch(function (e) {
        lost = e === 401; sess();
        /* our web server restarts during an upgrade: keep the last view and retry */
        if (upRun) { clearTimeout(upTimer); upTimer = setTimeout(update, 3000); return; }
        lastData = false; if (bodyEl) bodyEl.innerHTML = note(NODATA);
        renderPage();
        /* keendash restarting: over https status.json is back ~6 s after the start, don't wait for the next 30 s poll */
        clearTimeout(upTimer); upTimer = setTimeout(update, 5000);
      });
  }

  function addStyle() {
    if (document.getElementById("us-style")) return;
    var st = document.createElement("style");
    st.id = "us-style";
    st.textContent =
      ".us-body{display:flex;flex-direction:column;gap:10px;padding:10px 24px 18px;box-sizing:border-box}" +
      ".us-chips{display:flex;flex-wrap:wrap;gap:6px 14px}" +
      ".us-chip{display:inline-flex;align-items:center;gap:6px;font-size:13px;opacity:.9;white-space:nowrap;color:inherit;text-decoration:none}" +
      ".us-lnk:hover{opacity:1;color:" + ACC + "}.us-ext{font-size:11px;opacity:.55}" +
      ".us-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex:none}" +
      ".us-tabs{display:flex;align-items:center;gap:4px;box-shadow:inset 0 -1px rgba(128,128,128,.28)}" +
      /* tabs scroll sideways in a narrow card, the "Открыть" links stay in view */
      ".us-tl{display:flex;gap:4px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none}.us-tl::-webkit-scrollbar{display:none}" +
      ".us-tab{background:none;border:0;border-bottom:2px solid transparent;color:inherit;opacity:.6;font:inherit;font-size:13px;padding:6px 10px;cursor:pointer;flex:none;white-space:nowrap}" +
      ".us-tab:hover{opacity:.9}.us-tab.us-on{opacity:1;border-bottom-color:" + ACC + ";font-weight:600}" +
      ".us-open{margin-left:8px;flex:none;font-size:12px;color:" + ACC + ";text-decoration:none;white-space:nowrap}.us-open:hover{text-decoration:underline}" +
      ".us-open + .us-open{margin-left:10px}" +
      ".us-sub{display:flex;flex-wrap:wrap;gap:6px}" +
      ".us-mt{background:none;border:1px solid rgba(128,128,128,.35);border-radius:12px;color:inherit;opacity:.7;font:inherit;font-size:12px;padding:2px 10px;cursor:pointer;white-space:nowrap}" +
      ".us-mt:hover{opacity:1}.us-mt.us-on{opacity:1;border-color:" + ACC + ";color:" + ACC + "}" +
      ".us-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px}" +
      ".us-blk{display:flex;flex-direction:column;gap:6px;min-width:0}" +
      ".us-bh{display:flex;justify-content:space-between;align-items:baseline;gap:8px}" +
      ".us-lbl{font-size:12px;opacity:.7}.us-val{font-size:18px;font-weight:600;font-variant-numeric:tabular-nums}" +
      ".us-spark{width:100%;height:44px;display:block}.us-empty{font-size:12px;opacity:.5;line-height:44px}" +
      ".us-sec{font-size:11px;text-transform:uppercase;letter-spacing:.06em;opacity:.5;margin-top:2px}" +
      ".us-row{display:flex;align-items:center;gap:8px;font-size:13px;min-width:0}.us-dim{opacity:.55}" +
      ".us-bar{height:6px;border-radius:3px;background:rgba(128,128,128,.25);overflow:hidden}.us-bar i{display:block;height:100%}" +
      ".us-hist{display:flex;gap:2px;height:6px}.us-hist i{flex:1 1 0;max-width:12px;border-radius:1px}.us-hu{background:" + OK + "}.us-hd{background:" + BAD + "}.us-hp{background:" + OFF + "}" +
      ".us-nm{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".us-r{margin-left:auto;opacity:.75;font-variant-numeric:tabular-nums;white-space:nowrap;padding-left:8px}" +
      ".us-tag{font-size:11px;opacity:.7;border:1px solid rgba(128,128,128,.4);border-radius:4px;padding:0 5px;margin-left:4px}" +
      ".us-note{font-size:12px;opacity:.75}.us-note b{font-weight:600;opacity:1}" +
      ".us-upd{display:flex;flex-direction:column;gap:10px;padding:12px 14px;border-radius:8px;background:rgba(0,151,220,.1);font-size:13px}" +
      ".us-upd-t b{font-weight:600}.us-upd-b{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px}" +
      /* Keenetic primary button (.ndw-button--primary), a size smaller to fit the card */
      ".us-upd-go{min-width:92px;padding:9px 20px;border:1px solid #0097dc;border-radius:4px;background:#0097dc;color:#fff;font:inherit;font-size:14px;cursor:pointer;outline:none;white-space:nowrap}" +
      ".us-upd-go:hover{border-color:#1c6c9a;background:#1c6c9a}.us-upd-go:active{background:#aed6fa;color:#1c6c9a}" +
      ".us-upd-go:disabled{opacity:.6;cursor:default;background:#0097dc;border-color:#0097dc;color:#fff}" +
      ".us-upd-skip{background:none;border:0;padding:0;color:inherit;opacity:.6;font:inherit;font-size:12px;cursor:pointer}.us-upd-skip:hover{opacity:1;text-decoration:underline}" +
      /* the page, as the firmware's own pages (ndw-page-wrapper) and dashboard cards: their styles leave with them */
      "[data-kd-hidden]{display:none!important}.kd-page{padding:0 32px 64px;box-sizing:border-box}.kd-ph{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:32px 32px 0 0;margin:0 0 24px}" +
      ".kd-ph h1{font-size:28px;font-weight:700;line-height:36px;margin:0}" +
      ".kd-cols{display:flex;gap:24px;align-items:flex-start}.kd-col{flex:1;min-width:0;display:flex;flex-direction:column;gap:24px}" +
      ".kd-card{background:var(--dashboard-background);border:1px solid var(--dashboard-card-border);border-radius:8px;min-width:0}" +
      ".kd-ch{display:flex;align-items:center;margin-top:24px;padding:0 24px;min-height:24px}" +
      ".kd-drag{flex:none;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;margin:-4px -8px -4px 4px;padding-right:4px;box-sizing:border-box;border-radius:6px;cursor:grab;opacity:.5;user-select:none;letter-spacing:-4px}.kd-drag:hover{opacity:.9;background:rgba(128,128,128,.18)}.kd-ct{flex:1;min-width:0;font-size:16px;font-weight:700;line-height:24px;letter-spacing:1px;text-transform:uppercase}" +
      "@media (max-width:599px){.kd-page{padding:0 16px 56px}.kd-ph{padding-right:0}.kd-ph h1{font-size:20px;line-height:28px}}" +
      /* settings dialog: backdrop, 656 px panel the full height, scrolling body, bar with Save / Cancel at the bottom */
      ".kd-btn{min-width:92px;padding:9px 20px;border:1px solid #0097dc;border-radius:4px;background:transparent;color:#0097dc;font:inherit;font-size:14px;cursor:pointer;outline:none;white-space:nowrap}" +
      ".kd-btn:hover{background:rgba(0,151,220,.1)}.kd-btn-p{background:#0097dc;color:#fff}.kd-btn-p:hover{background:#1c6c9a;border-color:#1c6c9a}.kd-btn:disabled{opacity:.5;cursor:default}" +
      ".kd-dlg-ov{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:rgba(0,0,0,.25);display:flex;justify-content:center}" +
      ".kd-dlg{width:656px;max-width:100%;height:100%;box-sizing:border-box;display:flex;flex-direction:column;background:var(--dashboard-background);border-radius:8px}" +
      ".kd-dlg-top{display:flex;align-items:center;justify-content:space-between;padding:24px 24px 0}.kd-dlg-top h1{font-size:28px;font-weight:700;line-height:36px;margin:0}" +
      ".kd-dlg-x{background:none;border:0;color:inherit;opacity:.7;font-size:28px;line-height:1;cursor:pointer}.kd-dlg-x:hover{opacity:1}" +
      ".kd-dlg input[type=text],.kd-dlg input[type=password],.kd-dlg select{width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid rgba(128,128,128,.4);border-radius:4px;background:transparent;color:inherit;font:inherit;font-size:14px}" +
      ".kd-dlg select option{background:var(--dashboard-background);color:inherit}" +
      ".kd-dlg-sess{margin:12px 24px 0;color:" + BAD + ";font-size:13px}.kd-dlg-sess:empty{display:none}.kd-dlg-q{margin:16px 24px 0;width:calc(100% - 48px)!important}.kd-dlg-body{flex:1;min-height:0;overflow-y:auto;padding:0 24px 24px}" +
      ".kd-dlg-h{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;opacity:.55;margin:20px 0 4px}" +
      ".kd-dlg-r{display:flex;align-items:center;flex-wrap:wrap;gap:4px 12px;width:100%;box-sizing:border-box;padding:10px 0;border:0;border-bottom:1px solid rgba(128,128,128,.2);background:none;color:inherit;font:inherit;font-size:14px;text-align:left}" +
      ".kd-dlg-hd,.kd-dlg-add{cursor:pointer}.kd-dlg-n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kd-dlg-t{max-width:50%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;opacity:.6}" +
      ".kd-dlg-del{background:none;border:0;padding:2px;color:inherit;opacity:.6;cursor:pointer;line-height:0}.kd-dlg-del:hover{opacity:1;color:" + BAD + "}" +
      /* the firmware's checkbox (ndw-checkbox) and scrollbar, from its own theme variables */
      ".kd-dlg-cs{display:flex;gap:4px 20px;margin-left:auto}.kd-dlg-c{display:flex;align-items:center;gap:12px;font-size:14px;line-height:22px;white-space:nowrap;cursor:pointer}" +
      ".kd-dlg-c input{-webkit-appearance:none;appearance:none;flex:none;width:16px;height:16px;margin:0;box-sizing:border-box;border:1px solid var(--checkbox-default-stroke);border-radius:4px;background:var(--background) center no-repeat;cursor:pointer;transition:background-color .05s ease-in-out}" +
      ".kd-dlg-c:hover input{border-color:var(--checkbox-hover-stroke)}.kd-dlg-c input:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}" +
      ".kd-dlg-c input:checked{border-color:var(--primary-color);background-color:var(--primary-color);background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='8'%3E%3Cpath d='M1 4l3 3 5-6' fill='none' stroke='%23fff' stroke-width='1.8'/%3E%3C/svg%3E\")}" +
      ".kd-dlg-c:hover input:checked{border-color:var(--checkbox-active-hover-stroke);background-color:var(--checkbox-active-hover-background)}" +
      ".kd-dlg-body::-webkit-scrollbar{width:8px;height:8px;background:var(--scrollbar-background)}.kd-dlg-body::-webkit-scrollbar-thumb{border-radius:4px;background:var(--scrollbar-thumb)}" +
      "@supports (-moz-appearance:none){.kd-dlg-body{scrollbar-width:thin;scrollbar-color:var(--scrollbar-thumb) var(--scrollbar-background)}}" +
      ".kd-dlg-form{display:flex;flex-direction:column;gap:12px;padding:8px 0 16px;border-bottom:1px solid rgba(128,128,128,.2)}" +
      ".kd-dlg-f{display:flex;flex-direction:column;gap:4px;font-size:12px}.kd-dlg-f > span:first-child{opacity:.7}" +
      ".kd-dlg-hint,.kd-dlg-err{color:" + BAD + ";font-size:12px}.kd-dlg-hint:empty{display:none}.kd-dlg-tip{font-size:12px;opacity:.6}.kd-dlg-err{font-size:13px;flex:1 1 100%;margin-top:12px}" +
      ".kd-dlg-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px 12px;padding:16px 24px;border-top:1px solid rgba(128,128,128,.28)}.kd-dlg-bar:empty{display:none}.kd-dlg-bar .kd-dlg-err{margin:0}" +
      "@media (max-width:599px){.kd-dlg{width:100%;border-radius:0}.kd-dlg-top h1{font-size:20px;line-height:28px}}";
    document.head.appendChild(st);
  }

  /* ---------- native-looking card + own drag & drop ---------- */
  function findHandle(header) {
    var h = header.querySelector(".ndw-drag-handle, .dashboard-card__drag-icon");
    if (h) return h;
    var link = header.querySelector(".dashboard-card__header-link");
    var cands = Array.prototype.slice.call(header.querySelectorAll("[class*=handle],[class*=drag],ndw-svg-icon,svg"))
      .filter(function (e) { return !(link && link.contains(e)); });
    return cands.length ? cands[cands.length - 1] : header;
  }

  function buildRow(tpl) {
    var r = tpl.cloneNode(true);
    r.removeAttribute("id"); r.removeAttribute("style");
    ["cdkdrag", "ndwdragpanelitem", "cdkdragpreviewclass"].forEach(function (a) { r.removeAttribute(a); });
    ["cdk-drag", "cdk-drag-dragging", "cdk-drag-animating", "cdk-drag-preview", "cdk-drag-placeholder"].forEach(function (c) { r.classList.remove(c); });
    r.setAttribute("data-services", "1");
    var host = r.querySelector("ndw-dashboard-card");
    if (host) { host.classList.remove("segments-card"); host.classList.add("services-card"); host.removeAttribute("header"); }
    var card = r.querySelector(".dashboard-card");
    var header = card && card.querySelector(".dashboard-card__header");
    if (!card || !header) return null;
    var content = card.querySelector(".dashboard-card__content");
    Array.prototype.slice.call(card.children).forEach(function (ch) { if (ch !== header && ch !== content) ch.parentNode.removeChild(ch); });
    if (!content) { content = document.createElement("div"); content.className = "dashboard-card__content"; card.appendChild(content); }
    while (content.firstChild) content.removeChild(content.firstChild);
    var a = header.querySelector(".dashboard-card__header-link a") || header.querySelector("a");
    if (a) { a.removeAttribute("href"); a.textContent = TITLE; a.style.pointerEvents = "none"; a.style.cursor = "default"; }
    bodyEl = document.createElement("div");
    bodyEl.className = "us-body";
    bodyEl.addEventListener("click", function (e) {
      var u = e.target.closest ? e.target.closest(".us-upd-go,.us-upd-skip") : null;
      if (u) {
        if (u.classList.contains("us-upd-go")) startUpdate(u.getAttribute("data-v"));
        else { try { localStorage.setItem(SKIPKEY, u.getAttribute("data-v")); } catch (x) {} upErr = false; render(); }
        return;
      }
      var mt = e.target.closest ? e.target.closest(".us-mt") : null;
      if (mt) {
        mtab = mt.getAttribute("data-m");
        try { localStorage.setItem(MTABKEY, mtab); } catch (x) {}
        render();
        return;
      }
      var b = e.target.closest ? e.target.closest(".us-tab") : null;
      if (!b) return;
      tab = b.getAttribute("data-tab");
      try { localStorage.setItem(TABKEY, tab); } catch (x) {}
      render();
    });
    /* tabs and media sub-tabs reorder by drag and drop (HTML5: on touch screens it starts with a long press) */
    var DRAG = ".us-tab,.us-mt";
    bodyEl.addEventListener("dragstart", function (e) {
      tabDrag = e.target.closest ? e.target.closest(DRAG) : null;
      if (!tabDrag || !e.dataTransfer) return;
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", ""); } catch (x) {}
    });
    bodyEl.addEventListener("dragover", function (e) {
      var b = tabDrag && e.target.closest ? e.target.closest(DRAG) : null;
      if (!b || b.parentNode !== tabDrag.parentNode) return;
      e.preventDefault();
      if (b === tabDrag) return;
      var r = b.getBoundingClientRect();
      b.parentNode.insertBefore(tabDrag, e.clientX < r.left + r.width / 2 ? b : b.nextSibling);
    });
    bodyEl.addEventListener("drop", function (e) { if (tabDrag) e.preventDefault(); });
    /* the tab strip has no scrollbar and dragging a tab reorders it: the mouse wheel scrolls it sideways */
    bodyEl.addEventListener("wheel", function (e) {
      var tl = e.target.closest ? e.target.closest(".us-tl") : null, dy = e.deltaMode ? e.deltaY * 16 : e.deltaY;
      if (!tl || !dy || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var x = tl.scrollLeft;
      tl.scrollLeft += dy;
      if (tl.scrollLeft !== x) e.preventDefault();
    }, { passive: false });
    bodyEl.addEventListener("dragend", function () {
      if (!tabDrag) return;
      var mt = tabDrag.classList.contains("us-mt");
      var ids = Array.prototype.map.call(tabDrag.parentNode.querySelectorAll(DRAG), function (b) { return b.getAttribute(mt ? "data-m" : "data-tab"); });
      tabDrag = null;
      try { localStorage.setItem(mt ? MORDKEY : ORDKEY, JSON.stringify(ids)); } catch (x) {}
      render();
    });
    content.appendChild(bodyEl);
    attachDrag(r, findHandle(header));
    return r;
  }

  function align() {
    try {
      var hd = row.querySelector(".dashboard-card__header"), cd = row.querySelector(".dashboard-card");
      var a = hd.querySelector(".dashboard-card__header-link a");
      var c = cd.getBoundingClientRect();
      var l = a.getBoundingClientRect().left - c.left, r = c.right - findHandle(hd).getBoundingClientRect().right;
      if (l >= 4) { if (l < 80) bodyEl.style.paddingLeft = l + "px"; }
      if (r >= 4) { if (r < 80) bodyEl.style.paddingRight = r + "px"; }
    } catch (e) { }
  }

  function insertAt(pos) {
    var cols = columns();
    if (!cols.length) return false;
    var col = null;
    if (pos && pos.n === cols.length && cols[pos.col]) col = cols[pos.col];
    else { var minH = Infinity; cols.forEach(function (c) { if (c.offsetHeight < minH) { minH = c.offsetHeight; col = c; } }); }
    var kids = foreignRows(col), idx = pos ? Math.min(pos.idx, kids.length) : kids.length;
    if (kids[idx]) col.insertBefore(row, kids[idx]); else col.appendChild(row);
    return true;
  }
  function record() {
    var col = row.parentNode, cols = columns(), idx = 0;
    for (var i = 0; i < col.children.length; i++) {
      var c = col.children[i];
      if (c === row) break;
      if (isRow(c) && c !== placeholder) idx++;
    }
    savePos({ col: cols.indexOf(col), idx: idx, n: cols.length });
  }
  function place(x, y) {
    var cols = columns();
    if (!cols.length || !placeholder) return;
    var best = null, bd = Infinity;
    cols.forEach(function (c) {
      var r = c.getBoundingClientRect(), d = x < r.left ? r.left - x : (x > r.right ? x - r.right : 0);
      if (d < bd) { bd = d; best = c; }
    });
    var kids = foreignRows(best), ref = null;
    for (var i = 0; i < kids.length; i++) {
      var r2 = kids[i].getBoundingClientRect();
      if (y < r2.top + r2.height / 2) { ref = kids[i]; break; }
    }
    if (ref) { if (placeholder.parentNode !== best || placeholder.nextSibling !== ref) best.insertBefore(placeholder, ref); }
    else if (placeholder.parentNode !== best || placeholder.nextSibling) best.appendChild(placeholder);
  }
  function attachDrag(r, handle) {
    handle.style.touchAction = "none";
    handle.style.cursor = "grab";
    handle.addEventListener("pointerdown", function (ev) {
      if (ev.pointerType === "mouse" && ev.button !== 0) return;
      ev.preventDefault();
      var rect = r.getBoundingClientRect(), sx = ev.clientX, sy = ev.clientY, offX = sx - rect.left, offY = sy - rect.top, started = false;
      try { handle.setPointerCapture(ev.pointerId); } catch (e) {}
      function begin() {
        started = true; dragging = true;
        placeholder = document.createElement("div");
        placeholder.className = "services-placeholder";
        placeholder.style.cssText = "height:" + rect.height + "px;border:2px dashed rgba(128,128,128,.55);border-radius:8px;box-sizing:border-box;";
        r.parentNode.insertBefore(placeholder, r);
        r.style.position = "fixed"; r.style.width = rect.width + "px"; r.style.left = rect.left + "px"; r.style.top = rect.top + "px";
        r.style.margin = "0"; r.style.zIndex = "10000"; r.style.pointerEvents = "none"; r.style.opacity = ".92";
        r.style.boxShadow = "0 8px 24px rgba(0,0,0,.45)";
      }
      function move(e) {
        if (!started) { if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < 5) return; begin(); }
        r.style.left = (e.clientX - offX) + "px"; r.style.top = (e.clientY - offY) + "px";
        place(e.clientX, e.clientY);
      }
      function end() {
        handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", end); handle.removeEventListener("pointercancel", end);
        try { handle.releasePointerCapture(ev.pointerId); } catch (e) {}
        if (!started) return;
        if (placeholder && placeholder.parentNode) { placeholder.parentNode.insertBefore(r, placeholder); placeholder.parentNode.removeChild(placeholder); }
        placeholder = null; r.removeAttribute("style"); dragging = false;
        record(); requestAnimationFrame(align);
      }
      handle.addEventListener("pointermove", move); handle.addEventListener("pointerup", end); handle.addEventListener("pointercancel", end);
    });
  }

  function ensure() {
    if (dragging) return;
    if (row && row.isConnected) return;
    var tpl = templateRow();
    if (!tpl) return;
    if (!row) { addStyle(); row = buildRow(tpl); if (!row) return; }
    if (insertAt(loadPos())) { render(); requestAnimationFrame(align); setTimeout(align, 300); }
  }
  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; try { ensure(); } catch (e) { } try { ensurePage(); } catch (e) { } });
  }
  /* ---------- "Сервисы" page: an item of the side menu under "Системный монитор" opens a page of the web UI with
   * a card for every tab that has data. Angular's router doesn't know it: the page covers what Angular shows, at
   * /keendash, and Angular showing another page closes it. Angular sends an unknown path to the dashboard, so for a
   * reload the loader keeps the address asked for (window.__keendash.p) and the page opens again over the dashboard. */
  var PAGE = "/keendash", ACT = "page-link__link--active";
  var page = null, pageFrom = "", pageState = null, pageTitle = "", stripped = [], pageWant = (window.__keendash || {}).p === PAGE;
  /* [title, html, links, id] per card: the tabs with data, every service instance a card of its own */
  function pageCards(d) {
    var s = d.series || {}, have = d.tabs || ["sys"], out = [];
    proxies(d);
    var insts = ordered(instOf(d).filter(function (i) { return !hidden(d, "page", i.id); }).map(function (i) { return [i.id, i]; }), MORDKEY);
    ordered(mix(TABS.filter(function (t) { return have.indexOf(t[0]) >= 0 && !hidden(d, "page", t[0]); }), insts), ORDKEY).forEach(function (t) {
      if (typeof t[1] === "string") out.push([t[1], TABF[t[0]](d, s), openLinks(t[0], d), t[0]]);
      else out.push([t[1].name, instBody(t[1], d), extLink(t[1]), t[0]]);
    });
    return out;
  }
  /* the saved layout on n columns: the ones from the n-th on are appended to the last visible one */
  function fitCols(saved, n) {
    n = Math.min(saved.length, n);
    var out = saved.slice(0, n).map(function (c) { return c.slice(); });
    saved.slice(n).forEach(function (c) { out[n - 1] = out[n - 1].concat(c); });
    return out;
  }
  /* id after prevId or before nextId, in the saved column of that neighbour; with none, at the end of column col */
  function moveCard(cols, id, prevId, nextId, col) {
    var out = cols.map(function (c) { return c.filter(function (x) { return x !== id; }); }), at = -1;
    out.forEach(function (c, i) {
      var p = c.indexOf(prevId), n = c.indexOf(nextId);
      if (at >= 0) return;
      if (p >= 0) { c.splice(p + 1, 0, id); at = i; } else if (n >= 0) { c.splice(n, 0, id); at = i; }
    });
    if (at < 0) out[col].push(id);
    return out;
  }
  /* pendingCols: the layout just dropped, shown until status.json carries its rev (or another one, or 45 s pass: pendingFrom
   * is the rev it was dropped over, pendingAt the time); pageNote: why saving it failed */
  var pendingCols = null, pendingRev = "", pendingFrom, pendingAt = 0, pageNote = "";
  function renderPage() {
    var main = page && page.parentNode, d = lastData;
    if (!main || dragging) return;
    var top = main.scrollTop, wrap = document.createElement("div"), cols = [];
    page.innerHTML = '<div class="kd-ph"><h1>' + TITLE + '</h1><button type="button" class="kd-btn kd-set"' + (d ? "" : " disabled") + '>Настройки</button></div>';
    if (!d) { page.insertAdjacentHTML("beforeend", note(d === false ? NODATA : "загрузка…")); return; }
    var cf = d.cfg || {};
    if (pendingCols && cf.rev === pendingRev && cf.err) pageNote = "Не удалось сохранить раскладку: " + cf.err;
    if (pendingCols && (cf.rev === pendingRev || cf.rev !== pendingFrom || Date.now() - pendingAt > 45000)) pendingCols = null;
    if (pageNote) page.insertAdjacentHTML("beforeend", note(esc(pageNote)));
    /* columns as on the dashboard: the saved layout (as many as fit), else each card into the shortest one */
    var saved = pendingCols || (d.cfg || {}).cols || [], seen = {}, cards = {}, fit;
    wrap.className = "kd-cols"; page.appendChild(wrap);
    var n = Math.min(6, Math.max(1, Math.floor((wrap.clientWidth + 24) / 444)));
    fit = saved.length ? fitCols(saved, n) : [];
    for (var i = fit.length || n; i > 0; i--) cols.push(wrap.appendChild(document.createElement("div")));
    cols.forEach(function (c) { c.className = "kd-col"; });
    function put(col, c) {
      col.insertAdjacentHTML("beforeend", '<div class="kd-card" data-id="' + esc(c[3]) + '"><div class="kd-ch"><span class="kd-ct">' + esc(c[0]) + "</span>" + openHtml(c[2]) +
        '<span class="kd-drag" title="Перетащить">&#8942;&#8942;</span></div><div class="us-body">' + c[1] + "</div></div>");
    }
    var all = pageCards(d);
    all.forEach(function (c) { cards[c[3]] = c; });
    fit.forEach(function (ids, k) { ids.forEach(function (id) { if (cards[id] && !seen[id]) { seen[id] = 1; put(cols[k], cards[id]); } }); });
    all.forEach(function (c) {
      if (!seen[c[3]]) put(cols.reduce(function (a, b) { return b.offsetHeight < a.offsetHeight ? b : a; }), c);
    });
    Array.prototype.forEach.call(page.querySelectorAll(".kd-drag"), function (h) { attachPageDrag(h.parentNode.parentNode, h); });
    main.scrollTop = top;
  }
  /* the card's drag handle: a dashed placeholder follows the pointer over the columns; the drop saves the layout */
  function attachPageDrag(r, handle) {
    handle.style.touchAction = "none"; handle.style.cursor = "grab";
    handle.addEventListener("pointerdown", function (ev) {
      if (ev.pointerType === "mouse" && ev.button !== 0) return;
      ev.preventDefault();
      var rect = r.getBoundingClientRect(), sx = ev.clientX, sy = ev.clientY, offX = sx - rect.left, offY = sy - rect.top, started = false, ph;
      try { handle.setPointerCapture(ev.pointerId); } catch (e) {}
      function cols() { return Array.prototype.slice.call(page.querySelectorAll(".kd-col")); }
      function kids(c) { return Array.prototype.filter.call(c.children, function (k) { return k !== r && k !== ph; }); }
      function move(e) {
        if (!started) {
          if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < 5) return;
          started = true; dragging = true;
          ph = document.createElement("div");
          ph.style.cssText = "height:" + rect.height + "px;border:2px dashed rgba(128,128,128,.55);border-radius:8px;box-sizing:border-box;";
          r.parentNode.insertBefore(ph, r);
          r.style.position = "fixed"; r.style.width = rect.width + "px"; r.style.left = rect.left + "px"; r.style.top = rect.top + "px";
          r.style.margin = "0"; r.style.zIndex = "10000"; r.style.pointerEvents = "none"; r.style.opacity = ".92"; r.style.boxShadow = "0 8px 24px rgba(0,0,0,.45)";
        }
        r.style.left = (e.clientX - offX) + "px"; r.style.top = (e.clientY - offY) + "px";
        var best = null, bd = 1e9, ref = null, ks;
        cols().forEach(function (c) { var b = c.getBoundingClientRect(), dx = Math.abs(e.clientX - (b.left + b.width / 2)); if (dx < bd) { bd = dx; best = c; } });
        ks = kids(best);
        for (var i = 0; i < ks.length; i++) { var q = ks[i].getBoundingClientRect(); if (e.clientY < q.top + q.height / 2) { ref = ks[i]; break; } }
        if (ref) { if (ph.parentNode !== best || ph.nextSibling !== ref) best.insertBefore(ph, ref); }
        else if (ph.parentNode !== best || ph.nextSibling) best.appendChild(ph);
      }
      function end(e) {
        handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", end); handle.removeEventListener("pointercancel", end);
        try { handle.releasePointerCapture(ev.pointerId); } catch (x) {}
        if (!started) return;
        var cs = cols(), col = cs.indexOf(ph.parentNode), prev = ph.previousElementSibling, next = ph.nextElementSibling, base, rev = newRev(), old = pendingCols;
        function cid(k) { return k && k.getAttribute("data-id"); }
        while (prev === r) prev = prev.previousElementSibling;
        while (next === r) next = next.nextElementSibling;
        var cf = (lastData || {}).cfg || {};
        if (e.type === "pointercancel") col = -1;
        dragging = false;
        if (col < 0) { renderPage(); return; }
        if (!cf.vol) { pageNote = "Не найден диск Entware"; renderPage(); return; }
        base = pendingCols || cf.cols;
        if (!base || !base.length) {
          /* no saved layout: at least 3 columns (a wide screen shows them all), each card into the shortest by its height, as renderPage does */
          var hs = [], hh = {};
          base = []; for (var k = Math.max(cs.length, 3); k > 0; k--) { base.push([]); hs.push(0); }
          Array.prototype.forEach.call(page.querySelectorAll(".kd-card"), function (c) { hh[cid(c)] = c.offsetHeight; });
          pageCards(lastData).forEach(function (c) {
            var s = 0; hs.forEach(function (h, j) { if (h < hs[s]) s = j; });
            base[s].push(c[3]); hs[s] += hh[c[3]] || 0;
          });
        }
        pendingCols = moveCard(base, cid(r), cid(prev), cid(next), col); pendingRev = rev; pendingFrom = cf.rev; pendingAt = Date.now(); pageNote = "";
        renderPage();
        upload("keendash 1 " + rev + "\n" + pendingCols.map(function (c, i) { return ("col " + i + " " + c.join(" ")).replace(/ $/, ""); }).join("\n") + "\nend\n", rev).then(null, function (m) {
          if (pendingRev !== rev) return;
          pendingCols = old; pageNote = "Не удалось сохранить раскладку: " + (typeof m === "string" ? m.replace(/^Не удалось сохранить:? ?/, "") || "ошибка" : "ошибка"); renderPage();
        });
      }
      handle.addEventListener("pointermove", move); handle.addEventListener("pointerup", end); handle.addEventListener("pointercancel", end);
    });
  }
  /* ---------- settings dialog: edits pile up in a draft; "Сохранить" sends them as one message (bin/settings reads it) through
   * the firmware file manager: /rci/put names the file in keendash's inbox, /fui takes its content; status.json confirms ---------- */
  var FLD = { name: "Имя", url: "Адрес", user: "Логин", pass: "Пароль", token: "Токен", key: "API-ключ", map: "Что показывать", hosts: "Адреса", every: "Интервал" };
  var SECRET = /^(pass|token|key)$/, PLAIN = /^(name|url|user|map|hosts|every)$/, NOSAVE = "Не удалось сохранить";
  var EVERY = [["1", "1 мин"], ["5", "5 мин"], ["15", "15 мин"], ["30", "30 мин"], ["60", "1 ч"]];
  var TRASH = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zM6 9h12l-1 12H7L6 9z"/></svg>';
  /* dd: the status the dialog works from (taken when it opens, again after a save), so a failed poll changes nothing;
   * lost: the last poll got 401; down: where the mouse button went down. dlg: the backdrop; draft: {inst: [{id, type, name, url, user, vals}], del: [id], hide: {page, main}}; dopen: the instance
   * whose form is open; dst: {busy} or {err} of the last save; dtried: Save was pressed, empty required fields are errors */
  var dlg = null, dd = null, lost = false, down = null, draft = null, dq = "", dopen = "", dst = null, dtried = false;

  /* the id for a new instance of a type: the type, then type-2, type-3…; taken: {id: 1} of the router's and the draft's */
  function newId(type, taken) {
    var n = 1, id = type;
    while (taken[id]) id = type + "-" + (++n);
    return id;
  }
  /* bin/settings okmap: "label=path[:fmt]" pairs split by ";", ASCII spaces around a pair trimmed, the label counts characters */
  function okmap(v) {
    var a = v.split(";");
    return a.length <= 8 && a.every(function (p) {
      var e, l, b;
      p = p.replace(/^ +| +$/g, ""); e = p.indexOf("="); l = p.slice(0, e); b = p.slice(e + 1).split(":");
      return e > 0 && l.replace(/[\ud800-\udbff][\udc00-\udfff]/g, "x").length <= 32 && l.indexOf("|") < 0 && b.length <= 2 &&
        /^[A-Za-z0-9_.-]{1,128}$/.test(b[0]) && /^(n|b|bs|p|s)?$/.test(b[1] || "");
    });
  }
  /* bin/settings okhosts: 1-20 elements split by ASCII spaces and commas, a domain[:port] not starting with - or an http(s):// address */
  function okhosts(v) {
    var a = v.replace(/^[ ,]+|[ ,]+$/g, "").split(/[ ,]+/);
    return a.length <= 20 && a.every(function (e) {
      return /^https?:\/\/[^ |'"\\$`<>]+$/.test(e) || (/^[A-Za-z0-9.-]+(:[0-9]{1,5})?$/.test(e) && e.charAt(0) !== "-");
    });
  }
  /* what the router would reject, said before sending: "" if the value is fine; req: empty is an error too */
  function bad(f, v, req) {
    if (!v) return req ? "Заполните поле" : "";
    if (/[\x00-\x1f\x7f]/.test(v)) return "Недопустимый символ в значении";
    if (unescape(encodeURIComponent(v)).length > 512) return "Не длиннее 512 байт";
    if (f === "name" && v.replace(/[\ud800-\udbff][\udc00-\udfff]/g, "x").length > 64) return "Не длиннее 64 символов";
    if (f === "map") return okmap(v) ? "" : "Формат: Подпись=путь[:формат]; до 8 пар";
    if (f === "hosts") return okhosts(v) ? "" : "Домен или http(s)://адрес, через пробел, до 20";
    if (PLAIN.test(f) && v.indexOf("|") >= 0) return "Символ | недопустим";
    if (f === "url" && !/^https?:\/\//.test(v)) return "Адрес должен начинаться с http:// или https://";
    return "";
  }
  function fresh(d) {
    var h = (d.cfg || {}).hide || {};
    return { inst: instOf(d).map(function (i) { return { id: i.id, type: i.type, name: i.name, url: i.url || "", user: i.user || "", map: i.map, hosts: i.hosts, every: i.every, vals: {} }; }),
      del: [], hide: { page: (h.page || []).slice(), main: (h.main || []).slice() } };
  }
  function fv(e, f) { return PLAIN.test(f) ? e[f] : e.vals[f] || ""; }
  /* [field, value, is new] to send for an instance of the draft: all fields of a new one, the changed ones and the typed secrets */
  function sets(d, e) {
    var o = instOf(d).filter(function (i) { return i.id === e.id; })[0], out = [];
    ["name"].concat(typeOf(d, e.type).fields).forEach(function (f) {
      var v = fv(e, f);
      if (f === "url") v = v.trim();
      if (!o || (SECRET.test(f) ? v : v !== o[f])) out.push([f, v, !o]);
    });
    return out;
  }
  /* the message for bin/settings; "" if the draft changes nothing. Values are checked by bad() before it is sent */
  function buildMsg(rev, d, dr) {
    var L = [];
    dr.del.forEach(function (id) { L.push("del " + id); });
    dr.inst.forEach(function (e) {
      if (dr.del.indexOf(e.id) >= 0) return;
      var s = sets(d, e);
      if (s[0] && s[0][2]) L.push("add " + e.id + " " + e.type);
      s.forEach(function (x) { if (x[1] || !x[2]) L.push("set " + e.id + " " + x[0] + " " + x[1]); });
    });
    ["page", "main"].forEach(function (w) {
      var was = ((d.cfg || {}).hide || {})[w] || [], now = dr.hide[w];
      now.forEach(function (n) { if (was.indexOf(n) < 0) L.push("hide " + w + " " + n); });
      was.forEach(function (n) { if (now.indexOf(n) < 0) L.push("show " + w + " " + n); });
    });
    return L.length ? "keendash 1 " + rev + "\n" + L.join("\n") + "\nend\n" : "";
  }
  window.__servicesWidget = { newId: newId, buildMsg: buildMsg, update: update, awaitRev: awaitRev, fitCols: fitCols, moveCard: moveCard }; // for the tests

  /* the file lands in the inbox as <rev>.txt; a rejected promise carries the text to show */
  function newRev() { return (Math.random().toString(36) + "000000000000").slice(2, 14); }
  function upload(text, rev) {
    var blob = new Blob([text], { type: "text/plain" });
    function chk(r) { if (r.status === 401) throw "Сессия истекла, войдите заново"; if (!r.ok) throw NOSAVE; return r; }
    return fetch(location.origin + "/rci/put", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: ((lastData || dd).cfg || {}).vol + "/var/lib/keendash/inbox/" + rev + ".txt", size: blob.size }) })
      .then(chk).then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.port || !j.port.port) throw NOSAVE;
        var f = new FormData();
        f.append("port", j.port.port); f.append("Filedata", blob, rev + ".txt");
        return fetch(location.origin + "/fui", { method: "POST", credentials: "same-origin", body: f });
      }).then(chk);
  }
  /* keendashd applies the inbox within ~5 s, over https status.json lags up to 15 s more: poll every 5 s */
  function awaitRev(rev, ms) {
    return new Promise(function (ok, no) {
      var done = false, tm = setTimeout(function () { fin(no, NOSAVE + ": нет подтверждения"); }, ms);
      function fin(f, v) { if (!done) { done = true; clearTimeout(tm); f(v); } }
      (function poll() {
        if (done) return;
        update().then(function () {
          var c = (lastData || {}).cfg || {};
          if (c.rev === rev) fin(c.err ? no : ok, c.err); else setTimeout(poll, 5000);
        });
      })();
    });
  }

  function sess() { if (dlg) dlg.querySelector(".kd-dlg-sess").textContent = lost ? "Сессия истекла, войдите заново" : ""; }
  function dirty() { return buildMsg("x", dd, draft) !== ""; }
  function entry(id) { return draft.inst.filter(function (e) { return e.id === id; })[0]; }
  /* [name, label, has a card] of what keendash found: the tabs with data, then the other init.d services */
  function found(d) {
    var have = d.tabs || ["sys"], out = [], seen = {};
    TABS.forEach(function (t) { if (have.indexOf(t[0]) >= 0) { out.push([t[0], t[1], true]); seen[t[0]] = 1; } });
    (d.svc || []).forEach(function (x) {
      if (!seen[x[0]] && /^[A-Za-z0-9._-]{1,64}$/.test(x[0])) { out.push([x[0], x[0], false]); seen[x[0]] = 1; }
    });
    return out;
  }
  function chkbox(w, n) {
    return '<label class="kd-dlg-c"><input type="checkbox" data-w="' + w + '" data-n="' + esc(n) + '"' + (draft.hide[w].indexOf(n) < 0 ? " checked" : "") + ">" +
      (w === "page" ? "На странице" : "На главной") + "</label>";
  }
  /* a field of an instance's form; its value is put in by renderList (never into the markup), a set secret shows only "задан" */
  function fld(e, f, isSet) {
    var sec = SECRET.test(f), at = ' data-f="' + f + '" data-id="' + esc(e.id) + '"';
    return '<label class="kd-dlg-f"><span>' + FLD[f] + "</span>" + (f === "every" ?
      "<select" + at + ">" + EVERY.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("") + "</select>" :
      '<input type="' + (sec ? "password" : "text") + '"' + at + ' autocomplete="' + (sec ? "new-password" : "off") + '"' + (isSet ? ' placeholder="задан"' : "") + ">") +
      '<span class="kd-dlg-hint"></span></label>';
  }
  function hint(inp) {
    var f = inp.getAttribute("data-f"), s = sets(dd, entry(inp.getAttribute("data-id"))).filter(function (x) { return x[0] === f; })[0];
    inp.nextSibling.textContent = s ? bad(f, s[1], dtried && (f === "name" || f === "url" || f === "hosts")) : "";
  }
  function renderList() {
    if (!dlg) return;
    var d = dd, was = {}, h = ((d.cfg || {}).vol ? "" : '<div class="kd-dlg-err">Не найден диск Entware</div>') + '<h2 class="kd-dlg-h">Добавленные</h2>';
    function match(s) { return !dq || s.toLowerCase().indexOf(dq) >= 0; }
    instOf(d).forEach(function (i) { was[i.id] = i; });
    draft.inst.forEach(function (e) {
      var t = typeOf(d, e.type);
      if (draft.del.indexOf(e.id) >= 0 || !match(e.name + " " + t.name + " " + e.type)) return;
      h += '<div class="kd-dlg-i" data-id="' + esc(e.id) + '"><div class="kd-dlg-r kd-dlg-hd"><span class="kd-dlg-n">' + esc(e.name) + '</span><span class="kd-dlg-t">' +
        esc(t.name) + (e.url ? " · " + esc(e.url) : "") + '</span><button type="button" class="kd-dlg-del" aria-label="Удалить" title="Удалить">' + TRASH + "</button></div>";
      if (dopen === e.id) h += '<div class="kd-dlg-form">' + ["name"].concat(t.fields).map(function (f) { return fld(e, f, ((was[e.id] || {}).set || []).indexOf(f) >= 0); }).join("") + (t.hint ? '<div class="kd-dlg-tip">' + esc(t.hint) + "</div>" : "") + "</div>";
      h += "</div>";
    });
    h += '<h2 class="kd-dlg-h">Найденные автоматически</h2>';
    found(d).forEach(function (x) {
      if (match(x[1] + " " + x[0])) h += '<div class="kd-dlg-r kd-dlg-fr"><span class="kd-dlg-n">' + esc(x[1]) + "</span><span class=\"kd-dlg-cs\">" + (x[2] ? chkbox("page", x[0]) : "") + chkbox("main", x[0]) + "</span></div>";
    });
    h += '<h2 class="kd-dlg-h">Добавить сервис</h2>';
    (d.types || []).forEach(function (t) {
      if (match(t[1] + " " + t[0])) h += '<button type="button" class="kd-dlg-r kd-dlg-add" data-type="' + esc(t[0]) + '"><span class="kd-dlg-n">' + esc(t[1]) + '</span><span class="kd-dlg-t">' + esc(t[2]) + "</span></button>";
    });
    var list = dlg.querySelector(".kd-dlg-body");
    list.innerHTML = h;
    Array.prototype.forEach.call(list.querySelectorAll("[data-f]"), function (inp) {
      inp.value = fv(entry(inp.getAttribute("data-id")), inp.getAttribute("data-f")); hint(inp);
    });
  }
  function renderStrip() {
    if (!dlg) return;
    /* nothing is edited while a save is on its way: the result would drop it */
    Array.prototype.forEach.call(dlg.querySelectorAll(".kd-dlg-q,.kd-dlg-body input,.kd-dlg-body select,.kd-dlg-body button"), function (x) { x.disabled = !!(dst && dst.busy); });
    dlg.querySelector(".kd-dlg-bar").innerHTML = dst && dst.busy ? "<span>Сохранение…</span>" : !dirty() ? "" :
      (dst && dst.err ? '<div class="kd-dlg-err">' + esc(dst.err) + "</div>" : "") +
      '<button type="button" class="kd-btn kd-btn-p kd-dlg-save"' + (((lastData || dd).cfg || {}).vol ? "" : " disabled") + '>Сохранить</button><button type="button" class="kd-btn kd-dlg-cancel">Отменить</button>';
  }
  function addInst(type) {
    var d = dd, taken = {}, id, n;
    instOf(d).concat(draft.inst).forEach(function (i) { taken[i.id] = 1; });
    id = newId(type, taken); n = id.slice(type.length + 1);
    draft.inst.push({ id: id, type: type, name: typeOf(d, type).name + (n ? " " + n : ""), url: "", user: "", map: "", hosts: "", every: "5", vals: {} });
    dq = ""; dlg.querySelector(".kd-dlg-q").value = ""; dopen = id; renderList(); renderStrip();
    /* the form opens above the catalog the click was in */
    var el = dlg.querySelector('.kd-dlg-i[data-id="' + id + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }
  function delInst(id) {
    if (instOf(dd).some(function (i) { return i.id === id; })) draft.del.push(id);
    else draft.inst = draft.inst.filter(function (e) { return e.id !== id; });
    if (dopen === id) dopen = "";
    renderList(); renderStrip();
  }
  function doSave() {
    var d = dd, badId = "", my, rev = newRev();
    draft.inst.forEach(function (e) {
      if (!badId && draft.del.indexOf(e.id) < 0 && sets(d, e).some(function (s) { return bad(s[0], s[1], s[0] === "name" || s[0] === "url" || s[0] === "hosts"); })) badId = e.id;
    });
    dtried = true;
    if (badId) { dopen = badId; dq = ""; dlg.querySelector(".kd-dlg-q").value = ""; renderList(); return; }
    my = dst = { busy: true }; renderStrip();
    upload(buildMsg(rev, d, draft), rev).then(function () { return awaitRev(rev, 45000); }).then(function () {
      if (dst !== my) return;
      dd = lastData || dd; draft = fresh(dd); dopen = ""; dst = null; dtried = false; renderList(); renderStrip();
    }, function (e) {
      if (dst !== my) return;
      dst = { err: typeof e !== "string" ? NOSAVE : /^(Не удалось|Сессия)/.test(e) ? e : NOSAVE + ": " + e }; renderStrip();
    });
  }
  function onKey(e) { if (e.key === "Escape") closeSettings(); }
  function onClick(e) {
    var t = e.target, c = function (s) { return t.closest ? t.closest(s) : null; }, i = c(".kd-dlg-i");
    if ((t === dlg && down === dlg) || c(".kd-dlg-x")) closeSettings();
    else if (c(".kd-dlg-save")) doSave();
    else if (c(".kd-dlg-cancel")) { dd = lastData || dd; draft = fresh(dd); dopen = ""; dst = null; dtried = false; renderList(); renderStrip(); }
    else if (c(".kd-dlg-add")) addInst(c(".kd-dlg-add").getAttribute("data-type"));
    else if (c(".kd-dlg-del")) delInst(i.getAttribute("data-id"));
    else if (c(".kd-dlg-hd")) { var id = i.getAttribute("data-id"); dopen = dopen === id ? "" : id; renderList(); }
  }
  function onInput(e) {
    var t = e.target, f = t.getAttribute("data-f"), en;
    if (t.classList.contains("kd-dlg-q")) { dq = t.value.trim().toLowerCase(); renderList(); }
    else if (f) { en = entry(t.getAttribute("data-id")); if (PLAIN.test(f)) en[f] = t.value; else en.vals[f] = t.value; hint(t); renderStrip(); }
  }
  /* the boxes mean "shown": unchecked names go to the hide lists */
  function onChange(e) {
    var t = e.target, w = t.getAttribute("data-w"), n = t.getAttribute("data-n"), l = w && draft.hide[w], k = l ? l.indexOf(n) : 0;
    if (!l) return;
    if (t.checked && k >= 0) l.splice(k, 1); else if (!t.checked && k < 0) l.push(n);
    renderStrip();
  }
  function openSettings() {
    if (dlg || !lastData) return;
    dd = lastData; draft = fresh(dd); dq = ""; dopen = ""; dst = null; dtried = false;
    addStyle();
    dlg = document.createElement("div");
    dlg.className = "kd-dlg-ov";
    dlg.innerHTML = '<div class="kd-dlg" role="dialog" aria-modal="true"><div class="kd-dlg-top"><h1>Настройки сервисов</h1><button type="button" class="kd-dlg-x" aria-label="Закрыть">×</button></div>' +
      '<div class="kd-dlg-sess"></div><input type="text" class="kd-dlg-q" placeholder="Поиск" aria-label="Поиск"><div class="kd-dlg-body"></div><div class="kd-dlg-bar"></div></div>';
    dlg.addEventListener("mousedown", function (e) { down = e.target; }); dlg.addEventListener("click", onClick); dlg.addEventListener("input", onInput); dlg.addEventListener("change", onChange);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(dlg);
    renderList(); renderStrip();
  }
  function closeSettings() {
    if (!dlg || (dirty() && !confirm("Отменить изменения?"))) return;
    document.removeEventListener("keydown", onKey);
    dlg.parentNode.removeChild(dlg); dlg = draft = dst = null; down = null;
  }

  /* Angular sets the title over and over: while the page is open, ours stays and Angular's latest is kept for later */
  var TD = Object.getOwnPropertyDescriptor(Document.prototype, "title");
  function holdTitle(on) {
    if (!on) { delete document.title; document.title = pageTitle; return; }
    var set = function (v) { pageTitle = v; TD.set.call(document, v.replace(/\s[–-]\s.*$/, "") + " – " + TITLE); };
    Object.defineProperty(document, "title", { configurable: true, get: TD.get, set: set });
    set(document.title);
  }
  /* the side menu folds itself on Angular's navigation; here by a tap beside it (on a phone: on the menu button) */
  function fold() {
    var x = document.querySelector(".layout__overlay") || document.querySelector(".header__menu-toggle .toggle__toggle");
    if (x && document.querySelector("ndw-menu .menu--expanded")) x.click();
  }
  function openPage(replace) {
    var main = document.querySelector(".layout__content__main");
    if (!main) return;
    if (!page) {
      pageFrom = location.pathname + location.search + location.hash; pageState = history.state; stripped = []; holdTitle(true);
      Array.prototype.forEach.call(main.children, function (c) { if (c.tagName !== "ROUTER-OUTLET") c.setAttribute("data-kd-hidden", ""); });
      addStyle();
      page = main.appendChild(document.createElement("div")); page.className = "kd-page";
      page.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".kd-set")) openSettings(); });
    }
    if (location.pathname !== PAGE) history[replace ? "replaceState" : "pushState"]({ keendash: 1 }, "", PAGE);
    fold(); ensureMenu();
    main.scrollTop = 0; renderPage();
  }
  /* back: to the page Angular still has underneath, its menu item active again; the title is Angular's latest anyway */
  function closePage(back) {
    if (!page) return;
    page.parentNode.removeChild(page); page = null;
    Array.prototype.forEach.call(document.querySelectorAll("[data-kd-hidden]"), function (c) { c.removeAttribute("data-kd-hidden"); });
    if (back) stripped.forEach(function (x) { x.classList.add(ACT); });
    holdTitle(false);
    ensureMenu();
  }
  function ensureMenu() {
    var ul = document.getElementById("menu.main"), ref = ul && ul.querySelector('a[href="/dashboard"]');
    if (!ref) return null;
    var a = document.getElementById("kd-menu");
    if (!a) {
      var li = ref.parentNode.cloneNode(true);
      a = li.querySelector("a"); a.id = "kd-menu"; a.setAttribute("href", PAGE);
      (a.querySelector(".page-link__label") || a).textContent = " " + TITLE + " ";
      a.addEventListener("click", function (e) { e.preventDefault(); openPage(); });
      ref.parentNode.parentNode.insertBefore(li, ref.parentNode.nextSibling);
    }
    /* a copy has none of Angular's bindings: the classes of the item above (hidden while the group is folded) */
    var c = ref.className.split(" ").filter(function (x) { return x !== ACT; }).concat(page ? [ACT] : []).join(" ");
    if (a.className !== c) a.className = c;
    if (page) Array.prototype.forEach.call(document.querySelectorAll("ndw-menu ." + ACT), function (x) { if (x !== a) { x.classList.remove(ACT); stripped.push(x); } });
    return a;
  }
  function ensurePage() {
    var main = document.querySelector(".layout__content__main");
    var shown = main && Array.prototype.some.call(main.children, function (c) { return c.tagName === "NG-COMPONENT" && !c.hasAttribute("data-kd-hidden"); });
    /* Angular has shown another page */
    if (page && shown) closePage();
    /* back on /keendash (a reload, the history): once Angular has redirected to the dashboard */
    if (ensureMenu() && !page && pageWant && shown && location.pathname !== PAGE) { pageWant = false; openPage(true); }
  }
  try {
    window.addEventListener("popstate", function () {
      if (location.pathname === PAGE) { pageWant = true; schedule(); } else closePage(location.pathname + location.search + location.hash === pageFrom);
    });
    /* Angular ignores its menu item of the page it still shows underneath: back to that page here */
    document.addEventListener("click", function (e) {
      var l = page && e.target.closest ? e.target.closest('ndw-menu a[href^="/"]') : null;
      if (!l || l.id === "kd-menu" || l.getAttribute("href") !== pageFrom) return;
      history.replaceState(pageState, "", pageFrom);
      closePage(true); fold();
    }, true);
    var rs = 0;
    window.addEventListener("resize", function () { clearTimeout(rs); rs = setTimeout(renderPage, 150); });
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    setInterval(update, 30000);
    update();
    schedule();
  } catch (e) { }
})();
