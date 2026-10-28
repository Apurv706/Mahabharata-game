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
    if (K.ENCOUNTERS[encId] && K.ENCOUNTERS[encId].lethal && K.Sound) K.Sound.play("conch");
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
    Ashwatthama: { pronoun: "he", palette: ["#c9905a", "#3a2a3a", "#c9a24e"], headgear: "crownlet", item: "bow", stage: "adult", big: true },
    Gandharva: { pronoun: "he", palette: ["#9fb07a", "#2f5a3a", "#d9c27a"], headgear: "feather", item: "spear", stage: "adult" },
    archer: { pronoun: "he", palette: ["#9e6a40", "#5d3b2a", "#9f8250"], headgear: "band", item: "bow", stage: "adult" },
    rider: { pronoun: "he", palette: ["#a8703f", "#6e3026", "#c9a24e"], headgear: "turban", item: "sword", stage: "adult" },
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
    if (!U.motion()) return;
    const acts = B.acts.slice(lastActs);
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
  function defend(B, u, th, done) {
    const g = K.attr("grace");
    const T = 1.1 * th.speed, END = T * 1.32;
    const W = { perfect: 0.045 + g * 0.003, block: 0.12 + g * 0.008, dodge: 0.07 + g * 0.005 };
    const who = K.text(u.src || u.name);
    const el = U.el('<div class="qte" role="group" aria-label="' + U.esc(K.tr("Meet the blow")) + '"><p class="qte-who"><b>' + U.esc(who) + "</b> · " + U.esc(K.tr(th.name)) + " → " + U.esc(K.tr("you")) + "</p>" +
      '<div class="qte-ring"><i class="mark"></i><i class="ring"></i></div><p class="qte-note" aria-live="assertive">' + U.esc(K.tr("Block as the ring meets the mark. Dodge needs better timing.")) + '</p><div class="btnrow qte-btns"></div></div>');
    const ring = el.querySelector(".ring"), note = el.querySelector(".qte-note");
    let t0 = 0, raf = 0, over = false;
    const LINES = { counter: "Countered!", block: "Blocked.", dodge: "Dodged!", early: "Too early.", late: "Too late." };
    const finish = (result, line) => {
      if (over) return;
      over = true; cancelAnimationFrame(raf); off();
      note.textContent = K.tr(LINES[line || result] || line);
      el.classList.add(result === "miss" ? "bad" : "good");
      if (K.Sound) K.Sound.play(result === "miss" ? "hit" : result === "dodge" ? "tap" : "clang");
      setTimeout(() => done(result), U.motion() ? 380 : 120);
    };
    const now = () => (performance.now() - t0) / 1000;
    const block = () => { if (over) return; const d = now() - T; if (Math.abs(d) <= W.perfect) finish("counter"); else if (Math.abs(d) <= W.block) finish("block"); else finish("miss", d < 0 ? "early" : "late"); };
    const dodge = () => { if (over) return; const d = now() - T; if (Math.abs(d) <= W.dodge) finish("dodge"); else finish("miss", d < 0 ? "early" : "late"); };
    const row = el.querySelector(".qte-btns");
    const b1 = U.pressButton("Block", block), b2 = U.pressButton("Dodge", dodge);
    b2.classList.add("secondary");
    row.appendChild(b1); row.appendChild(b2);
    const onKey = (e) => {
      if (e.repeat) return;
      if (e.key === " " || e.key === "Enter" || e.key === "b" || e.key === "B") { e.preventDefault(); e.stopPropagation(); block(); }
      else if (e.key === "d" || e.key === "D" || e.key === "Shift") { e.preventDefault(); e.stopPropagation(); dodge(); }
    };
    document.addEventListener("keydown", onKey, true);
    const off = () => document.removeEventListener("keydown", onKey, true);
    U.keys([]);
    // The enemy winds up while the ring closes.
    pose(u.uid, th.id === "arrows" ? "aim" : "hold");
    const tick = () => {
      if (!el.isConnected && over) return;
      const s = now();
      const p = Math.min(1, s / T);
      ring.style.transform = "translate(-50%, -50%) scale(" + Math.max(0.12, 1 - p * 0.7 - Math.max(0, s - T) * 0.6) + ")";
      if (s >= END) return finish("miss", "late");
      raf = requestAnimationFrame(tick);
    };
    return {
      mount(box) { if (el.parentNode !== box) box.appendChild(el); if (!t0) { try { el.scrollIntoView({ block: "nearest", behavior: U.motion() ? "smooth" : "auto" }); } catch (e) { /* old browsers */ } t0 = performance.now(); raf = requestAnimationFrame(tick); b1.focus({ preventScroll: true }); } },
      stop() { over = true; cancelAnimationFrame(raf); off(); }
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
    U.where("<b>" + U.tr("Battle") + "</b>" + U.t(K.val(enc.title)) + " · " + (enc.rounds ? U.tr("round {n} of {m}", { n: Math.min(B.round, enc.rounds), m: enc.rounds }) : U.tr("round {n}", { n: B.round })));
    const friends = B.units.filter((u) => u.side !== "enemy");
    const leaf = U.$("leaf");
    // The painted stage with the figures is drawn once per fight, so they can move between draws.
    if (leaf.dataset.battle !== B.bid || !U.$("arena")) {
      leaf.className = "leaf";
      leaf.dataset.battle = B.bid;
      leaf.innerHTML = U.plate({ art: K.val(enc.art), caption: K.val(enc.caption), tag: enc.lethal ? "war" : "yours", tagText: K.tr(enc.lethal ? "Battle · you can die here" : "A fight"), heading: K.val(enc.title), noFigure: true }) +
        arenaHtml(B) + '<div class="text battle" id="battle-body"></div>';
      lastActs = B.acts.length; // nothing to replay on a fresh draw
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
      box.appendChild(U.el('<div class="result"><p><b>' + U.t(msg) + "</b></p></div>"));
      const done = () => { const cb = onEndCb; const out = C.end().over; onEndCb = null; const L = U.$("leaf"); if (L) L.dataset.battle = ""; cb(out); };
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
    C.available().forEach((a, i) => {
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

    const tools = U.el('<div class="battle-tools"></div>');
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
