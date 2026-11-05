/* Review: whole lives played through the built play pages, the way a player plays them (tools/split/build.js, both
   parts served from their own file maps, so a file a part leaves out is a 404 as on the host).
   Each life starts at the title of Part One: the language picked with the title's switch, a new life made on the
   creation pages (a homeland, a name, the bards' pronoun, a temperament, an heirloom, story mode on or off), then
   the story played with taps (or clicks and keys on a laptop): a seeded choice on each page, every test and game
   played by hand (Space/Enter or taps on its buttons; the lac-house escape walked room by room), real-time fights
   played through their own buttons and keys (◀ ▶ held, Strike, Block held or Roll when a blow is coming, the path
   skill, Aid for herbs, the divine weapon and the call for help, Orders, Pause and Resume, Spare, Try again), war
   days through their cards, the Company menu and a tap on a foe, and the timed read on its buttons. At the end of
   Part One the save code it gives is carried to Part Two (Continue from Part One), and the life goes on to its end.
   Along the way it saves a copy (Menu), and on a death goes back to the start of the act once.
   Every scene is checked for its painting (the backdrop's file loaded, from the part's own files), and the run
   fails on a page or console error, a failed request, a screen with no way forward, an empty page, a fight that
   never ends or a fight screen left behind.
   Usage: node tests/review_play.js [--lives N=2] [--seed S=1] [--device "iPhone SE"|"iPhone 15"|laptop|all]
          [--lang en|hi|both] [--story on|off|mix] [--start new|war|act5] [--turns] [--steps N=3000 [--partial]] [--shots DIR] [--json FILE]
   Each life alternates device, language and story mode from the seed (with all/both/mix). Exits 1 on any problem. */
"use strict";
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const H = require("./lib/harness");
const { arg, has } = H;

const FIX = path.join(__dirname, "fixtures", "split");
const OUT = path.resolve(arg("--out", path.join(H.SCRATCH, "review_play")));
const SHOTS = path.resolve(arg("--shots", path.join(OUT, "shots")));
const LIVES = parseInt(arg("--lives", "2"), 10), SEED = parseInt(arg("--seed", "1"), 10), MAXSTEPS = parseInt(arg("--steps", "3000"), 10);
const TURNS = has("--turns");
const DEVSEL = arg("--device", "all"), LANGSEL = arg("--lang", "both"), STORYSEL = arg("--story", "mix"), START = arg("--start", "new");
const FONTS = path.join(__dirname, "fixtures", "fonts");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(SHOTS, { recursive: true });

// A small seeded random for the player's choices (the game keeps its own).
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

const DEVICES = ["iPhone SE", "iPhone 15", "laptop"];
const devOf = (pw, name) => (name === "laptop" ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 } : Object.assign({}, pw.devices[name], { deviceScaleFactor: 2 }));

if (require.main === module) (async () => {
  const pw = H.pw(); if (!pw) { console.error("Playwright is not installed"); process.exit(2); }
  // The two parts, built as they are published.
  const maps = {};
  const srv = await H.serve(null, { map: {}, extra: (rel) => { const m = rel.match(/^part([12])\/(.+)$/); if (m && maps[m[1]]) return maps[m[1]][m[2]] || null; return null; } });
  const url = (n) => srv.url + "part" + n + "/index.html";
  const bdir = path.join(OUT, "build");
  fs.rmSync(bdir, { recursive: true, force: true });
  const r = cp.spawnSync(process.execPath, [path.join(H.ROOT, "tools/split/build.js"), bdir, process.env.SPLIT_USE || path.join(FIX, "use.json"), process.env.SPLIT_LIVES || path.join(FIX, "act5_lives.json"), url(1), url(2), "--war=" + (process.env.SPLIT_WAR || path.join(FIX, "war_lives.json"))], { cwd: H.ROOT, encoding: "utf8" });
  if (r.status !== 0) { console.log("✗ the split build failed: " + (r.stderr || r.stdout).slice(0, 400)); process.exit(1); }
  for (const n of ["1", "2"]) { maps[n] = JSON.parse(fs.readFileSync(path.join(bdir, "part" + n + ".files.json"), "utf8")); maps[n]["index.html"] = path.join(bdir, "part" + n, "index.html"); }
  const fontCss = fs.existsSync(path.join(FONTS, "fonts.css")) ? fs.readFileSync(path.join(FONTS, "fonts.css"), "utf8") : "";
  const browser = await pw.chromium.launch();
  const results = [];
  const shut = () => browser.close().catch(() => {});
  process.once("SIGTERM", () => shut().then(() => process.exit(143))); process.once("SIGINT", () => shut().then(() => process.exit(130)));
  try {

  for (let li = 0; li < LIVES; li++) {
    const seed = SEED + li, R = rng(seed);
    const device = DEVSEL === "all" ? DEVICES[(seed - 1) % 3] : DEVSEL;
    const lang = LANGSEL === "both" ? (Math.floor((seed - 1) / 3) % 2 ? "hi" : "en") : LANGSEL;
    const story = STORYSEL === "mix" ? seed % 4 === 0 : STORYSEL === "on";
    const touch = device !== "laptop";
    const tag = (START !== "new" ? START + "-" : "") + (TURNS ? "turns-" : "") + "life" + seed + "-" + device.replace(/\s+/g, "") + "-" + lang + (story ? "-story" : "");
    const ctx = await browser.newContext(devOf(pw, device));
    await ctx.route(/fonts\.googleapis\.com/, (rt) => (fontCss ? rt.fulfill({ status: 200, contentType: "text/css", body: fontCss.replace(/url\(([^)]*?)([^/)]+\.woff2)\)/g, "url(" + srv.url + "__fonts/$2)") }) : rt.abort()));
    await ctx.route(/fonts\.gstatic\.com|__fonts\//, (rt) => { const f = path.join(FONTS, path.basename(rt.request().url())); return fs.existsSync(f) ? rt.fulfill({ status: 200, contentType: "font/woff2", body: fs.readFileSync(f) }) : rt.abort(); });
    const pg = await ctx.newPage();
    const L = { tag, seed, device, lang, story, bad: [], scenes: [], fights: [], tests: [], noArt: [], events: [], ending: null, part: 1 };
    const bad = (s, shot) => { L.bad.push(s); console.log("    ✗ " + tag + ": " + s.slice(0, 220)); if (shot !== false) shotOf(s.slice(0, 40)); };
    const shotOf = async (what) => { const f = path.join(SHOTS, tag + "-" + String(L.scenes.length).padStart(3, "0") + "-" + what.replace(/[^\w]+/g, "_").slice(0, 40) + ".png"); try { await pg.screenshot({ path: f }); L.events.push("shot " + f); } catch (e) { /* closed */ } return f; };
    pg.on("pageerror", (e) => bad("page error: " + e.message + " at " + (L.scenes[L.scenes.length - 1] || "?")));
    pg.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|__fonts/.test(m.text())) bad("console error: " + m.text().slice(0, 200) + " at " + (L.scenes[L.scenes.length - 1] || "?")); });
    pg.on("response", (q) => { if (q.status() >= 400 && !/fonts|__fonts/.test(q.url())) bad(q.status() + ": " + q.url().replace(srv.url, "/") + " at " + (L.scenes[L.scenes.length - 1] || "?"), false); });
    const cdp = touch ? await ctx.newCDPSession(pg) : null;
    const t0 = Date.now();
    try {
      await playLife(pg, cdp, L, R, { touch, story, lang, url });
    } catch (e) { bad("threw: " + String(e && e.stack || e).split("\n").slice(0, 3).join(" | ")); }
    L.ms = Date.now() - t0;
    await ctx.close();
    results.push(L);
    console.log((L.bad.length ? "✗ " : "ok ") + tag + ": " + L.scenes.length + " scenes, " + L.fights.length + " fights (" + L.fights.map((f) => f.enc + ":" + f.out).join(" ") + "), " + L.tests.length + " tests, ending " + JSON.stringify(L.ending) + ", " + (L.ms / 60000).toFixed(1) + " min");
    fs.writeFileSync(path.join(OUT, tag + ".json"), JSON.stringify(L, null, 1));
  }
  } finally { await shut(); await srv.close().catch(() => {}); }
  const fails = results.filter((x) => x.bad.length);
  console.log("review_play: " + results.length + " lives, " + (fails.length ? fails.length + " with problems" : "all clean"));
  const J = arg("--json", ""); if (J) fs.writeFileSync(J, JSON.stringify({ failed: fails.map((x) => x.tag), results }, null, 1));
  process.exit(fails.length ? 1 : 0);
})();

