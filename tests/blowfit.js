/* Blows that land (owner, 4 November: "keep some space for the weapons to strike each other"): in real time, on an
   iPhone 15 and a 1366x657 laptop, the foes come and fight you and you fight back; at the moment each melee blow lands
   the weapon's tip lies within the body it strikes (the torso), or on the shield or the weapon that meets it when the
   one struck is guarding; and two who fight stand at least 0.8 of the striker's reach apart (no side by side; a
   blow across a row reaches a quarter body less).
   Fights: guards and soldiers with spears (you with a sword), bandits with clubs (you with a mace).
   Usage: node tests/blowfit.js [--shots DIR]   (needs Playwright) */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
let pw; try { pw = require("playwright"); } catch (e) { try { pw = require("/usr/local/lib/node_modules_global/playwright"); } catch (e2) { console.error("Playwright is not installed"); process.exit(2); } }
const ROOT = path.join(__dirname, "..", "game");
const SHOTS = (process.argv.indexOf("--shots") > 0 && process.argv[process.argv.indexOf("--shots") + 1]) || "";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".json": "application/json", ".mp3": "audio/mpeg" };
const DEVICES = [{ name: "iPhone 15", w: 393, h: 852, mobile: true }, { name: "Laptop 1366x657", w: 1366, h: 657, mobile: false }];
const FIGHTS = [{ enc: "e_guard", path: "charioteer" }, { enc: "e_bandits", path: "mace" }];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// In the page: keep you standing, and (phase 2) walk you up to the nearest foe and strike, a foe now and then guarding.
function drive(phase) {
  const V = K.UI.rtScreen(), R = V.R, p = K.Combat.player();
  clearInterval(window.__drv);
  window.__drv = setInterval(() => {
    if (!K.UI.rtScreen() || R.over) return clearInterval(window.__drv);
    p.hp = p.maxHp; V.paused = !!window.__hold && !!window.__held;
    if (phase !== 2 || V.paused) { V.held.l = V.held.r = false; return; }
    const foes = R.B.units.filter((u) => u.side === "enemy" && u.hp > 0 && u.rt && u.rt.entered);
    foes.forEach((u) => { u.hp = Math.max(u.hp, Math.ceil(u.maxHp * 0.5)); }); // the fight goes on for the checks
    const rows = (u) => Math.abs(u.rt.lane - p.rt.lane), reach = (u) => (p.rt.reach - 0.25 * K.RT.BODY * rows(u)) * 0.9;
    const f = foes.sort((a, b) => Math.abs(a.rt.x - p.rt.x) - reach(a) - (Math.abs(b.rt.x - p.rt.x) - reach(b)))[0]; if (!f) return;
    const d = f.rt.x - p.rt.x;
    if (Math.abs(d) <= reach(f)) { V.held.l = V.held.r = false; V.queue.strike = true;
      const fa = V.actors.get(f.uid); if (fa && fa.rig && (window.__guardEvery = (window.__guardEvery || 0) + 1) % 30 === 0) { fa.rig.set("guard", 900, 0.55); setTimeout(() => fa.rig.pose === "guard" && fa.rig.set(fa.base, 520, 0.42), 450); } }
    else { V.held.r = d > 0; V.held.l = d < 0; }
  }, 50);
}
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); if (f.endsWith("/")) f += "index.html"; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); r.end(d); }); });
srv.listen(0, async () => {
  const port = srv.address().port, b = await pw.chromium.launch();
  let fails = 0, n = 0;
  for (const dev of DEVICES) for (const F of FIGHTS) {
    const ctx = await b.newContext({ viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: dev.mobile ? 2 : 1, isMobile: dev.mobile, hasTouch: dev.mobile });
    const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
    await pg.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
    await pg.goto("http://localhost:" + port + "/index.html?rt=1"); await pg.waitForTimeout(400);
    await pg.evaluate((F) => { const S = K.S = Object.assign(K.newLife(), { name: "Ira", pronoun: "she", origin: "panchala", age: 30, act: 6, path: F.path, side: "pandava", teacher: "drona" }); S.attrs.might = 3; S.attrs.grace = 3; S.briefed = ["duel", "melee", "hold", "rounds"]; S.fightTour = 1; K.seed(5); K.UI.startRealtime(F.enc, () => {});
      // Screenshots: hold the screen still at a chosen moment (a blow on the body, a clash, a foe at reach).
      const imp = K.UI.blowImpact; K.UI.blowImpact = function (aim) { const r = imp(aim); if (r && window.__hold && !window.__held && (window.__hold === "body" ? r.on === "body" && r.inside : window.__hold === "clash" ? r.on !== "body" && r.inside : false)) { window.__held = r.on; K.UI.rtScreen().paused = true; K.UI.rigFreeze(1e9); setTimeout(() => document.getAnimations().forEach((a) => a.pause()), 0); } return r; }; }, F);
    await pg.waitForTimeout(100);
    const tag = dev.name + " " + F.enc + " (" + F.path + ")";
    const shot = async (name) => { if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, (dev.name + "_" + F.enc + "_" + name).replace(/\W+/g, "_") + ".png") }); };
    const thaw = () => pg.evaluate(() => { window.__hold = null; window.__held = null; K.UI.rigs.thaw(); document.getAnimations().forEach((a) => a.play()); K.UI.rtScreen().paused = false; });
    const hold = async (kind, ms) => { await pg.evaluate((k) => { window.__hold = k; window.__held = null; }, kind); for (let t = 0; t < ms; t += 50) { if (await pg.evaluate(() => !!window.__held)) { await pg.waitForTimeout(30); await shot(kind); await thaw(); return true; } await sleep(50); } await thaw(); return false; };
    // Phase 1: you stand; the foes come to you and fight.
    await pg.evaluate(drive, 1);
    if (SHOTS) { // a foe at his reach, winding up a blow on you
      for (let t = 0; t < 6000; t += 50) { if (await pg.evaluate(() => { const V = K.UI.rtScreen(), p = K.Combat.player(); return V.R.B.units.some((u) => u.side === "enemy" && u.rt && u.rt.atk && !u.rt.atk.ranged && u.rt.atk.on === p.uid && Math.abs(u.rt.lane - p.rt.lane) < 0.1 && (u.rt.atk.land - V.R.t) < 0.2); })) { await shot("engaged"); break; } await sleep(50); }
      await hold("body", 6000);
    } else await pg.waitForTimeout(6000);
    const t2 = await pg.evaluate(() => K.UI.rtScreen().R.t);
    // Phase 2: you walk up to the nearest foe and strike; now and then he guards.
    await pg.evaluate(drive, 2);
    if (SHOTS) { await hold("clash", 7000); await hold("body", 2500); } else await pg.waitForTimeout(7000);
    const res = await pg.evaluate((t2) => {
      const V = K.UI.rtScreen(), out = [], p = K.Combat.player(), list = V.impacts || [];
      clearInterval(window.__drv);
      let body = 0, clash = 0, mine = 0, minRatio = 9;
      for (const m of list) {
        const who = m.by + "→" + m.on + " at " + m.t.toFixed(1) + "s";
        if (!m.res) { out.push("a blow without a measured contact: " + who); continue; }
        if (!m.res.inside) out.push("the tip missed the " + m.res.on + " (" + who + "): tip " + Math.round(m.res.x) + "," + Math.round(m.res.y) + " box " + [m.res.box.l, m.res.box.r, m.res.box.t, m.res.box.b].map(Math.round).join(","));
        if (m.guard && m.res.on === "body") out.push("a guarded blow fell on the body (" + who + ")");
        if (m.res.on === "body") body++; else clash++;
        if (m.by === p.uid) mine++;
        // Two who fight: at least 0.8 of the striker's reach apart (less a quarter body for each row between): the foe coming to you, you walking up to him.
        const engaged = m.by === p.uid || (m.on === p.uid && m.t < t2);
        if (engaged && m.apart != null && m.reach) { m.reach -= 0.25 * K.RT.BODY * m.rows; minRatio = Math.min(minRatio, m.apart / m.reach); if (m.apart < 0.8 * m.reach - 1e-6) out.push("side by side: " + who + " " + (m.apart / m.reach).toFixed(2) + " of the reach apart"); }
      }
      if (body < 2) out.push("too few blows on the body (" + body + ")");
      if (clash < 1) out.push("no blow met a shield or a weapon");
      if (mine < 2) out.push("too few of your blows landed (" + mine + ")");
      return { problems: out, body, clash, mine, n: list.length, minRatio: minRatio === 9 ? null : +minRatio.toFixed(2) };
    }, t2);
    const probs = res.problems.concat(errs.map((e) => "script error: " + e));
    n++; if (probs.length) fails++;
    console.log((probs.length ? "✗ " : "ok ") + tag + ": " + res.n + " blows (" + res.body + " on the body, " + res.clash + " on a shield or a weapon, " + res.mine + " yours), closest " + res.minRatio + " of the reach" + (probs.length ? "\n    " + probs.join("\n    ") : ""));
    await ctx.close();
  }
  console.log((n - fails) + "/" + n + " fights land their blows");
  await b.close(); srv.close(); process.exit(fails ? 1 : 0);
});
