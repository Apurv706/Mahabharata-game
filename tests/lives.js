/* Random lives played through the engine alone (no page): every choice through K.choose and every
   fight through K.combatOutcome, as the interface does. Fast (a few thousand lives a minute), so it can
   run in CI. Checks what the page tests cannot reach:
   - a saved life comes back from K.cleanLife unchanged (save codes are cleaned before use);
   - Continue resumes on the scene that was saved (it is never skipped or replaced);
   - no text shows an unfilled {token};
   - nobody fights on both sides of the same battle, and a friend called for help is not already there;
   - nothing throws, and every life ends.
   Usage: node tests/lives.js [lives=400] [seed=1] */
const fs = require("fs");
const path = require("path");
const G = path.join(__dirname, "..", "game");
global.window = global; global.K = {};
const html = fs.readFileSync(path.join(G, "index.html"), "utf8");
for (const src of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]).filter((s) => /js\/(engine|content)\//.test(s))) {
  (0, eval)(fs.readFileSync(path.join(G, src), "utf8") + "\n//# sourceURL=" + src);
}
K.UI = { esc: (s) => s };
(0, eval)(fs.readFileSync(path.join(G, "js/ui/map.js"), "utf8")); // K.locOf, used by the homeland helpers
K.save = () => true;

const N = parseInt(process.argv[2] || "400", 10), SEED = parseInt(process.argv[3] || "1", 10);
const problems = new Map();
const add = (k, v) => { const m = problems.get(k) || new Map(); m.set(v, (m.get(v) || 0) + 1); problems.set(k, m); };
const pick = (a) => a[Math.floor(K.rng() * a.length)];
const TOK = /\{(\w+)(!?)(?::[^}]*)?\}/;
const txt = (s, where) => { if (s == null || s === "") return; let out; try { out = K.text(s); } catch (e) { add("text throws", where + ": " + e.message); return; } if (typeof out === "string" && TOK.test(out)) add("unfilled token", where + ": " + out.slice(0, 120)); };
const blocks = (b, where) => { for (const x of [].concat(K.val(b) || []).filter(Boolean)) { if (typeof x === "string" || Array.isArray(x)) txt(x, where); else if (x.line) txt(x.line, where); else if (x.memory) txt(x.memory, where); else if (x.aside) txt(x.aside, where); } };
const sorted = (v) => (Array.isArray(v) ? v.map(sorted) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sorted(v[k])])) : v);
const same = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
const unitName = (u, S) => { const x = typeof u === "string" && K.UNITS && K.UNITS[u] ? K.UNITS[u](S) : u; return x && (x.person || x.name); };

let lives = 0, ended = 0;
for (let i = 0; i < N; i++) {
  K.seed(SEED * 100003 + i * 7);
  const S = (K.S = K.newLife());
  if (K.momentQueue) K.momentQueue.length = 0;
  S.name = "Ira"; S.pronoun = pick(["she", "he", "they"]);
  S.origin = pick(Object.keys(K.ORIGINS)); S.temperament = pick(Object.keys(K.TEMPERAMENTS)); S.heirloom = pick(Object.keys(K.HEIRLOOMS));
  S.storyMode = K.rng() < 0.15;
  K.apply(K.ORIGINS[S.origin].fx); K.apply(K.TEMPERAMENTS[S.temperament].fx); K.apply(K.HEIRLOOMS[S.heirloom].fx);
  K.apply({ flag: ["origin_" + S.origin, "temper_" + S.temperament, "heir_" + S.heirloom] });
  lives++;
  try { K.go(K.FIRST_SCENE); } catch (e) { add("throws", "start: " + e.message); continue; }
  for (let steps = 0; steps < 700; steps++) {
    const sc = K.SCENES[K.S.scene];
    // Save and Continue at this scene: the cleaned copy is the same life, and it resumes here.
    const saved = JSON.parse(JSON.stringify(K.S));
    let back;
    try { back = K.cleanLife(K.migrate(JSON.parse(JSON.stringify(saved)))); } catch (e) { add("cleanLife throws", sc.id + ": " + e.message); }
    if (back && !same(back, saved)) {
      const diff = Object.keys(saved).filter((k) => JSON.stringify(sorted(saved[k])) !== JSON.stringify(sorted(back[k])));
      add("cleanLife changed a real save", sc.id + ": " + diff.join(",") + (process.env.DBG ? " " + diff.map((k) => JSON.stringify(saved[k]) + " => " + JSON.stringify(back[k])).join(" ; ").slice(0, 300) : ""));
    }
    if (back && K.rng() < 0.08) {
      const live = K.S;
      try { K.resume(back); if (K.S.scene !== sc.id) add("Continue moved to another scene", sc.id + " -> " + K.S.scene); } catch (e) { add("throws", "resume " + sc.id + ": " + e.message); }
      K.S = live;
    }
    if (sc.ending) { try { const e = sc.ending(K.S); (e.telling || []).forEach((l) => txt(l, "telling")); (e.fates || []).forEach((l) => txt(l, "fates")); } catch (e) { add("throws", sc.id + ".ending: " + e.message); } ended++; break; }
    try { blocks(sc.body, sc.id + ".body"); blocks(sc.witness, sc.id + ".witness"); } catch (e) { add("throws", sc.id + ".body: " + e.message); }
    const list = K.choiceList(sc).filter((x) => x.ok);
    if (!list.length) { add("no choice available", sc.id); break; }
    const { c } = pick(list);
    let res;
    try { res = c.game ? K.choose(sc, c, pick(["win", "close", "lose"])) : K.choose(sc, c); } catch (e) { add("throws", sc.id + ":" + c.id + ": " + e.message); break; }
    txt(res.text, sc.id + ":" + c.id + " result");
    try { blocks(res.after, sc.id + ":" + c.id + " after"); } catch (e) { /* not text blocks */ }
    let next = res.next;
    if (res.combat) {
      const enc = K.ENCOUNTERS[res.combat];
      const foes = (K.val(enc.enemies) || []).map((u) => unitName(u, K.S)).filter(Boolean);
      const allies = (K.val(enc.allies) || []).map((u) => unitName(u, K.S)).filter(Boolean);
      for (const a of allies) if (foes.includes(a)) add("fights on both sides", res.combat + ": " + a);
      if (enc.callHelp) { try { const h = enc.callHelp(K.S); const who = h && h.unit && (h.unit.person || h.unit.name); if (who && (foes.includes(who) || allies.includes(who))) add("called friend is already in the fight", res.combat + ": " + who); } catch (e) { add("throws", res.combat + ".callHelp: " + e.message); } }
      let r;
      try { r = K.combatOutcome(res.combat, K.rng() < 0.4 ? "win" : "lose", res.next); } catch (e) { add("throws", res.combat + " outcome: " + e.message); break; }
      txt(r.text, res.combat + " result");
      next = r.next;
    }
    if (!K.S.alive) next = "end_death";
    try { K.go(next); } catch (e) { add("throws", sc.id + ":" + c.id + " -> " + next + ": " + e.message); break; }
  }
}
let bad = 0;
for (const [k, m] of problems) { bad += [...m.values()].reduce((a, b) => a + b, 0); console.log("✗ " + k + " (" + m.size + " kinds)"); [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([v, n]) => console.log("    " + n + "× " + v)); }
console.log(lives + " lives, " + ended + " reached an ending; " + (bad ? bad + " problems" : "no problems"));
process.exit(bad || ended < lives ? 1 : 0);