// ---------------------------------------------------------------------------------------------------------------
async function playLife(pg, cdp, L, R, o) {
  const tap = async (sel, opt = {}) => {
    const el = typeof sel === "string" ? await pg.$(sel) : sel; if (!el) return false;
    await el.scrollIntoViewIfNeeded().catch(() => {});
    if (o.touch) await el.tap({ timeout: 3000 }).catch(async () => { await el.click({ timeout: 3000 }).catch(() => {}); });
    else await el.click({ timeout: 3000 }).catch(() => {});
    return true;
  };
  const vis = (sel) => pg.evaluate((s) => [...document.querySelectorAll(s)].some((e) => e.offsetParent !== null || getComputedStyle(e).position === "fixed"), sel);
  await pg.goto(o.url(START === "new" ? 1 : 2));
  await pg.waitForFunction(() => window.K && K.UI && document.querySelector("#title-btns button"), null, { timeout: 30000 });
  await watch(pg);
  if (o.lang === "hi") { await tap('#hero-bar .langs button[lang="hi"]'); await sleep(1500); if (!(await pg.evaluate(() => K.lang === "hi"))) L.bad.push("the title's language switch did not switch to Hindi"); }
  if (START !== "new") {
    // Part Two's ready-made lives: Begin at the war, or Begin at Act V.
    L.part = 2;
    await tap(START === "war" ? "#btn-war" : "#btn-act5"); await sleep(800);
    const rows = await pg.$$(START === "war" ? ".part-lives [data-w]" : ".part-lives [data-i]");
    if (!rows.length) { L.bad.push("Begin at " + START + " lists no lives"); return; }
    await tap(rows[Math.floor(R() * rows.length)]); await sleep(2000);
    const s = await pg.evaluate(() => K.S && { scene: K.S.scene, act: K.S.act, side: K.S.side, path: K.S.path });
    L.events.push("began at " + START + ": " + JSON.stringify(s));
    if (o.story) { await setMenu(pg, tap, "#m-story"); }
    if (TURNS) await setMenu(pg, tap, '[data-fights="turns"]');
    return walk(pg, cdp, L, R, o, tap);
  }
  // A new life, on the creation pages.
  await tap("#btn-new"); await sleep(900);
  if (await pg.$("#as-list")) { await tap("#as-list"); await sleep(600); }
  const lands = await pg.$$("#origins .origin");
  if (!lands.length) { L.bad.push("no homelands to choose"); return; }
  const land = Math.floor(R() * lands.length);
  for (let i = 0; i < 4 && !(await pg.$("#land-ok")); i++) { const ls = await pg.$$("#origins .origin"); if (ls[land]) await tap(ls[land]); await sleep(1200); }
  for (let i = 0; i < 4 && !(await pg.$("#pname")); i++) { await tap("#land-ok"); await sleep(1200); }
  if (!(await pg.$("#pname"))) { L.bad.push("the homeland page did not lead to the name page"); await shot(pg, L, "create"); return; }
  await pg.fill("#pname", ["Ira", "Vasav", "Tara", "Kirit"][Math.floor(R() * 4)]);
  for (const s of ["#pron .opt", "#temps .pick", "#heirs .pick"]) { const all = await pg.$$(s); await tap(all[Math.floor(R() * all.length)]); await sleep(200); }
  if (o.story) await tap("#story");
  await tap("#begin"); await sleep(1500);
  const s0 = await pg.evaluate(() => K.S && { scene: K.S.scene, story: K.S.storyMode, origin: K.S.origin });
  if (!s0) { L.bad.push("the life did not begin"); return; }
  if (!!s0.story !== !!o.story) L.bad.push("story mode is " + s0.story + ", asked " + o.story);
  L.origin = s0.origin;
  if (TURNS) await setMenu(pg, tap, '[data-fights="turns"]');
  await walk(pg, cdp, L, R, o, tap);
}

