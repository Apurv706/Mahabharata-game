/* Kurukshetra: A Life — engine core.
   Engine-agnostic rules for the life simulation (PRD §4 canon lock, §9 systems).
   Everything here is plain data + pure-ish functions, so it can be ported to an
   Unreal subsystem later while the content files stay as data. */
(function (K) {
  "use strict";

  K.clone = (o) => JSON.parse(JSON.stringify(o));
  K.clamp = (v, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, v));

  // Swappable random source, so tests can run seeded playthroughs.
  K.rng = Math.random;
  K.seed = function (n) {
    let a = n >>> 0;
    K.rng = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  K.roll = (sides = 6) => 1 + Math.floor(K.rng() * sides);
  K.pick = (arr) => arr[Math.floor(K.rng() * arr.length)];

  // ---------- Vocabulary ----------
  K.DUTIES = { teacher: "Teacher's debt", court: "Loyalty to your king", family: "Family duty", conscience: "Conscience" };
  K.ATTRS = { might: "Might", aim: "Aim", grace: "Grace", wisdom: "Wisdom", command: "Command" };
  K.SKILLS = { archery: "Archery", mace: "Mace and wrestling", chariot: "Chariot", statecraft: "Statecraft", healing: "Healing", stealth: "Stealth", lore: "Lore and song" };
  K.FACTIONS = { kuru: "Kuru court", pandava: "Pandavas", panchala: "Panchala", yadava: "Yadavas", sages: "Sages and ashrams", common: "Common people" };
  K.MAX_VOWS = 3;
  K.PEOPLE = {};   // id -> { name, canon }   (content registers people)
  K.VOWS = {};     // id -> { name, gift, breakText }
  K.BOONS = {};    // id -> { name, text }
  K.CURSES = {};   // id -> { name, text, fireText }
  K.INJURIES = {}; // id -> { name, text, attrs: { aim: -1 } }

  // Choices carry tags; a tag breaks the matching vow automatically, so writers
  // never have to remember to code a vow break by hand.
  K.VOW_TAGS = { retreat: "never_retreat", lie: "never_lie", strike_karna: "spare_karna", strike_unarmed: "spare_unarmed", marry: "celibacy" };

  K.newLife = function () {
    return {
      v: 2, name: "", pronoun: "they", origin: null, temperament: null, heirloom: null,
      age: 6, act: 1, scene: "title",
      attrs: { might: 2, aim: 2, grace: 2, wisdom: 2, command: 1 },
      skills: { archery: 0, mace: 0, chariot: 0, statecraft: 0, healing: 0, stealth: 0, lore: 0 },
      path: null, teacher: null, court: null, side: null, spouse: null, friend: null, child: null, exile: null,
      duty: { teacher: 0, court: 3, family: 4, conscience: 5 },
      bonds: {}, rep: { kuru: 3, pandava: 3, panchala: 3, yadava: 3, sages: 3, common: 3 },
      vows: [], boons: [], curses: [], injuries: [], items: { herbs: 1 },
      flags: [], memories: [], journal: [], dead: [], seen: [], log: [],
      alive: true, storyMode: false, ending: null, deathText: null, endChoice: null
    };
  };
  K.S = K.newLife();

  // ---------- Derived values ----------
  K.attr = function (k, S = K.S) {
    let v = S.attrs[k] || 0;
    const a = S.age;
    if (k === "might" || k === "grace") { if (a < 14) v -= 1; if (a >= 45) v -= 1; if (a >= 60) v -= 1; }
    if (k === "wisdom" || k === "command") { if (a >= 30) v += 1; if (a >= 50) v += 1; }
    for (const id of S.injuries) v += (K.INJURIES[id]?.attrs?.[k] || 0);
    return Math.max(0, v);
  };
  K.activeVows = (S = K.S) => S.vows.filter((v) => !v.broken);
  K.hasVow = (id, S = K.S) => S.vows.some((v) => v.id === id && !v.broken);
  K.isDead = (who, S = K.S) => S.dead.includes(who);
  K.personName = (id, S = K.S) => {
    if (id === "spouse" && S.spouse) return K.PEOPLE[S.spouse]?.name || "your spouse";
    if (id === "friend" && S.friend) return K.PEOPLE[S.friend]?.name || "your friend";
    return K.PEOPLE[id]?.name || id;
  };

  // ---------- Text ----------
  const PRON = {
    she: { they: "she", them: "her", their: "her", They: "She", theyre: "she is" },
    he: { they: "he", them: "him", their: "his", They: "He", theyre: "he is" },
    they: { they: "they", them: "them", their: "their", They: "They", theyre: "they are" }
  };
  K.fmt = function (str, S = K.S) {
    if (typeof str !== "string") return str;
    const p = PRON[S.pronoun] || PRON.they;
    return str.replace(/\{(\w+)\}/g, (m, key) => {
      if (p[key]) return p[key];
      if (key === "name") return S.name || "you";
      if (key === "origin") return K.ORIGINS?.[S.origin]?.name || "your homeland";
      if (key === "teacher") return K.TEACHERS?.[S.teacher]?.short || "your teacher";
      if (key === "path") return K.PATHS?.[S.path]?.name || "warrior";
      if (key === "spouse") return K.personName("spouse", S);
      if (key === "friend") return K.personName("friend", S);
      if (key === "child") return K.PEOPLE.vasu?.name || "Vasu";
      if (key === "king") return K.COURTS?.[S.court]?.king || "your king";
      return m;
    });
  };

  // ---------- Conditions ----------
  const FIELDS = ["origin", "teacher", "path", "court", "side", "friend", "spouse", "temperament", "heirloom", "pronoun", "exile", "endChoice"];
  const TESTS = {
    all: (v, S) => v.every((x) => K.test(x, S)),
    any: (v, S) => v.some((x) => K.test(x, S)),
    not: (v, S) => !K.test(v, S),
    flag: (v, S) => [].concat(v).every((f) => S.flags.includes(f)),
    anyFlag: (v, S) => v.some((f) => S.flags.includes(f)),
    noFlag: (v, S) => [].concat(v).every((f) => !S.flags.includes(f)),
    vow: (v, S) => K.hasVow(v, S),
    noVow: (v, S) => !K.hasVow(v, S),
    vowSlot: (v, S) => (K.activeVows(S).length < K.MAX_VOWS) === v,
    boon: (v, S) => S.boons.includes(v),
    cursed: (v, S) => S.curses.some((c) => !c.fired) === v,
    injured: (v, S) => (S.injuries.length > 0) === v,
    bond: ([k, n], S) => (S.bonds[k] ?? 0) >= n,
    bondBelow: ([k, n], S) => (S.bonds[k] ?? 0) < n,
    rep: ([k, n], S) => S.rep[k] >= n,
    duty: ([k, n], S) => S.duty[k] >= n,
    attr: ([k, n], S) => K.attr(k, S) >= n,
    skill: ([k, n], S) => (S.skills[k] || 0) >= n,
    item: ([k, n], S) => (S.items[k] || 0) >= n,
    alive: (v, S) => [].concat(v).every((w) => !S.dead.includes(w)),
    deadP: (v, S) => [].concat(v).every((w) => S.dead.includes(w)),
    has: (v, S) => S[v] != null,
    hasNot: (v, S) => S[v] == null,
    ageGte: (n, S) => S.age >= n,
    storyMode: (v, S) => S.storyMode === v
  };
  K.test = function (c, S = K.S) {
    if (!c) return true;
    if (typeof c === "function") return !!c(S);
    if (Array.isArray(c)) return c.every((x) => K.test(x, S));
    for (const [k, v] of Object.entries(c)) {
      if (FIELDS.includes(k)) { if (![].concat(v).includes(S[k])) return false; continue; }
      if (!TESTS[k]) throw new Error("Unknown condition: " + k);
      if (!TESTS[k](v, S)) return false;
    }
    return true;
  };

  // ---------- Effects ----------
  function bump(obj, k, n, d, label, lo = 0, hi = 10, base = 0) {
    obj[k] = K.clamp((obj[k] ?? base) + n, lo, hi);
    d[label] = (d[label] || 0) + n;
  }
  const FX = {
    duty: (o, S, d) => { for (const [k, n] of Object.entries(o)) bump(S.duty, k, n, d, "duty." + k); },
    bond: (o, S, d) => { for (const [k, n] of Object.entries(o)) bump(S.bonds, k, n, d, "bond." + k, 0, 10, 3); },
    setBond: (o, S) => { for (const [k, n] of Object.entries(o)) S.bonds[k] = n; },
    rep: (o, S, d) => { for (const [k, n] of Object.entries(o)) bump(S.rep, k, n, d, "rep." + k); },
    attr: (o, S, d) => { for (const [k, n] of Object.entries(o)) bump(S.attrs, k, n, d, "attr." + k, 0, 8); },
    skill: (o, S, d) => { for (const [k, n] of Object.entries(o)) bump(S.skills, k, n, d, "skill." + k, 0, 6); },
    item: (o, S, d) => { for (const [k, n] of Object.entries(o)) { S.items[k] = Math.max(0, (S.items[k] || 0) + n); d["item." + k] = n; } },
    flag: (v, S) => { for (const f of [].concat(v)) if (!S.flags.includes(f)) S.flags.push(f); },
    unflag: (v, S) => { S.flags = S.flags.filter((f) => ![].concat(v).includes(f)); },
    memory: ([who, text], S) => { S.memories.push({ who, text: K.fmt(text, S), age: S.age }); },
    journal: (t, S) => { S.journal.push({ age: S.age, act: S.act, text: K.fmt(typeof t === "function" ? t(S) : t, S) }); },
    set: (o, S) => { Object.assign(S, o); },
    vowTake: (id, S, d) => {
      if (K.activeVows(S).length >= K.MAX_VOWS || S.vows.some((v) => v.id === id)) return;
      S.vows.push({ id, broken: false, age: S.age }); d.vowTaken = id;
      FX.journal("You swore a vow: " + K.VOWS[id].name.toLowerCase() + ".", S);
    },
    vowBreak: (id, S, d) => {
      const v = S.vows.find((x) => x.id === id && !x.broken);
      if (!v) return;
      v.broken = true; v.brokenAge = S.age; d.vowBroken = id;
      FX.flag("broke_" + id, S);
      S.rep.common = K.clamp(S.rep.common - 1); S.duty.conscience = K.clamp(S.duty.conscience - 1);
      FX.journal("You broke your vow: " + K.VOWS[id].name.toLowerCase() + ".", S);
    },
    vowRelease: (id, S) => { const v = S.vows.find((x) => x.id === id && !x.broken); if (v) { v.broken = true; v.released = true; } },
    boon: (id, S, d) => { if (!S.boons.includes(id)) { S.boons.push(id); d.boon = id; } },
    curse: (id, S, d) => { if (!S.curses.some((c) => c.id === id)) { S.curses.push({ id, fired: false, age: S.age }); d.curse = id; } },
    fireCurse: (id, S) => { const c = S.curses.find((x) => (id === "any" || x.id === id) && !x.fired); if (c) c.fired = true; },
    injury: (id, S, d) => { if (!S.injuries.includes(id)) { S.injuries.push(id); d.injury = id; } },
    die: (who, S) => {
      if (who === true || who === "self") { if (!S.storyMode) S.alive = false; else FX.injury("scar", S, {}); }
      else for (const w of [].concat(who)) if (!S.dead.includes(w)) S.dead.push(w);
    },
    deathText: (t, S) => { S.deathText = K.fmt(t, S); },
    age: (n, S) => { S.age = n; }
  };
  K.apply = function (fx, S = K.S) {
    const d = {};
    if (!fx) return d;
    if (typeof fx === "function") fx = fx(S) || {};
    for (const [k, v] of Object.entries(fx)) {
      if (!FX[k]) throw new Error("Unknown effect: " + k);
      FX[k](v, S, d);
    }
    return d;
  };
  K.vowBreaksFor = (tags, S = K.S) =>
    [].concat(tags || []).map((t) => K.VOW_TAGS[t]).filter((id) => id && K.hasVow(id, S));

  // ---------- Events ----------
  const listeners = {};
  K.on = (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); };
  K.emit = (ev, data) => { for (const fn of listeners[ev] || []) fn(data); };
})(window.K = window.K || {});
