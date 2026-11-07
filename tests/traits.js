/* Build D (feedback rows 48-50, Fight_Traits_Draft.md): the fight traits, checked on the engine.
   Stage 1: the swing lock (no Block, Roll or parry until a swing ends), the dagger's five blows, foes open after their
   swing by weapon, shields that crack and break by the striker's tier and weapon, strength through the shield, and the
   clash's Strike lock after Shield wall or Guard.
   Usage: node tests/traits.js [--case id,id] [--json FILE]. Exits 1 when a check fails. */
"use strict";
const fs = require("fs");
const H = require("./lib/harness");
const { arg } = H;

const K = H.engine({});
K.lang = "en";
const RT = K.RT, C = K.Combat;
const CASES = [];
const check = (id, what, fn) => CASES.push({ id, what, fn });

const life = (o) => {
  const S = (K.S = Object.assign(K.newLife(), { name: "T", pronoun: "she", origin: "panchala", age: 30, act: 6, path: "mace", side: "pandava", teacher: "drona" }, o || {}));
  S.attrs.might = 5; S.attrs.grace = 4; S.items.herbs = 2;
  if (K.momentQueue) K.momentQueue.length = 0;
  return S;
};
const fight = (enc, o, opts) => {
  RT.force = true; K.seed((opts && opts.seed) || 7); life(o);
  if (C.state()) { try { C.settle("win"); } catch (e) { /* over */ } C.end(); }
  const B = C.start(enc, null);
  if (opts && opts.before) opts.before(B);
  const R = RT.begin(B, opts || {});
  return { B, R, p: C.player() };
};
const close = () => { try { if (C.state() && !C.state().over) C.settle("win"); C.end(); } catch (e) { /* over */ } };
const steps = (R, n, act) => { for (let i = 0; i < n && !R.over; i++) RT.step(R, typeof act === "function" ? act(i) : act || {}); };

// ---------- The swing lock ----------
for (const [path, weapon] of [["mace", "mace"], ["charioteer", "sword"], ["spy", "dagger"], ["archer", "bow"]]) {
  check("lock-" + weapon, "with the " + weapon + ", no Block, Roll or parry from the press until the swing has ended, and both back after it", () => {
    const F = fight("e_bandits", { path }), { R, p } = F, bad = [];
    steps(R, 90); // the foes walk in
    const len = RT.nextBlow(R).len, defend = R.blocker ? "block" : "roll";
    // put a foe in reach, so the blow is a blow
    const f = R.B.units.find((u) => u.side === "enemy" && u.hp > 0); if (f) { f.rt.entered = true; f.rt.x = p.rt.x + p.rt.face * p.rt.reach * 0.8; f.rt.atk = null; f.rt.cool = 9; }
    RT.step(R, { strike: true });
    if (!RT.swinging()) bad.push("Strike pressed, but no swing began");
    if (RT.can(R, defend)) bad.push(defend + " allowed right after the press");
    steps(R, Math.floor((len - 0.05) * 60));
    if (RT.can(R, defend)) bad.push(defend + " allowed " + (len - 0.05).toFixed(2) + " s into a " + len + " s swing");
    steps(R, 12);
    if (!RT.can(R, defend) && R.breath >= RT.P.rollMin && R.kneel <= 0) bad.push(defend + " still not allowed after the swing ended");
    close(); return bad;
  });
}
check("no-parry-mid-swing", "a lit blade coming down while your own blow is in the air cannot be parried", () => {
  const F = fight("e_bandits", { path: "charioteer" }), { R, p } = F, bad = [];
  steps(R, 90);
  const f = R.B.units.find((u) => u.side === "enemy" && u.hp > 0);
  f.rt.entered = true; f.rt.lane = p.rt.lane; f.rt.x = p.rt.x + p.rt.face * p.rt.reach * 0.9; f.rt.face = -p.rt.face; f.rt.cool = 9;
  RT.step(R, { strike: true }); // your swing begins
  f.rt.atk = { id: "strike", on: p.uid, t0: R.t, land: R.t + 0.1, ranged: false, area: false, lane: p.rt.x, locked: false, heavy: false };
  const before = R.stats.parries; RT.step(R, { strike: true });
  if (R.stats.parries !== before) bad.push("parried while swinging");
  close(); return bad;
});

// ---------- The dagger ----------
check("dagger-five", "the dagger strikes four quick blows and a heavy fifth that knocks back; the sword and mace keep theirs", () => {
  const bad = [];
  let F = fight("e_bandits", { path: "spy" });
  const list = RT.comboOf(F.R);
  if (list.length !== 5) bad.push("the dagger's combo has " + list.length + " blows");
  else {
    if (list.slice(0, 4).some((c) => c.len > 0.25 || c.heavy)) bad.push("the first four are not quick and light");
    if (!list[4].heavy || !list[4].knock) bad.push("the fifth is not heavy, or does not knock back");
    const w = list.reduce((a, c) => a + c.m, 0) / list.reduce((a, c) => a + c.len, 0);
    if (w < 1.6 || w > 2.2) bad.push("the dagger's weight a second is " + w.toFixed(2) + " (the sword's is 1.76)");
  }
  close();
  F = fight("e_bandits", { path: "charioteer" }); if (RT.comboOf(F.R).length !== 3) bad.push("the sword's combo changed"); close();
  F = fight("e_bandits", { path: "mace" }); if (RT.comboOf(F.R).length !== 2) bad.push("the mace's combo changed"); close();
  return bad;
});