// A setting in the in-life Menu, by tapping it.
async function setMenu(pg, tap, sel) {
  await tap("#nav-menu"); await sleep(700);
  await tap(sel); await sleep(300);
  await tap("#modal-close"); await sleep(400);
  if (await pg.$(".scrim .modal")) { await pg.keyboard.press("Escape"); await sleep(300); }
}

// What is on screen now, read from the page.
const LOOK = () => {
  const vis = (e) => e && e.offsetParent !== null && !e.disabled && getComputedStyle(e).visibility !== "hidden";
  const S = K.S, sc = S && K.SCENES[S.scene];
  const choices = [...document.querySelectorAll("#choices .choice")].filter((e) => vis(e) && !e.classList.contains("picked"));
  const bd = document.querySelector("#backdrop .bdl.on");
  return {
    scene: S && S.scene, act: S && S.act, age: S && S.age, alive: S && S.alive, path: S && S.path, side: S && S.side,
    beat: !!document.getElementById("beat"), moment: !!document.querySelector(".moment"),
    modal: [...document.querySelectorAll(".scrim .modal button")].filter(vis).map((e) => e.id || e.textContent.trim().slice(0, 30)),
    modalTitle: (document.querySelector(".scrim .modal h2") || {}).textContent || "",
    rt: !!(K.UI.rtScreen && K.UI.rtScreen()), war: !!(K.UI.warScreen && K.UI.warScreen()),
    fightmode: !!document.querySelector(".fm-beat"),
    fbGo: !!document.querySelector(".fbrief-wrap .fb-go"),
    oldFight: !!document.querySelector("#battle-actions button:not([disabled])"), oldBattle: !!document.querySelector("#battle-actions"), qte: !!document.querySelector(".qte .qte-btns button"),
    trial: !!document.querySelector(".trial"), trialKind: ((document.querySelector(".trial") || {}).className || "").replace(/.*\btrial-(\w+).*/, "$1"),
    trialBegin: [...document.querySelectorAll(".trial .trial-body > .btnrow button.cta")].filter(vis).length, trialPlaying: !!document.querySelector(".trial.playing"), trialDone: !!document.querySelector(".trial.done"),
    choices: choices.map((e) => "#" + e.id),
    ctas: [...document.querySelectorAll("#leaf .cta, #leaf button.cta")].filter(vis).map((e) => e.id || e.textContent.trim().slice(0, 30)),
    end: !!document.querySelector(".endscreen"), partEnd: !!document.querySelector("#part-code"),
    text: ((document.querySelector("#leaf") || {}).innerText || "").trim().length,
    bdKey: bd ? bd.dataset.key : null, bdUrl: bd ? bd.dataset.url : null, inScene: document.body.classList.contains("inscene"),
    lamp: !!document.querySelector(".lamp:not(.out)"),
    title: !!document.querySelector("#title-btns")
  };
};

async function walk(pg, cdp, L, R, o, tap) {
  let last = null, idle = 0, steps = 0, wentBack = false, saved = false, prevSig = "";
  const sceneSeen = new Set();
  for (; steps < MAXSTEPS; steps++) {
    const s = await pg.evaluate(LOOK);
    // A new scene: is its painting there?
    if (s.scene && s.scene !== last) { last = s.scene; L.scenes.push(s.scene); }
    if (s.scene && !s.rt && !s.war && !s.oldBattle && !s.trial && s.inScene && (s.choices.length || s.ctas.length)) {
      if (!sceneSeen.has(s.scene)) {
        sceneSeen.add(s.scene);
        await sleep(500);
        const art = await pg.evaluate(async () => {
          const bd = document.querySelector("#backdrop .bdl.on"); if (!bd) return { none: "no backdrop layer" };
          const url = bd.dataset.url, key = bd.dataset.key;
          if (!document.body.classList.contains("inscene")) return { skip: true };
          if (!url) return { none: "no painting (key " + JSON.stringify(key) + ")" };
          const ok = await new Promise((r) => { const im = new Image(); im.onload = () => r(im.naturalWidth > 0); im.onerror = () => r(false); im.src = url; });
          return ok ? { key, url } : { none: "painting failed to load: " + url.replace(location.origin, "") };
        });
        if (art.none && !(await pg.evaluate(() => !!document.querySelector(".endscreen, #part-code")))) { L.noArt.push(s.scene + ": " + art.none); L.bad.push("scene " + s.scene + " (act " + s.act + ", part " + L.part + "): " + art.none); await shot(pg, L, "noart-" + s.scene); }
      }
    }
    const sig = JSON.stringify([s.scene, s.fbGo, s.oldFight, s.qte, s.choices, s.ctas, s.trial, s.trialPlaying, s.modal, s.beat, s.moment, s.rt, s.war, s.end, s.partEnd, s.text]);
    if (sig === prevSig) idle++; else idle = 0;
    prevSig = sig;
    if (idle > 25) { L.bad.push("no way forward at " + s.scene + " (" + sig.slice(0, 200) + ")"); await shot(pg, L, "stuck-" + s.scene); return; }
    if (s.end) { await ending(pg, L, R, o, tap); if (L.again) { L.again = false; last = null; continue; } return; }
    if (s.partEnd) { if (!(await handOver(pg, L, o, tap))) return; last = null; continue; }
    if (s.rt) { await rtFight(pg, cdp, L, R, o, tap); continue; }
    if (s.war) { await warDay(pg, cdp, L, R, o, tap); continue; }
    if (s.fbGo) { await tap(".fbrief-wrap .fb-go"); await sleep(600); continue; }
    if (s.qte) { await sleep(800 + R() * 400); const bs = await pg.$$(".qte .qte-btns button"); await tap(bs[R() < 0.6 ? bs.length - 1 : Math.floor(R() * bs.length)]); await sleep(700); continue; }
    if (s.oldFight) { const bs = await pg.$$("#battle-actions button:not([disabled])"); await tap(bs[R() < 0.6 ? 0 : Math.floor(R() * bs.length)]); await sleep(500); const foe = await pg.$(".actor.enemy:not(.down)"); if (foe && R() < 0.3) await tap(foe); await sleep(400); if (!L.oldSeen) { L.oldSeen = true; L.fights.push({ enc: await pg.evaluate(() => K.Combat.state() && K.Combat.state().enc.id), out: "old-screen" }); } continue; }
    if (s.moment || s.beat) { await pg.mouse.click(10, 10).catch(() => {}); if (o.touch) await pg.touchscreen.tap(40, 300).catch(() => {}); else await pg.keyboard.press("Enter"); await sleep(700); continue; }
    if (s.modal.length) {
      // A modal in the story (a moment's card, a rules card, a test's practice): its main button.
      const b = await pg.$(".scrim .modal button.cta:not([disabled])") || await pg.$(".scrim .modal #modal-close") || await pg.$(".scrim .modal button");
      await tap(b); await sleep(500); continue;
    }
    if (s.trial && (s.trialPlaying || s.trialBegin) && !s.trialDone) { await trial(pg, cdp, L, R, o, tap, s); continue; }
    // Once in a life, save a copy from the Menu and check its code reads back.
    if (!saved && s.act >= 2 && s.choices.length) { saved = true; await saveCopy(pg, L, o, tap); continue; }
    if (s.choices.length) {
      // A player who likes a fight: a choice that leads to one, more often than not (fights are what this reviews most).
      const fights = await pg.evaluate((ids) => { const sc = K.SCENES[K.S.scene]; return ids.filter((id) => { const c = sc && (K.val(sc.choices) || []).find((x) => "#choice-" + x.id === id); return c && (c.combat || (K.leadsToFight && K.leadsToFight(c))); }); }, s.choices);
      const pool = fights.length && R() < 0.65 ? fights : s.choices;
      const pick = pool[Math.floor(R() * pool.length)];
      await tap(pick); await sleep(o.touch ? 900 : 700); continue;
    }
    if (s.ctas.length) { const b = await pg.$("#leaf .cta:not([disabled])"); await tap(b); await sleep(800); continue; }
    if (s.title) { L.bad.push("back on the title screen at step " + steps + " (after " + L.scenes.slice(-1)[0] + ")"); await shot(pg, L, "title"); return; }
    // The page is still being written: a tap hurries it on.
    const box = await pg.evaluate(() => { const l = document.querySelector("#leaf .text, #leaf"); const r = l && l.getBoundingClientRect(); return r && r.height > 40 ? { x: r.left + r.width / 2, y: Math.max(r.top + 20, Math.min(innerHeight - 40, r.top + Math.min(r.height / 2, 200))) } : { x: innerWidth / 2, y: innerHeight * 0.4 }; });
    if (o.touch) await pg.touchscreen.tap(box.x, box.y); else await pg.mouse.click(box.x, box.y);
    await sleep(500);
  }
  if (has("--partial")) L.events.push("stopped after " + MAXSTEPS + " steps (--partial), at " + L.scenes.slice(-1)[0]);
  else L.bad.push("still playing after " + MAXSTEPS + " steps (at " + L.scenes.slice(-1)[0] + ")");
}
async function shot(pg, L, what) { const f = path.join(SHOTS, L.tag + "-" + String(L.scenes.length).padStart(3, "0") + "-" + what.replace(/[^\w]+/g, "_").slice(0, 40) + ".png"); await pg.screenshot({ path: f }).catch(() => {}); L.events.push("shot " + f); return f; }

