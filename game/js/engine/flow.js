/* Scene flow, choices, skill checks and saves. */
(function (K) {
  "use strict";

  K.SCENES = {};
  K.ENCOUNTERS = {};
  K.scene = (def) => { K.SCENES[def.id] = def; return def; };
  K.scenes = (list) => list.forEach(K.scene);
  K.encounter = (def) => { K.ENCOUNTERS[def.id] = def; return def; };
  K.val = (v, S = K.S) => (typeof v === "function" ? v(S) : v);
  K.lastDelta = {};

  function addDelta(into, d) {
    for (const [k, v] of Object.entries(d || {})) into[k] = typeof v === "number" ? (into[k] || 0) + v : v;
    return into;
  }

  // Event slots: a few places in each life where one small event, drawn by chance at the first visit,
  // may happen (or nothing does). K.SLOTS[id] = { pool: [scene ids], then: scene id, none: 0..1 }.
  K.SLOTS = {};
  K.slot = (id, def) => { K.SLOTS[id] = def; };
  function slotScene(id, S) {
    const def = K.SLOTS[id];
    S.slots = S.slots || {};
    if (!(id in S.slots)) {
      const pool = def.pool.filter((e) => K.SCENES[e] && K.test(K.SCENES[e].when, S));
      S.slots[id] = pool.length && K.rng() >= (def.none ?? 0.3) ? K.pick(pool) : null;
    }
    S.slotThen = def.then;
    return S.slots[id] && !S.seen.includes(S.slots[id]) ? S.slots[id] : def.then;
  }

  // Optional scenes are skipped when their `when` condition fails.
  // Scenes that come first, when they apply: K.BEFORE[id] = [scene ids], each played once (unseen,
  // `when` passing) before the scene id is reached by any road. Each one's `next` is that scene.
  K.BEFORE = {};
  K.resolveScene = function (id, S = K.S) {
    id = K.val(id, S);
    const pre = (K.BEFORE[id] || []).find((p) => K.SCENES[p] && !S.seen.includes(p) && K.test(K.SCENES[p].when, S));
    if (pre) id = pre;
    for (let g = 0; K.SLOTS[id] && g < 5; g++) id = slotScene(id, S);
    let sc = K.SCENES[id];
    for (let guard = 0; sc && sc.when && !K.test(sc.when, S); guard++) {
      if (guard > 60) throw new Error("Scene skip loop at " + sc.id);
      let next = K.val(sc.skipTo, S);
      const pre2 = (K.BEFORE[next] || []).find((p) => K.SCENES[p] && !S.seen.includes(p) && K.test(K.SCENES[p].when, S));
      if (pre2) next = pre2;
      for (let g = 0; K.SLOTS[next] && g < 5; g++) next = slotScene(next, S);
      sc = K.SCENES[next];
    }
    if (!sc) throw new Error("Missing scene: " + K.val(id, S));
    return sc;
  };

  K.go = function (id) {
    const S = K.S;
    if (!S.alive) id = "end_death";
    const sc = K.resolveScene(id);
    S.scene = sc.id;
    if (sc.act && sc.act > S.act) drift(S, sc.act);
    if (sc.act) S.act = sc.act;
    // Going back to an earlier question after a closed way does not make you younger.
    if (sc.age != null) S.age = S.loopThen && S.loopThen.scene === sc.id ? Math.max(S.age, K.val(sc.age)) : K.val(sc.age);
    let delta = {};
    if (!S.seen.includes(sc.id)) {
      S.seen.push(sc.id);
      if (sc.enter) delta = K.apply(sc.enter);
    }
    K.lastDelta = delta;
    K.save("auto");
    K.emit("scene", sc);
    return sc;
  };

  // Close bonds drift when they are neglected: at each new act, a friend or spouse whose bond you did
  // not raise during the last act loses a point, and you notice.
  function drift(S, newAct) {
    // On the eve of the war, Bhishma blesses those who kept a vow of celibacy, as he did.
    if (newAct === 6 && K.hasVow("celibacy", S) && !S.flags.includes("bhishma_blessing")) {
      S.flags.push("bhishma_blessing");
      S.journal.push({ age: S.age, act: newAct, src: "On the eve of the war, Bhishma blessed you for keeping your vow, as he has kept his.", p: null, text: "On the eve of the war, Bhishma blessed you for keeping your vow, as he has kept his." });
    }
    for (const who of [S.friend, S.spouse]) {
      if (!who || S.dead.includes(who) || (S.bonds[who] ?? 0) < 4) continue;
      const last = (S.bondAct || {})[who];
      if (last != null && last >= S.act) continue;
      if (S.act < 2) continue;
      S.bonds[who] -= 1;
      (S.bondAct = S.bondAct || {})[who] = newAct - 1; // one point per neglected act, not more
      const src = "{who} and you have drifted a little. Neither of you said anything.", p = { who: K.PEOPLE[who]?.name || who };
      S.memories.push({ who, src, p, text: K.fill(src, p), age: S.age });
    }
  }

  K.choiceList = function (sc, S = K.S) {
    const crossed = (S.crossed || {})[sc.id] || {};
    return (K.val(sc.choices, S) || [])
      .map((c) => (crossed[c.id] ? { c, ok: false, crossed: crossed[c.id] } : { c, ok: K.test(c.req, S) }))
      .filter((x) => x.ok || x.crossed || (x.c.locked && K.test(x.c.showIf, S))); // no locked text = hidden when unavailable
  };

  // The failure rule: fail a test, and you get a second chance; fail that too, and the way is closed.
  // The choice that led to the test is crossed out, with the reason, and you go back to that earlier
  // question to choose again. At most once an act, never when it would leave nothing to choose, and
  // never back past something the epic has written. back: { scene, then, clear } on the test choice;
  // `then` is where the new choice leads (the test that follows it), `clear` the test's id, whose
  // second-chance flags are wiped so the next attempt starts fresh.
  K.loopBack = function (back, why, S = K.S) {
    if (!back || !back.scene || !K.SCENES[back.scene]) return null;
    S.loops = S.loops || [];
    if (S.loops.includes(S.act)) return null;
    const sc = K.SCENES[back.scene];
    if (sc.canon) return null;
    let picked = back.choice;
    if (!picked) for (let i = S.log.length - 1; i >= 0; i--) { const [sid, cid] = S.log[i].split(":"); if (sid === back.scene) { picked = cid; break; } }
    if (!picked) return null;
    const left = K.choiceList(sc, S).filter((x) => x.ok && x.c.id !== picked);
    if (!left.length) return null;
    S.loops.push(S.act);
    S.crossed = S.crossed || {};
    S.crossed[back.scene] = Object.assign({}, S.crossed[back.scene], { [picked]: why || "This way is closed now." });
    S.loopThen = { scene: back.scene, then: back.then || null };
    if (back.clear) S.flags = S.flags.filter((f) => !(f.startsWith(back.clear + "_") && f.endsWith("_again")));
    if (back.unflag) S.flags = S.flags.filter((f) => !back.unflag.includes(f));
    return back.scene;
  };

  // Merits from earlier in life that bear on a test (K.MERITS): +1 each, two at most either way.
  // Kept vows count too: honest persuasion under a vow never to lie, the common people's warnings
  // under a vow never to strike the unarmed.
  const VOW_MERITS = [
    { vow: "never_lie", on: ["statecraft"], n: 1, text: "Your word is trusted: you swore never to lie." },
    { vow: "spare_unarmed", on: ["stealth"], n: 1, text: "Common people warn you of ambushes: you swore never to strike the unarmed." }
  ];
  K.merits = function (ch, S = K.S) {
    const hits = (K.MERITS || []).filter((m) => S.flags.includes(m.flag) && (m.on.includes(ch.attr) || m.on.includes(ch.skill)))
      .concat(VOW_MERITS.filter((m) => K.hasVow(m.vow, S) && (m.on.includes(ch.attr) || m.on.includes(ch.skill))));
    const n = Math.max(-2, Math.min(2, hits.reduce((a, m) => a + m.n, 0)));
    return { n, hits };
  };
  K.record = (S = K.S) => (S.record = S.record || { won: 0, lost: 0, passed: 0, failed: 0, gamesWon: 0, gamesLost: 0, last: null });
  K.checkOdds = function (ch, S = K.S) {
    const base = (ch.attr ? K.attr(ch.attr, S) : 0) + (ch.skill ? S.skills[ch.skill] || 0 : 0) + (K.val(ch.bonus, S) || 0) + K.merits(ch, S).n;
    const need = ch.dc - base; // need a d6 roll >= need
    return Math.max(0, Math.min(1, (7 - need) / 6));
  };
  // "My word" (a vow never to lie): once in each act, a court believes you without a test, on a
  // persuasion (a statecraft test) that is not itself a lie.
  K.myWordReady = (c, S = K.S) => !!(c && c.check && c.check.skill === "statecraft" && K.hasVow("never_lie", S) && S.myWord !== S.act && !K.vowBreaksFor(c.tags, S).length && !c.peril);
  K.checkLabel = function (ch) {
    const parts = [ch.attr && K.ATTRS[ch.attr], ch.skill && K.SKILLS[ch.skill]].filter(Boolean).map(K.tr);
    return parts.join(" + ");
  };

  // Peril: some checks and tests set you against someone who can have you killed or locked away.
  // Fail one while out of your depth (under an even chance on a check, or below K.PERIL_MIN in the
  // test's attribute and skill) and the failure is death or a cell, not a bruise. A capable player
  // who fails gets the ordinary failure. Story mode turns a death into a scar, as everywhere else.
  K.PERIL_MIN = 4;
  K.inPeril = function (c, S = K.S) {
    if (!c || !c.peril) return false;
    if (c.check) return K.checkOdds(c.check, S) < 0.5;
    const t = c.trial || {};
    return (t.attr ? K.attr(t.attr, S) : 0) + (t.skill ? S.skills[t.skill] || 0 : 0) + K.merits({ attr: t.attr, skill: t.skill }, S).n < K.PERIL_MIN;
  };
  K.perilNote = function (c, S = K.S) {
    if (!K.inPeril(c, S)) return null;
    const p = K.val(c.peril, S);
    return p.kind === "death" ? K.tr("Danger: failing could cost your life") : K.tr("Danger: failing could mean a cell");
  };

  // ▲/▼ previews are generated from the same data the engine applies.
  K.preview = function (c, S = K.S) {
    const out = [];
    const fx = typeof c.fx === "object" && c.fx ? c.fx : {};
    const sign = (n) => (n > 0 ? "▲ " : "▼ ");
    const cls = (n) => (n > 0 ? "up" : "down");
    for (const [k, n] of Object.entries(fx.duty || {})) out.push([cls(n), sign(n) + K.tr(K.DUTIES[k])]);
    for (const [k, n] of Object.entries(fx.bond || {})) out.push([cls(n), sign(n) + K.personName(k, S)]);
    for (const [k, n] of Object.entries(fx.rep || {})) out.push([cls(n), sign(n) + K.tr(K.FACTIONS[k])]);
    for (const [k, n] of Object.entries(fx.skill || {})) out.push([cls(n), sign(n) + K.tr(K.SKILLS[k])]);
    for (const [k, n] of Object.entries(fx.attr || {})) out.push([cls(n), sign(n) + K.tr(K.ATTRS[k])]);
    if (fx.vowTake) {
      const V = K.VOWS[fx.vowTake];
      out.push(["vow", K.tr("Vow: {vow}", { vow: K.tr(V.name) })]);
      if (V.keep) out.push(["up", K.tr("Kept: {gift}", { gift: K.tr(V.keep) })]);
      const w = K.watcherNames(fx.vowTake, S);
      if (w) out.push(["", K.tr("Watched by {who}", { who: w })]);
      if (V.price) out.push(["down", K.tr("Broken: {price}", { price: K.tr(V.price) })]);
    }
    if (fx.boon) out.push(["up", K.tr("Gain: {boon}", { boon: K.tr(K.BOONS[fx.boon].name) })]);
    // A choice that would break a vow says so, with who will not forgive it and what it costs.
    for (const id of K.vowBreaksFor(c.tags, S)) {
      const V = K.VOWS[id], w = K.watcherNames(id, S, true);
      out.push(["down", [K.tr("Breaks vow: {vow}", { vow: K.tr(V.name) }), w && K.tr("{who} will not forgive it", { who: w }), V.priceShort && K.tr(V.priceShort)].filter(Boolean).join(" · ")]);
    }
    // A friendship that would fall below 3 ends: said before you choose (a bond lost, or a vow it shared broken).
    if (S.friend) {
      const loss = Math.min(0, (fx.bond || {})[S.friend] || 0) - (K.vowBreaksFor(c.tags, S).some((id) => (K.VOWS[id].watchers || []).includes(S.friend)) ? 3 : 0);
      const karna = S.friend === "karna" && K.vowBreaksFor(c.tags, S).includes("spare_karna");
      if (karna || (loss < 0 && (S.bonds[S.friend] ?? 3) + loss < 3)) out.push(["down danger", K.tr("Ends your friendship with {who}", { who: K.personName(S.friend, S) })]);
    }
    const ab = K.astraBreaksFor(c.tags, S);
    if (ab) out.push(["down", K.tr(ab.takes ? "Breaks the weapon's condition: {who} will take it back" : "Breaks the weapon's condition: its mantra will fail you", { who: K.tr(ab.who) })]);
    if (fx.memory) out.push(["", fx.memory[0] === "all" ? K.tr("People will remember") : K.tr("{who} will remember", { who: K.personName(fx.memory[0], S) })]);
    if (c.check && K.myWordReady(c, S)) out.push(["up", K.tr("My word: the court will believe you without a test")]);
    else if (c.check) {
      out.push(["check", K.tr("Test of {what}: {pct}%", { what: K.checkLabel(c.check), pct: Math.round(K.checkOdds(c.check, S) * 100) })]);
      // A risk: what a failure would cost, shown before you choose.
      const lose = c.check.fail && c.check.fail.fx && c.check.fail.fx.lose;
      const what = lose && (typeof lose === "string" ? lose : lose.what);
      if (what === "heirloom" ? K.heirloomAtRisk(S) : what && (S.items[what] || 0) > 0) out.push(["down", K.tr("Risk: {what}", { what: what === "heirloom" ? K.low(K.tr(K.HEIRLOOMS[S.heirloom].name)) : K.tr(what === "herbs" ? "a bundle of herbs" : "your coins") })]);
      const m = K.merits(c.check, S);
      if (m.n) out.push([m.n > 0 ? "up" : "down", K.tr(m.n > 0 ? "Your past helps (+{n})" : "Your past counts against you ({n})", { n: m.n })]);
    }
    const danger = K.perilNote(c, S);
    if (danger) out.push(["down danger", danger]);
    if (c.combat) out.push(["combat", K.tr("Leads to a fight")]);
    const hint = K.val(c.hint, S);
    if (hint) out.push(["", K.text(hint, null, S)]);
    return out;
  };

  // Applies a choice. Returns what the UI should do next.
  K.choose = function (sc, c, outcome) {
    const S = K.S;
    const dyn = c.resolve ? c.resolve(S) : null; // decided from the state at the moment of choice
    const delta = {};
    const res = { text: null, check: null, combat: c.combat || null, next: null, after: null };
    const perilous = K.inPeril(c, S); // judged before this choice changes anything
    let peril = null;
    addDelta(delta, K.apply(c.fx));
    addDelta(delta, K.apply(dyn));
    if (c.check && K.myWordReady(c, S)) {
      // Your word is enough: no roll.
      S.myWord = S.act;
      const br = c.check.pass || {};
      res.check = { pass: true, word: true, ch: c.check };
      K.record().passed++;
      addDelta(delta, K.apply(br.fx));
      if (br.text) res.text = K.val(br.text);
      if (br.next) res.next = K.val(br.next);
      if (br.combat) res.combat = br.combat;
    } else if (c.check) {
      const ch = c.check;
      const roll = K.roll(6);
      const base = (ch.attr ? K.attr(ch.attr) : 0) + (ch.skill ? S.skills[ch.skill] || 0 : 0) + (K.val(ch.bonus) || 0) + K.merits(ch).n;
      const pass = base + roll >= ch.dc;
      K.record()[pass ? "passed" : "failed"]++;
      const br = (pass ? ch.pass : ch.fail) || {};
      res.check = { pass, roll, total: base + roll, dc: ch.dc, ch };
      addDelta(delta, K.apply(br.fx));
      if (br.text) res.text = K.val(br.text); // raw English: the UI translates and fills it
      if (br.next) res.next = K.val(br.next);
      if (br.combat) res.combat = br.combat;
      if (!pass && perilous) peril = K.val(c.peril, S);
    }
    if (c.game && outcome) { // a game or action test played inside the scene picks its branch
      res.outcome = outcome;
      const practice = c.trial && c.trial.practice; // a first test that does not count
      const br = c[outcome] || (outcome === "close" ? c.lose : null) || {};
      if (!practice) K.record()[outcome === "win" ? "gamesWon" : "gamesLost"] += 1 + (outcome !== "win" && br.penalty ? 1 : 0); // a failed second chance counts twice
      addDelta(delta, K.apply(br.fx));
      if (br.text) res.text = K.val(br.text);
      if (br.next) res.next = K.val(br.next);
      // A second outright failure, out of your depth, against someone who does not forgive.
      if (outcome === "lose" && br.penalty && perilous) peril = K.val(c.peril, S);
      // A second failure closes this way and sends you back to choose again (see K.loopBack).
      if (!peril && outcome !== "win" && br.penalty && c.back) {
        const back = K.loopBack(c.back, K.val(c.back.why || c.crossWhy));
        if (back) { res.next = back; res.looped = true; }
      }
    }
    addDelta(delta, K.breakTags(c.tags));
    S.log.push(sc.id + ":" + c.id);
    if (!res.text && c.text) res.text = K.val(c.text);
    res.next = res.next || K.val(c.next) || K.val(sc.next);
    if (peril) {
      res.peril = peril.kind;
      if (peril.kind === "death") {
        addDelta(delta, K.apply({ die: true, deathText: peril.deathText, flag: ["peril_death"].concat(peril.flag || []) }));
        if (!S.alive) S.deathAt = { art: peril.art || null, caption: peril.caption || null, act: S.act }; // the ending shows where it happened
        res.text = S.alive ? peril.spareText || "You live, barely. The scar will remind you for the rest of your life." : peril.text;
      } else {
        // A cell: x_captive offers a way out (a test of stealth) or the long wait; then the story
        // goes on from where it would have gone (or from peril.then, when the next scene could not
        // have happened with you locked up).
        S.captive = { by: peril.by, place: peril.place, then: peril.then || res.next, waitThen: peril.waitThen || null, act: S.act };
        S.flags = S.flags.filter((f) => !f.startsWith("x_captive_")); // a second time in a cell starts fresh
        addDelta(delta, K.apply(Object.assign({ flag: ["captive", "was_imprisoned"] }, peril.journal ? { journal: peril.journal } : {})));
        res.text = peril.text;
        res.next = "x_captive";
        res.after = null;
      }
    }
    // Back at an earlier question after a closed way: the new choice leads straight to its test.
    if (S.loopThen && S.loopThen.scene === sc.id && !res.looped && !(res.check && !res.check.pass)) {
      if (S.loopThen.then && !c.game && !c.combat) res.next = S.loopThen.then;
      S.loopThen = null;
    }
    if (sc.after && !c.noAfter && !(peril && peril.kind !== "death")) res.after = K.val(sc.after);
    if (!S.alive) { res.next = "end_death"; res.combat = null; res.after = null; }
    K.lastDelta = delta;
    return res;
  };

  // Called by the combat layer when a fight ends.
  K.combatOutcome = function (encId, outcome, fallbackNext) {
    const S = K.S;
    const enc = K.ENCOUNTERS[encId];
    const br = enc[outcome] || {};
    const delta = K.apply(br.fx);
    const rec = K.record();
    if (outcome === "win" || outcome === "spare") { rec.won++; rec.last = "won"; }
    else if (outcome === "lose") { rec.lost++; rec.last = "lost"; }
    else rec.last = "fled";
    // A vow never to strike the unarmed: a foe you spared may one day pull you out of a deadly fight.
    if (outcome === "spare" && K.hasVow("spare_unarmed", S)) S.spared = (S.spared || 0) + 1;
    let saved = null;
    if (outcome === "lose" && enc.lethal && !S.storyMode && S.spared && K.hasVow("spare_unarmed", S) && !S.flags.includes("saved_by_spared")) {
      K.apply({ flag: "saved_by_spared", injury: enc.injury || "scar", journal: "A soldier you once let live dragged you out of a deadly fight. He said he was only paying a debt." });
      saved = "As you go down, someone drags you out of the press by your collar. A soldier you once let live. \"Now we are even,\" he says, and is gone.";
    } else if (outcome === "lose" && enc.lethal) {
      if (S.storyMode) K.apply({ injury: enc.injury || "scar" });
      else { S.alive = false; S.deathText = K.val(br.deathText) || enc.deathText || "You fell in battle."; }
    }
    // Holding firm through a deadly fight under a vow never to retreat makes you one point surer.
    if (outcome === "win" && enc.lethal && K.hasVow("never_retreat", S) && !S.flags.includes("held_firm")) {
      K.apply({ flag: "held_firm", journal: "You held firm through a deadly fight, as you swore you would. Your hand is surer for it." });
    }
    K.lastDelta = delta;
    if (saved) return { text: saved, next: S.alive ? K.val(br.next) || fallbackNext : "end_death" };
    return {
      text: br.text ? K.val(br.text) : null,
      next: S.alive ? K.val(br.next) || fallbackNext : "end_death"
    };
  };

  // ---------- Saves (per-browser; also exportable as a code) ----------
  const KEY = "kurukshetra.v2";
  K.store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  K.save = function (slot) {
    const S = K.S;
    if (!S || !K.SCENES[S.scene]) return false;
    return K.store.set(KEY + "." + slot, JSON.stringify(S));
  };
  // Saves from before the Yadava homeland moved from Dwaraka to Mathura.
  K.migrate = function (s) {
    if (s && s.origin === "dwaraka") { s.origin = "mathura"; s.flags = (s.flags || []).map((f) => (f === "origin_dwaraka" ? "origin_mathura" : f)); }
    return s;
  };
  K.loadSlot = function (slot) {
    const t = K.store.get(KEY + "." + slot);
    if (!t) return null;
    try { const s = K.migrate(JSON.parse(t)); return s && s.v === 2 && K.SCENES[s.scene] ? s : null; } catch (e) { return null; }
  };
  K.deleteSlot = (slot) => K.store.del(KEY + "." + slot);
  K.prefs = function (patch) {
    let p = {};
    try { p = JSON.parse(K.store.get(KEY + ".prefs") || "{}"); } catch (e) { p = {}; }
    if (patch) { Object.assign(p, patch); K.store.set(KEY + ".prefs", JSON.stringify(p)); }
    return p;
  };
  K.exportCode = () => btoa(unescape(encodeURIComponent(JSON.stringify(K.S))));
  K.importCode = function (txt) {
    txt = String(txt || "").trim();
    let s;
    try { s = JSON.parse(txt); } catch (e) {
      try { s = JSON.parse(decodeURIComponent(escape(atob(txt)))); } catch (e2) { throw new Error(K.tr("That save code could not be read. Copy the whole code and try again.")); }
    }
    K.migrate(s);
    if (!s || s.v !== 2 || !K.SCENES[s.scene]) throw new Error(K.tr("That save code is from a different version of the game."));
    return s;
  };
})(window.K = window.K || {});
