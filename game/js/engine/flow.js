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

  // Optional scenes are skipped when their `when` condition fails.
  K.resolveScene = function (id, S = K.S) {
    let sc = K.SCENES[K.val(id, S)];
    for (let guard = 0; sc && sc.when && !K.test(sc.when, S); guard++) {
      if (guard > 60) throw new Error("Scene skip loop at " + sc.id);
      sc = K.SCENES[K.val(sc.skipTo, S)];
    }
    if (!sc) throw new Error("Missing scene: " + K.val(id, S));
    return sc;
  };

  K.go = function (id) {
    const S = K.S;
    if (!S.alive) id = "end_death";
    const sc = K.resolveScene(id);
    S.scene = sc.id;
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

  K.choiceList = function (sc, S = K.S) {
    return (K.val(sc.choices, S) || [])
      .map((c) => ({ c, ok: K.test(c.req, S) }))
      .filter((x) => x.ok || (x.c.locked && K.test(x.c.showIf, S))); // no locked text = hidden when unavailable
  };

  K.checkOdds = function (ch, S = K.S) {
    const base = (ch.attr ? K.attr(ch.attr, S) : 0) + (ch.skill ? S.skills[ch.skill] || 0 : 0) + (K.val(ch.bonus, S) || 0);
    const need = ch.dc - base; // need a d6 roll >= need
    return Math.max(0, Math.min(1, (7 - need) / 6));
  };
  K.checkLabel = function (ch) {
    const parts = [ch.attr && K.ATTRS[ch.attr], ch.skill && K.SKILLS[ch.skill]].filter(Boolean);
    return parts.join(" + ");
  };

  // ▲/▼ previews are generated from the same data the engine applies.
  K.preview = function (c, S = K.S) {
    const out = [];
    const fx = typeof c.fx === "object" && c.fx ? c.fx : {};
    const sign = (n) => (n > 0 ? "▲ " : "▼ ");
    const cls = (n) => (n > 0 ? "up" : "down");
    for (const [k, n] of Object.entries(fx.duty || {})) out.push([cls(n), sign(n) + K.DUTIES[k]]);
    for (const [k, n] of Object.entries(fx.bond || {})) out.push([cls(n), sign(n) + K.personName(k, S)]);
    for (const [k, n] of Object.entries(fx.rep || {})) out.push([cls(n), sign(n) + K.FACTIONS[k]]);
    for (const [k, n] of Object.entries(fx.skill || {})) out.push([cls(n), sign(n) + K.SKILLS[k]]);
    for (const [k, n] of Object.entries(fx.attr || {})) out.push([cls(n), sign(n) + K.ATTRS[k]]);
    if (fx.vowTake) out.push(["vow", "Vow: " + K.VOWS[fx.vowTake].name]);
    if (fx.boon) out.push(["up", "Gain: " + K.BOONS[fx.boon].name]);
    for (const id of K.vowBreaksFor(c.tags, S)) out.push(["down", "Breaks vow: " + K.VOWS[id].name]);
    if (fx.memory) out.push(["", (fx.memory[0] === "all" ? "People" : K.personName(fx.memory[0], S)) + " will remember"]);
    if (c.check) out.push(["check", "Test of " + K.checkLabel(c.check) + ": " + Math.round(K.checkOdds(c.check, S) * 100) + "%"]);
    if (c.combat) out.push(["combat", "Leads to a fight"]);
    if (c.hint) out.push(["", K.fmt(K.val(c.hint, S), S)]);
    return out;
  };

  // Applies a choice. Returns what the UI should do next.
  K.choose = function (sc, c) {
    const S = K.S;
    const dyn = c.resolve ? c.resolve(S) : null; // decided from the state at the moment of choice
    const delta = {};
    const res = { text: null, check: null, combat: c.combat || null, next: null, after: null };
    addDelta(delta, K.apply(c.fx));
    addDelta(delta, K.apply(dyn));
    if (c.check) {
      const ch = c.check;
      const roll = K.roll(6);
      const base = (ch.attr ? K.attr(ch.attr) : 0) + (ch.skill ? S.skills[ch.skill] || 0 : 0) + (K.val(ch.bonus) || 0);
      const pass = base + roll >= ch.dc;
      const br = (pass ? ch.pass : ch.fail) || {};
      res.check = { pass, roll, total: base + roll, dc: ch.dc, label: K.checkLabel(ch) };
      addDelta(delta, K.apply(br.fx));
      if (br.text) res.text = K.fmt(K.val(br.text));
      if (br.next) res.next = K.val(br.next);
      if (br.combat) res.combat = br.combat;
    }
    for (const id of K.vowBreaksFor(c.tags)) addDelta(delta, K.apply({ vowBreak: id }));
    S.log.push(sc.id + ":" + c.id);
    if (!res.text && c.text) res.text = K.fmt(K.val(c.text));
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
    if (outcome === "lose" && enc.lethal) {
      if (S.storyMode) K.apply({ injury: enc.injury || "scar" });
      else { S.alive = false; S.deathText = K.fmt(K.val(br.deathText) || enc.deathText || "You fell in battle.", S); }
    }
    K.lastDelta = delta;
    return {
      text: br.text ? K.fmt(K.val(br.text)) : null,
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
  K.loadSlot = function (slot) {
    const t = K.store.get(KEY + "." + slot);
    if (!t) return null;
    try { const s = JSON.parse(t); return s && s.v === 2 && K.SCENES[s.scene] ? s : null; } catch (e) { return null; }
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
      try { s = JSON.parse(decodeURIComponent(escape(atob(txt)))); } catch (e2) { throw new Error("That save code could not be read. Copy the whole code and try again."); }
    }
    if (!s || s.v !== 2 || !K.SCENES[s.scene]) throw new Error("That save code is from a different version of the game.");
    return s;
  };
})(window.K = window.K || {});