// Menu → Save a copy, and the life's code read back (Load a save code is checked at the hand-over).
async function saveCopy(pg, L, o, tap) {
  await tap("#nav-menu"); await sleep(700);
  if (!(await pg.$("#m-save"))) { L.bad.push("the Menu has no Save a copy"); return; }
  await tap("#m-save"); await sleep(400);
  const r = await pg.evaluate(() => ({ said: (document.getElementById("m-saved") || {}).textContent, slot: !!K.loadSlot("manual"), code: (document.getElementById("m-code") || {}).value }));
  if (!r.slot || !r.said) L.bad.push("Save a copy did not save (" + JSON.stringify(r.said) + ")");
  const back = await pg.evaluate((code) => { try { const s = K.importCode(code); return s && s.scene === K.S.scene && s.name === K.S.name; } catch (e) { return String(e); } }, r.code);
  if (back !== true) L.bad.push("the Menu's save code does not read back to this life: " + back);
  L.events.push("saved a copy at " + (await pg.evaluate(() => K.S.scene)));
  await tap("#modal-close") || (await pg.keyboard.press("Escape")); await sleep(400);
  if (await pg.$(".scrim .modal")) { await pg.keyboard.press("Escape"); await sleep(300); }
}

// The end of a life: full-screen, and on a death once, back to the start of the act.
async function ending(pg, L, R, o, tap) {
  await sleep(1500);
  // Skip shows everything at once (the bards' lines, the record and the way back to an act).
  { const sk = await pg.$(".endscreen .es-skip, .endscreen [data-skip], .endscreen button.skip"); if (sk) await tap(sk); else await pg.mouse.click(20, 200).catch(() => {}); await sleep(900); }
  const e = await pg.evaluate(() => { const el = document.querySelector(".endscreen"), r = el.getBoundingClientRect(); return { title: (el.querySelector(".es-title") || {}).textContent, alive: K.S.alive, full: r.left <= 0 && r.top <= 0 && r.right >= innerWidth - 1 && r.bottom >= innerHeight - 1, scene: K.S.scene, acts: [...el.querySelectorAll(".actback")].map((b) => +b.dataset.act) }; });
  if (!e.full) L.bad.push("the ending " + e.title + " is not full-screen");
  await shot(pg, L, "ending-" + (e.title || "?"));
  L.events.push("ending " + e.title + " at " + e.scene + (e.alive ? " (lived)" : " (died)"));
  // The Book of Lives keeps it.
  const kept = await pg.evaluate(() => (K.lives() || []).some((l) => l.lifeId === K.S.lifeId || (l.me && l.me.name === K.S.name)));
  if (!kept) L.bad.push("the Book of Lives does not keep the life that ended (" + e.title + ")");
  if (!e.alive && !L.wentBack && e.acts.length) {
    // Go back to the start of the act (everything is shown already).
    const b = await pg.$(".endscreen .actback");
    if (b) {
      L.wentBack = true; const act = await b.evaluate((x) => +x.dataset.act);
      await tap(b); await sleep(600); if (await pg.$(".endscreen .actback.armed")) { await tap(".endscreen .actback.armed"); await sleep(600); }
      await sleep(1500);
      const s = await pg.evaluate(() => ({ act: K.S.act, alive: K.S.alive, scene: K.S.scene, part: (window.K_PART || {}).n }));
      const handed = await pg.$("#part-code");
      L.events.push("went back to Act " + act + ": " + JSON.stringify(s) + (handed ? " (handed to Part One)" : ""));
      if (handed) { L.ending = { title: e.title, alive: e.alive, wentBack: act, handed: true }; return; }
      if (!s.alive || s.act !== act) L.bad.push("going back to Act " + act + " opened " + JSON.stringify(s));
      const dead = await pg.evaluate(() => (K.lives() || []).length);
      if (!dead) L.bad.push("going back to an act lost the Book of Lives' death");
      L.again = true; return;
    }
  }
  L.ending = { title: e.title, alive: e.alive };
}

