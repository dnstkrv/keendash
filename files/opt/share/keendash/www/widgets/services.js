/* "Сервисы" dashboard card for the Keenetic web UI: service status + tabs with details and sparkline graphs.
 * Clones a native dashboard card (styles match) and has its own drag-and-drop between native CDK columns. */
(function () {
  "use strict";
  if (window.__servicesWidget) return;
  window.__servicesWidget = true;

  /* base URL of keendash's web server; the loader injected by keendash sets window.__keendash.base */
  var BASE = (window.__keendash && window.__keendash.base) || ("http://" + location.hostname + ":8189/");
  var API = BASE + "cgi-bin/status.cgi";
  var KEY = "ui.services.pos", TABKEY = "ui.services.tab", SKIPKEY = "ui.services.skip";
  var TITLE = "Сервисы";
  var TABS = [["telemt", "telemt"], ["awg", "AWG"], ["firc", "firc"], ["nfqws", "nfqws"], ["hydra", "Hydra"], ["ascn", "Antiscan"], ["sys", "Система"]];
  /* tab id -> services whose web UI the "Открыть" link points to (link itself is auto-detected) */
  var TABSVC = { telemt: ["telemt-panel"], awg: ["awg-manager"], firc: ["firc"], nfqws: ["nfqws2", "nfqws"], hydra: ["hrweb"] };
  var TABWEB = { nfqws: /nfqws/i };
  var PXKIND = { "freeturn-server": "FreeTurn", "wdtt-server": "WDTT" };
  var OK = "#3ecf8e", BAD = "#ff6b6b", ACC = "#4da3ff", WARN = "#f5a623", OFF = "#7b8798";

  var row = null, bodyEl = null, lastData = null, dragging = false, placeholder = null;
  var tab = "telemt";
  /* upgrade started from this page: target version; upRun once update.cgi accepted it; upErr after a failed one */
  var upTo = "", upRun = false, upErr = false, upTimer = null;
  try { tab = localStorage.getItem(TABKEY) || "telemt"; } catch (e) {}

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
  function url(port) { return "http://" + location.hostname + ":" + port + "/"; }
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
  function tabFirc(d, s) {
    var f = d.firc || {}, list = (f.list || []).slice().sort(function (a, b) { return b[3] - a[3] || b[2] - a[2]; });
    var h = '<div class="us-grid">' + blk("Доменов в пуле", f.domains, s.firc_domains || [], ACC) +
      blk("Групп включено", f.enabled + " / " + f.groups, null) + "</div>" + sec("Группы по числу доменов");
    list.slice(0, 8).forEach(function (g) {
      h += line(g[2] ? OK : OFF, esc(g[0]) + ' <span class="us-tag">' + esc(g[1]) + "</span>", g[3], !g[2]);
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
    upTo = v; upRun = false; upErr = false; render();
    fetch(BASE + "cgi-bin/update.cgi", { method: "POST", cache: "no-store" })
      .then(function (r) { if (!r.ok) throw r.status; upRun = true; update(); })
      .catch(function () { upTo = ""; upErr = true; render(); });
  }
  function watchUpdate(u) {
    if (!u) return;
    if (u.busy && !upTo) { upTo = u.new; upRun = true; }
    if (!upTo || !upRun) return;
    /* the new widget only arrives with a page reload */
    if (u.cur === upTo) { location.reload(); return; }
    if (!u.busy) { upTo = ""; upRun = false; upErr = true; return; }
    clearTimeout(upTimer); upTimer = setTimeout(update, 3000);
  }

  function render() {
    if (!bodyEl) return;
    var d = lastData, h = "";
    if (!d) { bodyEl.innerHTML = '<div class="us-note">загрузка…</div>'; return; }
    var svc = d.svc || [], have = d.tabs || ["sys"];
    var avail = TABS.filter(function (t) { return have.indexOf(t[0]) >= 0; });
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
      var ws = webBy[x[0]] || [];
      var own = ws.filter(function (w) { return w[0] === x[0]; }), got = ws.filter(function (w) { return w[0] !== x[0]; });
      if (nweb[x[0]] >= 2) {
        h += chip(x[0], x[1], got.length ? url(got[0][1]) : "");
        own.forEach(function (w) { h += chip(w[2] || (x[0] + ":" + w[1]), x[1], url(w[1]), x[0] + " · " + (w[2] || "порт " + w[1]) + " · открыть"); });
      } else h += chip(x[0], x[1], ws.length ? url(ws[0][1]) : nweb[x[0]] ? "" : linkOf(x));
    });
    h += '</div><div class="us-tabs"><div class="us-tl">';
    avail.forEach(function (t) { h += '<button type="button" class="us-tab' + (t[0] === tab ? " us-on" : "") + '" data-tab="' + t[0] + '">' + t[1] + "</button>"; });
    h += "</div>";
    var tls = tabLinks(tab, svc, d.web);
    tls.forEach(function (x) {
      h += '<a class="us-open" href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + (tls.length > 1 ? esc(x[0]) + " ↗" : "Открыть ↗") + "</a>";
    });
    h += "</div>";
    var s = d.series || {};
    h += (tab === "awg" ? tabAwg : tab === "firc" ? tabFirc : tab === "ascn" ? tabAscn : tab === "nfqws" ? tabNfqws : tab === "hydra" ? tabHydra : tab === "sys" ? tabSys : tabTelemt)(d, s);
    bodyEl.innerHTML = h;
    /* re-rendering resets the tab strip's scroll: keep the active tab visible */
    var tl = bodyEl.querySelector(".us-tl"), on = tl && tl.querySelector(".us-on");
    if (on) { var a = on.getBoundingClientRect(), b = tl.getBoundingClientRect(); if (a.right > b.right) tl.scrollLeft += a.right - b.right; }
  }

  function update() {
    fetch(API, { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) { lastData = d; watchUpdate(d.upd); render(); })
      .catch(function () {
        /* our web server restarts during an upgrade: keep the last view and retry */
        if (upRun) { clearTimeout(upTimer); upTimer = setTimeout(update, 3000); return; }
        lastData = null; if (bodyEl) bodyEl.innerHTML = '<div class="us-note">нет данных (status.cgi недоступен)</div>'; });
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
      ".us-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px}" +
      ".us-blk{display:flex;flex-direction:column;gap:6px;min-width:0}" +
      ".us-bh{display:flex;justify-content:space-between;align-items:baseline;gap:8px}" +
      ".us-lbl{font-size:12px;opacity:.7}.us-val{font-size:18px;font-weight:600;font-variant-numeric:tabular-nums}" +
      ".us-spark{width:100%;height:44px;display:block}.us-empty{font-size:12px;opacity:.5;line-height:44px}" +
      ".us-sec{font-size:11px;text-transform:uppercase;letter-spacing:.06em;opacity:.5;margin-top:2px}" +
      ".us-row{display:flex;align-items:center;gap:8px;font-size:13px;min-width:0}.us-dim{opacity:.55}" +
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
      ".us-upd-skip{background:none;border:0;padding:0;color:inherit;opacity:.6;font:inherit;font-size:12px;cursor:pointer}.us-upd-skip:hover{opacity:1;text-decoration:underline}";
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
      var b = e.target.closest ? e.target.closest(".us-tab") : null;
      if (!b) return;
      tab = b.getAttribute("data-tab");
      try { localStorage.setItem(TABKEY, tab); } catch (x) {}
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
    requestAnimationFrame(function () { pending = false; try { ensure(); } catch (e) { } });
  }
  try {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    setInterval(update, 30000);
    update();
    schedule();
  } catch (e) { }
})();
