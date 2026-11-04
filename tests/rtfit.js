/* Screen-fit checks for the real-time dev screen (ui/realtime.js, PRD §18.15), after the layout page's tools/fit.js:
   at rest no two figures overlap more than a quarter of their visible width (body and shield); no figure within
   6 px of the stage's edge; the front row's figure 24-40% of the stage high; Orders and Aid open over the controls
   at exactly their height, never over a foot or a ground ring, never moving the stage; nothing spills sideways;
   touch targets 44 px on phones. Phones iPhone SE, iPhone 15 and 360x640, a 1366x657 laptop; English and Hindi.
   Usage: node tests/rtfit.js [--shots DIR]   (needs Playwright) */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
let pw; try { pw = require("playwright"); } catch (e) { try { pw = require("/usr/local/lib/node_modules_global/playwright"); } catch (e2) { console.error("Playwright is not installed"); process.exit(2); } }
const ROOT = path.join(__dirname, "..", "game");
const SHOTS = (process.argv.indexOf("--shots") > 0 && process.argv[process.argv.indexOf("--shots") + 1]) || "";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".json": "application/json", ".mp3": "audio/mpeg" };
const DEVICES = [
  { name: "iPhone SE", w: 375, h: 667, mobile: true }, { name: "iPhone 15", w: 393, h: 852, mobile: true },
  { name: "360x640", w: 360, h: 640, mobile: true }, { name: "Laptop 1366x657", w: 1366, h: 657, mobile: false }];