// Part One's end: the code it gives opens the life in Part Two (Continue from Part One).
async function handOver(pg, L, o, tap) {
  const code = await pg.evaluate(() => document.getElementById("part-code").value);
  const s1 = await pg.evaluate(() => ({ scene: K.S.scene, act: K.S.act, name: K.S.name }));
  await shot(pg, L, "part-one-ends");
  if (L.part === 2) { L.bad.push("Part Two showed a hand-over at " + s1.scene); return false; }
  L.part = 2; L.events.push("Part One ends at " + s1.scene + " (act " + s1.act + ")");
  await pg.goto(o.url(2));
  await pg.waitForFunction(() => window.K && K.UI && document.querySelector("#title-btns button"), null, { timeout: 30000 });
  await watch(pg);
  if (o.lang === "hi") { if (!(await pg.evaluate(() => K.lang === "hi"))) { await tap('#hero-bar .langs button[lang="hi"]'); await sleep(1500); } }
  await tap("#btn-part1"); await sleep(700);
  await pg.fill("#code-in", code); await tap("#code-load"); await sleep(2000);
  const err = await pg.evaluate(() => (document.getElementById("code-err") || {}).textContent || "");
  if (err) { L.bad.push("Continue from Part One: " + err); return false; }
  const s2 = await pg.evaluate(() => ({ scene: K.S.scene, act: K.S.act, name: K.S.name, part: (window.K_PART || {}).n }));
  if (s2.part !== 2 || s2.name !== s1.name) L.bad.push("Continue from Part One opened " + JSON.stringify(s2));
  L.events.push("Part Two from " + s2.scene);
  return true;
}

// ---------- Tests and games, by hand ----------
async function trial(pg, cdp, L, R, o, tap, s) {
  if (s.trialBegin && !s.trialPlaying) {
    // The test's card: Begin (or Fight). Not the Antardhana skip.
    const b = await pg.$(".trial .trial-body > .btnrow button.cta");
    await tap(b); await sleep(600); return;
  }
  const kind = s.trialKind, t0 = Date.now();
  if (!s.trialPlaying) { await sleep(400); return; }
  L.tests.push(kind + "@" + s.scene);
  // Played until it ends (the frame's .done, or the trial gone), at most 150 s.
  while (Date.now() - t0 < 150000) {
    const st = await pg.evaluate(() => ({ on: !!document.querySelector(".trial.playing"), done: !!document.querySelector(".trial.done") || !document.querySelector(".trial") }));
    if (!st.on || st.done) break;
    if (kind === "escape") { await escapeStep(pg, cdp, o); continue; }
    // A board: a piece that can move, a point a tiger can go to (or a tiger), the dice's buttons.
    const P = ".trial.playing .trial-body ";
    const press = await pg.$(P + "button.trial-press:not([disabled])");
    if (press && R() < 0.85) { // a button to hold (draw, push, dive, cut...): held a while, as a thumb would
      const bb = await press.boundingBox(); if (!bb) { await sleep(300); continue; }
      const pt = { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }, ms = 200 + R() * 1800;
      if (o.touch) { await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [pt] }); await sleep(ms); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); }
      else { await pg.mouse.move(pt.x, pt.y); await pg.mouse.down(); await sleep(ms); await pg.mouse.up(); }
      await sleep(250 + R() * 600); continue;
    }
    const BP = ".trial.playing "; // a board may be drawn on the stage, outside the test's body
    if (await pg.$(BP + ".pc.can")) { if (R() < 0.5) await pg.keyboard.press(R() < 0.5 ? "1" : "2"); else await tap(BP + ".pc.can"); await sleep(400 + R() * 300); continue; }
    if (await pg.$(BP + ".pt.dest")) { const ds = await pg.$$(BP + ".pt.dest"); await tap(ds[Math.floor(R() * ds.length)]); await sleep(400); continue; }
    if (await pg.$(BP + ".bagh")) { const ts = await pg.$$(BP + ".pt:has(.tiger)"); if (ts.length) await tap(ts[Math.floor(R() * ts.length)]); await sleep(400); continue; }
    const btn = await pg.$(P + ".pc.can") || await pg.$(P + ".pt.dest") || await pg.$(P + "button.cta:not([disabled]):not(.trial-press)") || await pg.$(P + "button.live:not([disabled])") || await pg.$(P + "[data-move]:not([disabled])");
    if (btn) { if (await pg.$(P + ".pt.dest")) await tap(btn); else if (await pg.$(P + ".bagh") && !(await pg.$(P + ".pt.sel"))) { const ts = await pg.$$(P + ".pt:has(.tiger)"); await tap(ts[Math.floor(R() * ts.length)]); } else await tap(btn); await sleep(300 + R() * 400); continue; }
    // Tiles, cards and other buttons the test puts up to tap (the bard's verses, the rings...).
    const any = await pg.$$(P + "button:not([disabled]):not(.trial-press)");
    if (any.length && R() < 0.85) { await tap(any[Math.floor(R() * any.length)]); await sleep(300 + R() * 500); continue; }
    if (await pg.$(P + ".bagh")) { const ts = await pg.$$(P + ".pt:has(.tiger)"); if (ts.length) await tap(ts[Math.floor(R() * ts.length)]); await sleep(400); continue; }
    // Any other test: its one action, Space (or a tap on its button), pressed or held for a while.
    const hold = 120 + R() * 900;
    await pg.keyboard.down(" "); await sleep(hold); await pg.keyboard.up(" ");
    await sleep(150 + R() * 700);
  }
  if (await pg.evaluate(() => !!document.querySelector(".trial.playing"))) { L.bad.push("the test " + kind + " at " + s.scene + " did not end in 150 s of play"); await shot(pg, L, "test-" + kind); await pg.evaluate(() => { const b = document.querySelector(".trial.playing"); if (b) b.classList.remove("playing"); }); }
  await sleep(1200);
}
// The lac-house escape: the shortest way to the tunnel through the rooms not burning (arrows on a laptop, taps on a phone).
async function escapeStep(pg, cdp, o) {
  const st = await pg.evaluate(() => {
    const svg = document.querySelector(".lacplan svg"); if (!svg) return null;
    const me = svg.querySelector(".me"), m = /translate\(([\d.]+) ([\d.]+)\)/.exec(me.getAttribute("transform"));
    const cell = (x, y) => Math.floor(y / 20) * 5 + Math.floor(x / 20);
    return { me: cell(+m[1], +m[2]), fire: [...svg.querySelectorAll("rect.fire")].map((r) => +r.dataset.i), hold: !!svg.querySelector("circle.hold") };
  });
  if (!st) { await sleep(300); return; }
  if (st.hold) { await sleep(200); return; }
  const at = (c, r) => r * 5 + c, key = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
  const WALLS = new Set([[at(1, 0), at(1, 1)], [at(3, 0), at(3, 1)], [at(2, 2), at(3, 2)], [at(1, 3), at(1, 4)], [at(3, 3), at(4, 3)], [at(0, 1), at(1, 1)], [at(3, 1), at(3, 2)]].map(([a, b]) => key(a, b)));
  const nb = (i) => { const c = i % 5, r = Math.floor(i / 5), out = []; if (c > 0) out.push(i - 1); if (c < 4) out.push(i + 1); if (r > 0) out.push(i - 5); if (r < 4) out.push(i + 5); return out.filter((j) => !WALLS.has(key(i, j))); };
  const fire = new Set(st.fire), prev = { [st.me]: -1 }, q = [st.me];
  while (q.length) { const i = q.shift(); if (i === at(0, 4)) break; for (const j of nb(i)) if (!(j in prev) && !fire.has(j)) { prev[j] = i; q.push(j); } }
  let n = at(0, 4); if (!(n in prev)) { await sleep(300); return; }
  while (prev[n] !== st.me && prev[n] !== -1) n = prev[n];
  const d = n - st.me, k = d === 1 ? "ArrowRight" : d === -1 ? "ArrowLeft" : d === 5 ? "ArrowDown" : "ArrowUp";
  if (!o.touch) { await pg.keyboard.press(k); await sleep(420); return; }
  // A phone: tap the room (a stuck door is held open: the touch is held).
  const pt = await pg.evaluate((n) => { const r = document.querySelector('.lacplan rect[data-i="' + n + '"]'); if (!r) return null; const b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, n); // (the plan is drawn again each step)
  if (!pt) { await sleep(200); return; }
  const STUCK = new Set([[at(1, 1), at(2, 1)], [at(2, 3), at(2, 4)], [at(0, 2), at(0, 3)]].map(([a, b]) => key(a, b)));
  if (!STUCK.has(key(st.me, n))) { await pg.touchscreen.tap(pt.x, pt.y); await sleep(380); return; } // a plain tap on the room beside you
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [pt] }); await sleep(950); // a stuck door: held open
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await sleep(200);
}