// ---------- Foes open after their swing ----------
check("foe-open", "after his swing a foe stands open by weapon (mace longest, dagger shortest): no shield raised and no parry until it passes", () => {
  const bad = [];
  if (!(RT.OPEN.mace > RT.OPEN.sword && RT.OPEN.sword > RT.OPEN.dagger)) bad.push("the openings are not mace > sword > dagger: " + JSON.stringify(RT.OPEN));
  const F = fight("e_bandits", { path: "mace" }), { R, p } = F;
  steps(R, 90);
  const f = R.B.units.find((u) => u.side === "enemy" && u.hp > 0);
  f.rt.entered = true; f.rt.lane = p.rt.lane; f.rt.x = p.rt.x + p.rt.face * p.rt.reach * 0.9; f.rt.face = -p.rt.face;
  f.rt.atk = { id: "strike", on: p.uid, t0: R.t, land: R.t + STEP(), ranged: false, area: false, lane: p.rt.x, locked: false, heavy: false };
  RT.step(R, {});
  const open = RT.OPEN[f.rt.weapon];
  if (f.rt.atk) bad.push("his blow did not land");
  else if (!(f.rt.openUntil > R.t + open - 0.05)) bad.push("no opening after his blow (" + f.rt.weapon + ")");
  close(); return bad;
});
function STEP() { return RT.STEP; }

// ---------- Shields ----------
// Blows caught on your raised shield until it breaks, from one foe.
function blowsToBreak(enc, who, path, seed) {
  const F = fight(enc, { path }, { seed }), { R, B, p } = F;
  const foe = B.units.find((u) => u.side === "enemy" && who(u));
  B.units.filter((u) => u.side === "enemy" && u !== foe).forEach((u) => { u.hp = 0; });
  B.units.filter((u) => u.side === "ally").forEach((u) => { u.still = true; });
  foe.rt.entered = true; foe.rt.wave = 0; foe.rt.x = Math.min(0.9, p.rt.x + 0.2);
  let caught = 0, n = 0;
  const seen = new Set();
  while (!R.over && n++ < 60 * 300) {
    p.hp = p.maxHp; R.breath = RT.P.breathMax; R.winded = false; foe.hp = foe.maxHp; // only the shield wears down
    const before = R.stats.blocked;
    RT.step(R, { block: true });
    if (R.stats.blocked > before) caught++;
    if (R.spOff > 0) break;
    if (foe.rt.atk && !seen.has(foe.rt.atk.t0)) seen.add(foe.rt.atk.t0);
  }
  const out = { caught, broken: R.spOff > 0, tier: RT.tierOf(foe), weapon: foe.rt.weapon };
  close(); return out;
}
check("shield-bhima", "Bhima's mace breaks your raised shield in 4 or 5 blows (the owner's ask, row 49)", () => {
  const bad = [];
  for (const seed of [3, 7, 11, 19]) {
    const r = blowsToBreak("hold_bhima", (u) => u.person === "bhima", "mace", seed);
    if (r.tier !== 3) bad.push("Bhima is tier " + r.tier);
    if (!r.broken) bad.push("seed " + seed + ": not broken after " + r.caught + " blows");
    else if (r.caught < 4 || r.caught > 5) bad.push("seed " + seed + ": broken after " + r.caught + " blows");
  }
  return bad;
});
check("shield-tiers", "points off a shield by tier and weapon: a soldier's mace about 10 blows, a champion's about 5; a soldier's sword never under 15; a dagger, a bow or bare hands never", () => {
  const bad = [], n = (u, w, heavy) => { const h = RT.shieldHit(u, w, heavy); return h > 0 ? Math.ceil(RT.P.shieldPts / h) : Infinity; };
  const soldier = { side: "enemy", name: "A Kaurava soldier" }, champ = { side: "enemy", person: "karna", name: "Karna" }, captain = { side: "enemy", name: "Panchala guard captain" };
  if (n(soldier, "mace") !== 10) bad.push("a soldier's mace: " + n(soldier, "mace"));
  if (n(captain, "mace") < 7 || n(captain, "mace") > 8) bad.push("a captain's mace: " + n(captain, "mace"));
  if (n(champ, "mace") < 5 || n(champ, "mace") > 6) bad.push("a champion's mace: " + n(champ, "mace"));
  if (n(soldier, "sword") < 15) bad.push("a soldier's sword: " + n(soldier, "sword"));
  for (const w of ["dagger", "bow", "fist"]) if (n(champ, w) !== Infinity) bad.push(w + " breaks shields");
  if (RT.tierOf(captain) !== 1 || RT.tierOf(soldier) !== 0 || RT.tierOf(champ) !== 2) bad.push("tiers: soldier " + RT.tierOf(soldier) + ", captain " + RT.tierOf(captain) + ", champion " + RT.tierOf(champ));
  if (RT.tierOf({ side: "enemy", person: "kripa" }) !== 2 || RT.tierOf({ side: "enemy", person: "satyaki" }) !== 2) bad.push("Kripa and Satyaki are not great champions (owner, 10:55)");
  if (RT.tierOf({ side: "ally", person: "charu" }) !== 0) bad.push("Charu is not a soldier");
  return bad;
});
check("shield-yours-back", "your broken shield: Block greyed and roll instead for 10 s, then a fresh shield", () => {
  const F = fight("e_bandits", { path: "mace" }), { R } = F, bad = [];
  steps(R, 30);
  RT.shieldTakes(R, F.p, 99);
  if (!(R.spOff > 0)) bad.push("not broken");
  if (RT.can(R, "block")) bad.push("Block allowed with the shield broken");
  if (!RT.rolls(R)) bad.push("no roll with the shield broken");
  steps(R, Math.ceil(RT.P.shieldBack * 60) + 2, () => { F.p.hp = F.p.maxHp; return {}; });
  if (R.spOff > 0 || R.sp !== RT.P.shieldPts) bad.push("no fresh shield after " + RT.P.shieldBack + " s");
  close(); return bad;
});
check("shield-foe-gone", "a foe's broken shield is gone for the fight: he catches no more blows on it", () => {
  const F = fight("e_bandits", { path: "mace" }, { before: (B) => { B.units.filter((u) => u.side === "enemy").forEach((u) => { u.shield = true; }); } }), { R, B } = F, bad = [];
  const f = B.units.find((u) => u.side === "enemy");
  if (f.sp !== RT.P.shieldPts) bad.push("a shield-bearer's shield has " + f.sp + " points");
  RT.shieldTakes(R, f, 99);
  if (f.shield || f.shieldDrawn || !f.shieldBroken) bad.push("the shield is still his");
  close(); return bad;
});
check("strength-through", "a stronger foe's blow gets more through a raised shield and drains more breath", () => {
  const S = RT.STRENGTH, bad = [];
  for (const k of ["through", "breath", "knock"]) if (!(S[k][0] < S[k][1] && S[k][1] < S[k][2] && S[k][2] <= S[k][3])) bad.push(k + " does not grow with the tier: " + S[k]);
  if (!(S.flinch[0] === 1 && S.flinch[2] === 0)) bad.push("light blows: " + S.flinch);
  return bad;
});

