/* Turn-based combat. Commands come in through C.act/flee/spare, so mouse, keys
   and (later) touch gestures all drive the same logic (PRD §9.7). */
(function (K) {
  "use strict";
  const C = (K.Combat = {});
  let B = null;
  const TIMED = ["guard", "evade", "exposed", "weakened", "inspired", "bleed", "taunt", "cursed"];
  // The log stores events, not sentences: { key, u: { role: unit }, v: { name: value }, crit }.
  // C.line() phrases one in the current language, so switching language rewrites the whole log.
  // Keys are English templates; "{t} ..." lines about the player use a "You ..." key instead.
  const youForm = (phrase) => {
    const [w, ...rest] = phrase.split(" ");
    const m = { is: "are", goes: "go", has: "have", loses: "lose" };
    const fw = m[w] || (w.endsWith("s") ? w.slice(0, -1) : w);
    return [fw, ...rest].join(" ");
  };
  const subjectKey = (u, phrase) => (u.side === "player" ? "You " + youForm(phrase) + "." : "{t} " + phrase + ".");
  const isP = (u) => u && u.side === "player";
  const unitName = (u) => (u.side === "player" ? K.S.name || K.tr("You") : K.text(u.src || u.name));
  // Every grammatical form a sentence might need for one unit. English uses {t}/{a}; the Hindi
  // templates pick the form with the right postposition ({tko} "to", {tne} ergative, {tke} "of").
  function forms(role, u) {
    const o = {};
    if (!u) return o;
    if (isP(u) && K.lang === "hi") Object.assign(o, { [role]: "तुम", [role + "ko"]: "तुम्हें", [role + "ne"]: "तुमने", [role + "ke"]: "तुम्हारे", [role + "ki"]: "तुम्हारी", [role + "par"]: "तुम पर" });
    else if (isP(u)) o[role] = "you";
    else {
      const n = unitName(u);
      // Before a postposition Hindi takes the oblique form: "राजा का अंगरक्षक" becomes "राजा के अंगरक्षक ने".
      const ob = K.lang === "hi" ? n.replace(/ का /g, " के ").replace(/(लुटेरा|ग्वाला|बेटा)$/, (m) => m.slice(0, -1) + "े") : n;
      Object.assign(o, { [role]: n, [role + "ko"]: ob + " को", [role + "ne"]: ob + " ने", [role + "ke"]: ob + " के", [role + "ki"]: ob + " की", [role + "par"]: ob + " पर" });
    }
    return o;
  }
  C.line = function (e) {
    if (typeof e === "string") return K.text(e); // older logs
    if (e.raw) return K.text(e.raw);
    const p = {};
    for (const [role, u] of Object.entries(e.u || {})) Object.assign(p, forms(role, u));
    for (const [k, v] of Object.entries(e.v || {})) p[k] = typeof v === "string" ? K.tr(v) : v;
    let line = K.text(e.key, p);
    if (e.crit) line += " " + K.tr("A critical hit.");
    return line;
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
    const rec = K.record(S);
    atk += Math.min(2, Math.floor(rec.won / 3)); // every three fights won, a little more sure of your hand
    if (rec.last === "lost") atk -= 1;            // the last fight still in your mind
    const abilities = ["strike", "guard"].concat(P.abilities || []);
    if (S.boons.includes("astra")) abilities.push("astra");
    abilities.push("herbs");
    return { uid: "p", name: S.name || "You", side: "player", hp, maxHp: hp, atk, def: 1 + Math.floor(grace / 2), abilities, cds: {}, status: {}, armed: true };
  }
  // Enemies come in a little stronger than their tier says, and more so in a fight marked hard; story
  // mode takes a quarter off. Tuned so an even fight is won about two times in three by a player who
  // guards and defends in time, and a hard one about two times in five (tests/balance.js).
  C.TOUGH = { hp: 2.2, atk: 1.9 };
  C.HARD = { hp: 1.5, atk: 1.35 }; // the hard fights are already built big (Ashwatthama, the lone chariot), so a smaller step
  function makeUnit(def, side, i, enc) {
    const m = side === "enemy" ? (enc && enc.hard ? C.HARD : C.TOUGH) : { hp: 1, atk: 1 };
    const hp = Math.round(def.hp * m.hp * (side === "enemy" && K.S.storyMode ? 0.75 : 1));
    return {
      uid: side[0] + i, name: K.fmt(def.name), src: def.name, side, hp, maxHp: hp, atk: Math.round(def.atk * m.atk * 10) / 10, def: def.def || 1,
      abilities: def.abilities || ["strike"], cds: {}, status: {}, armed: def.armed !== false,
      vowTag: def.vowTag || null, person: def.person || null, note: def.note || null, plural: !!def.plural
    };
  }

  const living = (side) => B.units.filter((u) => u.hp > 0 && (side === "friends" ? u.side !== "enemy" : u.side === side));
  const foesOf = (u) => living(u.side === "enemy" ? "friends" : "enemy");
  const friendsOf = (u) => living(u.side === "enemy" ? "enemy" : "friends");
  C.player = () => B && B.units.find((u) => u.side === "player");

  const api = {
    say(t) { B.log.push({ raw: t }); },                       // a line of story text (English source)
    tell(key, u, v, crit) { B.log.push({ key, u, v, crit }); }, // a combat event
    hit(u, t, mult, o = {}) {
      if (!t || t.hp <= 0) return 0;
      if (u.side === "player" && t.vowTag) {
        for (const id of K.vowBreaksFor([t.vowTag])) { K.apply({ vowBreak: id }); api.tell("You strike {t}. Your vow is broken.", { t }); }
      }
      if (t.status.evade) { delete t.status.evade; api.tell(subjectKey(t, "avoids the attack"), { t }); return 0; }
      // A blow aimed at you that you met in time (C.resolve): dodged, blocked, or turned into a counter.
      const def = isP(t) && u.side === "enemy" ? B.defNow : null;
      if (def === "dodge") { api.tell("You dodge {a}'s blow.", { a: u }); B.lastDef = "dodge"; return 0; }
      if (def === "counter") {
        api.tell("You turn {a}'s blow aside and strike back.", { a: u }); B.lastDef = "counter";
        const p = t; B.defNow = null; api.hit(p, u, 0.7); return 0;
      }
      let dmg = (u.atk + K.roll(4)) * mult;
      if (def === "block") { dmg *= 0.45; B.lastDef = "block"; }
      if (def === "miss") { dmg *= o.heavy ? 1.15 : 1; B.lastDef = "miss"; }
      if (u.status.inspired) dmg *= 1.3;
      if (u.status.weakened) dmg *= 0.7;
      if (u.status.cursed) dmg *= 0.5;
      dmg -= o.pierce ? 0 : t.def;
      if (t.status.exposed) dmg *= 1.4;
      let crit = false;
      if (u.status.crit || K.rng() < 0.08) { crit = true; dmg *= 1.5; delete u.status.crit; }
      if (t.status.guard) { dmg *= o.breaks ? 0.85 : 0.5; delete t.status.guard; }
      dmg = Math.max(1, Math.round(dmg));
      t.hp = Math.max(0, t.hp - dmg);
      const key = def === "block" ? "You block, and {a}'s blow still hits you for {n}." : o.verb || (isP(u) ? "You hit {t} for {n}." : isP(t) ? (u.plural ? "{a} hit you for {n}." : "{a} hits you for {n}.") : u.plural ? "{a} hit {t} for {n}." : "{a} hits {t} for {n}.");
      B.lastHit = { by: u.uid, on: t.uid, n: dmg, crit };
      api.tell(key, { a: u, t }, { n: dmg }, crit);
      if (t.hp === 0) api.tell(t.side === "enemy" ? "{t} falls." : isP(t) ? "You fall." : "{t} is down.", { t });
      return dmg;
    },
    heal(u, t, n) {
      if (!t || t.hp <= 0) return;
      const before = t.hp; t.hp = Math.min(t.maxHp, t.hp + n);
      api.tell(subjectKey(t, "recovers {n} health"), { t }, { n: t.hp - before });
    },
    status(t, s, dur, text) {
      if (!t || t.hp <= 0) return;
      t.status[s] = Math.max(t.status[s] || 0, dur);
      if (text) api.tell(subjectKey(t, text), { t });
    },
    cleanse(t) { for (const s of ["stun", "bleed", "weakened", "exposed"]) delete t.status[s]; },
    firstEnemy() { return living("enemy").sort((a, b) => a.hp - b.hp)[0]; },
    living(side) { return living(side); }
  };

  C.start = function (encId, onEnd) {
    const S = K.S, enc = K.ENCOUNTERS[encId];
    if (!enc) throw new Error("Missing encounter: " + encId);
    B = Object.assign({ enc, units: [makePlayer(S)], round: 1, log: [], acts: [], over: null, used: {}, onEnd, bid: Date.now() + ":" + encId }, api);
    (K.val(enc.allies) || []).forEach((a, i) => { const d = typeof a === "string" ? K.UNITS[a] && K.UNITS[a](S) : a; if (d) B.units.push(makeUnit(d, "ally", i, enc)); });
    K.val(enc.enemies).forEach((e, i) => B.units.push(makeUnit(e, "enemy", i, enc)));
    B.habit = []; // what you have done lately: enemies learn from it
    if (S.boons.includes("healing_hands") && (S.items.herbs || 0) < 2) S.items.herbs = 2;
    B.pulled = {};
    // The screen asks for step mode (each blow aimed at you met in time); with timed moments off the
    // blows are met by chance, on kinder odds; under the tests, on the plain odds.
    B.stepMode = !!C.stepNext; B.lenient = !C.stepNext && !K.headless;
    const rec = K.record(S);
    if (rec.last === "lost") api.say("You remember how your last fight ended. Your hands are not quite steady.");
    else if (rec.last === "won" && rec.won >= 3) api.say("You have won fights before, and your body remembers how.");
    if (enc.intro) api.say(K.val(enc.intro));
    const curse = enc.curse && S.curses.find((c) => !c.fired);
    if (curse) {
      K.apply({ fireCurse: curse.id, journal: K.CURSES[curse.id].fireText });
      api.status(C.player(), "cursed", 3);
      api.say(K.CURSES[curse.id].fireText);
    }
    planAll();
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
      if (p.cds[id]) why = K.tr(p.cds[id] === 1 ? "Ready in 1 turn" : "Ready in {n} turns", { n: p.cds[id] });
      if (ab.once && B.used[id]) why = K.tr("Used this battle");
      if (ab.item && !(S.items[ab.item] > 0)) why = K.tr("None left");
      if (ab.needsAlly && friendsOf(p).length < 2) why = K.tr("No ally to command");
      return { id, name: K.tr(ab.name), desc: K.tr(ab.desc), target: ab.target, why, count: ab.item ? S.items[ab.item] || 0 : null };
    });
  };

  function use(u, id, uid) {
    const ab = K.ABILITIES[id];
    B.acts.push({ uid: u.uid, id, round: B.round }); // for the screen: who moved, and how
    ab.use(B, u, targetsFor(u, ab, uid));
    if (ab.cd) u.cds[id] = ab.cd;
    if (ab.once) B.used[id] = true;
  }

  // What a unit means to do: the same rules for allies (decided on their turn) and enemies (decided
  // a round ahead and shown on their card, so the player can guard, pull a friend clear or strike first).
  // Enemies learn: a player who keeps guarding draws shield-breaking blows; one who keeps hitting the
  // same foe finds it braced; a player low on health, or who has just used herbs, is hunted.
  function decide(u) {
    const specials = u.abilities.filter((id) => id !== "strike" && id !== "guard" && !u.cds[id] && !K.ABILITIES[id].item && !K.ABILITIES[id].needsAlly);
    const hurt = friendsOf(u).find((f) => f.hp / f.maxHp < 0.45);
    if (hurt && u.abilities.includes("salve") && !u.cds.salve) return { id: "salve", uid: hurt.uid };
    const h = (B && B.habit) || [], recent = h.slice(-3);
    const p = foesOf(u).find((f) => f.side === "player");
    if (u.side === "enemy" && recent.filter((x) => x.id === "guard").length >= 2 && !u.cds.breaker) return { id: "breaker", uid: p ? p.uid : null };
    if (u.side === "enemy" && recent.length >= 2 && recent.slice(-2).every((x) => x.uid === u.uid) && !u.status.guard && K.rng() < 0.5) return { id: "brace", uid: null };
    const id = specials.length && K.rng() < 0.5 ? K.pick(specials) : "strike";
    const ab = K.ABILITIES[id];
    let t = ab.target === "enemy" ? targetsFor(u, ab) : null;
    if (u.side === "enemy" && ab.target === "enemy" && p && (p.hp / p.maxHp < 0.4 || (recent.length && recent[recent.length - 1].id === "herbs")) && K.rng() < 0.85) t = p;
    return { id, uid: t ? t.uid : null };
  }
  function planAll() { for (const e of B.units) { if (e.side === "enemy" && e.hp > 0) e.intent = decide(e); else delete e.intent; } }
  function aiTurn(u) {
    const it = u.intent;
    delete u.intent;
    if (u.status.stun) { delete u.status.stun; api.tell("{t} is stunned and loses the turn.", { t: u }); return; }
    const plan = it && !u.cds[it.id] ? it : decide(u);
    const ab = K.ABILITIES[plan.id];
    let uid = plan.uid;
    if (ab.target === "enemy") { const taunt = foesOf(u).find((f) => f.status.taunt); if (taunt) uid = taunt.uid; } // a war cry still draws the blow
    use(u, plan.id, uid);
  }
  // The enemy's next move, for its card: { ab, who } where who is "you", a name, "all" or null.
  C.intent = function (u) {
    if (!B || B.over || !u.intent || u.hp <= 0 || u.status.stun) return null;
    const ab = K.ABILITIES[u.intent.id];
    let t = null;
    if (ab.target === "enemy") {
      const taunt = foesOf(u).find((f) => f.status.taunt);
      t = taunt || B.units.find((x) => x.uid === u.intent.uid && x.hp > 0) || null;
    } else if (ab.target === "ally") t = B.units.find((x) => x.uid === u.intent.uid) || null;
    return { id: u.intent.id, name: ab.name, target: ab.target, unit: t, heavy: ["heavy", "arrows", "disarm"].includes(u.intent.id) };
  };

  // Once in each deadly fight, as the third round begins, something happens on the field.
  function fieldEvent() {
    B.evented = true;
    const all = K.BATTLE_EVENTS || {};
    const list = (K.val(B.enc.events) || Object.keys(all).filter((id) => all[id].common)).filter((id) => all[id]);
    if (!list.length) return;
    const ev = all[K.pick(list)];
    const at = B.log.length;
    const u = ev.run(B) || {};
    B.log.splice(at, 0, { key: ev.text, u, ev: true });
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
    if (B.enc.rounds && B.round > B.enc.rounds) { api.say(B.enc.roundsText || "You held long enough."); return finish("win"); }
    return false;
  }
  function finish(outcome) {
    B.over = outcome;
    const p = C.player();
    // A fight won on your last legs can leave a mark for life: any wound in a deadly fight, a scar in
    // any other.
    if (outcome === "win" && !B.enc.lethal && p.hp <= p.maxHp * 0.2 && K.rng() < 0.35 && !K.S.injuries.includes("scar")) {
      K.apply({ injury: "scar", journal: { src: "You won, but not whole: {inj!}.", p: { inj: K.INJURIES.scar.text } } });
      api.tell("You win, but the fight leaves its mark: {inj!}.", null, { inj: K.INJURIES.scar.text });
    }
    if (outcome === "win" && B.enc.lethal && p.hp <= p.maxHp * 0.3 && K.rng() < 0.5) {
      const options = Object.keys(K.INJURIES).filter((id) => id !== "scar" && !K.S.injuries.includes(id));
      if (options.length) {
        const id = K.pick(options);
        K.apply({ injury: id, journal: { src: "You survived the fighting, but not whole: {inj!}.", p: { inj: K.INJURIES[id].text } } });
        api.tell("You survive, but the battle leaves its mark: {inj!}.", null, { inj: K.INJURIES[id].text });
      }
    }
    K.emit("combat", B);
    return true;
  }

  function endRound() {
    for (const u of B.units) {
      if (u.hp > 0 && u.status.bleed) { const d = Math.max(1, Math.round(u.maxHp * 0.06)); u.hp = Math.max(0, u.hp - d); api.tell(subjectKey(u, "bleeds for {n}"), { t: u }, { n: d }); }
      for (const s of TIMED) if (u.status[s]) { u.status[s]--; if (!u.status[s]) delete u.status[s]; }
      for (const k of Object.keys(u.cds)) if (u.cds[k] > 0) u.cds[k]--;
    }
    B.round++;
    if (B.round === 3 && B.enc.lethal && !B.evented && living("enemy").length) fieldEvent();
    planAll();
  }

  // Does this enemy's next move come at you? Then you get a moment to meet it (block, dodge, counter).
  const DAMAGING = ["strike", "heavy", "arrows", "disarm", "breaker"];
  C.threat = function (u) {
    if (!u || u.hp <= 0 || u.status.stun || !u.intent || !DAMAGING.includes(u.intent.id)) return null;
    const ab = K.ABILITIES[u.intent.id];
    const taunt = foesOf(u).find((f) => f.status.taunt);
    const onMe = ab.target === "enemies" || (taunt ? taunt.side === "player" : (B.units.find((x) => x.uid === u.intent.uid) || {}).side === "player");
    return onMe ? { id: u.intent.id, name: ab.name, heavy: ["heavy", "arrows", "breaker"].includes(u.intent.id), speed: u.intent.id === "arrows" ? 0.85 : u.intent.id === "heavy" ? 1.25 : 1 } : null;
  };
  // Without a player at the keys (the tests), or with timed moments off, the blow is met by chance:
  // the more graceful you are, the better your odds.
  function autoDefense() {
    const g = K.attr("grace"), r = K.rng(), lenient = B && B.lenient;
    const hd = C.humanDefense; // the balance check plays as an attentive player would (tests/balance.js)
    const counter = hd ? hd.counter : 0.06 + g * 0.01, block = hd ? hd.block : (lenient ? 0.5 : 0.32) + g * 0.03;
    return r < counter ? "counter" : r < counter + block ? "block" : "miss";
  }
  function enemyTurn(e, def) {
    B.defNow = C.threat(e) ? def || autoDefense() : null;
    B.lastDef = null;
    aiTurn(e);
    B.defNow = null;
  }
  function roundEnd() {
    endRound();
    if (over()) return;
    const p = C.player();
    while (!B.over && p.status.stun) {
      delete p.status.stun; api.tell("You are stunned and lose your turn.");
      for (const u of living("ally")) { aiTurn(u); if (over()) return; }
      for (const u of living("enemy")) { enemyTurn(u); if (over()) return; }
      endRound(); if (over()) return;
    }
  }
  function others() {
    for (const a of living("ally")) { if (B.over) return; aiTurn(a); if (over()) return; }
    if (B.stepMode) { B.queue = living("enemy").map((e) => e.uid); if (!B.queue.length) roundEnd(); return; }
    for (const e of living("enemy")) { if (B.over) return; enemyTurn(e); if (over()) return; }
    roundEnd();
  }
  // Step mode (the screen asks for it): after your move the enemies come one at a time. C.nextFoe()
  // says who is next and whether the blow is aimed at you; C.resolve(defense) plays that turn.
  C.nextFoe = function () {
    if (!B || B.over || !B.queue) return null;
    while (B.queue.length) {
      const u = B.units.find((x) => x.uid === B.queue[0]);
      if (u && u.hp > 0) return { u, threat: C.threat(u) };
      B.queue.shift();
    }
    return null;
  };
  C.resolve = function (def) {
    const n = C.nextFoe();
    if (!n) return;
    B.queue.shift();
    enemyTurn(n.u, def);
    if (!over() && !B.queue.length) { B.queue = null; roundEnd(); }
    K.emit("combat", B);
  };

  C.act = function (id, uid) {
    if (!B || B.over || (B.queue && B.queue.length)) return;
    const row = C.available().find((a) => a.id === id);
    if (!row || row.why) return;
    B.habit.push({ id, uid });
    use(C.player(), id, uid);
    if (!over()) others();
    K.emit("combat", B);
  };
  // A friend who falls can be dragged out of the press. It costs your turn.
  C.fallen = () => (B && !B.over ? B.units.filter((u) => u.side === "ally" && u.person && u.hp <= 0 && !B.pulled[u.uid]) : []);
  C.pull = function (uid) {
    const t = C.fallen().find((u) => u.uid === uid);
    if (!t) return;
    B.pulled[t.uid] = true;
    api.tell("You drag {t} out of the press, behind the chariots.", { t });
    K.apply({ bond: { [t.person]: 1 }, memory: [t.person, "You came back for me when I fell."] });
    others();
    K.emit("combat", B);
  };
  C.canFlee = () => !!(B && B.enc.flee && !B.over);
  C.fleeBreaks = () => (B && B.enc.flee ? K.vowBreaksFor(B.enc.flee.tags || ["retreat"]) : []);
  C.flee = function () {
    if (!C.canFlee()) return;
    for (const id of C.fleeBreaks()) K.apply({ vowBreak: id });
    api.tell("You withdraw from the fight.");
    finish("flee");
  };
  C.spareable = () => (B && B.enc.spare && !B.over ? living("enemy").filter((e) => e.hp <= e.maxHp * 0.3) : []);
  C.spare = function (uid) {
    const t = C.spareable().find((e) => e.uid === uid);
    if (!t) return;
    api.tell("You lower your weapon and let {t} go.", { t });
    finish("spare");
  };
  C.end = function () {
    if (!B || !B.over) return null;
    const done = B;
    B = null;
    return done;
  };
})(window.K = window.K || {});