// ---------- A real-time fight, through its buttons and keys ----------
const READ_RT = () => {
  const V = K.UI.rtScreen(); if (!V) return { gone: true };
  const R = V.R, C = K.Combat, RT = K.RT, p = C.player();
  const foes = R.B.units.filter((u) => u.side === "enemy" && u.hp > 0 && u.rt && u.rt.entered && !u.spared);
  const th = p ? RT.threats(R).filter((t) => t.mine || t.path) : [];
  const near = foes.slice().sort((a, b) => Math.abs(a.rt.x - p.rt.x) - Math.abs(b.rt.x - p.rt.x))[0];
  const box = (sel) => { const e = V.el.querySelector(sel); if (!e || e.offsetParent === null) return null; const r = e.getBoundingClientRect(); return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; };
  return {
    enc: V.encId, over: R.over, sheet: V.sheet, briefing: !!V.briefing, tour: !!V.el.querySelector(".tc-skip"), brief: !!V.el.querySelector(".fb-go"), written: !!V.el.querySelector(".written .go"),
    hp: p ? p.hp / p.maxHp : 0, x: p ? p.rt.x : 0, reach: p ? p.rt.reach : 0, blocker: !!R.blocker, t: R.t,
    near: near ? { uid: near.uid, x: near.rt.x, d: near.rt.x - p.rt.x } : null, foes: foes.length,
    threat: th.length ? Math.min(...th.map((t) => t.land - R.t)) : null,
    canRoll: RT.can(R, "roll"), canBlock: RT.can(R, "block"), canSkill: RT.can(R, "skill"), canHerbs: RT.can(R, "herbs"), canCall: RT.can(R, "call"),
    astra: RT.astras().some((a) => !a.why), spare: RT.spareable(R).map((u) => u.uid), plea: !!V.el.querySelector(".plea i"),
    friend: R.B.units.some((u) => u.side === "ally" && u.hp > 0 && (u.called || u.person)), soldiers: R.B.units.some((u) => u.side === "ally" && u.hp > 0 && u.plural && !u.person && !u.called),
    held: Object.assign({}, V.held), ax: !!V.ax,
    btn: { l: box('[data-hold="l"]'), r: box('[data-hold="r"]'), block: box('[data-hold="block"]'), strike: box('[data-act="strike"]'), roll: box('[data-act="roll"]'), skill: box('[data-act="skill"]'), aid: box('[data-act="aid"]'), orders: box('[data-act="orders"]'), pause: box('[data-act="pause"]') }
  };
};
async function rtFight(pg, cdp, L, R, o, tap) {
  const t0 = Date.now(), F = { enc: null, out: null, used: [], secs: 0, tries: 0 };
  let holding = null, did = { orders: false, pause: false, call: false, astra: false, spare: false };
  const touchDown = async (pt) => { await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [pt] }); };
  const touchUp = async () => { await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); };
  const KEYOF = { l: "a", r: "d", block: "k" };
  const hold = async (k, pt) => { if (holding === k) return; await release(); holding = k; F.used.push("hold:" + k); if (o.touch) await touchDown(pt); else await pg.keyboard.down(KEYOF[k]); };
  const release = async () => { if (!holding) return; if (o.touch) await touchUp(); else await pg.keyboard.up(KEYOF[holding]); holding = null; };
  const press = async (k, pt, key) => { await release(); if (o.touch && pt) await pg.touchscreen.tap(pt.x, pt.y); else await pg.keyboard.press(key); F.used.push(k); };
  const sheetTap = async (sel) => { await release(); const b = await pg.$("#rt " + sel); if (b) { if (o.touch) await b.tap().catch(() => b.click()); else await b.click(); } };
  while (Date.now() - t0 < 240000) {
    const s = await pg.evaluate(READ_RT);
    if (s.gone) break;
    F.enc = F.enc || s.enc;
    if (s.written) { await release(); F.used.push("written"); await sleep(600); await sheetTap(".written .go"); await sleep(600); continue; }
    if (s.brief) { await sheetTap(".fb-go"); await sleep(500); continue; }
    if (s.tour) { await sheetTap(".tc-skip"); await sleep(500); continue; }
    if (s.sheet === "retry") { F.tries++; await sleep(500); await sheetTap(R() < 0.85 ? "[data-retry]" : "[data-accept]"); await sleep(600); continue; }
    if (s.sheet === "pause" || s.sheet === "confirm") { await sleep(300); await sheetTap(".pause-sheet [data-close]"); await sleep(300); continue; }
    if (s.sheet === "orders" || s.sheet === "aid") { await sheetTap("." + s.sheet + "-sheet [data-resume]"); await sleep(200); continue; }
    if (s.over) { await release(); await sleep(250); continue; }
    if (s.briefing) { await sleep(300); continue; }
    // A blow coming at you: the shield up, or a roll away, just before it lands.
    if (s.threat != null && s.threat < 0.5) {
      if (s.blocker && s.canBlock) { await hold("block", s.btn.block); await sleep(120); continue; }
      if (!s.blocker && s.canRoll && s.threat < 0.25) { await press("roll", s.btn.roll, "k"); await sleep(120); continue; }
    }
    if (holding === "block" && (s.threat == null || s.threat < -0.05)) await release();
    if (holding === "block") { await sleep(80); continue; }
    // Once a fight: pause and resume; open Orders and pick another order; call for help; the divine weapon.
    const T = (Date.now() - t0) / 1000;
    if (!did.pause && T > 6) { did.pause = true; F.used.push("pause"); if (o.touch) await press("pause", s.btn.pause); else await pg.keyboard.press("p"); await sleep(500);
      const pz = await pg.evaluate(() => ({ p: K.UI.rtScreen() && K.UI.rtScreen().paused, t: K.UI.rtScreen() && K.UI.rtScreen().R.t })); await sleep(500);
      const pz2 = await pg.evaluate(() => K.UI.rtScreen() && K.UI.rtScreen().R.t);
      if (!pz.p || pz2 !== pz.t) L.bad.push(F.enc + ": Pause did not stop the fight (" + JSON.stringify([pz, pz2]) + ")");
      continue; }
    if (!did.orders && (s.friend || s.soldiers) && T > 3) { did.orders = true; F.used.push("orders"); if (o.touch) await press("orders", s.btn.orders); else await pg.keyboard.press("o"); await sleep(500);
      const opts = await pg.$$("#rt .orders-sheet .sec.on [data-so], #rt .orders-sheet .sec.on [data-fr]"); if (opts.length) { const b = opts[Math.floor(R() * opts.length)]; await (o.touch ? b.tap() : b.click()).catch(() => {}); F.used.push("order:" + (await b.evaluate((x) => x.dataset.so || x.dataset.fr))); }
      continue; }
    if (!did.call && s.canCall && s.hp < 0.7 && R() < 0.5) { did.call = true; await sheetAid(pg, o, "call", s, F); continue; }
    if (!did.astra && s.astra && T > 4 && R() < 0.4) { did.astra = true; await sheetAid(pg, o, "astra", s, F); await sleep(2500); continue; }
    if (s.canHerbs && s.hp < 0.35) { await sheetAid(pg, o, "herbs", s, F); continue; }
    // A foe kneeling and asking: spare him, sometimes.
    if (s.spare.length && !did.spare && R() < 0.5) { did.spare = true; F.used.push("spare"); if (o.touch) { const t = await pg.$("#rt .plea i"); if (t) await t.tap().catch(() => {}); else await pg.keyboard.press("e"); } else await pg.keyboard.press("e"); await sleep(300); continue; }
    if (s.canSkill && R() < 0.15) { await press("skill", s.btn.skill, "l"); await sleep(250); continue; }
    if (!s.near) { await release(); await sleep(200); continue; }
    const d = s.near.d, ad = Math.abs(d);
    if (ad <= s.reach * 0.92 || s.foes && ad < 0.06) {
      await release();
      if (!o.touch && R() < 0.3) { // a click on the foe
        const pt = await pg.evaluate((uid) => { const a = K.UI.rtScreen().actors.get(uid); if (!a) return null; const b = a.el.querySelector(".pp-body") || a.el; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.4 }; }, s.near.uid);
        if (pt) { await pg.mouse.click(pt.x, pt.y); F.used.push("click"); await sleep(260 + R() * 200); continue; }
      }
      await press("strike", s.btn.strike, "j"); await sleep(220 + R() * 260); continue;
    }
    const k = d > 0 ? "r" : "l";
    await hold(k, s.btn[k]); await sleep(160);
  }
  await release();
  F.secs = Math.round((Date.now() - t0) / 1000);
  if (await pg.evaluate(() => !!K.UI.rtScreen())) {
    L.bad.push("the real-time fight " + F.enc + " did not end in 240 s of play"); await shot(pg, L, "fight-long-" + F.enc);
    await pg.evaluate(() => K.Combat.state().units.forEach((u) => { if (u.side === "enemy") u.hp = 0; }));
    for (let i = 0; i < 30 && (await pg.evaluate(() => !!K.UI.rtScreen())); i++) { await sleep(300); const w = await pg.$("#rt .written .go, #rt [data-accept]"); if (w) await w.click().catch(() => {}); }
  }
  F.out = await outOf(pg, F.enc);
  L.fights.push(F);
}
async function sheetAid(pg, o, what, s, F) {
  const KEY = { herbs: "h", call: "c", astra: "u" };
  if (!o.touch && Math.random() < 0.5) { await pg.keyboard.press(KEY[what]); F.used.push(what + "(key)"); return; }
  if (o.touch) await pg.touchscreen.tap(s.btn.aid.x, s.btn.aid.y); else await pg.mouse.click(s.btn.aid.x, s.btn.aid.y);
  await sleep(350);
  const b = await pg.$('#rt .aid-sheet [data-aid="' + what + '"]:not([disabled])');
  if (b) { await (o.touch ? b.tap() : b.click()).catch(() => {}); F.used.push(what); } else { await pg.evaluate(() => { const r = document.querySelector("#rt .aid-sheet [data-resume]"); if (r) r.click(); }); F.used.push(what + "(not offered)"); }
  await sleep(300);
}

