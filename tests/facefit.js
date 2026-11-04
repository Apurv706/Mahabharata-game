/* Nothing held covers a face (owner, 4 November). Out of a fight (story pages, scene headers, moments, the tests' casts,
   the character sheet, endings) every figure stands at rest: a mace, a club or a hammer held low with its head on the
   ground, a sword or a dagger point down at the hip, a spear or a staff upright beside the body, a bow upright at the side,
   a shield low on the back arm. For every figure (each of K.PUPPETS, you on each path) in each pose a figure takes at
   rest, drawn as on a phone, both still (the CSS poses) and live (puppet-anim.js rigs at rest), the box of what is held
   must not overlap the head's box by more than a few pixels. Fights keep their own poses (not checked here).
   Usage: node tests/facefit.js [--shots DIR]   (needs Playwright) */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
let pw; try { pw = require("playwright"); } catch (e) { try { pw = require("/usr/local/lib/node_modules_global/playwright"); } catch (e2) { console.error("Playwright is not installed"); process.exit(2); } }
const ROOT = path.join(__dirname, "..", "game");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".json": "application/json" };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); if (f.endsWith("/")) f += "index.html"; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); r.end(d); }); });
srv.listen(0, async () => {
  const b = await pw.chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
  await pg.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  await pg.goto("http://localhost:" + srv.address().port + "/index.html"); await pg.waitForTimeout(400);
  const res = await pg.evaluate(async () => {
    const U = K.UI, POSES = ["stand", "walk", "slump", "side", "speak", "think"], TOL = 3;
    const specs = [];
    for (const id of Object.keys(K.PUPPETS)) specs.push([id, U.puppetFor(id)]);
    for (const p of Object.keys(K.PATHS)) { const S = Object.assign(K.newLife(), { name: "T", age: 30, act: 5, path: p, origin: "panchala" }); specs.push(["you (" + p + ")", K.puppetSpec(S)]); }
    const host = document.createElement("div"); host.style.cssText = "position:fixed;left:0;top:0;width:393px;height:400px;background:#fff;z-index:99999"; document.body.appendChild(host);
    const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width || r.height ? r : null; };
    const over = (a, c) => Math.min(Math.max(0, Math.min(a.right, c.right) - Math.max(a.left, c.left)), Math.max(0, Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top)));
    const bad = [], seen = { n: 0 };
    const measure = (who, pose, svg) => {
      const head = box(svg.querySelector(".pp-body .head") || svg.querySelector(".head")); if (!head) return;
      for (const [what, sel] of [["weapon", ".pp-body .it"], ["shield", ".pp-body .it-s"]]) {
        const it = box(svg.querySelector(sel)); if (!it) continue; seen.n++;
        const o = over(head, it); if (o > TOL) bad.push(who + " · " + pose + ": the " + what + " (" + (svg.querySelector(sel).dataset.k || what) + ") covers the head by " + Math.round(o) + " px");
      }
    };
    for (const [who, spec] of specs) {
      if (!spec || !spec.item && !(spec.gear || []).some((g) => g === "shield" || g === "buckler")) continue;
      for (const pose of POSES) {
        host.innerHTML = U.puppet(spec, { h: 160, pose }); await new Promise((r) => setTimeout(r, 0));
        const svg = host.querySelector("svg"); svg.querySelectorAll("*").forEach((e) => { e.style.transition = "none"; });
        measure(who, pose, svg);
      }
      // Live, at rest: as a scene's figure stands (its rig's base: its stance, or "stand").
      if (U.rig) {
        host.innerHTML = '<div class="act">' + U.puppet(spec, { h: 160, pose: "live" }) + "</div>";
        const svg = host.querySelector("svg"), base = svg.dataset.stance || "stand";
        const rig = U.rig(svg, host.firstChild, base); if (rig) { rig.set(base, 900, 0.5, true); measure(who, "live " + base, svg); rig.stop(); }
      }
    }
    host.remove();
    return { bad, n: seen.n };
  });
  for (const x of res.bad) console.log("✗ " + x);
  for (const e of errs) console.log("✗ page error: " + e);
  console.log(res.n + " held things measured against the head; " + res.bad.length + " cover a face");
  await b.close(); srv.close();
  process.exit(res.bad.length || errs.length ? 1 : 0);
});
