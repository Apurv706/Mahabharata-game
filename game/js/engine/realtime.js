/* Real-time fights (PRD §18.15), the engine. A deterministic fixed-step simulation (60 steps a
   second, every chance drawn from K.rng) of one fight on a 1-D ground: x runs 0..1 across the field
   (9.5 bodies wide on every screen), and three depth rows (u.rt.lane: 0 front .. 2 back, a float while
   a unit steps between them; owner, 3 November): you hold the front row and your side stands in the
   rows behind; a foe steps into its target's row to strike and waits in a back row; a beaten foe (one
   that may be spared) kneels in the back row; blows reach a row across a little shorter; bodies in one
   row keep apart (no more than about a quarter of a body overlapping); arrows cross rows.

   It rides on the turn-based engine (engine/combat.js): K.Combat.start builds the fight (the units,
   your stats, the fight's allies and enemies, curses, intro lines), every blow is K.Combat's own
   B.hit through the abilities' own use() (so vows, the kavacha, crits, guard, holding fights and the
   log behave as in the turns), and the end is K.Combat.settle (scars, the friend who came, the
   "combat" event), followed by K.combatOutcome as for any fight. Only time is new.

   One fight at a time: RT.begin(B) → R; RT.step(R, act) advances one step with one input
   { move: -1|0|1, strike, roll, rollDir, skill, herbs, astra: id, call, orders: { friend, soldiers },
     withdraw, spare: uid } (the screen and the bot drive it alike); R.over is "win" | "lose" | "flee"
   | "spare" when it has ended, or "retry" when a deadly fight was lost the first time (RT.retry).
   RT.autoplay(encId) plays a whole fight with the bot (tests/headless): the outcome, as the turns give.

   Rules every enemy keeps (binding): a wind-up of at least 0.3 s, flashing orange; its mark fills to
   the rim exactly as the blow lands; an arrow's lane tracks its target, then locks (white) before the
   release; at most two foes attack at once, the rest wait at a distance; a foe winds up only when
   fully on the field. You stay a tenth of the field from either edge; foes stay on once in. Your own
   side never blocks you, and a blow marked on a friend lands on you if you stand in its path. */
