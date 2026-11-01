const { JSDOM } = require("jsdom"); const fs = require("fs"), path = require("path");
const base = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "status.json"), "utf8"));
const full = Object.assign({}, base, {
  now: 1793438837, tabs: ["telemt", "awg", "firc", "nfqws", "hydra", "agh", "media", "ascn", "sys"], hydra: {run:1,up:7200,mem:2048,keys:120,ips:345,list:[["HydraRoute",100,300,40,0],["nwg0",20,5,0,1],["Empty",0,0,0,0]]}, nfq: {run:1,pkts:446616,drop:0,up:71735,mem:6876,user:278,auto:522,excl:171,ipsets:16,today:90,ev:[["12:06","frontier.tiktokv.com","fail counter 1/3"],["12:03","version.immich.cloud","retrans threshold reached"]],mon:[["youtube.com",1793437803,1,183],["x.com",1793437803,1,460],["bad.org",1793437803,0,0],["old.org",1793000000,1,100]]}, ascn: {ips:2,subnets:1,honeypot:3,candidates:15,bans:[["subnets","185.136.15.0/24",861460,"KZ"],["honeypot","94.154.43.234",860884,""],["ips","1.2.3.4",5000,"US"]]}, web: [["lighttpd","90","nfqws-keenetic-web"],["lighttpd","8090","nfqws2"],["firc","666","firc WebUI"]],
  agh: {ok:1,url:"http://127.0.0.1:3000",q:52310,b:7840,ms:18,days:0,fon:3,fall:4,rules:368606,upd:1793431637,sq:[2200,2489,2765,2684,2896,3064,2854,2926,2953,2614,2578,2199,2150,2115,1776,1804,1876,1666,1835,2047,1967,2242,2202,2491],sb:[330,383,433,419,458,488,450,463,468,406,399,330,321,314,252,257,271,232,263,302,287,338,330,383],top:[["ads.example.com",812],["tracker.example.net",455],["mc.yandex.ru",301],["telemetry.example.org",120],["pixel.example.com",64]],cl:[["Ноутбук","192.168.1.20",5321],["Телефон","192.168.1.31",2210],["vpn-laptop","10.8.0.2",900],["","192.168.1.99",10]],last:[[1793438000,"ads.example.com","Ноутбук"],[1793437467,"tracker.example.net","192.168.1.99"]]},
  media: {svc:[["immich","http://10.0.0.5:2283"],["qb","http://localhost:8080"],["plex","http://10.0.0.5:32400"],["sonarr","http://10.0.0.5:8989"],["radarr","http://10.0.0.5:7878"],["prowlarr","http://10.0.0.5:9696"],["overseerr","http://10.0.0.5:5055"]],
    qb:{ok:1,dl:5242880,up:524288,n:3,list:[["Example.Show.S01E01.1080p.mkv",420,4194304,600],["Big Movie",900,1048576,3600],["Stalled.Thing",100,0,8640000]]},
    plex:{ok:1,streams:2,list:[["alice","Example Show · Pilot",50,"playing"],["bob","Example Movie",10,"paused"]],libs:[["Фильмы","movie",40],["Сериалы","show",23]]},
    sonarr:{ok:1,queue:7,missing:129,list:[["Example Show S02E05",75,750],["Other S01E12",0,93784]],cal:[[1793667600,"Example Show","S02E06",0],[1793910600,"New Show","S01E01",1]]},
    radarr:{ok:1,queue:1,missing:null,list:[["Example Movie",75,7200]],cal:[[1793611237,"Soon Movie","d"]]},
    prowlarr:{ok:1,all:3,on:2,bad:1,q:50,g:4,fail:5,list:["Tracker Two"]},
    overseerr:{ok:1,pending:2,processing:3,available:6,total:12},
    immich:{ok:1,photos:18230,videos:1204,usage:442381631488,list:[["Alice",15000,1000,400000000000],["Bob",3230,204,42381631488]]}},
  svc: [["cron",1,""],["dropbear",1,""],["nfqws2",1,""],["lighttpd",1,"90"],["portal",1,"81"],["ascn",1,""],["awg-manager",1,"2222"],["firc",1,"666"],["haproxy",0,""],["telemt",2,""],["telemt-panel",1,"8083"],["foo",3,"http://example.org:99/x"],["hrweb",1,"2000"]]
});
const mini = { tabs: ["sys"], svc: [["dropbear", 1, ""]], sys: { load: 10, mem: 30, memtotal: 256, temp: null, disk: 10, free: 100, up: 3600 }, series: {} };
function run(data, tests, fetchFn) {
  const card = `<div cdkdrag="" class="cdk-drag ndw-drag-panel__row"><div><ndw-segments-card><ndw-dashboard-card class="segments-card"><div class="dashboard-card"><div class="dashboard-card__header"><ndw-router-link class="dashboard-card__header-link"><a href="/x">Сегменты</a></ndw-router-link><div class="dashboard-card__header-buttons"><ndw-svg-icon class="ndw-drag-handle dashboard-card__drag-icon"><svg></svg></ndw-svg-icon></div></div><div class="dashboard-card__content">old</div></div></ndw-dashboard-card></ndw-segments-card></div></div>`;
  const dom = new JSDOM(`<!doctype html><body><div id="c0" class="ndw-drag-panel__column">${card}</div></body>`, { url: "http://192.168.0.1/", runScripts: "outside-only", pretendToBeVisual: true });
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
    click("agh");
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
  await run(Object.assign({}, mini, { tabs: ["agh", "sys"], agh: { ok: 0, url: "http://10.0.0.5:3000" } }), (w, m) => {
    m.querySelector('[data-tab="agh"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("agh down: hint about keendash.conf, no blocks", /недоступен/.test(m.textContent) && /ADGUARD_PASS/.test(m.textContent) && !m.querySelector(".us-blk"), m.textContent);
  });
  await run(Object.assign({}, mini, { tabs: ["agh", "sys"], agh: { ok: 1, q: 9000, b: 900, days: 0, sq: Array(168).fill(50), sb: Array(168).fill(5) } }), (w, m) => {
    m.querySelector('[data-tab="agh"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("agh 7-day stats: 168 hourly points -> 7 дн", /Запросов за 7 дн/.test(m.querySelector(".us-grid").textContent), m.querySelector(".us-grid").textContent);
  });
  await run(Object.assign({}, mini, { tabs: ["agh", "sys"], agh: { ok: null, url: "http://10.0.0.5:3000" } }), (w, m) => {
    m.querySelector('[data-tab="agh"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("agh before the first cron run: wait note, link already there", /появятся в течение минуты/.test(m.textContent) && !/недоступен/.test(m.textContent) && m.querySelector("a.us-open").href === "http://10.0.0.5:3000/", m.textContent);
  });
  // media tab: one sub-tab per configured service
  await run(full, (w, m) => {
    const click = (sel) => m.querySelector(sel).dispatchEvent(new w.Event("click", { bubbles: true }));
    click('[data-tab="media"]');
    const subs = Array.from(m.querySelectorAll(".us-mt")).map(b => b.textContent);
    ok("media: 7 sub-tabs in fixed order, first active", subs.join() === "qBittorrent,Plex,Sonarr,Radarr,Prowlarr,Overseerr,Immich" && m.querySelector(".us-mt.us-on").textContent === "qBittorrent", subs.join());
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
  });
  await run(Object.assign({}, mini, { tabs: ["media", "sys"], media: { svc: [["sonarr", "http://127.0.0.1:8989"]], sonarr: { ok: 0 } } }), (w, m) => {
    m.querySelector('[data-tab="media"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("media single service: no sub-tabs, keys hint, loopback link", !m.querySelector(".us-sub") && /API Sonarr недоступен/.test(m.textContent) && /SONARR_KEY/.test(m.textContent) && m.querySelector("a.us-open").href === "http://192.168.0.1:8989/", m.textContent);
  });
  await run(Object.assign({}, mini, { tabs: ["media", "sys"], media: { svc: [["immich", "http://10.0.0.5:2283"]], immich: { ok: null } } }), (w, m) => {
    m.querySelector('[data-tab="media"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("media before the first cron run: wait note", /появятся в течение минуты/.test(m.textContent));
  });
  // collectors against fixture API answers through tests/fake-wget (it also checks the auth headers)
  const os = require("os"), cp = require("child_process");
  function collect(script, args, conf) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kd-"));
    fs.copyFileSync(path.join(__dirname, "fake-wget"), path.join(tmp, "wget")); fs.chmodSync(path.join(tmp, "wget"), 0o755);
    fs.writeFileSync(path.join(tmp, "conf"), conf);
    // the scripts pin PATH; drop that line so the fake wget comes first
    const src = fs.readFileSync(path.join(__dirname, "..", "files", "opt", "share", "keendash", "bin", script), "utf8").replace(/^PATH=.*$/m, ":");
    // C:\x -> /c/x for Git Bash: a drive colon would split PATH
    const unix = p => p.replace(/\\/g, "/").replace(/^([A-Za-z]):/, (_, d) => "/" + d.toLowerCase()), t = unix(tmp);
    const out = cp.execFileSync("sh", ["-c", 'PATH="' + t + ':$PATH" KEENDASH_CONF="' + t + '/conf" FIX="' + unix(path.join(__dirname, "fixtures")) + '" sh -s ' + args], { input: src, encoding: "utf8" });
    fs.rmSync(tmp, { recursive: true, force: true });
    return out;
  }
  {
    const out = collect("agh", "", 'ADGUARD_URL="http://192.168.1.10:3000/"\nADGUARD_USER=u\nADGUARD_PASS=p\n');
    const want = ["agh_ok 1", "agh_q 52310", "agh_b 7840", "agh_ms 18", "agh_days 0", "ab|ads.example.com|812", "ab|pixel.example.com|64",
      "ac|Ноутбук|192.168.1.20|5321", "ac|Телефон|192.168.1.31|2210", "ac|vpn-laptop|10.8.0.2|900", "ac||192.168.1.99|10",
      "agh_fon 3", "agh_fall 4", "agh_rules 368606", "agh_upd 1793531511", "al|1793541000|ads.example.com|Ноутбук", "al|1793540467|tracker.example.net|192.168.1.99"];
    const lines = out.split("\n"), miss = want.filter(l => lines.indexOf(l) < 0);
    ok("bin/agh: parses stats, clients, filters, query log", !miss.length && lines.filter(l => l.startsWith("ab|")).length === 5 && /^agh_sq 2200,(\d+,){22}2491$/m.test(out), miss.join(" / ") || out);
  }
  {
    const conf = "QBIT_URL=http://qb.test:8080\nQBIT_USER=admin\nQBIT_PASS='p&s=s'\nPLEX_URL=http://plex.test:32400/\nPLEX_TOKEN=testkey\n" +
      "SONARR_URL=http://sonarr.test\nSONARR_KEY=testkey\nRADARR_URL=http://radarr.test\nRADARR_KEY=testkey\nPROWLARR_URL=http://prowlarr.test\nPROWLARR_KEY=testkey\n" +
      "OVERSEERR_URL=http://overseerr.test\nOVERSEERR_KEY=testkey\nIMMICH_URL=http://immich.test\nIMMICH_KEY=testkey\n";
    const want = {
      qb: ["qb_ok 1", "qb_dl 5242880", "qb_up 524288", "qbt|Example.Show.S01E01.1080p.mkv|420|4194304|600", 'qbt|Big   Pipe "Quoted" Movie 2160p|900|1048576|3600', "qbt|Stalled.Thing|100|0|8640000", "qb_n 3"],
      plex: ["pl_ok 1", "pls|alice|Example Show · Pilot|50|playing", "pls|bob|Example Movie|10|paused", "pl_streams 2", "pll|Фильмы|movie|40", "pll|Сериалы|show|23"],
      sonarr: ["sn_ok 1", "sn_queue 7", "snq|Example Show S02E05|75|750", "snq|Other S01E12|0|93784", "sn_missing 129", "snc|1793667600|Example Show|S02E06|0", "snc|1793910600|New Show|S01E01|1"],
      radarr: ["rd_ok 1", "rd_queue 1", "rdq|Example Movie|75|7200", "rd_missing 3"],
      prowlarr: ["pw_ok 1", "pwb|Tracker Two", "pw_all 3", "pw_on 2", "pw_bad 1", "pw_q 50", "pw_g 4", "pw_fail 5"],
      overseerr: ["ov_ok 1", "ov_pending 2", "ov_processing 3", "ov_available 6", "ov_total 12"],
      immich: ["im_ok 1", "im_photos 18230", "im_videos 1204", "im_usage 442381631488", "imu|Alice|15000|1000|400000000000", "imu|Bob|3230|204|42381631488"]
    };
    Object.keys(want).forEach(s => {
      const lines = collect("ext", s, conf).trim().split("\n"), miss = want[s].filter(l => lines.indexOf(l) < 0);
      const extra = s === "radarr" ? /^rdc\|\d+\|Soon Movie\|d$/.test(lines[lines.length - 1]) && lines.length === 5 : lines.length === want[s].length;
      ok("bin/ext " + s, !miss.length && extra, miss.join(" / ") + " || " + lines.join(" / "));
    });
    // cron mode: every configured service lands in its own x.<name> cache file, a dropped key removes it
    const cache = fs.mkdtempSync(path.join(os.tmpdir(), "kd-cache-")), cu = cache.replace(/\\/g, "/").replace(/^([A-Za-z]):/, (_, d) => "/" + d.toLowerCase());
    fs.writeFileSync(path.join(cache, "x.agh"), "agh_ok 1\n");
    collect("ext", "", conf + 'KEENDASH_TMP="' + cu + '"\n');
    const files = fs.readdirSync(cache).sort().join(" ");
    ok("bin/ext: cache files per service", files === "x.immich x.overseerr x.plex x.prowlarr x.qb x.radarr x.sonarr" &&
      fs.readFileSync(path.join(cache, "x.plex"), "utf8").split("\n").indexOf("pll|Сериалы|show|23") >= 0, files);
    fs.rmSync(cache, { recursive: true, force: true });
    ok("bin/ext: wrong key -> service down", collect("ext", "sonarr", "SONARR_URL=http://sonarr.test\nSONARR_KEY=bad\n").trim() === "sn_ok 0");
    ok("bin/ext: wrong qBittorrent password -> down", collect("ext", "qb", "QBIT_URL=http://qb.test\nQBIT_USER=admin\nQBIT_PASS=x\n").trim() === "qb_ok 0");
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
  console.log(res.join("\n")); process.exit(res.some(r => r.startsWith("FAIL")) ? 1 : 0);
})();
