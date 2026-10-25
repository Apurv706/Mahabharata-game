/* Turn-based combat. Commands come in through C.act/flee/spare, so mouse, keys
   and (later) touch gestures all drive the same logic (PRD §9.7). */
(function (K) {
  "use strict";
  const C = (K.Combat = {});
  let B = null;
  const TIMED = ["guard", "evade", "exposed", "weakened", "inspired", "bleed", "taunt", "cursed"];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const nm = (u, c) => (u.side === "player" ? (c ? "You" : "you") : u.name);
  const conj = (u, phrase) => {
    if (u.side !== "player") return phrase;
    const [w, ...rest] = phrase.split(" ");
    const m = { is: "are", goes: "go", has: "have" };
    const fw = m[w] || (w.endsWith("s") ? w.slice(0, -1) : w);
    return [fw, ...rest].join(" ");
  };

  // Enemy template by tier, so encounters stay balanced as the player grows.
  K.foe = (name, tier, extra = {}) => Object.assign({
    name, hp: 14 + tier * 11, atk: Math.round(2 + tier * 1.5), def: tier >= 5 ? 3 : tier >= 3 ? 2 : 1,
    abilities: tier >= 3 ? ["strike", "heavy"] : ["strike"]
  }, extra);

  function makePlayer(S) {
    const P = (K.PATHS && K.PATHS[S.path]) || { abilities: [], stat: "might", skill: "mace" };
    const might = K.attr("might"), grace = K.attr("grace");
    const hp = 30 + might * 5 + grace * 3 + (S.age >= 18 ? 20 : 0) + (S.skills.mace || 0) * 3;
    let atk = 3 + K.attr(P.stat || "might") + (S.skills[P.skill] || 0);
    if (K.hasVow("never_retreat")) atk += 1;
    const abilities = ["strike", "guard"].concat(P.abilities || []);
    if (S.boons.includes("astra")) abilities.push("astra");
    abilities.push("herbs");
    return { uid: "p", name: S.name || "You", side: "player", hp, maxHp: hp, atk, def: 1 + Math.floor(grace / 2), abilities, cds: {}, status: {}, armed: true };
  }
  function makeUnit(def, side, i) {
    const hp = Math.round(def.hp * (side === "enemy" && K.S.storyMode ? 0.75 : 1));
    return {
      uid: side[0] + i, name: K.fmt(def.name), side, hp, maxHp: hp, atk: def.atk, def: def.def || 1,
      abilities: def.abilities || ["strike"], cds: {}, status: {}, armed: def.armed !== false,
      vowTag: def.vowTag || null, person: def.person || null, note: def.note || null
    };
  }

  const living = (side) => B.units.filter((u) => u.hp > 0 && (side === "friends" ? u.side !== "enemy" : u.side === side));
  const foesOf = (u) => living(u.side === "enemy" ? "friends" : "enemy");
  const friendsOf = (u) => living(u.side === "enemy" ? "enemy" : "friends");
  C.player = () => B && B.units.find((u) => u.side === "player");

  const api = {
    say(t) { B.log.push(t); },
    hit(u, t, mult, o = {}) {
      if (!t || t.hp <= 0) return 0;
      if (u.side === "player" && t.vowTag) {
        for (const id of K.vowBreaksFor([t.vowTag])) { K.apply({ vowBreak: id }); api.say("You strike " + t.name + ". Your vow is broken."); }
      }
      if (t.status.evade) { delete t.status.evade; api.say(cap(nm(t)) + " " + conj(t, "avoids the attack") + "."); return 0; }
      let dmg = (u.atk + K.roll(4)) * mult;
      if (u.status.inspired) dmg *= 1.3;
      if (u.status.weakened) dmg *= 0.7;
      if (u.status.cursed) dmg *= 0.5;
      dmg -= o.pierce ? 0 : t.def;
      if (t.status.exposed) dmg *= 1.4;
      let crit = false;
      if (u.status.crit || K.rng() < 0.08) { crit = true; dmg *= 1.5; delete u.status.crit; }
      if (t.status.guard) { dmg *= 0.5; delete t.status.guard; }
      dmg = Math.max(1, Math.round(dmg));
      t.hp = Math.max(0, t.hp - dmg);
      const lead = o.verb ? cap(o.verb) + " " + nm(t) : cap(nm(u)) + " " + (u.side === "player" ? "hit " : "hits ") + nm(t);
      api.say(lead + " for " + dmg + (crit ? ". A critical hit" : "") + ".");
      if (t.hp === 0) api.say(t.side === "enemy" ? t.name + " falls." : t.side === "player" ? "You fall." : t.name + " is down.");
      return dmg;
    },
    heal(u, t, n) {
      if (!t || t.hp <= 0) return;
      const before = t.hp; t.hp = Math.min(t.maxHp, t.hp + n);
      api.say(cap(nm(t)) + " " + conj(t, "recovers " + (t.hp - before) + " health") + ".");
    },
    status(t, s, dur, text) {
      if (!t || t.hp <= 0) return;
      t.status[s] = Math.max(t.status[s] || 0, dur);
      if (text) api.say(cap(nm(t)) + " " + conj(t, text) + ".");
    },
    cleanse(t) { for (const s of ["stun", "bleed", "weakened", "exposed"]) delete t.status[s]; },
    firstEnemy() { return living("enemy").sort((a, b) => a.hp - b.hp)[0]; }
  };

  C.start = function (encId, onEnd) {
    const S = K.S, enc = K.ENCOUNTERS[encId];
    if (!enc) throw new Error("Missing encounter: " + encId);
    B = Object.assign({ enc, units: [makePlayer(S)], round: 1, log: [], over: null, used: {}, onEnd }, api);
    (K.val(enc.allies) || []).forEach((a, i) => { const d = typeof a === "string" ? K.UNITS[a] && K.UNITS[a](S) : a; if (d) B.units.push(makeUnit(d, "ally", i)); });
    K.val(enc.enemies).forEach((e, i) => B.units.push(makeUnit(e, "enemy", i)));
    if (S.boons.includes("healing_hands") && (S.items.herbs || 0) < 2) S.items.herbs = 2;
    if (enc.intro) api.say(K.fmt(K.val(enc.intro)));
    const curse = enc.curse && S.curses.find((c) => !c.fired);
    if (curse) {
      K.apply({ fireCurse: curse.id, journal: K.CURSES[curse.id].fireText });
      api.status(C.player(), "cursed", 3);
      api.say(K.fmt(K.CURSES[curse.id].fireText));
    }
    K.emit("combat", B);
    return B;
  };
  C.state = () => B;

  function targetsFor(u, ab, uid) {
    const pickFoe = () => {
      const foes = foesOf(u);
      const taunt = foes.find((f) => f.status.taunt);
      if (taunt) return taunt;
      if (u.side === "enemy") { const p = foes.find((f) => f.side === "player"); return p && K.rng() < 0.65 ? p : K.pick(foes); }
      return foes.slice().sort((a, b) => a.hp - b.hp)[0];
    };
    switch (ab.target) {
      case "self": return u;
      case "enemies": return foesOf(u);
      case "allies": return friendsOf(u);
      case "ally": return friendsOf(u).find((f) => f.uid === uid) || friendsOf(u).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      default: return foesOf(u).find((f) => f.uid === uid) || pickFoe();
    }
  }

  C.available = function () {
    const p = C.player(), S = K.S;
    return p.abilities.map((id) => {
      const ab = K.ABILITIES[id];
      let why = null;
      if (p.cds[id]) why = "Ready in " + p.cds[id] + (p.cds[id] === 1 ? " turn" : " turns");
      if (ab.once && B.used[id]) why = "Used this battle";
      if (ab.item && !(S.items[ab.item] > 0)) why = "None left";
      if (ab.needsAlly && friendsOf(p).length < 2) why = "No ally to command";
      return { id, name: ab.name, desc: ab.desc, target: ab.target, why, count: ab.item ? S.items[ab.item] || 0 : null };
    });
  };

  function use(u, id, uid) {
    const ab = K.ABILITIES[id];
    ab.use(B, u, targetsFor(u, ab, uid));
    if (ab.cd) u.cds[id] = ab.cd;
    if (ab.once) B.used[id] = true;
  }

  function aiTurn(u) {
    if (u.status.stun) { delete u.status.stun; api.say(u.name + " is stunned and loses the turn."); return; }
    const specials = u.abilities.filter((id) => id !== "strike" && id !== "guard" && !u.cds[id] && !K.ABILITIES[id].item && !K.ABILITIES[id].needsAlly);
    const hurt = friendsOf(u).find((f) => f.hp / f.maxHp < 0.45);
    if (hurt && u.abilities.includes("salve") && !u.cds.salve) return use(u, "salve", hurt.uid);
    if (specials.length && K.rng() < 0.45) return use(u, K.pick(specials));
    use(u, "strike");
  }

  function over() {
    const p = C.player();
    if (p.hp <= 0 && B.enc.lethal && K.S.flags.includes("amulet_whole")) {
      p.hp = Math.max(1, Math.round(p.maxHp * 0.15));
      K.apply({ unflag: "amulet_whole", flag: "amulet_broken", journal: "Your amulet cracked and turned aside a killing blow." });
      api.say("The amulet at your throat cracks. The killing blow turns aside.");
    }
    if (p.hp <= 0) return finish("lose");
    if (!living("enemy").length) return finish("win");
    if (B.enc.rounds && B.round > B.enc.rounds) { api.say(K.fmt(B.enc.roundsText || "You held long enough.")); return finish("win"); }
    return false;
  }
  function finish(outcome) {
    B.over = outcome;
    const p = C.player();
    if (outcome === "win" && B.enc.lethal && p.hp <= p.maxHp * 0.2 && K.rng() < 0.45) {
      const options = Object.keys(K.INJURIES).filter((id) => id !== "scar" && !K.S.injuries.includes(id));
      if (options.length) {
        const id = K.pick(options);
        K.apply({ injury: id, journal: "You survived the fighting, but not whole: " + K.INJURIES[id].text.toLowerCase() + "." });
        api.say("You survive, but the battle leaves its mark: " + K.INJURIES[id].text.toLowerCase() + ".");
      }
    }
    K.emit("combat", B);
    return true;
  }

  function endRound() {
    for (const u of B.units) {
      if (u.hp > 0 && u.status.bleed) { const d = Math.max(1, Math.round(u.maxHp * 0.06)); u.hp = Math.max(0, u.hp - d); api.say(cap(nm(u)) + " " + conj(u, "bleeds for " + d) + "."); }
      for (const s of TIMED) if (u.status[s]) { u.status[s]--; if (!u.status[s]) delete u.status[s]; }
      for (const k of Object.keys(u.cds)) if (u.cds[k] > 0) u.cds[k]--;
    }
    B.round++;
  }

  function others() {
    for (const a of living("ally")) { if (B.over) return; aiTurn(a); if (over()) return; }
    for (const e of living("enemy")) { if (B.over) return; aiTurn(e); if (over()) return; }
    endRound();
    if (over()) return;
    const p = C.player();
    while (!B.over && p.status.stun) {
      delete p.status.stun; api.say("You are stunned and lose your turn.");
      for (const u of living("ally").concat(living("enemy"))) { aiTurn(u); if (over()) return; }
      endRound(); if (over()) return;
    }
  }

  C.act = function (id, uid) {
    if (!B || B.over) return;
    const row = C.available().find((a) => a.id === id);
    if (!row || row.why) return;
    use(C.player(), id, uid);
    if (!over()) others();
    K.emit("combat", B);
  };
  C.canFlee = () => !!(B && B.enc.flee && !B.over);
  C.fleeBreaks = () => (B && B.enc.flee ? K.vowBreaksFor(B.enc.flee.tags || ["retreat"]) : []);
  C.flee = function () {
    if (!C.canFlee()) return;
    for (const id of C.fleeBreaks()) K.apply({ vowBreak: id });
    api.say("You withdraw from the fight.");
    finish("flee");
  };
  C.spareable = () => (B && B.enc.spare && !B.over ? living("enemy").filter((e) => e.hp <= e.maxHp * 0.3) : []);
  C.spare = function (uid) {
    const t = C.spareable().find((e) => e.uid === uid);
    if (!t) return;
    api.say("You lower your weapon and let " + t.name + " go.");
    finish("spare");
  };
  C.end = function () {
    if (!B || !B.over) return null;
    const done = B;
    B = null;
    return done;
  };
})(window.K = window.K || {});
