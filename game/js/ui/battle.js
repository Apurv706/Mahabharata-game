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
  let qte = null;
  let groundWatch = null; // keeps the painting's ground under the fighters (see the fresh draw)
  let astraPick = false;
  // Live figures (js/ui/puppet-anim.js): each fighter's spring rig, by unit; allies who have made
  // their entrance; who was guarding at the last draw; and until when the moves are still playing.
  const rigs = new Map();
  let seenAllies = new Set(), lastGuard = new Set(), animUntil = 0;
  U.battleRigs = () => rigs; // for the screenshot checks  // the divine-weapon chooser is open         // the defence moment in progress

  U.startBattle = function (encId, onEnd) {
    target = null; lastHp = {}; lastLogLen = 0; lastActs = 0; foeKey = null; autoKey = null; stopQte();
    rigs.clear(); seenAllies = new Set(); lastGuard = new Set(); animUntil = 0;
    onEndCb = onEnd;
    // The great war opens each fight with the call to arms; other fights with a drum call.
    if (K.Sound && K.ENCOUNTERS[encId]) K.Sound.play(K.ENCOUNTERS[encId].lethal && K.S.act === 6 ? "callToArms" : "drumCall");
    if (K.Sound) K.Sound.mood("battle");
    C.stepNext = U.timed() && !K.headless && !U.assist();
    // A fight of another kind that is played live (a chariot duel, an archery duel, a mace duel, a carry:
    // ui/fightmodes.js) is played so only with motion on; otherwise, and under the tests, as a plain hold.
    const enc = K.ENCOUNTERS[encId], kind = enc && K.val(enc.kind);
    C.liveMode = kind && !K.headless && U.motion() && U.fightMode && U.fightMode.has(kind) ? kind : null;
    const B = C.start(encId, onEnd);
    C.liveMode = null;
    if (!B.mode) drums.start();
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
  // Each kind of enemy has its own outline, and strength shows in the shape: a stooped bandit with a
  // club, a guard in a turban, a soldier behind a shield, an archer's feathered cap, a crested horseman,
  // and a champion in gold scale armour, the biggest of the unnamed. Crowns are kept for the named.
  const NAMED = [[/Ugra/, "ugra"], [/Dushasana's/, "guard"], [/Dushasana/, "dushasana"], [/Karna/, "karna"], [/Bhima/, "bhima"], [/Brihannala/, "arjuna"], [/Ketan|boy/i, "boy"], [/Drona/, "drona"], [/^Satyaki$/, "satyaki"]];
  const SPECIAL = {
    Ashwatthama: { pronoun: "he", palette: ["#c9905a", "#3a2a3a", "#c9a24e"], headgear: "crown", crown: { gem: "#8a5aa0", tall: 0.95, trim: "#3a2a3a" }, gear: ["browgem"], item: "bow", stance: "hero", stage: "adult", big: true, size: 1.18 },
    Gandharva: { pronoun: "he", palette: ["#9fb07a", "#2f5a3a", "#d9c27a"], headgear: "feather", item: "spear", stage: "adult" },
    champion: { pronoun: "he", palette: ["#b8703b", "#7a1f2a", "#e2b55a"], headgear: "crest", hat: "#e2b55a", hatTrim: "#d9a53a", gear: ["scale"], item: "mace", stance: "proud", stage: "adult", size: 1.1 },
    archer: { pronoun: "he", palette: ["#9e6a40", "#5d3b2a", "#9f8250"], headgear: "capfeather", hat: "#5d3b2a", gear: ["bracer"], item: "bow", stance: "archer", stage: "adult" },
    rider: { pronoun: "he", palette: ["#a8703f", "#6e3026", "#c9a24e"], headgear: "crest", hat: "#a3302a", gear: ["buckler", "cuirass"], item: "sword", stance: "raised", stage: "adult", size: 1.04 },
    bandit: { pronoun: "he", palette: ["#9c6a42", "#6b5a3a", "#a8875a"], headgear: "scarf", hat: "#7a4a2a", gear: ["torn"], item: "club", stance: "stoop", stage: "adult", size: 0.9 },
    common: { pronoun: "he", palette: ["#9c6a42", "#6b5a3a", "#a8875a"], item: "staff", stage: "adult" }
  };
  function specFor(u) {
    if (u.side === "player") return K.puppetSpec(K.S);
    if (u.person && K.PUPPETS[u.person]) return U.puppetFor(u.person);
    const n = String(u.src || u.name);
    if (/charioteer/i.test(n)) return SPECIAL.rider; // Karna's charioteer is not Karna
    for (const [re, id] of NAMED) if (re.test(n)) return U.puppetFor(id);
    if (/Ashwatthama/.test(n)) return SPECIAL.Ashwatthama;
    if (/Gandharva/.test(n)) return SPECIAL.Gandharva;
    if (/champion|dented helmet/i.test(n)) return SPECIAL.champion;
    if (/archer|chariot/i.test(n)) return SPECIAL.archer;
    if (/horseman|rider|veteran/i.test(n)) return SPECIAL.rider;
    if (/club|raider|bandit/i.test(n)) return SPECIAL.bandit;
    if (/cowherd|villager/i.test(n)) return SPECIAL.common;
    if (/guard|bodyguard|captain|sentry/i.test(n)) return U.puppetFor("guard");
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
    e_dream: "fight_war_field", e_day1: "fight_war_field", e_wheel: "fight_war_field", e_day16: "fight_war_field", e_day18: "fight_war_field",
    e_guard: "fight_war_chariot", e_hunt: "fight_war_chariot", e_road: "fight_war_sunset", e_jaya: "fight_war_sunset", e_gate: "fight_war_sunset",
    e_night: "stage_battlefield_night", e_last_stand: "fight_chakravyuha_inner", e_ring: "fight_chakravyuha_inner", e_dushasana: "fight_war_camp", e_ep_carts: "fight_supply_carts", e_raid: "fight_camp_gate_night", e_ash: "fight_camp_gate_night"
  };
  Object.assign(FIGHT_BG, K.COMMAND_FIGHT_BG || {}); // the holding fights (content/command.js)
  U.FIGHT_BG = FIGHT_BG;
  function arenaHtml(B) {
    const stage = K.val(B.enc.stage) || K.val(B.enc.art);
    // A champion at your side (Satyaki) stands at full height, not shrunk like the other allies.
    const actor = (u) => '<span class="actor ' + u.side + (u.side === "ally" && (specFor(u).size || 0) >= 1.2 ? " champ" : "") + (u.hp <= 0 ? " down" : "") + (u.side === "enemy" && u.hp > 0 ? " far" : "") + '" data-uid="' + u.uid + '">' +
      U.puppet(specFor(u), { h: 150, flip: u.side === "enemy", pose: u.hp <= 0 ? "dead" : liveFigures() ? "live" : u.side === "player" ? "brace" : "stand", label: u.side === "player" ? K.tr("You") : null }) + '<span class="pops"></span></span>';
    const friends = B.units.filter((u) => u.side !== "enemy"), foes = B.units.filter((u) => u.side === "enemy");
    return '<div class="arena" id="arena" style="--stage:url(\'' + U.artUrl(stage) + '\')" aria-hidden="true"><div class="team left">' + friends.map(actor).join("") +
      '</div><div class="team right">' + foes.map(actor).join("") + '</div><div class="arena-flash"></div></div>';
  }
  const actorEl = (uid) => document.querySelector('#arena .actor[data-uid="' + uid + '"]');
  function pose(uid, p, ms) {
    const el = actorEl(uid);
    const svg = el && el.querySelector(".pp");
    if (!svg) return;
    const r = rigs.get(uid);
    if (r && r.svg === svg) return rigPose(uid, r, el, p, ms);
    svg.setAttribute("class", svg.getAttribute("class").replace(/pose-\S+/, "pose-" + p));
    // An enemy steps into the light to act, and back into the soft distance after.
    if (el.classList.contains("enemy")) el.classList.toggle("far", p === "stand" && !el.classList.contains("down"));
    clearTimeout(svg._t);
    if (ms) svg._t = setTimeout(() => { if (svg.isConnected && !el.classList.contains("down")) svg.setAttribute("class", svg.getAttribute("class").replace(/pose-\S+/, "pose-" + (el.classList.contains("player") ? "brace" : "stand"))); }, ms);
  }
  function burst(uid, cls, ms) { const el = actorEl(uid); if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms || 500); }
  function pop(uid, text, cls) { const el = actorEl(uid); if (!el) return; const p = U.el('<span class="pop ' + cls + '">' + U.esc(text) + "</span>"); el.querySelector(".pops").appendChild(p); setTimeout(() => p.remove(), 1300); }

  // ---------- Live figures ----------
  // Fighters move on springs: a wind-up before each blow, a freeze on contact, knockback, a slack fall,
  // and each move its own action (an aimed shot is drawn and held, a volley arcs, herbs are knelt over).
  // With reduced motion, or under the test harness, the CSS poses are used as before.
  function liveFigures() { return !K.headless && U.motion() && typeof U.rig === "function"; }
  const isBow = (svg) => !!(svg && svg.querySelector('.it:not(.it-w) path[d="M50 86 L50 166"]'));
  function rigUp(B) {
    rigs.clear();
    if (!liveFigures()) return;
    for (const u of B.units) {
      const el = actorEl(u.uid), svg = el && el.querySelector(".pp");
      if (!svg || u.hp <= 0 || !/\bpose-live\b/.test(svg.getAttribute("class"))) continue;
      const r = U.rig(svg, el, isBow(svg) ? "bowready" : (svg.dataset.stance && u.side === "enemy" ? svg.dataset.stance : "ready")); // each kind of enemy stands in its own way
      if (!r) continue;
      rigs.set(u.uid, r);
      // A friend who joins the fight comes in from the edge of the stage, saying something.
      if (u.side === "ally" && !seenAllies.has(u.uid)) {
        r.x.dx = -Math.max(140, (U.$("arena") || document.body).clientWidth * 0.45); r.apply();
        svg.classList.add("talk"); setTimeout(() => svg.classList.remove("talk"), 1100);
        animUntil = Math.max(animUntil, performance.now() + 700);
      }
    }
    B.units.forEach((u) => { if (u.side === "ally") seenAllies.add(u.uid); });
  }
  // The CSS pose names the screen uses, as the rig's poses.
  const RIGPOSE = { strike: "strike", block: "guard", kneel: "kneel", loose: "loose", aim: "draw", hold: "windup", jump: "jump", duck: "duck", side: "side",
    sneak: "sneak", push: "push", cheer: "cheer", speak: "speak", think: "think", fold: "fold", slump: "slump" };
  function rigPose(uid, r, el, p, ms) {
    if (el.classList.contains("enemy")) el.classList.toggle("far", (p === "stand" || p === "brace") && !el.classList.contains("down"));
    clearTimeout(r._t);
    if (p === "hit") { r.kick({ rot: -150, tx: -36, head: -180, armF: 140 }); return; }
    if (p === "fall") { r.fallDown(); return; }
    if (p === "turn") { // turning your back: the plain CSS turn
      r.stop(); rigs.delete(uid);
      r.svg.querySelectorAll("[style]").forEach((n) => n.removeAttribute("style")); el.style.translate = "";
      r.svg.setAttribute("class", r.svg.getAttribute("class").replace(/pose-\S+/, "pose-turn")); return;
    }
    if (p === "stand" || p === "brace") { r.home(); return; }
    r.set(RIGPOSE[p] || "strike", p === "strike" ? 1900 : 700, 0.5);
    if (p === "strike") r.t.dx = el.classList.contains("enemy") ? -lunge() : lunge();
    if (ms) r._t = setTimeout(() => { if (rigs.get(uid) === r && !el.classList.contains("down")) { r.t.dx = 0; r.home(); } }, ms);
  }
  const lunge = () => { const a = U.$("arena"); return Math.max(28, Math.min(70, (a ? a.clientHeight : 300) * 0.14)); };
  // Points on a figure, inside the arena: the drawing hand, the chest, the front foot.
  function point(uid, where) {
    const a = U.$("arena"), el = actorEl(uid), svg = el && el.querySelector(".pp");
    if (!a || !svg) return { x: 0, y: 0 };
    const s = a.getBoundingClientRect();
    const part = svg.querySelector(where === "hand" ? ".foreF" : where === "foot" ? ".shinF" : ".pp-body") || svg;
    const r = part.getBoundingClientRect();
    if (where === "hand") return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height * 0.45 };
    if (where === "foot") return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height * 0.8 };
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height * 0.38 };
  }
  // A blow lands: both figures hold for a beat, the struck one flashes, is knocked back and sheds a
  // few flakes of leather; a heavy blow shakes the stage. A blow taken on a guard glances off in sparks.
  function impact(u, d, heavy, guarded) {
    const r = rigs.get(u.uid), el = actorEl(u.uid), a = U.$("arena");
    if (!el) return;
    const dir = u.side === "enemy" ? 1 : -1;
    if (guarded) {
      U.rigFreeze(45); U.flingBits(a, "spark", point(u.uid, "hand"), 10, 20, null, true);
      if (r) r.kick({ rot: -120 * -dir, dx: dir * 140 });
      pop(u.uid, String(d), "down small"); return;
    }
    U.rigFreeze(heavy ? 65 : 40);
    el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 110);
    const k = heavy ? 1 : 0.55;
    if (r) r.kick({ rot: -260 * k, tx: -60 * k, head: -320 * k, armF: 240 * k, foreB: 300 * k, dx: dir * 260 * k });
    U.flingBits(a, "flake", point(u.uid, "chest"), heavy ? 9 : 5, 30, "#8a3a2a");
    pop(u.uid, String(d), "down");
    if (heavy && a) { a.classList.remove("shake"); void a.offsetWidth; a.classList.add("shake"); setTimeout(() => a.classList.remove("shake"), 260); }
  }
  const HEAVY = new Set(["aimed", "heavy", "crush", "breaker", "quake", "ridedown", "hamstring"]);
  const MELEE = new Set(["strike", "heavy", "breaker", "disarm", "crush", "nerve", "hamstring", "ridedown", "quake", "swerve"]);
  const SHOTS = new Set(["arrows", "aimed", "volley", "pin", "astra"]);
  // One move, played out on its figure; hit(target) is called at the moment each blow lands.
  async function playMove(a, u, targets, hit) {
    const r = rigs.get(u.uid);
    const el = actorEl(u.uid), ar = U.$("arena");
    if (!r || !el || !ar) { targets.forEach((t) => setTimeout(() => hit(t), 110)); return 400; }
    const W = U.wait, side = u.side === "enemy" ? -1 : 1;
    const first = targets[0];
    const shot = (r.bow && (a.id === "strike" || SHOTS.has(a.id))) || (SHOTS.has(a.id) && a.id !== "astra");
    if (a.id === "guard" || a.id === "brace") {
      r.set("guard", 900, 0.55);
      const ward = document.createElement("div"); ward.className = "ward"; ar.appendChild(ward);
      const h = point(u.uid, "chest"), size = ar.clientHeight * 0.3;
      Object.assign(ward.style, { left: (h.x - size * (side > 0 ? 0.25 : 0.75)) + "px", top: (h.y - size * 0.5) + "px", width: size + "px", height: size + "px", transform: "rotate(" + (side > 0 ? 10 : 190) + "deg)" });
      ward.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }], { duration: 1500 }).onfinish = () => ward.remove();
      targets.forEach((t) => hit(t));
      await W(1300); if (rigs.get(u.uid) === r) r.home();
      return 600;
    }
    if (["herbs", "salve", "steady"].includes(a.id)) {
      r.set("kneel", 420, 0.6); await W(320);
      el.classList.add("mending"); U.flingBits(ar, "mote", point(u.uid, "hand"), 12, 30, null, true);
      await W(300); U.flingBits(ar, "mote", point(u.uid, "chest"), 8, 40, null, true);
      targets.forEach((t) => hit(t));
      await W(500); el.classList.remove("mending"); if (rigs.get(u.uid) === r) r.home();
      return 1200;
    }
    if (shot && first) {
      if (a.id === "aimed") { r.set("draw", 260, 0.8); await W(240); r.tremble = 2.2; await W(420); r.tremble = 0; r.set("loose", 1600, 0.45); }
      else if (a.id === "volley") { r.set("drawUp", 320, 0.75); await W(330); r.set("looseUp", 1600, 0.45); }
      else if (a.id === "pin") { r.set("drawLow", 300, 0.75); await W(320); r.set("looseLow", 1600, 0.45); }
      else { r.set("draw", 900, 0.7); await W(150); r.set("loose", 1600, 0.3); }
      r.kick({ rot: -60 * side, armB: -200 });
      const hand = point(u.uid, "hand");
      if (a.id === "volley") {
        const list = targets.length === 1 ? [first, first, first] : targets.concat(targets).slice(0, Math.max(3, targets.length));
        const done = new Set();
        await Promise.all(list.map((t, i) => W(i * 90).then(() => { const p = point(t.uid, "chest"); p.x += (i - 1) * 8; return U.flyArrow(ar, hand, p, ar.clientHeight * 0.32, 520); }).then(() => { if (!done.has(t.uid)) { done.add(t.uid); hit(t); } })));
      } else if (a.id === "pin") {
        const foot = point(first.uid, "foot");
        const arrow = await U.flyArrow(ar, hand, { x: foot.x - 2, y: foot.y + 4 }, -18, 170, true);
        // Driven into the earth beside the foot: the tip buried, the shaft standing steeply.
        arrow.style.transform = "translate(" + (foot.x + 6 - arrow.offsetWidth) + "px," + (foot.y + 8 - arrow.offsetHeight / 2) + "px) rotate(" + (side > 0 ? 38 : 142) + "deg)";
        hit(first);
        const tr = rigs.get(first.uid);
        if (tr) { tr.set("strain", 300, 0.4); tr.pinned = 1; setTimeout(() => { tr.pinned = 0.4; tr.home(); }, 1200); setTimeout(() => { tr.pinned = 0; }, 2600); }
        setTimeout(() => arrow.remove(), 2600);
      } else {
        for (const t of targets) { await U.flyArrow(ar, hand, point(t.uid, "chest"), a.id === "aimed" ? 6 : 8, a.id === "aimed" ? 170 : 160); hit(t); }
      }
      await W(220); if (rigs.get(u.uid) === r) r.home();
      return 300;
    }
    if (MELEE.has(a.id) || targets.length) {
      if (r.pose !== "windup") { r.set("windup", 520, 0.7); await W(120); } // anticipation: the tell
      r.set("strike", 1900, 0.5); r.t.dx = side * lunge(); await W(55);       // the blow
      targets.forEach((t) => hit(t)); await W(90);
      r.t.dx = 0; r.set(r.baseName, 520, 0.42);                            // follow-through, and settle
      return 260;
    }
    rigPose(u.uid, r, el, POSE[a.id] || "strike", 650);
    return 650;
  }
  function animateLive(B, acts) {
    const arena = U.$("arena");
    const changed = B.units.filter((u) => lastHp[u.uid] != null && lastHp[u.uid] !== u.hp);
    const hurt = changed.filter((u) => u.hp < lastHp[u.uid]), healed = changed.filter((u) => u.hp > lastHp[u.uid]);
    const killed = hurt.filter((u) => u.hp <= 0);
    const finisher = B.over === "win" && killed.some((u) => u.side === "enemy");
    if (finisher && arena) { arena.classList.add("slowmo"); if (K.Sound) setTimeout(() => K.Sound.play("gong"), 300); }
    if (K.Sound && killed.some((u) => u.side === "ally" && u.person)) K.Sound.play("friendFalls");
    const landed = new Set();
    const land = (t) => {
      if (landed.has(t.uid)) return; landed.add(t.uid);
      const d = t.hp - lastSeen[t.uid];
      if (d > 0) { pop(t.uid, "+" + d, "up"); return; }
      impact(t, d, HEAVY.has(t._by) || -d >= t.maxHp * 0.18, guardWas.has(t.uid) && !t.status.guard);
      if (t.hp <= 0) setTimeout(() => { const el = actorEl(t.uid); if (el) el.classList.add("down"); const r = rigs.get(t.uid); if (r) r.fallDown(); else pose(t.uid, "fall"); }, finisher ? 160 : 70);
    };
    const lastSeen = Object.assign({}, lastHp), guardWas = new Set(lastGuard);
    let left = hurt.slice(), longest = 0;
    acts.forEach((a) => {
      const u = B.units.find((x) => x.uid === a.uid);
      if (!u) return;
      const friendly = u.side !== "enemy";
      let targets;
      if (["herbs", "salve", "steady", "rally"].includes(a.id)) targets = healed.filter((t) => t.side !== "enemy");
      else { targets = left.filter((t) => (t.side === "enemy") === friendly); left = left.filter((t) => !targets.includes(t)); }
      targets.forEach((t) => { t._by = a.id; });
      const t0 = performance.now();
      Promise.resolve(playMove(a, u, targets, land)).then(() => {}).catch(() => {});
      const est = { aimed: 1100, volley: 1000, pin: 700, herbs: 1200, salve: 1200, steady: 1200, guard: 400, brace: 400 }[a.id] || (rigs.get(u.uid) && rigs.get(u.uid).bow && a.id === "strike" ? 450 : 350);
      longest = Math.max(longest, est); void t0;
    });
    // Whatever was not anybody's move this time (a blow met at the ring, a bleed): it lands now.
    setTimeout(() => { left.forEach(land); healed.forEach(land); }, 110);
    animUntil = Math.max(animUntil, performance.now() + longest);
    B.lastDef = null;
  }

  // Play what happened since the last draw: who moved, who was hit, who fell.
  function animate(B) {
    const acts = B.acts.slice(lastActs);
    // A divine weapon: its own full-screen moment (ui/fx.js), which keeps to reduced motion itself.
    acts.forEach((a) => { if ((a.id === "astra" || (K.ASTRAS && K.ASTRAS[a.id])) && B.astraOut && U.astraFx) { const o = B.astraOut; B.astraOut = null; U.astraFx({ kind: o.kind, clash: o.clash, from: actorEl(a.uid), to: actorEl(o.uid) }); } });
    if (!U.motion()) return;
    if (rigs.size) { animateLive(B, acts); lastGuard = new Set(B.units.filter((u) => u.status.guard).map((u) => u.uid)); return; }
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

  // The pennant over the enemy a leader has marked, and on its card.
  const MARK_SVG = '<svg class="mark-flag" viewBox="0 0 20 24" aria-hidden="true"><path d="M4 2v21" stroke="#e2b866" stroke-width="2" stroke-linecap="round"/><path d="M5 3h12l-3.5 4.5L17 12H5z" fill="#d9822b" stroke="#e2b866" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  function syncMark(B) {
    const m = C.marked ? C.marked() : null;
    document.querySelectorAll("#arena .actor.enemy").forEach((el) => {
      // Who your moves will hit: a ring of light at that figure's feet.
      el.classList.toggle("targeted", !B.over && el.dataset.uid === target);
      const on = el.dataset.uid === m;
      el.classList.toggle("marked", on);
      let f = el.querySelector(":scope > .mark-flag");
      if (on && !f) el.insertAdjacentHTML("afterbegin", MARK_SVG);
      if (!on && f) f.remove();
    });
  }
  function unitCard(u, B) {
    const pct = Math.round((u.hp / u.maxHp) * 100);
    const st = Object.keys(u.status).map((s) => "<span>" + U.tr(K.STATUS_TEXT[s] || s) + "</span>").join("");
    const enemy = u.side === "enemy";
    const sel = (enemy && target === u.uid ? " sel" : "") + (enemy && C.marked && C.marked() === u.uid ? " marked" : "");
    const label = u.side === "player" ? K.tr("You") : K.text(u.src || u.name);
    return '<button type="button" class="unit ' + u.side + sel + (u.hp <= 0 ? " down" : "") + '" data-uid="' + u.uid + '"' + (!enemy || u.hp <= 0 || B.over ? " disabled" : "") + ">" +
      '<span class="nm">' + (u.person && U.portraitKey(u.person) ? U.thumb(U.portraitKey(u.person), "face") : "") + "<em>" + U.esc(label) + "</em><span>" + u.hp + " / " + u.maxHp + "</span></span>" +
      '<span class="hpbar"><i style="width:' + pct + '%"></i></span>' +
      (enemy && target === u.uid && u.hp > 0 && !B.over ? '<span class="tgt-chip">' + U.tr("Your target") + "</span>" : "") +
      (st ? '<span class="st">' + st + "</span>" : "") +
      (enemy ? intentLine(u) : "") +
      (enemy && C.marked && C.marked() === u.uid ? '<span class="markline">' + MARK_SVG + U.esc(K.tr(B.units.some((x) => x.side === "ally" && x.plural && x.hp > 0) ? "Marked: your company is on it" : "Marked: those beside you are on it")) + "</span>" : "") +
      (u.note ? '<span class="note">' + U.t(u.note) + "</span>" : "") + "</button>";
  }

  // ---------- Meeting a blow ----------
  function stopQte() { if (qte) { qte.stop(); qte = null; } }
  let autoKey = null; // the enemy turn that is playing out by itself, with its timer running
  function runFoes(B, box) {
    const n = C.nextFoe();
    if (!n) return false;
    const key = B.bid + ":" + B.round + ":" + n.u.uid + ":" + B.queue.length;
    const who = K.text(n.u.src || n.u.name);
    // A turn not aimed at you (a stunned foe losing his turn, a blow at someone else) plays out by
    // itself. A redraw in the middle (a tap on an enemy, a language switch) shows it again, and starts
    // its timer again if that was lost, so the fight never waits on nothing.
    const auto = () => {
      box.appendChild(U.el('<p class="foe-turn">' + U.esc(K.tr("{who} moves.", { who })) + "</p>"));
      if (autoKey === key) return;
      autoKey = key;
      setTimeout(() => { if (autoKey === key) autoKey = null; if (C.state() === B && foeKey === key && !B.over) C.resolve(null); }, U.motion() ? 650 : 200);
    };
    if (foeKey === key) { if (qte) qte.mount(box); else if (!n.threat) auto(); return true; }
    foeKey = key;
    stopQte();
    if (!n.threat) { auto(); return true; }
    qte = defend(B, n.u, n.threat, (result) => { qte = null; C.resolve(result); });
    qte.mount(box);
    return true;
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
    const W = { perfect: 0.065 + g * 0.004, move: 0.17 + g * 0.009, block: 0.2 + g * 0.01 }; // in seconds either side of the mark: a touch wider (2 Nov), a phone tap lands late
    const who = K.text(u.src || u.name), shape = shapeFor(th.id), S2 = SHAPES[shape];
    const what = th.id === "arrows" && S2.arrow ? S2.arrow : S2.line;
    const el = U.el('<div class="qte" role="group" aria-label="' + U.esc(K.tr("Meet the blow")) + '"><p class="qte-who"><b>' + U.esc(who) + "</b> · " + U.esc(K.tr(what)) + "</p>" +
      '<div class="qte-ring"><i class="mark"></i><i class="ring"></i></div><p class="qte-note" aria-live="assertive">' + U.esc(K.tr("Read the blow: jump, duck, sidestep or block, as the ring meets the mark. Swipe or use the arrow keys.")) + '</p><div class="btnrow qte-btns"></div></div>');
    const ring = el.querySelector(".ring"), note = el.querySelector(".qte-note");
    let t0 = 0, raf = 0, over = false, flyer = null, starting = false;
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
      if (over || !t0) return; // the blow has not begun: a press now is neither early nor late
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
      if ((!el.isConnected && over) || !t0) return;
      const s = now();
      const p = Math.min(1, s / T);
      ring.style.transform = "translate(-50%, -50%) scale(" + Math.max(0.12, 1 - p * 0.7 - Math.max(0, s - T) * 0.6) + ")";
      if (s >= END) return finish("miss", "late");
      raf = requestAnimationFrame(tick);
    };
    return {
      mount(box) {
        if (el.parentNode !== box) box.appendChild(el);
        if (t0 || starting) return;
        try { el.scrollIntoView({ block: "nearest", behavior: U.motion() ? "smooth" : "auto" }); } catch (e) { /* old browsers */ }
        // The blow comes once the last move has played out (an aimed shot is drawn and held).
        starting = true;
        setTimeout(() => { if (over) return; pose(u.uid, th.id === "arrows" ? "aim" : "hold"); t0 = U.clock(); launch(); raf = requestAnimationFrame(tick); bs[3].focus({ preventScroll: true }); }, Math.max(0, Math.min(1200, animUntil - performance.now())));
      },
      stop() { over = true; cancelAnimationFrame(raf); off(); if (flyer) flyer.remove(); }
    };
  }

  // ---------- The screen ----------
  U.renderBattle = function (B) {
    if (!B) return;
    // A fight played live takes the page as a test does; when it is over, the story goes straight on.
    if (B.mode) {
      if (B.over) { if (!onEndCb) return; stopQte(); drums.stop(); const cb = onEndCb; const out = C.end().over; onEndCb = null; const L = U.$("leaf"); if (L) L.dataset.battle = ""; document.body.classList.remove("intest"); cb(out); return; }
      const L = U.$("leaf");
      if (L.dataset.battle !== B.bid) { L.dataset.battle = B.bid; U.fightMode.play(B); }
      return;
    }
    if (C.state() === B) C.foesPending(); // a round whose last foes have fallen is closed before anything is drawn
    U.redraw = () => { const L = U.$("leaf"); if (L) L.dataset.battle = ""; U.renderBattle(C.state() || B); };
    U.setNav(true);
    const enc = B.enc;
    const enemies = B.units.filter((u) => u.side === "enemy");
    if (!target || !enemies.find((e) => e.uid === target && e.hp > 0)) target = (enemies.find((e) => e.hp > 0) || {}).uid || null;
    U.where("<b>" + U.tr("Battle") + "</b><span>" + U.t(K.val(enc.title)) + " · " + (enc.rounds ? U.tr("round {n} of {m}", { n: Math.min(B.round, enc.rounds), m: enc.rounds }) : U.tr("round {n}", { n: B.round })) + (B.rule && B.rule.status ? " · " + U.esc(B.rule.status(B)) : "") + "</span>");
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
        U.setBackdrop(bg && (!U.upright() || U.tallOf(bg)) ? bg : K.val(enc.stage) || K.val(enc.art));
      }
      leaf.dataset.battle = B.bid;
      leaf.innerHTML = U.plate({ art: K.val(enc.art), keepArt: deep, caption: K.val(enc.caption), tag: enc.lethal ? "war" : "yours", tagText: K.tr(enc.lethal ? "Battle · you can die here" : "A fight"), heading: K.val(enc.title), noFigure: true }) +
        arenaHtml(B) + '<div class="text battle" id="battle-body"></div>';
      lastActs = B.acts.length; // nothing to replay on a fresh draw
      rigUp(B);
      // Put the painting's ground under the fighters' feet, once they are laid out.
      if (deep) requestAnimationFrame(() => U.fitBackdrop(true));
      // And keep it there: whenever the figures' band or the moves' panel changes size (a chooser opens, a
      // card wraps, fonts arrive late on Safari), the painting is moved again. A frame's wait is not enough.
      if (groundWatch) groundWatch.disconnect();
      groundWatch = deep && window.ResizeObserver ? new ResizeObserver(() => { if (U.upright()) U.fitBackdrop(true); }) : null;
      if (groundWatch) ["arena", "battle-body"].forEach((id) => { const el = U.$(id); if (el) groundWatch.observe(el); });
    }
    const body = U.$("battle-body");
    body.innerHTML = '<div class="sides"><div class="side"><span class="lbl">' + U.tr("Your side") + "</span>" + friends.map((u) => unitCard(u, B)).join("") +
      '</div><div class="side"><span class="lbl">' + U.tr(C.canMark && C.canMark() ? "Against you · tap to mark" : "Against you · tap to target") + "</span>" + enemies.map((u) => unitCard(u, B)).join("") + "</div></div>" +
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
    // Picking out an enemy: your own target, and for a leader with people beside them, the company's mark.
    body.querySelectorAll(".unit.enemy").forEach((el) => el.addEventListener("click", () => { target = el.dataset.uid; if (C.mark) C.mark(target); U.renderBattle(B); }));
    syncMark(B);
    const log = U.$("blog");
    log.scrollTop = log.scrollHeight;
    const box = U.$("battle-actions");
    const keys = [];

    if (B.over) {
      stopQte(); drums.stop();
      // A dream fight does not end on a result: the field goes white, and you wake (scene.js U.wakeScene).
      // (Without motion, or under the test harness, it ends like any fight, on its line and Continue.)
      if (enc.dream && U.motion()) {
        if (B._whiting) return;
        B._whiting = true;
        const veil = U.el('<div class="dream-white" aria-hidden="true"></div>');
        document.body.appendChild(veil);
        requestAnimationFrame(() => requestAnimationFrame(() => veil.classList.add("on")));
        setTimeout(() => {
          if (!onEndCb) { veil.remove(); return; }
          const cb = onEndCb; const out = C.end().over; onEndCb = null; const L = U.$("leaf"); if (L) L.dataset.battle = ""; document.body.classList.remove("intest"); cb(out);
          setTimeout(() => veil.remove(), 400); // the waking scene opens on its own white underneath
        }, U.motion() ? 1300 : 200);
        return;
      }
      if (B.over === "flee") { const P = C.player(); if (P) pose(P.uid, "turn"); } // you turn your back on the fight
      const msg = { win: K.val(enc.winLine) || "The fight is won.", lose: K.val(enc.loseLine) || (enc.lethal && !K.S.storyMode ? "You have fallen." : "You are beaten."), flee: "You leave the fight behind.", spare: "You let them live." }[B.over];
      if (K.Sound && !B._sounded) { B._sounded = true; if (B.over === "lose" && enc.lethal && !K.S.storyMode) K.Sound.play("fall"); }
      box.appendChild(U.el('<div class="result"><p><b>' + U.t(msg) + "</b></p></div>"));
      const done = () => { if (!onEndCb) return; /* once */ const cb = onEndCb; const out = C.end().over; onEndCb = null; const L = U.$("leaf"); if (L) L.dataset.battle = ""; document.body.classList.remove("intest"); cb(out); };
      const cont = U.button("cta", U.tr("Continue"), done);
      box.appendChild(cont);
      U.keys([done]);
      U.renderLedger();
      setTimeout(() => cont.focus({ preventScroll: true }), U.motion() ? 600 : 0);
      return;
    }
    // The enemies' turn, one at a time.
    if (B.queue && B.queue.length && runFoes(B, box)) { U.renderLedger(); return; }

    const acts = U.el('<div class="actions"></div>');
    const all = C.available(), idle = all.filter((a) => a.idle);
    // Shouting for a friend is a once-a-battle thing: it waits with the other tools below, not among the moves.
    const call = all.find((a) => a.id === "call");
    // Several divine weapons share one card, "Invoke astra": with more than one ready, it opens a
    // chooser in place of the moves (each weapon, and Back). One mantra a battle, whichever is spoken.
    const isAstra = (a) => a.id === "astra" || (K.ASTRAS && K.ASTRAS[a.id]);
    const astras = all.filter((a) => isAstra(a) && !a.idle);
    if (astraPick && astras.filter((a) => !a.why).length > 1) {
      const pick = U.el('<div class="actions astra-pick"></div>');
      astras.filter((a) => !a.why).forEach((a, i) => {
        const b = U.button("act special", "<b>" + (i + 1) + ". " + U.esc(a.name) + "</b><small>" + U.esc(a.desc) + "</small>");
        const run = () => { astraPick = false; C.act(a.id, a.target === "enemy" ? target : null); };
        b.addEventListener("click", run); keys.push(run); pick.appendChild(b);
      });
      const back = () => { astraPick = false; U.renderBattle(B); };
      const bb = U.button("act", "<b>" + U.esc(U.tr("Back")) + "</b><small>" + U.esc(U.tr("Choose another move")) + "</small>", back);
      keys.push(back); pick.appendChild(bb);
      box.appendChild(pick); U.keys(keys); U.renderLedger();
      settleGround(); // the taller panel lifts the fighters
      return;
    }
    astraPick = false;
    const firstAstra = astras[0];
    // With several weapons, only the first stands for them all (as "Invoke astra").
    all.filter((a) => !a.idle && a.id !== "call" && !(isAstra(a) && astras.length > 1 && a !== firstAstra)).forEach((a, i) => {
      if (isAstra(a) && astras.length > 1) {
        const ready = astras.filter((x) => !x.why);
        a = Object.assign({}, a, { id: "astra-pick", name: K.tr("Invoke astra"), desc: K.tr("Choose which divine weapon to speak. One mantra a battle."), why: ready.length ? null : astras[0].why });
      }
      const special = !["strike", "guard", "herbs"].includes(a.id);
      const extra = a.count != null ? " (" + a.count + ")" : "";
      const b = U.button("act" + (special ? " special" : ""), "<b>" + (i + 1) + ". " + U.esc(a.name + extra) + "</b><small>" + U.esc(a.why || a.desc) + "</small>");
      b.disabled = !!a.why;
      b.dataset.move = a.id;
      b.title = a.why || a.desc; // on phones the card shows only the name
      const run = a.id === "astra-pick" ? () => { const ready = astras.filter((x) => !x.why); if (ready.length === 1) C.act(ready[0].id, ready[0].target === "enemy" ? target : null); else { astraPick = true; U.renderBattle(B); } } : () => { if (!C.act(a.id, a.target === "enemy" ? target : null)) U.renderBattle(C.state() || B); };
      b.addEventListener("click", run);
      keys.push(a.why ? null : run);
      acts.appendChild(b);
    });
    box.appendChild(acts);
    // Moves that need allies, when you fight alone: named in one quiet line, not as dead buttons.
    if (idle.length) box.appendChild(U.el('<p class="idle-moves">' + U.esc(U.tr("No allies here for: {moves}", { moves: idle.map((a) => a.name).join(", ") })) + "</p>"));

    const tools = U.el('<div class="battle-tools"></div>');
    if (call && !call.why) {
      // Who would come, and the risk to them: Charu has no armour.
      const near = enc.callHelp === undefined && K.friendsNear ? K.friendsNear(K.S, enc) : [];
      const note = near[0] === "charu" ? U.tr("Charu has no armour") : near[0] ? K.personName(near[0]) : "";
      const cb = U.button("ghost call-help", U.esc(call.name) + (note ? '<small class="call-note">' + U.esc(note) + "</small>" : ""), () => C.act("call", null)); cb.title = call.desc; tools.appendChild(cb);
    }
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
    // The moves' panel can change height from turn to turn (a tool appears, a card wraps): keep the painting's ground under the fighters.
    settleGround();
  };
  // For a moment after each draw, watch the fighters' feet: whenever they are not where the painting was
  // last fitted (Safari lays the page out later than Chrome, and fonts and images arrive late), fit again.
  let settleUntil = 0;
  function settleGround() {
    if (!U.upright()) return;
    // At once (measuring the feet lays the page out now), then again for a moment in case it moves.
    U.fitBackdrop(true);
    const running = settleUntil > performance.now();
    settleUntil = performance.now() + 1600;
    if (running) return;
    const tick = () => {
      if (!U.upright() || performance.now() > settleUntil) return;
      const f = U.feetY();
      if (f && (U.fitFeet == null || Math.abs(f - U.fitFeet) > 2)) U.fitBackdrop(true);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  K.on("combat", (B) => U.renderBattle(B));
})(window.K = window.K || {});