const FIGHTS = ["e_guard", "e_border", "e_bandits"];
function measure(open) {
  const V = K.UI.rtScreen(), st = V.stage, sr = st.getBoundingClientRect(), out = [];
  const R = (e) => e.getBoundingClientRect();
  const inter = (a, b, pad = 0) => a.left < b.right - pad && b.left < a.right - pad && a.top < b.bottom - pad && b.top < a.bottom - pad;
  // Visible width: the body and a shield, about 0.42 of a figure's height, centred on its feet (the layout page
  // measures 0.36 for the body core on the real-time screen and 0.5 with the spear hand on the war day).
  const figs = [...V.actors.values()].filter((a) => a.u.hp > 0).map((a) => {
    const body = R(a.svg.querySelector(".pp-body")), x = sr.left + a.x, hw = a.fh * 0.21;
    return { id: a.u.uid, d: a.d, l: x - hw, r: x + hw, t: sr.bottom - a.gy - a.fh, b: sr.bottom - a.gy, h: a.fh, bodyH: body.height };
  });
  for (let i = 0; i < figs.length; i++) for (let k = i + 1; k < figs.length; k++) {
    const p = figs[i], q = figs[k], ov = Math.min(p.r, q.r) - Math.max(p.l, q.l), vy = Math.min(p.b, q.b) - Math.max(p.t, q.t);
    const w = Math.min(p.r - p.l, q.r - q.l);
    if (vy > 0 && ov > 0.25 * w + 0.5) out.push("figures overlap " + p.id + "/" + q.id + " " + Math.round(ov / w * 100) + "%");
  }
  for (const f of figs) if (f.l < sr.left + 6 || f.r > sr.right - 6) out.push("figure within 6 px of the stage edge: " + f.id);
  const me = figs.find((f) => f.id === "p");
  const ratio = me ? me.bodyH / (1 - 0.12 * me.d) / sr.height : 0;
  if (ratio < 0.24 || ratio > 0.4) out.push("your figure " + Math.round(ratio * 100) + "% of the stage height");
  if (document.documentElement.scrollWidth > innerWidth) out.push("sideways scroll");
  if (open) {
    const panel = V.el.querySelector("." + open + "-sheet"), ctl = V.el.querySelector(".ctl"), pr = R(panel);
    if (innerWidth < 820 && ctl && getComputedStyle(ctl).display !== "none") { const cr = R(ctl); if (Math.abs(pr.top - cr.top) > 1 || Math.abs(pr.height - cr.height) > 1) out.push(open + " menu not at the controls' height (" + Math.round(pr.height) + " vs " + Math.round(cr.height) + ")"); }
    for (const f of figs) if (inter(pr, { left: f.l, right: f.r, top: f.b - f.h * 0.16, bottom: f.b + 4 })) out.push(open + " menu covers the feet of " + f.id);
    for (const g of V.world.querySelectorAll(".mark:not(.lane)")) if (inter(pr, R(g))) out.push(open + " menu covers a ground ring");
    if (Math.abs(R(st).top - V.stageTop) > 0.5) out.push(open + " menu moved the stage");
    if (!panel.querySelector(".flame")) out.push(open + " menu without its diya");
    if (panel.scrollHeight > panel.clientHeight + 1) out.push(open + " menu content does not fit");
  }
  if (innerWidth < 820) for (const b of V.el.querySelectorAll(".ctl button, .hud button")) { const r = R(b); if (r.width && (r.width < 43.5 || r.height < 43.5)) out.push("touch target under 44 px: " + (b.className || b.dataset.act)); }
  return { problems: out, ratio: Math.round(ratio * 100) };
}
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); if (f.endsWith("/")) f += "index.html"; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); r.end(d); }); });
srv.listen(0, async () => {
  const port = srv.address().port, b = await pw.chromium.launch();
  let fails = 0, n = 0;
  for (const dev of DEVICES) for (const lang of ["en", "hi"]) for (const enc of FIGHTS) {
    const ctx = await b.newContext({ viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: dev.mobile ? 2 : 1, isMobile: dev.mobile, hasTouch: dev.mobile });
    const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
    await pg.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
    await pg.goto("http://localhost:" + port + "/index.html?rt=1"); await pg.waitForTimeout(500);
    if (lang === "hi") { await pg.evaluate(() => new Promise((r) => K.UI.setLang("hi", r))); await pg.waitForTimeout(300); }
    await pg.evaluate((enc) => { const S = K.S = Object.assign(K.newLife(), { name: "Ira", pronoun: "she", origin: "panchala", age: 30, act: 6, path: "archer", side: "pandava", teacher: "drona" }); S.attrs.might = 3; S.attrs.grace = 3; S.items.herbs = 2; S.flags.push("role_front"); S.friend = "charu"; S.bonds.charu = 8; K.seed(3); K.UI.startRealtime(enc, () => {}); }, enc);
    await pg.waitForTimeout(150); // at rest: the fight just begun
    await pg.evaluate(() => { const V = K.UI.rtScreen(); V.paused = true; V.stageTop = V.stage.getBoundingClientRect().top; });
    const tag = dev.name + " " + lang + " " + enc, res = [];
    res.push(await pg.evaluate(measure, null));
    if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, (dev.name + "_" + lang + "_" + enc).replace(/\W+/g, "_") + ".png") });
    for (const open of ["orders", "aid"]) {
      await pg.evaluate((o) => { document.querySelector('#rt [data-act="' + o + '"]').click(); }, open); await pg.waitForTimeout(250);
      res.push(await pg.evaluate(measure, open));
      if (SHOTS && enc === "e_border") await pg.screenshot({ path: path.join(SHOTS, (dev.name + "_" + lang + "_" + enc + "_" + open).replace(/\W+/g, "_") + ".png") });
      await pg.keyboard.press("Escape").catch(() => {}); await pg.evaluate(() => { const V = K.UI.rtScreen(); V.el.querySelectorAll(".sheet").forEach((s) => (s.hidden = true)); V.sheet = null; V.paused = true; });
    }
    const probs = [...new Set(res.flatMap((r) => r.problems).concat(errs.map((e) => "script error: " + e)))];
    n++; if (probs.length) fails++;
    console.log((probs.length ? "✗ " : "ok ") + tag + " (figure " + res[0].ratio + "%)" + (probs.length ? "\n    " + probs.join("\n    ") : ""));
    await ctx.close();
  }
  console.log((n - fails) + "/" + n + " screens fit");
  await b.close(); srv.close(); process.exit(fails ? 1 : 0);
});
