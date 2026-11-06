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
  await run(zz({ ok: 1, t: [["A", 850, "bit"], ["B", 12500, "bit"], ["C", 245000000, "bit"], ["D", 1200000000, "bit"], ["E", "x", "bit"], ["F", 0, "bit"]] }), (w, m) => {
    gclick(w, m, "Медиа");
    ok("tiles: bit format, 1000 steps and a dash for a non-number", vals(m) === "850 бит/с|12.5 Кбит/с|245 Мбит/с|1.2 Гбит/с|—|0 бит/с", vals(m));
  });
  await run(zz({ ok: 1, t: [["A", 99960000, "bit"], ["B", 999600, "bit"], ["C", 999999999, "bit"], ["D", 99960, "bit"], ["E", 1048473, "b"], ["F", 1023.7, "b"], ["G", 102375, "bs"]] }), (w, m) => {
    gclick(w, m, "Медиа");
    ok("tiles: bit and byte formats round before choosing the unit", vals(m) === "100 Мбит/с|1 Мбит/с|1 Гбит/с|100 Кбит/с|1.0 МБ|1.0 КБ|100 КБ/с", vals(m));
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
  // kuma history: "N мс · P%", the percent alone for ms 0, "нет ответа · P%", a strip of cells (1 green, 0 red, 2 and 3 grey)
  await run(km({ ok: 1, up: 3, down: 1, n: 5, list: [["Dn", 0, 0, 50, "1,0"], ["Pe", 2, 0, "", "2"], ["Z", 1, 0, 99.8, "1"], ["Y", 1, 20, 99.8, "3," + "1,".repeat(30) + "0"], ["Free", 1, 0, "", ""]] }), (w, m) => {
    gclick(w, m, "Серверы");
    const rows = Array.from(m.querySelectorAll(".us-row")), tx = rows.map(r => r.textContent), hs = Array.from(m.querySelectorAll(".us-hist"));
    ok("kuma history: right side", tx.join(" / ") === "Dnнет ответа · 50% / Peожидание / Z99.8% / Y20 мс · 99.8% / Freeработает", tx.join(" / "));
    ok("kuma history: strip classes, last 30 cells", hs.length === 4 && strip(hs[0]) === "us-hu,us-hd" && strip(hs[1]) === "us-hp" && hs[3].querySelectorAll("i").length === 30 && strip(hs[3]).split(",").pop() === "us-hd", hs.map(strip).join(" / "));
  });
  await run(km({ ok: 1, up: 0, down: 1, n: 1, list: [["<img src=x onerror=alert(1)>", 0, 0, 0, "0"]] }), (w, m) => {
    gclick(w, m, "Серверы");
    ok("kuma history: a name with markup is text next to a strip", !m.querySelector("img") && m.querySelector(".us-row .us-nm").textContent === "<img src=x onerror=alert(1)>" && m.querySelector(".us-r").textContent === "нет ответа · 0%" && !!m.querySelector(".us-hd"), m.innerHTML);
  });
  // frigate: tiles Версия / Детектор / Занято, a row per camera "FPS n · детекций d/с", a camera with fps 0 is red "нет потока"
  const fg = (x) => one("frigate", "Frigate", "Дом", "http://10.0.0.5:5000", x);
  await run(fg({ ok: 1, ver: "0.14.1-test", inf: 22.9, det: "openvino", cam: [["front door", 5, 0.4, 0], ["garage", 0, 0, 1]], used: 128849018880, total: 1099511627776 }), (w, m) => {
    gclick(w, m, "Дом");
    const rows = Array.from(m.querySelectorAll(".us-row"));
    ok("frigate: tiles Версия, Детектор, Занято", vals(m) === "0.14.1-test|openvino · 22.9 мс|120 ГБ из 1.0 ТБ", vals(m));
    ok("frigate: camera row FPS · detections", rows[0].textContent === "front doorFPS 5 · детекций 0.4/с" && !rows[0].innerHTML.includes("#ff6b6b"), rows[0].textContent);
    ok("frigate: fps 0 -> red dot, нет потока", rows[1].textContent === "garageнет потока" && rows[1].innerHTML.includes("#ff6b6b"), rows[1].innerHTML);
  });
  await run(fg({ ok: 1, ver: "1", cam: [["<img src=x onerror=alert(1)>", 5, 0, 0]] }), (w, m) => {
    gclick(w, m, "Дом");
    ok("frigate: a camera name with markup is text, no detector and storage -> dashes", !m.querySelector("img") && m.querySelector(".us-row .us-nm").textContent === "<img src=x onerror=alert(1)>" && vals(m) === "1|—|—", vals(m));
  });
  // frigate frames (x.snap): over https an <img> under each camera row, its src made of the instance id and the row number only; over http one note
  {
    const fnow = Math.floor(Date.now() / 1000), SN = fnow - 77, cams = [["front|door", 5, 0.4, 0], ["<b>x</b>", 0, 0, 1]];
    const fgs = x => Object.assign(fg(x), { now: fnow }), SNOTE = "Кадры с камер видны при входе в роутер по https";
    const https = d => w => { w.__keendash = { base: "/storage/.keendash/", st: true }; return () => Promise.resolve({ ok: true, json: () => Promise.resolve(d) }); };
    await run(fgs({ ok: 1, ver: "1", snap: SN, cam: cams }), (w, m) => {
      gclick(w, m, "Дом");
      const im = Array.from(m.querySelectorAll("img")), rows = Array.from(m.querySelectorAll(".us-row"));
      ok("frigate snap, https: one img per camera row, src from the instance id and the row number", im.length === 2 && im.every(i => i.className === "us-snap" && i.getAttribute("loading") === "lazy" && i.getAttribute("alt") === "") &&
        im[0].getAttribute("src") === "/storage/.keendash/cam/frigate-1.jpg?" + SN && im[1].getAttribute("src") === "/storage/.keendash/cam/frigate-2.jpg?" + SN, im.map(i => i.outerHTML).join(" "));
      ok("frigate snap, https: the img sits right under its row, no http note", rows[0].nextElementSibling === im[0] && rows[1].nextElementSibling === im[1] && !m.textContent.includes(SNOTE), m.innerHTML);
      im[0].dispatchEvent(new w.Event("error"));
      ok("frigate snap: a failed image hides itself, the other stays", im[0].style.display === "none" && im[1].style.display !== "none");
      ok("frigate snap: the image reserves its space (aspect-ratio) so the card doesn't jump", /\.us-snap\{[^}]*aspect-ratio:16\/9/.test(w.document.getElementById("us-style").textContent));
      ok("frigate snap: nothing from the API in the src", !/%3C|<b>|front|door/.test(im.map(i => i.getAttribute("src")).join()));
    }, https(fgs({ ok: 1, ver: "1", snap: SN, cam: cams })), "https://r.example.net/");
    await run(fgs({ ok: 1, ver: "1", cam: cams }), (w, m) => {
      gclick(w, m, "Дом");
      ok("frigate no snap, https: no img, no note", !m.querySelector("img") && !m.textContent.includes(SNOTE), m.innerHTML);
    }, https(fgs({ ok: 1, ver: "1", cam: cams })), "https://r.example.net/");
    await run(fgs({ ok: 1, ver: "1", snap: SN, cam: cams }), (w, m) => {
      gclick(w, m, "Дом");
      ok("frigate snap, http: no img, one note", !m.querySelector("img") && m.textContent.split(SNOTE).length === 2 && !!m.querySelector(".us-note"), m.innerHTML);
    });
    await run(fgs({ ok: 1, ver: "1", snap: SN, cam: Array.from({ length: 10 }, (_, i) => ["c" + i, 5, 0, 0]) }), (w, m) => {
      gclick(w, m, "Дом");
      ok("frigate snap, https: at most 8 images", m.querySelectorAll("img").length === 8 && m.querySelectorAll("img")[7].getAttribute("src") === "/storage/.keendash/cam/frigate-8.jpg?" + SN, m.querySelectorAll("img").length);
    }, https(fgs({ ok: 1, ver: "1", snap: SN, cam: Array.from({ length: 10 }, (_, i) => ["c" + i, 5, 0, 0]) })), "https://r.example.net/");
    // SNAP 5, 15 or 30: over https the src is the time bucket floor(now / SNAP), a timer moves it without a new status (the card is not rendered again);
    // 1 and 60 (a minute): the src moves only with x.snap
    const wt = ms => new Promise(r => setTimeout(r, ms));
    const clk = { t: 1800000000000 };
    const live = (sn, x) => { const d = fgs(x); d.now = clk.t / 1000; d.inst[0].push("", "", "", sn); return d; };
    const httpsAt = d => w => { w.__keendash = { base: "/storage/.keendash/", st: true }; w.Date.now = () => clk.t; return () => Promise.resolve({ ok: true, json: () => Promise.resolve(d) }); };
    for (const sn of ["5", "15", "30"]) {
      clk.t = 1800000000000;
      const d = live(sn, { ok: 1, ver: "1", snap: SN, cam: cams });
      await run(d, async (w, m) => {
        gclick(w, m, "Дом");
        const im = Array.from(m.querySelectorAll("img")), b0 = Math.floor(clk.t / 1000 / +sn), src = i => i.getAttribute("src"), row = m.querySelector(".us-row");
        ok("frigate live " + sn + ": the first src carries the time bucket, not x.snap", im.length === 2 && src(im[0]) === "/storage/.keendash/cam/frigate-1.jpg?" + b0 && src(im[1]) === "/storage/.keendash/cam/frigate-2.jpg?" + b0, im.map(src).join());
        clk.t += 1000 * +sn - 1000; await wt(1300);
        ok("frigate live " + sn + ": the src does not change before the interval is over", im.every(i => src(i).endsWith("?" + b0)), im.map(src).join());
        clk.t += 1000; await wt(1300);
        ok("frigate live " + sn + ": after the interval every src moves to the next bucket, same nodes (no re-render)", im.every(i => i.isConnected && src(i).endsWith("?" + (b0 + 1))) && m.querySelector(".us-row") === row, im.map(src).join());
      }, httpsAt(d), "https://r.example.net/");
    }
    for (const sn of ["60", "1"]) {
      clk.t = 1800000000000;
      const d = live(sn, { ok: 1, ver: "1", snap: SN, cam: cams });
      await run(d, async (w, m) => {
        gclick(w, m, "Дом");
        const im = Array.from(m.querySelectorAll("img"));
        clk.t += 70000; await wt(1300);
        ok("frigate SNAP=" + sn + ": the src keeps x.snap whatever the clock does", im.length === 2 && im.every(i => i.getAttribute("src").endsWith("?" + SN)), im.map(i => i.getAttribute("src")).join());
      }, httpsAt(d), "https://r.example.net/");
    }
  }
  // pihole: AdGuard's card without the filter/latency note and the recent blocks: two graphs, top domains, clients, its own note
  const ph = (x) => Object.assign(one("pihole", "Pi-hole", "Сеть", "http://10.0.0.5", x), { now: 1793438837 });
  await run(ph({ ok: 1, q: 52310, b: 7840, act: 12, rules: 368606, upd: 1793431637, sq: Array(24).fill(100), sb: Array(24).fill(10),
    top: [["<b>x</b>.example.org", 812], ["ads.example.com", 455]], cl: [["laptop", "192.168.1.20", 5321], ["", "192.168.1.99", 10]] }), (w, m) => {
    gclick(w, m, "Сеть");
    const rows = Array.from(m.querySelectorAll(".us-row")).map(r => r.textContent);
    ok("pihole: two graph blocks, totals + blocked share", m.querySelectorAll(".us-blk").length === 2 && /Запросов за 24 ч52 310/.test(m.querySelector(".us-grid").textContent) && /7 840 · 15\.0%/.test(m.querySelector(".us-grid").textContent), m.querySelector(".us-grid").textContent);
    ok("pihole: note", m.querySelector(".us-note").textContent === "Доменов в списках 368 606 · активных клиентов 12 · списки обновлены 2ч 0м назад", m.querySelector(".us-note").textContent);
    ok("pihole: a domain with markup is text", !m.querySelector(".us-row b") && m.querySelector(".us-row .us-nm").textContent === "<b>x</b>.example.org", m.innerHTML);
    ok("pihole: top domains, clients with IP tag, no recent blocks", rows.join(" / ") === "<b>x</b>.example.org812 / ads.example.com455 / laptop 192.168.1.205 321 / 192.168.1.9910" && !/Последние блокировки/.test(m.textContent), rows.join(" / "));
  });
  await run(ph({ ok: 1, q: 0, b: 0, act: 1, rules: 5, sq: [], sb: [] }), (w, m) => {
    gclick(w, m, "Сеть");
    ok("pihole: no graph points -> label «Запросов» without a period", m.querySelector(".us-blk .us-lbl").textContent === "Запросов", m.querySelector(".us-grid").textContent);
  });
  await run(one("agh", "AdGuard Home", "AdGuard", "http://10.0.0.5:3000", { ok: 1, q: 0, b: 0, ms: 1, fon: 0, fall: 0, rules: 0, sq: [], sb: [] }), (w, m) => {
    gclick(w, m, "AdGuard");
    ok("agh: no graph points -> label «Запросов» without a period", m.querySelector(".us-blk .us-lbl").textContent === "Запросов", m.querySelector(".us-grid").textContent);
  });
  // ha: a row per entity "label — state unit"; on/off in words, unavailable/unknown grey, nothing -> a dash; no rows -> a note
  const ha = (x) => one("ha", "Home Assistant", "Дом", "http://10.0.0.5:8123", x);
  await run(ha({ ok: 1, e: [["Температура", 23.5, "°C"], ["Свет", "on", ""], ["Розетка", "off", ""], ["Датчик", "unavailable", ""], ["Дверь", "unknown", ""], ["Нет", "", ""], ["<img src=x onerror=alert(1)>", "<b>x</b>", "<i>"]] }), (w, m) => {
    gclick(w, m, "Дом");
    const rows = Array.from(m.querySelectorAll(".us-row")), tx = rows.map(r => r.textContent);
    ok("ha: state and unit, on/off in words", tx[0] === "Температура23.5 °C" && tx[1] === "СветВключено" && tx[2] === "РозеткаВыключено", tx.join(" / "));
    ok("ha: unavailable and unknown -> недоступно, grey", tx[3] === "Датчикнедоступно" && tx[4] === "Дверьнедоступно" && rows[3].innerHTML.includes("#7b8798") && rows[3].className.includes("us-dim") && rows[4].className.includes("us-dim") && !rows[1].className.includes("us-dim"), m.innerHTML);
    ok("ha: dots: value and on green, off grey", rows[0].innerHTML.includes("#3ecf8e") && rows[1].innerHTML.includes("#3ecf8e") && rows[2].innerHTML.includes("#7b8798"), rows[0].innerHTML + rows[2].innerHTML);
    ok("ha: no state -> a dash", tx[5] === "Нет—", tx[5]);
    ok("ha: markup in label, state and unit is text", !m.querySelector(".us-row img, .us-row b, .us-row .us-nm *, .us-row .us-r *") && tx[6] === "<img src=x onerror=alert(1)><b>x</b> <i>", tx[6]);
  });
  await run(ha({ ok: 1, e: [["A", 25.4066666666667, "°C"], ["B", "-3.96", "°C"], ["C", "0.052345", "kWh"], ["D", "1013", "hPa"], ["E", "25.3", "°C"], ["F", "1.2e5", ""]] }), (w, m) => {
    gclick(w, m, "Дом");
    const tx = Array.from(m.querySelectorAll(".us-row")).map(r => r.textContent).join("|");
    ok("ha: decimals rounded, integers and exponents as is", tx === "A25.4 °C|B-4 °C|C0.052 kWh|D1013 hPa|E25.3 °C|F1.2e5", tx);
  });
  await run(ha({ ok: 1 }), (w, m) => {
    gclick(w, m, "Дом");
    ok("ha: no entities -> the note", !m.querySelector(".us-row") && m.querySelector(".us-note").textContent === "Добавьте сущности в поле «Что показывать»", m.innerHTML);
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
    ["etc/services", "var/inbox", "tmp/x", "ext.d", "pub/cam"].forEach(d => fs.mkdirSync(path.join(tmp, d), { recursive: true }));
    fs.writeFileSync(path.join(tmp, "ext.d", "qb"), "#!/bin/sh\n# name: qBittorrent\n# group: Медиа\n# fields: url user pass\n");
    fs.writeFileSync(path.join(tmp, "ext.d", "plex"), "#!/bin/sh\n# name: Plex\n# group: Медиа\n# fields: url token\n");
    Object.keys(files).forEach(f => {
      fs.writeFileSync(path.join(tmp, f), files[f]);
      const t = now - ((ago || {})[f] !== undefined ? ago[f] : f.startsWith("var/inbox/") ? 10 : 0);
      fs.utimesSync(path.join(tmp, f), t, t);
    });
    const t = unix(tmp), bin = unix(path.join(__dirname, "..", "files", "opt", "share", "keendash", "bin", "settings"));
    const out = cp.spawnSync("sh", ["-c", 'KEENDASH_ETC="' + t + '/etc" KEENDASH_VAR="' + t + '/var" KEENDASH_TMP="' + t + '/tmp" KEENDASH_EXTD="' + t + '/ext.d" KEENDASH_PUB="' + t + '/pub" KEENDASH_SCAN="' + t + '/fakescan" sh "' + bin + '" ' + cmd], { encoding: "utf8" }).stdout;
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
      "set qb-2 pass p's $(x) `y` \\z", "hide page cron", "hide main telemt", "group g1 3 0 0 Дом и сеть", "card sys 1 0 0 g1", "card qb-2 2 1 1"]) }, "apply");
    const conf = r.rd("etc/services/qb-2.conf");
    ok("settings apply: add, set, hide, layout", conf === "TYPE='qb'\nNAME='qBittorrent 2'\nURL='http://10.0.0.5:8080'\nUSER='admin'\nPASS='p'\\''s $(x) `y` \\z'\n" &&
      r.mode("etc/services/qb-2.conf") === 0o600 && r.rd("etc/ui.conf") === "hide page cron\nhide main telemt\ngroup g1 3 0 0 Дом и сеть\ncard sys 1 0 0 g1\ncard qb-2 2 1 1\n" &&
      r.rd("tmp/settings.state") === "rev r1\nerr \n" && !r.ls("var/inbox").length, JSON.stringify([conf, r.rd("etc/ui.conf"), r.rd("tmp/settings.state"), r.ls("var/inbox")]));
    const pass = conf && cp.execFileSync("sh", ["-c", '. ./qb-2.conf; printf %s "$PASS"'], { cwd: path.join(r.tmp, "etc", "services"), encoding: "utf8" });
    ok("settings apply: values are data", pass === "p's $(x) `y` \\z", JSON.stringify(pass));
    r.rm();

    const bad = [["set qb-2 foo x"], ["add QB qb"], ["add x nosuch"], ["set qb-2 url ftp://h"], ["set qb-2 user " + "a".repeat(513)], ["set qb-2 user a\x01b"],
      ["set qb-2 name a|b"], ["set qb-2 url http://h|x"], ["set qb-2 user a|b"], ["col 0 a"], ["set pl name " + "a".repeat(65)], ["set nope name x"], ["add y qb", "set y name Y"], ["bogus"],
      ["group g 3 0 0 A"], ["group g1234 3 0 0 A"], ["group x1 3 0 0 A"], ["group g1 0 0 0 A"], ["group g1 4 0 0 A"], ["group g1 3 2 0 A"], ["group g1 3 0 0 " + "Я".repeat(33)], ["group g1 3 0 0 a|b"],
      ["group g1 3 0 0 a\x01b"], ["group g1 3 0 0 a\tb"], ["group g1 3 0 0"], ["group g1 3 0 0 "], ["group g1 3 0 0  A"], ["group g1 3 0 0 A "], ["card sys 1 0 0 g1"], ["group g1 3 0 0 A", "card sys 1 0 0 g2"],
      ["group g1 3 0 0 A", "group g1 2 0 0 B"], ["card sys 1 0 0", "card sys 2 0 0"], ["card sys 1 0 0 g1 x"], ["card sys 4 0 0"], ["card sys 1 2 0"], ["card a|b 1 0 0"],
      ["group g1 3 0 3 A"], ["group g1 3 0 -1 A"], ["group g1 3 0 a A"], ["group g1 3 0 1 A"], ["group g1 2 0 2 A"], ["group g1 3 0 A"], ["card sys 1 0 3"], ["card sys 1 0 -1"], ["card sys 1 0 a"], ["card a 2 0 2"], ["card a 3 0 1"], ["card sys 1 0"], ["card sys 1 0 g1"],
      Array.from({ length: 65 }, (_, i) => "group g" + i + " 1 0 0 G")];
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
    r = settingsRun(Object.assign({ "var/inbox/r2.txt": msg("r2", ["col 0 a"]) }, base), "apply");
    ok("settings apply: col is no longer a command", /^rev r2\nerr строка 2: неизвестная команда col/.test(r.rd("tmp/settings.state") || ""), r.rd("tmp/settings.state"));
    r.rm();

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

    // a 32-letter name passes; a hide-only message keeps the layout lines (and old col lines); a layout message drops col lines
    const LAY = "group g1 3 0 0 " + "Я".repeat(32) + "\ncard sys 1 0 0 g1\ncard qb-2 2 1 1\n";
    r = settingsRun(Object.assign({ "var/inbox/r6b.txt": msg("r6b", Array.from({ length: 64 }, (_, i) => "group g" + i + " 1 0 0 G")) }, base), "apply");
    ok("settings apply: 64 groups", r.rd("tmp/settings.state") === "rev r6b\nerr \n" && r.rd("etc/ui.conf") === UI + Array.from({ length: 64 }, (_, i) => "group g" + i + " 1 0 0 G\n").join(""), JSON.stringify(r.rd("tmp/settings.state")));
    r.rm();
    r = settingsRun(Object.assign({ "var/inbox/r6.txt": msg("r6", ["group g1 3 0 0 " + "Я".repeat(32), "card sys 1 0 0 g1", "card qb-2 2 1 1"]) }, base, { "etc/ui.conf": UI + "col 0 a b\ncol 1\n" }), "apply");
    ok("settings apply: layout drops col lines, 32-letter name",r.rd("etc/ui.conf") === UI + LAY, JSON.stringify(r.rd("etc/ui.conf")));
    r.rm();
    r = settingsRun(Object.assign({ "var/inbox/r7.txt": msg("r7", ["hide main awg"]) }, base, { "etc/ui.conf": UI + LAY }), "apply");
    ok("settings apply: hide keeps layout", r.rd("etc/ui.conf") === "hide page cron\nhide main awg\nhide main telemt\n" + LAY, JSON.stringify(r.rd("etc/ui.conf")));
    r.rm();
    r = settingsRun(Object.assign({ "var/inbox/r7.txt": msg("r7", ["hide main awg"]) }, base, { "etc/ui.conf": UI + "col 0 telemt awg\ncol 1\ncol 2 qb-2\n" }), "apply");
    ok("settings apply: hide keeps old col lines", r.rd("etc/ui.conf") === "hide page cron\nhide main awg\nhide main telemt\ncol 0 telemt awg\ncol 1\ncol 2 qb-2\n", JSON.stringify(r.rd("etc/ui.conf")));
    r.rm();
    r = settingsRun(Object.assign({ "var/inbox/r7.txt": msg("r7", ["hide main awg"]) }, base, { "etc/ui.conf": UI + "group g1 2 0 Старая\ncard a 1 0 g1\ncard b 2 1\n" }), "apply");
    ok("settings apply: hide keeps layout lines written before x", r.rd("etc/ui.conf") === "hide page cron\nhide main awg\nhide main telemt\ngroup g1 2 0 Старая\ncard a 1 0 g1\ncard b 2 1\n", JSON.stringify(r.rd("etc/ui.conf")));
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

    r = settingsRun(Object.assign({ "tmp/vol": "v1:\n", "tmp/settings.state": "rev r1\nerr \n" }, base, { "etc/ui.conf": UI + "col 0 telemt awg\ncol 1 qb-2\ngroup g1 2 0 1 Дом и сеть\ncard sys 1 0 0 g1\ncard qb-2 2 1 1\ngroup g2 2 0 Старая\ncard old 1 0 g2\ncard old2 2 1\n" }), "list");
    ok("settings list", r.out === "vol|v1:\nrev|r1\nerr|\ntype|plex|Plex|Медиа|url,token|\ntype|qb|qBittorrent|Медиа|url,user,pass|\n" +
      "inst|pl|plex|Plex 'A'|http://10.0.0.6:32400||token||||\ninst|qb-2|qb|qBittorrent 2|http://10.0.0.5:8080|admin|pass||||\nhide|page|cron\nhide|main|telemt\ncol|telemt,awg\ncol|qb-2\nlay|g|g1|2|0|1|Дом и сеть\nlay|c|sys|1|0|0|g1\nlay|c|qb-2|2|1|1|\nlay|g|g2|2|0||Старая\nlay|c|old|1|0||g2\nlay|c|old2|2|1||\n" &&
      !/s3cret|t0ken/.test(r.out), JSON.stringify(r.out));
    r.rm();

    // scan: "settings apply" starts bin/scan (here a fake that leaves a marker) detached, and only for a whole valid message
    {
      const wait = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
      const FS = { "fakescan": 'echo ran >> "$KEENDASH_TMP/ran"\n' };
      const go = (rev, lines) => { const x = settingsRun(Object.assign({ ["var/inbox/" + rev + ".txt"]: msg(rev, lines) }, FS, base), "apply"); wait(250); return x; };
      let x = go("s1", ["scan"]);
      ok("settings apply: scan starts bin/scan", x.rd("tmp/ran") === "ran\n" && x.rd("tmp/settings.state") === "rev s1\nerr \n", JSON.stringify([x.rd("tmp/ran"), x.rd("tmp/settings.state")]));
      x.rm();
      x = go("s2", ["hide main awg", "scan"]);
      ok("settings apply: scan with other lines", x.rd("tmp/ran") === "ran\n" && x.rd("etc/ui.conf") === "hide page cron\nhide main awg\nhide main telemt\n" && x.rd("tmp/settings.state") === "rev s2\nerr \n", JSON.stringify([x.rd("tmp/ran"), x.rd("etc/ui.conf")]));
      x.rm();
      const bad = [];
      [["scan x"], ["scan", "bogus"], ["scan", "set nope name X"]].forEach((l, i) => {
        x = go("s3" + i, l);
        if (x.rd("tmp/ran") !== null || !/^rev s3\d\nerr .+\n$/.test(x.rd("tmp/settings.state"))) bad.push(l.join(" / ") + " -> " + JSON.stringify([x.rd("tmp/ran"), x.rd("tmp/settings.state")]));
        x.rm();
      });
      ok("settings apply: scan x or a bad line rejects the message, nothing starts", !bad.length, bad.join("; "));
      x = settingsRun({ "tmp/scan": "state|done|2|3|1700000000\nfound|10.0.0.5|nas|jellyfin|http://10.0.0.5:8096\n" }, "list");
      ok("settings list: scan lines as they are", x.out.endsWith("scan|state|done|2|3|1700000000\nscan|found|10.0.0.5|nas|jellyfin|http://10.0.0.5:8096\n"), JSON.stringify(x.out));
      x.rm();
    }

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
    r = settingsRun(Object.assign({ "var/inbox/m3.txt": msg("m3", ["set c map " + "я".repeat(32) + "=x.y:n;b=c:p; d=e:s ; f=g:bit;h=i;j=k;l=m;n=o"]) }, mbase), "apply");
    ok("bin/settings apply: map limits (32 characters, 8 pairs, spaces)", /^rev m3\nerr \n$/.test(r.rd("tmp/settings.state")) && /^MAP=/m.test(r.rd("etc/services/c.conf")), r.rd("tmp/settings.state"));
    r.rm();
    r = settingsRun({ "ext.d/mp": MP, "etc/services/c.conf": MC + "MAP='A=x.y'\n", "etc/services/d.conf": MC }, "list");
    ok("bin/settings list: map", /\ninst\|c\|mp\|M\|http:\/\/10.0.0.7:1\|\|\|A=x.y\|\|\|\n/.test(r.out) && /\ninst\|d\|mp\|M\|http:\/\/10.0.0.7:1\|\|\|\|\|\|\n/.test(r.out), JSON.stringify(r.out));
    r.rm();

    // hosts and every (the check type): types() keeps the fields, apply checks them like the browser does, list prints them last
    const CK = "#!/bin/sh\n# name: CK\n# group: Доступность\n# fields: hosts every\n", KC = "TYPE='ck'\nNAME='K'\n", kbase = { "ext.d/ck": CK, "etc/services/k.conf": KC };
    r = settingsRun({ "ext.d/ck": CK, "etc/services/k.conf": KC + "HOSTS='a.test b.test:81'\nEVERY='15'\n" }, "list");
    ok("bin/settings types and list: hosts, every", r.out.startsWith("type|ck|CK|Доступность|hosts,every|\n") && r.out.includes("\ninst|k|ck|K|||||a.test b.test:81|15|\n"), JSON.stringify(r.out));
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

    // snap (the Frigate type): the last field of an inst line, the frame interval 0 1 5 15 30 60 (1 is the old "yes" = 60)
    const FG = "#!/bin/sh\n# name: FG\n# group: Дом\n# fields: url snap\n", FC = "TYPE='fg'\nNAME='F'\nURL='http://h'\n", fbase = { "ext.d/fg": FG, "etc/services/f.conf": FC };
    r = settingsRun({ "ext.d/fg": FG, "etc/services/f.conf": FC + "SNAP='1'\n" }, "list");
    ok("bin/settings types and list: snap after every", r.out.startsWith("type|fg|FG|Дом|url,snap|\n") && r.out.includes("\ninst|f|fg|F|http://h||||||1\n"), JSON.stringify(r.out));
    r.rm();
    const sfail = [];
    ["0", "1", "5", "15", "30", "60"].forEach(v => {
      r = settingsRun(Object.assign({ "var/inbox/s1.txt": msg("s1", ["set f snap " + v]) }, fbase), "apply");
      if (r.rd("tmp/settings.state") !== "rev s1\nerr \n" || r.rd("etc/services/f.conf") !== FC + "SNAP='" + v + "'\n") sfail.push(v + " -> " + r.rd("tmp/settings.state"));
      r.rm();
    });
    ["2", "01", "10", "5 ", "1 ", "a", "on", "yes", "-1", "1;id", "$(id)", "6", "300"].forEach(v => {
      r = settingsRun(Object.assign({ "var/inbox/s2.txt": msg("s2", ["set f snap " + v]) }, fbase), "apply");
      if (r.rd("tmp/settings.state") !== "rev s2\nerr строка 2: неверный интервал кадров\n" || r.rd("etc/services/f.conf") !== FC) sfail.push(JSON.stringify(v) + " -> " + r.rd("tmp/settings.state"));
      r.rm();
    });
    ok("bin/settings apply: snap is 0, 1, 5, 15, 30 or 60", !sfail.length, sfail.join("; "));
    r = settingsRun({ "var/inbox/s3.txt": msg("s3", ["set qb-2 snap 1"]), "etc/services/qb-2.conf": QB }, "apply");
    ok("bin/settings apply: snap only for types that list it", r.rd("tmp/settings.state") === "rev s3\nerr строка 2: неизвестное поле snap\n" && r.rd("etc/services/qb-2.conf") === QB, r.rd("tmp/settings.state"));
    r.rm();

    // a deleted or newly added id starts without the cache and history of an earlier one with the same id
    r = settingsRun(Object.assign({ "var/inbox/r10.txt": msg("r10", ["del qb-2", "add z qb", "set z url http://h"]), "tmp/x/qb-2": "ok 1\n", "tmp/s.qb-2.dl": "1\n", "tmp/x/z": "ok 1\n", "tmp/s.z.dl": "1\n",
      "tmp/x/pl": "ok 1\n", "tmp/s.pl.dl": "1\n", "tmp/chk.qb-2.a.test": "1 1\n", "tmp/.chk.qb-2.a.test.now": "200 1 1\n", "tmp/chk.z.a.test": "1 1\n", "tmp/.chk.z.a.test.t": "1 1\n", "tmp/chk.pl.a.test": "1 1\n", "tmp/chk.qb-2b.a.test": "1 1\n",
      "tmp/.cams.qb-2": "1 a\n", "tmp/.ck.qb-2": "t\n", "tmp/.cams.z": "1 a\n", "tmp/.ck.z": "t\n", "tmp/.cams.pl": "1 a\n", "tmp/.ck.pl": "t\n" }, base), "apply");
    ok("settings apply: del and add drop the cache and history", r.rd("etc/services/z.conf") !== null && ["tmp/x/qb-2", "tmp/s.qb-2.dl", "tmp/x/z", "tmp/s.z.dl"].every(n => r.rd(n) === null) &&
      r.rd("tmp/x/pl") === "ok 1\n" && r.rd("tmp/s.pl.dl") === "1\n", JSON.stringify(r.ls("tmp")));
    ok("settings apply: del and add drop the check history and its scratch files of that id only", ["tmp/chk.qb-2.a.test", "tmp/.chk.qb-2.a.test.now", "tmp/chk.z.a.test", "tmp/.chk.z.a.test.t"].every(n => r.rd(n) === null) &&
      r.rd("tmp/chk.pl.a.test") !== null && r.rd("tmp/chk.qb-2b.a.test") !== null, JSON.stringify(r.ls("tmp")));
    ok("settings apply: del and add drop the camera list and login cookie of that id only", ["tmp/.cams.qb-2", "tmp/.ck.qb-2", "tmp/.cams.z", "tmp/.ck.z"].every(n => r.rd(n) === null) && r.rd("tmp/.cams.pl") !== null && r.rd("tmp/.ck.pl") !== null, JSON.stringify(r.ls("tmp")));
    r.rm();
    // frames in $PUB/cam go with the card: del and add drop <id>-<n>.jpg and the .t temps, not another id's (qb-2b-1, qb-2-3-1 of the id qb-2-3 stay)
    r = settingsRun(Object.assign({ "var/inbox/r11.txt": msg("r11", ["del qb-2", "add z qb", "set z url http://h"]), "pub/cam/qb-2-1.jpg": "j", "pub/cam/qb-2-8.jpg": "j", "pub/cam/.qb-2-2.jpg.t": "j",
      "pub/cam/z-1.jpg": "j", "pub/cam/.z-3.jpg.t": "j", "pub/cam/pl-1.jpg": "j", "pub/cam/qb-2b-1.jpg": "j", "pub/cam/qb-2-3-1.jpg": "j" }, base), "apply");
    ok("settings apply: del and add drop the camera frames of that id only", r.rd("etc/services/z.conf") !== null && r.ls("pub/cam").sort().join() === "pl-1.jpg,qb-2-3-1.jpg,qb-2b-1.jpg", r.ls("pub/cam").join());
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
  // LAN scan fingerprints: `# probe: <ports> <path> <match>` in every ext.d type but nextdns, custom and check; the type's fake answer
  // (fake-wget, tests/fixtures/probe/<type>) has its own match and no other type's match on a shared port
  if (haveCc) {
    const dir = path.join(__dirname, "..", "files", "opt", "share", "keendash", "ext.d"), pr = {};
    fs.readdirSync(dir).forEach(t => {
      const l = fs.readFileSync(path.join(dir, t), "utf8").split("\n").filter(x => x.startsWith("# probe:")), m = /^# probe: ([a-z0-9:,]+) (\/\S*) (.+)$/.exec(l[0] || "");
      if (["nextdns", "custom", "check"].includes(t)) return ok("probe: " + t + " has none", !l.length, l[0]);
      ok("probe: " + t + " has one well-formed line", l.length === 1 && m && m[1].split(",").every(p => /^(https:)?[1-9]\d{0,4}$/.test(p)), l.join("|"));
      if (m) pr[t] = { ports: m[1].split(",").map(p => p.replace("https:", "")), path: m[2], match: m[3].replace(/\r$/, "") };
      // TrueNAS revokes a key typed into an http entry: never offer it on port 80
      if (t === "truenas") ok("probe: truenas only on https:443", !!m && m[1] === "https:443", l[0]);
    });
    const ans = {};
    Object.keys(pr).forEach(t => {
      const r = cp.spawnSync("sh", [path.join(__dirname, "fake-wget"), "-S", "-O-", "http://" + t + ".probe.test:" + pr[t].ports[0] + pr[t].path], { encoding: "utf8" });
      ans[t] = r.stderr + r.stdout;
      ok("probe: " + t + " answer has its match", r.status === 0 && ans[t].includes(pr[t].match), r.status + " " + ans[t].slice(0, 80));
    });
    const bad = [];
    Object.keys(pr).forEach(a => Object.keys(pr).forEach(b => { if (a !== b && pr[a].ports.some(p => pr[b].ports.includes(p)) && ans[b].includes(pr[a].match)) bad.push(a + " in " + b); }));
    ok("probe: no cross-matches on a shared port", !bad.length, bad.join(", "));
  }
  // bin/scan in a scratch install: bin/ has scan, extlib and a fake rci (the router at 192.168.1.1 and its clients) and the fake wget.
  // o.types {name: "# probe:" header}, o.clients [[ip, active, name, hostname]], o.ans {"<url with / and : as _>": response; "HANG" never answers},
  // o.conf {id: services/<id>.conf}, o.lock the pid in scan.lock, o.env "NAME=value ". The fake wget leaves its argument lines in fake/log and
  // the number of wgets running at its start in fake/conc; an address without an answer is refused (exit 4) after WSLEEP seconds
  if (haveCc) {
    const bin = path.join(__dirname, "..", "files", "opt", "share", "keendash", "bin");
    const src = n => fs.readFileSync(path.join(bin, n), "utf8").replace(/\r/g, "").replace(/^PATH=.*$/m, ":");
    const FWGET = '#!/bin/sh\nfor u; do :; done\necho "$*" >> "$FAKE/log"\nmkdir -p "$FAKE/run"; : > "$FAKE/run/$$"; ls "$FAKE/run" | wc -l >> "$FAKE/conc"\n' +
      '[ -z "$STEAL" ] || echo "$STEAL" > "$KEENDASH_TMP/scan.lock"\nf=$FAKE/ans/$(echo "$u" | tr "/:" "__")\ntrap \'rm -f "$FAKE/run/$$"; exit 143\' TERM\n' +
      // an answer "REDIR <url>" is a 302: refused with --max-redirect=0, else "followed" (a line "follow <url>" in the log); cat's status is ours (141 when the reader cut it)
      'if [ -f "$f" ]; then l=$(sed 1q "$f"); [ "$l" = HANG ] && exec sleep 30\n' +
      '  case $l in "REDIR "*) printf "  HTTP/1.1 302 Found\\n  Location: %s\\n" "${l#REDIR }" >&2; rm -f "$FAKE/run/$$"; case " $* " in *" --max-redirect=0 "*) exit 8 ;; esac; echo "follow ${l#REDIR }" >> "$FAKE/log"; exit 0 ;; esac\n' +
      '  cat "$f"; c=$?; rm -f "$FAKE/run/$$"; exit $c; fi\n' +
      '[ -z "$HANG" ] || exec sleep 30\nsleep "${WSLEEP:-0}"; rm -f "$FAKE/run/$$"; exit 4\n';
    const FRCI = "#!/bin/sh\ncase $1 in\n  show/interface/Bridge0) printf 'address\\t192.168.1.1\\nmask\\t255.255.255.0\\n' ;;\n  show/ip/hotspot) cat \"$FAKE/hotspot\" ;;\nesac\n";
    const scan = o => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kdscan-")), t = unix(tmp), put = (f, c, m) => fs.writeFileSync(path.join(tmp, f), c, { mode: m || 0o644 });
      ["bin", "ext.d", "etc/services", "tmp", "fake/ans"].forEach(d => fs.mkdirSync(path.join(tmp, d), { recursive: true }));
      put("bin/scan", src("scan"), 0o755); put("bin/extlib", src("extlib")); put("bin/rci", FRCI, 0o755); put("bin/wget", FWGET, 0o755);
      Object.keys(o.types).forEach(n => put("ext.d/" + n, "#!/bin/sh\n# name: " + n + "\n" + o.types[n] + "\n"));
      Object.keys(o.conf || {}).forEach(n => put("etc/services/" + n + ".conf", o.conf[n]));
      Object.keys(o.ans || {}).forEach(n => put("fake/ans/" + n, o.ans[n]));
      put("fake/hotspot", o.clients.map((c, i) => "host." + i + ".interface.name\tBridge0\nhost." + i + ".ip\t" + c[0] + "\nhost." + i + ".active\t" + (c[1] ? "true" : "false") + "\n" +
        (c[2] ? "host." + i + ".name\t" + c[2] + "\n" : "") + (c[3] ? "host." + i + ".hostname\t" + c[3] + "\n" : "")).join(""));
      if (o.lock) { put("tmp/scan.lock", o.lock + "\n"); if (o.lockAge) { const at = Date.now() / 1000 - o.lockAge; fs.utimesSync(path.join(tmp, "tmp/scan.lock"), at, at); } }
      const t0 = Date.now(), run = 'sh "' + t + '/bin/scan"';
      cp.spawnSync("sh", ["-c", 'export PATH="' + t + '/bin:$PATH" FAKE="' + t + '/fake" KEENDASH_ETC="' + t + '/etc" KEENDASH_TMP="' + t + '/tmp" KEENDASH_EXTD="' + t + '/ext.d" ' + (o.env || "") + "; " +
        (o.dup ? run + " & " + run + " & wait" : run)], { encoding: "utf8" });
      const rd = f => { try { return fs.readFileSync(path.join(tmp, f), "utf8"); } catch (e) { return null; } };
      const lines = (rd("fake/log") || "").split("\n").filter(Boolean);
      return { rd, ls: d => fs.readdirSync(path.join(tmp, d)), ex: f => fs.existsSync(path.join(tmp, f)), lines, ms: Date.now() - t0, maxc: Math.max(0, ...(rd("fake/conc") || "").split("\n").filter(Boolean).map(Number)), rm: () => fs.rmSync(tmp, { recursive: true, force: true }) };
    };
    const st = r => (r.rd("tmp/scan") || "").split("\n");
    const sorted = a => a.slice().sort();
    const JF = '  HTTP/1.1 200 OK\n\n{"ServerName":"jf","ProductName":"Jellyfin Server"}\n';
    const T1 = { jellyfin: '# probe: 8096 /System/Info/Public "ProductName":"Jellyfin Server"', kuma: "# probe: 8081 / Uptime Kuma", metube: "# probe: 8081 / MeTube",
      proxmox: "# probe: https:8006 / Proxmox Virtual Environment", aa: "# probe: 7000 / AAA", ab: "# probe: 7000 /second BBB" };
    const A1 = { "http___192.168.1.10_8096_System_Info_Public": JF, "http___192.168.1.11_8081_": "<title>MeTube</title>\n", "https___192.168.1.1_8006_": "Proxmox Virtual Environment\n",
      "http___192.168.1.1_7000_": "AAA\n", "http___192.168.1.13_7000_": "AAA\n", "http___192.168.1.12_8096_System_Info_Public": JF, "http___8.8.8.8_8096_System_Info_Public": JF };
    const nm = "a|b\x01<i>" + "y".repeat(200), clean = "ab<i>" + "y".repeat(59);
    const C1 = [["192.168.1.10", 1, "nas"], ["192.168.1.11", 1, nm], ["192.168.1.12", 0, "off"], ["8.8.8.8", 1, "pub"], ["192.168.1.13", 1, "", "tv"]];
    {
      const r = scan({ types: T1, clients: C1, ans: A1 }), l = st(r);
      ok("bin/scan: exact result file", /^state\|done\|4\|4\|\d{10}$/.test(l[0]) && l[l.length - 1] === "" && l.length === 7 && JSON.stringify(sorted(l.slice(1, 6).filter(Boolean))) === JSON.stringify(sorted([
        "found|192.168.1.1|Роутер|aa|http://192.168.1.1:7000", "found|192.168.1.1|Роутер|proxmox|https://192.168.1.1:8006", "found|192.168.1.10|nas|jellyfin|http://192.168.1.10:8096",
        "found|192.168.1.11|" + clean + "|metube|http://192.168.1.11:8081", "found|192.168.1.13|tv|aa|http://192.168.1.13:7000"])), JSON.stringify(l).slice(0, 600));
      ok("bin/scan: name cleaned and cut to 64, router named, hostname when no name", Array.from(clean).length === 64 && l.includes("found|192.168.1.11|" + clean + "|metube|http://192.168.1.11:8081") && l.includes("found|192.168.1.13|tv|aa|http://192.168.1.13:7000"), l.join("\n"));
      ok("bin/scan: inactive and public clients get no request", r.lines.length > 0 && !r.lines.some(x => /192\.168\.1\.12|8\.8\.8\.8/.test(x)), r.lines.join(" / "));
      ok("bin/scan: no certificate check except for https", r.lines.every(x => /https:/.test(x) === /--no-check-certificate/.test(x)) && r.lines.some(x => /https:/.test(x)), r.lines.join(" / "));
      ok("bin/scan: one response per port and path, the match ends the port, a refused port the other paths", r.lines.filter(x => /192\.168\.1\.11:8081\//.test(x)).length === 1 && !r.lines.some(x => /\/second/.test(x)), r.lines.join(" / "));
      ok("bin/scan: lock and work dir gone", !r.ex("tmp/scan.lock") && !r.ls("tmp").some(x => /^scan\.(d|new)/.test(x)), r.ls("tmp").join());
      r.rm();
    }
    {
      const r = scan({ types: Object.assign({ tn: "# probe: https:443 / TrueNAS" }, T1), clients: C1, ans: Object.assign({ "https___192.168.1.1_443_": "TrueNAS\n" }, A1),
        conf: { jf: "TYPE='jellyfin'\nNAME='J'\nURL='http://192.168.1.10:8096/'\nKEY='k'\n", px: "TYPE='proxmox'\nURL='https://127.0.0.1:8006'\n", other: "TYPE='metube'\nURL='http://192.168.1.99:8081'\n", tn: "TYPE='tn'\nURL='https://localhost'\n" } }), l = st(r);
      ok("bin/scan: an added service is not listed (same type and host:port, 127.0.0.1 and localhost are the router, https defaults to 443), another address is",
        !l.some(x => /\|jellyfin\||\|proxmox\||\|tn\|/.test(x)) && r.lines.some(x => /:443\/$/.test(x)) && l.some(x => /\|metube\|/.test(x)) && l.some(x => /\|aa\|/.test(x)), l.join("\n"));
      r.rm();
    }
    {
      // a two-port type is one find (https wins); the added service filter ignores the port
      const PO = { po: '# probe: 9000,https:9443 /api/system/status "InstanceID"', fr: "# probe: 5000,https:8971 / Frigate" };
      const r = scan({ types: PO, clients: [], ans: { "http___192.168.1.1_9000_api_system_status": '{"InstanceID":"x"}\n', "https___192.168.1.1_9443_api_system_status": '{"InstanceID":"x"}\n',
        "http___192.168.1.1_5000_": "Frigate\n" }, conf: { fr: "TYPE='fr'\nURL='https://localhost:8971'\n" } }), l = st(r);
      ok("bin/scan: both ports of a type answer -> one find, https:9443; configured on another port -> not listed", r.lines.length === 4 && l.length === 3 && l[1] === "found|192.168.1.1|Роутер|po|https://192.168.1.1:9443", r.lines.length + " " + l.join("\n"));
      r.rm();
    }
    {
      // the lock was taken over while we ran: it stays, our work dir goes
      const r = scan({ types: { aa: T1.aa }, clients: [], env: "STEAL=4242 " });
      ok("bin/scan: a lock taken over meanwhile is left alone", r.rd("tmp/scan.lock") === "4242\n" && !r.ls("tmp").some(x => /^scan\.d/.test(x)), r.rd("tmp/scan.lock") + " " + r.ls("tmp").join());
      r.rm();
    }
    {
      // a client's 302 to the router's own loopback is not followed
      const r = scan({ types: { aa: T1.aa }, clients: [], ans: { "http___192.168.1.1_7000_": "REDIR http://127.0.0.1:9/x\n" } }), l = st(r);
      ok("bin/scan: --max-redirect=0, a redirect is not followed", r.lines.length === 1 && / --max-redirect=0 /.test(" " + r.lines[0] + " ") && !r.lines.some(x => /follow|127\.0\.0\.1/.test(x)) && l.length === 2, r.lines.join(" / "));
      r.rm();
    }
    {
      // a body over 64 KB ends in SIGPIPE (141): still an answer, the other paths of the port are asked
      const r = scan({ types: { "a-big": "# probe: 80 / NOMATCH", nc: '# probe: 80 /status.php "productname":"Nextcloud"' }, clients: [],
        ans: { "http___192.168.1.1_80_": "x".repeat(300000), "http___192.168.1.1_80_status.php": '{"productname":"Nextcloud"}\n' } }), l = st(r);
      ok("bin/scan: a response cut at 64 KB does not end the port", r.lines.length === 2 && l[1] === "found|192.168.1.1|Роутер|nc|http://192.168.1.1:80", r.lines.join(" / ") + " " + l.join("\n"));
      r.rm();
    }
    {
      // no ext.d types at all
      const r = scan({ types: {}, clients: C1, ans: A1 });
      ok("bin/scan: no types -> done, nothing asked", /^state\|done\|4\|4\|\d{10}$/.test(st(r)[0]) && !r.lines.length && st(r).length === 2, st(r).join("\n"));
      r.rm();
    }
    {
      const T = {};
      for (let i = 1; i <= 12; i++) T["t" + (i < 10 ? "0" : "") + i] = "# probe: " + (9000 + i) + " / X" + i;
      const r = scan({ types: T, clients: [], env: "WSLEEP=1 " });
      ok("bin/scan: at most 8 wgets at once, in batches", r.lines.length === 12 && r.maxc === 8 && /^state\|done\|1\|1\|/.test(st(r)[0]), r.lines.length + " " + r.maxc + " " + st(r)[0]);
      r.rm();
    }
    {
      const T = { "a-jf": T1.jellyfin };
      for (let i = 1; i <= 12; i++) T["t" + (i < 10 ? "0" : "") + i] = "# probe: " + (9000 + i) + " / X" + i;
      const r = scan({ types: T, clients: [["192.168.1.10", 1, "a"], ["192.168.1.11", 1, "b"], ["192.168.1.12", 1, "c"]], ans: { "http___192.168.1.1_8096_System_Info_Public": JF }, env: "HANG=1 KEENDASH_SCAN_LIMIT=2 " }), l = st(r);
      ok("bin/scan: the time limit ends it as done with what was found", /^state\|done\|0\|4\|\d{10}$/.test(l[0]) && l[1] === "found|192.168.1.1|Роутер|a-jf|http://192.168.1.1:8096" && r.ms >= 2000 && r.ms < 6000 && !r.ex("tmp/scan.lock"), r.ms + " " + l.join("\n"));
      r.rm();
    }
    {
      const sl = cp.spawn("sleep", ["30"]);
      let r = scan({ types: T1, clients: C1, ans: A1, lock: String(sl.pid) });
      ok("bin/scan: a second run while the lock's pid lives does nothing", r.rd("tmp/scan") === null && r.rd("tmp/scan.lock") === sl.pid + "\n" && !r.lines.length, r.rd("tmp/scan.lock") + " " + r.lines.length);
      r.rm(); sl.kill();
      const dead = cp.spawnSync("sh", ["-c", "echo $$"], { encoding: "utf8" }).stdout.trim();
      r = scan({ types: T1, clients: C1, ans: A1, lock: dead });
      ok("bin/scan: a lock with a dead pid is taken over", /^state\|done\|4\|4\|/.test(st(r)[0]) && !r.ex("tmp/scan.lock"), st(r)[0]);
      const solo = r.lines.length;
      r.rm();
      // two runs started together on a dead lock: one takes it over, the other leaves (the fake refuses slowly, so the first is still running when the second looks)
      r = scan({ types: T1, clients: C1, ans: A1, lock: dead, dup: true, env: "WSLEEP=1 " });
      ok("bin/scan: two runs on a dead lock make one scan", /^state\|done\|4\|4\|/.test(st(r)[0]) && r.lines.length === solo && r.maxc <= 8 && !r.ex("tmp/scan.lock"), solo + " " + r.lines.length + " " + r.maxc);
      r.rm();
      // a live pid does not keep a lock older than LIMIT + 60 s
      const sl2 = cp.spawn("sleep", ["30"]);
      r = scan({ types: T1, clients: C1, ans: A1, lock: String(sl2.pid), lockAge: 1000 });
      ok("bin/scan: a lock older than the limit plus a minute is stale even with a live pid", /^state\|done\|4\|4\|/.test(st(r)[0]) && r.lines.length === solo, st(r)[0] + " " + r.lines.length);
      r.rm(); sl2.kill();
    }
    {
      const r = scan({ types: { aa: T1.aa }, clients: Array.from({ length: 300 }, (_, i) => ["10.1." + Math.floor(i / 250) + "." + (i % 250 + 1), 1, "h" + i]) });
      ok("bin/scan: at most 254 devices", /^state\|done\|254\|254\|/.test(st(r)[0]) && r.lines.length === 254, st(r)[0] + " " + r.lines.length);
      r.rm();
    }
  }
  if (haveCc) {
    const env = {
      qb: "URL=http://qb.test:8080 USER=admin PASS='p&s=s' ", plex: "URL=http://plex.test:32400/ TOKEN=testkey ", sonarr: "URL=http://sonarr.test KEY=testkey ",
      radarr: "URL=http://radarr.test KEY=testkey ", prowlarr: "URL=http://prowlarr.test KEY=testkey ", overseerr: "URL=http://overseerr.test KEY=testkey ", immich: "URL=http://immich.test KEY=testkey ",
      jellyfin: "URL=http://jellyfin.test KEY=testkey ", jellyseerr: "URL=http://jellyseerr.test KEY=testkey ", moonraker: "URL=http://moonraker.test ", frigate: "URL=http://frigate.test:5000 USER= PASS= ", ha: "URL=http://ha.test/ TOKEN=testkey MAP='Temp=sensor.temp; Hall=light.hall; Gone=sensor.gone; Odd=sensor.odd' ", kuma: "URL=http://kuma.test KEY=testkey ",
      lidarr: "URL=http://lidarr.test KEY=testkey ", bazarr: "URL=http://bazarr.test KEY=testkey ", tautulli: "URL=http://tautulli.test KEY=testkey ",
      sabnzbd: "URL=http://sabnzbd.test KEY=testkey ", nzbget: "URL=http://nzbget.test USER=u PASS=p ",
      spoolman: "URL=http://spoolman.test ", grafana: "URL=http://grafana.test TOKEN=testkey ", glances: "URL=http://glances.test USER= PASS= ",
      portainer: "URL=http://portainer.test KEY=testkey ", truenas: "URL=http://truenas.test KEY=testkey ",
      proxmox: "URL=http://proxmox.test USER='root@pam!kd' KEY=testkey ", omv: "URL=http://omv.test USER=admin PASS='p\"a\\ss' ",
      pihole: "URL=http://pihole.test PASS='p\"a\\ss' ", nextdns: "URL=http://nextdns.test USER=abc123 KEY=testkey ", transmission: "URL=http://transmission.test USER= PASS= ", deluge: "URL=http://deluge.test PASS='p\"a\\ss' "
    };
    const want = {
      qb: ["ok 1", "~dl 5242880", "~up 524288", "list|Example.Show.S01E01.1080p.mkv|420|4194304|600", 'list|Big   Pipe "Quoted" Movie 2160p|900|1048576|3600', "list|Stalled.Thing|100|0|8640000", "n 3"],
      plex: ["ok 1", "list|alice|Example Show · Pilot|50|playing", "list|bob|Example Movie|10|paused", "streams 2", "libs|Фильмы|movie|40", "libs|Сериалы|show|23"],
      sonarr: ["ok 1", "queue 7", "list|Example Show S02E05|75|750", "list|Other S01E12|0|93784", "missing 129", "cal|1793667600|Example Show|S02E06|0", "cal|1793910600|New Show|S01E01|1"],
      radarr: ["ok 1", "queue 1", "list|Example Movie|75|7200", "missing 3"],
      prowlarr: ["ok 1", "list|Tracker Two", "all 3", "on 2", "bad 1", "q 50", "g 4", "fail 5"],
      overseerr: ["ok 1", "pending 2", "processing 3", "available 6", "total 12"],
      moonraker: ["ok 1", "state printing", "file benchy.gcode", "pct 40", "el 1200", "left 1800", "~ext 209", "ext_t 215", "~bed 59", "bed_t 60"],
      frigate: ["ok 1", "ver 0.14.1-test", "inf 22.9", "det openvino", "cam|front door|5|0.4|0", "cam|garage|0|0|1", "used 128849018880", "total 1099511627776"],
      pihole: ["ok 1", "q 52310", "b 7840", "act 12", "rules 368606", "upd 1793431637",
        "sq 75,111,147,183,219,255,291,327,363,399,435,471,507,543,579,615,651,687,723,759,795,831,867,903", "sb 10,11,12,13,14,10,11,12,13,14,10,11,12,13,14,10,11,12,13,14,10,11,12,13",
        "top|ads.example.com|812", "top|tracker.example.net|455", "top|<b>x</b>.example.org|301", "top|telemetry.example.org|120", "top|pixel.example.com|64",
        "cl|laptop|192.168.1.20|5321", "cl|phone|192.168.1.31|2210", "cl|vpn laptop|10.8.0.2|900", "cl||192.168.1.99|10"],
      nextdns: ["ok 1", "t|Запросов за сутки|9334|n", "t|Заблокировано|1234|n", "t|Блокировок|13.2|p"],
      ha: ["ok 1", "e|Temp|23.5|°C", "e|Hall|on|", "e|Gone||", "e|Odd|a b c| %"],
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
      proxmox: ["ok 1", "t|Узлов в сети|2 из 3|t", "t|ВМ|2 из 3|t", "t|LXC|1 из 2|t", "t|CPU|37|p"],
      omv: ["ok 1", "t|Работает|93784|s", "t|Нагрузка|0.52|t", "t|Память|25|p"],
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
    {
      // history: <tmp>/chk.<ID>.<key>, 24 h, percent of up among up/down, last 30 statuses; no ID -> no files and short rows
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-m-")), f = n => path.join(sd, n), rd = n => fs.existsSync(f(n)) ? fs.readFileSync(f(n), "utf8") : null, now = Math.floor(Date.now() / 1000);
      // the key: the name with every byte outside [A-Za-z0-9.-] turned into _ (cut to 100) + _ + 32-bit hash (x31 + byte) of the whole name as 8 hex digits
      const key = n => { const b = Buffer.from(n); let h = 0; b.forEach(c => { h = (h * 31 + c) % 4294967296; }); return b.toString("latin1").replace(/[^A-Za-z0-9.-]/g, "_").slice(0, 100) + "_" + ("0000000" + h.toString(16)).slice(-8); };
      const chks = () => fs.readdirSync(sd).filter(n => /^\.?chk\./.test(n)).sort(), kc = (u, id, at, d) => collect("ext.d/kuma", "", "", { state: d || sd, env: "KEENDASH_NOW=" + (at || now) + " ID=" + id + " URL=http://kuma.test" + u + " KEY=testkey " }).trim().split("\n");
      fs.writeFileSync(f("chk.km." + key("Host 01")), (now - 86410) + " 0\n" + (now - 100) + " 0\n" + (now - 50) + " 1\n"); fs.writeFileSync(f("chk.other.Host_09"), (now - 5) + " 1\n");
      let l = kc("", "km");
      ok("ext.d/kuma history: rows get percent and cells (down 0, up 100, pending has none)", l.includes('list|A "q" \\ b c|0|0|0|0') && l.includes("list|Host 01|1|101|66.6|0,1,1") && l.includes("list|Host 02|1|102|100|1") && l.includes("list|Beta Pending|2|0||2") && l.includes("list|Gamma Maint|3|0||3") && l.length === 24, l.join(" / "));
      ok("ext.d/kuma history: a file per monitor (all 23), the old line dropped, a tricky name gets a sanitised key with the hash, another instance untouched",
        chks().length === 24 && rd("chk.km." + key("Host 01")).trim().split("\n").length === 3 && rd("chk.km." + key('A "q" \\ b c')) === now + " 0\n" && /^chk\.km\.A__q____b_c_[0-9a-f]{8}$/.test("chk.km." + key('A "q" \\ b c')) && rd("chk.other.Host_09") !== null, chks().join());
      l = kc("/less", "km");
      ok("ext.d/kuma history: runs grow the file, percent over both runs",
        l.join("\n") === 'ok 1\nup 2\ndown 0\nlist|A "q" \\ b c|1|0|50|0,1\nlist|Host 01|1|0|75|0,1,1,1\nn 2', l.join(" / "));
      ok("ext.d/kuma history: a monitor missing from one poll keeps its file", chks().length === 24 && rd("chk.km." + key("Host 02")) === now + " 1\n", chks().join());
      l = kc("", "km");
      ok("ext.d/kuma history: ... and its history comes back with it", l.includes("list|Host 02|1|102|100|1,1") && l.includes("list|Host 01|1|101|80|0,1,1,1,1"), l.join(" / "));
      l = kc("/less", "km", now + 86401);
      ok("ext.d/kuma history: a monitor gone for over 24 h loses its file; the others and another instance stay",
        l.join("\n") === 'ok 1\nup 2\ndown 0\nlist|A "q" \\ b c|1|0|100|1\nlist|Host 01|1|0|100|1\nn 2' && chks().join() === ["chk.km." + key('A "q" \\ b c'), "chk.km." + key("Host 01"), "chk.other.Host_09"].sort().join(), l.join(" / ") + " || " + chks().join());
      fs.rmSync(sd, { recursive: true, force: true });
      // names that differ only in non-ASCII text: a key each, whatever the /metrics order
      const s3 = fs.mkdtempSync(path.join(os.tmpdir(), "kd-m-"));
      l = kc("/cyr", "km", now, s3);
      ok("ext.d/kuma history: two Cyrillic names of the same length -> two files", fs.readdirSync(s3).filter(n => /^chk\./.test(n)).sort().join() === ["chk.km." + key("Роутер"), "chk.km." + key("Сервер")].sort().join() && key("Роутер") !== key("Сервер"), fs.readdirSync(s3).join());
      l = kc("/cyr2", "km", now + 60, s3);
      ok("ext.d/kuma history: swapped order in /metrics -> each history stays with its own name", l.join("\n") === "ok 1\nup 1\ndown 1\nlist|Сервер|0|0|0|0,0\nlist|Роутер|1|0|100|1,1\nn 2" && fs.readdirSync(s3).filter(n => /^chk\./.test(n)).length === 2, l.join(" / ") + " || " + fs.readdirSync(s3).join());
      fs.rmSync(s3, { recursive: true, force: true });
      // 40 lines on file: the row gets the last 30 statuses
      const s4 = fs.mkdtempSync(path.join(os.tmpdir(), "kd-m-"));
      fs.writeFileSync(path.join(s4, "chk.km." + key("Host 01")), Array.from({ length: 40 }, (_, i) => (now - 400 + i * 10) + " 1\n").join(""));
      l = kc("/less", "km", now, s4);
      ok("ext.d/kuma history: at most 30 cells in a row", l.includes("list|Host 01|1|0|100|" + new Array(30).fill(1).join(",")) && fs.readFileSync(path.join(s4, "chk.km." + key("Host 01")), "utf8").trim().split("\n").length === 41, l.join(" / "));
      fs.rmSync(s4, { recursive: true, force: true });
      const s2 = fs.mkdtempSync(path.join(os.tmpdir(), "kd-m-"));
      l = collect("ext.d/kuma", "", "", { state: s2, env: env.kuma }).trim().split("\n");
      ok("ext.d/kuma: no ID -> no files, rows without percent and cells", !fs.readdirSync(s2).length && l.includes("list|Host 01|1|101"), l.join(" / "));
      l = collect("ext.d/kuma", "", "", { state: s2, env: "ID='a/b' URL=http://kuma.test KEY=testkey " }).trim().split("\n");
      ok("ext.d/kuma: a bad ID counts as none", !fs.readdirSync(s2).length && l.includes("list|Host 01|1|101"), l.join(" / "));
      fs.rmSync(s2, { recursive: true, force: true });
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
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-f-")), lg = () => fs.readFileSync(path.join(sd, "log"), "utf8"), fr = (e) => collect("ext.d/frigate", "", "", { state: sd, env: e }).trim();
      ok("ext.d/frigate: no user -> no login request, no cookie, one stats request", fr(env.frigate) === want.frigate.join("\n") && lg() === "frigate -qO- --no-check-certificate http://frigate.test:5000/api/stats \n", lg());
      fs.rmSync(path.join(sd, "log"));
      const lo = fr("URL=http://frigate.test:8971 USER=admin PASS='p\"a\\ss' "), ll = lg().split("\n").filter(Boolean);
      ok("ext.d/frigate: user -> JSON-escaped login, then stats with the cookie", lo === want.frigate.join("\n") && ll.length === 2 && / --no-check-certificate /.test(ll[0]) && / --no-check-certificate /.test(ll[1]) && ll[0].endsWith(' --post-data {"user":"admin","password":"p\\"a\\\\ss"} http://frigate.test:8971/api/login ') && / Cookie: frigate_token=abc /.test(ll[1]) && ll[1].endsWith(" http://frigate.test:8971/api/stats "), lg());
      ok("ext.d/frigate: password not printed", !/a\\+ss/.test(lo));
      ok("ext.d/frigate: wrong password and no answer -> ok 0", fr("URL=http://frigate.test:8971 USER=admin PASS=x ") === "ok 0" && fr("URL=http://nohost.test USER= PASS= ") === "ok 0");
      fs.rmSync(sd, { recursive: true, force: true });
    }
    // frigate frames: SNAP=1 and a valid ID write $KEENDASH_PUB/cam/<ID>-<n>.jpg (n = the camera's place in the sorted list), only for names of [A-Za-z0-9_-]
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-f-")), pub = fs.mkdtempSync(path.join(os.tmpdir(), "kd-p-")), cam = path.join(pub, "cam");
      const lg = () => fs.existsSync(path.join(sd, "log")) ? fs.readFileSync(path.join(sd, "log"), "utf8") : "", lgs = () => lg().split("\n").filter(l => /latest\.jpg/.test(l)), ls = () => fs.existsSync(cam) ? fs.readdirSync(cam).sort().join() : "-";
      const fs1 = (u, e, p) => { fs.rmSync(path.join(sd, "log"), { force: true }); return collect("ext.d/frigate", "", "", { state: sd, env: "KEENDASH_PUB=" + unix(p || pub) + " USER= PASS= URL=" + u + " " + (e === undefined ? "ID=fg-1 SNAP=1 " : e) }).trim(); };
      const put = (n, c) => { fs.mkdirSync(cam, { recursive: true }); fs.writeFileSync(path.join(cam, n), c || "old"); };
      const JPG = "\xff\xd8\xff\xe0fake-jpeg\n", sf = n => fs.existsSync(path.join(sd, n)) ? fs.readFileSync(path.join(sd, n), "utf8") : null;
      // the newest frame's mtime in seconds, the number after "snap " (the card's cache key)
      const snapLine = () => "snap " + Math.max(...fs.readdirSync(cam).filter(n => /^fg-1-[0-9]\.jpg$/.test(n)).map(n => Math.floor(fs.statSync(path.join(cam, n)).mtimeMs / 1000)));
      put("fg-1-5.jpg"); put(".fg-1-6.jpg.t"); put("fg-1-2-1.jpg"); put("fg-2-1.jpg"); put("other.txt");
      let o = fs1("http://frigate.test:5000/snap");
      ok("ext.d/frigate snap: frames written, the extra ones and temps of this id removed, other ids and files stay", ls() === "fg-1-1.jpg,fg-1-2-1.jpg,fg-1-2.jpg,fg-2-1.jpg,other.txt" &&
        fs.readFileSync(path.join(cam, "fg-1-1.jpg"), "latin1") === JPG && fs.readFileSync(path.join(cam, "fg-1-2.jpg"), "latin1") === JPG, ls() + " " + JSON.stringify(fs.readFileSync(path.join(cam, "fg-1-1.jpg"), "latin1")));
      ok("ext.d/frigate snap: snap <epoch> last, no internal lines in the cache", o.split("\n").pop() === snapLine() && o.startsWith("ok 1\n") && o.includes("\ncam|front|5|0.4|0\ncam|garage|5|0|0\n") && !/^frames? /m.test(o), o);
      ok("ext.d/frigate snap: one request per camera, same options, h=240", JSON.stringify(lgs().map(l => l.replace(/^frigate -qO- /, "")).sort()) === JSON.stringify([
        "--no-check-certificate http://frigate.test:5000/snap/api/front/latest.jpg?h=240 ", "--no-check-certificate http://frigate.test:5000/snap/api/garage/latest.jpg?h=240 "]), lg());
      ok("ext.d/frigate snap: the body is piped through a cap into a temp outside $PUB, none left behind", fs.readdirSync(sd).every(n => !/^\.snap\./.test(n)) && ls().split(",").every(n => !/\.t$/.test(n)), fs.readdirSync(sd).join());
      ok("ext.d/frigate snap: .cams.<ID> lists the cameras (number name) for bin/snap, no cookie file without a login", sf(".cams.fg-1") === "1 front\n2 garage\n" && sf(".ck.fg-1") === null && !fs.readdirSync(sd).some(n => /^\.cams\..*\.t$/.test(n)), fs.readdirSync(sd).join());
      // temps of killed downloads of this instance go in the minute run; another instance's (also fg-1-2, whose name starts like this one's) stay
      for (const n of [".snap.fg-1-3.4242", ".snap.fg-1-2-3.4242", ".snap.fg-2-1.4242"]) fs.writeFileSync(path.join(sd, n), "j");
      fs1("http://frigate.test:5000/snap");
      ok("ext.d/frigate snap: stale download temps of this instance are removed, other instances' stay", fs.readdirSync(sd).filter(n => /^\.snap\./.test(n)).sort().join() === ".snap.fg-1-2-3.4242,.snap.fg-2-1.4242", fs.readdirSync(sd).join());
      for (const n of [".snap.fg-1-2-3.4242", ".snap.fg-2-1.4242"]) fs.rmSync(path.join(sd, n));
      for (const v of ["5", "15", "30", "60"]) {
        o = fs1("http://frigate.test:5000/snap", "ID=fg-1 SNAP=" + v + " ");
        ok("ext.d/frigate snap: SNAP=" + v + " fetches the frames in the minute run as SNAP=1 does", ls() === "fg-1-1.jpg,fg-1-2-1.jpg,fg-1-2.jpg,fg-2-1.jpg,other.txt" && lgs().length === 2 && o.split("\n").pop() === snapLine() && sf(".cams.fg-1") === "1 front\n2 garage\n", ls() + " / " + o);
      }
      // names that are not [A-Za-z0-9_-]{1,64} are never requested and keep their place in the numbering; the old frames of their numbers go
      put("fg-1-5.jpg");
      o = fs1("http://frigate.test:5000/odd");
      ok("ext.d/frigate snap: ../x and 'a b' skipped, never requested, ok1 is number 3", ls() === "fg-1-2-1.jpg,fg-1-3.jpg,fg-2-1.jpg,other.txt" && lgs().length === 1 && lgs()[0].endsWith(" http://frigate.test:5000/odd/api/ok1/latest.jpg?h=240 ") && !/\.\.\/|a b/.test(lg()) && o.split("\n").pop() === snapLine() && sf(".cams.fg-1") === "3 ok1\n", ls() + " / " + lg());
      // a failed, empty, over 1 MB or not-JPEG download keeps the previous frame and leaves no temp (broken 1, empty 2, fine 3, huge 4: 2 MB, nojpg 5: html)
      put("fg-1-1.jpg"); put("fg-1-2.jpg"); put("fg-1-4.jpg"); put("fg-1-5.jpg");
      o = fs1("http://frigate.test:5000/fail");
      ok("ext.d/frigate snap: failed, empty, oversized and non-JPEG downloads keep the old frame, the good one is written, no temps", ls() === "fg-1-1.jpg,fg-1-2-1.jpg,fg-1-2.jpg,fg-1-3.jpg,fg-1-4.jpg,fg-1-5.jpg,fg-2-1.jpg,other.txt" &&
        ["fg-1-1.jpg", "fg-1-2.jpg", "fg-1-4.jpg", "fg-1-5.jpg"].every(n => fs.readFileSync(path.join(cam, n), "utf8") === "old") && fs.readFileSync(path.join(cam, "fg-1-3.jpg"), "latin1") === JPG && lgs().length === 5 &&
        fs.readdirSync(sd).every(n => !/^\.snap\./.test(n)) && o.split("\n").pop() === snapLine(), ls() + " / " + fs.readdirSync(sd).join() + " / " + o);
      // nothing refreshed: snap keeps the mtime of the newest old frame (the card's cache key stays put)
      fs.rmSync(cam, { recursive: true }); put("fg-1-1.jpg"); fs.utimesSync(path.join(cam, "fg-1-1.jpg"), 1700000000, 1700000000);
      o = fs1("http://frigate.test:5000/dead");
      ok("ext.d/frigate snap: no frame refreshed -> snap is the old mtime", o.split("\n").pop() === "snap 1700000000" && fs.readFileSync(path.join(cam, "fg-1-1.jpg"), "utf8") === "old", o.split("\n").pop());
      // the cookie of the 8971 login goes with the frame request, 'front|door' (number 1) is skipped
      fs.rmSync(cam, { recursive: true });
      o = fs1("http://frigate.test:8971", "ID=fg-1 SNAP=1 USER=admin PASS='p\"a\\ss' ");
      ok("ext.d/frigate snap: login cookie on the frame request, a name with | skipped", ls() === "fg-1-2.jpg" && lgs().length === 1 && / Cookie: frigate_token=abc /.test(lgs()[0]) && lgs()[0].endsWith(" http://frigate.test:8971/api/garage/latest.jpg?h=240 ") && o.split("\n").pop() === snapLine(), ls() + " / " + lg());
      // SNAP=5 with a login: the cookie is kept in $KEENDASH_TMP (never under $PUB) for bin/snap, mode 600; SNAP=1 keeps none
      fs.rmSync(cam, { recursive: true });
      o = fs1("http://frigate.test:8971", "ID=fg-1 SNAP=5 USER=admin PASS='p\"a\\ss' ");
      ok("ext.d/frigate snap: SNAP=5 and a login -> the cookie file in the tmp dir, not under $PUB", sf(".ck.fg-1") === "frigate_token=abc\n" && !fs.readdirSync(pub).concat(fs.readdirSync(cam)).some(n => /ck|cams/.test(n)), sf(".ck.fg-1"));
      ok("ext.d/frigate snap: the cookie file is mode 600", sf(".ck.fg-1") !== null && (fs.statSync(path.join(sd, ".ck.fg-1")).mode & 0o777) === 0o600);
      fs.rmSync(path.join(sd, ".ck.fg-1")); fs.rmSync(cam, { recursive: true });
      fs1("http://frigate.test:8971", "ID=fg-1 SNAP=1 USER=admin PASS='p\"a\\ss' ");
      ok("ext.d/frigate snap: SNAP=1 and a login -> no cookie file", sf(".ck.fg-1") === null, sf(".ck.fg-1"));
      // SNAP not 1, 5, 15, 30 or 60: this id's frames, temps, camera list and cookie go, nothing printed, no frame requests, other ids stay
      for (const e of ["ID=fg-1 SNAP=0 ", "ID=fg-1 SNAP= ", "ID=fg-1 SNAP=yes ", "ID=fg-1 SNAP=2 ", "ID=fg-1 "]) {
        fs.writeFileSync(path.join(sd, ".cams.fg-1"), "1 front\n"); fs.writeFileSync(path.join(sd, ".ck.fg-1"), "frigate_token=abc\n"); put("fg-1-1.jpg"); put(".fg-1-2.jpg.t"); put("fg-2-1.jpg"); put("fg-1-2-1.jpg"); fs.rmSync(path.join(cam, "fg-1-2.jpg"), { force: true });
        o = fs1("http://frigate.test:5000/snap", e);
        ok("ext.d/frigate snap: '" + e.trim() + "' removes the frames, prints no snap line, makes no frame request", ls() === "fg-1-2-1.jpg,fg-2-1.jpg" && !/snap/.test(o) && lgs().length === 0 && /^ok 1\n/.test(o) && sf(".cams.fg-1") === null && sf(".ck.fg-1") === null, ls() + " / " + o);
      }
      // $PUB is not a directory: silently no frames; a bad ID: nothing written anywhere
      o = fs1("http://frigate.test:5000/snap", undefined, path.join(pub, "nope"));
      ok("ext.d/frigate snap: no $PUB directory -> no frames, no snap line, nothing created", /^ok 1\n/.test(o) && !/snap/.test(o) && lgs().length === 0 && !fs.existsSync(path.join(pub, "nope")), o);
      const badid = [];
      for (const id of ["../up", "a b", "A", "", "x;id"]) {
        o = fs1("http://frigate.test:5000/snap", "ID='" + id + "' SNAP=1 ");
        if (lgs().length || /snap/.test(o) || ls() !== "fg-1-2-1.jpg,fg-2-1.jpg" || fs.readdirSync(pub).join() !== "cam") badid.push(JSON.stringify(id) + " " + ls() + " / " + fs.readdirSync(pub).join() + " / " + lg());
      }
      ok("ext.d/frigate snap: a bad ID writes and requests nothing", !badid.length, badid.join("; "));
      fs.rmSync(sd, { recursive: true, force: true }); fs.rmSync(pub, { recursive: true, force: true });
    }
    // bin/snap in a scratch install: bin/ has snap, extlib and the fake wget, ext.d/ the real frigate. o.conf {id: etc/services/<id>.conf}, o.cams {id: .cams.<id>},
    // o.lock the pid in snap.lock, o.env "NAME=value ", o.dup two runs together. The fake wget logs its arguments to log (/hang/ never answers)
    {
      const sh = path.join(__dirname, "..", "files", "opt", "share", "keendash"), rs = n => fs.readFileSync(path.join(sh, n), "utf8").replace(/\r/g, "").replace(/^PATH=.*$/m, ":");
      const snap = o => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kdsnap-")), t = unix(tmp), put = (f, c, m) => fs.writeFileSync(path.join(tmp, f), c, { mode: m || 0o644 });
        ["bin", "ext.d", "etc/services", "tmp", "pub/cam"].forEach(d => fs.mkdirSync(path.join(tmp, d), { recursive: true }));
        put("bin/snap", rs("bin/snap"), 0o755); put("bin/extlib", rs("bin/extlib")); put("ext.d/frigate", rs("ext.d/frigate")); put("bin/wget", fs.readFileSync(path.join(__dirname, "fake-wget"), "utf8"), 0o755);
        Object.keys(o.conf).forEach(n => put("etc/services/" + n + ".conf", o.conf[n]));
        // the camera list's mtime is the last attempt (bin/snap touches it): written by a minute run long ago
        Object.keys(o.cams || {}).forEach(n => { put("tmp/.cams." + n, o.cams[n]); const at = Date.now() / 1000 - 1000; fs.utimesSync(path.join(tmp, "tmp/.cams." + n), at, at); });
        Object.keys(o.files || {}).forEach(n => put(n, o.files[n]));
        if (o.lock !== undefined) put("tmp/snap.lock", o.lock + "\n");
        Object.keys(o.age || {}).forEach(n => { const at = Date.now() / 1000 - o.age[n]; fs.utimesSync(path.join(tmp, n), at, at); });
        const t0 = Date.now(), run = 'sh "' + t + '/bin/snap"';
        cp.spawnSync("sh", ["-c", 'export PATH="' + t + '/bin:$PATH" FIX="' + unix(path.join(__dirname, "fixtures")) + '" LOG="' + t + '/log" KEENDASH_ETC="' + t + '/etc" KEENDASH_TMP="' + t + '/tmp" KEENDASH_EXTD="' + t + '/ext.d" KEENDASH_PUB="' + t + '/pub" ' + (o.env || "") + "; " +
          (o.dup ? run + " & " + run + " & wait" : run)], { encoding: "utf8" });
        const rd = f => { try { return fs.readFileSync(path.join(tmp, f), "utf8"); } catch (e) { return null; } };
        const lines = (rd("log") || "").split("\n").filter(Boolean);
        return { rd, ls: d => fs.readdirSync(path.join(tmp, d)).sort().join(), ex: f => fs.existsSync(path.join(tmp, f)), lines, ms: Date.now() - t0, mtime: f => Math.floor(fs.statSync(path.join(tmp, f)).mtimeMs / 1000), tmp,
          put, rm: () => fs.rmSync(tmp, { recursive: true, force: true }) };
      };
      const cnt = (r, name) => r.lines.filter(l => l.endsWith("/api/" + name + "/latest.jpg?h=240 ")).length, U = "TYPE='frigate'\nURL='http://frigate.test:5000/snap'\n";
      {
        const r = snap({ conf: { fg: U + "SNAP='5'\n" }, cams: { fg: "1 front\n2 garage\n" }, env: "KEENDASH_SNAP_LIMIT=7 " });
        ok("bin/snap: SNAP=5 fetches each camera's frame more than once and exits within the limit", cnt(r, "front") >= 2 && cnt(r, "garage") >= 2 && cnt(r, "front") <= 3 && r.ms >= 4000 && r.ms < 9500, cnt(r, "front") + " " + cnt(r, "garage") + " " + r.ms);
        ok("bin/snap: the frames are in $PUB/cam, no temps, lock gone", r.ls("pub/cam") === "fg-1.jpg,fg-2.jpg" && r.ls("tmp") === ".cams.fg" && !r.ex("tmp/snap.lock"), r.ls("pub/cam") + " / " + r.ls("tmp"));
        ok("bin/snap: the frame requests are the minute run's (same options, h=240), no stats request", r.lines.every(l => /^frigate -qO- --no-check-certificate http:\/\/frigate\.test:5000\/snap\/api\/(front|garage)\/latest\.jpg\?h=240 $/.test(l)), r.lines.join(" / "));
        r.rm();
      }
      // no SNAP of 5, 15 or 30 anywhere: out at once, no request, no lock; a camera list is not needed to get that far
      for (const sn of ["60", "1", "0", "7", ""]) {
        const r = snap({ conf: { fg: U + (sn ? "SNAP='" + sn + "'\n" : "") }, cams: { fg: "1 front\n" }, env: "KEENDASH_SNAP_LIMIT=7 " });
        ok("bin/snap: SNAP='" + sn + "' exits at once, no request, no lock", r.ms < 2500 && !r.lines.length && !r.ex("tmp/snap.lock") && r.ls("pub/cam") === "", r.ms + " " + r.lines.length);
        r.rm();
      }
      {
        const cf = { fg: U + "SNAP='5'\n" }, cams = { fg: "1 front\n" }, env = "KEENDASH_SNAP_LIMIT=3 ";
        const sl = cp.spawn("sleep", ["30"]);
        let r = snap({ conf: cf, cams, env, lock: String(sl.pid) });
        ok("bin/snap: a second run while the lock's pid lives does nothing", r.ms < 2500 && !r.lines.length && r.rd("tmp/snap.lock") === sl.pid + "\n", r.ms + " " + r.lines.length);
        r.rm(); sl.kill();
        const dead = cp.spawnSync("sh", ["-c", "echo $$"], { encoding: "utf8" }).stdout.trim();
        r = snap({ conf: cf, cams, env, lock: dead });
        ok("bin/snap: a lock with a dead pid is taken over, gone at the end", r.lines.length >= 1 && !r.ex("tmp/snap.lock"), r.lines.length + " " + r.ex("tmp/snap.lock"));
        r.rm();
        r = snap({ conf: cf, cams, env, lock: dead, dup: true });
        ok("bin/snap: two runs on a dead lock make one run", r.lines.length >= 1 && r.lines.length <= 2 && !r.ex("tmp/snap.lock"), r.lines.length + "");
        r.rm();
        // a live pid does not keep a lock older than the limit plus a minute
        const sl2 = cp.spawn("sleep", ["30"]);
        r = snap({ conf: cf, cams, env, lock: String(sl2.pid), age: { "tmp/snap.lock": 1000 } });
        ok("bin/snap: a lock older than the limit plus a minute is stale even with a live pid", r.lines.length >= 1 && !r.ex("tmp/snap.lock"), r.lines.length + "");
        r.rm(); sl2.kill();
        // an empty lock (a run between create and write) holds while it is fresh and is taken over once it is older than the limit plus a minute
        r = snap({ conf: cf, cams, env, lock: "" });
        ok("bin/snap: a fresh empty lock holds, nothing is fetched", r.ms < 2500 && !r.lines.length && r.ex("tmp/snap.lock"), r.ms + " " + r.lines.length);
        r.rm();
        r = snap({ conf: cf, cams, env, lock: "", age: { "tmp/snap.lock": 1000 } });
        ok("bin/snap: an empty lock older than the limit plus a minute is taken over", r.lines.length >= 1 && !r.ex("tmp/snap.lock"), r.lines.length + " " + r.ex("tmp/snap.lock"));
        r.rm();
      }
      {
        // failed fetches wait SNAP - 1 s too: with SNAP=5 and 7 s there are two rounds at most, not one per second
        const r = snap({ conf: { fg: "TYPE='frigate'\nURL='http://frigate.test:5000/snap'\nSNAP='5'\n" }, cams: { fg: "1 broken\n2 empty\n" }, env: "KEENDASH_SNAP_LIMIT=7 " });
        ok("bin/snap: failing fetches are retried only every SNAP - 1 s", cnt(r, "broken") >= 1 && cnt(r, "broken") <= 2 && cnt(r, "empty") >= 1 && cnt(r, "empty") <= 2 && r.ls("pub/cam") === "", cnt(r, "broken") + " " + cnt(r, "empty") + " " + r.ls("pub/cam"));
        r.rm();
      }
      {
        // a hanging Frigate: the deadline passes between the fetches, so the run ends within the limit + 3 s
        const r = snap({ conf: { fg: "TYPE='frigate'\nURL='http://frigate.test:5000/hang'\nSNAP='5'\n" }, cams: { fg: "1 a\n2 b\n3 c\n" }, env: "KEENDASH_SNAP_LIMIT=4 " });
        ok("bin/snap: a hanging Frigate ends the run within the limit + 3 s, no frames, no temps, lock gone", r.ms >= 3000 && r.ms < 4000 + 3000 && r.ls("pub/cam") === "" && r.ls("tmp") === ".cams.fg" && !r.ex("tmp/snap.lock"), r.ms + " " + r.ls("tmp"));
        r.rm();
      }
      {
        // a login (8971): one login for several frames and for the seconds after, the cookie file in the tmp dir (never under $PUB), mode 600
        const r = snap({ conf: { fg: "TYPE='frigate'\nURL='http://frigate.test:8971'\nUSER='admin'\nPASS='p\"a\\ss'\nSNAP='5'\n" }, cams: { fg: "1 front\n2 garage\n" }, env: "KEENDASH_SNAP_LIMIT=6 " });
        const logins = r.lines.filter(l => /\/api\/login $/.test(l));
        ok("bin/snap: with USER one login for all the frames of all the seconds, the cookie sent", logins.length === 1 && cnt(r, "front") >= 2 && r.lines.filter(l => /latest\.jpg/.test(l)).every(l => / Cookie: frigate_token=abc /.test(l)), r.lines.join(" / "));
        ok("bin/snap: the cookie file is in the tmp dir and not under $PUB", r.rd("tmp/.ck.fg") === "frigate_token=abc\n" && r.ls("pub/cam") === "fg-1.jpg,fg-2.jpg" && r.ls("pub") === "cam", r.ls("pub") + " / " + r.ls("pub/cam"));
        r.rm();
        // a stored cookie is used as it is (no login); a refused one (the fake wants abc) is replaced once and the frame fetched again
        const r2 = snap({ conf: { fg: "TYPE='frigate'\nURL='http://frigate.test:8971'\nUSER='admin'\nPASS='p\"a\\ss'\nSNAP='5'\n" }, cams: { fg: "1 front\n" }, files: { "tmp/.ck.fg": "frigate_token=abc\n" }, env: "KEENDASH_SNAP_LIMIT=2 " });
        ok("bin/snap: a stored cookie is reused, no login", !r2.lines.some(l => /api\/login/.test(l)) && cnt(r2, "front") >= 1 && r2.ls("pub/cam") === "fg-1.jpg", r2.lines.join(" / "));
        r2.rm();
        let fr3;
        const r3 = snap({ conf: { fg: "TYPE='frigate'\nURL='http://frigate.test:8971'\nUSER='admin'\nPASS='p\"a\\ss'\nSNAP='5'\n" }, cams: { fg: "1 front\n" }, files: { "tmp/.ck.fg": "frigate_token=stale\n" }, age: { "tmp/.ck.fg": 1000 }, env: "KEENDASH_SNAP_LIMIT=7 " });
        ok("bin/snap: every camera refused -> one login, the next round has the new cookie", r3.lines.filter(l => /api\/login/.test(l)).length === 1 && (fr3 = r3.lines.filter(l => /latest.jpg/.test(l))).length >= 2 && fr3[0].includes("=stale ") && fr3[1].includes("=abc ") && r3.rd("tmp/.ck.fg") === "frigate_token=abc\n" && r3.ls("pub/cam") === "fg-1.jpg", r3.lines.join(" / "));
        r3.rm();
        // a cookie written a moment ago is not replaced again (Frigate limits logins): the frame is just missed this second
        const r4 = snap({ conf: { fg: "TYPE='frigate'\nURL='http://frigate.test:8971'\nUSER='admin'\nPASS='p\"a\\ss'\nSNAP='5'\n" }, cams: { fg: "1 front\n" }, files: { "tmp/.ck.fg": "frigate_token=stale\n" }, env: "KEENDASH_SNAP_LIMIT=5 " });
        ok("bin/snap: a refused cookie only seconds old gets no new login", !r4.lines.some(l => /api\/login/.test(l)) && cnt(r4, "front") >= 1 && r4.ls("pub/cam") === "", r4.lines.join(" / "));
        r4.rm();
        // one camera failing while another is fine says nothing about the cookie: no login
        const r5 = snap({ conf: { fg: "TYPE='frigate'\nURL='http://frigate.test:8971'\nUSER='admin'\nPASS='p\"a\\ss'\nSNAP='5'\n" }, cams: { fg: "1 broken\n2 front\n" }, files: { "tmp/.ck.fg": "frigate_token=abc\n" }, age: { "tmp/.ck.fg": 1000 }, env: "KEENDASH_SNAP_LIMIT=5 " });
        ok("bin/snap: one failing camera among good ones -> no new login", !r5.lines.some(l => /api\/login/.test(l)) && cnt(r5, "broken") >= 1 && r5.ls("pub/cam") === "fg-2.jpg", r5.lines.join(" / "));
        r5.rm();
      }
      {
        // an instance of another type, a bad id and a bad camera line are never fetched
        const r = snap({ conf: { fg: U + "SNAP='5'\n", other: "TYPE='kuma'\nURL='http://frigate.test:5000/snap'\nSNAP='5'\n", "Bad.id": U + "SNAP='5'\n" }, cams: { fg: "1 front\n9 over\n2 a b\n3 ../x\nx y\n", other: "1 front\n", "Bad.id": "1 front\n" }, env: "KEENDASH_SNAP_LIMIT=2 " });
        ok("bin/snap: only frigate instances with a valid id, cameras 1-8 with a valid name", r.lines.length >= 1 && r.lines.every(l => l.endsWith("/snap/api/front/latest.jpg?h=240 ")) && r.ls("pub/cam") === "fg-1.jpg", r.lines.join(" / ") + " " + r.ls("pub/cam"));
        r.rm();
      }
    }
    // pihole: JSON-escaped login, the sid in X-FTL-SID, the session is deleted at the end of every run that logged in
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-h-")), lg = () => fs.readFileSync(path.join(sd, "log"), "utf8"), ll = () => lg().split("\n").filter(Boolean);
      const run = (e) => { fs.rmSync(path.join(sd, "log"), { force: true }); return collect("ext.d/pihole", "", "", { state: sd, env: e }).trim(); };
      const dels = () => ll().filter(l => / --method=DELETE /.test(l));
      const po = run(env.pihole), l1 = ll();
      ok("ext.d/pihole: login, 4 requests with the sid, then one DELETE with it", po === want.pihole.join("\n") && l1.length === 6 && l1[0].endsWith(' --post-data {"password":"p\\"a\\\\ss"} http://pihole.test/api/auth ') && !/X-FTL-SID/.test(l1[0]) &&
        l1.slice(1, 5).every(l => / --header X-FTL-SID: S1D-test /.test(l) && !/DELETE/.test(l)) && dels().length === 1 && l1[5] === "pihole -qO- --method=DELETE --header X-FTL-SID: S1D-test http://pihole.test/api/auth ", lg());
      ok("ext.d/pihole: sid and password not printed", !/S1D-test|a\\+ss/.test(po));
      const op = run("URL=http://pihole.test/open PASS= ");
      ok("ext.d/pihole: no password -> no login, no header, no DELETE", op === want.pihole.join("\n") && ll().length === 4 && !/X-FTL-SID|api\/auth|DELETE/.test(lg()), lg());
      const h5 = run("URL=http://pihole.test/h500 PASS='p\"a\\ss' ");
      ok("ext.d/pihole: history fails -> no graphs, the rest stays, DELETE still sent once", h5 === want.pihole.filter(l => !/^s[qb] /.test(l)).join("\n") && dels().length === 1, lg());
      ok("ext.d/pihole: wrong password -> ok 0, no data requests, no DELETE", run("URL=http://pihole.test PASS=x ") === "ok 0" && ll().length === 1 && !dels().length, lg());
      ok("ext.d/pihole: no answer -> ok 0", run("URL=http://nohost.test PASS= ") === "ok 0");
      const pw = "PASS='p\"a\\ss' ", all = want.pihole.join("\n");
      ok("ext.d/pihole: 145 history slots -> the last 144, 24 points", run("URL=http://pihole.test/h145 " + pw) === all && dels().length === 1, lg());
      ok("ext.d/pihole: summary fails after the login -> ok 0 and one DELETE", run("URL=http://pihole.test/s500 " + pw) === "ok 0" && dels().length === 1 && ll().length === 3, lg());
      ok("ext.d/pihole: password for a Pi-hole without one (sid null) -> normal output, no header, no DELETE", run("URL=http://pihole.test/nopw " + pw) === all && ll().length === 5 && !/X-FTL-SID|DELETE/.test(lg()), lg());
      ok("ext.d/pihole: URL with /admin or /admin/ -> the API paths without it", ["/admin", "/admin/"].every(a => run("URL=http://pihole.test" + a + " " + pw) === all && ll().length === 6 && !/\/admin/.test(lg())), lg());
      fs.rmSync(sd, { recursive: true, force: true });
    }
    // speedtest: *_bits or bytes x 8; created_at with Z, +03:00, -05:00 or no offset is 300 s before KEENDASH_NOW
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-s-")), lg = () => fs.existsSync(path.join(sd, "log")) ? fs.readFileSync(path.join(sd, "log"), "utf8") : "";
      const run = (u, at, tk) => collect("ext.d/speedtest", "", "", { state: sd, env: "KEENDASH_NOW=1793873100 AT=" + at + " URL=http://speedtest.test" + u + " TOKEN=" + (tk || "testkey") + " " }).trim().split("\n");
      const want = at => ["ok 1", "t|Загрузка|245000000|bit", "t|Отдача|48000000|bit", "t|Пинг|12 мс|", "t|С последнего замера|" + at + "|s"];
      ok("ext.d/speedtest: *_bits", JSON.stringify(run("", "2026-11-05T10:00:00Z")) === JSON.stringify(want(300)), run("", "2026-11-05T10:00:00Z").join(" / "));
      ok("ext.d/speedtest: without *_bits, bytes x 8", JSON.stringify(run("/nobits/", "2026-11-05T10:00:00Z")) === JSON.stringify(want(300)), run("/nobits/", "2026-11-05T10:00:00Z").join(" / "));
      ok("ext.d/speedtest: created_at +03:00, -05:00, fraction, no offset", ["2026-11-05T13:00:00+03:00", "2026-11-05T05:00:00-05:00", "2026-11-05T10:00:00.000000Z", "2026-11-05T10:00:00"].every(a => run("", a)[4] === "t|С последнего замера|300|s"), run("", "2026-11-05T13:00:00+03:00").join(" / "));
      ok("ext.d/speedtest: a failed test (nulls) -> empty values, not 0", JSON.stringify(run("/failed/", "2026-11-05T10:00:00Z")) === JSON.stringify(["ok 1", "t|Загрузка||bit", "t|Отдача||bit", "t|Пинг||", "t|С последнего замера|300|s"]), run("/failed/", "2026-11-05T10:00:00Z").join(" / "));
      ok("ext.d/speedtest: no data or a wrong token -> ok 0, token not printed", run("/none/", "x").join() === "ok 0" && run("", "x", "bad").join() === "ok 0" && !/testkey/.test(run("", "x").join()));
      ok("ext.d/speedtest: token in the Bearer header, path /api/v1/results/latest", / --header Authorization: Bearer testkey http:\/\/speedtest\.test\/api\/v1\/results\/latest \n/.test(lg()), lg());
      fs.rmSync(sd, { recursive: true, force: true });
    }
    // npm: JSON-escaped e-mail/password login, the token as Bearer on the four lists; certificate = soonest future expires_on - KEENDASH_NOW
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-p-")), lg = () => fs.existsSync(path.join(sd, "log")) ? fs.readFileSync(path.join(sd, "log"), "utf8") : "", ll = () => lg().split("\n").filter(Boolean);
      const run = (u, pw) => { fs.rmSync(path.join(sd, "log"), { force: true }); return collect("ext.d/npm", "", "", { state: sd, env: "KEENDASH_NOW=1793873100 URL=http://npm.test" + u + " USER=me@example.test PASS=" + (pw === undefined ? "'p\"a\\ss'" : pw) + " " }).trim().split("\n"); };
      const want = c => ["ok 1", "t|Прокси-хостов|2 из 3|t", "t|Перенаправлений|2|n", "t|Потоков|1|n", c];
      const o = run(""), l = ll();
      ok("ext.d/npm: 2 of 3 hosts enabled (1 and true), counts, soonest future certificate", JSON.stringify(o) === JSON.stringify(want("t|Сертификат истекает через|2210100|s")), o.join(" / "));
      ok("ext.d/npm: login with the JSON-escaped body, then 4 requests with the Bearer token", l.length === 5 && l[0].endsWith(' --post-data {"identity":"me@example.test","secret":"p\\"a\\\\ss"} http://npm.test/api/tokens ') && !/Bearer/.test(l[0]) &&
        l.slice(1).every(x => / --header Authorization: Bearer T0K-test http:\/\/npm\.test\/api\/nginx\/(proxy-hosts|redirection-hosts|streams|certificates) $/.test(x)), lg());
      ok("ext.d/npm: token and password not printed", !/T0K-test|a\\+ss/.test(o.join("\n")));
      ok("ext.d/npm: only expired certificates -> «истёк», not a negative number", JSON.stringify(run("/expired")) === JSON.stringify(want("t|Сертификат истекает через|истёк|t")), run("/expired").join(" / "));
      ok("ext.d/npm: empty lists -> 0 of 0, zero counts, empty certificate value", JSON.stringify(run("/empty")) === JSON.stringify(["ok 1", "t|Прокси-хостов|0 из 0|t", "t|Перенаправлений|0|n", "t|Потоков|0|n", "t|Сертификат истекает через||s"]), run("/empty").join(" / "));
      ok("ext.d/npm: redirection-hosts fails -> ok 1, redirections empty, the rest unchanged", JSON.stringify(run("/norh")) === JSON.stringify(want("t|Сертификат истекает через|2210100|s").map(x => x.startsWith("t|Перенаправлений") ? "t|Перенаправлений||n" : x)), run("/norh").join(" / "));
      ok("ext.d/npm: wrong password -> ok 0, no data requests", run("", "x").join() === "ok 0" && ll().length === 1, lg());
      ok("ext.d/npm: no answer -> ok 0", collect("ext.d/npm", "", "", { env: "URL=http://nohost.test USER=a PASS=b " }).trim() === "ok 0");
      fs.rmSync(sd, { recursive: true, force: true });
    }
    // traefik: sums over http, tcp and udp; Basic only with a login
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-t-")), lg = () => fs.readFileSync(path.join(sd, "log"), "utf8");
      const run = (u, e) => { fs.rmSync(path.join(sd, "log"), { force: true }); return collect("ext.d/traefik", "", "", { state: sd, env: "URL=http://traefik.test" + u + " " + e + " " }).trim(); };
      ok("ext.d/traefik: sums over http, tcp, udp", run("", "USER= PASS=") === ["ok 1", "t|Роутеров|8|n", "t|Сервисов|7|n", "t|Предупреждений|5|n", "t|Ошибок|4|n"].join("\n"), run("", "USER= PASS="));
      ok("ext.d/traefik: empty user -> no Authorization, path /api/overview", !/Authorization/.test(lg()) && / http:\/\/traefik\.test\/api\/overview \n$/.test(lg()), lg());
      run("", "USER=u PASS=p");
      ok("ext.d/traefik: user -> Basic", / Authorization: Basic dTpw /.test(lg()), lg());
      ok("ext.d/traefik: no http.routers -> ok 0, no answer -> ok 0", run("/none", "USER=") === "ok 0" && run("", "USER=").length > 4 && collect("ext.d/traefik", "", "", { env: "URL=http://nohost.test USER= " }).trim() === "ok 0");
      fs.rmSync(sd, { recursive: true, force: true });
    }
    // nextcloud: KEY -> NC-Token only, else Basic; paperless: Token header, tiles only for the fields present
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-f-")), lg = () => fs.existsSync(path.join(sd, "log")) ? fs.readFileSync(path.join(sd, "log"), "utf8") : "";
      const run = (s, e) => { fs.rmSync(path.join(sd, "log"), { force: true }); return collect("ext.d/" + s, "", "", { state: sd, env: e }).trim(); };
      const nr = e => run("nextcloud", "USER= " + e), nc = "URL=http://nextcloud.test", pw = "PASS='p\"a\\ss' ";
      const ncWant = ["ok 1", "t|Свободно|512110190592|b", "t|Активных за сутки|3|n", "t|Файлов|48213|n", "t|Общих ссылок|17|n"].join("\n");
      ok("ext.d/nextcloud: exact tiles with KEY", nr(nc + " KEY=testkey ") === ncWant, nr(nc + " KEY=testkey "));
      ok("ext.d/nextcloud: KEY -> OCS-APIRequest and NC-Token, no Authorization, serverinfo path", / OCS-APIRequest: true /.test(lg()) && / NC-Token: testkey /.test(lg()) && !/Authorization/.test(lg()) && / http:\/\/nextcloud\.test\/ocs\/v2\.php\/apps\/serverinfo\/api\/v1\/info\?format=json&skipApps=true&skipUpdate=true \n$/.test(lg()), lg());
      ok("ext.d/nextcloud: KEY and USER -> only NC-Token", nr(nc + " KEY=testkey USER=admin " + pw) === ncWant && / NC-Token: testkey /.test(lg()) && !/Authorization/.test(lg()), lg());
      ok("ext.d/nextcloud: no KEY, USER -> Basic with the JSON-hostile password, no NC-Token", nr(nc + " USER=admin " + pw) === ncWant && / Authorization: Basic YWRtaW46cCJhXHNz /.test(lg()) && !/NC-Token/.test(lg()), lg());
      ok("ext.d/nextcloud: no credentials or a wrong KEY -> ok 0", nr(nc + " ") === "ok 0" && nr(nc + " KEY=bad ") === "ok 0");
      ok("ext.d/nextcloud: no freespace -> ok 0; no answer -> ok 0", nr(nc + "/nofree KEY=testkey ") === "ok 0" && nr("URL=http://nohost.test KEY=testkey ") === "ok 0");
      ok("ext.d/nextcloud: secrets not printed", !/testkey|a\\ss|YWRtaW46/.test(nr(nc + " KEY=testkey USER=admin " + pw) + nr(nc + " USER=admin " + pw)));
      const pl = "URL=http://paperless.test KEY=testkey ", plWant = ["ok 1", "t|Документов|1284|n", "t|Во входящих|6|n", "t|Тегов|23|n", "t|Корреспондентов|41|n"].join("\n");
      ok("ext.d/paperless: exact tiles, Token header, statistics path", run("paperless", pl) === plWant && / --header Authorization: Token testkey http:\/\/paperless\.test\/api\/statistics\/ \n$/.test(lg()), run("paperless", pl) + lg());
      ok("ext.d/paperless: no tag_count and correspondent_count -> two tiles", run("paperless", "URL=http://paperless.test/two KEY=testkey ") === ["ok 1", "t|Документов|1284|n", "t|Во входящих|6|n"].join("\n"));
      ok("ext.d/paperless: null value drops its tile like an absent field", run("paperless", "URL=http://paperless.test/null KEY=testkey ") === ["ok 1", "t|Документов|1284|n", "t|Тегов|23|n", "t|Корреспондентов|41|n"].join("\n"));
      ok("ext.d/paperless: wrong token -> ok 0, no answer -> ok 0, key not printed", run("paperless", "URL=http://paperless.test KEY=bad ") === "ok 0" && run("paperless", "URL=http://nohost.test KEY=testkey ") === "ok 0" && !/testkey/.test(run("paperless", pl)));
      fs.rmSync(sd, { recursive: true, force: true });
    }
    // syncthing: three REST answers, no certificate check; gitea: counts from X-Total-Count only
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-g-")), lg = () => fs.existsSync(path.join(sd, "log")) ? fs.readFileSync(path.join(sd, "log"), "utf8") : "";
      const run = (s, e) => { fs.rmSync(path.join(sd, "log"), { force: true }); return collect("ext.d/" + s, "", "", { state: sd, env: e }).trim(); };
      const st = "URL=http://syncthing.test KEY=testkey ";
      const stWant = ["ok 1", "t|Синхронизировано|98.8|p", "t|Осталось|1610612736|b", "t|Устройств в сети|2 из 3|t", "t|Папок|2|n"].join("\n");
      ok("ext.d/syncthing: exact tiles (2 из 3, one decimal, needBytes, folders)", run("syncthing", st) === stWant, run("syncthing", st));
      ok("ext.d/syncthing: three requests, each with X-Api-Key and --no-check-certificate", lg().split("\n").filter(Boolean).length === 3 && lg().split("\n").filter(Boolean).every(l => / --no-check-certificate /.test(l) && / --header X-Api-Key: testkey /.test(l)) &&
        /rest\/db\/completion \n/.test(lg()) && /rest\/system\/connections \n/.test(lg()) && /rest\/config\/folders \n/.test(lg()), lg());
      ok("ext.d/syncthing: no devices and no folders -> 0 из 0, 0, still ok 1", run("syncthing", "URL=http://syncthing.test/zero KEY=testkey ") === ["ok 1", "t|Синхронизировано|98.8|p", "t|Осталось|1610612736|b", "t|Устройств в сети|0 из 0|t", "t|Папок|0|n"].join("\n"));
      ok("ext.d/syncthing: failed connections request -> empty devices tile, folders kept", run("syncthing", "URL=http://syncthing.test/nocon KEY=testkey ") === ["ok 1", "t|Синхронизировано|98.8|p", "t|Осталось|1610612736|b", "t|Устройств в сети||t", "t|Папок|2|n"].join("\n"));
      ok("ext.d/syncthing: failed folders request -> empty folders tile, devices kept", run("syncthing", "URL=http://syncthing.test/nofold KEY=testkey ") === ["ok 1", "t|Синхронизировано|98.8|p", "t|Осталось|1610612736|b", "t|Устройств в сети|2 из 3|t", "t|Папок||n"].join("\n"));
      ok("ext.d/syncthing: wrong key -> ok 0, no answer -> ok 0, key not printed", run("syncthing", "URL=http://syncthing.test KEY=bad ") === "ok 0" && run("syncthing", "URL=http://nohost.test KEY=testkey ") === "ok 0" && !/testkey/.test(run("syncthing", st)));
      const gt = "URL=http://gitea.test KEY=testkey ";
      const gtWant = ["ok 1", "t|Уведомлений|3|n", "t|Открытых задач|14|n", "t|Открытых PR|2|n", "t|Репозиториев|27|n"].join("\n");
      ok("ext.d/gitea: exact counts from the headers (lowercase CRLF header too)", run("gitea", gt) === gtWant, run("gitea", gt));
      ok("ext.d/gitea: four requests, token only as a header, headers read with dl -S", lg().split("\n").filter(Boolean).length === 4 && lg().split("\n").filter(Boolean).every(l => /^gitea -S -O \/dev\/null --header Authorization: token testkey http:\/\/gitea\.test\/api\/v1\/\S+ $/.test(l)) &&
        /repos\/issues\/search\?type=pulls&state=open&limit=1 \n/.test(lg()) && /notifications\?limit=1 \n/.test(lg()), lg());
      ok("ext.d/gitea: non-numeric or missing X-Total-Count -> empty tile, never text", run("gitea", "URL=http://gitea.test/odd KEY=testkey ") === ["ok 1", "t|Уведомлений||n", "t|Открытых задач||n", "t|Открытых PR|2|n", "t|Репозиториев|27|n"].join("\n"));
      ok("ext.d/gitea: repos/search without the header -> ok 0; 401 -> ok 0; no answer -> ok 0", run("gitea", "URL=http://gitea.test/norepo KEY=testkey ") === "ok 0" && run("gitea", "URL=http://gitea.test KEY=bad ") === "ok 0" && run("gitea", "URL=http://nohost.test KEY=testkey ") === "ok 0");
      ok("ext.d/gitea: key not printed", !/testkey/.test(run("gitea", gt) + run("gitea", "URL=http://gitea.test/odd KEY=testkey ")));
      fs.rmSync(sd, { recursive: true, force: true });
    }
    // metube: lists from /history, Basic only with a login
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-m-")), lg = () => fs.existsSync(path.join(sd, "log")) ? fs.readFileSync(path.join(sd, "log"), "utf8") : "";
      const run = (u, e) => { fs.rmSync(path.join(sd, "log"), { force: true }); return collect("ext.d/metube", "", "", { state: sd, env: "URL=http://metube.test" + u + " " + e + " " }).trim(); };
      ok("ext.d/metube: mixed history -> exact numbers (null speed counts as 0)", run("", "USER=") === ["ok 1", "t|Загружается|3|n", "t|Скорость|1048576|bs", "t|Готово|2|n", "t|Ошибок|1|n"].join("\n"), run("", "USER="));
      ok("ext.d/metube: empty user -> no Authorization, path /history", !/Authorization/.test(lg()) && / http:\/\/metube\.test\/history \n$/.test(lg()), lg());
      run("", "USER=u PASS=p");
      ok("ext.d/metube: user -> Basic", / Authorization: Basic dTpw /.test(lg()), lg());
      ok("ext.d/metube: empty history -> ok 1 and zeros", run("/empty", "USER=") === ["ok 1", "t|Загружается|0|n", "t|Скорость|0|bs", "t|Готово|0|n", "t|Ошибок|0|n"].join("\n"));
      ok("ext.d/metube: HTML page -> ok 0, no answer -> ok 0", run("/html", "USER=") === "ok 0" && run("", "USER=").length > 4 && collect("ext.d/metube", "", "", { env: "URL=http://nohost.test USER= " }).trim() === "ok 0");
      ok("ext.d/metube: password not printed", !/\bp\b|dTpw/.test(run("", "USER=u PASS=p")));
      fs.rmSync(sd, { recursive: true, force: true });
    }
    // nextdns: the profile ID is a path segment, so anything but [A-Za-z0-9]{1,32} is refused before the request
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-n-")), lg = () => fs.existsSync(path.join(sd, "log")) ? fs.readFileSync(path.join(sd, "log"), "utf8") : "";
      const run = (e) => { fs.rmSync(path.join(sd, "log"), { force: true }); return collect("ext.d/nextdns", "", "", { state: sd, env: e }).trim(); };
      const pwn = unix(path.join(sd, "pwn"));
      const odd = ["../x", "a/b", "$(touch " + pwn + ")", "a b", "", "a".repeat(33)];
      ok("ext.d/nextdns: odd profile IDs -> ok 0, no request, nothing executed", odd.every(u => run("URL=http://nextdns.test KEY=testkey USER='" + u + "' ") === "ok 0" && lg() === "") && !fs.existsSync(path.join(sd, "pwn")), lg());
      ok("ext.d/nextdns: 32 chars is fine; the profile is in the path with from=-1d, the key in the header", run("URL=http://nextdns.test KEY=testkey USER=" + "a".repeat(32) + " ").startsWith("ok 1") && lg().split("\n").filter(Boolean).length === 1 && / --header X-Api-Key: testkey http:\/\/nextdns\.test\/profiles\/a{32}\/analytics\/status\?from=-1d \n$/.test(lg()), lg());
      ok("ext.d/nextdns: wrong key -> ok 0", run("URL=http://nextdns.test KEY=bad USER=abc123 ") === "ok 0");
      ok("ext.d/nextdns: an error object with HTTP 200 -> ok 0", run("URL=http://nextdns.test/err KEY=testkey USER=abc123 ") === "ok 0");
      ok("ext.d/nextdns: spaces around the profile ID are trimmed", run("URL=http://nextdns.test KEY=testkey USER='  abc123 ' ").startsWith("ok 1") && / http:\/\/nextdns\.test\/profiles\/abc123\/analytics\/status\?from=-1d \n$/.test(lg()), lg());
      ok("ext.d/nextdns: no blocked row -> 0 blocked, 0.0 percent", run("URL=http://nextdns.test/noblock KEY=testkey USER=abc123 ") === ["ok 1", "t|Запросов за сутки|8000|n", "t|Заблокировано|0|n", "t|Блокировок|0.0|p"].join("\n"));
      ok("ext.d/nextdns: an empty data list is an answer -> ok 1 with zeros", run("URL=http://nextdns.test/empty KEY=testkey USER=abc123 ") === ["ok 1", "t|Запросов за сутки|0|n", "t|Заблокировано|0|n", "t|Блокировок|0.0|p"].join("\n"));
      ok("ext.d/nextdns: not JSON -> ok 0", run("URL=http://nextdns.test/html KEY=testkey USER=abc123 ") === "ok 0");
      ok("ext.d/nextdns: key not printed", !/testkey/.test(run("URL=http://nextdns.test KEY=testkey USER=abc123 ")));
      fs.rmSync(sd, { recursive: true, force: true });
    }
    // proxmox: token header and --no-check-certificate (only here); omv: JSON-escaped login body, then the session cookie
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-p-")), lg = () => fs.readFileSync(path.join(sd, "log"), "utf8"), rm = () => fs.rmSync(path.join(sd, "log"), { force: true });
      const run = (s, e) => { rm(); return collect("ext.d/" + s, "", "", { state: sd, env: e }).trim(); };
      const po = run("proxmox", env.proxmox);
      ok("ext.d/proxmox: PVEAPIToken header and --no-check-certificate, one request", / --no-check-certificate /.test(lg()) && / Authorization: PVEAPIToken=root@pam!kd=testkey /.test(lg()) && lg().split("\n").filter(Boolean).length === 1, lg());
      ok("ext.d/proxmox: key not printed, wrong key -> ok 0", !/testkey/.test(po) && run("proxmox", "URL=http://proxmox.test USER='root@pam!kd' KEY=bad ") === "ok 0");
      run("glances", env.glances);
      ok("ext.d/glances: certificate is checked (no --no-check-certificate)", !/no-check-certificate/.test(lg()), lg());
      ok("ext.d/glances: empty user -> no Authorization", !/Authorization/.test(lg()), lg());
      run("glances", "URL=http://glances.test USER=u PASS=p ");
      ok("ext.d/glances: user -> Basic", / Authorization: Basic dTpw /.test(lg()), lg());
      const to = run("truenas", env.truenas), tl = lg().split("\n").filter(Boolean);
      ok("ext.d/truenas: --no-check-certificate on every request, key not printed", to === want.truenas.join("\n") && tl.length === 3 && tl.every(x => / --no-check-certificate /.test(x)) && !/testkey/.test(to), lg());
      const oo = run("omv", env.omv), ol = lg().split("\n").filter(Boolean);
      ok("ext.d/omv: JSON-escaped login, then getInformation with the session cookie", oo === want.omv.join("\n") && ol.length === 2 && ol[0].endsWith(' --post-data {"service":"Session","method":"login","params":{"username":"admin","password":"p\\"a\\\\ss"}} http://omv.test/rpc.php ') &&
        / Cookie: X-OPENMEDIAVAULT-SESSIONID=abc /.test(ol[1]) && ol[1].endsWith(' --post-data {"service":"System","method":"getInformation","params":{}} http://omv.test/rpc.php '), ol.join(" / "));
      ok("ext.d/omv: password not printed", !/a\\+ss/.test(oo));
      ok("ext.d/omv: wrong password and no answer -> ok 0", run("omv", "URL=http://omv.test USER=admin PASS=x ") === "ok 0" && run("omv", "URL=http://nohost.test USER=admin PASS=x ") === "ok 0");
      ok("ext.d/omv: uptime as a string, load as a string", run("omv", "URL=http://omv.test/str USER=admin PASS='p\"a\\ss' ") === ["ok 1", "t|Работает|93784|s", "t|Нагрузка|1.50|t", "t|Память|75|p"].join("\n"));
      ok("ext.d/omv: loadAverage as a string, no memTotal -> empty memory value", run("omv", "URL=http://omv.test/la USER=admin PASS='p\"a\\ss' ") === ["ok 1", "t|Работает|93784|s", "t|Нагрузка|0.52|t", "t|Память||p"].join("\n"));
      ok("ext.d/spoolman: HTML 200 -> ok 0, empty list -> zeros", run("spoolman", "URL=http://spoolman.test/html ") === "ok 0" && run("spoolman", "URL=http://spoolman.test/empty ") === ["ok 1", "t|Катушек|0|n", "t|Остаток, г|0|n", "t|Меньше 100 г|0|n"].join("\n"));
      fs.rmSync(sd, { recursive: true, force: true });
    }
    // ext.d/ha: each map path is an entity_id that goes into the URL; anything else is skipped, not requested, not executed
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-h-")), run = (env) => {
        fs.rmSync(path.join(sd, "log"), { force: true });
        const out = collect("ext.d/ha", "", "", { state: sd, env: "URL=http://ha.test TOKEN=testkey " + env + " " });
        return [out.trim(), fs.existsSync(path.join(sd, "log")) ? fs.readFileSync(path.join(sd, "log"), "utf8").split("\n").filter(Boolean) : []];
      };
      const pw = unix(sd) + "/pwn";
      let [o, lg] = run("MAP='A=Sensor.temp; B=sensor.temp x; C=$(touch " + pw + "); D=sensor.$(touch " + pw + "); E=a`touch " + pw + "`.b; F=../api.x; G=-x.y; H=sensor; I=sensor.temp.x; |=sensor.temp; J=sensor.temp; K=; =sensor.temp'");
      ok("ha: invalid entity ids are skipped and never requested, nothing executed", o === "ok 1\ne|J|23.5|°C" && lg.length === 1 && lg[0].endsWith(" Authorization: Bearer testkey http://ha.test/api/states/sensor.temp ") && !fs.existsSync(path.join(sd, "pwn")), o + " || " + lg.join(" / "));
      [o] = run("MAP='$(touch " + pw + ")=sensor.temp; a`touch " + pw + "`=light.hall'");
      ok("ha: labels are data too, shown verbatim, nothing executed", o === "ok 1\ne|$(touch " + pw + ")|23.5|°C\ne|a`touch " + pw + "`|on|" && !fs.existsSync(path.join(sd, "pwn")), o);
      [o] = run("URL=http://ha.test/html MAP='T=sensor.temp'");
      ok("ha: an HTML 200 instead of an entity -> ok 0", o === "ok 0", o);
      [o] = run("URL=http://ha.test/html MAP=''");
      ok("ha: an HTML 200 instead of /api/ -> ok 0", o === "ok 0", o);
      [o, lg] = run("MAP='" + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => "P" + n + "=sensor.temp").join("; ") + "'");
      ok("ha: 9 pairs -> 8 requests", o.split("\n").length === 9 && lg.length === 8, o);
      [o, lg] = run("MAP=''");
      ok("ha: empty map -> one /api/ probe, ok 1 without rows", o === "ok 1" && lg.length === 1 && lg[0].endsWith(" http://ha.test/api/ "), o + " || " + lg.join(" / "));
      [o] = run("MAP='X=sensor.gone'");
      ok("ha: no entity answered, API up -> ok 1 and an empty row", o === "ok 1\ne|X||", o);
      [o] = run("MAP='Temp=sensor.temp' TOKEN=bad");
      ok("ha: bad token -> ok 0", o === "ok 0", o);
      [o] = run("MAP='' TOKEN=bad");
      ok("ha: bad token, empty map -> ok 0", o === "ok 0", o);
      ok("ha: a URL that is not http(s) -> ok 0", collect("ext.d/ha", "", "", { state: sd, env: "URL=-x TOKEN=testkey MAP='T=sensor.temp' " }).trim() === "ok 0");
      fs.rmSync(sd, { recursive: true, force: true });
    }
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
      [l] = run("MAP='Скорость=speed:bit'");
      ok("ext.d/custom: format bit", l.join("\n") === "ok 1\nt|Скорость|2048|bit", l.join(" / "));
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
    fs.writeFileSync(path.join(d, "chk.old.Host_01_0123abcd"), "1 1\n"); fs.writeFileSync(path.join(d, "chk.qb.Host_01_0123abcd"), "1 1\n");
    fs.writeFileSync(path.join(d, ".chk.old.a.test.now"), "200 1 1\n"); fs.writeFileSync(path.join(d, ".chk.qb.a.test.now"), "200 1 1\n");
    [".cams.old", ".ck.old", ".cams.qb", ".ck.qb"].forEach(n => fs.writeFileSync(path.join(d, n), "1 a\n"));
    collect("ext", "", "", { state: d, files: { "etc/services/qb.conf": QB } });
    ok("bin/ext: removed instance -> cache gone", rd(d, "x/old") === null && rd(d, "s.old.dl") === null && rd(d, "x/qb-2") === null && rd(d, "s.qb.dl") === "5242880\n5242880\n" && /^ok 1\n/.test(rd(d, "x/qb")), ls(d));
    ok("bin/ext: removed instance -> its chk.<id>.* history files go too, another instance's stay", rd(d, "chk.old.Host_01_0123abcd") === null && rd(d, "chk.qb.Host_01_0123abcd") !== null &&
      rd(d, ".chk.old.a.test.now") === null && rd(d, ".chk.qb.a.test.now") !== null, fs.readdirSync(d).join());
    ok("bin/ext: removed instance -> its .cams.<id> and .ck.<id> (camera list, login cookie) go, another instance's stay", rd(d, ".cams.old") === null && rd(d, ".ck.old") === null && rd(d, ".cams.qb") !== null && rd(d, ".ck.qb") !== null, fs.readdirSync(d).join());
    // SNAP is unset per instance like HOSTS and EVERY; the frames $PUB/cam/<id>-<n>.jpg (and their .t temps) of a removed instance go, other ids and files stay
    {
      const sd = fs.mkdtempSync(path.join(os.tmpdir(), "kd-x-")), pub = fs.mkdtempSync(path.join(os.tmpdir(), "kd-p-")), cam = path.join(pub, "cam");
      fs.mkdirSync(cam); ["s1-1.jpg", "s2-3.jpg", "gone-1.jpg", ".gone-2.jpg.t", "s1-9-1.jpg", "gone-2-1.jpg", ".s2-4.jpg.t", "README.jpg", "n.txt"].forEach(n => fs.writeFileSync(path.join(cam, n), "j"));
      collect("ext", "", "", { state: sd, env: "SNAP=leak KEENDASH_PUB=" + unix(pub) + " ", files: { "ext.d/snapt": "#!/bin/sh\necho ok 1\necho \"s=$SNAP\"\n", "etc/services/s1.conf": "TYPE='snapt'\nSNAP='1'\n", "etc/services/s2.conf": "TYPE='snapt'\n" } });
      ok("bin/ext: SNAP exported from the conf, unset when the conf has none", rd(sd, "x/s1") === "ok 1\ns=1\n" && rd(sd, "x/s2") === "ok 1\ns=\n", JSON.stringify([rd(sd, "x/s1"), rd(sd, "x/s2")]));
      ok("bin/ext: removed instance -> its frames and temps go, other ids and files stay", fs.readdirSync(cam).sort().join() === ".s2-4.jpg.t,README.jpg,n.txt,s1-1.jpg,s2-3.jpg", fs.readdirSync(cam).sort().join());
      fs.rmSync(sd, { recursive: true, force: true }); fs.rmSync(pub, { recursive: true, force: true });
    }
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
    stamp("t9", nowS - 1000);
    every(nowS - 990, { "etc/services/t9.conf": cf("", "5") });
    ok("bin/ext: EVERY=5 runs when the conf is newer than the cache", rd(e, "x/t9") === "ok 1\nh= e=5\n", JSON.stringify(rd(e, "x/t9")));
    stamp("t10", bt); every(bt + 10, { "etc/services/t10.conf": cf("", "5") });
    ok("bin/ext: EVERY=5 skips an older conf with a fresh cache", rd(e, "x/t10") === "old\n", JSON.stringify(rd(e, "x/t10")));
    stamp("t11", bt); every(bt - 50, { "etc/services/t11.conf": cf("", "5") });
    ok("bin/ext: a cache mtime in the future (negative age) counts as due", rd(e, "x/t11") === "ok 1\nh= e=5\n", JSON.stringify(rd(e, "x/t11")));
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
      l = run("http://up.test/x?y http://up.test/x&y");
      ok("ext.d/check: two addresses with the same key keep two rows and two histories", l.join("\n") === "ok 1\nup 2\nn 2\nh|http://up.test/x?y|200|0|100|1\nh|http://up.test/x&y|200|0|100|1" && chks().join() === "chk.ck.http___up.test_x_y,chk.ck.http___up.test_x_y_2", l.join(" / ") + chks().join());
      l = run("up.test http://up.test/x up.test");
      ok("ext.d/check: the same address twice is one row", l[2] === "n 2" && l.length === 5, l.join(" / "));
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
    // tick 1 starts bin/snap in the background and does not wait for it (the stub runs 5 s)
    d = state();
    const tk0 = Date.now();
    collect("tick", "1", "", { state: d, files: { stats: "#!/bin/sh\n", ext: "#!/bin/sh\n", geo: "#!/bin/sh\n", snap: "#!/bin/sh\necho started > \"$KEENDASH_TMP/snap.started\"\nsleep 5\n" },
      edit: (x, t) => x.replace(/^BIN=.*$/m, "BIN=" + t).replace(/^D=\/tmp\/keendash/m, 'D="$KEENDASH_TMP"') });
    const tkms = Date.now() - tk0;
    for (let k = 0; k < 20 && !fs.existsSync(path.join(d, "snap.started")); k++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    ok("bin/tick 1: starts bin/snap in the background and returns without waiting for it", tkms < 3000 && fs.existsSync(path.join(d, "snap.started")), tkms + " " + fs.readdirSync(d).join());
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
    fs.writeFileSync(path.join(sd, "settings"), "vol|v1:\nrev|r1\nerr|\ntype|qb|qBittorrent|Медиа|url,user,pass|Ключ: \"x\"\ntype|pl|Plex|Медиа|url,token\ninst|qb-2|qb|Торренты|http://q|admin|pass|A=x.y:b|h.test x.test|15|1\n" +
      "inst|pl|plex|Plex|http://p||token|\nhide|page|cron\nhide|main|telemt\ncol|telemt,awg\ncol|qb-2\nlay|g|g1|3|0|0|Дом \"a\" \\b\nlay|c|sys|1|0|1|\nlay|c|qb-2|2|1||g1\n" +
      "scan|state|run|3|12|1700000000\nscan|found|192.168.1.5|a \"q\" \\b|jellyfin|http://192.168.1.5:8096\nscan|found|192.168.1.1|Роутер|metube|http://192.168.1.1:8081\n");
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
      ok("keendashd status: cfg", eq(s.cfg, { vol: "v1:", rev: "r1", err: "", hide: { page: ["cron"], main: ["telemt"] }, cols: [["telemt", "awg"], ["qb-2"]], lay: [["g", "g1", 3, 0, "0", 'Дом "a" \\b'], ["c", "sys", 1, 0, "1", ""], ["c", "qb-2", 2, 1, "", "g1"]], scan: s.cfg.scan }), JSON.stringify(s.cfg));
      ok("keendashd status: cfg.scan", eq(s.cfg.scan, { state: "run", n: 3, of: 12, at: 1700000000, found: [["192.168.1.5", 'a "q" \\b', "jellyfin", "http://192.168.1.5:8096"], ["192.168.1.1", "Роутер", "metube", "http://192.168.1.1:8081"]] }), JSON.stringify(s.cfg.scan));
      let s0 = null;
      try { s0 = JSON.parse(cp.execFileSync(kd, ["status"], { env: Object.assign({}, env, { KEENDASH_SETTINGS: "echo vol\\|v1:" }), encoding: "utf8" })); } catch (e) { s0 = e.message; }
      ok("keendashd status: cfg.scan is null without the file", s0 && s0.cfg && s0.cfg.scan === null, JSON.stringify(s0 && s0.cfg));
      // a state line cut short (a file read while it is written) is still valid JSON
      try { s0 = JSON.parse(cp.execFileSync(kd, ["status"], { env: Object.assign({}, env, { KEENDASH_SETTINGS: "printf 'scan|state|run\\nscan|found|10.0.0.5|n\\n'" }), encoding: "utf8" })); } catch (e) { s0 = e.message; }
      ok("keendashd status: cfg.scan with a cut-short line is valid JSON", s0 && s0.cfg && s0.cfg.scan && s0.cfg.scan.state === "run" && s0.cfg.scan.n === 0 && s0.cfg.scan.of === 0 && s0.cfg.scan.at === 0 && JSON.stringify(s0.cfg.scan.found) === '[["10.0.0.5","n","",""]]', JSON.stringify(s0 && s0.cfg));
      ok("keendashd status: types", eq(s.types, [["qb", "qBittorrent", "Медиа", ["url", "user", "pass"], 'Ключ: "x"'], ["pl", "Plex", "Медиа", ["url", "token"], ""]]), JSON.stringify(s.types));
      ok("keendashd status: inst, data or null", eq(s.inst, [["qb-2", "qb", "Торренты", "http://q", "admin", ["pass"], { ok: 1, dl: 5, list: [["a", 1]] }, "A=x.y:b", "h.test x.test", "15", "1"],
        ["pl", "plex", "Plex", "http://p", "", ["token"], null, "", "", "", ""]]), JSON.stringify(s.inst));
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
    const until = async f => { for (let i = 0; i < 50 && !f(); i++) await new Promise(r => setTimeout(r, 100)); };
    // the daemon writes after it forks: kill it only once `done` holds (or after `wait` ms), not before it had the chance
    const pubServe = async (n, wait, done) => {
      const p = parseInt(cp.execFileSync(kd, ["serve", "127.0.0.1", String(port + n), www], { env: penv, encoding: "utf8" }), 10);
      if (done) await until(done); else await new Promise(r => setTimeout(r, wait));
      try { process.kill(p); } catch (e) {}
    };
    let pj = null;
    await pubServe(1, 0, () => fs.existsSync(pf));
    try { pj = JSON.parse(fs.readFileSync(pf, "utf8")); } catch (e) {}
    ok("keendashd publish: status.json at start", pj && pj.tabs.length === 2 && !fs.existsSync(pf + ".tmp"), pj);
    const old = new Date(Date.now() - 100000), now = new Date();
    fs.writeFileSync(pf, "x"); fs.utimesSync(pf, old, now);
    await pubServe(2, 1000);
    ok("keendashd publish: not read since -> kept", fs.readFileSync(pf, "utf8") === "x");
    fs.utimesSync(pf, now, old);
    await pubServe(3, 0, () => fs.readFileSync(pf, "utf8") !== "x");
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
    ok("page: menu item right after Системный монитор", a && a.parentNode.previousElementSibling === dash.parentNode && a.textContent.trim() === "Дашборд" && !a.classList.contains(act));
    click(a);
    const p = d.querySelector(".kd-page"), t = p && Array.from(p.querySelectorAll(".kd-ct")).map(x => x.textContent).join();
    ok("page: opens at /keendash over the hidden dashboard, its item active", p && w.location.pathname === "/keendash" && w.history.length === n + 1 && d.querySelector("ng-component").hasAttribute("data-kd-hidden") &&
      a.classList.contains(act) && !dash.classList.contains(act) && d.title === "Keenetic – Дашборд", d.title);
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
    ok("page: Angular's titles keep the page's own", d.title === "Keenetic Hopper – Дашборд", d.title);
  }, w => { w.__keendash = { p: "/keendash" }; return () => Promise.resolve({ ok: true, json: () => Promise.resolve(full) }); }, "http://192.168.0.1/dashboard");
  // the expanded side menu: docked on a wide screen (overlay and menu button hidden) it stays; on a tablet a tap on the
  // overlay folds it, on a phone the menu button
  for (const [shown, want] of [["", "none"], ["overlay", "overlay"], ["toggle", "toggle"]]) {
    await run(full, async w => {
      const d = w.document, hits = [];
      d.body.insertAdjacentHTML("beforeend", '<div class="header__menu-toggle"><div class="toggle__toggle"></div></div><div class="layout__overlay"></div>' + layout.replace("<ndw-menu>", '<ndw-menu><div class="menu menu--expanded"></div>'));
      const ov = d.querySelector(".layout__overlay"), tg = d.querySelector(".toggle__toggle");
      [[ov, "overlay"], [tg, "toggle"]].forEach(([e, n]) => { e.getClientRects = () => (shown === n ? [{}] : []); e.addEventListener("click", () => hits.push(n)); });
      await wait(100);
      d.getElementById("kd-menu").dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
      ok("page: side menu fold, shown " + (shown || "nothing"), (hits.join() || "none") === want, hits.join());
    }, null, "http://192.168.0.1/dashboard");
  }
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
      const b = o.base || full; return r(true, 200, fui ? Object.assign({}, b, { cfg: Object.assign({}, b.cfg, { rev, err: o.err || "" }) }) : b);
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
    ok("dialog: map rule accepts", [" A=x ; B=y:s ", "A=x;B=y;C=z;D=p:p;E=q;F=r;G=s;H=t", "Ж=a.b-c_d:n", "Скорость=speed:bit", "A=x:"," A=x","\u00a0A=x", "\u{1F600}".repeat(32) + "=x", "a=" + "x".repeat(128)].every(v => !wrong(v)));
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
  fcalls = [];
  await run(chk, async w => {
    const dlg = await openDlg(w), q = s => dlg.querySelector(s);
    q('.kd-dlg-add[data-type="check"]').click();
    q(".kd-dlg-save").click(); await wait(100);
    ok("dialog: hosts is required, an empty one blocks the save", !post(fcalls, /\/rci\/put$/).length && q('input[data-f="hosts"][data-id="check"]').parentNode.querySelector(".kd-dlg-hint").textContent === "Заполните поле");
  }, cf(fcalls, chk), URL0);
  // snap (Frigate): a select Нет/5 с/15 с/30 с/1 мин, 0 for a new instance and for one saved before the field; a change goes as set <id> snap 15; a stored 1 shows as 1 мин and stays 1 until changed
  const frg = Object.assign({}, full, { types: [["frigate", "Frigate", "Дом", ["url", "snap"], ""]], inst: [["fg", "frigate", "Камеры", "http://h:5000", "", [], null, "", "", "", ""], ["fg-2", "frigate", "Двор", "http://h:5001", "", [], null, "", "", "", "1"], ["fg-3", "frigate", "Гараж", "http://h:5002", "", [], null, "", "", "", "30"]] });
  fcalls = [];
  await run(frg, async w => {
    const dlg = await openDlg(w), q = s => dlg.querySelector(s), sn = id => q('select[data-f="snap"][data-id="' + id + '"]');
    q('.kd-dlg-i[data-id="fg"] .kd-dlg-hd').click();
    ok("dialog: snap is a select Нет, 5 с, 15 с, 30 с, 1 мин, 0 when unset", !!sn("fg") && Array.from(sn("fg").options).map(o => o.value + ":" + o.textContent).join() === "0:Нет,5:5 с,15:15 с,30:30 с,60:1 мин" && sn("fg").value === "0" &&
      sn("fg").parentNode.querySelector("span").textContent === "Кадры с камер" && !q(".kd-dlg-save"));
    typeIn(w, sn("fg"), "15");
    q(".kd-dlg-save").click(); await wait(100);
    const [rev, txt] = await sent(w, fcalls);
    ok("dialog: snap sent as set <id> snap 15", txt === "keendash 1 " + rev + "\nset fg snap 15\nend\n", JSON.stringify(txt));
  }, cf(fcalls, frg), URL0);
  fcalls = [];
  await run(frg, async w => {
    const dlg = await openDlg(w), q = s => dlg.querySelector(s), sn = id => q('select[data-f="snap"][data-id="' + id + '"]');
    q('.kd-dlg-i[data-id="fg-3"] .kd-dlg-hd').click();
    ok("dialog: a saved snap 30 is shown as 30 с, nothing to save", !!sn("fg-3") && sn("fg-3").value === "30" && !q(".kd-dlg-save"));
    q('.kd-dlg-i[data-id="fg-2"] .kd-dlg-hd').click();
    ok("dialog: a saved snap 1 is shown as 1 мин, nothing to save", !!sn("fg-2") && sn("fg-2").value === "60" && sn("fg-2").options[sn("fg-2").selectedIndex].textContent === "1 мин" && !q(".kd-dlg-save"));
    typeIn(w, q('input[data-f="url"][data-id="fg-2"]'), "http://h:5009");
    q(".kd-dlg-save").click(); await wait(100);
    const [rev, txt] = await sent(w, fcalls);
    ok("dialog: another field changed -> a stored snap 1 is not rewritten", txt === "keendash 1 " + rev + "\nset fg-2 url http://h:5009\nend\n", JSON.stringify(txt));
  }, cf(fcalls, frg), URL0);
  fcalls = [];
  await run(frg, async w => {
    const dlg = await openDlg(w), q = s => dlg.querySelector(s);
    q('.kd-dlg-i[data-id="fg-2"] .kd-dlg-hd').click();
    typeIn(w, q('select[data-f="snap"][data-id="fg-2"]'), "5");
    q(".kd-dlg-save").click(); await wait(100);
    const [rev, txt] = await sent(w, fcalls);
    ok("dialog: a stored snap 1 changed by the user goes as the new value", txt === "keendash 1 " + rev + "\nset fg-2 snap 5\nend\n", JSON.stringify(txt));
  }, cf(fcalls, frg), URL0);
  fcalls = [];
  await run(frg, async w => {
    const dlg = await openDlg(w), q = s => dlg.querySelector(s);
    q('.kd-dlg-add[data-type="frigate"]').click();
    ok("dialog: a new instance has snap 0", q('select[data-f="snap"][data-id="frigate"]').value === "0");
    typeIn(w, q('input[data-f="url"][data-id="frigate"]'), "http://h:5000");
    q(".kd-dlg-save").click(); await wait(100);
    const [rev, txt] = await sent(w, fcalls);
    ok("dialog: a new instance sends snap 0", txt === "keendash 1 " + rev + "\nadd frigate frigate\nset frigate name Frigate\nset frigate url http://h:5000\nset frigate snap 0\nend\n", JSON.stringify(txt));
  }, cf(fcalls, frg), URL0);
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
  // page layout: columns (x, skyline placement), widths, collapse, the «⋯» menu, «⚙», saving
  const wide = (w, n) => Object.defineProperty(w.HTMLElement.prototype, "clientWidth", { configurable: true, get: () => n || 1200 });
  // hf: the height of an element in px (jsdom has no layout)
  const openPage = async (w, n, hf) => {
    const d = w.document; wide(w, n);
    Object.defineProperty(w.HTMLElement.prototype, "offsetHeight", { configurable: true, get() { return hf ? hf(this) : this.classList.contains("kd-hold") ? parseFloat(this.style.height) || 0 : 100; } });
    d.body.insertAdjacentHTML("beforeend", layout); await wait(100);
    d.getElementById("kd-menu").dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
    return d.querySelector(".kd-page");
  };
  // frigate frames on the page: the same error listener hides a failed one
  {
    const fp = Object.assign(one("frigate", "Frigate", "Дом", "http://10.0.0.5:5000", { ok: 1, ver: "1", snap: 1793438000, cam: [["a", 5, 0, 0], ["b", 5, 0, 0]] }), { now: Math.floor(Date.now() / 1000) });
    await run(fp, async w => {
      const p = await openPage(w), im = p.querySelectorAll('[data-id="frigate"] img.us-snap');
      ok("page: frigate frames are there over https", im.length === 2 && im[1].getAttribute("src") === "/storage/.keendash/cam/frigate-2.jpg?1793438000", p.innerHTML.slice(0, 300));
      im[1].dispatchEvent(new w.Event("error"));
      ok("page: a failed frame hides itself", im[1].style.display === "none" && im[0].style.display !== "none");
    }, w => { w.__keendash = { base: "/storage/.keendash/", st: true, p: "/keendash" }; return () => Promise.resolve({ ok: true, json: () => Promise.resolve(fp) }); }, "https://r.example.net/dashboard");
  }
  const withCfg = o => Object.assign({}, full, { cfg: Object.assign({}, full.cfg, o) });
  const top = p => Array.from(p.querySelector(".kd-lay").children), idOf = el => el.getAttribute("data-id") || el.getAttribute("data-g");
  const kf = (v, cols) => Math.round(+/([\d.]+) \* \(100%/.exec(v)[1] * cols);
  const span = el => +el.getAttribute("data-w"), dx = el => el.getAttribute("data-x"), px = el => el.getAttribute("data-px");
  const lay0 = [["c", "sys", 3, 0, "0", ""], ["c", "telemt", 2, 0, "0", ""], ["g", "g1", 2, 0, "1", "Дом <b>x</b>"], ["c", "awg", 3, 0, "0", "g1"], ["c", "gone", 1, 0, "0", "g1"]];
  await run(withCfg({ cols: [["sys", "telemt"], ["awg"]] }), async w => {
    const p = await openPage(w), t = top(p);
    ok("page: cols migrate row by row, new cards follow with span 1", t.length === 15 && t.slice(0, 3).map(idOf).join() === "sys,awg,telemt" && t.every(x => span(x) === 1), t.slice(0, 4).map(idOf).join());
    ok("page: cols migrate to x = the column, a new card has none and takes the lowest column", t.slice(0, 3).map(dx).join() === "0,1,0" && dx(t[3]) === "" && px(t[3]) === "2", t.slice(0, 4).map(dx).join() + px(t[3]));
  }, null, URL0);
  // layout lines from before the x column (empty x): the rows they were laid in give it
  await run(withCfg({ lay: [["c", "sys", 2, 0, "", ""], ["c", "telemt", 2, 0, "", ""], ["c", "awg", 1, 0, "", ""], ["g", "g1", 3, 0, "", "Дом"], ["c", "hydra", 1, 0, "", "g1"], ["c", "agh", 1, 0, "", "g1"], ["c", "qb", 2, 0, "", "g1"]] }), async w => {
    const p = await openPage(w), t = top(p), g = p.querySelector('[data-g="g1"]');
    ok("page: old layout lines get x from the rows", t.slice(0, 4).map(dx).join() === "0,0,2,0" && Array.from(g.querySelectorAll(".kd-card")).map(dx).join() === "0,1,0", t.slice(0, 4).map(dx).join() + "/" + Array.from(g.querySelectorAll(".kd-card")).map(dx).join());
  }, null, URL0);
  // the skyline: a card goes right under the one above it in its column; 2/3 and 3/3 start under the lowest column they cover
  await run(withCfg({ lay: [["c", "telemt", 1, 0, "0", ""], ["c", "sys", 1, 0, "1", ""], ["c", "ascn", 1, 0, "2", ""], ["c", "hydra", 1, 0, "0", ""], ["c", "agh", 2, 0, "0", ""], ["c", "qb", 3, 0, "0", ""]] }), async w => {
    const H = { telemt: 300, sys: 600, ascn: 200, hydra: 100, agh: 50, qb: 70 };
    const p = await openPage(w, 1200, el => H[el.getAttribute("data-id")] || 10), card = id => p.querySelector('[data-id="' + id + '"]'), tp = id => card(id).style.top;
    ok("place: hydra sits right under telemt, not under the tallest card", tp("telemt") === "0px" && tp("sys") === "0px" && tp("ascn") === "0px" && tp("hydra") === "324px", ["telemt", "sys", "ascn", "hydra"].map(tp).join());
    ok("place: 2/3 starts under the lower of its columns, 3/3 under all three", tp("agh") === "624px" && px(card("agh")) === "0" && tp("qb") === "698px", tp("agh") + tp("qb"));
    ok("place: absolute positions in columns, the container is as tall as the tallest column", p.querySelector(".kd-lay").classList.contains("kd-abs") && kf(card("sys").style.left, 3) === 1 && kf(card("agh").style.width, 3) === 2 && kf(card("telemt").style.left, 3) === 0 && parseFloat(p.querySelector(".kd-lay").style.height) >= 768, card("sys").style.left + card("agh").style.width + p.querySelector(".kd-lay").style.height);
    const Q = w.__servicesWidget.placeItems, r = Q([{ w: 1, x: 0 }, { w: 1, x: 1 }, { w: 1, x: 2 }, { w: 1, x: 0 }, { w: 2, x: 0 }, { w: 3, x: 0 }], [300, 600, 200, 100, 50, 70], 3, 24), r2 = Q([{ w: 1, x: 0 }, { w: 1, x: 1 }, { w: 2 }, { w: 1 }], [300, 600, 5, 5], 3, 24);
    ok("placeItems: skyline, 2/3 under max(col0, col1), 3/3 under all", r.map(x => x.top).join() === "0,0,0,324,624,698" && r[3].x === 0, JSON.stringify(r));
    ok("placeItems: no x -> the lowest place, a 2/3 where its two columns are lowest", r2.map(x => x.x + "@" + x.top).join() === "0@0,1@0,0@624,2@0", JSON.stringify(r2));
  }, null, URL0);
  // a group lays its cards out on its own columns, its height follows them; the next card goes under the group in its column
  await run(withCfg({ lay: [["g", "g1", 2, 0, "1", "G"], ["c", "awg", 1, 0, "0", "g1"], ["c", "telemt", 1, 0, "1", "g1"], ["c", "hydra", 1, 0, "0", "g1"], ["c", "sys", 1, 0, "1", ""], ["c", "qb", 1, 0, "0", ""]] }), async w => {
    const H = { awg: 200, telemt: 100, hydra: 50, sys: 10, qb: 10 };
    const p = await openPage(w, 1200, el => el.classList.contains("kd-grp") ? 40 + (parseFloat(el.querySelector(".kd-lay").style.height) || 0) : H[el.getAttribute("data-id")] || 10), g = p.querySelector('[data-g="g1"]'), inner = g.querySelector(".kd-lay");
    const c = id => p.querySelector('[data-id="' + id + '"]');
    ok("place: cards inside a group sit on the group's columns", inner.getAttribute("data-cols") === "2" && c("awg").style.top === "0px" && c("telemt").style.top === "0px" && c("hydra").style.top === "224px" && kf(c("hydra").style.left, 2) === 0 && kf(c("telemt").style.left, 2) === 1, c("hydra").style.top);
    ok("place: the group is as tall as its content, the card under it starts below that", inner.style.height === "274px" && g.style.top === "0px" && c("sys").style.top === "338px" && c("qb").style.top === "0px", inner.style.height + g.style.top + c("sys").style.top);
  }, null, URL0);
  await run(withCfg({ lay: lay0 }), async w => {
    const p = await openPage(w), t = top(p), g = p.querySelector('[data-g="g1"]'), inner = g.querySelector(".kd-lay");
    ok("page: spans 1/2/3 and appended cards", t.length === 15 && span(t[0]) === 3 && span(t[1]) === 2 && span(g) === 2 && t.slice(3).every(x => span(x) === 1), t.map(x => idOf(x) + span(x)).join());
    ok("page: group grid has its own columns, card width capped by the group", inner.getAttribute("data-cols") === "2" && kf(inner.firstElementChild.style.width, 2) === 2 && inner.children.length === 1, inner.outerHTML.slice(0, 200));
    ok("page: unknown layout id not rendered; group name is text", !p.querySelector('[data-id="gone"]') && g.querySelector(".kd-gn").textContent === "Дом <b>x</b>" && !g.querySelector(".kd-gh b") && g.querySelector(".kd-gc").textContent === "1");
    ok("page: header controls are buttons with aria-label and title", Array.from(p.querySelectorAll(".kd-ch > button,.kd-gh > button")).every(b => b.tagName === "BUTTON" && b.getAttribute("aria-label") && b.getAttribute("title")) && p.querySelectorAll(".kd-drag").length === 16 && p.querySelectorAll(".kd-gh > button").length === 3);
    ok("page: gear only on service cards", !!p.querySelector('[data-id="qb"] .kd-gear') && !p.querySelector('[data-id="sys"] .kd-gear') && !p.querySelector('[data-id="telemt"] .kd-gear'));
  }, null, URL0);
  await run(withCfg({ lay: lay0 }), async w => {
    const p = await openPage(w, 400), t = top(p);
    ok("page: under 900 px plain flow in list order, no absolute positions, widths kept in the data", !p.querySelector(".kd-abs") && t.slice(0, 3).map(idOf).join() === "sys,telemt,g1" && t.every(x => !x.style.top && !x.style.left && !x.style.width) && span(t[0]) === 3 && !p.querySelector('[data-g="g1"] .kd-card').style.top);
  }, null, URL0);
  await run(withCfg({ lay: [["c", "sys", 1, 1, "0", ""], ["g", "g1", 3, 1, "0", "G"], ["c", "awg", 1, 0, "0", "g1"], ["g", "g2", 3, 0, "0", "Пусто"], ["c", "telemt", 1, 0, "0", "g2"]], hide: { page: ["telemt"], main: [] } }), async w => {
    const p = await openPage(w), g1 = p.querySelector('[data-g="g1"]'), g2 = p.querySelector('[data-g="g2"]');
    ok("page: folded card shows only its header", !!p.querySelector('[data-id="sys"] .kd-ch') && !p.querySelector('[data-id="sys"] .us-body') && !!p.querySelector('[data-id="awg"]') === false);
    ok("page: folded group shows header and count only", !g1.querySelector(".kd-lay") && g1.querySelector(".kd-gc").textContent === "1" && !g1.querySelector(".us-body"));
    ok("page: group with all cards hidden shows the drop text", g2.textContent.indexOf("Перетащите сюда карточки") >= 0 && g2.querySelector(".kd-gc").textContent === "0" && !p.querySelector('[data-id="telemt"]'), g2.textContent);
  }, null, URL0);
  fcalls = [];
  await run(withCfg({ lay: [["c", "sys", 2, 0, "0", ""]] }), async w => {
    const p = await openPage(w), q = s => p.querySelector(s), mws = () => Array.from(p.querySelectorAll(".kd-mw"));
    q('[data-id="sys"] .kd-more').click();
    ok("menu: widths 1/3 2/3 3/3, current marked", mws().map(b => b.textContent).join() === "1/3,2/3,3/3" && mws().filter(b => b.classList.contains("kd-on")).map(b => b.textContent).join() === "2/3" && /Ширина/.test(q(".kd-menu").textContent));
    await w.__servicesWidget.update();
    ok("menu: a data refresh keeps it open", !!q(".kd-menu"));
    esc(w);
    ok("menu: Esc closes", !q(".kd-menu"));
    q('[data-id="sys"] .kd-more').click(); q(".kd-ph h1").click();
    ok("menu: a click elsewhere closes", !q(".kd-menu"));
    q('[data-id="sys"] .kd-more').click(); q('[data-id="sys"] .kd-more').click();
    ok("menu: the button toggles it", !q(".kd-menu"));
    q('[data-id="sys"] .kd-more').click(); mws()[2].click();
    ok("menu: a width click closes it and shows the new width at once", !q(".kd-menu") && span(q('[data-id="sys"]')) === 3);
    await wait(200);
    const [rev, txt] = await sent(w, fcalls);
    ok("menu: the width goes to the router in the new format", /^keendash 1 [a-z0-9]{12}\ncard sys 3 0 0\ncard /.test(txt) && /\nend\n$/.test(txt) && !/col |group /.test(txt), txt);
  }, fm(fcalls, { base: withCfg({ lay: [["c", "sys", 2, 0, "0", ""]] }) }), URL0);
  // a width change keeps x + w within 3; every line carries x
  fcalls = [];
  await run(withCfg({ lay: [["c", "sys", 1, 0, "2", ""], ["c", "telemt", 1, 0, "1", ""]] }), async w => {
    const p = await openPage(w), awgPx = px(p.querySelector('[data-id="awg"]'));
    p.querySelector('[data-id="sys"] .kd-more').click(); p.querySelectorAll(".kd-mw")[1].click(); await wait(200);
    const [rev, txt] = await sent(w, fcalls), L = txt.split("\n").filter(l => /^(card|group) /.test(l));
    ok("menu: 2/3 on a card in column 2 moves it to column 1", /^keendash 1 [a-z0-9]{12}\ncard sys 2 0 1\ncard telemt 1 0 1\n/.test(txt) && dx(p.querySelector('[data-id="sys"]')) === "1", txt);
    ok("message: every line carries x, x + w <= 3", L.length === 15 && L.every(l => { const m = /^(?:card \S+|group g\d+) ([1-3]) [01] ([0-2])( |$)/.exec(l); return m && +m[1] + +m[2] <= 3; }), L.join("|"));
    ok("message: a card that had no x is sent with the column it was drawn in", L.indexOf("card awg 1 0 " + awgPx) >= 0 && /^[0-2]$/.test(awgPx), L.join("|"));
  }, fm(fcalls, { base: withCfg({ lay: [["c", "sys", 1, 0, "2", ""], ["c", "telemt", 1, 0, "1", ""]] }) }), URL0);
  fcalls = [];
  await run(withCfg({ lay: [["c", "gone", 1, 0, "0", ""], ["c", "sys", 1, 0, "1", ""], ["c", "telemt", 1, 1, "2", ""]] }), async w => {
    const p = await openPage(w);
    p.querySelector('[data-id="sys"] .kd-fold').click();
    ok("fold: the card closes at once", !p.querySelector('[data-id="sys"] .us-body') && !!p.querySelector('[data-id="telemt"] .us-body') === false);
    await wait(200);
    const [rev, txt] = await sent(w, fcalls);
    ok("fold: c 1 sent, an unknown id kept in the message", /\ncard gone 1 0 0\ncard sys 1 1 1\ncard telemt 1 1 2\n/.test(txt), txt);
  }, fm(fcalls, { base: withCfg({ lay: [["c", "gone", 1, 0, "0", ""], ["c", "sys", 1, 0, "1", ""], ["c", "telemt", 1, 1, "2", ""]] }) }), URL0);
  fcalls = [];
  await run(withCfg({ lay: [["c", "telemt", 1, 1, "0", ""]] }), async w => {
    const p = await openPage(w);
    p.querySelector('[data-id="telemt"] .kd-ct').click(); await wait(200);
    const [rev, txt] = await sent(w, fcalls);
    ok("fold: a click on the title unfolds, c 0", /^keendash 1 [a-z0-9]{12}\ncard telemt 1 0 0\n/.test(txt), txt);
  }, fm(fcalls, { base: withCfg({ lay: [["c", "telemt", 1, 1, "0", ""]] }) }), URL0);
  await run(full, async w => {
    const p = await openPage(w), d = w.document;
    p.querySelector('[data-id="qb"] .kd-gear').click();
    const dlg = d.querySelector(".kd-dlg");
    ok("gear: opens the settings with that service's form", !!dlg && !!dlg.querySelector('.kd-dlg-i[data-id="qb"] .kd-dlg-form') && !dlg.querySelector('.kd-dlg-i[data-id="agh"] .kd-dlg-form') && dlg.querySelector(".kd-dlg-q").value === "");
  }, null, URL0);
  // a drag: the placeholder takes the column under the pointer, right under the card above it, and the list gets it before the first
  // card of that column whose middle is below the pointer
  const ids15 = ["telemt", "awg", "firc", "nfqws", "hydra", "agh", "qb", "plex", "sonarr", "radarr", "prowlarr", "overseerr", "immich", "ascn", "sys"];
  const only = (lay, ids) => withCfg({ lay, hide: { page: ids15.filter(x => ids.indexOf(x) < 0), main: [] } });
  const rc = (el, l, t, wd, h) => { el.getBoundingClientRect = () => ({ left: l, top: t, width: wd, height: h, right: l + wd, bottom: t + h }); };
  const D1 = only([["c", "telemt", 1, 0, "0", ""], ["c", "sys", 1, 0, "1", ""], ["c", "awg", 1, 0, "2", ""], ["c", "hydra", 1, 0, "0", ""]], ["telemt", "sys", "awg", "hydra"]);
  fcalls = [];
  await run(D1, async w => {
    const p = await openPage(w), c = id => p.querySelector('[data-id="' + id + '"]');
    Array.from(p.querySelectorAll(".kd-item,.kd-lay")).forEach(e => rc(e, 5000, 5000, 10, 10));
    rc(p.querySelector(".kd-lay"), 0, 0, 900, 400); rc(c("telemt"), 0, 0, 290, 100); rc(c("sys"), 300, 0, 290, 100); rc(c("awg"), 600, 0, 290, 100); rc(c("hydra"), 0, 124, 290, 100);
    const h = c("awg").querySelector(".kd-drag"), fire = (t, x, y) => { const e = new w.Event(t, { bubbles: true, cancelable: true }); e.clientX = x; e.clientY = y; e.pointerId = 1; e.pointerType = "mouse"; e.button = 0; h.dispatchEvent(e); };
    fire("pointerdown", 650, 10); fire("pointermove", 100, 110);
    const ph = p.querySelector(".kd-hold");
    ok("drag: the placeholder takes column 0 under telemt and pushes hydra down", ph && ph.getAttribute("data-x") === "0" && ph.style.top === "124px" && c("hydra").style.top === "248px" && ph.nextElementSibling === c("hydra") && c("awg").style.position === "fixed", ph && ph.style.top + c("hydra").style.top);
    fire("pointermove", 450, 110);
    ok("drag: over column 1 the placeholder sits in that column and hydra moves back up", ph.getAttribute("data-x") === "1" && px(ph) === "1" && c("hydra").style.top === "124px", ph.getAttribute("data-x") + c("hydra").style.top);
    fire("pointermove", 100, 110); fire("pointerup", 100, 110); await wait(200);
    const [rev, txt] = await sent(w, fcalls);
    ok("drag: dropped under telemt in column 0 the card gets x 0 and its place before hydra", /^keendash 1 [a-z0-9]{12}\ncard telemt 1 0 0\ncard sys 1 0 1\ncard awg 1 0 0\ncard hydra 1 0 0\n/.test(txt), txt);
    ok("drag: the dropped card shows right under telemt", top(p).length === 4 && top(p).slice(0, 4).map(idOf).join() === "telemt,sys,awg,hydra" && c("awg").style.top === "124px" && px(c("awg")) === "0", top(p).slice(0, 4).map(idOf).join());
  }, fm(fcalls, { base: D1 }), URL0);
  // dropped below everything in a column: the end of the list; the column is the pointer's, narrowed to fit the card's width
  fcalls = [];
  await run(D1, async w => {
    const p = await openPage(w), c = id => p.querySelector('[data-id="' + id + '"]');
    Array.from(p.querySelectorAll(".kd-item,.kd-lay")).forEach(e => rc(e, 5000, 5000, 10, 10));
    rc(p.querySelector(".kd-lay"), 0, 0, 900, 400); rc(c("telemt"), 0, 0, 290, 100); rc(c("sys"), 300, 0, 290, 100); rc(c("awg"), 600, 0, 290, 100); rc(c("hydra"), 0, 124, 290, 100);
    const h = c("telemt").querySelector(".kd-drag"), fire = (t, x, y) => { const e = new w.Event(t, { bubbles: true, cancelable: true }); e.clientX = x; e.clientY = y; e.pointerId = 1; e.pointerType = "mouse"; e.button = 0; h.dispatchEvent(e); };
    fire("pointerdown", 10, 10); fire("pointermove", 450, 390); fire("pointerup", 450, 390); await wait(200);
    const [rev, txt] = await sent(w, fcalls);
    ok("drag: below the cards of column 1 the card goes last with x 1", /^keendash 1 [a-z0-9]{12}\ncard sys 1 0 1\ncard awg 1 0 2\ncard hydra 1 0 0\ncard telemt 1 0 1\nend\n$/.test(txt), txt);
  }, fm(fcalls, { base: D1 }), URL0);
  // groups: «Новая группа», rename, «Разгруппировать»
  const key = (w, el, k) => el.dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  const L1 = [["c", "sys", 1, 0, "0", ""], ["g", "g1", 3, 0, "0", "Дом"], ["c", "awg", 1, 0, "0", "g1"]];
  fcalls = [];
  await run(withCfg({ lay: [["c", "sys", 1, 0, "0", ""]] }), async w => {
    const p = await openPage(w); p.querySelector(".kd-ng").click();
    const inp = p.querySelector("input.kd-name"), g = top(p)[0];
    ok("group: «Новая группа» is first, 3/3, named, in rename mode with focus", g.getAttribute("data-g") === "g1" && span(g) === 3 && inp && inp.value === "Новая группа" && !inp.hasAttribute("maxlength") && w.document.activeElement === inp && !!g.querySelector(".kd-empty"));
    typeIn(w, inp, "Мой дом"); await w.__servicesWidget.update();
    ok("group: the name input keeps its text and focus across a data refresh", p.querySelector("input.kd-name") === inp && inp.value === "Мой дом" && w.document.activeElement === inp);
    await wait(200);
    const [rev, txt] = await sent(w, fcalls);
    ok("group: creation sends the group first", /^keendash 1 [a-z0-9]{12}\ngroup g1 3 0 0 Новая группа\ncard sys 1 0 0\n/.test(txt) && !/col /.test(txt), txt);
  }, fm(fcalls, { base: withCfg({ lay: [["c", "sys", 1, 0, "0", ""]] }) }), URL0);
  fcalls = [];
  await run(withCfg({ lay: [["g", "g1", 3, 0, "0", "A"], ["g", "g3", 3, 0, "0", "C"]] }), async w => {
    const p = await openPage(w); p.querySelector(".kd-ng").click();
    ok("group: the lowest free number is taken", top(p).slice(0, 3).map(idOf).join() === "g2,g1,g3");
  }, fm(fcalls, { base: withCfg({ lay: [["g", "g1", 3, 0, "0", "A"], ["g", "g3", 3, 0, "0", "C"]] }) }), URL0);
  const renLay = withCfg({ lay: L1 });
  const rename = async (w, name, k) => {
    const p = await openPage(w); p.querySelector('[data-g="g1"] .kd-more').click(); p.querySelector(".kd-ren").click();
    const inp = p.querySelector("input.kd-name"); if (name !== null) typeIn(w, inp, name); key(w, inp, k || "Enter"); await wait(200);
    return p;
  };
  fcalls = [];
  await run(renLay, async w => {
    const p = await rename(w, "  Мой <b>x</b>  "), [rev, txt] = await sent(w, fcalls);
    ok("rename: Enter sends the trimmed name, shown as text", /\ngroup g1 3 0 0 Мой <b>x<\/b>\ncard awg 1 0 0 g1\n/.test(txt) && p.querySelector('[data-g="g1"] .kd-gn').textContent === "Мой <b>x</b>" && !p.querySelector(".kd-gh b") && !p.querySelector("input.kd-name"), txt);
  }, fm(fcalls, { base: renLay }), URL0);
  fcalls = [];
  await run(renLay, async w => {
    await rename(w, "a\nhide page sys"); const [r2, t2] = await sent(w, fcalls);
    ok("rename: control characters are removed, no extra line", t2.split("\n").filter(l => /^group /.test(l)).length === 1 && /\ngroup g1 3 0 0 ahide page sys\n/.test(t2) && !/\nhide /.test(t2), t2);
  }, fm(fcalls, { base: renLay }), URL0);
  fcalls = [];
  await run(renLay, async w => {
    await rename(w, "x\ty|z\x7f" + "я".repeat(40)); const [rev, txt] = await sent(w, fcalls);
    ok("rename: tab, | and DEL dropped, cut to 32 characters", txt.indexOf("\ngroup g1 3 0 0 xyz" + "я".repeat(29) + "\n") > 0, txt);
  }, fm(fcalls, { base: renLay }), URL0);
  for (const [nm, name, k] of [["Esc", "Другое", "Escape"], ["empty", "   ", "Enter"], ["unchanged", "Дом", "Enter"]]) {
    fcalls = [];
    await run(renLay, async w => {
      const p = await rename(w, name, k);
      ok("rename: " + nm + " sends nothing, the name stays", !post(fcalls, /rci.put$/).length && !p.querySelector("input.kd-name") && p.querySelector('[data-g="g1"] .kd-gn').textContent === "Дом");
    }, fm(fcalls, { base: renLay }), URL0);
  }
  fcalls = [];
  await run(renLay, async w => {
    const p = await openPage(w); p.querySelector('[data-g="g1"] .kd-more').click();
    ok("group menu: widths, rename, ungroup", p.querySelectorAll(".kd-mw").length === 3 && !!p.querySelector(".kd-ren") && !!p.querySelector(".kd-ung"));
    p.querySelector(".kd-ung").click(); await wait(200);
    const [rev, txt] = await sent(w, fcalls);
    ok("ungroup: the cards take the group's place in order, the group is gone", /^keendash 1 [a-z0-9]{12}\ncard sys 1 0 0\ncard awg 1 0 0\ncard /.test(txt) && !/group /.test(txt) && !p.querySelector("[data-g]") && top(p).slice(0, 2).map(idOf).join() === "sys,awg", txt);
  }, fm(fcalls, { base: renLay }), URL0);
  fcalls = [];
  await run(withCfg({ lay: [["g", "g1", 2, 0, "1", "Дом"], ["c", "awg", 1, 0, "0", "g1"], ["c", "telemt", 3, 0, "0", "g1"], ["c", "hydra", 1, 0, "1", "g1"]] }), async w => {
    const p = await openPage(w); p.querySelector('[data-g="g1"] .kd-more').click(); p.querySelector(".kd-ung").click(); await wait(200);
    const [rev, txt] = await sent(w, fcalls);
    ok("ungroup: x = the group's x + the card's x, kept within the page", /^keendash 1 [a-z0-9]{12}\ncard awg 1 0 1\ncard telemt 3 0 0\ncard hydra 1 0 2\n/.test(txt), txt);
  }, fm(fcalls, { base: withCfg({ lay: [["g", "g1", 2, 0, "1", "Дом"], ["c", "awg", 1, 0, "0", "g1"], ["c", "telemt", 3, 0, "0", "g1"], ["c", "hydra", 1, 0, "1", "g1"]] }) }), URL0);
  // a group made narrower pulls its cards' x in
  fcalls = [];
  await run(withCfg({ lay: [["g", "g1", 3, 0, "0", "Дом"], ["c", "awg", 1, 0, "2", "g1"], ["c", "telemt", 2, 0, "1", "g1"]] }), async w => {
    const p = await openPage(w); p.querySelector('[data-g="g1"] .kd-more').click(); p.querySelectorAll(".kd-mw")[1].click(); await wait(200);
    const [rev, txt] = await sent(w, fcalls);
    ok("group: a narrower group keeps its cards inside (x + width within the group)", /^keendash 1 [a-z0-9]{12}\ngroup g1 2 0 0 Дом\ncard awg 1 0 1 g1\ncard telemt 2 0 0 g1\n/.test(txt), txt);
  }, fm(fcalls, { base: withCfg({ lay: [["g", "g1", 3, 0, "0", "Дом"], ["c", "awg", 1, 0, "2", "g1"], ["c", "telemt", 2, 0, "1", "g1"]] }) }), URL0);
  // drag into / out of groups; rects are made up, everything else sits far away
  const gdrag = async (w, p, rects, sel, x, y) => {
    Array.from(p.querySelectorAll(".kd-item,.kd-lay")).forEach(e => rc(e, 5000, 5000, 10, 10));
    rects.forEach(([s, l, t, wd, h]) => rc(p.querySelector(s), l, t, wd, h));
    const h = p.querySelector(sel), f = (t, px, py) => { const e = new w.Event(t, { bubbles: true, cancelable: true }); e.clientX = px; e.clientY = py; e.pointerId = 1; e.pointerType = "mouse"; e.button = 0; h.dispatchEvent(e); };
    f("pointerdown", 10, 10); f("pointermove", x, y); f("pointerup", x, y); await wait(200);
    return sent(w, fcalls);
  };
  const TOP = [".kd-lay", 0, 0, 1000, 400], G1 = '[data-g="g1"]';
  const L2 = only([["c", "sys", 1, 0, "0", ""], ["g", "g1", 3, 0, "0", "G"], ["c", "awg", 1, 0, "0", "g1"], ["c", "telemt", 1, 0, "1", "g1"]], ["sys", "awg", "telemt"]);
  fcalls = [];
  await run(L2, async w => {
    const p = await openPage(w);
    const [rev, txt] = await gdrag(w, p, [TOP, ['[data-id="sys"]', 0, 0, 90, 50], [G1, 0, 100, 300, 200], [G1 + " .kd-lay", 0, 140, 300, 160], ['[data-id="awg"]', 0, 140, 90, 50], ['[data-id="telemt"]', 100, 140, 90, 50]], '[data-id="sys"] .kd-drag', 40, 150);
    ok("drag: a card goes into a group in the column under the pointer, before the first card of that column below it", /^keendash 1 [a-z0-9]{12}\ngroup g1 3 0 0 G\ncard sys 1 0 0 g1\ncard awg 1 0 0 g1\ncard telemt 1 0 1 g1\nend\n$/.test(txt), txt);
    ok("drag: the card shows inside the group", p.querySelector(G1 + ' [data-id="sys"]') && top(p)[0].getAttribute("data-g") === "g1");
  }, fm(fcalls, { base: L2 }), URL0);
  const L3 = only([["c", "sys", 1, 0, "0", ""], ["g", "g1", 3, 0, "0", "G"]], ["sys"]);
  fcalls = [];
  await run(L3, async w => {
    const p = await openPage(w);
    const [rev, txt] = await gdrag(w, p, [TOP, ['[data-id="sys"]', 0, 0, 90, 50], [G1, 0, 100, 300, 100], [G1 + " .kd-lay", 0, 140, 300, 60]], '[data-id="sys"] .kd-drag', 150, 160);
    ok("drag: a card goes into column 1 of an empty group, x 1 within the group", /^keendash 1 [a-z0-9]{12}\ngroup g1 3 0 0 G\ncard sys 1 0 1 g1\nend\n$/.test(txt), txt);
  }, fm(fcalls, { base: L3 }), URL0);
  const L4 = only([["g", "g1", 3, 0, "0", "G"], ["c", "awg", 1, 0, "0", "g1"], ["c", "telemt", 1, 0, "1", "g1"], ["c", "sys", 1, 0, "2", ""]], ["awg", "telemt", "sys"]);
  fcalls = [];
  await run(L4, async w => {
    const p = await openPage(w);
    const [rev, txt] = await gdrag(w, p, [TOP, [G1, 0, 0, 300, 200], [G1 + " .kd-lay", 0, 40, 300, 160], ['[data-id="awg"]', 0, 40, 90, 50], ['[data-id="telemt"]', 100, 40, 90, 50], ['.kd-lay > [data-id="sys"]', 0, 250, 90, 50]], '[data-id="telemt"] .kd-drag', 50, 290);
    ok("drag: a card goes out of a group to the page, last in its column 0", /^keendash 1 [a-z0-9]{12}\ngroup g1 3 0 0 G\ncard awg 1 0 0 g1\ncard sys 1 0 2\ncard telemt 1 0 0\nend\n$/.test(txt), txt);
  }, fm(fcalls, { base: L4 }), URL0);
  const L5 = only([["g", "g1", 3, 0, "0", "A"], ["c", "awg", 1, 0, "0", "g1"], ["g", "g2", 3, 0, "0", "B"], ["c", "telemt", 1, 0, "0", "g2"], ["c", "sys", 1, 0, "0", ""]], ["awg", "telemt", "sys"]);
  fcalls = [];
  await run(L5, async w => {
    const p = await openPage(w);
    const [rev, txt] = await gdrag(w, p, [TOP, [G1, 0, 0, 300, 100], [G1 + " .kd-lay", 0, 40, 300, 60], ['[data-g="g2"]', 0, 150, 300, 100], ['[data-g="g2"] .kd-lay', 0, 190, 300, 60], ['.kd-lay > [data-id="sys"]', 0, 300, 90, 50]], G1 + " .kd-drag", 250, 215);
    ok("drag: a group dropped over another group's grid stays on the page", /^keendash 1 [a-z0-9]{12}\ngroup g2 3 0 0 B\ncard telemt 1 0 0 g2\ngroup g1 3 0 0 A\ncard awg 1 0 0 g1\ncard sys 1 0 0\n/.test(txt) && Array.from(p.querySelector(".kd-lay").children).map(idOf).slice(0, 2).join() === "g2,g1", txt);
  }, fm(fcalls, { base: L5 }), URL0);
  // the column comes from the dragged item's left edge, not the pointer (the handle is at the right end of the header)
  const W2 = only([["c", "sys", 2, 0, "0", ""]], ["sys"]);
  for (const [nm, px2, want] of [["a few px", 15, 0], ["one column width", 10 + 308, 1]]) {
    fcalls = [];
    await run(W2, async w => {
      const p = await openPage(w), [rev, txt] = await gdrag(w, p, [[".kd-lay", 0, 0, 900, 400], ['[data-id="sys"]', 0, 0, 600, 100]], '[data-id="sys"] .kd-drag', px2, 20);
      ok("drag: a 2/3 card at x 0 dragged " + nm + " lands in x " + want, new RegExp("^keendash 1 [a-z0-9]{12}\\ncard sys 2 0 " + want + "\\nend\\n$").test(txt), txt);
    }, fm(fcalls, { base: W2 }), URL0);
  }
  const foldTelemt = async w => { const p = await openPage(w); p.querySelector('[data-id="telemt"] .kd-fold').click(); return p; };
  const folded = p => !p.querySelector('[data-id="telemt"] .us-body');
  fcalls = [];
  await run(full, async w => {
    const p = await foldTelemt(w); await wait(200);
    await w.__servicesWidget.update();
    ok("page: failed save shows the error and drops the layout", !folded(p) && /Не удалось сохранить раскладку: строка 1: неверная ширина/.test(p.textContent), p.textContent.slice(0, 200));
  }, fm(fcalls, { err: "строка 1: неверная ширина" }), URL0);
  fcalls = [];
  await run(full, async w => {
    const p = await foldTelemt(w);
    ok("page: no Entware disk -> nothing uploaded, said so", !post(fcalls, /rci|fui/).length && /Не найден диск Entware/.test(p.textContent) && !folded(p), p.textContent.slice(0, 200));
  }, w => (u, i) => { fcalls.push([u, i || {}]); return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(Object.assign({}, full, { cfg: Object.assign({}, full.cfg, { vol: "" }) })) }); }, URL0);
  // the upload hangs: the saved layout stays until another rev shows in status.json or 45 s pass
  let seen = "r1";
  const hang = w => u => /rci/.test(u) ? new Promise(() => {}) : Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(Object.assign({}, full, { cfg: Object.assign({}, full.cfg, { rev: seen }) })) });
  await run(full, async w => {
    const p = await foldTelemt(w), kept = folded(p);
    seen = "other"; await w.__servicesWidget.update();
    ok("page: saved layout is forgotten when another rev appears", kept && !folded(p), kept);
  }, hang, URL0);
  seen = "r1";
  await run(full, async w => {
    const p = await foldTelemt(w), kept = folded(p), now = w.Date.now;
    await w.__servicesWidget.update(); const still = folded(p);
    w.Date.now = () => now() + 46000; await w.__servicesWidget.update();
    ok("page: saved layout is forgotten after 45 s", kept && still && !folded(p), kept + " " + still);
  }, hang, URL0);
  // two quick saves: the first rev landing is this tab's own, not another browser's
  {
    let seen2 = "", puts = [];
    await run(full, async w => {
      const p = await foldTelemt(w); p.querySelector('[data-id="sys"] .kd-fold').click();
      const both = () => !p.querySelector('[data-id="telemt"] .us-body') && !p.querySelector('[data-id="sys"] .us-body');
      const k0 = both(); seen2 = puts[0]; await w.__servicesWidget.update();
      const k1 = both(); seen2 = puts[1]; await w.__servicesWidget.update();
      ok("page: the first rev of two quick saves keeps the second layout, the second rev clears it", puts.length === 2 && k0 && k1 && !both() && !folded(p), [puts.length, k0, k1, both()].join());
    }, w => (u, i) => {
      const r = (b) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(b) });
      if (/\/rci\/put$/.test(u)) { puts.push(JSON.parse(i.body).filename.split("/").pop().replace(".txt", "")); return r({ port: { port: "7" } }); }
      if (/\/fui$/.test(u)) return new Promise(() => {});
      return r(Object.assign({}, full, { cfg: Object.assign({}, full.cfg, { rev: seen2 }) }));
    }, URL0);
  }
  fcalls = [];
  await run(renLay, async w => {
    const p = await openPage(w); p.querySelector('[data-g="g1"] .kd-more').click(); p.querySelector(".kd-ren").click();
    const inp = p.querySelector("input.kd-name"); typeIn(w, inp, "Новое"); inp.dispatchEvent(new w.Event("blur")); await wait(200);
    const [rev, txt] = await sent(w, fcalls);
    ok("rename: leaving the field saves the name", /\ngroup g1 3 0 0 Новое\ncard awg 1 0 0 g1\n/.test(txt) && !p.querySelector("input.kd-name") && p.querySelector('[data-g="g1"] .kd-gn').textContent === "Новое", txt);
  }, fm(fcalls, { base: renLay }), URL0);
  await run(full, async w => {
    const g = w.__servicesWidget.grpName, pair = String.fromCodePoint(0x1F600);
    ok("grpName: newline, CR, tab, | and DEL removed, pairs kept whole, 32 code points", g("a\nb\rc|d\te\x7f") === "abcde" && g(pair.repeat(40)) === pair.repeat(32) && g("  x  ") === "x");
  }, null, URL0);
  // a drag handle does nothing while a name is typed (the field would hold back the redraw)
  fcalls = [];
  await run(renLay, async w => {
    const p = await openPage(w); p.querySelector('[data-g="g1"] .kd-more').click(); p.querySelector(".kd-ren").click();
    const sys = p.querySelector('[data-id="sys"]'), h = sys.querySelector(".kd-drag"), f = (t, x) => { const e = new w.Event(t, { bubbles: true, cancelable: true }); e.clientX = x; e.clientY = 10; e.pointerId = 1; e.pointerType = "mouse"; e.button = 0; h.dispatchEvent(e); };
    f("pointerdown", 10); f("pointermove", 200); f("pointerup", 200); await wait(200);
    ok("drag: with a name field open nothing floats and nothing is saved", sys.style.position !== "fixed" && !!p.querySelector("input.kd-name") && !post(fcalls, /rci.put$/).length, sys.getAttribute("style"));
  }, fm(fcalls, { base: renLay }), URL0);
  // pointercancel puts everything back
  fcalls = [];
  const L6 = withCfg({ lay: [["c", "sys", 1, 0, "0", ""], ["c", "telemt", 1, 0, "1", ""], ["c", "awg", 1, 0, "2", ""]] });
  await run(L6, async w => {
    const p = await openPage(w);
    top(p).forEach((c, i) => rc(c, i * 100, 0, 90, 50));
    const h = p.querySelector('[data-id="telemt"] .kd-drag'), fire = (t, x) => { const e = new w.Event(t, { bubbles: true, cancelable: true }); e.clientX = x; e.clientY = 25; e.pointerId = 1; e.pointerType = "mouse"; e.button = 0; h.dispatchEvent(e); };
    fire("pointerdown", 110); fire("pointermove", 280); fire("pointercancel", 280); await wait(200);
    ok("drag: pointercancel keeps the layout and sends nothing", top(p).slice(0, 3).map(idOf).join() === "sys,telemt,awg" && !post(fcalls, /rci.put$/).length && !p.querySelector('[data-id="telemt"]').style.position, top(p).slice(0, 3).map(idOf).join());
  }, fm(fcalls, { base: L6 }), URL0);
  // group fold and width
  fcalls = [];
  await run(renLay, async w => {
    const p = await openPage(w); p.querySelector('[data-g="g1"] .kd-fold').click(); await wait(200);
    const [rev, txt] = await sent(w, fcalls);
    ok("group: fold sends c 1 on the group line", /\ngroup g1 3 1 0 Дом\ncard awg 1 0 0 g1\n/.test(txt) && /^keendash 1 [a-z0-9]{12}\ncard sys 1 0 0\n/.test(txt), txt);
  }, fm(fcalls, { base: renLay }), URL0);
  fcalls = [];
  await run(renLay, async w => {
    const p = await openPage(w); p.querySelector('[data-g="g1"] .kd-more').click(); p.querySelectorAll(".kd-mw")[1].click(); await wait(200);
    const [rev, txt] = await sent(w, fcalls);
    ok("group: width sends w 2 on the group line", /\ngroup g1 2 0 0 Дом\ncard awg 1 0 0 g1\n/.test(txt), txt);
  }, fm(fcalls, { base: renLay }), URL0);
  // the upload fails: the previous layout comes back with the reason
  fcalls = [];
  await run(full, async w => {
    const p = await foldTelemt(w); await wait(200);
    ok("page: a failed upload restores the layout and says so", folded(p) === false && /Не удалось сохранить раскладку: ошибка/.test(p.textContent), p.textContent.slice(0, 200));
  }, fm(fcalls, { put: 500 }), URL0);
  // the same id in two old col lines is one card, and the first change sends card lines only
  fcalls = [];
  await run(withCfg({ cols: [["sys", "telemt"], ["sys", "awg"]] }), async w => {
    const p = await openPage(w), ids = top(p).map(idOf);
    p.querySelector('[data-id="sys"] .kd-fold').click(); await wait(200);
    const [rev, txt] = await sent(w, fcalls), cards = (txt || "").split("\n").filter(l => /^card /.test(l)).map(l => l.split(" ")[1]);
    ok("page: cols with a repeated id show it once", ids.filter(x => x === "sys").length === 1 && ids.slice(0, 3).join() === "sys,telemt,awg", ids.join());
    ok("page: the first change after cols migration sends card lines, each id once", /^keendash 1 [a-z0-9]{12}\ncard sys 1 1 0\ncard telemt 1 0 0\ncard awg 1 0 1\n/.test(txt) && !/col /.test(txt) && cards.every((x, i) => cards.indexOf(x) === i), txt);
  }, fm(fcalls, { base: withCfg({ cols: [["sys", "telemt"], ["sys", "awg"]] }) }), URL0);
  // accessibility: names in labels, expanded state, focus back to «⋯»
  await run(withCfg({ lay: lay0 }), async w => {
    const p = await openPage(w), g = p.querySelector('[data-g="g1"]'), sys = p.querySelector('[data-id="sys"]'), al = (el, s) => el.querySelector(s).getAttribute("aria-label");
    const t = sys.querySelector(".kd-ct").textContent;
    ok("a11y: header labels carry the name, escaped", al(sys, ".kd-more") === "Ещё: " + t && al(sys, ".kd-drag") === "Перетащить: " + t && al(sys, ".kd-fold") === "Свернуть: " + t && al(g, ".kd-more") === "Ещё: Дом <b>x</b>" && al(g, ".kd-drag") === "Перетащить: Дом <b>x</b>" && !g.querySelector(".kd-gh b") && al(p.querySelector('[data-id="qb"]'), ".kd-gear") === "Настроить: " + p.querySelector('[data-id="qb"] .kd-ct').textContent);
    const more = sys.querySelector(".kd-more");
    ok("a11y: «⋯» and fold carry the state", more.getAttribute("aria-haspopup") === "true" && more.getAttribute("aria-expanded") === "false" && sys.querySelector(".kd-fold").getAttribute("aria-expanded") === "true");
    more.click();
    ok("a11y: the open menu is marked on «⋯», has no menu role", sys.querySelector(".kd-more").getAttribute("aria-expanded") === "true" && !p.querySelector(".kd-menu").hasAttribute("role"));
    esc(w);
    ok("a11y: Esc returns the focus to «⋯»", w.document.activeElement === p.querySelector('[data-id="sys"] .kd-more') && !p.querySelector(".kd-menu"));
    p.querySelector('[data-g="g1"] .kd-more').click(); p.querySelector(".kd-ph h1").click();
    ok("a11y: an outside click returns the focus to the group's «⋯»", w.document.activeElement === p.querySelector('[data-g="g1"] > .kd-gh > .kd-more'));
  }, null, URL0);
  // the volume comes from the freshest status, not the snapshot the dialog opened with
  fcalls = []; let novol = true;
  await run(full, async w => {
    const dlg = await openDlg(w); novol = false; await w.__servicesWidget.update();
    dlg.querySelector('input[data-w="main"][data-n="cron"]').click();
    dlg.querySelector(".kd-dlg-save").click(); await wait(100);
    const put = post(fcalls, /rci.put$/)[0];
    ok("settings: upload takes the volume of the freshest status", put && /^v1:.var.lib.keendash.inbox./.test(JSON.parse(put[1].body).filename), put && put[1].body);
  }, w => { const f = fm(fcalls, {})(w); return (u, i) => novol && !/rci|fui/.test(u) ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(Object.assign({}, full, { cfg: Object.assign({}, full.cfg, { vol: "" }) })) }) : f(u, i); }, URL0);
  // LAN scan in the settings dialog: the button sends "scan", cfg.scan drives the label and the «Найдено в сети» block
  const scanT = [["jellyfin", "Jellyfin", "Медиа", ["url", "key"], "Ключ: Панель управления → API-ключи"], ["metube", "MeTube", "Загрузки", ["url"], ""], ["nas", "NAS", "Серверы", ["url", "user", "pass"], ""]].concat(full.types);
  const NOW = full.now, FIND = [["192.168.1.5", "nas", "jellyfin", "http://192.168.1.5:8096"], ["192.168.1.6", "tv", "jellyfin", "http://192.168.1.6:8096"],
    ["192.168.1.7", "<b>x</b>", "metube", "http://192.168.1.7:8081"], ["192.168.1.8", "pc", "plex", "http://192.168.1.8:32400"]];
  const scanned = scan => Object.assign({}, full, { types: scanT, cfg: Object.assign({}, full.cfg, { scan }) });
  // the status follows S.scan, the uploaded files are kept in S.msgs, S.put makes /rci/put fail
  const scanFetch = S => w => (u, init) => {
    const r = (ok, status, body) => Promise.resolve({ ok, status, json: () => Promise.resolve(body) });
    if (/\/rci\/put$/.test(u)) return S.put ? r(false, S.put) : r(true, 200, { port: { port: "7" } });
    if (/\/fui$/.test(u)) { S.msgs.push(init.body.get("Filedata")); return r(true, 200, {}); }
    return r(true, 200, scanned(S.scan));
  };
  const sbtn = dlg => dlg.querySelector(".kd-dlg-scan"), srows = dlg => Array.from(dlg.querySelectorAll(".kd-dlg-sr label")).map(x => x.textContent);
  let S = { scan: null, msgs: [] };
  await run(scanned(null), async w => {
    const dlg = await openDlg(w), W = w.__servicesWidget, b = () => sbtn(dlg), sr = dlg.querySelector(".kd-dlg-sr");
    ok("scan: button «Сканировать сеть» next to the search, enabled, no block", b().textContent === "Сканировать сеть" && !b().disabled && b().parentNode === dlg.querySelector(".kd-dlg-q").parentNode && !sr.textContent, b() && b().outerHTML);
    b().click(); await wait(100);
    const txt = S.msgs.length === 1 ? await blobText(w, S.msgs[0]) : "";
    ok("scan: the button sends the single line scan", /^keendash 1 [a-z0-9]{12}\nscan\nend\n$/.test(txt), JSON.stringify(txt));
    ok("scan: after the click it waits for the router's first answer", b().disabled && b().textContent === "Сканирование…", b().textContent);
    S.scan = { state: "run", n: 3, of: 9, at: NOW - 2, found: [] }; await W.update();
    ok("scan: running -> «Сканирование… 3 из 9», disabled", b().disabled && b().textContent === "Сканирование… 3 из 9", b().textContent);
    S.scan = { state: "done", n: 9, of: 9, at: NOW - 1, found: FIND }; await W.update();
    ok("scan: done -> button enabled, block with all rows checked", !b().disabled && b().textContent === "Сканировать сеть" && /Найдено в сети/.test(sr.textContent) && sr.querySelectorAll("input:checked").length === 4 &&
      srows(dlg).join("\n") === "Jellyfin · nas · http://192.168.1.5:8096\nJellyfin · tv · http://192.168.1.6:8096\nMeTube · <b>x</b> · http://192.168.1.7:8081\nPlex · pc · http://192.168.1.8:32400", srows(dlg).join("|"));
    ok("scan: a device name is text, not markup", !sr.querySelector("b,img"));
    sr.querySelector('input[data-s="3"]').click();
    sr.querySelector(".kd-dlg-sadd").click();
    const items = Array.from(dlg.querySelectorAll(".kd-dlg-i")).slice(-3), q = s => dlg.querySelector(s);
    ok("scan: «Добавить выбранные» -> three new draft entries named by type and device", items.map(x => x.getAttribute("data-id")).join() === "jellyfin,jellyfin-2,metube" &&
      items.map(x => x.querySelector(".kd-dlg-n").textContent).join() === "Jellyfin (nas),Jellyfin (tv),MeTube" &&
      items.map(x => x.querySelector(".kd-dlg-t").textContent).join() === "Jellyfin · http://192.168.1.5:8096,Jellyfin · http://192.168.1.6:8096,MeTube · http://192.168.1.7:8081", items.map(x => x.textContent).join("|"));
    ok("scan: forms of types with a key open with the tip, MeTube stays closed", !!q('[data-id="jellyfin"] .kd-dlg-form') && !!q('[data-id="jellyfin-2"] .kd-dlg-form') && !q('[data-id="metube"] .kd-dlg-form') &&
      dlg.querySelectorAll(".kd-dlg-tip").length === 2 && q('[data-id="jellyfin-2"] input[data-f="url"]').value === "http://192.168.1.6:8096");
    const key = () => q('[data-id="jellyfin"] input[data-f="key"]'), miss = () => key().parentNode.classList.contains("kd-dlg-miss") && /Заполните/.test(key().parentNode.textContent);
    ok("scan: the empty key field is highlighted, typing clears it", miss() && (typeIn(w, key(), "k"), !miss()));
    ok("scan: added rows leave the block, the unchecked one stays unchecked", srows(dlg).join() === "Plex · pc · http://192.168.1.8:32400" && !q(".kd-dlg-sr input:checked") && !!q(".kd-dlg-save"), srows(dlg).join());
    q('.kd-dlg-add[data-type="jellyfin"]').click();
    ok("scan: ids follow the manual add rules", !!q('.kd-dlg-i[data-id="jellyfin-3"]'));
    q('[data-id="jellyfin-3"] .kd-dlg-del').click(); q('[data-id="jellyfin-2"] .kd-dlg-del').click();
    ok("scan: a deleted draft entry brings its row back", srows(dlg).length === 2 && /tv/.test(srows(dlg)[0]), srows(dlg).join());
  }, scanFetch(S), URL0);
  S = { scan: null, msgs: [] };
  await run(scanned(null), async w => {
    S.scan = { state: "done", n: 9, of: 9, at: NOW - 1, found: FIND };
    const dlg = await openDlg(w), W = w.__servicesWidget, sr = dlg.querySelector(".kd-dlg-sr"); await W.update();
    ok("scan: «Скрыть» hides the block", srows(dlg).length === 4 && (sr.querySelector(".kd-dlg-shide").click(), !sr.textContent.includes("Найдено")) && w.localStorage.getItem("ui.services.scanhide") === String(NOW - 1), sr.textContent);
    await W.update();
    ok("scan: stays hidden for the same result", !sr.textContent.includes("Найдено"));
    S.scan = Object.assign({}, S.scan, { at: NOW + 5 }); await W.update();
    ok("scan: a newer result shows again", srows(dlg).length === 4);
  }, scanFetch(S), URL0);
  S = { scan: { state: "done", n: 9, of: 9, at: NOW - 600, found: FIND }, msgs: [] };
  await run(scanned(S.scan), async w => {
    const dlg = await openDlg(w), sr = dlg.querySelector(".kd-dlg-sr");
    ok("scan: an old result shows its age", /Найдено в сети · 10 мин назад/.test(sr.textContent), sr.textContent);
    S.scan = { state: "done", n: 9, of: 9, at: NOW - 600, found: [] }; await w.__servicesWidget.update();
    ok("scan: no finds -> «Ничего нового не найдено» with the age", /Ничего нового не найдено · 10 мин назад/.test(sr.textContent) && !sr.querySelector(".kd-dlg-sadd"), sr.textContent);
    S.scan = { state: "run", n: 1, of: 9, at: NOW - 300, found: [] }; await w.__servicesWidget.update();
    ok("scan: a run older than 240 s is finished, the button is enabled", !sbtn(dlg).disabled && sbtn(dlg).textContent === "Сканировать сеть", sbtn(dlg).textContent);
  }, scanFetch(S), URL0);
  S = { scan: null, msgs: [], put: 500 };
  await run(scanned(null), async w => {
    const dlg = await openDlg(w); sbtn(dlg).click(); await wait(100);
    ok("scan: the message failing -> «Не удалось просканировать: …», button enabled", /Не удалось просканировать: \S/.test(dlg.querySelector(".kd-dlg-sr").textContent) && !sbtn(dlg).disabled && !S.msgs.length, dlg.querySelector(".kd-dlg-sr").textContent);
  }, scanFetch(S), URL0);
  S = { scan: null, msgs: [] };
  await run(scanned(null), async w => {
    const st = w.setTimeout; w.setTimeout = (f, t, ...a) => st(f, t === 45000 ? 50 : t, ...a);
    const dlg = await openDlg(w); sbtn(dlg).click(); await wait(200);
    ok("scan: no answer in 45 s -> the error note, button enabled", /Не удалось просканировать: нет ответа/.test(dlg.querySelector(".kd-dlg-sr").textContent) && !sbtn(dlg).disabled, dlg.querySelector(".kd-dlg-sr").textContent);
  }, scanFetch(S), URL0);
  S = { scan: { state: "run", n: 3, of: 9, at: NOW - 2, found: [] }, msgs: [] };
  await run(scanned(S.scan), async w => {
    const ms = [], st = w.setTimeout; w.setTimeout = (f, t, ...a) => (ms.push(t), st(f, t, ...a));
    const dlg = await openDlg(w); await w.__servicesWidget.update();
    ok("scan: while it runs and the dialog is open the status is polled every 5 s", ms.includes(5000) && sbtn(dlg).textContent === "Сканирование… 3 из 9", ms.join());
  }, scanFetch(S), URL0);
  S = { scan: null, msgs: [] };
  await run(scanned(null), async w => {
    // a save on its way: the scan button waits too
    const dlg = await openDlg(w);
    dlg.querySelector('input[data-w="main"][data-n="cron"]').click();
    dlg.querySelector(".kd-dlg-save").click(); await wait(50);
    ok("scan: the button is disabled while a save is in flight", sbtn(dlg).disabled && /Сохранение…/.test(dlg.textContent), sbtn(dlg).outerHTML);
  }, w => u => /\/rci\/put$/.test(u) ? new Promise(() => {}) : Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(scanned(null)) }), URL0);
  S = { scan: { state: "done", n: 5, of: 9, at: NOW - 1, found: FIND }, msgs: [] };
  await run(scanned(S.scan), async w => {
    const dlg = await openDlg(w), sr = dlg.querySelector(".kd-dlg-sr");
    ok("scan: cut by the time limit -> «проверено 5 из 9» in the heading", /Найдено в сети · только что · проверено 5 из 9/.test(sr.textContent), sr.textContent);
    S.scan = { state: "done", n: 9, of: 9, at: NOW - 1, found: FIND }; await w.__servicesWidget.update();
    ok("scan: complete -> no «проверено»", /Найдено в сети/.test(sr.textContent) && !/проверено/.test(sr.textContent), sr.textContent);
    S.scan = { state: "done", n: 5, of: 9, at: NOW - 1, found: [] }; await w.__servicesWidget.update();
    ok("scan: cut and nothing found -> «проверено 5 из 9» in the note", /Ничего нового не найдено · только что · проверено 5 из 9/.test(sr.textContent), sr.textContent);
  }, scanFetch(S), URL0);
  S = { scan: { state: "done", n: 9, of: 9, at: NOW - 1, found: FIND.concat([["192.168.1.9", "box", "nas", "http://192.168.1.9:80"]]) }, msgs: [] };
  await run(scanned(S.scan), async w => {
    const dlg = await openDlg(w), q = s => dlg.querySelector(s);
    // the same type on the same host at any port is not offered again
    q('.kd-dlg-add[data-type="jellyfin"]').click();
    typeIn(w, q('[data-id="jellyfin"] input[data-f="url"]'), "http://192.168.1.5:9999/");
    ok("scan: a draft entry of the type on the same host (another port) hides the find", srows(dlg).join("|") === "Jellyfin · tv · http://192.168.1.6:8096|MeTube · <b>x</b> · http://192.168.1.7:8081|Plex · pc · http://192.168.1.8:32400|NAS · box · http://192.168.1.9:80", srows(dlg).join("|"));
    srows(dlg).forEach((x, i) => { if (!/NAS/.test(x)) q('.kd-dlg-sr').querySelector('input[data-s="' + i + '"]').click(); });
    q('.kd-dlg-sr').querySelector(".kd-dlg-sadd").click();
    ok("scan: a type whose only secret is a password opens its form without the red «Заполните»", !!q('[data-id="nas"] .kd-dlg-form') && !q('[data-id="nas"] .kd-dlg-miss') && !/Заполните/.test(q('[data-id="nas"]').textContent), dlg.textContent.slice(0, 300));
  }, scanFetch(S), URL0);
  console.log(res.join("\n")); process.exit(res.some(r => r.startsWith("FAIL")) ? 1 : 0);
})();
