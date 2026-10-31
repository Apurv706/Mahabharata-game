/* Combat screen. Tap an enemy to target it, then pick an action (or press 1–9).
   Above the cards, the fight is played out by shadow puppets on a painted stage: you and your side on
   the left, the enemy on the right. Blows land with a lunge, a shake and a moment's stillness; the
   damage rises from whoever took it; the last blow of a won fight falls in slow motion; a drum keeps
   time, faster as the fight goes on and when you are hurt.
   When an enemy's blow comes at you, it is telegraphed (the figure winds up, a ring closes): Block
   as the ring meets the mark to take half, or a counter if your timing is perfect; Dodge to avoid it
   entirely, on a narrower window. With "Timed moments" off, blows are met by chance on kind odds. */
(function (K) {
  "use strict";
  const U = K.UI;
  const C = K.Combat;
  let target = null;
  let onEndCb = null;
  let lastHp = {};
  let lastLogLen = 0;
  let lastActs = 0;
  let foeKey = null;      // the enemy turn being played, so a redraw does not start it twice
  let qte = null;         // the defence moment in progress

  U.startBattle = function (encId, onEnd) {
    target = null; lastHp = {}; lastLogLen = 0; lastActs = 0; foeKey = null; stopQte();
    onEndCb = onEnd;
    // The great war opens each fight with the call to arms; other fights with a drum call.
    if (K.Sound && K.ENCOUNTERS[encId]) K.Sound.play(K.ENCOUNTERS[encId].lethal && K.S.act === 6 ? "callToArms" : "drumCall");
    if (K.Sound) K.Sound.mood("battle");
    C.stepNext = U.timed() && !K.headless;
    C.start(encId, onEnd);
    drums.start();
  };

  // ---------- The drum ----------
  // A dhol under the fight: steady at first, quicker each round, quicker still when you are hurt.
  const drums = {
    t: null, n: 0,
    start() { this.stop(); if (K.headless) return; this.n = 0; this.tick(); },
    tick() {
      const B = C.state();
      if (!B || B.over) return this.stop();
      const p = C.player();
      const low = p && p.hp < p.maxHp * 0.4;
      const gap = Math.max(0.36, 0.92 - (B.round - 1) * 0.06 - (low ? 0.2 : 0));
      if (K.Sound) K.Sound.play(this.n % 4 === 0 ? "drum" : this.n % 2 ? "tap" : "drum");
      this.n++;
      this.t = setTimeout(() => this.tick(), gap * 1000);
    },
    stop() { clearTimeout(this.t); this.t = null; }
  };
  U.stopDrums = () => drums.stop();

  // ---------- Who each unit is, as a puppet ----------
  const NAMED = [[/Ugra/, "ugra"], [/Dushasana's/, "guard"], [/Dushasana/, "dushasana"], [/Karna/, "karna"], [/Bhima/, "bhima"], [/Brihannala/, "arjuna"], [/Ketan|boy/i, "boy"], [/Drona/, "drona"]];
  const SPECIAL = {
    Ashwatthama: { pronoun: "he", palette: ["#c9905a", "#3a2a3a", "#c9a24e"], headgear: "mukuta", item: "bow", stage: "adult", big: true },
    Gandharva: { pronoun: "he", palette: ["#9fb07a", "#2f5a3a", "#d9c27a"], headgear: "feather", item: "spear", stage: "adult" },
    archer: { pronoun: "he", palette: ["#9e6a40", "#5d3b2a", "#9f8250"], headgear: "band", item: "bow", stage: "adult" },
    rider: { pronoun: "he", palette: ["#a8703f", "#6e3026", "#c9a24e"], headgear: "jata", item: "sword", stage: "adult" },
    common: { pronoun: "he", palette: ["#9c6a42", "#6b5a3a", "#a8875a"], item: "staff", stage: "adult" }
  };
  function specFor(u) {
    if (u.side === "player") return K.puppetSpec(K.S);
    if (u.person && K.PUPPETS[u.person]) return U.puppetFor(u.person);
    const n = String(u.src || u.name);
    for (const [re, id] of NAMED) if (re.test(n)) return U.puppetFor(id);
    if (/Ashwatthama/.test(n)) return SPECIAL.Ashwatthama;
    if (/Gandharva/.test(n)) return SPECIAL.Gandharva;
    if (/archer|chariot/i.test(n)) return SPECIAL.archer;
    if (/horseman|rider|veteran/i.test(n)) return SPECIAL.rider;
    if (/cowherd|club|villager|raider|bandit/i.test(n)) return SPECIAL.common;
    if (/guard|spear|bodyguard|captain|torch/i.test(n)) return U.puppetFor("guard");
    return U.puppetFor("soldier");
  }
  // How a figure moves for each technique.
  const POSE = { strike: "strike", heavy: "strike", breaker: "strike", disarm: "strike", arrows: "loose", guard: "block", brace: "block", herbs: "kneel",
    aimed: "loose", volley: "loose", pin: "loose", astra: "loose", crush: "strike", quake: "strike", roar: "cheer", swerve: "push", ridedown: "push", rally: "cheer",
    command: "speak", expose: "think", formation: "speak", salve: "kneel", steady: "kneel", nerve: "strike", feint: "sneak", vanish: "sneak", hamstring: "strike",
    song: "speak", verse: "speak", hymn: "speak" };

  // Each fight's tall background, for upright screens (art/<key>_tall.webp). Desktops keep the
  // fight's own wide painting.
  const FIGHT_BG = {
    e_ugra: "fight_fair_ring", e_spar: "stage_training_ground", e_panchala: "fight_drupada_yard", e_border: "fight_border_road",
    e_kings: "fight_swayamvara", e_jayadratha: "fight_forest_road", e_bandits: "fight_forest_road", e_gandharva: "fight_royal_camp",
    e_sudatta: "fight_grazing", e_cattle: "fight_grazing", e_cattle_k: "fight_grazing",
    e_day1: "fight_war_field", e_wheel: "fight_war_field", e_day16: "fight_war_field", e_day18: "fight_war_field",
    e_guard: "fight_war_chariot", e_hunt: "fight_war_chariot", e_road: "fight_war_sunset", e_jaya: "fight_war_sunset", e_gate: "fight_war_sunset",
    e_night: "stage_battlefield_night", e_last_stand: "fight_chakravyuha_inner", e_ring: "fight_chakravyuha_inner", e_dushasana: "fight_war_camp", e_raid: "fight_camp_gate_night", e_ash: "fight_camp_gate_night"
  };
  U.FIGHT_BG = FIGHT_BG;
  function arenaHtml(B) {
    const stage = K.val(B.enc.stage) || K.val(B.enc.art);
    const actor = (u) => '<span class="actor ' + u.side + (u.hp <= 0 ? " down" : "") + '" data-uid="' + u.uid + '">' +
      U.puppet(specFor(u), { h: 150, flip: u.side === "enemy", pose: u.hp <= 0 ? "dead" : u.side === "player" ? "brace" : "stand", label: u.side === "player" ? K.tr("You") : null }) + '<span class="pops"></span></span>';
    const friends = B.units.filter((u) => u.side !== "enemy"), foes = B.units.filter((u) => u.side === "enemy");
    return '<div class="arena" id="arena" style="--stage:url(\'' + U.artUrl(stage) + '\')" aria-hidden="true"><div class="team left">' + friends.map(actor).join("") +
      '</div><div class="team right">' + foes.map(actor).join("") + '</div><div class="arena-flash"></div></div>';
  }
  const actorEl = (uid) => document.querySelector('#arena .actor[data-uid="' + uid + '"]');
  function pose(uid, p, ms) {
    const el = actorEl(uid);
    const svg = el && el.querySelector(".pp");
    if (!svg) return;
    svg.setAttribute("class", svg.getAttribute("class").replace(/pose-\S+/, "pose-" + p));
    clearTimeout(svg._t);
    if (ms) svg._t = setTimeout(() => { if (svg.isConnected && !el.classList.contains("down")) svg.setAttribute("class", svg.getAttribute("class").replace(/pose-\S+/, "pose-" + (el.classList.contains("player") ? "brace" : "stand"))); }, ms);
  }
  function burst(uid, cls, ms) { const el = actorEl(uid); if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms || 500); }
  function pop(uid, text, cls) { const el = actorEl(uid); if (!el) return; const p = U.el('<span class="pop ' + cls + '">' + U.esc(text) + "</span>"); el.querySelector(".pops").appendChild(p); setTimeout(() => p.remove(), 1300); }

  // Play what happened since the last draw: who moved, who was hit, who fell.
  function animate(B) {
    const acts = B.acts.slice(lastActs);
    // A divine weapon: its own full-screen moment (ui/fx.js), which keeps to reduced motion itself.
    acts.forEach((a) => { if ((a.id === "astra" || (K.ASTRAS && K.ASTRAS[a.id])) && B.astraOut && U.astraFx) { const o = B.astraOut; B.astraOut = null; U.astraFx({ kind: o.kind, clash: o.clash, from: actorEl(a.uid), to: actorEl(o.uid) }); } });
    if (!U.motion()) return;
    const arena = U.$("arena");
    acts.forEach((a) => {
      const u = B.units.find((x) => x.uid === a.uid);
      if (!u) return;
      pose(a.uid, POSE[a.id] || "strike", 650);
      if (["strike", "heavy", "breaker", "disarm", "crush", "nerve", "hamstring", "ridedown", "quake"].includes(a.id)) burst(a.uid, u.side === "enemy" ? "lunge-l" : "lunge-r", 520);
    });
    const killed = [];
    for (const u of B.units) {
      const before = lastHp[u.uid];
      if (before == null || before === u.hp) continue;
      const d = u.hp - before;
      if (d < 0) {
        // A moment of stillness, then the blow lands: shake, a flash, the number rising.
        setTimeout(() => { burst(u.uid, "struck", 420); pop(u.uid, String(d), "down"); if (u.hp > 0) pose(u.uid, "hit", 420); }, 110);
        if (u.hp <= 0) killed.push(u);
      } else pop(u.uid, "+" + d, "up");
    }
    const finisher = B.over === "win" && killed.some((u) => u.side === "enemy");
    if (finisher && arena) { arena.classList.add("slowmo"); if (K.Sound) setTimeout(() => K.Sound.play("gong"), 300); }
    if (K.Sound && killed.some((u) => u.side === "ally" && u.person)) K.Sound.play("friendFalls");
    killed.forEach((u) => setTimeout(() => { const el = actorEl(u.uid); if (el) el.classList.add("down"); pose(u.uid, "fall"); }, finisher ? 260 : 160));
    if (B.lastDef && arena) { /* a blow you met: the defence shows on your figure */
      const P = C.player();
      if (B.lastDef === "block") pose(P.uid, "block", 600);
      if (B.lastDef === "dodge") { pose(P.uid, "sneak", 600); burst(P.uid, "dodge", 500); }
      if (B.lastDef === "counter") pose(P.uid, "strike", 600);
      B.lastDef = null;
    }
  }

  // "Next: Heavy blow → you", under an enemy's name.
  function intentLine(u) {
    const it = C.intent(u);
    if (!it) return "";
    const ab = K.tr(it.name);
    let txt;
    if (it.target === "enemies") txt = K.tr("Next: {ab} → all of you", { ab });
    else if (it.unit && it.unit.side === "player") txt = K.tr("Next: {ab} → you", { ab });
    else if (it.unit && it.unit !== u) txt = K.tr("Next: {ab} → {who}", { ab, who: K.text(it.unit.src || it.unit.name) });
    else txt = K.tr("Next: {ab}", { ab });
    const danger = it.heavy && (it.target === "enemies" || (it.unit && it.unit.side === "player"));
    return '<span class="intent' + (danger ? " danger" : "") + '">' + U.esc(txt) + "</span>";
  }

  function unitCard(u, B) {
    const pct = Math.round((u.hp / u.maxHp) * 100);
    const st = Object.keys(u.status).map((s) => "<span>" + U.tr(K.STATUS_TEXT[s] || s) + "</span>").join("");
    const enemy = u.side === "enemy";
    const sel = enemy && target === u.uid ? " sel" : "";
    const label = u.side === "player" ? K.tr("You") : K.text(u.src || u.name);
    return '<button type="button" class="unit ' + u.side + sel + (u.hp <= 0 ? " down" : "") + '" data-uid="' + u.uid + '"' + (!enemy || u.hp <= 0 || B.over ? " disabled" : "") + ">" +
      '<span class="nm">' + (u.person && U.portraitKey(u.person) ? U.thumb(U.portraitKey(u.person), "face") : "") + "<em>" + U.esc(label) + "</em><span>" + u.hp + " / " + u.maxHp + "</span></span>" +
      '<span class="hpbar"><i style="width:' + pct + '%"></i></span>' +
      (st ? '<span class="st">' + st + "</span>" : "") +
      (enemy ? intentLine(u) : "") +
      (u.note ? '<span class="note">' + U.t(u.note) + "</span>" : "") + "</button>";
  }

  // ---------- Meeting a blow ----------
  function stopQte() { if (qte) { qte.stop(); qte = null; } }
  function runFoes(B, box) {
    const n = C.nextFoe();
    if (!n) return;
    const key = B.bid + ":" + B.round + ":" + n.u.uid + ":" + B.queue.length;
    if (foeKey === key) { if (qte) qte.mount(box); return; }
    foeKey = key;
    stopQte();
    const who = K.text(n.u.src || n.u.name);
    if (!n.threat) {
      // Not aimed at you: it plays out by itself.
      box.appendChild(U.el('<p class="foe-turn">' + U.esc(K.tr("{who} moves.", { who })) + "</p>"));
      setTimeout(() => { if (C.state() === B && foeKey === key) C.resolve(null); }, U.motion() ? 650 : 200);
      return;
    }
    qte = defend(B, n.u, n.threat, (result) => { qte = null; C.resolve(result); });
    qte.mount(box);
  }
  // The shape of a blow, read from the enemy's move, and what gets you out of its way: jump a low
  // arrow or sweep, duck a high swing or arrow, sidestep a thrust or a charge. Block meets anything,
  // for half the harm.
  const SHAPES = {
    low: { need: "jump", line: "A low sweep at your legs", arrow: "An arrow, low, at your legs", y: 0.86 },
    high: { need: "duck", line: "A swing at your head", arrow: "An arrow at your head", y: 0.2 },
    thrust: { need: "side", line: "A straight thrust", y: 0.5 },
    charge: { need: "side", line: "A charge, head down", y: 0.55 }
  };
  const shapeFor = (id) => K.pick({ arrows: ["low", "high"], strike: ["high", "thrust", "low"], heavy: ["high", "charge"], disarm: ["thrust"], breaker: ["charge"] }[id] || ["high", "thrust"]);
  const CUT = { // leather cut-outs for what comes at you
    arrow: '<svg viewBox="-40 -8 80 16"><path d="M-38 0 L-26 -6 L-26 -2 L30 -2 L36 -7 L36 7 L30 2 L-26 2 L-26 6 Z"/></svg>',
    blade: '<svg viewBox="-30 -30 60 60"><path d="M-24 18 Q-30 -10 4 -26 Q-14 -6 -10 22 Z"/></svg>',
    charge: '<svg viewBox="-30 -20 60 40"><path d="M-28 0 L-8 -16 L-8 -6 L26 -6 L26 6 L-8 6 L-8 16 Z"/></svg>'
  };
  function defend(B, u, th, done) {
    const g = K.attr("grace");
    const T = 1.1 * th.speed, END = T * 1.32;
    const W = { perfect: 0.05 + g * 0.003, move: 0.13 + g * 0.008, block: 0.14 + g * 0.008 };
    const who = K.text(u.src || u.name), shape = shapeFor(th.id), S2 = SHAPES[shape];
    const what = th.id === "arrows" && S2.arrow ? S2.arrow : S2.line;
    const el = U.el('<div class="qte" role="group" aria-label="' + U.esc(K.tr("Meet the blow")) + '"><p class="qte-who"><b>' + U.esc(who) + "</b> · " + U.esc(K.tr(what)) + "</p>" +
      '<div class="qte-ring"><i class="mark"></i><i class="ring"></i></div><p class="qte-note" aria-live="assertive">' + U.esc(K.tr("Read the blow: jump, duck, sidestep or block, as the ring meets the mark. Swipe or use the arrow keys.")) + '</p><div class="btnrow qte-btns"></div></div>');
    const ring = el.querySelector(".ring"), note = el.querySelector(".qte-note");
    let t0 = 0, raf = 0, over = false, flyer = null;
    const LINES = { counter: "A perfect read! You strike back.", block: "Blocked.", dodge: "Clear!", graze: "Late: it grazes you.", early: "Too early.", late: "Too late.", wrong: "The wrong way!" };
    const P = C.player();
    const finish = (result, line, move) => {
      if (over) return;
      over = true; cancelAnimationFrame(raf); off();
      // Got out of its way: what was loosed flies on past you (over, under or beside). Otherwise it stops at you.
      if (flyer) { const f = flyer; if (result === "dodge" || result === "counter") { f.classList.add("past"); setTimeout(() => f.remove(), 520); } else { f.classList.add("gone"); setTimeout(() => f.remove(), 300); } }
      note.textContent = K.tr(LINES[line || result] || line);
      el.classList.add(result === "miss" ? "bad" : "good");
      // Your puppet does what you chose: a hop, a crouch, a step aside, the shield up.
      if (P && move) {
        if (move === "jump") { burst(P.uid, "act-jump", 760); pose(P.uid, "jump", 760); }
        else if (move === "duck") { burst(P.uid, "act-duck", 760); pose(P.uid, "duck", 760); }
        else if (move === "side") { burst(P.uid, "act-side", 760); pose(P.uid, "side", 760); }
        else pose(P.uid, "block", 700);
      }
      if (K.Sound) K.Sound.play(result === "miss" ? "hit" : result === "dodge" ? "tap" : "clang");
      setTimeout(() => done(result), U.motion() ? 420 : 120);
    };
    const now = () => (U.clock() - t0) / 1000; // game time: stands still while the game is paused
    const act = (move) => {
      if (over) return;
      const d = now() - T, a = Math.abs(d);
      if (move === "block") { if (a <= W.perfect) finish("counter", null, move); else if (a <= W.block) finish("block", null, move); else finish("miss", d < 0 ? "early" : "late", move); return; }
      if (move !== S2.need) return finish("miss", "wrong", move);
      if (a <= W.perfect) finish("counter", null, move);
      else if (a <= W.move) finish("dodge", null, move);
      else if (d > 0 && a <= W.move * 1.8) finish("block", "graze", move); // the right move, late: a graze
      else finish("miss", d < 0 ? "early" : "late", move);
    };
    const row = el.querySelector(".qte-btns");
    const bs = [["Jump ↑", "jump"], ["Duck ↓", "duck"], ["Sidestep ↔", "side"], ["Block", "block"]].map(([lbl, m]) => { const b = U.pressButton(lbl, () => act(m)); b.classList.add("mv-" + m); if (m !== "block") b.classList.add("secondary"); row.appendChild(b); return b; });
    const onKey = (e) => {
      if (e.repeat) return;
      const k = e.key, m = { ArrowUp: "jump", w: "jump", W: "jump", ArrowDown: "duck", s: "duck", S: "duck", ArrowLeft: "side", ArrowRight: "side", a: "side", A: "side", d: "side", D: "side", Shift: "side", " ": "block", Enter: "block", b: "block", B: "block" }[k];
      if (m) { e.preventDefault(); e.stopPropagation(); act(m); }
    };
    // Swipes anywhere outside the buttons: up, down, sideways.
    let sw = null;
    const pd = (e) => { if (e.target.closest("button")) return; sw = { x: e.clientX, y: e.clientY }; };
    const pu = (e) => { if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return; act(Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? "jump" : "duck") : "side"); };
    document.addEventListener("keydown", onKey, true); document.addEventListener("pointerdown", pd, true); document.addEventListener("pointerup", pu, true);
    const off = () => { document.removeEventListener("keydown", onKey, true); document.removeEventListener("pointerdown", pd, true); document.removeEventListener("pointerup", pu, true); };
    U.keys([]);
    // The enemy winds up; what he looses flies at you across the stage, at the height it will strike.
    pose(u.uid, th.id === "arrows" ? "aim" : "hold");
    const launch = () => {
      const ar = U.$("arena"), ae = actorEl(u.uid), pe = P && actorEl(P.uid);
      if (!ar || !ae || !pe || !U.motion()) return;
      const r0 = ar.getBoundingClientRect(), ra = ae.getBoundingClientRect(), rp = pe.getBoundingClientRect();
      const kind = th.id === "arrows" ? "arrow" : shape === "charge" ? "charge" : "blade";
      flyer = U.el('<i class="incoming ' + kind + " " + shape + '" aria-hidden="true">' + CUT[kind] + "</i>");
      const y = rp.top - r0.top + rp.height * S2.y;
      flyer.style.cssText = "left:" + (ra.left - r0.left + ra.width * 0.3) + "px;top:" + y + "px;--to:" + (rp.left - ra.left + rp.width * 0.2 - ra.width * 0.3) + "px;--dur:" + T + "s";
      ar.appendChild(flyer);
      requestAnimationFrame(() => flyer && flyer.classList.add("go"));
    };
    const tick = () => {
      if (!el.isConnected && over) return;
      const s = now();
      const p = Math.min(1, s / T);
      ring.style.transform = "translate(-50%, -50%) scale(" + Math.max(0.12, 1 - p * 0.7 - Math.max(0, s - T) * 0.6) + ")";
      if (s >= END) return finish("miss", "late");
      raf = requestAnimationFrame(tick);
    };
    return {
      mount(box) { if (el.parentNode !== box) box.appendChild(el); if (!t0) { try { el.scrollIntoView({ block: "nearest", behavior: U.motion() ? "smooth" : "auto" }); } catch (e) { /* old browsers */ } t0 = U.clock(); launch(); raf = requestAnimationFrame(tick); bs[3].focus({ preventScroll: true }); } },
      stop() { over = true; cancelAnimationFrame(raf); off(); if (flyer) flyer.remove(); }
    };
  }

  // ---------- The screen ----------
  U.renderBattle = function (B) {
    if (!B) return;
    U.redraw = () => { const L = U.$("leaf"); if (L) L.dataset.battle = ""; U.renderBattle(C.state() || B); };
    U.setNav(true);
    const enc = B.enc;
    const enemies = B.units.filter((u) => u.side === "enemy");
    if (!target || !enemies.find((e) => e.uid === target && e.hp > 0)) target = (enemies.find((e) => e.hp > 0) || {}).uid || null;
    U.where("<b>" + U.tr("Battle") + "</b><span>" + U.t(K.val(enc.title)) + " · " + (enc.rounds ? U.tr("round {n} of {m}", { n: Math.min(B.round, enc.rounds), m: enc.rounds }) : U.tr("round {n}", { n: B.round })) + "</span>");
    const friends = B.units.filter((u) => u.side !== "enemy");
    const leaf = U.$("leaf");
    // The painted stage with the figures is drawn once per fight, so they can move between draws.
    // The fight fills the screen on its painting, like the tests: the top bar and page fall away.
    // (Set on every draw: the screen's frame is reset between draws.)
    const deep = !!(U.inScene && !K.headless);
    leaf.className = "leaf fighting" + (deep ? " immersive" : "");
    if (deep) document.body.classList.add("intest");
    if (leaf.dataset.battle !== B.bid || !U.$("arena") || U.$("arena").querySelectorAll(".actor").length !== B.units.length) {
      if (deep) {
        const bg = FIGHT_BG[enc.id];
        // The fight's own background: tall on upright screens, its 16:9 painting on wide ones (all but the camp gate).
        U.setBackdrop(bg && (U.upright() ? U.tallOf(bg) : bg !== "fight_camp_gate_night") ? bg : K.val(enc.stage) || K.val(enc.art));
      }
      leaf.dataset.battle = B.bid;
      leaf.innerHTML = U.plate({ art: K.val(enc.art), keepArt: deep, caption: K.val(enc.caption), tag: enc.lethal ? "war" : "yours", tagText: K.tr(enc.lethal ? "Battle · you can die here" : "A fight"), heading: K.val(enc.title), noFigure: true }) +
        arenaHtml(B) + '<div class="text battle" id="battle-body"></div>';
      lastActs = B.acts.length; // nothing to replay on a fresh draw
      // Put the painting's ground under the fighters' feet, once they are laid out.
      if (deep) requestAnimationFrame(() => U.fitBackdrop(true));
    }
    const body = U.$("battle-body");
    body.innerHTML = '<div class="sides"><div class="side"><span class="lbl">' + U.tr("Your side") + "</span>" + friends.map((u) => unitCard(u, B)).join("") +
      '</div><div class="side"><span class="lbl">' + U.tr("Against you · tap to target") + "</span>" + enemies.map((u) => unitCard(u, B)).join("") + "</div></div>" +
      '<div id="battle-actions"></div><ol class="blog" id="blog" aria-live="polite">' + B.log.slice(-8).map((l) => "<li" + (l.ev ? ' class="ev"' : "") + ">" + U.esc(C.line(l)) + "</li>").join("") + "</ol>";
    // Blows are heard as well as seen.
    if (K.Sound && B.log.length !== lastLogLen) {
      const fresh = B.log.slice(lastLogLen);
      const lost = B.units.some((u) => lastHp[u.uid] != null && u.hp < lastHp[u.uid]);
      const gained = B.units.some((u) => lastHp[u.uid] != null && u.hp > lastHp[u.uid]);
      if (fresh.some((l) => l.ev)) K.Sound.play("gong");
      if (lost) K.Sound.play("hit"); else if (gained) K.Sound.play("heal");
    }
    animate(B);
    if (U.motion()) {
      for (const u of B.units) {
        const before = lastHp[u.uid];
        const el = body.querySelector('.unit[data-uid="' + u.uid + '"]');
        if (el && before != null && before !== u.hp) {
          const d = u.hp - before;
          el.classList.add(d < 0 ? "hit" : "healed");
          el.appendChild(U.el('<span class="dmg ' + (d < 0 ? "down" : "up") + '" aria-hidden="true">' + (d > 0 ? "+" : "") + d + "</span>"));
        }
      }
      const last = body.querySelector("#blog li:last-child");
      if (last && B.log.length !== lastLogLen) last.classList.add("fresh");
    }
    lastHp = Object.fromEntries(B.units.map((u) => [u.uid, u.hp]));
    lastLogLen = B.log.length;
    lastActs = B.acts.length;
    body.querySelectorAll(".unit.enemy").forEach((el) => el.addEventListener("click", () => { target = el.dataset.uid; U.renderBattle(B); }));
    const log = U.$("blog");
    log.scrollTop = log.scrollHeight;
    const box = U.$("battle-actions");
    const keys = [];

    if (B.over) {
      stopQte(); drums.stop();
      const msg = { win: K.val(enc.winLine) || "The fight is won.", lose: enc.lethal && !K.S.storyMode ? "You have fallen." : "You are beaten.", flee: "You leave the fight behind.", spare: "You let them live." }[B.over];
      if (K.Sound && !B._sounded) { B._sounded = true; if (B.over === "lose" && enc.lethal && !K.S.storyMode) K.Sound.play("fall"); }
      box.appendChild(U.el('<div class="result"><p><b>' + U.t(msg) + "</b></p></div>"));
      const done = () => { const cb = onEndCb; const out = C.end().over; onEndCb = null; const L = U.$("leaf"); if (L) L.dataset.battle = ""; document.body.classList.remove("intest"); cb(out); };
      const cont = U.button("cta", U.tr("Continue"), done);
      box.appendChild(cont);
      U.keys([done]);
      U.renderLedger();
      setTimeout(() => cont.focus({ preventScroll: true }), U.motion() ? 600 : 0);
      return;
    }
    // The enemies' turn, one at a time.
    if (B.queue && B.queue.length) { runFoes(B, box); U.renderLedger(); return; }

    const acts = U.el('<div class="actions"></div>');
    const all = C.available(), idle = all.filter((a) => a.idle);
    // Shouting for a friend is a once-a-battle thing: it waits with the other tools below, not among the moves.
    const call = all.find((a) => a.id === "call");
    all.filter((a) => !a.idle && a.id !== "call").forEach((a, i) => {
      const special = !["strike", "guard", "herbs"].includes(a.id);
      const extra = a.count != null ? " (" + a.count + ")" : "";
      const b = U.button("act" + (special ? " special" : ""), "<b>" + (i + 1) + ". " + U.esc(a.name + extra) + "</b><small>" + U.esc(a.why || a.desc) + "</small>");
      b.disabled = !!a.why;
      const run = () => C.act(a.id, a.target === "enemy" ? target : null);
      b.addEventListener("click", run);
      keys.push(a.why ? null : run);
      acts.appendChild(b);
    });
    box.appendChild(acts);
    // Moves that need allies, when you fight alone: named in one quiet line, not as dead buttons.
    if (idle.length) box.appendChild(U.el('<p class="idle-moves">' + U.esc(U.tr("No allies here for: {moves}", { moves: idle.map((a) => a.name).join(", ") })) + "</p>"));

    const tools = U.el('<div class="battle-tools"></div>');
    if (call && !call.why) { const cb = U.button("ghost call-help", U.esc(call.name), () => C.act("call", null)); cb.title = call.desc; tools.appendChild(cb); }
    C.fallen().forEach((u) => tools.appendChild(U.button("cta secondary", U.tr("Pull {name} out of the fighting", { name: K.text(u.src || u.name) }) + "<small>" + U.tr("Costs your turn") + "</small>", () => C.pull(u.uid))));
    C.spareable().forEach((e) => tools.appendChild(U.button("cta secondary", U.tr("Spare {name}", { name: K.text(e.src || e.name) }), () => C.spare(e.uid))));
    if (C.canFlee()) {
      const breaks = C.fleeBreaks();
      const label = breaks.length ? U.tr("Withdraw (breaks your vow: {vow!})", { vow: K.tr(K.VOWS[breaks[0]].name) }) : U.tr("Withdraw from the fight");
      let armed = false;
      const fb = U.button("ghost", label, () => {
        if (breaks.length && !armed) { armed = true; fb.textContent = K.tr("Tap again to break your vow and withdraw"); return; }
        C.flee();
      });
      tools.appendChild(fb);
    }
    if (tools.children.length) box.appendChild(tools);
    U.keys(keys);
    U.renderLedger();
  };

  K.on("combat", (B) => U.renderBattle(B));
})(window.K = window.K || {});