// ---------- The clash's Strike lock ----------
check("strike-lock", "Shield wall or Guard on the turns: in the clash Strike is locked for 4 s with the shield held up, then free", () => {
  const bad = [];
  for (const st of ["wall", "guard", null]) {
    const F = fight("e_bandits", { path: "mace" }, { clash: true, before: (B) => { const p = B.units.find((u) => u.side === "player"); if (st) p.status[st] = 1; } }), { R } = F;
    if (st && Math.abs(R.strikeLock - RT.P.strikeLock) > 1e-6) bad.push(st + ": no lock (" + R.strikeLock + ")");
    if (!st && R.strikeLock) bad.push("a lock with neither move");
    if (st) {
      if (RT.can(R, "strike")) bad.push(st + ": Strike allowed at once");
      RT.step(R, { strike: true });
      if (RT.swinging()) bad.push(st + ": a swing began during the lock");
      if (R.blocker && !R.block) bad.push(st + ": the shield is not held up for you");
      steps(R, Math.ceil(RT.P.strikeLock * 60) + 2, () => { F.p.hp = F.p.maxHp; return {}; });
      if (!RT.can(R, "strike")) bad.push(st + ": Strike still locked after " + RT.P.strikeLock + " s");
    }
    close();
  }
  return bad;
});

// ---------- Run ----------
const only = arg("--case", "") ? new Set(arg("--case").split(",")) : null;
const results = [];
let fail = 0;
for (const c of CASES) {
  if (only && !only.has(c.id)) continue;
  const t = Date.now();
  let bad;
  try { bad = c.fn() || []; } catch (e) { bad = ["threw: " + String(e.stack || e).split("\n").slice(0, 3).join(" | ")]; }
  const ok = !bad.length; if (!ok) fail++;
  console.log((ok ? "ok    " : "FAIL  ") + c.id.padEnd(22) + c.what + "  (" + ((Date.now() - t) / 1000).toFixed(1) + " s)");
  for (const b of bad) console.log("        " + b);
  results.push({ id: c.id, ok, bad });
}
console.log("traits: " + results.length + " checks, " + (results.length - fail) + " pass, " + fail + " fail");
const json = arg("--json", ""); if (json) fs.writeFileSync(json, JSON.stringify({ results }, null, 1));
process.exit(fail ? 1 : 0);
