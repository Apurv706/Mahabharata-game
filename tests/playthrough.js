/* Automated playthroughs (Project Plan §6.3, "automated tests for branching").
   Plays N random lives through the real UI in a headless DOM and reports
   crashes, dead ends, content problems and the spread of endings.
   Usage: npm install && npm test            (default 300 lives)
          node tests/playthrough.js 1000 --story */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const N = parseInt(process.argv[2] || "300", 10);
const STORY = process.argv.includes("--story");
const GAME = path.join(__dirname, "..", "game");
const html = fs.readFileSync(path.join(GAME, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);

function boot(seed) {
  const vc = new VirtualConsole();
  const jsErrors = [];
  vc.on("jsdomError", (e) => jsErrors.push(e.detail && e.detail.stack ? e.detail.stack : String(e.message || e)));
  const dom = new JSDOM(html.replace(/<script src="[^"]+"><\/script>/g, ""), { runScripts: "outside-only", pretendToBeVisual: true, url: "https://localhost/", virtualConsole: vc });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  let s = seed >>> 0;
  w.Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const errors = [];
  w.console.warn = (m) => errors.push("warn: " + m);
  for (const src of scripts) w.eval(fs.readFileSync(path.join(GAME, src), "utf8"));
  w.K.seed(seed);
  return { w, d: w.document, errors, jsErrors };
}

function rnd(w, arr) { return arr[Math.floor(w.Math.random() * arr.length)]; }

function playLife(seed) {
  const { w, d, errors, jsErrors } = boot(seed);
  const K = w.K;
  const problems = K.validate();
  // Create a character through the real creation screen.
  d.getElementById("btn-new").click();
  const pickOpt = (sel) => rnd(w, [...d.querySelectorAll(sel)]).click();
  pickOpt("#pron .opt"); pickOpt("#origins .origin"); pickOpt("#temps .opt"); pickOpt("#heirs .opt");
  if (STORY) { const s = d.getElementById("story"); s.checked = true; s.dispatchEvent(new w.Event("change")); }
  d.getElementById("begin").click();

  const path_ = [];
  const fights = [];
  K.on("combat", (B) => { if (B.over && !B._counted) { B._counted = true; fights.push([B.enc.id, B.over]); } });
  for (let step = 0; step < 4000; step++) {
    if (d.getElementById("again")) return { fights, ending: K.S.ending, alive: K.S.alive, age: K.S.age, path: path_, errors, problems, side: K.S.side, steps: step };
    const acts = [...d.querySelectorAll("#battle-actions .act:not([disabled])")];
    const cta = [...d.querySelectorAll("#leaf .cta")].filter((b) => !b.disabled);
    const choices = [...d.querySelectorAll("#choices .choice:not([disabled])")].filter((b) => !b.querySelector(".k").textContent.includes("✓"));
    if (jsErrors.length) return { crash: jsErrors[0], scene: K.S.scene, path: path_, errors, problems };
    try {
      if (acts.length) {
        // A sensible-ish player: specials when ready, herbs when hurt, otherwise strike.
        const p = K.Combat.player();
        const herbs = acts.find((a) => a.textContent.includes("Healing herbs"));
        const special = acts.filter((a) => a.classList.contains("special"));
        const choice = p && p.hp < p.maxHp * 0.35 && herbs ? herbs : special.length && w.Math.random() < 0.6 ? rnd(w, special) : acts[0];
        choice.click();
      } else if (choices.length) {
        const c = rnd(w, choices);
        path_.push(K.S.scene + ":" + c.id.replace("choice-", ""));
        c.click();
      } else if (cta.length) {
        cta[0].click();
      } else {
        return { stuck: true, scene: K.S.scene, html: d.getElementById("leaf").innerHTML.slice(0, 400), path: path_, errors, problems };
      }
    } catch (e) {
      return { crash: e.stack || String(e), scene: K.S.scene, path: path_, errors, problems };
    }
  }
  return { stuck: true, scene: K.S.scene, reason: "step limit", path: path_, errors, problems };
}

const results = [];
for (let i = 1; i <= N; i++) results.push(playLife(i * 7919));
const crashes = results.filter((r) => r.crash);
const stuck = results.filter((r) => r.stuck);
const ends = {};
const sides = {};
results.filter((r) => r.ending).forEach((r) => { ends[r.ending] = (ends[r.ending] || 0) + 1; sides[r.side || "none"] = (sides[r.side || "none"] || 0) + 1; });
const warn = new Set(results.flatMap((r) => r.errors || []));
const problems = results[0] && results[0].problems || [];

console.log("Lives played:     " + N + (STORY ? " (story mode)" : ""));
console.log("Reached an end:   " + results.filter((r) => r.ending).length);
console.log("Crashes:          " + crashes.length);
console.log("Stuck:            " + stuck.length);
console.log("Content problems: " + problems.length);
problems.slice(0, 20).forEach((p) => console.log("  - " + p));
console.log("Endings:");
Object.entries(ends).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log("  " + k.padEnd(28) + String(v).padStart(4) + "  " + Math.round((v / N) * 100) + "%"));
console.log("Sides in the war: " + JSON.stringify(sides));
const fstat = {};
results.forEach((r) => (r.fights || []).forEach(([id, o]) => { fstat[id] = fstat[id] || { win: 0, lose: 0, flee: 0, spare: 0 }; fstat[id][o]++; }));
console.log("Battles (win / lose / flee / spare):");
Object.entries(fstat).forEach(([id, f]) => console.log("  " + id.padEnd(14) + [f.win, f.lose, f.flee, f.spare].join(" / ")));
const deaths = results.filter((r) => r.ending && !r.alive);
console.log("Died in the war:  " + deaths.length);
if (warn.size) { console.log("Warnings:"); [...warn].slice(0, 10).forEach((x) => console.log("  " + x.slice(0, 300))); }
crashes.slice(0, 3).forEach((c) => console.log("\nCRASH at " + c.scene + "\n" + c.crash.split("\n").slice(0, 6).join("\n") + "\npath: " + c.path.slice(-5).join(" > ")));
stuck.slice(0, 3).forEach((c) => console.log("\nSTUCK at " + c.scene + " " + (c.reason || "") + "\n" + (c.html || "") + "\npath: " + c.path.slice(-5).join(" > ")));
process.exit(crashes.length || stuck.length || problems.length ? 1 : 0);
