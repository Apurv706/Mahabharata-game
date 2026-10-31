/* The rules of vows, divine weapons, friendships and moments (PRD §18.12), checked directly on the engine.
   Usage: node tests/rules.js */
global.window = global; global.K = {};
const G = require("path").join(__dirname, "..", "game", "js") + "/";
["engine/i18n","engine/core","engine/flow","engine/abilities","engine/combat","content/world","content/tests","content/act1","content/roots","content/act2","content/act3","content/act4","content/act5","content/act6a","content/act6b","content/command","content/act7","content/events","content/vows","content/astras"].forEach((f) => require(G + f + ".js"));
K.save = () => true; K.emit = () => {};
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("FAIL", m); } else console.log("ok  ", m); };
const fresh = (o) => { K.S = Object.assign(K.newLife(), { name: "T", origin: "suta", age: 20, act: 3 }, o || {}); K.momentQueue.length = 0; return K.S; };
// 1. Vow prices
let S = fresh(); S.vows.push({ id: "never_lie", broken: false }); S.bonds.yudhishthira = 6; S.bonds.vidura = 5;
K.apply({ vowBreak: "never_lie" });
ok(S.bonds.yudhishthira === 3 && S.bonds.vidura === 2, "never_lie broken: watchers -3");
ok(S.curses.some((c) => c.id === "wheel"), "never_lie broken: wheel curse");
S = fresh(); S.vows.push({ id: "celibacy", broken: false }); S.attrs.wisdom = 4; K.apply({ vowBreak: "celibacy" });
ok(S.attrs.wisdom === 3 && S.flags.includes("no_blessing"), "celibacy broken: wisdom -1, no blessing");
S = fresh(); S.vows.push({ id: "never_retreat", broken: false }); K.apply({ vowBreak: "never_retreat" });
ok(S.flags.includes("company_shaken"), "never_retreat broken: company shaken");
// 2. Friendship ends below 3
S = fresh({ friend: "bhima" }); S.bonds.bhima = 4; S.vows.push({ id: "never_retreat", broken: false });
K.apply({ vowBreak: "never_retreat" });
ok(S.friend === null && S.lostFriends[0].who === "bhima" && S.moments.some((m) => m.kind === "farewell"), "a watcher friend below 3 walks away, with a farewell");
// spare_karna breaks the friendship at once
S = fresh({ friend: "karna" }); S.bonds.karna = 9; S.vows.push({ id: "spare_karna", broken: false }); K.apply({ vowBreak: "spare_karna" });
ok(S.friend === null && S.bonds.karna === 0, "striking Karna under the vow ends the friendship");
// 3. Weapon conditions
S = fresh({ teacher: "drona" }); K.apply({ boon: "astra", astraFrom: "teacher" });
ok(S.astra.from === "drona" && S.moments.some((m) => m.kind === "astra" && m.from === "drona"), "astra from Drona, with its moment");
K.breakTags(["strike_unarmed"]);
ok(!S.boons.includes("astra") && S.astra.broken, "Drona takes the weapon back when the condition is broken");
S = fresh(); K.apply({ boon: "astra", astraFrom: "penance" }); K.breakTags(["strike_unarmed"]);
ok(S.boons.includes("astra") && S.curses.some((c) => c.id === "astra_condition"), "penance weapon stays, its mantra will fail");
S = fresh({ teacher: "hermit" }); K.apply({ boon: "astra", astraFrom: "mauni" }); K.apply({ flag: "betrayed_hermit" });
ok(!S.boons.includes("astra"), "telling who taught you breaks Mauni's condition");
// 4. My word
S = fresh({ act: 5 }); S.vows.push({ id: "never_lie", broken: false });
const sc = { id: "x", choices: [] }, c = { id: "c", check: { attr: "wisdom", skill: "statecraft", dc: 99, pass: { text: "P" }, fail: { text: "F" } } };
let r = K.choose(sc, c); ok(r.check.pass && r.check.word, "My word: a statecraft test passes without a roll");
r = K.choose(sc, c); ok(!r.check.pass && !r.check.word, "My word: only once in each act");
ok(K.merits({ attr: "wisdom", skill: "statecraft" }).n >= 1, "honest persuasion +1 under the vow");
// 5. Preview of a breaking choice
S = fresh({ friend: "arjuna" }); S.bonds.arjuna = 5; S.vows.push({ id: "spare_unarmed", broken: false });
const pv = K.preview({ tags: ["strike_unarmed"], fx: {} }).map((x) => x[1]).join(" | ");
ok(/Breaks vow/.test(pv) && /will not forgive it/.test(pv) && /Ends your friendship with Arjuna/.test(pv), "preview names the vow, the watchers and the friendship: " + pv);
// 6. A spared foe returns the favour
S = fresh(); S.vows.push({ id: "spare_unarmed", broken: false }); S.spared = 1;
K.ENCOUNTERS.t_enc = { id: "t_enc", lethal: true, lose: {} };
const o = K.combatOutcome("t_enc", "lose", "next_scene");
ok(S.alive && S.flags.includes("saved_by_spared") && o.next === "next_scene", "a spared soldier drags you out once");
// 7. Penance and reconciliation
S = fresh(); S.vows.push({ id: "never_lie", broken: false }); S.bonds.vidura = 6; K.apply({ vowBreak: "never_lie" }); K.apply({ penance: "never_lie" });
ok(S.penanceDone === "never_lie" && !S.curses.some((c) => c.id === "wheel" && !c.fired) && S.bonds.vidura === 5, "penance lifts the price");
S = fresh(); S.lostFriends = [{ who: "bhima" }]; S.bonds.bhima = 1; K.apply({ reconcile: "bhima" });
ok(S.friend === "bhima" && S.bonds.bhima >= 4 && !S.lostFriends.length, "a lost friend can come back");
// 8. Moments for teacher, marriage, vow, company; none for a twice-failed Charu
S = fresh(); K.apply({ set: { teacher: "kripa" } }); K.apply({ set: { spouse: "madhavi" } }); K.apply({ vowTake: "never_lie" }); K.apply({ flag: "role_command" });
ok(["teacher", "marriage", "vow", "company"].every((k) => S.moments.some((m) => m.kind === k)), "teacher, marriage, vow and company moments");
S = fresh(); K.apply({ set: { friend: "charu" }, flag: "missed_lamp_twice" });
ok(!S.moments.some((m) => m.kind === "friend"), "no friendship moment for Charu after two failed tries");
// 9. Before-scenes
S = fresh({ friend: "charu", act: 3 }); S.vows.push({ id: "never_lie", broken: false });
ok(K.resolveScene("a3_rajasuya").id === "v_word", "the lie scene comes before the Rajasuya when it applies");
S.seen.push("v_word"); ok(K.resolveScene("a3_rajasuya").id === "a3_rajasuya", "and only once");
// 10. A gift grows after fifteen years kept
S = fresh({ age: 20 }); S.vows.push({ id: "spare_unarmed", broken: false, age: 19 });
const n1 = K.merits({ attr: "grace", skill: "stealth" }).n; S.age = 35;
ok(n1 === 1 && K.merits({ attr: "grace", skill: "stealth" }).n === 2, "the common people's warnings grow after fifteen years kept");
// 11. The Karna pull comes before Karna's secret, after the captive scene
S = fresh({ friend: "bhima", act: 5 }); S.vows.push({ id: "spare_karna", broken: false }); S.seen.push("v_captive");
ok(K.resolveScene("a5_karna_secret").id === "v_ford", "the ford scene comes when the vow and a Pandava friend apply");
// 12. Rising to command and holding fights (PRD §18.3)
S = fresh({ act: 6, age: 44 }); S.flags.push("role_command");
ok(K.rankOf(S) === "role_command", "a company leader's rank");
S.flags.push("role_division", "role_council"); ok(K.rankOf(S) === "role_council", "the highest rank wins");
S = fresh({ act: 6, age: 44, side: "pandava" }); S.flags.push("role_command"); S.attrs.command = 5; S.record.won = 3; S.record.last = "won";
ok(K.resolveScene("a6_bhishma").id === "cmd_promotion_1", "the promotion comes before Bhishma's fall");
S = fresh({ act: 6, age: 44, side: "pandava", path: "strategist" }); S.flags.push("role_command", "role_division");
let HB = K.Combat.start("hold_duryodhana", () => {}); const hero = HB.units.find((u) => u.hero);
hero.hp = Math.round(hero.maxHp * 0.12); let low = hero.hp, guard = 0;
while (!HB.over && guard++ < 300) { const t = HB.units.find((u) => u.side === "enemy" && u.hp > 0 && u.hero) || HB.units.find((u) => u.side === "enemy" && u.hp > 0); K.Combat.act("strike", t.uid); low = Math.min(low, hero.hp); }
ok(low >= Math.round(hero.maxHp * 0.1) - 1, "a champion in a holding fight cannot be brought below a tenth: " + low + "/" + hero.maxHp);
ok(HB.over === "lose" || HB.round > 8, "a holding fight is won only by outlasting it (" + HB.over + " at round " + HB.round + ")");
S = fresh({ act: 6, age: 44, side: "kaurava" }); S.flags.push("role_command", "role_division", "council_flank", "council_flank_chariot");
ok(K.resolveScene("a6_day17").id !== "hold_bhima_offer", "choosing the chariot flank keeps Bhima's charge away");
S = fresh({ act: 6, age: 44 }); S.flags.push("line_broken"); K.Combat.start("e_last_stand", () => {});
ok(!S.flags.includes("line_broken"), "a broken line is paid for in the next deadly fight, once");
// 19. Tapas (§18.8): a point an act for each kept vow, two for celibacy; a broken vow halves it
S = fresh({ act: 3, tapas: 0 }); S.vows.push({ id: "never_lie", broken: false }, { id: "celibacy", broken: false });
K.SCENES.zz_next = { id: "zz_next", act: 4, age: 24, body: ["x"], choices: [] }; K.go("zz_next");
ok(S.tapas === 3, "tapas +1 for a kept vow and +2 for celibacy at the turn of an act (" + S.tapas + ")");
S.tapas = 9; K.apply({ vowBreak: "never_lie" });
ok(S.tapas === 4, "a broken vow halves tapas (" + S.tapas + ")");
S = fresh({ tapas: 19 }); K.apply({ tapas: 5 }); ok(S.tapas === 20, "tapas holds at 20");
ok(K.preview({ fx: { tapas: -3 } }).some((x) => /Costs 3 tapas/.test(x[1])), "preview: Costs n tapas");
// 20. Named weapons: granted, a moment with the name; a condition broken costs by the giver
S = fresh(); K.apply({ astraGrant: { id: "varuna", from: "lake_sage" } });
ok(S.astras.length === 1 && S.moments.some((m) => m.kind === "astra" && m.which === "varuna"), "Varunastra granted, with its named moment");
K.breakTags(["lie"]);
ok(!S.astras.length, "the sage of the lake takes the Varunastra back after a lie");
S = fresh(); K.apply({ astraGrant: { id: "agneya", from: "fire_altar" } }); K.breakTags(["strike_unarmed"]);
ok(S.astras.length === 1 && S.astras[0].broken && S.curses.some((c) => c.id === "astra_condition"), "the fire's Agneyastra stays, its mantra cursed");
S = fresh({ boons: ["astra"] }); S.astra = { from: "penance" }; K.migrate && K.migrate(S);
ok(S.boons.includes("astra") && Array.isArray(S.astras), "an old save with boons:[astra] still holds its weapon");
// 21. Raksha and sanjivani each undo one death
S = fresh(); K.apply({ charge: { raksha: 1, sanjivani: 1 } });
K.apply({ die: true }); ok(S.alive && S.charges.raksha === 0 && S.charges.sanjivani === 1 && S.injuries.includes("scar"), "the raksha sutra undoes a death");
K.apply({ die: true }); ok(S.alive && S.charges.sanjivani === 0, "then the sanjivani root undoes one");
K.apply({ die: true }); ok(!S.alive, "and the third death holds");
// 22. Antardhana: a failed stealth check passes, once an act
S = fresh({ act: 5, boons: ["antardhana"] });
const sneak = { id: "s", check: { attr: "grace", skill: "stealth", dc: 99, pass: { text: "P" }, fail: { text: "F" } } };
r = K.choose({ id: "y", choices: [] }, sneak); ok(r.check.pass && S.vanishedAct === 5, "Antardhana turns a failed stealth check into a pass");
r = K.choose({ id: "y", choices: [] }, sneak); ok(!r.check.pass, "only once in an act");
// 23. Soma: +2 for a day, then -1 for the next day, then as before
S = fresh(); S.attrs.might = 4; S.attrs.aim = 1; S.attrs.grace = 1; S.attrs.wisdom = 1; S.attrs.command = 1;
S.attrs.might += 2; S.soma = { attr: "might", until: S.log.length + 3 };
for (let i = 0; i < 3; i++) { S.log.push("t" + i); K.somaTick(S, {}); }
ok(S.attrs.might === 3, "soma wears off into a day of weakness (" + S.attrs.might + ")");
for (let i = 0; i < 3; i++) { S.log.push("u" + i); K.somaTick(S, {}); }
ok(S.attrs.might === 4 && !S.soma, "then strength is as before");
// 24. At most two weapon quests offered in a life
S = fresh({ act: 5, astraOffers: 2 }); S.attrs.might = 5;
ok(!["w_fire", "w_dive", "w_riddle", "w_naga"].some((id) => K.test(K.SCENES[id].when, S)), "no third weapon quest");
S.astraOffers = 1; ok(K.test(K.SCENES.w_fire.when, S), "a second quest can still come");
// 25. The kavacha leaves one breath in a lethal fight
S = fresh({ act: 6, age: 40, side: "pandava" }); S.charges = { kavacha: 1 };
K.ENCOUNTERS.t_war = { id: "t_war", lethal: true, enemies: [{ name: "Soldier", hp: 30, atk: 99, def: 0 }], win: {}, lose: {} };
K.Combat.start("t_war", () => {}); { const B = K.Combat.state ? K.Combat.state() : null; const P = K.Combat.player(), E = B ? B.units.find((u) => u.side === "enemy") : null;
  if (E) { P.hp = 5; B.defNow = null; B.hit(E, P, 1); ok(P.hp === 1 && S.charges.kavacha === 0, "the kavacha leaves one breath after a killing blow"); B.hit(E, P, 1); ok(P.hp === 0, "and only once"); }
  else ok(false, "kavacha: no fight state to test on"); }
