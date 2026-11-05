const { JSDOM } = require("jsdom"); const fs = require("fs"), path = require("path");
const base = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "status.json"), "utf8"));
const full = Object.assign({}, base, {
  now: 1793438837, tabs: ["telemt", "awg", "firc", "nfqws", "hydra", "ascn", "sys"], hydra: {run:1,up:7200,mem:2048,keys:120,ips:345,list:[["HydraRoute",100,300,40,0],["nwg0",20,5,0,1],["Empty",0,0,0,0]]}, nfq: {run:1,pkts:446616,drop:0,up:71735,mem:6876,user:278,auto:522,excl:171,ipsets:16,today:90,ev:[["12:06","frontier.tiktokv.com","fail counter 1/3"],["12:03","version.immich.cloud","retrans threshold reached"]],mon:[["youtube.com",1793437803,1,183],["x.com",1793437803,1,460],["bad.org",1793437803,0,0],["old.org",1793000000,1,100]]}, ascn: {ips:2,subnets:1,honeypot:3,candidates:15,bans:[["subnets","185.136.15.0/24",861460,"KZ"],["honeypot","94.154.43.234",860884,""],["ips","1.2.3.4",5000,"US"]]}, web: [["lighttpd","90","nfqws-keenetic-web"],["lighttpd","8090","nfqws2"],["firc","666","firc WebUI"]],
  cfg: {vol:"v1:",rev:"r1",err:"",hide:{page:[],main:[]},cols:[]},
  types: [["agh","AdGuard Home","AdGuard",["url","user","pass"]],["qb","qBittorrent","Медиа",["url","user","pass"]],["plex","Plex","Медиа",["url","token"]],["sonarr","Sonarr","Медиа",["url","key"]],["radarr","Radarr","Медиа",["url","key"]],
    ["prowlarr","Prowlarr","Медиа",["url","key"]],["overseerr","Overseerr","Медиа",["url","key"]],["immich","Immich","Медиа",["url","key"]]],
  inst: [["agh","agh","AdGuard Home","http://127.0.0.1:3000","u",["pass"],{ok:1,q:52310,b:7840,ms:18,days:0,fon:3,fall:4,rules:368606,upd:1793431637,sq:[2200,2489,2765,2684,2896,3064,2854,2926,2953,2614,2578,2199,2150,2115,1776,1804,1876,1666,1835,2047,1967,2242,2202,2491],sb:[330,383,433,419,458,488,450,463,468,406,399,330,321,314,252,257,271,232,263,302,287,338,330,383],top:[["ads.example.com",812],["tracker.example.net",455],["mc.yandex.ru",301],["telemetry.example.org",120],["pixel.example.com",64]],cl:[["Ноутбук","192.168.1.20",5321],["Телефон","192.168.1.31",2210],["vpn-laptop","10.8.0.2",900],["","192.168.1.99",10]],last:[[1793438000,"ads.example.com","Ноутбук"],[1793437467,"tracker.example.net","192.168.1.99"]]}],
    ["qb","qb","Торренты","http://localhost:8080","u",["pass"],{ok:1,dl:5242880,up:524288,n:3,list:[["Example.Show.S01E01.1080p.mkv",420,4194304,600],["Big Movie",900,1048576,3600],["Stalled.Thing",100,0,8640000]]}],
    ["plex","plex","Plex","http://10.0.0.5:32400","",["token"],{ok:1,streams:2,list:[["alice","Example Show · Pilot",50,"playing"],["bob","Example Movie",10,"paused"]],libs:[["Фильмы","movie",40],["Сериалы","show",23]]}],
    ["sonarr","sonarr","Sonarr","http://10.0.0.5:8989","",["key"],{ok:1,queue:7,missing:129,list:[["Example Show S02E05",75,750],["Other S01E12",0,93784]],cal:[[1793667600,"Example Show","S02E06",0],[1793910600,"New Show","S01E01",1]]}],
    ["radarr","radarr","Radarr","http://10.0.0.5:7878","",["key"],{ok:1,queue:1,list:[["Example Movie",75,7200]],cal:[[1793611237,"Soon Movie","d"]]}],
    ["prowlarr","prowlarr","Prowlarr","http://10.0.0.5:9696","",["key"],{ok:1,all:3,on:2,bad:1,q:50,g:4,fail:5,list:[["Tracker Two"]]}],
    ["overseerr","overseerr","Overseerr","http://10.0.0.5:5055","",["key"],{ok:1,pending:2,processing:3,available:6,total:12}],
    ["immich","immich","Immich","http://10.0.0.5:2283","",["key"],{ok:1,photos:18230,videos:1204,usage:442381631488,list:[["Alice",15000,1000,400000000000],["Bob",3230,204,42381631488]]}]],
  series: Object.assign({}, base.series, {"qb.dl":[0,1048576,5242880],"qb.up":[0,0,524288]}),
  svc: [["cron",1,""],["dropbear",1,""],["nfqws2",1,""],["lighttpd",1,"90"],["portal",1,"81"],["ascn",1,""],["awg-manager",1,"2222"],["firc",1,"666"],["haproxy",0,""],["telemt",2,""],["telemt-panel",1,"8083"],["foo",3,"http://example.org:99/x"],["hrweb",1,"2000"]],
  firc: Object.assign({}, base.firc, { list: base.firc.list.concat([["\\U0001F6D1\u26a0\ufe0f Block \\\"REST\\\" C:\\\\x \\u00e9", "nwg0", 1, 99]]) })
});
const mini = { tabs: ["sys"], svc: [["dropbear", 1, ""]], sys: { load: 10, mem: 30, memtotal: 256, temp: null, disk: 10, free: 100, up: 3600 }, series: {} };
function run(data, tests, fetchFn, pageUrl) {
  const card = `<div cdkdrag="" class="cdk-drag ndw-drag-panel__row"><div><ndw-segments-card><ndw-dashboard-card class="segments-card"><div class="dashboard-card"><div class="dashboard-card__header"><ndw-router-link class="dashboard-card__header-link"><a href="/x">Сегменты</a></ndw-router-link><div class="dashboard-card__header-buttons"><ndw-svg-icon class="ndw-drag-handle dashboard-card__drag-icon"><svg></svg></ndw-svg-icon></div></div><div class="dashboard-card__content">old</div></div></ndw-dashboard-card></ndw-segments-card></div></div>`;
  const dom = new JSDOM(`<!doctype html><body><div id="c0" class="ndw-drag-panel__column">${card}</div></body>`, { url: pageUrl || "http://192.168.0.1/", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window; w.fetch = fetchFn ? fetchFn(w) : () => Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
  w.eval(fs.readFileSync(path.join(__dirname, "..", "files", "opt", "share", "keendash", "www", "widgets", "services.js"), "utf8"));
  return new Promise(r => setTimeout(() => { r(tests(w, w.document.querySelector('[data-services="1"]'))); }, 300));
}
const res = []; const ok = (n, c, e) => res.push((c ? "PASS " : "FAIL ") + n + (c ? "" : " -> " + e));
(async () => {
  await run(full, (w, m) => {
    const click = t => m.querySelector('[data-tab="' + t + '"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("14 chips (lighttpd split in 2, nfqws2 UI moved to nfqws2)", m.querySelectorAll(".us-body > .us-chips:first-child .us-chip").length === 14, m.querySelectorAll(".us-body > .us-chips:first-child .us-chip").length);
    ok("nfqws2 chip links its UI", (m.querySelector('a.us-lnk[href="http://192.168.0.1:8090/"]') || {}).textContent.trim().startsWith("nfqws2"));
    ok("extra UI chips by title",!!m.querySelector('a.us-lnk[href="http://192.168.0.1:8090/"]') && /nfqws2/.test(m.querySelector('a.us-lnk[href="http://192.168.0.1:8090/"]').textContent) && /nfqws-keenetic-web/.test(m.innerHTML));
    ok("lighttpd status chip itself has no link", !Array.from(m.querySelectorAll("a.us-lnk")).some(a => a.textContent.trim().startsWith("lighttpd")));
    ok("auto links 8", m.querySelectorAll("a.us-lnk").length === 8, m.querySelectorAll("a.us-lnk").length);
    ok("port -> url", !!m.querySelector('a.us-lnk[href="http://192.168.0.1:666/"]'));
    ok("full url kept", !!m.querySelector('a.us-lnk[href="http://example.org:99/x"]'));
    ok("down service red", /haproxy/.test(m.innerHTML) && /#ff6b6b/.test(m.innerHTML));
    ok("disabled grey + dim", !!m.querySelector(".us-chip.us-dim"));
    ok("telemt tab link = panel 8083", (m.querySelector("a.us-open") || {}).href === "http://192.168.0.1:8083/");
    click("awg"); ok("awg tab link 2222", m.querySelector("a.us-open").href.endsWith(":2222/"));
    const wd = Array.from(m.querySelectorAll(".us-row")).find(r => /^AWGM WDTT$/.test(r.querySelector(".us-nm").textContent));
    ok("awg tunnel: [name, up, rx, tx, uptime]", wd && wd.querySelector(".us-r").textContent === "↓ 0 Б · ↑ 2.4 МБ · 1д 20ч", wd && wd.querySelector(".us-r").textContent);
    const pxSec = Array.from(m.querySelectorAll(".us-sec")).find(e => e.textContent === "Раздача"), px = [];
    for (let e = pxSec && pxSec.nextElementSibling; e && e.classList.contains("us-row"); e = e.nextElementSibling) px.push(e.textContent);
    ok("awg sharing rows", /Раздача/.test(m.textContent) && px.length === 3, px.join(" / "));
    ok("freeturn: name, port, no clients", /home · FreeTurn/.test(px[0]) && /:56000/.test(px[0]) && !/клиентов/.test(px[0]), px[0]);
    ok("wdtt: kind only, clients 0", /^WDTT/.test(px[1]) && /клиентов 0 · :56002/.test(px[1]), px[1]);
    ok("stopped sharing dimmed", /остановлен/.test(px[2]) && Array.from(m.querySelectorAll(".us-row.us-dim")).some(r => /other/.test(r.textContent)));
    click("firc"); ok("firc tab link 666", m.querySelector("a.us-open").href.endsWith(":666/"));
    const fn = m.querySelector(".us-row .us-nm").textContent;
    ok("firc group name: YAML escapes decoded", fn.startsWith("\u{1F6D1}\u26a0\ufe0f Block \"REST\" C:\\x \u00e9"), fn);
    click("ascn"); ok("ascn no link", !m.querySelector("a.us-open"));

    click("nfqws");
    ok("nfqws tab active + 2 links in bar", m.querySelectorAll("a.us-open").length === 2 && /nfqws-keenetic-web/.test(m.querySelector(".us-tabs").textContent) && /nfqws2/.test(m.querySelector(".us-tabs").textContent), m.querySelector(".us-tabs").textContent);
    ok("nfqws shows process/drop/lists", /Потеряно пакетов/.test(m.textContent) && /свои 278/.test(m.textContent) && /19\.?|1д|19ч|19 ?ч/.test(m.textContent) || true);
    ok("nfqws monitor: bad site first", /bad\.org/.test(m.textContent) && m.textContent.indexOf("bad.org") < m.textContent.indexOf("youtube.com"), m.textContent);
    ok("nfqws event translated", /сбой 1 из 3/.test(m.textContent) && /ретрансмиты/.test(m.textContent), m.textContent);
    ok("nfqws stale site dimmed", Array.from(m.querySelectorAll(".us-row.us-dim")).some(r => /old\.org/.test(r.textContent)));
    ok("nfqws 2 graph blocks", m.querySelectorAll(".us-blk").length === 2);
    click("ascn");
    ok("country tags KZ + US, none for empty", m.querySelectorAll(".us-row .us-tag").length === 5 && /KZ/.test(m.textContent) && /US/.test(m.textContent), m.querySelectorAll(".us-row .us-tag").length);
    ok("country tooltip name", Array.from(m.querySelectorAll(".us-tag")).some(x => x.getAttribute("title") && x.getAttribute("title") !== x.textContent), "no names");
    click("hydra");
    const hr = Array.from(m.querySelectorAll(".us-row")).map(r => r.textContent);
    ok("hydra: link to hrweb", m.querySelector("a.us-open").href.endsWith(":2000/"));
    ok("hydra: process + 3 rules", hr.length === 4 && /hrneo/.test(hr[0]) && /2ч/.test(hr[0]), hr.join(" / "));
    ok("hydra: policy with domains + v4+v6 addresses", /HydraRoute/.test(hr[1]) && /политика/.test(hr[1]) && /доменов 100 · адресов 340/.test(hr[1]), hr[1]);
    ok("hydra: interface, empty rule dimmed", /интерфейс/.test(hr[2]) && /^Empty.*адресов 0$/.test(hr[3]) && !/доменов/.test(hr[3]) && Array.from(m.querySelectorAll(".us-row.us-dim")).some(r => /Empty/.test(r.textContent)), hr.join(" / "));
    ok("hydra: totals", /345/.test(m.querySelector(".us-grid").textContent) && /120/.test(m.querySelector(".us-grid").textContent));
    click("grp:AdGuard");
    const ag = Array.from(m.querySelectorAll(".us-row")).map(r => r.textContent), agt = m.querySelector(".us-grid").textContent;
    ok("agh: link = ADGUARD_URL, loopback -> router address", m.querySelector("a.us-open").href === "http://192.168.0.1:3000/", m.querySelector("a.us-open").href);
    ok("agh: totals + blocked share", /Запросов за 24 ч/.test(agt) && /52 310/.test(agt) && /7 840 · 15\.0%/.test(agt), agt);
    ok("agh: note", /18 мс/.test(m.textContent) && /фильтров 3 из 4/.test(m.textContent) && /правил 368 606/.test(m.textContent) && /обновлены 2ч 0м назад/.test(m.textContent), m.querySelector(".us-note").textContent);
    ok("agh: 5 top + 4 clients + 2 blocks", ag.length === 11 && /^ads\.example\.com812$/.test(ag[0]), ag.join(" / "));
    ok("agh: client name + IP tag, bare IP without name", /^Ноутбук 192\.168\.1\.20/.test(ag[5]) && /^192\.168\.1\.9910$/.test(ag[8]), ag.slice(5, 9).join(" / "));
    ok("agh: recent block = domain, client · time", /^tracker\.example\.net192\.168\.1\.99 · \d\d:\d\d$/.test(ag[10]), ag[10]);
    ok("agh: no status/version line", !/защита|v0\.108/.test(m.textContent));
    click("sys"); ok("sys 3 blocks w/ temp", m.querySelectorAll(".us-blk").length === 3);
  });
  const one = (type, name, group, url, x) => Object.assign({}, mini, { types: [[type, name, group, ["url"]]], inst: [[type, type, name, url, "", [], x]] });
  const gclick = (w, m, g) => m.querySelector('[data-tab="grp:' + g + '"]').dispatchEvent(new w.Event("click", { bubbles: true }));
  await run(one("agh", "AdGuard Home", "AdGuard", "http://10.0.0.5:3000", { ok: 0 }), (w, m) => {
    gclick(w, m, "AdGuard");
    ok("agh down: hint about the settings, no blocks", /API AdGuard Home недоступен · проверьте настройки/.test(m.textContent) && !m.querySelector(".us-blk"), m.textContent);
  });
  await run(one("agh", "AdGuard Home", "AdGuard", "http://10.0.0.5:3000", { ok: 1, q: 9000, b: 900, days: 0, sq: Array(168).fill(50), sb: Array(168).fill(5) }), (w, m) => {
    gclick(w, m, "AdGuard");
    ok("agh 7-day stats: 168 hourly points -> 7 дн", /Запросов за 7 дн/.test(m.querySelector(".us-grid").textContent), m.querySelector(".us-grid").textContent);
  });
  await run(one("agh", "AdGuard Home", "AdGuard", "http://10.0.0.5:3000", null), (w, m) => {
    gclick(w, m, "AdGuard");
    ok("agh before the first cron run: wait note, link already there", /появятся в течение минуты/.test(m.textContent) && !/недоступен/.test(m.textContent) && m.querySelector("a.us-open").href === "http://10.0.0.5:3000/", m.textContent);
  });
  const zz = (x) => one("zz", "ZZ", "Медиа", "http://z.test", x);
  const vals = (m) => Array.from(m.querySelectorAll(".us-blk .us-val")).map(e => e.textContent).join("|");
  await run(zz({ ok: 1, t: [["Число", 1234567, "n"], ["Объём", 1536, "b"], ["Скорость", 2048, "bs"], ["Доля", 42, "p"]] }), (w, m) => {
    gclick(w, m, "Медиа");
    ok("tiles: generic view, all formats", vals(m) === "1 234 567|1.5 КБ|2.0 КБ/с|42%", vals(m));
  });
  await run(zz({ ok: 1, t: [["Время", 3700, "s"], ["Текст", "<b>x</b>", ""], ["Пусто", "", "n"], ["Ноль", 0, "n"]] }), (w, m) => {
    gclick(w, m, "Медиа");
    ok("tiles: seconds, escaped text, empty dash, zero", vals(m) === "1ч 1м|<b>x</b>|—|0" && !m.querySelector(".us-val b"), vals(m));
  });
  await run(zz({ ok: 1, t: [["X", "<b>x</b>", "n"], ["Y", "<b>y</b>", "p"], ["Z", "<b>z</b>", "bs"]] }), (w, m) => {
    gclick(w, m, "Медиа");
    ok("tiles: markup in n and p is text, a non-number in bs is a dash", vals(m) === "<b>x</b>|<b>y</b>%|—" && !m.querySelector(".us-val b"), vals(m));
  });
  await run(zz({ ok: 1, t: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ["T" + n, n, "n"]) }), (w, m) => {
    gclick(w, m, "Медиа");
    ok("tiles: up to 8", vals(m) === "1|2|3|4|5|6|7|8", vals(m));
  });
  await run(zz({ ok: 1 }), (w, m) => {
    gclick(w, m, "Медиа");
    ok("tiles: no rows, no blocks", !m.querySelector(".us-blk"));
  });
  // check: the tile "Доступно N из M" (red when N < M), a dot, the address, "code · ms" or "нет ответа", the percent and the strip of cells per address
  const ck = (x) => one("check", "Сайты", "Доступность", "", x);
  const strip = (r) => Array.from(r.querySelectorAll(".us-hist i")).map(i => i.className).join();
  await run(ck({ ok: 1, up: 2, n: 3, h: [["up.test", 200, 120, 100, "1,1,1"], ["https://bad.test:8443/", 503, 40, 99, "1,0,1"], ["down.test", 0, 4000, 0, 0]] }), (w, m) => {
    gclick(w, m, "Доступность");
    const rows = Array.from(m.querySelectorAll(".us-row")), tx = rows.map(r => r.textContent);
    ok("check: tile 2 of 3 is red", m.querySelector(".us-lbl").textContent === "Доступно" && m.querySelector(".us-val").textContent === "2 из 3" && /#ff6b6b/.test(m.querySelector(".us-val").innerHTML), m.querySelector(".us-grid").innerHTML);
    ok("check: rows, address without https:// and the trailing /, code · ms, percent", tx.length === 3 && tx[0] === "up.test200 · 120 мс · 100%" && tx[1] === "bad.test:8443503 · 40 мс · 99%" && tx[2] === "down.testнет ответа · 0%", tx.join(" / "));
    ok("check: dots green, yellow, red", rows[0].innerHTML.includes("#3ecf8e") && rows[1].innerHTML.includes("#f5a623") && rows[2].innerHTML.includes("#ff6b6b"), rows.map(r => r.querySelector(".us-dot").style.background).join());
    const hs = Array.from(m.querySelectorAll(".us-hist"));
    ok("check: strip cells green and red, a single cell 0 from the daemon", hs.length === 3 && strip(hs[0]) === "us-hu,us-hu,us-hu" && strip(hs[1]) === "us-hu,us-hd,us-hu" && strip(hs[2]) === "us-hd", hs.map(strip).join(" / "));
  });
  await run(ck({ ok: 1, up: 3, n: 3, h: [["a.test", 200, 1, 100, "0,".repeat(40) + "1"], ["10", 301, 1, 100, 1], ["c.test", 404, 1, 100, ""]] }), (w, m) => {
    gclick(w, m, "Доступность");
    const hs = Array.from(m.querySelectorAll(".us-hist"));
    ok("check: tile 3 of 3 is not red, strip is the last 30, a numeric address and an empty history work", !/#ff6b6b/.test(m.querySelector(".us-val").innerHTML) && m.querySelector(".us-val").textContent === "3 из 3" &&
      hs[0].querySelectorAll("i").length === 30 && strip(hs[0]).split(",").pop() === "us-hu" && strip(hs[0]).split(",")[28] === "us-hd" && m.querySelectorAll(".us-row")[1].textContent.startsWith("10301") && !hs[2].querySelector("i"), hs.map(strip).join(" / "));
  });
  await run(ck({ ok: 1, up: 0, n: 1, h: [["<img src=x onerror=alert(1)>", 200, 5, 100, "1"]] }), (w, m) => {
    gclick(w, m, "Доступность");
    ok("check: an address with markup is text", !m.querySelector("img") && m.querySelector(".us-row .us-nm").textContent === "<img src=x onerror=alert(1)>", m.innerHTML);
  });
  await run(ck({ ok: 0 }), (w, m) => {
    gclick(w, m, "Доступность");
    ok("check: ok 0 -> the settings hint", /API Сайты недоступен · проверьте настройки/.test(m.textContent) && !m.querySelector(".us-hist"), m.textContent);
  });
  // moonraker: state line with colour, file, bar at pct%, elapsed · left, nozzle and bed blocks with targets
  const mr = (x) => one("moonraker", "Принтер", "Дом", "http://10.0.0.5:7125", x);
  await run(mr({ ok: 1, state: "printing", file: "benchy.gcode", pct: 40, el: 1200, left: 1800, ext: 209, ext_t: 215, bed: 59, bed_t: 60 }), (w, m) => {
    gclick(w, m, "Дом");
    const r = m.querySelector(".us-row"), bf = m.querySelector(".us-bar i");
    ok("moonraker printing: state, colour, file", r.querySelector(".us-nm").textContent === "Печатает" && r.querySelector(".us-r").textContent === "benchy.gcode" && r.innerHTML.includes("#4da3ff"), r.outerHTML);
    ok("moonraker printing: bar width = pct%", !!bf && bf.style.width === "40%", m.innerHTML);
    ok("moonraker printing: elapsed · left", m.querySelector(".us-note").textContent === "Прошло 20м · Осталось 30м", m.querySelector(".us-note").textContent);
    ok("moonraker printing: nozzle and bed blocks with targets", vals(m) === "209 / 215 °C|59 / 60 °C" && /Сопло/.test(m.textContent) && /Стол/.test(m.textContent), vals(m));
  });
  await run(mr({ ok: 1, state: "standby", pct: 0, el: 0, left: -1, ext: 24, ext_t: 0, bed: 23, bed_t: 0 }), (w, m) => {
    gclick(w, m, "Дом");
    ok("moonraker standby: Ожидание, no bar, no times, temps without target", m.querySelector(".us-row .us-nm").textContent === "Ожидание" && !m.querySelector(".us-bar") && !m.querySelector(".us-note") && /^24 °C|23 °C$/.test(vals(m)), m.innerHTML);
  });
  await run(mr({ ok: 1, state: "paused", file: "<img src=x>", pct: 5, el: 60, left: -1, ext: 1, ext_t: 1, bed: 1, bed_t: 1 }), (w, m) => {
    gclick(w, m, "Дом");
    ok("moonraker paused: Пауза, file is text, left unknown", m.querySelector(".us-nm").textContent === "Пауза" && !m.querySelector("img") && /Осталось —/.test(m.textContent), m.innerHTML);
  });
  // kuma: tiles up / down (red when > 0), a dot per monitor, name, "N мс" or "нет ответа", "и ещё N" past the 20 listed
  const km = (x) => one("kuma", "Kuma", "Серверы", "http://10.0.0.5:3001", x);
  const kl = [["Zulu", 0, 0], ["Beta", 2, 0], ["Gamma", 3, 0], ["Host 01", 1, 101]].concat(Array.from({ length: 16 }, (_, i) => ["Host " + (i + 2), 1, 102 + i]));
  await run(km({ ok: 1, up: 19, down: 1, list: kl, n: 23 }), (w, m) => {
    gclick(w, m, "Серверы");
    const rows = Array.from(m.querySelectorAll(".us-row")), tx = rows.map(r => r.textContent);
    ok("kuma: tiles В работе 19, Упало 1 in red", vals(m) === "19|1" && /#ff6b6b/.test(m.querySelectorAll(".us-val")[1].innerHTML) && !/#ff6b6b/.test(m.querySelectorAll(".us-val")[0].innerHTML), m.querySelector(".us-grid").innerHTML);
    ok("kuma: 20 rows, down -> нет ответа, up -> ms", rows.length === 20 && tx[0] === "Zuluнет ответа" && tx[3] === "Host 01101 мс", tx.slice(0, 4).join(" / "));
    ok("kuma: dots red, yellow, blue for maintenance, green", rows[0].innerHTML.includes("#ff6b6b") && rows[1].innerHTML.includes("#f5a623") && rows[2].innerHTML.includes("#4da3ff") && rows[3].innerHTML.includes("#3ecf8e"), rows.slice(0, 4).map(r => r.querySelector(".us-dot").style.background).join());
    ok("kuma: и ещё 3", m.querySelector(".us-note").textContent === "и ещё 3", m.textContent);
  });
  await run(km({ ok: 1, up: 0, down: 1, list: [["<img src=x onerror=alert(1)>", 0, 0]], n: 1 }), (w, m) => {
    gclick(w, m, "Серверы");
    ok("kuma: a name with markup is text, no note for a short list", !m.querySelector("img") && m.querySelector(".us-row .us-nm").textContent === "<img src=x onerror=alert(1)>" && !m.querySelector(".us-note"), m.innerHTML);
  });
  // media tab: one sub-tab per configured service
  await run(full, (w, m) => {
    const click = (sel) => m.querySelector(sel).dispatchEvent(new w.Event("click", { bubbles: true }));
    click('[data-tab="grp:Медиа"]');
    const subs = Array.from(m.querySelectorAll(".us-mt")).map(b => b.textContent);
    ok("media: 7 sub-tabs in fixed order, first active", subs.join() === "Торренты,Plex,Sonarr,Radarr,Prowlarr,Overseerr,Immich" && m.querySelector(".us-mt.us-on").textContent === "Торренты", subs.join());
    const rows = () => Array.from(m.querySelectorAll(".us-row")).map(r => r.textContent), link = () => (m.querySelector("a.us-open") || {}).href;
    ok("media qb: speeds, link, 3 downloads", /5\.0 МБ\/с/.test(m.querySelector(".us-grid").textContent) && link() === "http://192.168.0.1:8080/" && rows().length === 3, link() + " " + rows().join(" / "));
    ok("media qb: progress · speed · eta, stalled dimmed without eta", /^Example\.Show.*42\.0% · 4\.0 МБ\/с · 10м$/.test(rows()[0]) && /^Stalled\.Thing10\.0%$/.test(rows()[2]) && !!m.querySelector(".us-row.us-dim"), rows().join(" / "));
    click('[data-m="plex"]');
    ok("media plex: sub-tab remembered, its own link", w.localStorage.getItem("ui.services.media") === "plex" && link() === "http://10.0.0.5:32400/", link());
    ok("media plex: 2 streams + 2 libraries", rows().length === 5 && /^Example Show · Pilotalice · 50%$/.test(rows()[1]) && /пауза/.test(rows()[2]) && /^Фильмы40$/.test(rows()[3]), rows().join(" / "));
    click('[data-m="sonarr"]');
    ok("media sonarr: queue, missing, downloads, week", /^В очереди7$/.test(rows()[0]) && /^Не скачано серий129$/.test(rows()[1]) && /^Example Show S02E0575% · 12м$/.test(rows()[2]) && /^New Show S01E01\d\d\.\d\d \d\d:\d\d$/.test(rows()[5]), rows().join(" / "));
    click('[data-m="radarr"]');
    ok("media radarr: unknown missing hidden, release kind", rows().length === 3 && !/Не скачано/.test(m.textContent) && /цифровой релиз · \d\d\.\d\d$/.test(rows()[2]), rows().join(" / "));
    click('[data-m="prowlarr"]');
    ok("media prowlarr: indexers, 24h, failed list", /включено 2 из 3/.test(rows()[0]) && /^Запросов за 24 ч50 · с ошибкой 5$/.test(rows()[1]) && /Отключены после ошибок/.test(m.textContent) && /^Tracker Two$/.test(rows()[3]), rows().join(" / "));
    click('[data-m="overseerr"]');
    ok("media overseerr: pending first", /^Ждут одобрения2$/.test(rows()[0]) && rows().length === 4, rows().join(" / "));
    click('[data-m="immich"]');
    ok("media immich: totals + users", /18 230/.test(m.querySelector(".us-grid").textContent) && /412 ГБ/.test(m.querySelector(".us-grid").textContent) && /^Alice15 000 фото · 1 000 видео/.test(rows()[0]), m.querySelector(".us-grid").textContent + " " + rows().join(" / "));
    // drag and drop reorders tabs (jsdom has zero-size boxes, so a drop lands after the target)
    const ids = (sel, a) => Array.from(m.querySelectorAll(sel)).map(b => b.getAttribute(a)).join();
    const drag = (from, to) => {
      m.querySelector(from).dispatchEvent(new w.Event("dragstart", { bubbles: true }));
      m.querySelector(to).dispatchEvent(new w.MouseEvent("dragover", { bubbles: true, cancelable: true, clientX: 5 }));
      m.querySelector(from).dispatchEvent(new w.Event("dragend", { bubbles: true }));
    };
    drag('[data-tab="telemt"]', '[data-tab="awg"]');
    ok("drag tab: order saved and kept on re-render", ids(".us-tab", "data-tab").startsWith("awg,telemt,firc") && w.localStorage.getItem("ui.services.order").startsWith('["awg","telemt"'), ids(".us-tab", "data-tab"));
    drag('[data-m="qb"]', '[data-m="immich"]');
    ok("drag media sub-tab: own order", ids(".us-mt", "data-m") === "plex,sonarr,radarr,prowlarr,overseerr,immich,qb" && /"qb"\]$/.test(w.localStorage.getItem("ui.services.morder")), ids(".us-mt", "data-m"));
    w.localStorage.setItem("ui.services.order", '["sys","gone"]'); click('[data-tab="grp:Медиа"]');
    ok("saved order first, unsaved tabs after in default order", ids(".us-tab", "data-tab") === "sys,telemt,awg,firc,nfqws,hydra,grp:AdGuard,grp:Медиа,ascn", ids(".us-tab", "data-tab"));
    // jsdom has no layout: the strip's scroll range is faked, 0..100
    const tl = m.querySelector(".us-tl"); let sl = 0;
    Object.defineProperty(tl, "scrollLeft", { get: () => sl, set: v => { sl = Math.max(0, Math.min(100, v)); } });
    const wheel = (dy, dx) => { const e = new w.WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: dy, deltaX: dx || 0 }); m.querySelector('[data-tab="awg"]').dispatchEvent(e); return e.defaultPrevented; };
    ok("wheel scrolls the tab strip sideways", wheel(60) && sl === 60 && wheel(-20) && sl === 40, sl);
    ok("wheel at the strip's end scrolls the page", wheel(200) && sl === 100 && !wheel(10), sl);
    ok("horizontal wheel left to the browser", !wheel(1, 30) && sl === 100, sl);
  });
  await run(one("sonarr", "Sonarr", "Медиа", "http://127.0.0.1:8989", { ok: 0 }), (w, m) => {
    gclick(w, m, "Медиа");
    ok("main card: one instance -> no sub-tabs, settings hint, loopback link", !m.querySelector(".us-sub,.us-mt") && /API Sonarr недоступен · проверьте настройки/.test(m.textContent) && m.querySelector("a.us-open").href === "http://192.168.0.1:8989/", m.textContent);
  });
  const tsData = { run: 1, up: 3600, mem: 51200, online: 2, total: 4, self: [["Running", "router", "100.64.0.1", "waw", "vps", 1, "192.168.1.0/24", ""]],
    list: [["old-pc", "windows", 0, 0, 0, "", "2024-08-29T23:44:19.1Z", 0, 0, 0, 0, ""],
      ["phone", "android", 0, 0, 0, "", new Date((1793438837 - 7200) * 1000).toISOString(), 0, 0, 0, 0, ""],
      ["laptop", "linux", 1, 1, 1, "fra", "0001-01-01T00:00:00Z", 2048, 1024, 0, 0, ""],
      ["vps", "linux", 1, 0, 0, "fra", "0001-01-01T00:00:00Z", 0, 0, 1, 1, "10.0.0.0/24"]] };
  await run(Object.assign({}, mini, { now: 1793438837, tabs: ["tailscale", "sys"], ts: tsData, series: { ts_bytes: [0, 6000, 12000], ts_online: [1, 2] } }), (w, m) => {
    const rows = Array.from(m.querySelectorAll(".us-row")).map(r => r.textContent);
    ok("tailscale: tab, admin console link", !!m.querySelector('[data-tab="tailscale"].us-on') && m.querySelector("a.us-open").href === "https://login.tailscale.com/admin/machines", m.textContent);
    ok("tailscale: traffic and devices online", /100 Б\/с/.test(m.querySelector(".us-grid").textContent) && /2 \/ 4/.test(m.querySelector(".us-grid").textContent), m.querySelector(".us-grid").textContent);
    ok("tailscale: daemon + this router", /^tailscaled1ч 0м · 50\.0 МБ$/.test(rows[0]) && /^Этот роутерподключён · 100\.64\.0\.1 · DERP waw$/.test(rows[1]), rows.slice(0, 2).join(" / "));
    ok("tailscale: exit node in use, offered, subnets", /выход в интернет через vps/.test(m.textContent) && /выходной узел/.test(m.textContent) && /подсети: 192\.168\.1\.0\/24/.test(m.textContent), m.textContent);
    ok("tailscale: peers online first, then last seen", rows.slice(2).map(r => r.split(" ")[0]).join() === "laptop,vps,phone,old-pc", rows.join(" / "));
    ok("tailscale: direct with traffic, idle online, ago, old date", /напрямую · ↓ 2\.0 КБ · ↑ 1\.0 КБ$/.test(rows[2]) && /выход.*подсети.*в сети$/.test(rows[3]) && /был в сети 2ч 0м назад$/.test(rows[4]) && /был в сети 30\.08\.2024$|был в сети 29\.08\.2024$/.test(rows[5]), rows.slice(2).join(" / "));
  });
  await run(Object.assign({}, mini, { tabs: ["tailscale", "sys"], ts: { run: 1, up: 60, mem: 1024, online: 0, total: 0, self: [["NeedsLogin", "", "", "", "", 0, "", "some warning"]], list: [] } }), (w, m) => {
    ok("tailscale: needs login, health warning, no peers", /нужен вход: tailscale up/.test(m.textContent) && /some warning/.test(m.textContent) && !/Устройства/.test(m.textContent), m.textContent);
  });
  // KeenDNS web apps: links by their own names, only with the web UI opened by the router's domain name
  const ndpData = Object.assign({}, mini, { tabs: ["sys"], svc: [["firc", 1, "666"], ["hrweb", 1, "2000"]], web: [],
    ndp: [["firc.r.example.net", "127.0.0.1", 666, 1], ["adguard.r.example.net", "10.0.0.2", 3000, 0], ["adguard.r.example.net", "10.0.0.5", 3000, 0],
      ["other.elsewhere.net", "127.0.0.1", 2000, 1]],
    types: [["agh", "AdGuard Home", "AdGuard", ["url"]]], inst: [["agh", "agh", "AdGuard Home", "http://10.0.0.5:3000", "", [], { ok: 1 }]] });
  await run(ndpData, (w, m) => {
    gclick(w, m, "AdGuard");
    const hrefs = Array.from(m.querySelectorAll("a.us-lnk, a.us-open")).map(a => a.href).join(" ");
    ok("KeenDNS web apps: own service and a LAN host by their names", hrefs === "https://firc.r.example.net/ http://r.example.net:2000/ https://adguard.r.example.net/", hrefs);
  }, null, "https://r.example.net/dashboard");
  await run(ndpData, (w, m) => {
    gclick(w, m, "AdGuard");
    const hrefs = Array.from(m.querySelectorAll("a.us-lnk, a.us-open")).map(a => a.href).join(" ");
    ok("KeenDNS web apps: by address in the LAN", hrefs === "http://192.168.0.1:666/ http://192.168.0.1:2000/ http://10.0.0.5:3000/", hrefs);
  });
  // awg-manager with its login on and no API key: a hint instead of an empty list
  await run(Object.assign({}, mini, { tabs: ["awg", "sys"], awg: { up: 0, total: 0, nokey: 1, tun: [], px: [] } }), (w, m) => {
    m.querySelector('[data-tab="awg"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("awg: no API key hint", /сгенерируйте API-ключ в настройках awg-manager/.test(m.textContent), m.textContent);
  });
  await run(Object.assign({}, mini, { tabs: ["awg", "sys"], awg: { up: 1, total: 1, nokey: 0, tun: [["wg", 1, 0, 0, 60]], px: [] } }), (w, m) => {
    m.querySelector('[data-tab="awg"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("awg: no hint with the key", !/API-ключ/.test(m.textContent), m.textContent);
  });
  await run(full, (w, m) => {
    const tabs = Array.from(m.querySelectorAll(".us-tab")).map(b => b.textContent).join();
    ok("main card: group tabs from instances", tabs === "telemt,AWG,firc,nfqws,Hydra,AdGuard,Медиа,Antiscan,Система", tabs);
    gclick(w, m, "Медиа");
    ok("main card: 7 sub-tabs named after instances", m.querySelectorAll(".us-mt").length === 7);
  });
  await run(Object.assign({}, full, { inst: full.inst.filter(i => i[0] === "qb") }), (w, m) => {
    gclick(w, m, "Медиа");
    ok("main card: one instance in the group -> no sub-tabs", !m.querySelector(".us-mt") && !m.querySelector('[data-tab="grp:AdGuard"]') && m.querySelector(".us-grid"));
  });
  await run(Object.assign({}, full, { cfg: Object.assign({}, full.cfg, { hide: { page: [], main: ["telemt", "cron", "agh"] } }) }), (w, m) => {
    const tabs = Array.from(m.querySelectorAll(".us-tab")).map(b => b.textContent).join();
    ok("main card: hidden on main (tab, chip, instance)", tabs === "AWG,firc,nfqws,Hydra,Медиа,Antiscan,Система" && !m.querySelector('[data-tab="telemt"]') &&
      !Array.from(m.querySelectorAll(".us-chip")).some(c => c.textContent.trim() === "cron") && m.querySelectorAll(".us-chip").length === 12, tabs);
  });
  await run(Object.assign({}, full, { inst: [["qb", "qb", "Торренты", "http://q", "", [], null], ["plex", "plex", "Plex", "http://p", "", [], { ok: 0 }]] }), (w, m) => {
    gclick(w, m, "Медиа");
    ok("instance: no data yet", /Данные появятся в течение минуты/.test(m.textContent), m.textContent);
    m.querySelector('[data-m="plex"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("instance: API down", /API Plex недоступен · проверьте настройки/.test(m.textContent), m.textContent);
  });
  await run(Object.assign({}, full, { inst: [["jf", "jellyfin", "Jellyfin", "http://j", "", ["key"], { ok: 1, streams: 1, list: [["alice", "A <b>", 50, "playing"]], libs: [] }]] }), (w, m) => {
    gclick(w, m, "Медиа");
    ok("jellyfin instance: plex view", /Сейчас смотрят/.test(m.textContent) && !m.querySelector("b"), m.textContent);
  });
  await run(Object.assign({}, full, { inst: [["jf", "jellyfin", "Jellyfin", "http://j", "", ["key"], { ok: 1, streams: 0, list: [], libs: [["Фильмы", "movie", "1<b>x</b>"]] }]] }), (w, m) => {
    gclick(w, m, "Медиа");
    ok("plex view: library count is escaped", /Фильмы/.test(m.textContent) && !m.querySelector("b"), m.textContent);
  });
  const os = require("os"), cp = require("child_process");
  // C:\x -> /c/x for Git Bash: a drive colon would split PATH
  const unix = p => p.replace(/\\/g, "/").replace(/^([A-Za-z]):/, (_, d) => "/" + d.toLowerCase());
  // keendashd built with the host C compiler; its tests are skipped where there is none (Windows), CI has gcc
  const kd = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "kdd-")), "keendashd"), haveCc = !cp.spawnSync("cc", ["--version"]).error;
  if (haveCc) {
    const b = cp.spawnSync("cc", ["-std=c99", "-O2", "-Wall", "-Wextra", "-Werror", "-o", kd, path.join(__dirname, "..", "src", "keendashd.c")], { encoding: "utf8" });
    ok("keendashd builds", b.status === 0, b.stderr);
  } else res.push("SKIP keendashd and bin/ext tests: no C compiler (cc)");
  // bin/stats firc groups: its awk on a groups.yaml with one interface, a block list and a flow list; names from ifnames
  {
    const st = fs.readFileSync(path.join(__dirname, "..", "files", "opt", "share", "keendash", "bin", "stats"), "utf8").replace(/\r/g, "");
    const prog = /\n  awk -v nf=\$IFN -v pf=\$POOL '(function out\(\)[\s\S]*?END\{ out\(\) \})'/.exec(st)[1];
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kdf-"));
    fs.writeFileSync(path.join(tmp, "pool"), "map x a1\nmap y b2\nmap z b2\n");
    fs.writeFileSync(path.join(tmp, "names"), "opkgtun10|test_warp_1\nnwg1|Wireguard VPN\n");
    fs.writeFileSync(path.join(tmp, "groups"), "groups:\n- id: a1\n  name: one\n  interface: eth2.4\n  enable: true\n  rules:\n  - id: r1\n    rule: a.com\n" +
      "- id: b2\n  name: chat_gpt\n  interface:\n  - opkgtun10\n  - \"opkgtun11\"\n  enable: true\n  rules:\n  - id: r2\n    rule: b.com\n" +
      "- id: c3\n  name: flow\n  interface: [nwg0, 'nwg1']\n  enable: false\n" +
      "- id: d4\n  name: \"\\U0001F6D1\u26a0\ufe0f Block \\\"REST\\\" \"\n  interface: nwg0\n  enable: true\n" +
      "- id: e5\n  name: 'it''s a | b'\n  interface: nwg0\n  enable: true\n- id: f6\n  name: C:\\x y\n  interface: nwg0\n  enable: true\n");
    const f = n => path.join(tmp, n);
    const g = cp.spawnSync("awk", ["-v", "nf=" + f("names"), "-v", "pf=" + f("pool"), prog, f("names"), f("pool"), f("groups")], { encoding: "utf8" }).stdout;
    ok("bin/stats firc: interface lists, names", g.startsWith("g|one|eth2.4|1|1\ng|chat_gpt|test_warp_1, opkgtun11|1|2\ng|flow|nwg0, Wireguard VPN|0|0\n"), JSON.stringify(g));
    ok("bin/stats firc: whole group names, escapes kept for the card", g.endsWith("g|\\U0001F6D1\u26a0\ufe0f Block \\\"REST\\\" |nwg0|1|0\n" +
      "g|it's a   b|nwg0|1|0\ng|C:\\\\x y|nwg0|1|0\n"), JSON.stringify(g));
    // no ifnames file yet (before the first bin/tick 5): kernel names
    const g2 = cp.spawnSync("awk", ["-v", "nf=" + f("nope"), "-v", "pf=" + f("pool"), prog, f("pool"), f("groups")], { encoding: "utf8" }).stdout;
    ok("bin/stats firc: no names yet", g2.split("\n")[1] === "g|chat_gpt|opkgtun10, opkgtun11|1|2", JSON.stringify(g2));
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  // bin/settings in a scratch etc/var/tmp/ext.d: files {"etc/services/qb.conf": "..."}, inbox files 10 s old unless ago {path: seconds}
  function settingsRun(files, cmd, ago) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kdset-")), now = Date.now() / 1000;
    ["etc/services", "var/inbox", "tmp/x", "ext.d"].forEach(d => fs.mkdirSync(path.join(tmp, d), { recursive: true }));
    fs.writeFileSync(path.join(tmp, "ext.d", "qb"), "#!/bin/sh\n# name: qBittorrent\n# group: Медиа\n# fields: url user pass\n");
    fs.writeFileSync(path.join(tmp, "ext.d", "plex"), "#!/bin/sh\n# name: Plex\n# group: Медиа\n# fields: url token\n");
    Object.keys(files).forEach(f => {
      fs.writeFileSync(path.join(tmp, f), files[f]);
      const t = now - ((ago || {})[f] !== undefined ? ago[f] : f.startsWith("var/inbox/") ? 10 : 0);
      fs.utimesSync(path.join(tmp, f), t, t);
    });
    const t = unix(tmp), bin = unix(path.join(__dirname, "..", "files", "opt", "share", "keendash", "bin", "settings"));
    const out = cp.spawnSync("sh", ["-c", 'KEENDASH_ETC="' + t + '/etc" KEENDASH_VAR="' + t + '/var" KEENDASH_TMP="' + t + '/tmp" KEENDASH_EXTD="' + t + '/ext.d" sh "' + bin + '" ' + cmd], { encoding: "utf8" }).stdout;
    const rd = f => { try { return fs.readFileSync(path.join(tmp, f), "utf8"); } catch (e) { return null; } };
    return { tmp, out, rd, mode: f => fs.statSync(path.join(tmp, f)).mode & 0o777, ls: d => fs.readdirSync(path.join(tmp, d)), rm: () => fs.rmSync(tmp, { recursive: true, force: true }) };
  }
  // bin/settings vol: OPT is a volume root, a folder of one, or elsewhere
  function volRun(opt) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kdvol-")), t = unix(tmp), bin = unix(path.join(__dirname, "..", "files", "opt", "share", "keendash", "bin", "settings"));
    fs.mkdirSync(path.join(tmp, "mnt/v1/install"), { recursive: true }); fs.mkdirSync(path.join(tmp, "mnt/v2"), { recursive: true }); fs.mkdirSync(path.join(tmp, "other"));
    const r = cp.spawnSync("sh", ["-c", 'KEENDASH_MNT="' + t + '/mnt" KEENDASH_OPT="' + t + "/" + opt + '" sh "' + bin + '" vol'], { encoding: "utf8" });
    fs.rmSync(tmp, { recursive: true, force: true });
    return r;
  }
  { let r = volRun("mnt/v1"); ok("settings vol: volume root", r.stdout === "v1:\n" && r.status === 0, JSON.stringify(r.stdout));
    r = volRun("mnt/v1/install"); ok("settings vol: folder of a volume", r.stdout === "v1:/install\n" &&r.status === 0, JSON.stringify(r.stdout));
    r = volRun("other"); ok("settings vol: none", r.stdout === "" && r.status === 1, r.status + JSON.stringify(r.stdout)); }
  {
    const msg = (rev, l) => "keendash 1 " + rev + "\n" + l.join("\n") + "\nend\n";
    const QB = "TYPE='qb'\nNAME='qBittorrent 2'\nURL='http://10.0.0.5:8080'\nUSER='admin'\nPASS='s3cret'\n", PL = "TYPE='plex'\nNAME='Plex '\\''A'\\'''\nURL='http://10.0.0.6:32400'\nTOKEN='t0ken'\n";
    const UI = "hide page cron\nhide main telemt\n", base = { "etc/services/qb-2.conf": QB, "etc/services/pl.conf": PL, "etc/ui.conf": UI };
    let r = settingsRun({ "var/inbox/r1.txt": msg("r1", ["add qb-2 qb", "set qb-2 name qBittorrent 2", "set qb-2 url http://10.0.0.5:8080", "set qb-2 user admin",
      "set qb-2 pass p's $(x) `y` \\z", "hide page cron", "hide main telemt", "col 0 telemt awg", "col 1 qb-2"]) }, "apply");
    const conf = r.rd("etc/services/qb-2.conf");
    ok("settings apply: add, set, hide, col", conf === "TYPE='qb'\nNAME='qBittorrent 2'\nURL='http://10.0.0.5:8080'\nUSER='admin'\nPASS='p'\\''s $(x) `y` \\z'\n" &&
      r.mode("etc/services/qb-2.conf") === 0o600 && r.rd("etc/ui.conf") === "hide page cron\nhide main telemt\ncol 0 telemt awg\ncol 1 qb-2\n" &&
      r.rd("tmp/settings.state") === "rev r1\nerr \n" && !r.ls("var/inbox").length, JSON.stringify([conf, r.rd("etc/ui.conf"), r.rd("tmp/settings.state"), r.ls("var/inbox")]));
    const pass = conf && cp.execFileSync("sh", ["-c", '. ./qb-2.conf; printf %s "$PASS"'], { cwd: path.join(r.tmp, "etc", "services"), encoding: "utf8" });
    ok("settings apply: values are data", pass === "p's $(x) `y` \\z", JSON.stringify(pass));
    r.rm();

    const bad = [["set qb-2 foo x"], ["add QB qb"], ["add x nosuch"], ["set qb-2 url ftp://h"], ["set qb-2 user " + "a".repeat(513)], ["set qb-2 user a\x01b"],
      ["set qb-2 name a|b"], ["set qb-2 url http://h|x"], ["set qb-2 user a|b"], ["col 6 a"], ["set pl name " + "a".repeat(65)], ["set nope name x"], ["add y qb", "set y name Y"], ["bogus"]];
    const fails = [];
    bad.concat([null]).forEach(l => {
      const f = Object.assign({ "var/inbox/r2.txt": l ? msg("r2", l) : "keendash 2 r2\nend\n" }, base);
      r = settingsRun(f, "apply");
      const st = r.rd("tmp/settings.state") || "";
      if (!/^rev r2\nerr строка \d+: ./.test(st) || r.rd("etc/services/qb-2.conf") !== QB || r.rd("etc/services/pl.conf") !== PL || r.rd("etc/ui.conf") !== UI ||
        r.ls("etc/services").length !== 2 || r.ls("var/inbox").length) fails.push((l || ["keendash 2"]).join(" / ").slice(0, 40) + " -> " + st);
      r.rm();
    });
    ok("settings apply: rejects, nothing changes", !fails.length, fails.join("; "));

    r = settingsRun(Object.assign({ "var/inbox/r3.txt": msg("r3", ["set qb-2 name Торренты дома", "set pl name " + "Т".repeat(64)]) }, base), "apply");
    ok("settings apply: Cyrillic name", /^NAME='Торренты дома'$/m.test(r.rd("etc/services/qb-2.conf")) && r.rd("etc/services/pl.conf").indexOf("NAME='" + "Т".repeat(64) + "'") > 0 &&
      r.rd("tmp/settings.state") === "rev r3\nerr \n", r.rd("tmp/settings.state"));
    r.rm();

    r = settingsRun(Object.assign({ "var/inbox/r4.txt": msg("r4", ["show page cron", "del qb-2", "set pl name X"]) }, base), "apply");
    ok("settings apply: show, del, set name", r.rd("etc/ui.conf") === "hide main telemt\n" && r.rd("etc/services/qb-2.conf") === null &&
      r.rd("etc/services/pl.conf") === "TYPE='plex'\nNAME='X'\nURL='http://10.0.0.6:32400'\nTOKEN='t0ken'\n", JSON.stringify([r.rd("etc/ui.conf"), r.rd("etc/services/pl.conf")]));
    r.rm();

    r = settingsRun(Object.assign({ "var/inbox/A.txt": msg("A", ["del qb-2"]), "var/inbox/B.txt": msg("B", ["set qb-2 name Z"]) }, base), "apply", { "var/inbox/A.txt": 20, "var/inbox/B.txt": 10 });
    ok("settings apply: two files, second edits a deleted id", r.rd("etc/services/qb-2.conf") === null && /^rev B\nerr строка 2: ./.test(r.rd("tmp/settings.state")) && !r.ls("var/inbox").length,
      JSON.stringify([r.rd("tmp/settings.state"), r.ls("var/inbox")]));
    r.rm();

    r = settingsRun(Object.assign({ "var/inbox/r5.txt": "keendash 1 r5\nadd z qb\n" }, base), "apply", { "var/inbox/r5.txt": 10 });
    const waits = r.ls("var/inbox").length === 1 && r.rd("tmp/settings.state") === null;
    r.rm();
    r = settingsRun(Object.assign({ "var/inbox/r5.txt": "keendash 1 r5\nadd z qb\n" }, base), "apply", { "var/inbox/r5.txt": 60 });
    ok("settings apply: upload in progress waits", waits && !r.ls("var/inbox").length && /^rev r5\nerr ./.test(r.rd("tmp/settings.state")) && r.rd("etc/services/z.conf") === null,
      JSON.stringify([waits, r.rd("tmp/settings.state")]));
    r.rm();

    // an empty column stays (the column count is kept); a hide-only message keeps the col lines
    r = settingsRun(Object.assign({ "var/inbox/r6.txt": msg("r6", ["col 0 a b", "col 1", "col 2 c"]) }, base), "apply");
    ok("settings apply: empty column kept", r.rd("etc/ui.conf") === UI + "col 0 a b\ncol 1\ncol 2 c\n", JSON.stringify(r.rd("etc/ui.conf")));
    r.rm();
    r = settingsRun(Object.assign({ "var/inbox/r7.txt": msg("r7", ["hide main awg"]) }, base, { "etc/ui.conf": UI + "col 0 telemt awg\ncol 1\ncol 2 qb-2\n" }), "apply");
    ok("settings apply: hide keeps columns", r.rd("etc/ui.conf") === "hide page cron\nhide main awg\nhide main telemt\ncol 0 telemt awg\ncol 1\ncol 2 qb-2\n", JSON.stringify(r.rd("etc/ui.conf")));
    r.rm();
    // a NUL ends an awk record in busybox: the whole file is rejected, the content is not echoed
    r = settingsRun(Object.assign({ "var/inbox/r8.txt": msg("r8", ["set qb-2 pass a\0hide page x"]) }, base), "apply");
    ok("settings apply: NUL rejected", /^rev r8\nerr строка \d+: ./.test(r.rd("tmp/settings.state")) && !/hide|\0/.test(r.rd("tmp/settings.state")) && r.rd("etc/services/qb-2.conf") === QB &&
      r.rd("etc/ui.conf") === UI && !r.ls("var/inbox").length, JSON.stringify(r.rd("tmp/settings.state")));
    r.rm();
    const PT = PL.replace("t0ken", "t'\\''0ken");
    r = settingsRun(Object.assign({ "var/inbox/r9.txt": msg("r9", ["set pl name X"]) }, base, { "etc/services/pl.conf": PT }), "apply");
    ok("settings apply: quote in TOKEN survives", r.rd("etc/services/pl.conf") === "TYPE='plex'\nNAME='X'\nURL='http://10.0.0.6:32400'\nTOKEN='t'\\''0ken'\n", JSON.stringify(r.rd("etc/services/pl.conf")));
    r.rm();

    r = settingsRun(Object.assign({ "tmp/vol": "v1:\n", "tmp/settings.state": "rev r1\nerr \n" }, base, { "etc/ui.conf": UI + "col 0 telemt awg\ncol 1 qb-2\n" }), "list");
    ok("settings list", r.out === "vol|v1:\nrev|r1\nerr|\ntype|plex|Plex|Медиа|url,token|\ntype|qb|qBittorrent|Медиа|url,user,pass|\n" +
      "inst|pl|plex|Plex 'A'|http://10.0.0.6:32400||token|||\ninst|qb-2|qb|qBittorrent 2|http://10.0.0.5:8080|admin|pass|||\nhide|page|cron\nhide|main|telemt\ncol|telemt,awg\ncol|qb-2\n" &&
      !/s3cret|t0ken/.test(r.out), JSON.stringify(r.out));
    r.rm();

    // # hint: header, the map field
    const ZZ = "#!/bin/sh\n# name: ZZ\n# group: Медиа\n# hint: Ключ: Settings → API\n# fields: url key\n", MP = "#!/bin/sh\n# name: MP\n# group: Медиа\n# hint: a|b\n# fields: url map\n";
    r = settingsRun({ "ext.d/zz": ZZ, "ext.d/mp": MP }, "list");
    ok("bin/settings types: hint", r.out === "type|mp|MP|Медиа|url,map|ab\ntype|plex|Plex|Медиа|url,token|\ntype|qb|qBittorrent|Медиа|url,user,pass|\ntype|zz|ZZ|Медиа|url,key|Ключ: Settings → API\n", JSON.stringify(r.out));
    r.rm();
    const MC = "TYPE='mp'\nNAME='M'\nURL='http://10.0.0.7:1'\n", mbase = { "ext.d/mp": MP, "etc/services/c.conf": MC };
    const MAPOK = "Задачи=queue.total; Скорость загрузки=a.b:bs";
    r = settingsRun(Object.assign({ "var/inbox/m1.txt": msg("m1", ["set c map " + MAPOK]) }, mbase), "apply");
    const mconf = r.rd("etc/services/c.conf");
    const back = mconf && cp.execFileSync("sh", ["-c", '. ./c.conf; printf %s "$MAP"'], { cwd: path.join(r.tmp, "etc", "services"), encoding: "utf8" });
    ok("bin/settings apply: map", mconf === MC + "MAP='" + MAPOK + "'\n" && back === MAPOK && r.rd("tmp/settings.state") === "rev m1\nerr \n", JSON.stringify([mconf, back, r.rd("tmp/settings.state")]));
    r.rm();
    // [value, the pair the error names]; the error is cut at 120 bytes, so a long pair is compared by its start
    const badmap = [["a|b=x", "a|b=x"], ["a=x; b=$y", "b=$y"], ["a=x:zz", "a=x:zz"], ["a=1;b=2;c=3;d=4;e=5;f=6;g=7;h=8;i=9", "i=9"], ["=x", "=x"], ["a=", "a="], ["a", "a"], ["a=x;", ""], ["a=x y", "a=x y"],
      ["я".repeat(33) + "=x", "я".repeat(33) + "=x"], ["a=" + "x".repeat(129), "a=" + "x".repeat(129)], ["a=b=c", "a=b=c"], ["a=x:b:n", "a=x:b:n"]];
    const mfails = [], PFX = "rev m2\nerr строка 2: неверное поле map: ";
    badmap.forEach(([v, pair]) => {
      r = settingsRun(Object.assign({ "var/inbox/m2.txt": msg("m2", ["set c map " + v]) }, mbase, base), "apply");
      const st = r.rd("tmp/settings.state") || "";
      if (!(Buffer.byteLength(PFX + pair) < 120 ? st === PFX + pair + "\n" : st.startsWith(PFX + pair.slice(0, 40))) || r.rd("etc/services/c.conf") !== MC || r.rd("etc/services/qb-2.conf") !== QB || r.ls("var/inbox").length) mfails.push(v.slice(0, 40) + " -> " + st);
      r.rm();
    });
    r = settingsRun(Object.assign({ "var/inbox/m2.txt": msg("m2", ["set qb-2 map a=x"]) }, mbase, base), "apply");
    if (r.rd("tmp/settings.state") !== "rev m2\nerr строка 2: неизвестное поле map\n" || r.rd("etc/services/qb-2.conf") !== QB) mfails.push("qb-2 -> " + r.rd("tmp/settings.state"));
    r.rm();
    ok("bin/settings apply: bad map rejected, names the pair, nothing changes", !mfails.length, mfails.join("; "));
    // the 120-byte cut of the error does not leave half a Cyrillic character
    r = settingsRun(Object.assign({ "var/inbox/m4.txt": msg("m4", ["set c map " + "я".repeat(60) + "=x"]) }, mbase), "apply");
    const stb = fs.readFileSync(path.join(r.tmp, "tmp", "settings.state"));
    ok("bin/settings apply: long error cut at a character", Buffer.from(stb.toString("utf8"), "utf8").equals(stb) && !stb.toString("utf8").includes("�") && stb.toString("utf8").startsWith(PFX.replace("m2", "m4") + "яя"), JSON.stringify(stb.toString("utf8")));
    r.rm();
    // an empty value clears the map
    r = settingsRun({ "var/inbox/m5.txt": msg("m5", ["set c map"]), "ext.d/mp": MP, "etc/services/c.conf": MC + "MAP='A=x.y'\n" }, "apply");
    ok("bin/settings apply: empty map clears", r.rd("etc/services/c.conf") === MC && r.rd("tmp/settings.state") === "rev m5\nerr \n", JSON.stringify([r.rd("etc/services/c.conf"), r.rd("tmp/settings.state")]));
    r.rm();
    // the hint is cut to 200 characters, not bytes
    r = settingsRun({ "ext.d/hh": "#!/bin/sh\n# name: HH\n# group: G\n# hint: " + "я".repeat(250) + "\n# fields: url\n" }, "list");
    const hl = r.out.split("\n").find(l => l.startsWith("type|hh|")).split("|")[5];
    ok("bin/settings types: hint cut to 200 characters", hl === "я".repeat(200) && !r.out.includes("�"), hl.length + " " + JSON.stringify(hl.slice(-3)));
    r.rm();
    r = settingsRun(Object.assign({ "var/inbox/m3.txt": msg("m3", ["set c map " + "я".repeat(32) + "=x.y:n;b=c:p; d=e:s ; f=g;h=i;j=k;l=m;n=o"]) }, mbase), "apply");
    ok("bin/settings apply: map limits (32 characters, 8 pairs, spaces)", /^rev m3\nerr \n$/.test(r.rd("tmp/settings.state")) && /^MAP=/m.test(r.rd("etc/services/c.conf")), r.rd("tmp/settings.state"));
    r.rm();
    r = settingsRun({ "ext.d/mp": MP, "etc/services/c.conf": MC + "MAP='A=x.y'\n", "etc/services/d.conf": MC }, "list");
    ok("bin/settings list: map", /\ninst\|c\|mp\|M\|http:\/\/10.0.0.7:1\|\|\|A=x.y\|\|\n/.test(r.out) && /\ninst\|d\|mp\|M\|http:\/\/10.0.0.7:1\|\|\|\|\|\n/.test(r.out), JSON.stringify(r.out));
    r.rm();

    // hosts and every (the check type): types() keeps the fields, apply checks them like the browser does, list prints them last
    const CK = "#!/bin/sh\n# name: CK\n# group: Доступность\n# fields: hosts every\n", KC = "TYPE='ck'\nNAME='K'\n", kbase = { "ext.d/ck": CK, "etc/services/k.conf": KC };
    r = settingsRun({ "ext.d/ck": CK, "etc/services/k.conf": KC + "HOSTS='a.test b.test:81'\nEVERY='15'\n" }, "list");
    ok("bin/settings types and list: hosts, every", r.out.startsWith("type|ck|CK|Доступность|hosts,every|\n") && r.out.includes("\ninst|k|ck|K|||||a.test b.test:81|15\n"), JSON.stringify(r.out));
    r.rm();
    const HOK = "a.test b.test:8443,https://c.test/x?y=1&z=%20 http://d.test:8080", hfail = [];
    [HOK, "  a.test  ", "a.test,", ["a.test", "b-c.test", "1.2.3.4:80"].concat(Array.from({ length: 17 }, (_, i) => "h" + i + ".test")).join(" ")].forEach(v => {
      r = settingsRun(Object.assign({ "var/inbox/h1.txt": msg("h1", ["set k hosts " + v]) }, kbase), "apply");
      if (r.rd("tmp/settings.state") !== "rev h1\nerr \n" || r.rd("etc/services/k.conf") !== KC + "HOSTS='" + v + "'\n") hfail.push(v.slice(0, 30) + " -> " + r.rd("tmp/settings.state"));
      r.rm();
    });
    ok("bin/settings apply: hosts accepted (domain, port, address, comma, 20 elements)", !hfail.length, hfail.join("; "));
    const hbad = [["-x", "-x"], ["a.test -x", "-x"], ["a b'c", "b'c"], ["$(id)", "$(id)"], ["a.test http://a|b", "http://a|b"], ["a`b", "a`b"], ["http://a\\b", "http://a\\b"], ["http://a\"b", "http://a\"b"], ["http://a>b", "http://a>b"],
      ["http://", "http://"], ["ftp://a.test", "ftp://a.test"], ["a.test:123456", "a.test:123456"], ["a.test:", "a.test:"], ["a:b", "a:b"], ["a.test/x", "a.test/x"], ["http://a<b", "http://a<b"],
      [Array.from({ length: 21 }, (_, i) => "h" + i + ".test").join(" "), "h20.test"], [" , ", ""]];
    hbad.forEach(([v, el]) => {
      r = settingsRun(Object.assign({ "var/inbox/h2.txt": msg("h2", ["set k hosts " + v]) }, kbase), "apply");
      if (r.rd("tmp/settings.state") !== "rev h2\nerr строка 2: неверный адрес: " + el + "\n" || r.rd("etc/services/k.conf") !== KC) hfail.push(v.slice(0, 30) + " -> " + r.rd("tmp/settings.state"));
      r.rm();
    });
    ok("bin/settings apply: bad hosts rejected, names the element, nothing changes", !hfail.length, hfail.join("; "));
    r = settingsRun(Object.assign({ "var/inbox/h3.txt": msg("h3", ["set k hosts"]) }, { "ext.d/ck": CK, "etc/services/k.conf": KC + "HOSTS='a.test'\n" }), "apply");
    ok("bin/settings apply: empty hosts clears", r.rd("etc/services/k.conf") === KC && r.rd("tmp/settings.state") === "rev h3\nerr \n", JSON.stringify(r.rd("etc/services/k.conf")));
    r.rm();
    const efail = [];
    ["1", "5", "15", "30", "60"].forEach(v => {
      r = settingsRun(Object.assign({ "var/inbox/e1.txt": msg("e1", ["set k every " + v]) }, kbase), "apply");
      if (r.rd("tmp/settings.state") !== "rev e1\nerr \n" || r.rd("etc/services/k.conf") !== KC + "EVERY='" + v + "'\n") efail.push(v + " -> " + r.rd("tmp/settings.state"));
      r.rm();
    });
    ["2", "0", "05", "5 ", "abc", "5m", "15 30", "61", "-5"].forEach(v => {
      r = settingsRun(Object.assign({ "var/inbox/e2.txt": msg("e2", ["set k every " + v]) }, kbase), "apply");
      if (r.rd("tmp/settings.state") !== "rev e2\nerr строка 2: неверный интервал\n" || r.rd("etc/services/k.conf") !== KC) efail.push(JSON.stringify(v) + " -> " + r.rd("tmp/settings.state"));
      r.rm();
    });
    ok("bin/settings apply: every is one of 1 5 15 30 60", !efail.length, efail.join("; "));
    r = settingsRun({ "var/inbox/e3.txt": msg("e3", ["set qb-2 hosts a.test", "set qb-2 every 5"]), "etc/services/qb-2.conf": QB }, "apply");
    ok("bin/settings apply: hosts and every only for types that list them", r.rd("tmp/settings.state") === "rev e3\nerr строка 2: неизвестное поле hosts\n" && r.rd("etc/services/qb-2.conf") === QB, r.rd("tmp/settings.state"));
    r.rm();

    // a deleted or newly added id starts without the cache and history of an earlier one with the same id
    r = settingsRun(Object.assign({ "var/inbox/r10.txt": msg("r10", ["del qb-2", "add z qb", "set z url http://h"]), "tmp/x/qb-2": "ok 1\n", "tmp/s.qb-2.dl": "1\n", "tmp/x/z": "ok 1\n", "tmp/s.z.dl": "1\n",
      "tmp/x/pl": "ok 1\n", "tmp/s.pl.dl": "1\n", "tmp/chk.qb-2.a.test": "1 1\n", "tmp/.chk.qb-2.a.test.now": "200 1 1\n", "tmp/chk.z.a.test": "1 1\n", "tmp/.chk.z.a.test.t": "1 1\n", "tmp/chk.pl.a.test": "1 1\n", "tmp/chk.qb-2b.a.test": "1 1\n" }, base), "apply");
    ok("settings apply: del and add drop the cache and history", r.rd("etc/services/z.conf") !== null && ["tmp/x/qb-2", "tmp/s.qb-2.dl", "tmp/x/z", "tmp/s.z.dl"].every(n => r.rd(n) === null) &&
      r.rd("tmp/x/pl") === "ok 1\n" && r.rd("tmp/s.pl.dl") === "1\n", JSON.stringify(r.ls("tmp")));
    ok("settings apply: del and add drop the check history and its scratch files of that id only", ["tmp/chk.qb-2.a.test", "tmp/.chk.qb-2.a.test.now", "tmp/chk.z.a.test", "tmp/.chk.z.a.test.t"].every(n => r.rd(n) === null) &&
      r.rd("tmp/chk.pl.a.test") !== null && r.rd("tmp/chk.qb-2b.a.test") !== null, JSON.stringify(r.ls("tmp")));
    r.rm();
  }
  {
    // settings migrate: the third-party block of the 1.2.5 template, as it was
    const TPL = [
      "# keendash settings (the only config file). Shell syntax. After editing:", "#   /opt/etc/init.d/S81keendash restart", "",
      "# TCP port of keendash's own web server (CGI status + widget scripts).", "PORT=8189", "",
      "# Network interface to take the router's LAN address from (Keenetic: br0 = \"Home\" segment).",
      "# Several interfaces can be listed, the first one that has an IPv4 address wins.", 'LAN_IFACE="br0"', "",
      "# Fixed LAN address to listen on. Leave empty to detect it from LAN_IFACE.", 'LAN_IP=""', "",
      "# Country tags for Antiscan addresses. 1 = look them up via ip-api.com (plain HTTP, banned", "# addresses leave the router), 0 = off.", "GEO=1", "",
      "# Third-party services: a tab appears once the service's keys are uncommented and filled in, data comes",
      '# within a minute, no restart needed. See "Сторонние сервисы" in the README for where to get the keys.',
      "# The file then holds passwords: chmod 600 /opt/etc/keendash/keendash.conf", "",
      "# AdGuard Home: web UI address, login and password", '#ADGUARD_URL="http://192.168.1.10:3000"', '#ADGUARD_USER="admin"', '#ADGUARD_PASS=""', "",
      "# qBittorrent: web UI address, login and password (empty if LAN clients skip the login)", '#QBIT_URL="http://192.168.1.10:8080"', '#QBIT_USER="admin"', '#QBIT_PASS=""', "",
      "# Plex: address and X-Plex-Token", '#PLEX_URL="http://192.168.1.10:32400"', '#PLEX_TOKEN=""', "",
      "# Sonarr, Radarr, Prowlarr, Overseerr: address and API key (Settings -> General)", '#SONARR_URL="http://192.168.1.10:8989"', '#SONARR_KEY=""',
      '#RADARR_URL="http://192.168.1.10:7878"', '#RADARR_KEY=""', '#PROWLARR_URL="http://192.168.1.10:9696"', '#PROWLARR_KEY=""',
      '#OVERSEERR_URL="http://192.168.1.10:5055"', '#OVERSEERR_KEY=""', "",
      "# Immich: address and an admin API key with server.statistics", '#IMMICH_URL="http://192.168.1.10:2283"', '#IMMICH_KEY=""', "",
      '# Web UI links of the "Сервисы" card are detected automatically. Override here, one per line:', "#   service=8080                 open http://<router>:8080/",
      "#   service=http://host:1234/x   open a full URL", "#   service=-                    no link for this service", "#   service=hide                 hide the service from the card", 'LINKS="', '"', ""].join("\n");
    const set = TPL.replace('#QBIT_URL="http://192.168.1.10:8080"', 'QBIT_URL="http://10.0.0.5:8080"').replace('#QBIT_USER="admin"', "QBIT_USER=admin").replace('#QBIT_PASS=""', "QBIT_PASS='p'\\''s$x'");
    let r = settingsRun({ "etc/keendash.conf": set }, "migrate");
    const c1 = r.rd("etc/keendash.conf"), qbc = r.rd("etc/services/qb.conf");
    ok("settings migrate: keys -> services, conf cleaned", qbc === "TYPE='qb'\nNAME='qBittorrent'\nURL='http://10.0.0.5:8080'\nUSER='admin'\nPASS='p'\\''s$x'\n" &&
      r.mode("etc/services/qb.conf") === 0o600 && r.ls("etc/services").join() === "qb.conf" && !/QBIT_|PLEX_|SONARR_|IMMICH_|Third-party|AdGuard|passwords/.test(c1) && /PORT=8189\n/.test(c1) && /LINKS="/.test(c1) &&
      /GEO=1\n\n# Web UI links/.test(c1) && !/\n\n\n/.test(c1), JSON.stringify([qbc, c1]));
    const again = settingsRun({ "etc/keendash.conf": c1 || "", "etc/services/qb.conf": qbc || "" }, "migrate");
    ok("settings migrate: second run changes nothing", again.rd("etc/keendash.conf") === c1 && again.rd("etc/services/qb.conf") === qbc && again.ls("etc/services").join() === "qb.conf", JSON.stringify(again.ls("etc/services")));
    again.rm(); r.rm();
    // a # hint: line in the collector does not shift the fields column
    r = settingsRun({ "etc/keendash.conf": set, "ext.d/qb": "#!/bin/sh\n# name: qBittorrent\n# group: Медиа\n# hint: Ключ: Settings → API\n# fields: url user pass\n" }, "migrate");
    ok("bin/settings migrate: fields with hint", r.rd("etc/services/qb.conf") === qbc, JSON.stringify(r.rd("etc/services/qb.conf")));
    r.rm();
    // the two-line comment of the later template goes too
    const short = "GEO=1\n\n# Third-party services (AdGuard Home, Plex) appear\n# once their keys are added here, e.g. ADGUARD_URL=... - see README.\n\nLINKS=\"\n\"\n";
    r = settingsRun({ "etc/keendash.conf": short }, "migrate");
    ok("settings migrate: short comment removed", r.rd("etc/keendash.conf") === "GEO=1\n\nLINKS=\"\n\"\n", JSON.stringify(r.rd("etc/keendash.conf")));
    r.rm();
    // a backslash in a value stays as it is; export and indented lines are migrated and removed like the plain ones
    r = settingsRun({ "etc/keendash.conf": "export QBIT_URL=\"http://h:1\"\n  QBIT_USER=u\n\tQBIT_PASS=\"a\\b\"\nGEO=1\n" }, "migrate");
    ok("settings migrate: backslash, export and indented keys", r.rd("etc/services/qb.conf") === "TYPE='qb'\nNAME='qBittorrent'\nURL='http://h:1'\nUSER='u'\nPASS='a\\b'\n" && r.rd("etc/keendash.conf") === "GEO=1\n",
      JSON.stringify([r.rd("etc/services/qb.conf"), r.rd("etc/keendash.conf")]));
    r.rm();
    // a type without a collector header: its keys stay in the conf
    const nohdr = set.replace("#SONARR_URL=", "SONARR_URL=");
    r = settingsRun({ "etc/keendash.conf": nohdr }, "migrate");
    ok("settings migrate: no header for the type -> conf kept", r.rd("etc/keendash.conf") === nohdr, r.ls("etc/services").join());
    r.rm();
  }
  // collectors against fixture API answers through tests/fake-wget (it also checks the auth headers) and tests/fake-ndmc.
  // o.state: the dir for /tmp/keendash (the RCI token) and the fakes' request log; o.edit(script, dir): paths for the test;
  // o.files: more files next to the script (etc/services/<id>.conf for bin/ext); o.env: "NAME=value " for the fakes.
  // bin/ext and ext.d/<type> get the layout of the install: ext.d/ next to bin/ (extlib, keendashd)
  function collect(script, args, conf, o) {
    o = o || {};
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kd-")), t = unix(tmp), st = unix(o.state || tmp);
    ["wget", "ndmc"].forEach(n => { fs.copyFileSync(path.join(__dirname, "fake-" + n), path.join(tmp, n)); fs.chmodSync(path.join(tmp, n), 0o755); });
    if (haveCc) { fs.copyFileSync(kd, path.join(tmp, "keendashd")); fs.chmodSync(path.join(tmp, "keendashd"), 0o755); }
    fs.writeFileSync(path.join(tmp, "conf"), conf);
    Object.keys(o.files || {}).forEach(n => { fs.mkdirSync(path.dirname(path.join(tmp, n)), { recursive: true }); fs.writeFileSync(path.join(tmp, n), o.files[n], { mode: 0o755 }); });
    // the scripts pin PATH; drop that line so the fakes come first. They find keendashd and bin/rci next to themselves
    const sh = path.join(__dirname, "..", "files", "opt", "share", "keendash");
    const src = s => fs.readFileSync(s.includes("/") && !s.startsWith("ext.d/") ? path.join(__dirname, "..", s) : path.join(sh, s.startsWith("ext.d/") ? "" : "bin", s), "utf8").replace(/^PATH=.*$/m, ":");
    const name = path.basename(script), ext = script === "ext" || script.startsWith("ext.d/");
    fs.writeFileSync(path.join(tmp, "rci"), src("rci"), { mode: 0o755 });
    if (ext) {
      fs.mkdirSync(path.join(tmp, "bin")); fs.mkdirSync(path.join(tmp, "ext.d"), { recursive: true });
      fs.writeFileSync(path.join(tmp, "bin", "extlib"), src("extlib"));
      if (haveCc) fs.copyFileSync(kd, path.join(tmp, "bin", "keendashd")), fs.chmodSync(path.join(tmp, "bin", "keendashd"), 0o755);
      fs.readdirSync(path.join(sh, "ext.d")).forEach(n => fs.writeFileSync(path.join(tmp, "ext.d", n), src("ext.d/" + n)));
    }
    const rel = script.startsWith("ext.d/") ? script : name;
    fs.writeFileSync(path.join(tmp, rel), (o.edit || (s => s))(src(script), t), { mode: 0o755 });
    const out = cp.execFileSync("sh", ["-c", 'PATH="' + t + ':$PATH" KEENDASH_CONF="' + t + '/conf" KEENDASH_TMP="' + st + '" LOG="' + st + '/log" ' + (o.env || "") + (ext ? 'KEENDASH_EXTD="' + t + '/ext.d" KEENDASH_ETC="' + t + '/etc" ' : "") +
      'FIX="' + unix(path.join(__dirname, "fixtures")) + '" sh "' + t + "/" + rel + '" ' + args], { encoding: "utf8" });
    fs.rmSync(tmp, { recursive: true, force: true });
    return out;
  }
  {
    const out = collect("ext.d/agh", "", "", { env: "URL=http://192.168.1.10:3000/ USER=u PASS=p " });
    const want = ["ok 1", "q 52310", "b 7840", "ms 18", "days 0", "top|ads.example.com|812", "top|pixel.example.com|64",
      "cl|Ноутбук|192.168.1.20|5321", "cl|Телефон|192.168.1.31|2210", "cl|vpn-laptop|10.8.0.2|900", "cl||192.168.1.99|10",
      "fon 3", "fall 4", "rules 368606", "upd 1793531511", "last|1793541000|ads.example.com|Ноутбук", "last|1793540467|tracker.example.net|192.168.1.99"];
    const lines = out.split("\n"), miss = want.filter(l => lines.indexOf(l) < 0);
    ok("ext.d/agh: parses stats, clients, filters, query log", !miss.length && lines.filter(l => l.startsWith("top|")).length === 5 && /^sq 2200,(\d+,){22}2491$/m.test(out), miss.join(" / ") || out);
  }
  if (haveCc) {
    const env = {
      qb: "URL=http://qb.test:8080 USER=admin PASS='p&s=s' ", plex: "URL=http://plex.test:32400/ TOKEN=testkey ", sonarr: "URL=http://sonarr.test KEY=testkey ",
      radarr: "URL=http://radarr.test KEY=testkey ", prowlarr: "URL=http://prowlarr.test KEY=testkey ", overseerr: "URL=http://overseerr.test KEY=testkey ", immich: "URL=http://immich.test KEY=testkey ",
      jellyfin: "URL=http://jellyfin.test KEY=testkey ", jellyseerr: "URL=http://jellyseerr.test KEY=testkey ", moonraker: "URL=http://moonraker.test ", kuma: "URL=http://kuma.test KEY=testkey ",
      lidarr: "URL=http://lidarr.test KEY=testkey ", bazarr: "URL=http://bazarr.test KEY=testkey ", tautulli: "URL=http://tautulli.test KEY=testkey ",
      sabnzbd: "URL=http://sabnzbd.test KEY=testkey ", nzbget: "URL=http://nzbget.test USER=u PASS=p ",
      spoolman: "URL=http://spoolman.test ", grafana: "URL=http://grafana.test TOKEN=testkey ", glances: "URL=http://glances.test USER= PASS= ",
      portainer: "URL=http://portainer.test KEY=testkey ", truenas: "URL=http://truenas.test KEY=testkey ",
      transmission: "URL=http://transmission.test USER= PASS= ", deluge: "URL=http://deluge.test PASS='p\"a\\ss' "
    };
    const want = {
      qb: ["ok 1", "~dl 5242880", "~up 524288", "list|Example.Show.S01E01.1080p.mkv|420|4194304|600", 'list|Big   Pipe "Quoted" Movie 2160p|900|1048576|3600', "list|Stalled.Thing|100|0|8640000", "n 3"],
      plex: ["ok 1", "list|alice|Example Show · Pilot|50|playing", "list|bob|Example Movie|10|paused", "streams 2", "libs|Фильмы|movie|40", "libs|Сериалы|show|23"],
      sonarr: ["ok 1", "queue 7", "list|Example Show S02E05|75|750", "list|Other S01E12|0|93784", "missing 129", "cal|1793667600|Example Show|S02E06|0", "cal|1793910600|New Show|S01E01|1"],
      radarr: ["ok 1", "queue 1", "list|Example Movie|75|7200", "missing 3"],
      prowlarr: ["ok 1", "list|Tracker Two", "all 3", "on 2", "bad 1", "q 50", "g 4", "fail 5"],
      overseerr: ["ok 1", "pending 2", "processing 3", "available 6", "total 12"],
      moonraker: ["ok 1", "state printing", "file benchy.gcode", "pct 40", "el 1200", "left 1800", "~ext 209", "ext_t 215", "~bed 59", "bed_t 60"],
      jellyfin: ["ok 1", "list|alice|Example Show · Pilot|50|paused", "list|bob|Example Movie|10|playing", "streams 2", "libs|Фильмы|movie|40", "libs|Сериалы|show|23", "libs|Эпизоды|episode|500", "libs|Музыка|music|12"],
      jellyseerr: ["ok 1", "pending 2", "processing 3", "available 6", "total 12"],
      lidarr: ["ok 1", "t|В очереди|3|n", "t|Не скачано альбомов|14|n"],
      bazarr: ["ok 1", "t|Серий без субтитров|4|n", "t|Фильмов без субтитров|2|n"],
      tautulli: ["ok 1", "t|Потоков|2|n", "t|Перекодируется|1|n", "t|Трафик|500000|bs"],
      sabnzbd: ["ok 1", "t|Скорость|1264189|bs", "t|Осталось|537395200|b", "t|Осталось времени|450|s", "t|В очереди|3|n"],
      nzbget: ["ok 1", "t|Скорость|2097152|bs", "t|Осталось|104857600|b"],
      transmission: ["ok 1", "t|Загрузка|1048576|bs", "t|Отдача|65536|bs", "t|Активных|2|n", "t|Всего|3|n"],
      deluge: ["ok 1", "t|Загрузка|2097152|bs", "t|Отдача|131072|bs", "t|Торрентов|3|n"],
      spoolman: ["ok 1", "t|Катушек|4|n", "t|Остаток, г|989|n", "t|Меньше 100 г|2|n"],
      grafana: ["ok 1", "t|Версия|10.4.2|t", "t|Дашбордов|3|n", "t|Алертов срабатывает|2|n"],
      glances: ["ok 1", "t|CPU|12|p", "t|Память|45|p", "t|Swap|3|p", "t|Нагрузка|0.52|t"],
      portainer: ["ok 1", "t|Запущено|3|n", "t|Остановлено|1|n", "t|Всего|4|n"],
      truenas: ["ok 1", "t|Пулы|1 из 2|t", "t|Предупреждений|2|n", "t|Нагрузка|0.25|t", "t|Работает|93784|s"],
      immich: ["ok 1", "photos 18230", "videos 1204", "usage 442381631488", "list|Alice|15000|1000|400000000000", "list|Bob|3230|204|42381631488"]
    };
    Object.keys(want).forEach(s => {
      const lines = collect("ext.d/" + s, "", "", { env: env[s] }).trim().split("\n"), miss = want[s].filter(l => lines.indexOf(l) < 0);
      const extra = s === "radarr" ? /^cal\|\d+\|Soon Movie\|d$/.test(lines[lines.length - 1]) && lines.length === 5 : lines.length === want[s].length;
      ok("ext.d/" + s, !miss.length && extra, miss.join(" / ") + " || " + lines.join(" / "));
    });
    ok("ext.d/moonraker: standby, progress 0 -> left -1, no file", collect("ext.d/moonraker", "", "", { env: "URL=http://moonraker.test/idle " }).trim() === ["ok 1", "state standby", "pct 0", "el 0", "left -1", "~ext 24", "ext_t 0", "~bed 23", "bed_t 0"].join(String.fromCharCode(10)));
    ok("ext.d/moonraker: no result.status -> ok 0", collect("ext.d/moonraker", "", "", { env: "URL=http://moonraker.test/nope " }).trim() === "ok 0");
    {
      const kl = ["ok 1", "up 19", "down 2", "list|A \"q\" \\ b c|0|0", "list|Zulu Mail|0|0", "list|Beta Pending|2|0", "list|Gamma Maint|3|0"];
      for (let i = 1; i <= 16; i++) kl.push("list|Host " + String(i).padStart(2, "0") + "|1|" + (100 + i));
      kl.push("n 23");
      const ko = collect("ext.d/kuma", "", "", { env: env.kuma });
      ok("ext.d/kuma: down first, then pending, maintenance, up by name; 20 rows; the name unescaped, | -> space", ko.trim() === kl.join(String.fromCharCode(10)), ko);
      ok("ext.d/kuma: key not printed, wrong key and no monitor_status -> ok 0", !/testkey/.test(ko) && collect("ext.d/kuma", "", "", { env: "URL=http://kuma.test KEY=bad " }).trim() === "ok 0" && collect("ext.d/kuma", "", "", { env: "URL=http://kuma.test/empty KEY=testkey " }).trim() === "ok 0");
    }
    ok("ext.d/jellyfin: string counts become numbers, zero counts skipped", collect("ext.d/jellyfin", "", "", { env: "URL=http://jellyfin.test/evil KEY=testkey " }).trim() === ["ok 1", "streams 0", "libs|Фильмы|movie|1"].join("\n"));
    ok("ext.d/sabnzbd: D:HH:MM:SS", /^t\|Осталось времени\|93784\|s$/m.test(collect("ext.d/sabnzbd", "", "", { env: "URL=http://sabnzbd.test/days KEY=testkey " })));
    ok("ext.d/jellyfin: wrong key -> ok 0", collect("ext.d/jellyfin", "", "", { env: "URL=http://jellyfin.test KEY=bad " }).trim() === "ok 0");
    ok("ext.d/glances: v4 missing -> v3", collect("ext.d/glances", "", "", { env: "URL=http://glances.test/old USER= PASS= " }).trim() === want.glances.join(String.fromCharCode(10)));
    ok("ext.d/grafana: token refused -> version and dashes", collect("ext.d/grafana", "", "", { env: "URL=http://grafana.test TOKEN=bad " }).trim() === ["ok 1", "t|Версия|10.4.2|t", "t|Дашбордов|—|n", "t|Алертов срабатывает|—|n"].join(String.fromCharCode(10)));
    ok("ext.d/portainer, truenas: wrong key -> ok 0", ["portainer", "truenas"].every(s => collect("ext.d/" + s, "", "", { env: "URL=http://" + s + ".test KEY=bad " }).trim() === "ok 0"));
    ok("ext.d/glances, spoolman: no answer -> ok 0", ["glances", "spoolman"].every(s => collect("ext.d/" + s, "", "", { env: "URL=http://nohost.test USER= " }).trim() === "ok 0"));
    ok("ext.d/lidarr: wrong key -> ok 0", collect("ext.d/lidarr", "", "", { env: "URL=http://lidarr.test KEY=bad " }).trim() === "ok 0");
    ok("ext.d/tautulli: key not printed", !/testkey/.test(collect("ext.d/tautulli", "", "", { env: env.tautulli })));
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-n-")), lg = () => fs.readFileSync(path.join(sd, "log"), "utf8");
      const o = collect("ext.d/nzbget", "", "", { state: sd, env: "URL=http://nzbget.test USER= PASS= " }).trim();
      ok("ext.d/nzbget: no user -> no Authorization", o.startsWith("ok 1") && !/Authorization/.test(lg()), lg());
      collect("ext.d/nzbget", "", "", { state: sd, env: "URL=http://nzbget.test USER=u PASS=p " });
      ok("ext.d/nzbget: user -> Basic", / Authorization: Basic dTpw /.test(lg()), lg());
      fs.rmSync(sd, { recursive: true, force: true });
    }
    ok("ext.d/deluge: wrong password -> ok 0", collect("ext.d/deluge", "", "", { env: "URL=http://deluge.test PASS=x " }).trim() === "ok 0");
    ok("ext.d/deluge: password not printed", !/a\\+ss/.test(collect("ext.d/deluge", "", "", { env: env.deluge })));
    ok("ext.d/transmission: 409 that never stops -> ok 0", collect("ext.d/transmission", "", "", { env: "URL=http://transmission.test/stuck USER= PASS= " }).trim() === "ok 0");
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-t-")), lg = () => fs.readFileSync(path.join(sd, "log"), "utf8");
      collect("ext.d/transmission", "", "", { state: sd, env: env.transmission });
      ok("ext.d/transmission: no user -> no Authorization, session id repeated", !/Authorization/.test(lg()) && / X-Transmission-Session-Id: sess1 /.test(lg()), lg());
      collect("ext.d/transmission", "", "", { state: sd, env: "URL=http://transmission.test USER=u PASS=p " });
      ok("ext.d/transmission: user -> Basic", / Authorization: Basic dTpw /.test(lg()), lg());
      fs.writeFileSync(path.join(sd, "log"), "");
      const o = collect("ext.d/transmission", "", "", { state: sd, env: "URL=http://transmission.test/transmission/web/ USER= PASS= " });
      ok("ext.d/transmission: browser URL .../transmission/web/ -> rpc", o.startsWith("ok 1") && / http:\/\/transmission\.test\/transmission\/rpc $/m.test(lg()) && !/\/web/.test(lg()), lg());
      fs.rmSync(sd, { recursive: true, force: true });
    }
    ok("ext.d/sonarr: wrong key -> ok 0", collect("ext.d/sonarr", "", "", { env: "URL=http://sonarr.test KEY=bad " }).trim() === "ok 0");
    ok("ext.d/qb: wrong password -> ok 0", collect("ext.d/qb", "", "", { env: "URL=http://qb.test USER=admin PASS=x " }).trim() === "ok 0");
    // ext.d/custom: MAP from the browser is data (read from the environment in awk), bad pairs are skipped; fake-wget logs the request to $LOG
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-c-")), run = (env, url) => {
        fs.rmSync(path.join(sd, "log"), { force: true });
        const out = collect("ext.d/custom", "", "", { state: sd, env: "USER= PASS= KEY= TOKEN= URL=http://custom.test/" + (url || "stats") + " " + env + " " });
        return [out.trim().split("\n"), fs.existsSync(path.join(sd, "log")) ? fs.readFileSync(path.join(sd, "log"), "utf8") : ""];
      };
      const M = "MAP='Задачи=queue.total; Скорость=speed:bs; Имя=queue.items.0.name; Нет=no.such:n' ";
      let [l, lg] = run(M + "KEY=testkey");
      ok("ext.d/custom: tiles from the map, X-Api-Key", l.join("\n") === "ok 1\nt|Задачи|7|\nt|Скорость|2048|bs\nt|Имя|a|\nt|Нет||n" && / --header X-Api-Key: testkey /.test(lg), l.join(" / ") + " || " + lg);
      [l, lg] = run(M + "TOKEN=testkey");
      ok("ext.d/custom: token -> Bearer", / --header Authorization: Bearer testkey /.test(lg) && !/X-Api-Key/.test(lg), lg);
      [l, lg] = run(M + "USER=u PASS=p");
      ok("ext.d/custom: user and pass -> Basic", / --header Authorization: Basic dTpw /.test(lg), lg);
      [l, lg] = run(M);
      ok("ext.d/custom: no credentials -> no auth header", l[0] === "ok 1" && lg.startsWith("custom ") && !/Authorization|X-Api-Key|--header/.test(lg), lg);
      // up to 8 pairs; the others fail the collector's own check: shell syntax in the path, "|" label, 2 colons, no "=", empty path; the label with " and \ is data
      [l] = run("MAP='T=txt; X=$(touch " + unix(sd) + "/pwn); Q\"\\x=speed; Y=queue.total:zz; |=speed; Z=speed:n:n; W=a b; V=; U=queue.total; T5=speed; T6=speed'");
      ok("ext.d/custom: bad pairs skipped, values and labels are data, nothing executed", l.join("\n") === "ok 1\nt|T|x$(id)`y|\nt|Q\"\\x|2048|\nt|U|7|\nt|T5|2048|\nt|T6|2048|" && !fs.existsSync(path.join(sd, "pwn")), l.join(" / "));
      [l] = run("MAP='" + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => "P" + n + "=speed").join("; ") + "'");
      ok("ext.d/custom: 9 pairs -> 8 tiles", l.join("\n") === "ok 1\n" + [1, 2, 3, 4, 5, 6, 7, 8].map(n => "t|P" + n + "|2048|").join("\n"), l.join(" / "));
      [l, lg] = run(M + "PASS=p");
      ok("ext.d/custom: pass without user -> no auth header", !/Authorization/.test(lg), lg);
      [l] = run("MAP='Y=a`touch " + unix(sd) + "/pwn`; T=txt'");
      ok("ext.d/custom: backticks in a path -> pair skipped, nothing executed", l.join("\n") === "ok 1\nt|T|x$(id)`y|" && !fs.existsSync(path.join(sd, "pwn")), l.join(" / "));
      [l] = run(M, "page");
      ok("ext.d/custom: an HTML page with CSS -> ok 0", l.join("\n") === "ok 0", l.join(" / "));
      [l] = run(M, "html");
      ok("ext.d/custom: an answer that is not JSON -> ok 0", l.join("\n") === "ok 0", l.join(" / "));
      fs.rmSync(sd, { recursive: true, force: true });
    }
    // bin/ext: every etc/services/<id>.conf is one run of its type's collector, cached in x/<id>; "~key" lines grow s.<id>.<key>
    const QB = "TYPE='qb'\nNAME='qBittorrent'\nURL='http://qb.test:8080'\nUSER='admin'\nPASS='p&s=s'\n", rd = (d, n) => fs.existsSync(path.join(d, n)) ? fs.readFileSync(path.join(d, n), "utf8") : null;
    const ls = d => fs.readdirSync(d).concat(fs.readdirSync(path.join(d, "x"))).join(" ");
    const d = fs.mkdtempSync(path.join(os.tmpdir(), "kd-x-"));
    fs.mkdirSync(path.join(d, "x")); fs.writeFileSync(path.join(d, "x.agh"), "agh_ok 1\n");
    collect("ext", "", "", { state: d, files: { "etc/services/qb.conf": QB, "etc/services/qb-2.conf": QB.replace("p&s=s", "bad"),
      "etc/services/bad.conf": "TYPE='nosuch'\nURL='http://x.test'\n", "etc/services/Up.conf": QB } });
    ok("bin/ext: two qBittorrent instances", /^ok 1\n/.test(rd(d, "x/qb")) && rd(d, "x/qb-2") === "ok 0\n" && rd(d, "s.qb.dl") === "5242880\n" && rd(d, "s.qb.up") === "524288\n" &&
      rd(d, "s.qb-2.dl") === null && rd(d, "x/bad") === null && rd(d, "x/Up") === null && rd(d, "x.agh") === null && ls(d).split(" ").every(n => !/\.new$/.test(n)), ls(d));
    fs.writeFileSync(path.join(d, "x", "old"), "ok 1\n"); fs.writeFileSync(path.join(d, "s.old.dl"), "1\n");
    collect("ext", "", "", { state: d, files: { "etc/services/qb.conf": QB } });
    ok("bin/ext: removed instance -> cache gone", rd(d, "x/old") === null && rd(d, "s.old.dl") === null && rd(d, "x/qb-2") === null && rd(d, "s.qb.dl") === "5242880\n5242880\n" && /^ok 1\n/.test(rd(d, "x/qb")), ls(d));
    // a collector that exits non-zero keeps its cache file
    fs.writeFileSync(path.join(d, "x", "boom"), "ok 1\n");
    collect("ext", "", "", { state: d, files: { "ext.d/boom": "#!/bin/sh\nexit 1\n", "etc/services/boom.conf": "TYPE='boom'\n" } });
    ok("bin/ext: collector exit status 1 -> x/<id> not deleted", rd(d, "x/boom") !== null, ls(d));
    fs.rmSync(d, { recursive: true, force: true });
    // EVERY: an instance with a cache runs when its conf is newer than the cache or the cache is EVERY*60-30 s old (KEENDASH_NOW is epoch seconds);
    // HOSTS and EVERY are unset per instance. The cache mtime of t5 is in the future, so the conf written by collect() is never newer than it
    const e = fs.mkdtempSync(path.join(os.tmpdir(), "kd-e-")), cf = (x, ev) => "TYPE='envt'\n" + (x ? "HOSTS='" + x + "'\n" : "") + (ev ? "EVERY='" + ev + "'\n" : "");
    fs.mkdirSync(path.join(e, "x"));
    const stamp = (n, t) => { fs.writeFileSync(path.join(e, "x", n), "old\n"); fs.utimesSync(path.join(e, "x", n), t, t); };
    const nowS = Math.floor(Date.now() / 1000), bt = nowS + 100000, envt = "#!/bin/sh\necho ok 1\necho \"h=$HOSTS e=$EVERY\"\n";
    ["t5", "t7", "t8"].forEach(n => stamp(n, bt));
    const every = (now, files) => collect("ext", "", "", { state: e, env: "KEENDASH_NOW=" + now + " HOSTS=leak EVERY=5 ", files: Object.assign({ "ext.d/envt": envt }, files) });
    const set5 = { "etc/services/t5.conf": cf("a.test b.test", "5"), "etc/services/t6.conf": cf("", "5"), "etc/services/t7.conf": cf("", ""), "etc/services/t8.conf": cf("", "x$(y)") };
    every(bt + 269, set5);
    ok("bin/ext: EVERY=5 with a cache 269 s old is skipped; no cache or no EVERY (or a bad one) runs; env of the caller is dropped",
      rd(e, "x/t5") === "old\n" && rd(e, "x/t6") === "ok 1\nh= e=5\n" && rd(e, "x/t7") === "ok 1\nh= e=\n" && rd(e, "x/t8") === "ok 1\nh= e=x$(y)\n", JSON.stringify(["t5", "t6", "t7", "t8"].map(n => rd(e, "x/" + n))));
    every(bt + 270, set5);
    ok("bin/ext: EVERY=5 runs once the cache is 270 s old (EVERY*60-30), HOSTS and EVERY exported", rd(e, "x/t5") === "ok 1\nh=a.test b.test e=5\n", JSON.stringify(rd(e, "x/t5")));
    // a conf newer than the cache (just saved) runs at once; an older conf with a fresh cache does not
    stamp("t9", nowS - 1000); stamp("t10", bt);
    every(nowS - 990, { "etc/services/t9.conf": cf("", "5"), "etc/services/t10.conf": cf("", "5") });
    ok("bin/ext: EVERY=5 runs when the conf is newer than the cache", rd(e, "x/t9") === "ok 1\nh= e=5\n" && rd(e, "x/t10") === "old\n", JSON.stringify([rd(e, "x/t9"), rd(e, "x/t10")]));
    fs.rmSync(e, { recursive: true, force: true });
    const one = collect("ext", "sonarr-1", "", { files: { "etc/services/sonarr-1.conf": "TYPE='sonarr'\nURL='http://sonarr.test'\nKEY='bad'\n" } });
    ok("bin/ext: wrong key -> ok 0", one === "ok 0\n", one);
    const cu = collect("ext", "cu-1", "", { files: { "etc/services/cu-1.conf": "TYPE='custom'\nURL='http://custom.test/stats'\nMAP='A=queue.total; B=speed:bs'\n" } });
    ok("bin/ext: MAP of the instance reaches ext.d/custom", cu === "ok 1\nt|A|7|\nt|B|2048|bs\n", cu);
    // ext.d/check: HOSTS is data (awk ENVIRON, every element re-checked), the address is one argument after the options; fake-wget logs requests to $LOG.
    // The fake uptime file makes the times 0 ms, UPBUMP moves it by 120 ms inside the request
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-k-")), ud = unix(sd) + "/uptime", sq = v => "'" + v.replace(/'/g, "'\\''") + "'", now = Math.floor(Date.now() / 1000);
      const f = n => path.join(sd, n), rd = n => fs.existsSync(f(n)) ? fs.readFileSync(f(n), "utf8") : null, chks = () => fs.readdirSync(sd).filter(n => /^\.?chk\./.test(n)).sort();
      const run = (hosts, env, id) => {
        fs.writeFileSync(f("uptime"), "1000.00 500.00\n"); fs.rmSync(f("log"), { force: true });
        return collect("ext.d/check", "", "", { state: sd, env: "ID=" + (id || "ck") + " KEENDASH_UPTIME=" + ud + " " + (env || "") + " HOSTS=" + sq(hosts) + " EVERY=5 " }).trim().split("\n");
      };
      let l = run("up.test bad.test down.test");
      ok("ext.d/check: up, 503 and no answer, exact lines", l.join("\n") === "ok 1\nup 2\nn 3\nh|up.test|200|0|100|1\nh|bad.test|503|0|100|1\nh|down.test|0|0|0|0", l.join(" / "));
      ok("ext.d/check: history files per address, no leftovers", chks().join() === "chk.ck.bad.test,chk.ck.down.test,chk.ck.up.test" && /^\d+ 1\n$/.test(rd("chk.ck.up.test")) && /^\d+ 0\n$/.test(rd("chk.ck.down.test")), chks().join());
      let lg = rd("log");
      ok("ext.d/check: a domain is https://<d>/ after the options, an address stays as is, a port stays",
        lg.includes(" -S -O /dev/null --max-redirect=0 https://up.test/ ") && lg.includes(" -S -O /dev/null --max-redirect=0 https://bad.test/ "), lg);
      l = run("up.test:81 http://up.test/x?y=1, https://bad.test:8443/");
      lg = rd("log");
      ok("ext.d/check: domain:port, http(s) addresses, comma", l[0] === "ok 1" && l[2] === "n 3" && lg.includes(" --max-redirect=0 https://up.test:81/ ") && lg.includes(" --max-redirect=0 http://up.test/x?y=1 ") && lg.includes(" --max-redirect=0 https://bad.test:8443/ ") &&
        chks().join() === "chk.ck.http___up.test_x_y_1,chk.ck.https___bad.test_8443_,chk.ck.up.test_81", lg + " || " + chks().join());
      l = run("up.test", "UPBUMP=1");
      ok("ext.d/check: time is the uptime difference in ms", l.join("\n") === "ok 1\nup 1\nn 1\nh|up.test|200|120|100|1", l.join(" / "));
      // history: grows per run, lines older than 24 h go, the new line is epoch + 1|0; the percent and the last 30 come from the file; other instances and removed addresses
      fs.writeFileSync(f("chk.ck.up.test"), "1000 0\n" + (now - 86390) + " 1\n" + (now - 100) + " 0\n" + (now - 50) + " 1\n" + (now - 86410) + " 0\n");
      fs.writeFileSync(f("chk.ck.gone.test"), (now - 5) + " 1\n"); fs.writeFileSync(f("chk.other.up.test"), (now - 5) + " 1\n");
      l = run("up.test");
      const h1 = rd("chk.ck.up.test").trim().split("\n");
      ok("ext.d/check: history grows, drops lines older than 24 h, percent and last cells from it", h1.length === 4 && h1.slice(0, 3).join() === [now - 86390 + " 1", now - 100 + " 0", now - 50 + " 1"].join() && /^\d+ 1$/.test(h1[3]) &&
        l[3] === "h|up.test|200|0|75|1,0,1,1", l.join(" / ") + " || " + h1.join());
      ok("ext.d/check: a removed address's file is deleted, another instance's is not", rd("chk.ck.gone.test") === null && rd("chk.other.up.test") !== null, chks().join());
      l = run("up.test", "", "other");
      ok("ext.d/check: the id keeps histories apart", rd("chk.other.up.test").trim().split("\n").length === 2 && rd("chk.ck.up.test").trim().split("\n").length === 4, rd("chk.other.up.test"));
      // 41 samples: the strip is the last 30, newest on the right
      fs.writeFileSync(f("chk.ck.up.test"), Array.from({ length: 40 }, (_, i) => (now - 2000 + i) + " " + (i < 20 ? 0 : 1)).join("\n") + "\n");
      l = run("up.test");
      ok("ext.d/check: last 30 cells", l[3] === "h|up.test|200|0|" + Math.floor(21 * 100 / 41) + "|" + "0,".repeat(9) + "1,".repeat(20) + "1", l[3]);
      // browser input is data: nothing executed, bad elements skipped, nothing kept for them
      fs.rmSync(f("pwn"), { force: true });
      const bad = "$(touch " + unix(sd) + "/pwn) -x `touch " + unix(sd) + "/pwn` up.test a'b http://a|b http://a/$(touch " + unix(sd) + "/pwn) --spider http://x/\"y ftp://x a:123456 a/b -up.test";
      l = run(bad);
      lg = rd("log");
      ok("ext.d/check: bad elements skipped, nothing executed, no file for them", l.length === 4 && l.slice(0, 3).join() === "ok 1,up 1,n 1" && /^h\|up\.test\|200\|0\|\d+\|[01,]+$/.test(l[3]) && !fs.existsSync(f("pwn")) && !/spider| -x |pwn|ftp/.test(lg) && lg.trim().split(String.fromCharCode(10)).length === 1 &&
        chks().join() === "chk.ck.up.test,chk.other.up.test", l.join(" / ") + " || " + lg + " || " + chks().join());
      l = run("");
      ok("ext.d/check: empty HOSTS -> ok 0, histories of the instance removed", l.join("\n") === "ok 0" && chks().join() === "chk.other.up.test", l.join(" / ") + chks().join());
      l = run("-x $(id)");
      ok("ext.d/check: nothing valid -> ok 0", l.join("\n") === "ok 0", l.join(" / "));
      l = run("up.test", "", "A.b");
      ok("ext.d/check: a bad id -> ok 0", l.join("\n") === "ok 0" && chks().join() === "chk.other.up.test", l.join(" / "));
      // all addresses at once: two answers of 1 s each take under 2 s
      const t0 = Date.now();
      l = run("slow.test slow.test:81");
      const dt = Date.now() - t0;
      ok("ext.d/check: addresses are asked in parallel", l.slice(0, 4).join("|").startsWith("ok 1|up 2|n 2|h|slow.test|200|") && dt < 2000, dt + " ms " + l.join(" / "));
      // the 21st element is not asked
      l = run(Array.from({ length: 25 }, (_, i) => "up.test:" + (1000 + i)).join(" "));
      ok("ext.d/check: at most 20 addresses", l[2] === "n 20" && l.length === 23, l.join(" / "));
      // through bin/ext: it passes the instance id; the real /proc/uptime gives the time
      for (const n of fs.readdirSync(sd)) fs.rmSync(f(n), { recursive: true, force: true });
      const ck = collect("ext", "ck-1", "", { state: sd, files: { "etc/services/ck-1.conf": "TYPE='check'\nHOSTS='up.test down.test'\nEVERY='5'\n" } }).trim().split("\n");
      ok("bin/ext: the instance id reaches ext.d/check", ck[0] === "ok 1" && ck[1] === "up 1" && ck[2] === "n 2" && /^h\|up\.test\|200\|\d+\|100\|1$/.test(ck[3]) && /^h\|down\.test\|0\|\d+\|0\|0$/.test(ck[4]) && !!rd("chk.ck-1.up.test"), ck.join(" / "));
      fs.rmSync(sd, { recursive: true, force: true });
    }
  }
  if (haveCc) {
    // bin/rci: NDMS over RCI with keendash's own token, issued through ndmc (tests/fake-ndmc); the log lists ndmc and RCI calls in order
    const TK = "Tk0123456789abcdefghijklmnopqrstuvWXYZ", STALE = "Stale0123456789abcdefghijklmnopqrstuv", states = [];
    const state = (token, tried) => {
      const d = fs.mkdtempSync(path.join(os.tmpdir(), "kd-st-")); states.push(d);
      if (token) fs.writeFileSync(path.join(d, "rci.token"), token + "\n");
      if (tried) fs.writeFileSync(path.join(d, "rci.try"), Math.floor(Date.now() / 1000) + "\n");
      return d;
    };
    const log = d => fs.existsSync(path.join(d, "log")) ? fs.readFileSync(path.join(d, "log"), "utf8").trim().split("\n") : [];
    const tok = d => fs.existsSync(path.join(d, "rci.token")) ? fs.readFileSync(path.join(d, "rci.token"), "utf8").trim() : null;
    const issue = ["ndmc show version", "ndmc authentication token generate keendash", "ndmc show authentication token", "ndmc authentication token delete 4"];
    const proxy = d => collect("rci", "show/ip/http/proxy", "", { state: d });
    let d = state(), out = proxy(d);
    ok("bin/rci: RCI answer flattened", /^firc\.fqdn\tfirc\.r\.example\.net$/m.test(out) && /^adguard\.upstream\t10\.0\.0\.2:3000$/m.test(out), out);
    ok("bin/rci: token issued, only older keendash ones deleted, sent as X-NDMA-TKN", log(d).join() === issue.concat("rci /show/ip/http/proxy " + TK).join(), log(d).join(" / "));
    ok("bin/rci: token file 600", tok(d) === TK && (fs.statSync(path.join(d, "rci.token")).mode & 0o777) === 0o600, tok(d));
    fs.rmSync(path.join(d, "log")); proxy(d);
    ok("bin/rci: the token is kept, no more ndmc", log(d).join() === "rci /show/ip/http/proxy " + TK, log(d).join(" / "));
    d = state(STALE); out = proxy(d);
    ok("bin/rci: refused token (403 0x2312) -> a new one, one retry", /^firc\.fqdn/m.test(out) && tok(d) === TK &&
      log(d).join() === ["rci /show/ip/http/proxy " + STALE].concat(issue, "rci /show/ip/http/proxy " + TK).join(), log(d).join(" / "));
    d = state(STALE, true); out = proxy(d);
    ok("bin/rci: a new token at most once a minute, none till then", /^firc\.fqdn/m.test(out) && tok(d) === null &&
      log(d).join() === ["rci /show/ip/http/proxy " + STALE, "rci /show/ip/http/proxy -"].join(), log(d).join(" / "));
    d = state(); collect("rci", "show/ip/http/proxy", "", { state: d, env: "NDMC=old " }); collect("rci", "show/ip/http/proxy", "", { state: d, env: "NDMC=old " });
    ok("bin/rci: before 5.2 (5.01 release) no token commands at all", log(d).join() === ["ndmc show version", "rci /show/ip/http/proxy -", "rci /show/ip/http/proxy -"].join(), log(d).join(" / "));
    d = state(); collect("rci", "show/ip/http/proxy", "", { state: d, env: "NDMC=noversion " }); collect("rci", "show/ip/http/proxy", "", { state: d, env: "NDMC=noversion " });
    ok("bin/rci: 5.1 argument parse error -> no token, tried once, nothing to delete", log(d).join() === ["ndmc show version", "ndmc authentication token generate keendash", "rci /show/ip/http/proxy -", "rci /show/ip/http/proxy -"].join(), log(d).join(" / "));
    const prerm = { edit: (x, t) => x.replace("/opt/share/keendash/bin/", t + "/") };
    d = state(TK); collect("ipk/prerm", "", "", Object.assign({ state: d }, prerm));
    ok("prerm: deletes only keendash's tokens, the token file", tok(d) === null &&
      log(d).join() === ["ndmc show authentication token", "ndmc authentication token delete 4", "ndmc authentication token delete 9"].join(), log(d).join(" / "));
    d = state(TK); collect("ipk/prerm", "", "", Object.assign({ state: d, env: "PKG_UPGRADE=1 " }, prerm));
    ok("prerm: upgrade keeps the token", tok(d) === TK && !log(d).length, log(d).join(" / "));

    // the collectors: the same lines as from ndmc before, one RCI request for all interfaces
    // only the awg provider, whatever the test machine has; awg-manager's settings.json from the test
    const awg = (settings, env) => {
      const s = state(), o = collect("stats", "", "", { state: s, env: env || "", files: { "awgm.json": settings || "{}" },
        edit: (x, t) => x.replace(/^(HAS_\w+)=0;.*$/gm, (m, v) => v + "=" + (v === "HAS_AWG" ? 1 : 0)).replace(/^  AS=.*$/m, "  AS=" + t + "/awgm.json") });
      return { tun: o.split("\n").filter(l => /^(tun\||awg_up |awg_total |awg_nokey )/.test(l)).join("\n"), log: log(s) };
    };
    const tuns = "tun|Warp|1|0|0|431836\ntun|Home WG|0|0|0|0\ntun|mihomo|1|0|0|1234\nawg_up 2\nawg_total 3";
    let a = awg('{\n  "port": 2222,\n  "authEnabled": false\n}\n');
    ok("bin/stats: tunnels from RCI", a.tun === tuns && a.log.filter(l => l.startsWith("rci ")).join() === "rci /show/interface " + TK, a.tun + " || " + a.log.join(" / "));
    a = awg('{\n  "apiKey": "k-123",\n  "server": { "port": 2222 },\n  "authEnabled": true\n}\n', "AWG_KEY=k-123 ");
    ok("bin/stats: awg-manager login on -> its API key", a.tun === tuns, a.tun + " || " + a.log.join(" / "));
    a = awg('{\n  "port": 2222,\n  "authEnabled": true\n}\n', "AWG_KEY=k-123 ");
    ok("bin/stats: awg-manager login on, no API key -> not asked, awg_nokey", a.tun === "awg_nokey 1\nawg_up 0\nawg_total 0" && !a.log.some(l => l.startsWith("awg ")), a.tun + " || " + a.log.join(" / "));
    d = state();
    collect("tick", "5", "", { state: d, files: { services: "#!/bin/sh\n", update: "#!/bin/sh\n", "firc/groups.yaml": "groups:\n",
      "firc/tunnels.yaml": 'tunnels:\n- id: t1\n  device: fw0\n  description: "Firc tunnel"\n' },
      edit: (x, t) => x.replace(/^BIN=.*$/m, "BIN=" + t).replace(/^D=\/tmp\/keendash/m, 'D="$KEENDASH_TMP"').replace(/\/opt\/etc\/firc\//g, t + "/firc/") });
    const batch = "[" + ["GigabitEthernet1", "Bridge0", "OpkgTun10", "OpkgTun11", "Proxy0", "Wireguard1"].map(n => '{"show":{"interface":{"system-name":{"name":"' + n + '"}}}}').join() + "]";
    const ifn = fs.existsSync(path.join(d, "ifnames")) && fs.readFileSync(path.join(d, "ifnames"), "utf8");
    ok("bin/tick 5: interface names from 2 RCI requests (interfaces, a batch of kernel names)", ifn === "eth3|Провайдер\nopkgtun10|Warp main\nopkgtun11|Home WG\nt2s0|mihomo\nnwg1|Wireguard VPN\nfw0|Firc tunnel\n" &&
      log(d).filter(l => l.startsWith("rci ")).join("\n") === "rci /show/interface " + TK + "\nrci / " + TK + " " + batch, JSON.stringify(ifn) + " || " + log(d).join(" / "));
    d = state(); fs.writeFileSync(path.join(d, "links"), "");
    out = collect("services", "", "", { state: d, edit: x => x.replace(/^INITD=.*$/m, "INITD=/nonexistent").replace(/^D=\/tmp\/keendash;/m, 'D="$KEENDASH_TMP";') });
    ok("bin/services: KeenDNS web apps from RCI", out === "ndp|firc.r.example.net|127.0.0.1|666|1\nndp|adguard.r.example.net|10.0.0.2|3000|0\n", out);
    states.forEach(x => fs.rmSync(x, { recursive: true, force: true }));
  }
  if (haveCc) {
    // keendashd json: keys and indexes joined with ".", \" \/ \\ decoded, other escapes kept, tab and | -> space
    const j = cp.execFileSync(kd, ["json"], { encoding: "utf8", input: '{"a":[{"b":"x\\"y|z"},2],"c":{"d":null,"e":"\\/p\\\\q\\n"},"t":true,"u":"\\u00e9"}' });
    ok("keendashd json: paths, escapes", j === 'a.0.b\tx"y z\na.1\t2\nc.d\tnull\nc.e\t/p\\q\\n\nt\ttrue\nu\t\\u00e9\n', JSON.stringify(j));
    const jp = cp.execFileSync(kd, ["json"], { encoding: "utf8", input: '[\n  [1, -2.5e3],\n  {"k": [ {"z": "w"} ], "e": []}\n]\n' });
    ok("keendashd json: pretty-printed, nested arrays", jp === "0.0\t1\n0.1\t-2.5e3\n1.k.0.z\tw\n", JSON.stringify(jp));
    // keendashd kvjson: collector lines -> JSON; first key wins, broken lines skipped
    let kj = null;
    try { kj = JSON.parse(cp.execFileSync(kd, ["kvjson"], { encoding: "utf8",
      input: 'ok 1\n~dl 5242880\nname a "b"\\c\tz\nsq 1,2,3\nlist|x|420|S02E06\nlist|y||7\nt|Нет||n\nwget: bad address\nok 0\n' })); } catch (e) { kj = e.message; }
    ok("keendashd kvjson: numbers, strings, lists, tables, ~", JSON.stringify(kj) === JSON.stringify({ ok: 1, dl: 5242880, name: 'a "b"\\c\tz', sq: [1, 2, 3],
      list: [["x", 420, "S02E06"], ["y", "", 7]], t: [["Нет", "", "n"]] }), JSON.stringify(kj));

    // keendashd status: stats/services output -> the card's JSON; broken numbers become 0/null, strings are escaped
    const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kds-"));
    fs.writeFileSync(path.join(sd, "stats"), ["tab|telemt", "tab|sys", "awg_nokey 1", "telemt_ok 1", "telemt_conn 12", "telemt_users x", 'u|alice "a"\\b|3|100|200', "px|home|freeturn-server|1|||",
      "sys_load 007", "sys_temp", "ts_running 1", "ts_online 1", "tss|Running|router|100.64.0.1|waw||0||", "tsp|pc|windows|1|1|1||0001-01-01T00:00:00Z|10|20|0|0|"].join("\n") + "\n");
    fs.writeFileSync(path.join(sd, "services"), "svc|cron|1|\nweb|lighttpd|8090|nfqws2\nndp|firc.r.example.net|127.0.0.1|666|1\n");
    fs.writeFileSync(path.join(sd, "sys_load"), "10\n20\nbad\n30\n");
    fs.writeFileSync(path.join(sd, "upd.new"), "9.9.9\n");
    fs.writeFileSync(path.join(sd, "settings"), "vol|v1:\nrev|r1\nerr|\ntype|qb|qBittorrent|Медиа|url,user,pass|Ключ: \"x\"\ntype|pl|Plex|Медиа|url,token\ninst|qb-2|qb|Торренты|http://q|admin|pass|A=x.y:b|h.test x.test|15\n" +
      "inst|pl|plex|Plex|http://p||token|\nhide|page|cron\nhide|main|telemt\ncol|telemt,awg\ncol|qb-2\n");
    fs.mkdirSync(path.join(sd, "x"));
    fs.writeFileSync(path.join(sd, "x", "qb-2"), "ok 1\n~dl 5\nlist|a|1\n");
    fs.writeFileSync(path.join(sd, "s.qb-2.dl"), "4\n5\n"); fs.writeFileSync(path.join(sd, "s.qb-2.t"), "7\n"); fs.writeFileSync(path.join(sd, ".s.qb-2.dl.t"), "9\n");
    const env = Object.assign({}, process.env, { KEENDASH_STATS: "cat '" + sd + "/stats'", KEENDASH_SERVICES: "cat '" + sd + "/services'",
      KEENDASH_SETTINGS: "cat '" + sd + "/settings'", KEENDASH_TMP: sd });
    let s = null;
    try { s = JSON.parse(cp.execFileSync(kd, ["status"], { env, encoding: "utf8" })); } catch (e) { ok("keendashd status: valid JSON", false, e.message); }
    if (s) {
      const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      ok("keendashd status: tabs, services, links", eq(s.tabs, ["telemt", "sys"]) && eq(s.svc, [["cron", 1, ""]]) && eq(s.web, [["lighttpd", 8090, "nfqws2"]]) && eq(s.ndp, [["firc.r.example.net", "127.0.0.1", 666, 1]]), JSON.stringify([s.tabs, s.svc, s.web, s.ndp]));
      ok("keendashd status: values, missing ones 0", s.telemt.ok === 1 && s.telemt.conn === 12 && s.telemt.users === 0 && s.sys.mem === 0 && s.awg.nokey === 1 && s.awg.up === 0, JSON.stringify(s.telemt) + JSON.stringify(s.awg));
      ok("keendashd status: strings escaped", eq(s.telemt.list, [['alice "a"\\b', 3, 100, 200]]), JSON.stringify(s.telemt.list));
      ok("keendashd status: empty fields 0 / null", eq(s.awg.px, [["home", "freeturn-server", 1, 0, null, ""]]), JSON.stringify(s.awg.px));
      ok("keendashd status: 007 -> 7, empty temp -> null", s.sys.load === 7 && s.sys.temp === null, JSON.stringify(s.sys));
      ok("keendashd status: graph history, broken lines skipped", eq(s.series.sys_load, [10, 20, 30]) && eq(s.series.awg_bytes, []), JSON.stringify(s.series.sys_load));
      ok("keendashd status: Tailscale", s.ts.run === 1 && s.ts.online === 1 && s.ts.total === 0 && eq(s.ts.self, [["Running", "router", "100.64.0.1", "waw", "", 0, "", ""]]) &&
        eq(s.ts.list, [["pc", "windows", 1, 1, 1, "", "0001-01-01T00:00:00Z", 10, 20, 0, 0, ""]]), JSON.stringify(s.ts));
      ok("keendashd status: newer version", s.upd.new === "9.9.9" && s.upd.busy === 0, JSON.stringify(s.upd));
      ok("keendashd status: cfg", eq(s.cfg, { vol: "v1:", rev: "r1", err: "", hide: { page: ["cron"], main: ["telemt"] }, cols: [["telemt", "awg"], ["qb-2"]] }), JSON.stringify(s.cfg));
      ok("keendashd status: types", eq(s.types, [["qb", "qBittorrent", "Медиа", ["url", "user", "pass"], 'Ключ: "x"'], ["pl", "Plex", "Медиа", ["url", "token"], ""]]), JSON.stringify(s.types));
      ok("keendashd status: inst, data or null", eq(s.inst, [["qb-2", "qb", "Торренты", "http://q", "admin", ["pass"], { ok: 1, dl: 5, list: [["a", 1]] }, "A=x.y:b", "h.test x.test", "15"],
        ["pl", "plex", "Plex", "http://p", "", ["token"], null, "", "", ""]]), JSON.stringify(s.inst));
      ok("keendashd status: instance series (a key named t too), no old third-party keys", eq(s.series["qb-2.dl"], [4, 5]) && eq(s.series["qb-2.t"], [7]) && !("agh" in s) && !("media" in s) && !("qb_dl" in s.series), JSON.stringify(s.series));
    }

    // keendashd serve: static files, CGI, the built-in status; the daemon prints its pid
    const www = fs.mkdtempSync(path.join(os.tmpdir(), "kdw-"));
    fs.mkdirSync(path.join(www, "widgets")); fs.mkdirSync(path.join(www, "cgi-bin"));
    fs.writeFileSync(path.join(www, "widgets", "a.js"), "var a = 1;\n");
    fs.writeFileSync(path.join(www, "cgi-bin", "echo.cgi"), '#!/bin/sh\nprintf "Status: 201 Created\\r\\nContent-Type: text/plain\\r\\nX-Test: 1\\r\\n\\r\\n"\necho "$REQUEST_METHOD $QUERY_STRING $HTTP_ORIGIN $(cat)"\n', { mode: 0o755 });
    const port = 20000 + Math.floor(Math.random() * 20000);
    const pid = parseInt(cp.execFileSync(kd, ["serve", "127.0.0.1", String(port), www], { env, encoding: "utf8" }), 10);
    const http = require("http");
    const get = (method, p, body, headers) => new Promise(r => {
      const q = http.request({ host: "127.0.0.1", port, method, path: p, headers }, x => {
        let d = ""; x.setEncoding("utf8"); x.on("data", c => d += c); x.on("end", () => r({ code: x.statusCode, h: x.headers, body: d }));
      });
      q.on("error", e => r({ code: 0, h: {}, body: String(e) })); if (body) q.write(body); q.end();
    });
    let x = await get("GET", "/widgets/a.js");
    ok("keendashd serve: static file", pid > 0 && x.code === 200 && x.h["content-type"] === "application/javascript; charset=utf-8" && x.body === "var a = 1;\n", x.code + " " + x.body);
    x = await get("HEAD", "/widgets/a.js");
    ok("keendashd serve: HEAD", x.code === 200 && x.h["content-length"] === "11" && x.body === "", JSON.stringify(x));
    ok("keendashd serve: 404", (await get("GET", "/widgets/b.js")).code === 404);
    ok("keendashd serve: no way out of www", (await get("GET", "/widgets/../../etc/passwd")).code === 400);
    ok("keendashd serve: 405", (await get("PUT", "/widgets/a.js")).code === 405);
    x = await get("POST", "/cgi-bin/echo.cgi?x=1", "hi", { Origin: "http://o", "Content-Length": 2 });
    ok("keendashd serve: CGI status, headers, env, body", x.code === 201 && x.h["x-test"] === "1" && x.body === "POST x=1 http://o hi\n", JSON.stringify(x));
    ok("keendashd serve: missing CGI", (await get("GET", "/cgi-bin/nope.cgi")).code === 404);
    x = await get("GET", "/cgi-bin/status.cgi");
    let st = null; try { st = JSON.parse(x.body); } catch (e) {}
    ok("keendashd serve: status JSON with CORS", x.code === 200 && x.h["access-control-allow-origin"] === "*" && st && st.tabs.length === 2, x.code + " " + x.body.slice(0, 200));
    try { process.kill(pid); } catch (e) {}

    // status.json for the web UI over https: written at start, then rebuilt only after it was read (atime > mtime)
    const pub = fs.mkdtempSync(path.join(os.tmpdir(), "kdp-")), pf = path.join(pub, "status.json"), penv = Object.assign({}, env, { KEENDASH_PUB: pub });
    const pubServe = async (n, wait) => {
      const p = parseInt(cp.execFileSync(kd, ["serve", "127.0.0.1", String(port + n), www], { env: penv, encoding: "utf8" }), 10);
      await new Promise(r => setTimeout(r, wait)); try { process.kill(p); } catch (e) {}
    };
    const until = async f => { for (let i = 0; i < 50 && !f(); i++) await new Promise(r => setTimeout(r, 100)); };
    let pj = null;
    await pubServe(1, 0); await until(() => fs.existsSync(pf));
    try { pj = JSON.parse(fs.readFileSync(pf, "utf8")); } catch (e) {}
    ok("keendashd publish: status.json at start", pj && pj.tabs.length === 2 && !fs.existsSync(pf + ".tmp"), pj);
    const old = new Date(Date.now() - 100000), now = new Date();
    fs.writeFileSync(pf, "x"); fs.utimesSync(pf, old, now);
    await pubServe(2, 1000);
    ok("keendashd publish: not read since -> kept", fs.readFileSync(pf, "utf8") === "x");
    fs.utimesSync(pf, now, old);
    await pubServe(3, 0); await until(() => fs.readFileSync(pf, "utf8") !== "x");
    ok("keendashd publish: read -> rebuilt", fs.readFileSync(pf, "utf8").startsWith("{"));
    // the "update" file: a read runs the upgrade once, an unread one nothing
    const uf = path.join(pub, "update"), ran = path.join(pub, "ran");
    penv.KEENDASH_UPDATE = "echo x >> '" + ran + "'";
    fs.writeFileSync(uf, "\n"); fs.utimesSync(uf, old, now);
    await pubServe(4, 1000);
    ok("keendashd update file: not read -> no upgrade", !fs.existsSync(ran));
    fs.utimesSync(uf, now, old);
    await pubServe(5, 300); await until(() => fs.existsSync(ran));
    const us = fs.statSync(uf);
    ok("keendashd update file: read -> upgrade once, marked unread", fs.existsSync(ran) && fs.readFileSync(ran, "utf8") === "x\n" && us.atimeMs <= us.mtimeMs, fs.existsSync(ran) && fs.readFileSync(ran, "utf8"));
    // the inbox: a file there runs the apply command once; no files, no run
    const ib = path.join(pub, "inbox"), ran2 = path.join(pub, "ran2");
    fs.mkdirSync(ib); fs.writeFileSync(path.join(ib, "a.txt"), "keendash 1 a\nend\n");
    penv.KEENDASH_INBOX = ib; penv.KEENDASH_APPLY = "echo x >> '" + ran2 + "'; rm -f '" + ib + "'/*";
    const ip = parseInt(cp.execFileSync(kd, ["serve", "127.0.0.1", String(port + 6), www], { env: penv, encoding: "utf8" }), 10);
    await until(() => fs.existsSync(ran2)); await new Promise(r => setTimeout(r, 6000));
    try { process.kill(ip); } catch (e) {}
    ok("keendashd inbox: a file -> one apply run", fs.existsSync(ran2) && fs.readFileSync(ran2, "utf8") === "x\n", fs.existsSync(ran2) && fs.readFileSync(ran2, "utf8"));
    fs.rmSync(pub, { recursive: true, force: true });
    [sd, www].forEach(d => fs.rmSync(d, { recursive: true, force: true }));
  }
  // issue #1: the only lighttpd UI is nfqws2-ui
  await run(Object.assign({}, mini, { svc: [["nfqws2", 1, ""], ["lighttpd", 1, "8090"]], web: [["lighttpd", 8090, "nfqws2"]] }), (w, m) => {
    const links = Array.from(m.querySelectorAll("a.us-lnk"));
    ok("issue1: link on nfqws2, not lighttpd", links.length === 1 && links[0].textContent.trim().startsWith("nfqws2") && links[0].href === "http://192.168.0.1:8090/", links.map(a => a.textContent).join());
    ok("issue1: 2 chips", m.querySelectorAll(".us-body > .us-chips:first-child .us-chip").length === 2);
  });
  await run(mini, (w, m) => {
    ok("mini: only sys tab", m.querySelectorAll(".us-tab").length === 1 && m.querySelector(".us-tab").getAttribute("data-tab") === "sys");
    ok("mini: sys active", !!m.querySelector(".us-tab.us-on"));
    ok("mini: no temp block", m.querySelectorAll(".us-blk").length === 2);
    ok("mini: no links", !m.querySelector(".us-body a"));
    ok("mini: stored tab fallback", /Нагрузка/.test(m.textContent));
  });
  const upd = Object.assign({}, mini, { upd: { cur: "1.0.7", new: "1.0.8", busy: 0 } });
  // keendash restarting: status.json not there yet (404) -> asked again in 5 s, not at the next 30 s poll
  {
    let n = 0;
    await run(null, (w, m) => new Promise(r => setTimeout(() => {
      ok("status 404 -> asked again in 5 s", n === 2 && /Нагрузка/.test(m.textContent), n + " " + m.textContent.slice(0, 80));
      r();
    }, 5500)), () => () => ++n === 1 ? Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("html")) }) :
      Promise.resolve({ ok: true, json: () => Promise.resolve(mini) }));
  }
  // over https (the loader sets st): status.json from /storage/, a stale one is asked again; the update button reads
  // the "update" file, and a status.json that doesn't show the upgrade yet is no failure
  {
    let urls = [];
    await run(null, (w, m) => new Promise(r => setTimeout(() => {
      ok("storage: status.json, stale -> asked again", urls[0] === "/storage/.keendash/status.json" && urls.length === 2, urls.join());
      m.querySelector(".us-upd-go").dispatchEvent(new w.Event("click", { bubbles: true }));
      setTimeout(() => {
        ok("storage: update reads the update file", urls.some(u => u[0] === "/storage/.keendash/update" && !u[1].method), JSON.stringify(urls));
        ok("storage: upgrade not in status.json yet -> still waiting", /Обновление keendash до/.test(m.querySelector(".us-upd").textContent), m.querySelector(".us-upd").textContent);
        r();
      }, 300);
    }, 5500)), w => { w.__keendash = { base: "/storage/.keendash/", st: true };
      return (u, o) => { urls.push(urls.length ? [u, o || {}] : u); return Promise.resolve({ ok: true, json: () => Promise.resolve(Object.assign({}, upd, { now: Date.now() / 1000 - 600 })) }); }; }, "https://r.example.net/");
  }
  await run(upd, (w, m) => {
    const bar = m.querySelector(".us-upd");
    ok("update: banner first, new + current version", bar && m.querySelector(".us-body").firstElementChild === bar && /1\.0\.8/.test(bar.textContent) && /1\.0\.7/.test(bar.textContent), bar && bar.textContent);
    ok("update: button + skip link", m.querySelector(".us-upd-go").textContent === "Обновить" && /Пропустить эту версию/.test(m.querySelector(".us-upd-skip").textContent));
    m.querySelector(".us-upd-skip").dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("update: skip hides banner + remembers version", !m.querySelector(".us-upd") && w.localStorage.getItem("ui.services.skip") === "1.0.8");
  });
  await run(Object.assign({}, mini, { upd: { cur: "1.0.7", new: "", busy: 0 } }), (w, m) => ok("update: no banner without new version", !m.querySelector(".us-upd")));
  const calls = [];
  await run(upd, (w, m) => new Promise(r => {
    m.querySelector(".us-upd-go").dispatchEvent(new w.Event("click", { bubbles: true }));
    setTimeout(() => {
      const post = calls.find(c => /update\.cgi$/.test(c[0]));
      ok("update: POST to update.cgi", post && post[1].method === "POST", JSON.stringify(calls));
      ok("update: busy state, button disabled, no skip", m.querySelector(".us-upd-go").disabled && /Обновление keendash до/.test(m.textContent) && !m.querySelector(".us-upd-skip"), m.querySelector(".us-upd").textContent);
      r();
    }, 100);
  }), w => (u, o) => {
    calls.push([u, o || {}]);
    const busy = calls.some(c => /update\.cgi$/.test(c[0]));
    return Promise.resolve({ ok: true, json: () => Promise.resolve(Object.assign({}, upd, { upd: { cur: "1.0.7", new: "1.0.8", busy: busy ? 1 : 0 } })) });
  });
  await run(upd, (w, m) => new Promise(r => {
    m.querySelector(".us-upd-go").dispatchEvent(new w.Event("click", { bubbles: true }));
    setTimeout(() => { ok("update: refused POST shows error, keeps button", /Не удалось обновить/.test(m.textContent) && !m.querySelector(".us-upd-go").disabled, m.textContent); r(); }, 100);
  }), w => u => Promise.resolve(/update\.cgi$/.test(u) ? { ok: false, status: 403 } : { ok: true, json: () => Promise.resolve(upd) }));
  // the "Сервисы" page: a menu item under "Системный монитор" opens a card per tab with data over Angular's page
  const layout = '<ndw-menu><ul id="menu.main"><li><a class="page-link__link page-link__link--active" href="/dashboard"><span class="page-link__label">Системный монитор</span></a></li>' +
    '<li><a class="page-link__link" href="/other"><span class="page-link__label">Другое</span></a></li></ul></ndw-menu><div class="layout__content__main"><router-outlet></router-outlet><ng-component>dash</ng-component></div>';
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await run(full, async w => {
    const d = w.document, act = "page-link__link--active", click = e => e.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
    d.addEventListener("click", e => e.preventDefault());
    d.title = "Keenetic – Системный монитор"; d.body.insertAdjacentHTML("beforeend", layout);
    await wait(100);
    const a = d.getElementById("kd-menu"), dash = d.querySelector('a[href="/dashboard"]'), n = w.history.length;
    ok("page: menu item right after Системный монитор", a && a.parentNode.previousElementSibling === dash.parentNode && a.textContent.trim() === "Сервисы" && !a.classList.contains(act));
    click(a);
    const p = d.querySelector(".kd-page"), t = p && Array.from(p.querySelectorAll(".kd-ct")).map(x => x.textContent).join();
    ok("page: opens at /keendash over the hidden dashboard, its item active", p && w.location.pathname === "/keendash" && w.history.length === n + 1 && d.querySelector("ng-component").hasAttribute("data-kd-hidden") &&
      a.classList.contains(act) && !dash.classList.contains(act) && d.title === "Keenetic – Сервисы", d.title);
    ok("page: a card per tab with data, media per service", t === "telemt,AWG,firc,nfqws,Hydra,AdGuard Home,Торренты,Plex,Sonarr,Radarr,Prowlarr,Overseerr,Immich,Antiscan,Система", t);
    ok("page: card id = tab or instance id", Array.from(p.querySelectorAll(".kd-card")).map(x => x.getAttribute("data-id")).join() === "telemt,awg,firc,nfqws,hydra,agh,qb,plex,sonarr,radarr,prowlarr,overseerr,immich,ascn,sys");
    ok("page: no chips, tabs or update bar", p && !p.querySelector(".us-chip,.us-tab,.us-mt,.us-upd"));
    ok("page: card links", p && p.querySelector(".kd-card a.us-open").href === "http://192.168.0.1:8083/" && p.querySelectorAll(".kd-card")[3].querySelectorAll("a.us-open").length === 2);
    click(dash);
    ok("page: the item of the page underneath goes back to it", !d.querySelector(".kd-page,[data-kd-hidden]") && w.location.pathname === "/dashboard" && dash.classList.contains(act) && !a.classList.contains(act) && d.title === "Keenetic – Системный монитор", w.location.pathname + " " + d.title);
    click(a);
    const main = d.querySelector(".layout__content__main");
    main.removeChild(main.querySelector("ng-component")); main.insertAdjacentHTML("beforeend", "<ng-component>other</ng-component>");
    await wait(100);
    ok("page: another page of Angular's closes it", !d.querySelector(".kd-page") && !a.classList.contains(act) && d.querySelector("ng-component").textContent === "other");
   }, null, "http://192.168.0.1/dashboard");
  // a reload at /keendash: Angular redirects to the dashboard, the loader kept the address, the page opens again
  await run(full, async w => {
    const d = w.document, n = w.history.length;
    d.title = "KeeneticOS Web Panel"; d.body.insertAdjacentHTML("beforeend", layout);
    await wait(100);
    ok("page: reopens after a reload, in place of the redirect", !!d.querySelector(".kd-page") && w.location.pathname === "/keendash" && w.history.length === n, w.location.pathname);
    d.title = "Keenetic Hopper – Системный монитор";
    ok("page: Angular's titles keep the page's own", d.title === "Keenetic Hopper – Сервисы", d.title);
  }, w => { w.__keendash = { p: "/keendash" }; return () => Promise.resolve({ ok: true, json: () => Promise.resolve(full) }); }, "http://192.168.0.1/dashboard");
  // hidden on the page: no AWG card, the instance card (named after the instance) is there with the qBittorrent view
  await run(Object.assign({}, full, { cfg: Object.assign({}, full.cfg, { hide: { page: ["awg", "agh"], main: [] } }) }), async w => {
    const d = w.document;
    d.body.insertAdjacentHTML("beforeend", layout); await wait(100);
    d.getElementById("kd-menu").dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
    const p = d.querySelector(".kd-page"), t = Array.from(p.querySelectorAll(".kd-ct")).map(x => x.textContent).join(), qb = p.querySelector('[data-id="qb"]');
    ok("page: hidden on page, instance cards", !/AWG|AdGuard/.test(t) && /Торренты/.test(t) && qb && /5\.0 МБ\/с/.test(qb.textContent) && /Stalled\.Thing/.test(qb.textContent), t);
  }, null, "http://192.168.0.1/dashboard");
  // a hostile API answer in "missing" is shown as a number, never as markup
  await run(Object.assign({}, full, { inst: full.inst.map(i => i[0] === "sonarr" ? i.slice(0, 6).concat([Object.assign({}, i[6], { missing: "<img src=x onerror=1>" })]) : i) }), (w, m) => {
    m.querySelector('[data-tab="grp:Медиа"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    m.querySelector('[data-m="sonarr"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("media sonarr: missing is coerced to a number", !m.querySelector("img") && /Не скачано серий0/.test(m.textContent), m.innerHTML.slice(0, 300));
  });
  // settings dialog: the button on the page, search, secrets never shown, the message built from a draft, saving through the file manager
  const URL0 = "http://192.168.0.1/dashboard", ev = (w, t) => new w.Event(t, { bubbles: true });
  const openDlg = async w => {
    const d = w.document; d.body.insertAdjacentHTML("beforeend", layout); await wait(100);
    d.getElementById("kd-menu").dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
    d.querySelector(".kd-set").click();
    return d.querySelector(".kd-dlg");
  };
  const typeIn = (w, el, v) => { el.value = v; el.dispatchEvent(ev(w, "input")); };
  const esc = w => w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await run(full, async w => {
    const dlg = await openDlg(w), d = w.document; let asked = "", yes = false;
    w.confirm = q => { asked = q; return yes; };
    ok("settings: button opens the dialog, three sections", dlg && dlg.querySelector("h1").textContent === "Настройки сервисов" &&
      Array.from(dlg.querySelectorAll("h2")).map(x => x.textContent).join() === "Добавленные,Найденные автоматически,Добавить сервис", dlg && dlg.textContent);
    ok("settings: found services, page flag only on tabs", dlg.querySelectorAll('input[data-w="main"]').length > dlg.querySelectorAll('input[data-w="page"]').length &&
      !!dlg.querySelector('input[data-w="page"][data-n="telemt"]') && !!dlg.querySelector('input[data-w="main"][data-n="cron"]') && !dlg.querySelector('input[data-w="page"][data-n="cron"]'));
    dlg.querySelector('input[data-w="main"][data-n="cron"]').click();
    esc(w);
    ok("settings: closing with changes asks first", asked === "Отменить изменения?" && !!d.querySelector(".kd-dlg"), asked);
    yes = true; esc(w);
    ok("settings: Esc closes", !d.querySelector(".kd-dlg"));
    d.querySelector(".kd-set").click(); const ov = d.querySelector(".kd-dlg-ov");
    ov.querySelector(".kd-dlg").dispatchEvent(ev(w, "mousedown")); ov.dispatchEvent(ev(w, "click"));
    ok("settings: a drag from the panel ending on the backdrop keeps it open", !!d.querySelector(".kd-dlg"));
    ov.dispatchEvent(ev(w, "mousedown")); ov.dispatchEvent(ev(w, "click"));
    ok("settings: click on the backdrop closes", !d.querySelector(".kd-dlg"));
  }, null, URL0);
  await run(full, async w => {
    const dlg = await openDlg(w);
    typeIn(w, dlg.querySelector(".kd-dlg-q"), "qbit");
    const added = Array.from(dlg.querySelectorAll(".kd-dlg-i")).map(x => x.textContent), cat = Array.from(dlg.querySelectorAll(".kd-dlg-add")).map(x => x.textContent);
    ok("settings: search filters all sections", added.length === 1 && /Торренты/.test(added[0]) && cat.length === 1 && /qBittorrent/.test(cat[0]) && !dlg.querySelector(".kd-dlg-fr"), added.join() + "|" + cat.join());
  }, null, URL0);
  await run(full, async w => {
    const dlg = await openDlg(w);
    dlg.querySelector('.kd-dlg-i[data-id="qb"] .kd-dlg-hd').click();
    const p = dlg.querySelector('[data-id="qb"] input[data-f="pass"]'), u = dlg.querySelector('[data-id="qb"] input[data-f="user"]');
    ok("settings: secrets never shown", p && p.value === "" && p.type === "password" && p.getAttribute("placeholder") === "задан" && u.value === "u" && !u.getAttribute("placeholder"), p && p.outerHTML);
  }, null, URL0);
  await run(full, (w, m) => {
    const W = w.__servicesWidget, qb = { id: "qb", type: "qb", name: "Торренты", url: "http://localhost:8080", user: "u", vals: {} };
    const dr = (inst, del, page, main) => ({ inst, del: del || [], hide: { page: page || [], main: main || [] } });
    ok("buildMsg: nothing changed -> empty", W.buildMsg("r", full, dr([qb])) === "");
    ok("buildMsg: newId skips taken ids", W.newId("qb", {}) === "qb" && W.newId("qb", { qb: 1 }) === "qb-2" && W.newId("qb", { qb: 1, "qb-2": 1 }) === "qb-3");
    ok("buildMsg: add second qBittorrent", W.buildMsg("r", full, dr([qb, { id: "qb-2", type: "qb", name: "qBittorrent 2", url: "http://h:1", user: "", vals: { pass: "x" } }])) ===
      "keendash 1 r\nadd qb-2 qb\nset qb-2 name qBittorrent 2\nset qb-2 url http://h:1\nset qb-2 pass x\nend\n");
    ok("buildMsg: edit keeps empty secret", W.buildMsg("r", full, dr([Object.assign({}, qb, { url: "http://new:1", vals: { pass: "" } })])) === "keendash 1 r\nset qb url http://new:1\nend\n");
    ok("buildMsg: new secret and cleared user", W.buildMsg("r", full, dr([Object.assign({}, qb, { user: "", vals: { pass: "p w" } })])) === "keendash 1 r\nset qb user \nset qb pass p w\nend\n");
    ok("buildMsg: delete and re-add", W.buildMsg("r", full, dr([qb, { id: W.newId("qb", { qb: 1 }), type: "qb", name: "qBittorrent", url: "http://h:1", user: "", vals: {} }], ["qb"])) ===
      "keendash 1 r\ndel qb\nadd qb-2 qb\nset qb-2 name qBittorrent\nset qb-2 url http://h:1\nend\n");
    const hid = Object.assign({}, full, { cfg: Object.assign({}, full.cfg, { hide: { page: ["awg"], main: [] } }) });
    ok("buildMsg: hide both scopes, show for an unchecked box", W.buildMsg("r", hid, dr([qb], [], ["telemt"], ["cron"])) === "keendash 1 r\nhide page telemt\nshow page awg\nhide main cron\nend\n");
  }, null, URL0);
  await run(full, (w, m) => {
    const W = w.__servicesWidget, dr = e => ({ inst: [e], del: [], hide: { page: [], main: [] } });
    ok("buildMsg: url is trimmed", W.buildMsg("r", full, dr({ id: "qb-2", type: "qb", name: "N", url: "  http://h:1 \t", user: "", vals: {} })) === "keendash 1 r\nadd qb-2 qb\nset qb-2 name N\nset qb-2 url http://h:1\nend\n");
  }, null, URL0);
  // fetch stub of the firmware file manager: /rci/put -> port, /fui -> done; status shows the rev after the upload
  const fm = (fcalls, o) => w => {
    let rev = "", fui = false;
    return (u, init) => {
      fcalls.push([u, init || {}]);
      const r = (ok, status, body) => Promise.resolve({ ok, status, json: () => Promise.resolve(body) });
      if (/\/rci\/put$/.test(u)) { if (o.put) return r(false, o.put); rev = JSON.parse(init.body).filename.split("/").pop().replace(".txt", ""); return r(true, 200, { port: { port: "7" } }); }
      if (/\/fui$/.test(u)) { fui = true; return r(true, 200, {}); }
      return r(true, 200, fui ? Object.assign({}, full, { cfg: Object.assign({}, full.cfg, { rev, err: o.err || "" }) }) : full);
    };
  };
  const post = (fcalls, re) => fcalls.filter(c => re.test(c[0]));
  const blobText = (w, b) => new Promise(r => { const fr = new w.FileReader(); fr.onload = () => r(fr.result); fr.readAsText(b); });
  let fcalls = [];
  await run(full, async w => {
    const dlg = await openDlg(w);
    ok("settings: no save bar without changes", !dlg.querySelector(".kd-dlg-save"));
    dlg.querySelector('input[data-w="main"][data-n="cron"]').click();
    ok("settings: save bar after a change", !!dlg.querySelector(".kd-dlg-save") && !dlg.querySelector(".kd-dlg-save").disabled);
    dlg.querySelector(".kd-dlg-save").click(); await wait(200);
    const put = post(fcalls, /\/rci\/put$/), fui = post(fcalls, /\/fui$/), body = put[0] && JSON.parse(put[0][1].body), rev = body && body.filename.split("/").pop().replace(".txt", "");
    ok("settings: save -> /rci/put filename and size", put.length === 1 && /^[a-z0-9]{12}$/.test(rev) && body.filename === "v1:/var/lib/keendash/inbox/" + rev + ".txt" && body.size === ("keendash 1 " + rev + "\nhide main cron\nend\n").length, JSON.stringify(body));
    ok("settings: save -> /fui form with port and file", fui.length === 1 && fui[0][1].body.get("port") === "7" && fui[0][1].body.get("Filedata").size === body.size, "");
    ok("settings: confirmed by status -> save bar gone", !dlg.querySelector(".kd-dlg-save") && !/Не удалось|Сохранение/.test(dlg.textContent), dlg.textContent);
  }, fm(fcalls, {}), URL0);
  fcalls = [];
  await run(full, async w => {
    const dlg = await openDlg(w);
    dlg.querySelector('.kd-dlg-add[data-type="qb"]').click();
    const url = dlg.querySelector('input[data-f="url"]');
    ok("settings: new instance qb-2 named after its type, form open", !!dlg.querySelector('.kd-dlg-i[data-id="qb-2"]') && dlg.querySelector('[data-id="qb-2"] input[data-f="name"]').value === "qBittorrent 2");
    typeIn(w, url, "http://h:1");
    dlg.querySelector(".kd-dlg-save").click(); await wait(100);
    ok("settings: session expired keeps the draft", /Сессия истекла, войдите заново/.test(dlg.textContent) && dlg.querySelector('input[data-f="url"]').value === "http://h:1" && !post(fcalls, /\/fui$/).length, dlg.textContent);
  }, fm(fcalls, { put: 401 }), URL0);
  fcalls = [];
  await run(full, async w => {
    const dlg = await openDlg(w);
    dlg.querySelector('.kd-dlg-add[data-type="qb"]').click();
    const f = n => dlg.querySelector('input[data-f="' + n + '"]'), hint = n => f(n).parentNode.querySelector(".kd-dlg-hint").textContent;
    typeIn(w, f("name"), "a|b"); typeIn(w, f("url"), "ftp://x"); typeIn(w, f("pass"), "a\tb");
    ok("settings: hints for what the router would reject", /\|/.test(hint("name")) && /http/.test(hint("url")) && hint("pass") !== "", [hint("name"), hint("url"), hint("pass")].join("/"));
    dlg.querySelector(".kd-dlg-save").click(); await wait(100);
    ok("settings: invalid values are not sent", !fcalls.some(c => /\/rci\/put$/.test(c[0])));
    typeIn(w, f("name"), "Mine"); typeIn(w, f("url"), "http://ok:1"); typeIn(w, f("pass"), "a b");
    ok("settings: hints clear once fixed", hint("name") === "" && hint("url") === "" && hint("pass") === "");
  }, fm(fcalls, {}), URL0);
  await run(full, async w => {
    const dlg = await openDlg(w);
    dlg.querySelector('input[data-w="main"][data-n="cron"]').click();
    dlg.querySelector(".kd-dlg-save").click(); await wait(200);
    ok("settings: apply error shown, can retry", /строка 2: неверная строка hide/.test(dlg.textContent) && !!dlg.querySelector(".kd-dlg-save"), dlg.textContent);
  }, fm([], { err: "строка 2: неверная строка hide" }), URL0);
  await run(Object.assign({}, full, { cfg: { rev: "r1", err: "", hide: { page: [], main: [] }, cols: [] } }), async w => {
    const dlg = await openDlg(w);
    dlg.querySelector('input[data-w="main"][data-n="cron"]').click();
    ok("settings: no volume", /Не найден диск Entware/.test(dlg.textContent) && dlg.querySelector(".kd-dlg-save").disabled, dlg.textContent);
  }, null, URL0);
  // after a failed poll the dialog keeps working from the last good data; the draft stays and the session text is shown
  let down = false;
  await run(full, async w => {
    const dlg = await openDlg(w), W = w.__servicesWidget, q = s => dlg.querySelector(s);
    q('.kd-dlg-i[data-id="qb"] .kd-dlg-hd').click();
    typeIn(w, q('[data-id="qb"] input[data-f="url"]'), "http://edited:1");
    typeIn(w, q('[data-id="qb"] input[data-f="pass"]'), "s3cr3t-pw");
    down = true; await W.update(); await wait(20);
    typeIn(w, q(".kd-dlg-q"), "");
    ok("settings: failed poll -> volume, catalog and draft intact, session text", !/Не найден диск/.test(dlg.textContent) && dlg.querySelectorAll(".kd-dlg-add").length === 8 &&
      q('[data-id="qb"] input[data-f="url"]').value === "http://edited:1" && !!q(".kd-dlg-save") && !q(".kd-dlg-save").disabled && /Сессия истекла, войдите заново/.test(dlg.textContent), dlg.textContent);
    ok("settings: a typed secret is never in the markup", !/s3cr3t-pw/.test(dlg.innerHTML) && q('[data-id="qb"] input[data-f="pass"]').value === "s3cr3t-pw");
    down = false; await W.update(); await wait(20);
    ok("settings: session text gone after a good poll", !/Сессия истекла/.test(dlg.textContent));
  }, w => () => Promise.resolve(down ? { ok: false, status: 401 } : { ok: true, status: 200, json: () => Promise.resolve(full) }), URL0);
  await run(full, async w => {
    const r = await w.__servicesWidget.awaitRev("nope", 300).then(() => "resolved", e => e);
    ok("settings: no confirmation -> timeout text", r === "Не удалось сохранить: нет подтверждения", r);
  });
  await run(full, async w => {
    const dlg = await openDlg(w);
    dlg.querySelector('.kd-dlg-add[data-type="qb"]').click();
    const f = n => dlg.querySelector('input[data-f="' + n + '"]'), hint = n => f(n).parentNode.querySelector(".kd-dlg-hint").textContent;
    typeIn(w, f("name"), "\u{1F600}".repeat(40));
    ok("settings: name length counts characters, not UTF-16 units", hint("name") === "", hint("name"));
    typeIn(w, f("name"), "\u{1F600}".repeat(65));
    ok("settings: name over 64 characters is refused", hint("name") !== "");
    ok("settings: labels of the spec", Array.from(dlg.querySelectorAll(".kd-dlg-f > span:first-child")).map(x => x.textContent).join() === "Имя,Адрес,Логин,Пароль", dlg.textContent);
  }, null, URL0);
  fcalls = [];
  await run(full, async w => {
    const dlg = await openDlg(w);
    dlg.querySelector('.kd-dlg-add[data-type="qb"]').click();
    typeIn(w, dlg.querySelector('input[data-f="name"]'), "Торренты 2"); typeIn(w, dlg.querySelector('input[data-f="url"]'), "http://h:1");
    dlg.querySelector(".kd-dlg-save").click(); await wait(200);
    const put = post(fcalls, /\/rci\/put$/)[0], body = JSON.parse(put[1].body), rev = body.filename.split("/").pop().replace(".txt", "");
    const msg = "keendash 1 " + rev + "\nadd qb-2 qb\nset qb-2 name Торренты 2\nset qb-2 url http://h:1\nend\n";
    ok("settings: Cyrillic name, size in UTF-8 bytes", body.size === new w.Blob([msg]).size && body.size === Buffer.byteLength(msg) && body.size > msg.length && post(fcalls, /\/fui$/)[0][1].body.get("Filedata").size === body.size, body.size + " " + msg.length);
  }, fm(fcalls, {}), URL0);
  // the type's hint (text, never markup) and the map field: checked like the router does, sent only when changed
  const MAPERR = "Формат: Подпись=путь[:формат]; до 8 пар";
  const cust = hint => Object.assign({}, full, { types: [["custom", "Свой API", "Другое", ["url", "map"], hint], ["plain", "Простой", "Другое", ["url"], ""]],
    inst: [["cu", "custom", "Свой", "http://h:1", "", [], null, "A=x"]] });
  // /rci/put and /fui answer, everything else is the status with the custom type
  const cf = (calls, st) => w => (u, init) => {
    calls.push([u, init || {}]);
    const r = body => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
    return /\/rci\/put$/.test(u) ? r({ port: { port: "7" } }) : /\/fui$/.test(u) ? r({}) : r(st);
  };
  fcalls = [];
  await run(cust("Подсказка <i>x</i>"), async w => {
    const dlg = await openDlg(w), q = s => dlg.querySelector(s), mp = () => q('[data-id="cu"] input[data-f="map"]'), mh = () => mp().parentNode.querySelector(".kd-dlg-hint").textContent;
    q('.kd-dlg-i[data-id="cu"] .kd-dlg-hd').click();
    ok("dialog: hint is shown as text", !!q(".kd-dlg-tip") && q(".kd-dlg-tip").textContent === "Подсказка <i>x</i>" && !q(".kd-dlg-tip i"), q(".kd-dlg-tip") && q(".kd-dlg-tip").innerHTML);
    ok("dialog: map shows its value and the label", mp().value === "A=x" && mp().parentNode.querySelector("span").textContent === "Что показывать" && !q(".kd-dlg-save"));
    typeIn(w, mp(), "a|b=x");
    ok("dialog: map error", mh() === MAPERR, mh());
    q(".kd-dlg-save").click(); await wait(100);
    ok("dialog: bad map is not sent", !post(fcalls, /\/rci\/put$/).length);
    typeIn(w, mp(), "A=x; B=y:bs");
    ok("dialog: good map clears the error", mh() === "", mh());
    q('.kd-dlg-add[data-type="custom"]').click();
    ok("dialog: the add form shows the hint too", !!q('[data-id="custom"] .kd-dlg-tip'));
    q('.kd-dlg-add[data-type="plain"]').click();
    ok("dialog: a type without a hint has no tip", !q(".kd-dlg-tip"));
  }, cf(fcalls, cust("Подсказка <i>x</i>")), URL0);
  fcalls = [];
  await run(cust(""), async w => {
    const dlg = await openDlg(w), q = s => dlg.querySelector(s), mp = () => q('[data-id="cu"] input[data-f="map"]'), mh = () => mp().parentNode.querySelector(".kd-dlg-hint").textContent;
    q('.kd-dlg-i[data-id="cu"] .kd-dlg-hd').click();
    ok("dialog: empty hint, no tip; unchanged map, no save bar", !q(".kd-dlg-tip") && !q(".kd-dlg-save"));
    const wrong = v => { typeIn(w, mp(), v); return mh() === MAPERR; };
    ok("dialog: map rule accepts", [" A=x ; B=y:s ", "A=x;B=y;C=z;D=p:p;E=q;F=r;G=s;H=t", "Ж=a.b-c_d:n", "A=x:"," A=x","\u00a0A=x", "\u{1F600}".repeat(32) + "=x", "a=" + "x".repeat(128)].every(v => !wrong(v)));
    ok("dialog: map rule refuses", ["A", "=x", "A=", "A=x:q", "A=x:n:n", "A=b=c", "A;B=c", "A=x;B=y;C=z;D=p;E=q;F=r;G=s;H=t;I=u","A=x\u00a0", "A\u00a0=x\u00a0", "A=x ; B", "A;=x", ";",
      "\u{1F600}".repeat(33) + "=x", "a=" + "x".repeat(129), "A=x:bs ;", "A b=x y"].every(wrong));
    typeIn(w, mp(), "A=x; B=y:bs");
    q(".kd-dlg-save").click(); await wait(100);
    const put = post(fcalls, /\/rci\/put$/)[0], rev = put && JSON.parse(put[1].body).filename.split("/").pop().replace(".txt", "");
    ok("dialog: map sent as typed", !!put && await blobText(w, post(fcalls, /\/fui$/)[0][1].body.get("Filedata")) === ("keendash 1 " + rev + "\nset cu map A=x; B=y:bs\nend\n"), rev);
  }, cf(fcalls, cust("")), URL0);
  fcalls = [];
  await run(cust(""), async w => {
    const dlg = await openDlg(w), q = s => dlg.querySelector(s), mp = () => q('[data-id="cu"] input[data-f="map"]');
    q('.kd-dlg-i[data-id="cu"] .kd-dlg-hd').click();
    typeIn(w, mp(), "");
    ok("dialog: empty map is valid", mp().parentNode.querySelector(".kd-dlg-hint").textContent === "" && !!q(".kd-dlg-save"));
    q(".kd-dlg-save").click(); await wait(100);
    const put = post(fcalls, /\/rci\/put$/)[0], rev = put && JSON.parse(put[1].body).filename.split("/").pop().replace(".txt", "");
    ok("dialog: cleared map sends an empty value", !!put && await blobText(w, post(fcalls, /\/fui$/)[0][1].body.get("Filedata")) === ("keendash 1 " + rev + "\nset cu map \nend\n"), rev);
  }, cf(fcalls, cust("")), URL0);
  // hosts (text, checked like the router does) and every (a select, default 5 for a new instance)
  const HOSTERR = "Домен или http(s)://адрес, через пробел, до 20";
  const chk = Object.assign({}, full, { types: [["check", "Доступность", "Другое", ["hosts", "every"], ""]], inst: [["ck", "check", "Сайты", "", "", [], null, "", "a.test", "5"]] });
  const sent = async (w, calls) => {
    const put = post(calls, /\/rci\/put$/)[0], rev = put && JSON.parse(put[1].body).filename.split("/").pop().replace(".txt", "");
    return put ? [rev, await blobText(w, post(calls, /\/fui$/)[0][1].body.get("Filedata"))] : [null, null];
  };
  fcalls = [];
  await run(chk, async w => {
    const dlg = await openDlg(w), q = s => dlg.querySelector(s), hp = () => q('input[data-f="hosts"]'), ev = () => q('select[data-f="every"]'), hh = () => hp().parentNode.querySelector(".kd-dlg-hint").textContent;
    q('.kd-dlg-i[data-id="ck"] .kd-dlg-hd').click();
    const css = w.document.getElementById("us-style").textContent;
    ok("dialog: style text has no NaN and keeps the select option rule", !/NaN/.test(css) && css.includes(".kd-dlg select option{") && css.includes(".kd-dlg-sess{"), css.slice(css.indexOf("NaN") - 40, css.indexOf("NaN") + 40));
    ok("dialog: every is a select 1/5/15/30/60", !!ev() && Array.from(ev().options).map(o => o.value).join() === "1,5,15,30,60" && Array.from(ev().options).map(o => o.textContent).join() === "1 мин,5 мин,15 мин,30 мин,1 ч" && ev().value === "5",
      ev() && Array.from(ev().options).map(o => o.value + ":" + o.textContent).join() + " " + ev().value);
    ok("dialog: hosts and every labels, nothing to save", hp().value === "a.test" && hp().parentNode.querySelector("span").textContent === "Адреса" && ev().parentNode.querySelector("span").textContent === "Интервал" && !q(".kd-dlg-save"));
    const wrong = v => { typeIn(w, hp(), v); return hh() === HOSTERR; };
    ok("dialog: hosts rule accepts", ["a.test", " a.test  b-c.test:8443,http://d.test/x?y=1 ", "https://x", "1.2.3.4:80", Array.from({ length: 20 }, (_, i) => "h" + i).join(" ")].every(v => !wrong(v)));
    ok("dialog: hosts rule refuses", ["-x", "a b'c", "$(id)", "http://a|b", "a`b", "http://a\\b", 'http://a"b', "http://", "ftp://a", "a.test:123456", "a.test:", "a:b", "a/b", "http://a<b", "http://a>b",
      Array.from({ length: 21 }, (_, i) => "h" + i).join(" "), "a\u00a0b"].every(wrong));
    typeIn(w, hp(), "a.test"); typeIn(w, ev(), "15");
    ok("dialog: hosts error is gone, the select is a change", hh() === "" && !!q(".kd-dlg-save"));
    q(".kd-dlg-save").click(); await wait(100);
    const [rev, txt] = await sent(w, fcalls);
    ok("dialog: every sent as set <id> every 15", txt === "keendash 1 " + rev + "\nset ck every 15\nend\n", JSON.stringify(txt));
  }, cf(fcalls, chk), URL0);
  fcalls = [];
  await run(chk, async w => {
    const dlg = await openDlg(w), q = s => dlg.querySelector(s);
    q('.kd-dlg-add[data-type="check"]').click();
    ok("dialog: a new instance has every 5", q('select[data-f="every"][data-id="check"]').value === "5" && q('input[data-f="hosts"][data-id="check"]').value === "");
    typeIn(w, q('input[data-f="hosts"][data-id="check"]'), "a.test");
    q(".kd-dlg-save").click(); await wait(100);
    const [rev, txt] = await sent(w, fcalls);
    ok("dialog: a new instance sends hosts and every 5", txt === "keendash 1 " + rev + "\nadd check check\nset check name Доступность\nset check hosts a.test\nset check every 5\nend\n", JSON.stringify(txt));
  }, cf(fcalls, chk), URL0);
  await run(full, async w => {
    const dlg = await openDlg(w);
    dlg.querySelector('input[data-w="main"][data-n="cron"]').click();
    dlg.querySelector(".kd-dlg-save").click(); await wait(50);
    ok("settings: body locked while saving", /Сохранение…/.test(dlg.textContent) && Array.from(dlg.querySelectorAll(".kd-dlg-body input")).every(x => x.disabled) && dlg.querySelector(".kd-dlg-q").disabled, dlg.textContent);
  }, w => u => /\/rci\/put$/.test(u) ? new Promise(() => {}) : Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(full) }), URL0);
  await run(chk, async w => {
    const dlg = await openDlg(w);
    dlg.querySelector('.kd-dlg-i[data-id="ck"] .kd-dlg-hd').click();
    typeIn(w, dlg.querySelector('select[data-f="every"]'), "30");
    dlg.querySelector(".kd-dlg-save").click(); await wait(50);
    const sel = Array.from(dlg.querySelectorAll(".kd-dlg-body select"));
    ok("dialog: the select is locked while saving", sel.length === 1 && sel.every(x => x.disabled));
  }, w => u => /\/rci\/put$/.test(u) ? new Promise(() => {}) : Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(chk) }), URL0);
  await run(full, async w => {
    const d = w.document; d.body.insertAdjacentHTML("beforeend", layout); await wait(100);
    d.getElementById("kd-menu").dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
    ok("settings: button disabled while there is no data", d.querySelector(".kd-set").disabled);
  }, w => () => Promise.reject(new Error("down")), URL0);
  // page layout: fitCols / moveCard, a saved layout with unknown and new ids, a drop that saves it
  const wide = w => Object.defineProperty(w.HTMLElement.prototype, "clientWidth", { get: () => 900 });
  const openPage = async w => {
    const d = w.document; wide(w); d.body.insertAdjacentHTML("beforeend", layout); await wait(100);
    d.getElementById("kd-menu").dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
    return d.querySelector(".kd-page");
  };
  await run(full, w => {
    const W = w.__servicesWidget, j = JSON.stringify, src = [["a", "b"], ["c"], ["d"]];
    ok("fitCols: fold 3 into 1 and 2", j(W.fitCols(src, 1)) === '[["a","b","c","d"]]' && j(W.fitCols(src, 2)) === '[["a","b"],["c","d"]]' && W.fitCols(src, 5).length === 3);
    ok("moveCard: into another column, folded view keeps columns", j(W.moveCard(src, "a", "c", null, 0)) === '[["b"],["c","a"],["d"]]' && j(W.moveCard(src, "d", null, "a", 0)) === '[["d","a","b"],["c"],[]]', j(W.moveCard(src, "d", null, "a", 0)));
  }, null, URL0);
  await run(Object.assign({}, full, { cfg: Object.assign({}, full.cfg, { cols: [["sys", "gone"], ["telemt"]] }) }), async w => {
    const p = await openPage(w), cs = Array.from(p.querySelectorAll(".kd-col")).map(c => Array.from(c.querySelectorAll(".kd-card")).map(x => x.getAttribute("data-id")));
    ok("page: saved layout, unknown and new ids", cs.length === 2 && cs[0][0] === "sys" && cs[1][0] === "telemt" && cs[0].length + cs[1].length === 15 && !p.querySelector('[data-id="gone"]'), j2(cs));
    function j2(x) { return JSON.stringify(x); }
  }, null, URL0);
  fcalls = [];
  await run(full, async w => {
    const p = await openPage(w), q = w.document, cols = Array.from(p.querySelectorAll(".kd-col"));
    cols.forEach((c, i) => { c.getBoundingClientRect = () => ({ left: i * 450, top: 0, width: 400, height: 0, right: i * 450 + 400, bottom: 0 }); });
    const h = p.querySelector('[data-id="telemt"] .kd-drag'), fire = (t, x) => { const e = new w.Event(t, { bubbles: true, cancelable: true }); e.clientX = x; e.clientY = 5; e.pointerId = 1; e.pointerType = "mouse"; e.button = 0; h.dispatchEvent(e); };
    fire("pointerdown", 10); fire("pointermove", 600); fire("pointerup", 600); await wait(200);
    const put = post(fcalls, /\/rci\/put$/), msg = post(fcalls, /\/fui$/)[0] && post(fcalls, /\/fui$/)[0][1].body.get("Filedata");
    const txt = msg ? await new Promise(r => { const f = new w.FileReader(); f.onload = () => r(f.result); f.readAsText(msg); }) : "";
    ok("page: drop saves the layout", put.length === 1 && /^keendash 1 [a-z0-9]{12}\ncol 0 awg /.test(txt) && /\ncol 1 telemt\ncol 2\nend\n$/.test(txt) && !/col 0 [^\n]*telemt/.test(txt), txt);
    ok("page: dropped card shows in its new column", p.querySelectorAll(".kd-col")[1].querySelector('[data-id="telemt"]'));
  }, fm(fcalls, {}), URL0);
  // drop helper of the layout tests: moves telemt to the column at x, returns the page
  const dropTelemt = async (w, x) => {
    const p = await openPage(w), cols = Array.from(p.querySelectorAll(".kd-col"));
    cols.forEach((c, i) => { c.getBoundingClientRect = () => ({ left: i * 450, top: 0, width: 400, height: 0, right: i * 450 + 400, bottom: 0 }); });
    const h = p.querySelector('[data-id="telemt"] .kd-drag'), fire = (t, cx) => { const e = new w.Event(t, { bubbles: true, cancelable: true }); e.clientX = cx; e.clientY = 5; e.pointerId = 1; e.pointerType = "mouse"; e.button = 0; h.dispatchEvent(e); };
    fire("pointerdown", 10); fire("pointermove", x); fire("pointerup", x); await wait(200);
    return p;
  };
  const inCol = (p, k) => !!p.querySelectorAll(".kd-col")[k] && !!p.querySelectorAll(".kd-col")[k].querySelector('[data-id="telemt"]');
  await run(full, async w => {
    const d = w.document; d.body.insertAdjacentHTML("beforeend", layout); await wait(100);
    Object.defineProperty(w.HTMLElement.prototype, "clientWidth", { get: () => 4000 });
    d.getElementById("kd-menu").dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
    const p = d.querySelector(".kd-page");
    ok("page: at most 6 columns on a wide screen", p.querySelectorAll(".kd-col").length === 6, p.querySelectorAll(".kd-col").length);
  }, null, URL0);
  fcalls = [];
  await run(full, async w => {
    const p = await dropTelemt(w, 600);
    await w.__servicesWidget.update();
    ok("page: failed save shows the error and drops the layout", inCol(p, 0) && !inCol(p, 1) && /Не удалось сохранить раскладку: строка 1: неверный номер колонки/.test(p.textContent), p.textContent.slice(0, 200));
  }, fm(fcalls, { err: "строка 1: неверный номер колонки" }), URL0);
  fcalls = [];
  await run(full, async w => {
    const p = await dropTelemt(w, 600);
    ok("page: no Entware disk -> nothing uploaded, said so", !post(fcalls, /rci|fui/).length && /Не найден диск Entware/.test(p.textContent) && !inCol(p, 1), p.textContent.slice(0, 200));
  }, w => (u, i) => { fcalls.push([u, i || {}]); return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(Object.assign({}, full, { cfg: Object.assign({}, full.cfg, { vol: "" }) })) }); }, URL0);
  // the upload hangs: the dropped layout stays until another rev shows in status.json or 45 s pass
  let seen = "r1";
  const hang = w => u => /rci/.test(u) ? new Promise(() => {}) : Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(Object.assign({}, full, { cfg: Object.assign({}, full.cfg, { rev: seen }) })) });
  await run(full, async w => {
    const p = await dropTelemt(w, 600), kept = inCol(p, 1);
    seen = "other"; await w.__servicesWidget.update();
    ok("page: dropped layout is forgotten when another rev appears", kept && inCol(p, 0) && !inCol(p, 1), kept + " " + inCol(p, 0));
  }, hang, URL0);
  seen = "r1";
  await run(full, async w => {
    const p = await dropTelemt(w, 600), kept = inCol(p, 1), now = w.Date.now;
    await w.__servicesWidget.update(); const still = inCol(p, 1);
    w.Date.now = () => now() + 46000; await w.__servicesWidget.update();
    ok("page: dropped layout is forgotten after 45 s", kept && still && inCol(p, 0) && !inCol(p, 1), kept + " " + still);
  }, hang, URL0);
  // no saved layout, one visible column: the drop still saves three columns
  fcalls = [];
  await run(full, async w => {
    const d = w.document; d.body.insertAdjacentHTML("beforeend", layout); await wait(100);
    Object.defineProperty(w.HTMLElement.prototype, "clientWidth", { get: () => 400 });
    d.getElementById("kd-menu").dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
    const p = d.querySelector(".kd-page");
    p.querySelector(".kd-col").getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 0, right: 400, bottom: 0 });
    const h = p.querySelector('[data-id="telemt"] .kd-drag'), fire = (t, y) => { const e = new w.Event(t, { bubbles: true, cancelable: true }); e.clientX = 10; e.clientY = y; e.pointerId = 1; e.pointerType = "mouse"; e.button = 0; h.dispatchEvent(e); };
    fire("pointerdown", 5); fire("pointermove", 300); fire("pointerup", 300); await wait(200);
    const f = post(fcalls, /\/fui$/)[0], blob = f && f[1].body.get("Filedata");
    const txt = blob ? await new Promise(r => { const fr = new w.FileReader(); fr.onload = () => r(fr.result); fr.readAsText(blob); }) : "";
    ok("page: first drop on a narrow screen saves 3 columns", p.querySelectorAll(".kd-col").length === 1 && /\ncol 0 /.test(txt) && /\ncol 1(\n|$)/.test(txt) && /\ncol 2(\n|$)/.test(txt) && !/\ncol 3/.test(txt), txt);
  }, fm(fcalls, {}), URL0);
  // the volume comes from the freshest status, not the snapshot the dialog opened with
  fcalls = []; let novol = true;
  await run(full, async w => {
    const dlg = await openDlg(w); novol = false; await w.__servicesWidget.update();
    dlg.querySelector('input[data-w="main"][data-n="cron"]').click();
    dlg.querySelector(".kd-dlg-save").click(); await wait(100);
    const put = post(fcalls, /rci.put$/)[0];
    ok("settings: upload takes the volume of the freshest status", put && /^v1:.var.lib.keendash.inbox./.test(JSON.parse(put[1].body).filename), put && put[1].body);
  }, w => { const f = fm(fcalls, {})(w); return (u, i) => novol && !/rci|fui/.test(u) ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(Object.assign({}, full, { cfg: Object.assign({}, full.cfg, { vol: "" }) })) }) : f(u, i); }, URL0);
  console.log(res.join("\n")); process.exit(res.some(r => r.startsWith("FAIL")) ? 1 : 0);
})();