// The outcome a fight handed back to the story (recorded by watch(), which only listens).
const outOf = (pg, enc) => pg.evaluate((enc) => { const f = (window.__fights || []).filter((x) => x[0] === enc).slice(-1)[0]; return f ? f[1] : "?"; }, enc);
async function watch(pg) {
  await pg.evaluate(() => { if (K.UI.__watched) return; K.UI.__watched = true; const f = K.UI.startBattle; K.UI.startBattle = function (id, cb) { return f.call(this, id, function (out) { (window.__fights = window.__fights || []).push([id, out]); return cb.apply(this, arguments); }); }; });
}

// ---------- A war day, through its cards ----------
async function warDay(pg, cdp, L, R, o, tap) {
  const t0 = Date.now(), F = { enc: await pg.evaluate(() => K.UI.warScreen() && K.UI.warScreen().B.enc.id), out: null, used: [], war: true };
  let company = false, rounds = 0;
  const tp = async (sel) => { const b = await pg.$("#rt " + sel); if (!b) return false; await (o.touch ? b.tap() : b.click()).catch(() => {}); return true; };
  while (Date.now() - t0 < 300000) {
    const s = await pg.evaluate(() => { const V = K.UI.warScreen(); if (!V) return { gone: true }; return { over: !!V.over, end: !!document.querySelector("#rt .endcard button"), brief: !!document.querySelector("#rt .fb-go"), tour: !!document.querySelector("#rt .tc-skip"), place: [...document.querySelectorAll("#rt [data-place]")].filter((b) => b.offsetParent !== null).length, read: !!document.querySelector("#rt .wd-read [data-rd]"), moves: [...document.querySelectorAll("#wd-moves [data-move]:not([disabled])")].map((b) => b.dataset.move), foes: [...document.querySelectorAll("#rt .foe-tap:not([hidden])")].length, sheet: V.sheet || null, round: V.B.round, company: !!document.querySelector('#rt [data-wact="company"]'), written: !!document.querySelector("#rt .written .go") }; });
    if (s.gone) break;
    if (s.end) { await sleep(800); await tp(".endcard button"); await sleep(800); continue; }
    if (s.written) { await tp(".written .go"); await sleep(600); continue; }
    if (s.brief) { await tp(".fb-go"); await sleep(500); continue; }
    if (s.tour) { await tp(".tc-skip"); await sleep(500); continue; }
    if (s.place) { const all = await pg.$$("#rt [data-place]"); const b = all[Math.floor(R() * all.length)]; await (o.touch ? b.tap() : b.click()).catch(() => {}); F.used.push("place"); await sleep(600); continue; }
    if (s.sheet) { if (!(await tp(".sheet:not([hidden]) [data-resume], .sheet:not([hidden]) [data-close]"))) await tp(s.sheet === "company" ? '[data-wact="company"]' : '[data-wact="aid"]'); await sleep(300); continue; }
    if (s.read) { await sleep(900 + R() * 300); const opts = await pg.$$("#rt .wd-read [data-rd]"); const b = opts[R() < 0.6 ? 3 : Math.floor(R() * opts.length)]; if (b) await (o.touch ? b.tap() : b.click()).catch(() => {}); F.used.push("read"); await sleep(700); continue; }
    if (!company && s.company && s.round >= 2) { company = true; F.used.push("company"); await tp('[data-wact="company"]'); await sleep(500);
      const os = await pg.$$("#rt .company-sheet [data-ord][aria-pressed=false]"); if (os.length) { const b = os[Math.floor(R() * os.length)]; await (o.touch ? b.tap() : b.click()).catch(() => {}); F.used.push("order:" + (await b.evaluate((x) => x.dataset.ord))); }
      await sleep(300); if (await pg.evaluate(() => K.UI.warScreen() && K.UI.warScreen().sheet)) await tp('[data-wact="company"]'); await sleep(300); continue; }
    if (s.moves.length) {
      const m = R() < 0.6 && s.moves.includes("strike") ? "strike" : s.moves[Math.floor(R() * s.moves.length)];
      await tp('#wd-moves [data-move="' + m + '"]'); F.used.push(m); await sleep(350);
      if (await pg.$("#rt .foe-tap:not([hidden])")) { const fs_ = await pg.$$("#rt .foe-tap:not([hidden])"); const b = fs_[Math.floor(R() * fs_.length)]; await (o.touch ? b.tap() : b.click()).catch(() => {}); }
      rounds++; await sleep(900); continue;
    }
    await sleep(400);
  }
  if (await pg.evaluate(() => !!K.UI.warScreen())) { L.bad.push("the war day " + F.enc + " did not end in 300 s of play"); await shot(pg, L, "war-long-" + F.enc); }
  F.out = await outOf(pg, F.enc); F.rounds = rounds;
  L.fights.push(F);
}

module.exports = { rtFight, warDay, trial, walk, watch, READ_RT, LOOK, rng };
