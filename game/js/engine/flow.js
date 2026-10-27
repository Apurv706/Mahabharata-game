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
  K.resolveScene = function (id, S = K.S) {
    id = K.val(id, S);
    for (let g = 0; K.SLOTS[id] && g < 5; g++) id = slotScene(id, S);
    let sc = K.SCENES[id];
    for (let guard = 0; sc && sc.when && !K.test(sc.when, S); guard++) {
      if (guard > 60) throw new Error("Scene skip loop at " + sc.id);
      let next = K.val(sc.skipTo, S);
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
    if (sc.age != null) S.age = K.val(sc.age);
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
    return (K.val(sc.choices, S) || [])
      .map((c) => ({ c, ok: K.test(c.req, S) }))
      .filter((x) => x.ok || (x.c.locked && K.test(x.c.showIf, S))); // no locked text = hidden when unavailable
  };

  // Merits from earlier in life that bear on a test (K.MERITS): +1 each, two at most either way.
  K.merits = function (ch, S = K.S) {
    const hits = (K.MERITS || []).filter((m) => S.flags.includes(m.flag) && (m.on.includes(ch.attr) || m.on.includes(ch.skill)));
    const n = Math.max(-2, Math.min(2, hits.reduce((a, m) => a + m.n, 0)));
    return { n, hits };
  };
  K.record = (S = K.S) => (S.record = S.record || { won: 0, lost: 0, passed: 0, failed: 0, gamesWon: 0, gamesLost: 0, last: null });
  K.checkOdds = function (ch, S = K.S) {
    const base = (ch.attr ? K.attr(ch.attr, S) : 0) + (ch.skill ? S.skills[ch.skill] || 0 : 0) + (K.val(ch.bonus, S) || 0) + K.merits(ch, S).n;
    const need = ch.dc - base; // need a d6 roll >= need
    return Math.max(0, Math.min(1, (7 - need) / 6));
  };
  K.checkLabel = function (ch) {
    const parts = [ch.attr && K.ATTRS[ch.attr], ch.skill && K.SKILLS[ch.skill]].filter(Boolean).map(K.tr);
    return parts.join(" + ");
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
    if (fx.vowTake) out.push(["vow", K.tr("Vow: {vow}", { vow: K.tr(K.VOWS[fx.vowTake].name) })]);
    if (fx.boon) out.push(["up", K.tr("Gain: {boon}", { boon: K.tr(K.BOONS[fx.boon].name) })]);
    for (const id of K.vowBreaksFor(c.tags, S)) out.push(["down", K.tr("Breaks vow: {vow}", { vow: K.tr(K.VOWS[id].name) })]);
    if (fx.memory) out.push(["", fx.memory[0] === "all" ? K.tr("People will remember") : K.tr("{who} will remember", { who: K.personName(fx.memory[0], S) })]);
    if (c.check) {
      out.push(["check", K.tr("Test of {what}: {pct}%", { what: K.checkLabel(c.check), pct: Math.round(K.checkOdds(c.check, S) * 100) })]);
      const m = K.merits(c.check, S);
      if (m.n) out.push([m.n > 0 ? "up" : "down", K.tr(m.n > 0 ? "Your past helps (+{n})" : "Your past counts against you ({n})", { n: m.n })]);
    }
    if (c.combat) out.push(["combat", K.tr("Leads to a fight")]);
    if (c.hint) out.push(["", K.text(K.val(c.hint, S), null, S)]);
    return out;
  };

  // Applies a choice. Returns what the UI should do next.
  K.choose = function (sc, c, outcome) {
    const S = K.S;
    const dyn = c.resolve ? c.resolve(S) : null; // decided from the state at the moment of choice
    const delta = {};
    const res = { text: null, check: null, combat: c.combat || null, next: null, after: null };
    addDelta(delta, K.apply(c.fx));
    addDelta(delta, K.apply(dyn));
    if (c.check) {
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
    }
    if (c.game && outcome) { // a game played inside the scene (ui/games.js) picks its branch
      K.record()[outcome === "win" ? "gamesWon" : "gamesLost"]++;
      const br = c[outcome] || {};
      addDelta(delta, K.apply(br.fx));
      if (br.text) res.text = K.val(br.text);
      if (br.next) res.next = K.val(br.next);
    }
    for (const id of K.vowBreaksFor(c.tags)) addDelta(delta, K.apply({ vowBreak: id }));
    S.log.push(sc.id + ":" + c.id);
    if (!res.text && c.text) res.text = K.val(c.text);
    res.next = res.next || K.val(c.next) || K.val(sc.next);
    if (sc.after && !c.noAfter) res.after = K.val(sc.after);
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
    if (outcome === "lose" && enc.lethal) {
      if (S.storyMode) K.apply({ injury: enc.injury || "scar" });
      else { S.alive = false; S.deathText = K.val(br.deathText) || enc.deathText || "You fell in battle."; }
    }
    K.lastDelta = delta;
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