(function (K) {
  "use strict";
  const C = K.Combat;
  const RT = (K.RT = {});
  const STEP = 1 / 60, ROUND = 4, BODY = 1 / 9.5, EDGE = 0.1;
  RT.STEP = STEP; RT.ROUND = ROUND; RT.BODY = BODY; RT.EDGE = EDGE;
  // The tunables (tests/balance.js measures them; PARAMS env in the tests can override).
  RT.P = {
    story: 8,          // seconds per round of a fight's story: beats, the field event, holds and "rounds"
    hpFoe: 6.5,        // health is scaled up so a fight lasts its 30-60 s (blows are as in the turns)
    hpFriend: 1.15,    // you act several times as often as any foe: your own health is scaled far less
    atkFoe: 1,
    hpAlly: null,      // those beside you act as often as foes: scaled as foes (null) unless set
    spacing: 0.45,
    archerGap: 0.7,    // an archer looses oftener than a swordsman swings     // a second foe's blow never lands within this of the first (two at once, but readable)
    gap: [1.5, 2.8],   // a foe's rest between blows, seconds
    windup: 0.6,       // a plain blow's wind-up (never below 0.3)
    heavyWind: 0.95,
    track: 0.8, lock: 0.35, // an arrow: the lane follows, then locks
    breathMax: 100, rollCost: 32, rollMin: 32, breathRegen: 20,
    roll: 0.42,        // a roll's length (all of it unhurtable)
    perfect: 0.16,     // a roll begun this close before a blow lands is perfect: the foes slow
    retryHp: 0.8,      // a second try starts a little hurt
    botReact: [0.2, 0.42], botMiss: [0.25, 0.55], // the bot's reading, from grace (good to poor)
    cap: 240           // a fight that has run this long is stopped (it never should)
  };
  // The fights played in real time (PRD §18.15 "Which fights are which"); every other fight stays on the turns.
  RT.IDS = new Set(["e_ugra", "e_spar", "e_bandits", "e_kings", "e_panchala", "e_border", "e_gandharva", "e_sudatta", "e_jayadratha", "e_cattle", "e_cattle_k",
    "e_guard", "e_hunt", "e_gate", "e_road", "e_jaya", "e_dushasana", "e_night", "e_ep_carts", "e_ep_ugra", "e_raid", "e_ash", "cross_e_duel", "cross_e_called", "x_practice"]);
  RT.isRealtime = (enc) => {
    if (typeof enc === "string") enc = K.ENCOUNTERS[enc];
    if (!enc || enc.dream) return false;
    if (enc.realtime === false) return false;
    return RT.IDS.has(enc.id) || enc.realtime === true || K.val(enc.kind) === "mace"; // the mace duel of the side battles
  };
  // Real-time play is behind a developer switch until the screens are approved: K.prefs().rtDev, or
  // ?rt=1 in the address. Tests turn it on with RT.force (RT=1). The player's own switch, "Fights:
  // real-time / turn-based" (K.prefs().fights), is real-time by default.
  RT.force = false;
  RT.dev = () => {
    if (RT.force) return true;
    try { if (typeof location !== "undefined" && /[?&]rt=1\b/.test(location.search || "")) return true; } catch (e) { /* no location */ }
    return !!(K.prefs && K.prefs().rtDev);
  };
  RT.mode = () => (K.prefs && K.prefs().fights === "turns" ? "turns" : "realtime");
  RT.on = () => RT.dev() && (RT.force || RT.mode() === "realtime");
  RT.wanted = (encId) => RT.on() && RT.isRealtime(encId);

  // A turn-based war day fought beside your company: you choose your place in the line (K.Combat.setPlace).
  // Behind the developer switch with the rest of §18.15.
  C.placesWanted = (enc, B) => RT.dev() && !RT.isRealtime(enc) && !!enc.lethal && !enc.dream && !(K.val(enc.kind) && K.FIGHT_KINDS && K.FIGHT_KINDS[K.val(enc.kind)]) &&
    B.units.some((u) => u.side === "ally" && u.plural && !u.person);

  // The skill each path brings to a live fight (from its turn-based moves).
  RT.SKILL = { archer: "aimed", mace: "quake", charioteer: "ridedown", strategist: "command", healer: "salve", spy: "vanish", bard: "song" };
  RT.RECHARGE = { aimed: 7, quake: 11, ridedown: 10, command: 9, salve: 13, vanish: 10, song: 13 };
  const MELEE = new Set(["strike", "heavy", "crush", "breaker", "disarm", "hamstring", "nerve", "ridedown"]);
  const RANGED = new Set(["arrows", "aimed", "pin", "volley"]);
  const HEAVY = new Set(["heavy", "crush", "breaker", "aimed"]);

  const living = (B, side) => B.units.filter((u) => u.hp > 0 && (side === "friends" ? u.side !== "enemy" : u.side === side));
  const held = (u) => !!(u.status.stun || u.status.asleep || u.status.bound);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sign = (v) => (v < 0 ? -1 : 1);
  const r = (a, b) => a + K.rng() * (b - a);

  // ---------- Who each unit is, on the ground ----------
  function profile(u) {
    const n = String(u.src || u.name);
    const ab = u.abilities || [];
    const ranged = ab.some((a) => RANGED.has(a));
    const archer = ranged && (/archer|chariot\b|chariot-|torch|bow/i.test(n) || !ab.some((a) => MELEE.has(a)));
    const spear = /spear|Gandharva|rider|horseman|sentry/i.test(n);
    const big = (u.atk || 0) >= 14 || u.hero || /champion|Ashwatthama|Ugra|Bhima/i.test(n);
    return {
      archer, ranged,
      reach: (spear ? 1.45 : big ? 1.25 : 1.1) * BODY,
      speed: (archer ? 0.16 : 0.2) * (u.plural ? 0.9 : 1),
      windup: Math.max(0.3, RT.P.windup - Math.min(0.2, (u.atk || 0) * 0.006)),
      keep: archer ? 0.34 : 0 // an archer keeps its distance
    };
  }
  function initUnit(R, u) {
    const B = R.B, foe = u.side === "enemy";
    const k = foe ? RT.P.hpFoe : u.side === "player" ? RT.P.hpFriend : RT.P.hpAlly == null ? RT.P.hpFoe : RT.P.hpAlly;
    u.maxHp = Math.max(1, Math.round(u.maxHp * k)); u.hp = Math.max(0, Math.round(u.hp * k));
    if (foe) u.atk = Math.round(u.atk * RT.P.atkFoe * 10) / 10; // blows come oftener and are dodged more than on the turns
    const pr = u.side === "player" ? { reach: 1.2 * BODY, speed: 0.3, windup: 0.12 } : profile(u);
    const i = R.seen++;
    const sideIdx = (R.sideSeen[foe ? "e" : "f"] = (R.sideSeen[foe ? "e" : "f"] || 0) + 1) - 1;
    u.rt = Object.assign(pr, {
      x: 0, lane: 0, face: foe ? -1 : 1, state: "idle", t: 0, busy: 0, cool: foe ? r(0.6, 1.6) : r(0.3, 0.9), cd: {}, st: {}, down: 0, stag: 0,
      atk: null, entered: !foe, hits: [], bodies: u.plural ? 3 : 1, idx: i, sideIdx
    });
    for (const [s, v] of Object.entries(u.status)) if (typeof v === "number") u.rt.st[s] = v * ROUND; // set before the fight began (a curse, a shaken company)
    if (u.leave != null) { u.rt.leaveAt = R.t + Math.max(1, u.leave - B.round) * ROUND; delete u.leave; }
  }
  function place(R) {
    const B = R.B, p = C.player();
    p.rt.x = 0.27; p.rt.lane = 0;
    const allies = B.units.filter((u) => u.side === "ally");
    // As the layout page: your side on both sides of you, spread over the field.
    allies.forEach((a, i) => { a.rt.x = [0.13, 0.43, 0.57, 0.08][i % 4]; a.rt.lane = backRow(a); });
    const foes = B.units.filter((u) => u.side === "enemy");
    foes.forEach((e, i) => {
      // More than two come in packs: two on the field, the rest waiting off it.
      e.rt.wave = i < 2 ? 0 : 1;
      e.rt.x = e.rt.wave ? 1.12 + (i - 2) * 0.05 : 0.72 + i * 0.16;
      e.rt.entered = !e.rt.wave && e.rt.x <= 0.97;
      e.rt.lane = backRow(e);
    });
  }

  RT.begin = function (B, opts = {}) {
    const R = { B, t: 0, n: 0, seen: 0, sideSeen: {}, over: null, tries: opts.tries || 0, marks: [], fx: [], slow: 0, round: 1, doT: ROUND,
      orders: { friend: "balanced", soldiers: "defend" }, breath: RT.P.breathMax, combo: 0, comboT: -9, buffer: false, roll: 0, rollT: -9, rollDir: 1,
      kneel: 0, skillCd: 0, salve: null, unseen: 0, double: false, haste: 0, frozen: 0, assist: !!opts.assist, stats: { blows: 0, hits: 0, rolls: 0, dodged: 0, perfect: 0, maxAtk: 0 },
      skill: null, shots: [], shotN: 0 };
    B.rt = R;
    B.units.forEach((u) => initUnit(R, u));
    place(R);
    const p = C.player();
    if (opts.hp) p.hp = Math.max(1, Math.round(p.maxHp * opts.hp));
    const id = RT.SKILL[K.S.path];
    R.skill = id && p.abilities.includes(id) ? id : null;
    // Wrap the fight's status call so every effect that lasts rounds lasts about 4 s a round here.
    const status = B.status;
    B.status = function (t, s, dur, text) { status.call(B, t, s, dur, text); if (t && t.rt && t.hp > 0) t.rt.st[s] = Math.max(t.rt.st[s] || 0, dur * ROUND); };
    R.base = { round: B.round };
    return R;
  };

  // ---------- Helpers on the ground ----------
  const dist = (a, b) => Math.abs(a.rt.x - b.rt.x);
  const rowGap = (a, b) => Math.abs(a.rt.lane - b.rt.lane);
  const ROWCUT = 0.25 * BODY; // reach lost for each row between
  // Two figures of one side, in any row, stand at least this far apart (a fraction of the field): drawn, a
  // figure is about a sixth of an upright phone's width, so this keeps them overlapping a quarter at most.
  const APART = 0.14;
  const NEAR = 0.62 * BODY;
  const FACE = 0.11;          // you and a foe in your row, face to face (drawn, about a third of a body overlapping)
  function toRow(u, row, dt) { const d = row - u.rt.lane; if (Math.abs(d) > 1e-3) u.rt.lane += sign(d) * Math.min(Math.abs(d), 2.5 * dt); }
  // Keep a unit clear of the others standing in its row.
  function keepApart(R, u, x, dt, list) {
    for (const o of list) {
      if (o === u || o.hp <= 0 || !o.rt || (o.side === "enemy" && !o.rt.entered)) continue;
      const g = o.rt.x - x;
      if (Math.abs(g) >= APART) continue;
      if (Math.abs(o.rt.x - u.rt.x) >= APART) x = o.rt.x - sign(o.rt.x - u.rt.x) * APART; // walking up to it: stop at its side
      else { // already too close: ease apart (inward, if pressed against an edge)
        let dir = Math.abs(g) > 1e-4 ? -sign(g) : u.rt.idx > o.rt.idx ? 1 : -1;
        if ((x > 0.93 && dir > 0) || (x < 0.07 && dir < 0)) dir = -dir;
        x += dir * 0.35 * dt;
      }
    }
    return x;
  }
  // Foes wait in rows 1 and 2; your side stands in the two rows you are not in.
  const backRow = (u) => {
    if (u.side === "enemy") return u.rt.sideIdx % 2 ? 2 : 1;
    const p = C.player(), mine = p && p.rt ? Math.round(p.rt.lane) : 0, free = [0, 1, 2].filter((r) => r !== mine);
    return free[u.rt.sideIdx % 2 ? 1 : 0];
  };
  const onField = (u) => u.rt.x >= 0.04 && u.rt.x <= 0.96;
  function foesNear(R, x, face, reach, from) {
    const p = C.player(), cut = (e) => reach - ROWCUT * Math.abs(e.rt.lane - p.rt.lane);
    return living(R.B, "enemy").filter((e) => e.rt.entered && (face == null ? Math.abs(e.rt.x - x) <= cut(e) : (e.rt.x - x) * face > -BODY * 0.3 && (e.rt.x - x) * face <= cut(e)))
      .sort((a, b) => Math.abs(a.rt.x - (from == null ? x : from)) - Math.abs(b.rt.x - (from == null ? x : from)));
  }
  function nearestFoe(R, x) { return living(R.B, "enemy").filter((e) => e.rt.entered).sort((a, b) => Math.abs(a.rt.x - x) - Math.abs(b.rt.x - x))[0] || null; }
  RT.attacking = (R) => living(R.B, "enemy").filter((e) => e.rt.atk).length;
  // How many foes are left to beat, a band counting as its bodies (the running count).
  RT.count = (R) => living(R.B, "enemy").reduce((n, e) => n + (e.plural ? Math.max(1, Math.ceil(e.rt.bodies * e.hp / e.maxHp)) : 1), 0);
  RT.packs = (R) => { const all = R.B.units.filter((u) => u.side === "enemy"); const waves = Math.max(...all.map((e) => e.rt.wave || 0)) + 1; const now = Math.max(0, ...living(R.B, "enemy").filter((e) => e.rt.entered).map((e) => e.rt.wave || 0)) + 1; return { now: Math.min(now, waves), of: waves }; };
  const ready = (id) => { const row = C.available().find((a) => a.id === id); return !!row && !row.why; };
  RT.can = function (R, what) {
    const p = C.player();
    if (!p || R.over || p.hp <= 0) return false;
    switch (what) {
      case "roll": return R.roll <= 0 && R.kneel <= 0 && R.breath >= RT.P.rollMin && !held(p);
      case "skill": return !!R.skill && R.skillCd <= 0 && R.kneel <= 0 && !held(p);
      case "herbs": return R.kneel <= 0 && (R.herbCd || 0) <= 0 && p.abilities.includes("herbs") && (K.S.items.herbs || 0) > 0 && p.hp < p.maxHp;
      case "call": return p.abilities.includes("call") && ready("call");
      case "withdraw": return C.canFlee();
      default: return false;
    }
  };
  RT.astras = function () { const p = C.player(); return p ? C.available().filter((a) => (a.id === "astra" || (K.ABILITIES[a.id] && K.ABILITIES[a.id].group === "astra"))) : []; };
  RT.spareable = (R) => { const p = C.player(); return C.spareable().filter((e) => dist(p, e) <= BODY * 1.6); };

  // ---------- The player ----------
  function playerAct(R, a) {
    const B = R.B, p = C.player();
    if (a.orders) Object.assign(R.orders, a.orders);
    // A step between the rows (W/S, a swipe): short, and not into a row where a foe stands right beside you.
    if (a.row && !R.rowTo && R.roll <= 0 && R.kneel <= 0 && !held(p)) {
      const to = Math.round(p.rt.lane) + sign(a.row);
      if (to >= 0 && to <= 2) {
        const block = living(B, "enemy").find((e) => e.rt.entered && Math.abs(e.rt.lane - to) < 0.5 && dist(e, p) < NEAR);
        if (block) R.fx.push({ k: "blocked", uid: block.uid }); else { R.rowTo = to; R.fx.push({ k: "row", to }); }
      }
    }
    if (a.withdraw && C.canFlee()) { C.flee(); return; }
    if (a.spare) { const t = RT.spareable(R).find((e) => e.uid === a.spare); if (t) { C.spare(t.uid); return; } }
    if (held(p) || R.frozen > 0) return;
    if (a.call && RT.can(R, "call")) { C.core.use(p, "call", null); R.fx.push({ k: "call" }); }
    if (a.astra) {
      const row = RT.astras().find((x) => x.id === a.astra && !x.why);
      if (row) {
        const ab = K.ABILITIES[row.id];
        const t = ab.target === "enemy" ? nearestFoe(R, p.rt.x) : null;
        if (ab.target !== "enemy" || t) {
          B.astraOut = null;
          const before = new Map(B.units.map((u) => [u.uid, u.hp]));
          C.core.use(p, row.id, t ? t.uid : null);
          R.frozen = 2.4; // the moment: the fight stands still
          // Ordinary foes struck by it are thrown off their feet (knocked flying, and down a while).
          const struck = B.units.filter((u) => u.side === "enemy" && u.rt && before.get(u.uid) > u.hp);
          struck.forEach((u) => { knock(R, u, sign(u.rt.x - p.rt.x), 1.1 * BODY, true); u.rt.down = Math.max(u.rt.down, 2.2); u.rt.flung = R.t; });
          R.fx.push({ k: "astra", id: row.id, out: B.astraOut, struck: struck.map((u) => u.uid) });
          living(B, "enemy").forEach((e) => { if (e.rt.atk && (e.status.stun || e.status.asleep || e.status.bound)) cancel(R, e); });
        }
      }
    }
    if (a.roll && RT.can(R, "roll")) {
      R.roll = RT.P.roll; R.rollT = R.t; R.breath -= RT.P.rollCost; R.stats.rolls++;
      R.rollDir = a.rollDir || a.move || -p.rt.face || -1;
      p.rt.busy = 0; R.buffer = false; R.combo = 0; R.kneel = 0;
      R.fx.push({ k: "roll" });
    }
    if (a.herbs && RT.can(R, "herbs") && R.roll <= 0) { R.kneel = 1.1; p.rt.busy = 0; R.buffer = false; R.fx.push({ k: "kneel" }); }
    if (a.skill && RT.can(R, "skill") && R.roll <= 0 && p.rt.busy <= 0.05) skill(R);
    if (a.strike && R.roll <= 0 && R.kneel <= 0) {
      if (p.rt.busy > 0) R.buffer = true; // a press during a blow is kept for the next
      else blow(R);
    }
  }
  const COMBO = [{ m: 0.62, land: 0.13, len: 0.34 }, { m: 0.62, land: 0.13, len: 0.34 }, { m: 1.05, land: 0.2, len: 0.62, heavy: true }];
  function blow(R) {
    const p = C.player();
    if (R.t - R.comboT > 0.55) R.combo = 0;
    const c = COMBO[R.combo];
    const f = nearestFoe(R, p.rt.x); if (f) p.rt.face = sign(f.rt.x - p.rt.x);
    p.rt.busy = c.len; p.rt.blow = { c, at: R.t + c.land, n: R.combo };
    R.combo = (R.combo + 1) % 3; R.comboT = R.t + c.len;
    R.fx.push({ k: "blow", n: p.rt.blow.n });
  }
  function landBlow(R) {
    const B = R.B, p = C.player(), b = p.rt.blow;
    p.rt.blow = null;
    const t = foesNear(R, p.rt.x, p.rt.face, p.rt.reach)[0];
    R.stats.blows++;
    if (!t) return;
    let m = b.c.m;
    if (R.double) { m *= 2; R.double = false; }
    const d = B.hit(p, t, m);
    R.stats.hits++;
    hitFx(R, t, d, b.c.heavy);
    if (b.c.heavy && t.hp > 0) knock(R, t, p.rt.face, 0.4 * BODY, false);
    t.rt.hits.push(R.t);
  }
  // Knocked back: a foe winding up keeps its blow (it lunges after you); knocked down, it loses it.
  function knock(R, u, dir, dx, down) {
    if (down && u.rt.atk) cancel(R, u);
    u.rt.x = clamp(u.rt.x + dir * dx, 0.07, 0.93);
    if (!u.rt.atk) u.rt.stag = Math.max(u.rt.stag, 0.3);
    if (down) u.rt.down = Math.max(u.rt.down, 1.2);
  }
  function hitFx(R, t, d, heavy) { R.fx.push({ k: "hit", uid: t.uid, n: d, heavy: !!heavy }); }
  function skill(R) {
    const B = R.B, p = C.player(), id = R.skill, ab = K.ABILITIES[id];
    R.skillCd = RT.RECHARGE[id] || 10;
    B.acts.push({ uid: p.uid, id, round: B.round });
    R.fx.push({ k: "skill", id });
    const f = nearestFoe(R, p.rt.x); if (f) p.rt.face = sign(f.rt.x - p.rt.x);
    const face = p.rt.face;
    switch (id) {
      case "aimed": { // an arrow down the lane: the first foe in front, out to most of the field
        p.rt.busy = 0.45;
        const t = foesNear(R, p.rt.x, face, 0.75)[0];
        const lane = t ? t.rt.x : clamp(p.rt.x + face * 0.75, 0, 1);
        const shot = { by: p.uid, side: "player", id, on: t ? t.uid : null, lane, from: p.rt.x, t0: R.t + 0.25, arrive: R.t + 0.25 + Math.max(0.1, Math.abs(lane - p.rt.x) / ARROW_SPEED), heavy: true, n: ++R.shotN };
        R.shots.push(shot); R.fx.push({ k: "shot", uid: p.uid, shot });
        break;
      }
      case "quake": { // hits all around and knocks them down
        p.rt.busy = 0.6;
        const ts = foesNear(R, p.rt.x, null, 1.7 * BODY);
        if (ts.length) { ab.use(B, p, ts); ts.forEach((t) => { hitFx(R, t, 0, true); if (t.hp > 0) knock(R, t, sign(t.rt.x - p.rt.x), 0.3 * BODY, true); }); }
        break;
      }
      case "ridedown": { // a dash through the foes in front, knocking them down
        const to = clamp(p.rt.x + face * 3 * BODY, EDGE, 1 - EDGE);
        const ts = living(B, "enemy").filter((e) => e.rt.entered && (e.rt.x - p.rt.x) * face > -BODY * 0.2 && (e.rt.x - p.rt.x) * face <= Math.abs(to - p.rt.x) + BODY * 0.4);
        ts.forEach((t) => { ab.use(B, p, t); hitFx(R, t, 0, true); if (t.hp > 0) knock(R, t, -face, 0.2 * BODY, true); });
        p.rt.x = to; R.roll = 0.3; R.rollT = -9; R.rollDir = 0; p.rt.busy = 0.35;
        break;
      }
      case "command": { // friends and soldiers strike your foe together
        p.rt.busy = 0.4;
        const t = f;
        const allies = living(B, "ally").filter((a) => !a.still);
        if (!t) break;
        if (!allies.length) { const d = B.hit(p, t, 1); hitFx(R, t, d); break; }
        allies.forEach((a) => { B.status(a, "inspired", 2); const d = B.hit(a, t, 1.2, { verb: "On your order, {a} hits {t} for {n}." }); hitFx(R, t, d); });
        break;
      }
      case "salve": { // heals you and the friends near you, over a few seconds
        p.rt.busy = 0.5;
        R.salve = { left: 3, next: R.t + 0.5 };
        break;
      }
      case "vanish": { // unseen for a moment; the next strike lands double
        R.unseen = 1.6; R.double = true;
        B.tell("You slip out of sight.");
        living(B, "enemy").forEach((e) => { if (e.rt.atk && e.rt.atk.on === p.uid) cancel(R, e); });
        break;
      }
      case "song": { // friends and soldiers quicker and stronger for a few seconds
        p.rt.busy = 0.5;
        ab.use(B, p, living(B, "friends"));
        R.haste = 2 * ROUND;
        break;
      }
    }
  }
  function playerStep(R, a) {
    const B = R.B, p = C.player(), P = RT.P, dt = STEP;
    if (R.roll > 0) {
      R.roll -= dt;
      p.rt.x = clamp(p.rt.x + R.rollDir * (1.7 * BODY / P.roll) * dt, EDGE, 1 - EDGE); // a roll can pass a foe
    } else R.breath = Math.min(P.breathMax, R.breath + P.breathRegen * dt);
    if (R.unseen > 0) R.unseen -= dt;
    if (R.rowTo != null) { const d = R.rowTo - p.rt.lane; p.rt.lane += sign(d) * Math.min(Math.abs(d), dt / 0.25); if (Math.abs(R.rowTo - p.rt.lane) < 1e-6) { p.rt.lane = R.rowTo; R.rowTo = null; } }
    if (R.skillCd > 0) R.skillCd -= dt;
    if (R.herbCd > 0) R.herbCd -= dt;
    if (R.kneel > 0) {
      R.kneel -= dt;
      if (R.kneel <= 0) { C.core.use(p, "herbs", p.uid); delete p.cds.herbs; R.herbCd = 2 * ROUND; R.fx.push({ k: "heal", uid: p.uid }); }
      return;
    }
    if (R.salve && R.t >= R.salve.next) {
      const near = living(B, "friends").filter((u) => !u.still && dist(u, p) <= 2.2 * BODY);
      near.forEach((u) => B.heal(p, u, Math.max(1, Math.round(u.maxHp * 0.28 / 3))));
      R.fx.push({ k: "heal", uid: p.uid });
      R.salve.left--; R.salve.next = R.t + 1;
      if (!R.salve.left) R.salve = null;
    }
    if (p.rt.blow && R.t >= p.rt.blow.at) landBlow(R);
    if (p.rt.busy > 0) {
      p.rt.busy -= dt;
      if (p.rt.busy <= 0 && R.buffer) { R.buffer = false; if (!p.rt.blow) blow(R); }
    }
    if (held(p) || R.roll > 0) return;
    const mv = a.move || 0;
    if (mv && p.rt.busy <= 0) {
      let x = p.rt.x + mv * p.rt.speed * dt;
      // Foes block your way; your own side never does.
      for (const e of living(B, "enemy")) {
        if (!e.rt.entered || rowGap(e, p) > 0.5) continue; // only a foe in your row stands in your way
        const gap = FACE;
        if (mv > 0 && p.rt.x <= e.rt.x && x > e.rt.x - gap) x = Math.max(p.rt.x, e.rt.x - gap);
        if (mv < 0 && p.rt.x >= e.rt.x && x < e.rt.x + gap) x = Math.min(p.rt.x, e.rt.x + gap);
      }
      p.rt.x = clamp(x, EDGE, 1 - EDGE);
      p.rt.face = mv;
      R.pushing = (p.rt.x <= EDGE + 1e-6 && mv < 0) || (p.rt.x >= 1 - EDGE - 1e-6 && mv > 0);
    } else {
      R.pushing = false;
      if (p.rt.busy <= 0) { const f = nearestFoe(R, p.rt.x); if (f) p.rt.face = sign(f.rt.x - p.rt.x); }
    }
  }

  // ---------- Foes ----------
  function cancel(R, u) { u.rt.atk = null; u.rt.cool = Math.max(u.rt.cool, 0.6); }
  function targetable(R, f) {
    if (f.hp <= 0 || f.still) return false;
    if (f.side === "player") return R.unseen <= 0;
    if (f.called || f.person || !f.plural) return R.orders.friend !== "hold" || dist(f, C.player()) < BODY * 1.2;
    return R.orders.soldiers !== "stay";
  }
  function pickTarget(R, e) {
    const fr = living(R.B, "friends").filter((f) => targetable(R, f));
    const taunt = fr.find((f) => f.status.taunt);
    if (taunt) return taunt;
    const p = fr.find((f) => f.side === "player");
    if (p && (K.rng() < 0.65 || fr.length === 1)) return p;
    const others = fr.filter((f) => f !== p).sort((a, b) => dist(a, e) - dist(b, e));
    return others[0] || p || null;
  }
  function chooseMove(R, e, t) {
    const ab = e.abilities, ok = (id) => ab.includes(id) && !(e.rt.cd[id] > 0);
    const far = dist(e, t) > e.rt.reach * 1.3;
    if (ok("quake") && K.rng() < 0.25 && dist(e, t) <= 1.6 * BODY) return "quake";
    const rangedIds = ab.filter((id) => RANGED.has(id) && ok(id));
    const close = dist(e, t) <= e.rt.reach + LUNGE * 0.5;
    if (rangedIds.length && !(close && ab.some((id) => MELEE.has(id))) && (e.rt.archer || (far && K.rng() < 0.6))) return rangedIds.find((id) => id !== "arrows" && K.rng() < 0.3) || (ok("arrows") ? "arrows" : rangedIds[0]);
    if ((ok("guard") || ok("brace")) && e.rt.hits.filter((h) => R.t - h < 2).length >= 2 && K.rng() < 0.4) return ok("brace") ? "brace" : "guard";
    const heavy = ab.filter((id) => MELEE.has(id) && id !== "strike" && ok(id));
    if (heavy.length && K.rng() < 0.4) return K.pick(heavy);
    return ab.includes("strike") ? "strike" : ab.find((id) => MELEE.has(id)) || "strike";
  }
  function startAttack(R, e, t) {
    const id = chooseMove(R, e, t), ab = K.ABILITIES[id];
    if (!ab) return;
    if (MELEE.has(id) && dist(e, t) > e.rt.reach + LUNGE) { e.rt.cool = 0.2; e.rt.close = true; return; } // too far for a blow: close in first
    if (ab.target === "self" || ab.target === "ally" || ab.target === "allies") { // a brace, a war cry: at once
      ab.use(R.B, e, ab.target === "self" ? e : ab.target === "ally" ? e : living(R.B, "enemy"));
      if (ab.cd) e.rt.cd[id] = ab.cd * ROUND;
      e.rt.cool = r(0.8, 1.4);
      return;
    }
    const P = RT.P, ranged = RANGED.has(id), area = id === "quake";
    const wind = ranged ? P.track + P.lock : HEAVY.has(id) || area ? P.heavyWind : e.rt.windup;
    e.rt.face = sign(t.rt.x - e.rt.x);
    e.rt.atk = { id, on: t.uid, t0: R.t, land: R.t + Math.max(0.3, wind), ranged, area, lane: t.rt.x, locked: false, heavy: HEAVY.has(id) || area };
    R.stats.maxAtk = Math.max(R.stats.maxAtk, RT.attacking(R));
  }
  // Where a blow will land, for the screen and the rules: [x0, x1] on the ground.
  RT.markOf = function (R, e) {
    const a = e.rt.atk; if (!a) return null;
    const fill = clamp((R.t - a.t0) / (a.land - a.t0), 0, 1);
    if (a.ranged) return { x0: a.lane - BODY * 0.5, x1: a.lane + BODY * 0.5, fill, lane: true, locked: a.locked, on: a.on, from: e.rt.x };
    if (a.area) return { x0: e.rt.x - 1.6 * BODY, x1: e.rt.x + 1.6 * BODY, fill, on: a.on, area: true, row: e.rt.lane };
    const x1 = e.rt.x + e.rt.face * (e.rt.reach + LUNGE); // the blow carries a step forward
    return { x0: Math.min(e.rt.x, x1), x1: Math.max(e.rt.x, x1), fill, on: a.on, row: e.rt.lane };
  };
  function inside(m, u) {
    const pad = BODY * 0.15 - (m.lane || m.row == null ? 0 : ROWCUT * Math.abs(u.rt.lane - m.row)); // a blow reaches a row across a little shorter; an arrow crosses rows
    return u.rt.x >= m.x0 - pad && u.rt.x <= m.x1 + pad;
  }
  // An arrow is a projectile: loosed down its locked lane, it strikes whoever is in that lane when it
  // arrives (you, if you stepped into it for a friend). The screen draws it from the bow to that unit.
  const ARROW_SPEED = 1.7;
  const LUNGE = 0.45 * BODY; // field widths a second
  function loose(R, e, a) {
    const flight = Math.max(0.12, Math.abs(a.lane - e.rt.x) / ARROW_SPEED);
    const shot = { by: e.uid, side: e.side, id: a.id, on: a.on, lane: a.lane, from: e.rt.x, t0: R.t, arrive: R.t + flight, heavy: a.heavy, n: ++R.shotN, at0: a.t0 };
    R.shots.push(shot);
    R.fx.push({ k: "shot", uid: e.uid, shot });
  }
  function shotsStep(R) {
    for (const s of R.shots.slice()) {
      if (R.t < s.arrive - 1e-6) continue;
      R.shots.splice(R.shots.indexOf(s), 1);
      const by = R.B.units.find((u) => u.uid === s.by);
      if (!by) continue;
      if (s.side === "enemy") resolve(R, by, { id: s.id, on: s.on, heavy: s.heavy, ranged: true, shot: s }, { x0: s.lane - BODY * 0.5, x1: s.lane + BODY * 0.5, lane: true, on: s.on });
      else playerShot(R, by, s);
    }
  }
  function playerShot(R, p, s) {
    const B = R.B;
    const ts = living(B, "enemy").filter((e) => e.rt.entered && Math.abs(e.rt.x - s.lane) <= BODY * 0.6).sort((a, b) => (a.uid === s.on ? -1 : 0) - (b.uid === s.on ? -1 : 0) || Math.abs(a.rt.x - s.from) - Math.abs(b.rt.x - s.from));
    const t = ts[0];
    R.fx.push({ k: "arrive", shot: s, uid: t ? t.uid : null });
    if (!t) return;
    const d = K.ABILITIES[s.id].use(B, p, t) || 0; hitFx(R, t, d, true);
  }
  function landAttack(R, e) {
    const a = e.rt.atk, ab = K.ABILITIES[a.id];
    const m = RT.markOf(R, e);
    e.rt.atk = null;
    if (ab.cd && a.id !== "arrows") e.rt.cd[a.id] = ab.cd * ROUND; // an archer's arrows are its plain blow here
    e.rt.cool = r(RT.P.gap[0], RT.P.gap[1]) * (a.heavy ? 1.2 : 1) * (e.rt.archer ? RT.P.archerGap : 1);
    e.rt.rec = a.heavy ? 0.55 : 0.35;
    if (a.ranged) return loose(R, e, a);
    resolve(R, e, a, m);
  }
  function resolve(R, e, a, m) {
    const B = R.B, ab = K.ABILITIES[a.id], p = C.player();
    const fr = living(B, "friends").filter((f) => !f.still || f.side !== "player");
    const meIn = p.hp > 0 && inside(m, p);
    const dodge = () => {
      R.stats.dodged++;
      B.tell("You dodge {a}'s blow.", { a: e });
      if (R.t - R.rollT <= RT.P.perfect + STEP && R.t - R.rollT >= 0) { R.slow = 1.2; R.stats.perfect++; R.fx.push({ k: "perfect" }); }
      R.fx.push({ k: "miss", uid: p.uid });
    };
    if (a.area) {
      const ts = fr.filter((f) => inside(m, f) && targetable(R, f) && !(f === p && (R.roll > 0 || R.unseen > 0)));
      if (meIn && (R.roll > 0 || R.unseen > 0)) dodge();
      if (ts.length) { ab.use(B, e, ts); ts.forEach((t) => hitFx(R, t, 0, true)); }
      return;
    }
    // The blow lands on you if you are in its path (even one marked on a friend), else on its mark.
    let t = null;
    if (meIn) { if (R.roll > 0 || R.unseen > 0) { dodge(); return; } t = p; }
    else {
      const orig = fr.find((f) => f.uid === a.on);
      if (orig && inside(m, orig) && targetable(R, orig)) t = orig;
      else if (a.ranged) t = fr.find((f) => f !== p && inside(m, f) && targetable(R, f)) || null;
      if (t && t.side === "ally" && !t.still && K.rng() < allyDodge(R, t)) { R.fx.push({ k: "miss", uid: t.uid }); return; }
    }
    if (a.shot) R.fx.push({ k: "arrive", shot: a.shot, uid: t ? t.uid : null });
    if (!t) { R.fx.push({ k: "whiff", uid: e.uid }); return; }
    const before = t.hp;
    // One arrow at one unit hits as a plain blow (on the turns an arrow storm falls on everyone, lighter).
    if (a.id === "arrows") B.hit(e, t, 1, { verb: "Arrows rain on {t} for {n}." });
    else ab.use(B, e, ab.target === "enemies" ? [t] : t);
    hitFx(R, t, before - t.hp, a.heavy);
    if (t === p && before > t.hp) { R.kneel = 0; R.salveStop = true; if (a.heavy) { p.rt.busy = Math.max(p.rt.busy, 0.25); p.rt.blow = null; } }
  }
  function foeStep(R, e, dt) {
    const B = R.B, p = C.player();
    const u = e.rt;
    for (const k of Object.keys(u.cd)) if (u.cd[k] > 0) u.cd[k] -= dt;
    if (u.cool > 0 && !u.atk) u.cool -= dt;
    if (u.down > 0) { u.down -= dt; return; }
    if (u.stag > 0) { u.stag -= dt; return; }
    if (held(e)) { if (u.atk) cancel(R, e); return; }
    if (e.still) return;
    if (u.rec > 0) { u.rec -= dt; return; }
    // Waiting off the field: the next pack comes in as the field thins.
    if (!u.entered) {
      const onNow = living(B, "enemy").filter((x) => x.rt.entered).length;
      if (onNow >= 2 && u.wave) return;
      u.x -= u.speed * dt;
      if (u.x <= 0.93) u.entered = true;
      return;
    }
    // Beaten (in a fight where a foe may be spared): he kneels in the back row and fights no more.
    if (B.enc.spare && e.hp <= e.maxHp * 0.3) { if (!u.beaten) { u.beaten = true; if (u.atk) cancel(R, e); R.fx.push({ k: "beaten", uid: e.uid }); } toRow(e, 2, dt); u.x = clamp(keepApart(R, e, u.x, dt, living(B, "enemy")), 0.07, 0.93); return; }
    if (u.atk) {
      const a = u.atk, t = B.units.find((x) => x.uid === a.on);
      if (a.ranged && !a.locked) { if (t && t.hp > 0) a.lane = t.rt.x; if (a.land - R.t <= RT.P.lock) a.locked = true; }
      if (!a.ranged && !a.area && t && t.hp > 0) u.face = sign(t.rt.x - u.x) || u.face;
      if (R.t >= a.land - 1e-6) landAttack(R, e);
      return;
    }
    let t = B.units.find((x) => x.uid === u.tgt);
    if (!t || !targetable(R, t) || (u.cool <= 0 && K.rng() < 0.02)) { t = pickTarget(R, e); u.tgt = t ? t.uid : null; }
    if (!t) return;
    const d = t.rt.x - u.x, ad = Math.abs(d);
    // Rows: one about to strike steps into its target's row; the others wait in a back row.
    const tr = Math.round(t.rt.lane);
    const taken = living(B, "enemy").some((o) => o !== e && (o.rt.engaged || o.rt.atk) && Math.abs(o.rt.lane - tr) < 0.6 && dist(o, e) < 1.3 * BODY);
    u.engaged = u.cool <= 0.8 && RT.attacking(R) < 2 && !u.archer && !taken; // one at a time steps into a row beside its target
    toRow(e, u.engaged ? tr : backRow(e), dt);
    const want = u.keep && !u.close ? Math.max(u.keep * 0.8, Math.min(u.keep, 0.6)) : u.reach * 0.8;
    const spaced = living(B, "enemy").every((o) => !o.rt.atk || Math.abs(o.rt.atk.land - (R.t + (u.archer ? RT.P.track + RT.P.lock : u.windup))) >= RT.P.spacing);
    const canAttack = u.cool <= 0 && RT.attacking(R) < 2 && spaced && onField(e) && ad <= (u.ranged && (u.archer || ad > u.reach + LUNGE) ? 0.9 : u.reach + LUNGE * 0.85 - ROWCUT * rowGap(e, t));
    if (canAttack) { startAttack(R, e, t); if (u.atk) u.close = false; return; }
    // Without a turn to strike, a foe waits at a distance.
    const waitAt = RT.attacking(R) >= 2 && !u.keep ? Math.max(want, 2.3 * BODY) : want;
    let dx = 0;
    if (ad > waitAt + 0.01) dx = sign(d) * u.speed * dt;
    else if (ad < waitAt - 0.04) dx = -sign(d) * u.speed * 0.6 * dt;
    let x = u.x + dx;
    // Foes keep apart from each other in a row, so each stands clear on the ground.
    if (!u.engaged) x = keepApart(R, e, x, dt, living(B, "enemy").filter((o) => !o.rt.atk && !o.rt.engaged));
    // A foe in your row does not walk through you.
    if (rowGap(e, p) < 0.5) {
      const pg = FACE;
      if (u.x >= p.rt.x && x < p.rt.x + pg) x = Math.max(x, Math.min(u.x, p.rt.x + pg));
      if (u.x < p.rt.x && x > p.rt.x - pg) x = Math.min(x, Math.max(u.x, p.rt.x - pg));
    }
    u.x = clamp(x, 0.07, 0.93);
    if (ad > 1e-4) u.face = sign(d);
  }

  // ---------- Friends and soldiers ----------
  const isSoldiers = (a) => a.plural && !a.person && !a.called;
  function allyDodge(R, a) { if (isSoldiers(a)) return 0.2; return { balanced: 0.35, guard: 0.25, allout: 0.05, hold: 0.5 }[R.orders.friend] || 0.3; }
  function allyStep(R, a, dt) {
    const B = R.B, p = C.player(), u = a.rt;
    if (a.still) return;
    if (u.down > 0) { u.down -= dt; return; }
    if (held(a)) { u.atk = null; return; }
    if (u.rec > 0) { u.rec -= dt; return; }
    const order = isSoldiers(a) ? R.orders.soldiers : R.orders.friend;
    const hast = R.haste > 0 ? 0.7 : 1;
    if (u.atk) {
      if (R.t >= u.atk.land - 1e-6) {
        const t = B.units.find((x) => x.uid === u.atk.on && x.hp > 0), id = u.atk.id; u.atk = null;
        u.cool = r(1.4, 2.3) * hast * (order === "allout" ? 0.75 : 1); u.rec = 0.3;
        const ab = K.ABILITIES[id];
        if (ab.target === "ally") { ab.use(B, a, t); R.fx.push({ k: "heal", uid: t && t.uid }); }
        else if (t && Math.abs(t.rt.x - u.x) <= u.reach * 1.25 + LUNGE - ROWCUT * rowGap(a, t)) {
          const before = t.hp;
          if (order === "allout" && id === "strike") B.hit(a, t, 1.25); else ab.use(B, a, ab.target === "enemies" ? [t] : t); // all-out hits harder
          hitFx(R, t, before - t.hp);
        }
      }
      return;
    }
    if (u.cool > 0) u.cool -= dt;
    // Where to stand.
    let goal, foe = null;
    const foes = living(B, "enemy").filter((e) => e.rt.entered);
    const low = order === "balanced" && a.hp < a.maxHp * 0.35; // balanced: falls back when hurt
    if (order === "stay" || order === "hold" || low) goal = clamp(p.rt.x - sign(p.rt.face || 1) * (low ? 1.2 : 1.4) * BODY, 0.07, 0.93);
    else {
      if (order === "guard" || order === "defend") foe = foes.filter((e) => dist(e, p) <= 2 * BODY).sort((x, y) => dist(x, p) - dist(y, p))[0] || null;
      else if (order === "allout") foe = foes.sort((x, y) => dist(x, a) - dist(y, a))[0] || null;
      else foe = foes.sort((x, y) => dist(x, p) - dist(y, p))[0] || null;
      if (foe) goal = foe.rt.x - sign(foe.rt.x - u.x) * u.reach * 0.75;
      else goal = clamp(p.rt.x - 0.8 * BODY, 0.05, 0.95);
      if ((order === "guard" || order === "defend") && Math.abs(goal - p.rt.x) > BODY * 1.2) goal = p.rt.x + clamp(goal - p.rt.x, -BODY * 1.2, BODY * 1.2);
    }
    const d = goal - u.x;
    let nx = u.x;
    if (Math.abs(d) > 0.01) nx = u.x + sign(d) * Math.min(Math.abs(d), u.speed * 1.05 * dt);
    toRow(a, backRow(a), dt); // your side stands in the rows behind you
    u.x = clamp(keepApart(R, a, nx, dt, living(B, "friends")), 0.07, 0.93);
    // A healer among your friends tends the hurt.
    const hurt = living(B, "friends").find((f) => !f.still && f.hp / f.maxHp < 0.45 && dist(f, a) < 2 * BODY);
    if (u.cool <= 0 && hurt && a.abilities.includes("salve") && !(u.cd.salve > 0)) { u.atk = { id: "salve", on: hurt.uid, land: R.t + 0.5, t0: R.t }; u.cd.salve = 3 * ROUND; return; }
    for (const k of Object.keys(u.cd)) if (u.cd[k] > 0) u.cd[k] -= dt;
    if (order === "stay" || order === "hold" || low || !foe || u.cool > 0) return;
    if (Math.abs(foe.rt.x - u.x) <= u.reach * 1.05 + LUNGE - ROWCUT * rowGap(a, foe)) {
      const ok = (id) => a.abilities.includes(id) && !(u.cd[id] > 0);
      const id = ok("heavy") && K.rng() < 0.3 ? "heavy" : a.abilities.includes("strike") ? "strike" : a.abilities.find((x) => MELEE.has(x)) || "strike";
      if (K.ABILITIES[id].cd) u.cd[id] = K.ABILITIES[id].cd * ROUND;
      u.face = sign(foe.rt.x - u.x);
      u.atk = { id, on: foe.uid, t0: R.t, land: R.t + 0.45 * hast };
    }
  }

  // ---------- Time: statuses, burning, friends who leave, the story's rounds ----------
  function clocks(R) {
    const B = R.B, dt = STEP;
    for (const u of B.units) {
      if (!u.rt) continue;
      for (const s of Object.keys(u.rt.st)) {
        if (!(s in u.status)) { delete u.rt.st[s]; continue; }
        u.rt.st[s] -= dt;
        if (u.rt.st[s] <= 0) { delete u.rt.st[s]; delete u.status[s]; }
        else if (s !== "crit") u.status[s] = Math.max(1, Math.ceil(u.rt.st[s] / ROUND)); // what is left, in rounds (the screen's labels)
      }
    }
    if (R.slow > 0) R.slow -= dt;
    if (R.haste > 0) R.haste -= dt;
    R.doT -= dt;
    if (R.doT <= 0) { // burning and bleeding, every 4 s, as at the end of a round
      R.doT += ROUND;
      for (const u of B.units) {
        if (u.hp > 0 && u.status.burn) { const d = Math.max(1, Math.round(u.maxHp * 0.07)); u.hp = Math.max(0, u.hp - d); B.tell(u.side === "player" ? "You burn for {n}." : "{t} burns for {n}.", { t: u }, { n: d }); }
        if (u.hp > 0 && u.status.bleed) { const d = Math.max(1, Math.round(u.maxHp * 0.06)); u.hp = Math.max(0, u.hp - d); B.tell(u.side === "player" ? "You bleed for {n}." : "{t} bleeds for {n}.", { t: u }, { n: d }); }
      }
    }
    for (const u of B.units.filter((x) => x.rt && x.rt.leaveAt != null && R.t >= x.rt.leaveAt && x.hp > 0)) {
      B.tell("The press of the fighting carries {t} away from you.", { t: u }); B.units = B.units.filter((x) => x !== u); R.fx.push({ k: "leave", uid: u.uid });
    }
    const round = 1 + Math.floor(R.t / RT.P.story);
    if (round !== B.round) {
      B.round = round;
      const beat = (K.val(B.enc.beats) || []).find((b) => b.round === B.round);
      if (beat) { B.evented = true; const at = B.log.length; const u = (beat.run && beat.run(B)) || {}; B.log.splice(at, 0, { key: beat.text, u, ev: true }); R.fx.push({ k: "event" }); }
      else if (B.round === 3 && B.enc.lethal && !B.evented && !B.enc.beats && living(B, "enemy").length) { C.core.fieldEvent(); R.fx.push({ k: "event" }); }
    }
  }
  function overNow(R) {
    const B = R.B, p = C.player(), enc = B.enc;
    if (B.over) return B.over;
    C.core.amulet(p);
    if (p.hp <= 0) return "lose";
    { const r2 = B.rule && B.rule.over ? B.rule.over(B) : null; if (r2) return r2; }
    if (!living(B, "enemy").length) return "win";
    const S = RT.P.story;
    if (enc.rounds && R.t >= enc.rounds * S) { B.say(enc.roundsText || "You held long enough."); return "win"; }
    if (enc.hold && R.t >= enc.hold * S) { B.say(enc.holdText || "You held until the end."); return "win"; }
    if (R.t >= RT.P.cap) { // should never happen: the side with more left wins
      const mine = p.hp / p.maxHp, theirs = living(B, "enemy").reduce((s, e) => s + e.hp / e.maxHp, 0) / Math.max(1, B.units.filter((u) => u.side === "enemy").length);
      R.capped = true; return mine >= theirs ? "win" : "lose";
    }
    return null;
  }

  // Figures of one side at rest never stand in each other (a knock-back, a pack walking in): eased apart.
  // You are never pushed; your side makes room around you. A foe striking or stepping in to strike is not at rest.
  function spread(R) {
    const p = C.player();
    for (const side of ["enemy", "friends"]) {
      const us = living(R.B, side).filter((u) => u.rt && !u.still && (side !== "enemy" || (u.rt.entered && !u.rt.atk && !u.rt.engaged)));
      for (let i = 0; i < us.length; i++) for (let j = i + 1; j < us.length; j++) {
        let a = us[i], b = us[j];
        if (b === p) { b = a; a = p; }
        const g = b.rt.x - a.rt.x;
        if (a === p) {
          if (Math.abs(g) >= APART * 0.98) continue;
          let dir = Math.abs(g) > 1e-4 ? sign(g) : (b.rt.x > 0.5 ? -1 : 1);
          if ((b.rt.x <= 0.0705 && dir < 0) || (b.rt.x >= 0.9295 && dir > 0) || b.rt.passing) { b.rt.passing = true; dir = sign(p.rt.x - b.rt.x) || 1; } // pinned at the edge: past you to the open side
          b.rt.x = clamp(b.rt.x + dir * (b.rt.passing ? 0.3 : 0.5) * STEP, 0.07, 0.93);
          if (b.rt.passing && Math.abs(b.rt.x - p.rt.x) >= APART && sign(b.rt.x - p.rt.x) !== sign(g || 1)) b.rt.passing = false;
          continue;
        }
        if (Math.abs(g) >= APART * 0.98) continue;
        const dir = Math.abs(g) > 1e-4 ? sign(g) : (b.rt.x > 0.5 ? -1 : 1); // b goes this way, a the other
        const push = 0.5 * STEP;
        const nb = clamp(b.rt.x + dir * push, 0.07, 0.93), lostB = push - Math.abs(nb - b.rt.x);
        const na = clamp(a.rt.x - dir * (push + lostB), 0.07, 0.93), lostA = push + lostB - Math.abs(na - a.rt.x);
        a.rt.x = na; b.rt.x = clamp(nb + dir * lostA, 0.07, 0.93); // pressed against an edge, the other one moves the more
      }
    }
  }
  function joined(R) {
    for (const u of R.B.units) if (!u.rt) { initUnit(R, u); u.rt.x = clamp(C.player().rt.x - 0.6 * BODY, 0.04, 0.96); u.rt.lane = backRow(u); if (u.side === "enemy") { u.rt.x = 1.05; u.rt.entered = false; } R.fx.push({ k: "join", uid: u.uid }); }
  }
  // One step of the fight, with one input.
  RT.step = function (R, act) {
    const B = R.B;
    if (R.over) return R;
    act = act || {};
    if (B.over) { R.over = B.over; return R; }
    R.n++;
    // A divine weapon's moment: the fight stands still while it plays (the screen clears R.frozen sooner).
    if (R.frozen > 0) { R.frozen -= STEP; if (act.orders) Object.assign(R.orders, act.orders); return R; }
    joined(R);
    playerAct(R, act);
    joined(R); // a friend who answered the call, or one a beat brought in
    if (B.over) { R.over = B.over; return R; }
    R.t += STEP;
    const p = C.player();
    // Story mode and "Meet blows for me": you roll out of marked blows by yourself.
    if (R.assist && RT.can(R, "roll")) {
      const th = RT.threats(R).find((x) => x.land - R.t <= 0.12);
      if (th) playerAct(R, { roll: true, rollDir: sign(p.rt.x - th.from) });
    }
    playerStep(R, act);
    const fdt = STEP * (R.slow > 0 ? 0.45 : 1);
    for (const a of living(B, "ally")) allyStep(R, a, STEP);
    const foes = living(B, "enemy").sort((x, y) => (x.rt.atk ? 0 : 1) - (y.rt.atk ? 0 : 1) || x.rt.idx - y.rt.idx);
    for (const e of foes) { if (e.rt.atk && R.slow > 0) e.rt.atk.land += STEP - fdt; foeStep(R, e, fdt); }
    spread(R);
    shotsStep(R);
    clocks(R);
    for (const u of B.units) if (u.rt && u.hp <= 0 && u.rt.fell == null) { u.rt.fell = R.t; u.rt.atk = null; R.fx.push({ k: "fall", uid: u.uid }); }
    const out = overNow(R);
    if (out) end(R, out);
    return R;
  };
  // Blows coming at you (or with you in their path): for the bot, the assist and the screen.
  RT.threats = function (R) {
    const p = C.player(), out = [];
    for (const e of living(R.B, "enemy")) {
      const m = RT.markOf(R, e);
      if (!m) continue;
      const mine = m.on === p.uid, path = inside(m, p);
      const land = e.rt.atk.land + (m.lane ? Math.max(0.12, Math.abs(e.rt.atk.lane - e.rt.x) / ARROW_SPEED) : 0);
      if (m.lane ? (m.locked || mine) && (path || mine && !m.locked) : path) out.push({ uid: e.uid, land, t0: e.rt.atk.t0, from: e.rt.x, lane: !!m.lane, locked: !!m.locked, mine, heavy: e.rt.atk.heavy });
    }
    for (const s of R.shots) if (s.side === "enemy" && Math.abs(p.rt.x - s.lane) <= BODY * 0.65) out.push({ uid: s.by, land: s.arrive, t0: s.at0, from: s.from, lane: true, locked: true, mine: s.on === p.uid, heavy: s.heavy, flying: true });
    return out.sort((a, b) => a.land - b.land);
  };
  function end(R, out) {
    const B = R.B;
    R.lost = out === "lose";
    // A deadly fight lost the first time: one more try (RT.retry), with a little cost.
    if (out === "lose" && B.enc.lethal && !R.tries && !B.over && !R.noRetry) { R.over = "retry"; return; }
    R.over = out;
    if (!B.over) C.settle(out);
  }
  // Give up the second try: the loss counts as any loss.
  RT.accept = function (R) { if (R.over !== "retry") return; R.over = "lose"; C.settle("lose"); };
  // The second try: the same fight from its start, a little hurt; what you spent stays spent.
  RT.retry = function (R) {
    if (R.over !== "retry") return R;
    const B = C.start(R.B.enc.id, R.B.onEnd);
    B.say("You get up. One more time.");
    const R2 = RT.begin(B, { tries: R.tries + 1, hp: RT.P.retryHp, assist: R.assist });
    R2.orders = Object.assign({}, R.orders);
    R2.prev = { t: R.t };
    return R2;
  };

  // ---------- The bot: approach, strike, roll out of marked blows, heal when low ----------
  // Its reading depends on grace: a quicker eye and fewer blows it misses. Every chance from K.rng.
  RT.bot = function (R, opt = {}) {
    const B = R.B, p = C.player(), S = K.S;
    if (!R.botState) {
      const g = clamp((K.attr("grace") || 0) / 6, 0, 1);
      const P = RT.P;
      R.botState = { react: P.botReact[1] - (P.botReact[1] - P.botReact[0]) * g, miss: P.botMiss[1] - (P.botMiss[1] - P.botMiss[0]) * g, read: {}, called: false };
    }
    const bs = R.botState, a = {};
    const th = RT.threats(R);
    for (const t of th) {
      const key = t.uid + "@" + t.t0;
      if (!(key in bs.read)) bs.read[key] = K.rng() >= bs.miss; // does it read this one at all?
      if (!bs.read[key]) continue;
      if (R.t - t.t0 < bs.react) continue;
      const left = t.land - R.t;
      if (left <= 0.2 && RT.can(R, "roll")) {
        // Away from the blow, unless that corners you at the edge: then through the foe, to open ground.
        let dir = sign(p.rt.x - t.from) || -1;
        const to = p.rt.x + dir * 1.7 * BODY;
        if (to < EDGE + 0.12 || to > 1 - EDGE - 0.12) dir = -dir;
        a.roll = true; a.rollDir = dir; return a;
      }
    }
    const soon = th.some((t) => t.land - R.t < 0.5 && bs.read[t.uid + "@" + t.t0]);
    if (p.hp < p.maxHp * 0.36 && RT.can(R, "herbs") && !soon) { a.herbs = true; return a; }
    const foes = living(B, "enemy").filter((e) => e.rt.entered);
    // Call for help when it is worth it.
    if (!bs.called && RT.can(R, "call") && (p.hp < p.maxHp * 0.6 || foes.length >= 2)) { bs.called = true; a.call = true; }
    // A divine weapon, on a crowd or when hurt, never at a foe who could answer it in a fight it wins anyway.
    const ast = RT.astras().filter((x) => !x.why);
    if (ast.length && !soon && (foes.length >= 2 || p.hp < p.maxHp * 0.5) && !foes.every((e) => e.hero)) { a.astra = ast[0].id; return a; }
    if (opt.spare && C.spareable().length) { const t = RT.spareable(R)[0]; if (t && K.rng() < opt.spare) { a.spare = t.uid; return a; } }
    const f = nearestFoe(R, p.rt.x);
    if (!f) return a;
    const d = f.rt.x - p.rt.x, ad = Math.abs(d);
    // The path's skill, where it does something.
    if (RT.can(R, "skill") && !soon) {
      const allies = living(B, "ally").filter((x) => !x.still).length;
      const use = { aimed: ad <= 0.7, quake: foesNear(R, p.rt.x, null, 1.6 * BODY).length >= 1, ridedown: ad <= 2.5 * BODY, command: ad <= 3 * BODY, salve: p.hp < p.maxHp * 0.75, vanish: ad <= 1.6 * BODY, song: allies > 0 || ad <= BODY * 1.5 }[R.skill];
      if (use) { a.skill = true; return a; }
    }
    if (ad <= (p.rt.reach - ROWCUT * rowGap(f, p)) * 0.92) { a.strike = !soon || p.rt.busy > 0; if (!a.strike) a.move = 0; }
    else a.move = sign(d);
    return a;
  };
  RT.hash = function (s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
  // The fight's state as a fingerprint: same seed, same inputs → same hash.
  RT.fingerprint = function (R) {
    const u = R.B.units.map((x) => [x.uid, x.hp, x.maxHp, Math.round(x.rt.x * 1e6)]);
    return RT.hash(JSON.stringify([R.over, R.n, u, R.B.log.length, K.S.items, K.S.flags, K.S.charges]));
  };

  // A whole fight, played by the bot (the tests, and any fight without a screen). Returns the outcome.
  RT.log = []; // per fight: { id, out, t, tries } for tests/balance.js
  RT.autoplay = function (encId, opt = {}) {
    let B = C.start(encId, null);
    let R = RT.begin(B, { assist: opt.assist });
    const play = () => { let guard = 0; while (!R.over && guard++ < 60 * (RT.P.cap + 30)) RT.step(R, RT.bot(R, opt)); };
    play();
    let total = R.t;
    if (R.over === "retry") { R = RT.retry(R); B = R.B; play(); total += R.t; }
    const rec = { id: encId, out: R.over, t: Math.round(total * 10) / 10, last: Math.round(R.t * 10) / 10, tries: R.tries + 1, capped: !!R.capped, maxAtk: R.stats.maxAtk, fp: RT.fingerprint(R) };
    RT.log.push(rec); if (RT.log.length > 2000) RT.log.shift();
    if (opt.onRecord) opt.onRecord(rec);
    RT.last = R;
    const done = C.end();
    return done ? done.over : R.over;
  };
})(window.K = window.K || {});