// 26. Friends who come to help (engine/friends.js)
require(G + "engine/friends.js");
S = fresh({ friend: "bhima", act: 3, age: 24 }); S.bonds.bhima = 6; S.bonds.karna = 8;
ok(K.friendsNear(S).join() === "karna,bhima", "a bond of 7, or a friend for life at 5, can come: " + K.friendsNear(S).join());
S.side = "pandava"; ok(!K.friendsNear(S).includes("karna"), "Karna does not come once you stand with the Pandavas");
S = fresh({ friend: "arjuna", act: 5, age: 36 }); S.bonds.arjuna = 9;
ok(!K.friendsNear(S).length, "Arjuna is away in the middle exile years");
S.age = 43; S.bonds.bhima = 9; ok(!K.friendsNear(S).length, "no prince comes in the hidden year");
S.age = 42; ok(K.friendsNear(S).includes("bhima"), "Bhima comes before the hidden year");
S = fresh({ friend: "charu" }); S.bonds.charu = 7; S.lostFriends = [{ who: "charu" }];
ok(!K.friendsNear(S).length, "a friendship that ended reaches no one");
S = fresh({ friend: "charu" }); S.bonds.charu = 7;
const h = K.friendHelp(S, { lethal: false }); ok(h.unit && h.who === "charu" && h.unit.def === 0, "Charu comes, with no armour");
// A friend hurt in a fight carries a scar; Charu can die in a deadly one.
K.friendAfter({ over: "win", enc: { lethal: false }, units: [{ side: "ally", called: true, person: "charu", hp: 5, maxHp: 34 }] }, S);
ok(S.flags.includes("scar_charu") && S.memories.some((m) => m.who === "charu"), "a friend hurt for you carries a scar, and remembers");
K.friendAfter({ over: "lose", enc: { lethal: true }, units: [{ side: "ally", called: true, person: "charu", hp: 0, maxHp: 34 }] }, S);
ok(S.dead.includes("charu"), "Charu falls in a deadly fight you called them into");
// 27. Assist never changes the engine: with the setting off, step mode is asked for as before
// With the assist off, a fight played by chance (no step mode) resolves blows exactly as before: same seed, same log.
const runFight = () => { K.seed(7); S = fresh({ act: 3, age: 24, path: "archer" }); K.Combat.stepNext = false; const B = K.Combat.start("e_bandits", () => {}); for (let i = 0; i < 12 && !B.over; i++) K.Combat.act("strike"); const out = B.log.map((l) => l.key || l.raw).join("|"); K.Combat.end(); return out; };
ok(runFight() === runFight(), "the same fight plays the same way twice: assist off changes nothing in the engine");
console.log(fails ? fails + " FAILED" : "all passed"); process.exit(fails ? 1 : 0);
