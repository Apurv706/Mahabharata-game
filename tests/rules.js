/* The rules of vows, divine weapons, friendships and moments (PRD §18.12), checked directly on the engine.
   Usage: node tests/rules.js */
global.window = global; global.K = {};
const G = require("path").join(__dirname, "..", "game", "js") + "/";
["engine/i18n","engine/core","engine/flow","engine/abilities","engine/combat","content/world","content/tests","content/act1","content/roots","content/act2","content/act3","content/act4","content/act5","content/act6a","content/act6b","content/act7","content/events","content/vows","content/astras"].forEach((f) => require(G + f + ".js"));
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
// 12. Tapas (§18.8): a point an act for each kept vow, two for celibacy; a broken vow halves it
S = fresh({ act: 3, tapas: 0 }); S.vows.push({ id: "never_lie", broken: false }, { id: "celibacy", broken: false });
K.SCENES.zz_next = { id: "zz_next", act: 4, age: 24, body: ["x"], choices: [] }; K.go("zz_next");
ok(S.tapas === 3, "tapas +1 for a kept vow and +2 for celibacy at the turn of an act (" + S.tapas + ")");
S.tapas = 9; K.apply({ vowBreak: "never_lie" });
ok(S.tapas === 4, "a broken vow halves tapas (" + S.tapas + ")");
S = fresh({ tapas: 19 }); K.apply({ tapas: 5 }); ok(S.tapas === 20, "tapas holds at 20");
ok(K.preview({ fx: { tapas: -3 } }).some((x) => /Costs 3 tapas/.test(x[1])), "preview: Costs n tapas");
// 13. Named weapons: granted, a moment with the name; a condition broken costs by the giver
S = fresh(); K.apply({ astraGrant: { id: "varuna", from: "lake_sage" } });
ok(S.astras.length === 1 && S.moments.some((m) => m.kind === "astra" && m.which === "varuna"), "Varunastra granted, with its named moment");
K.breakTags(["lie"]);
ok(!S.astras.length, "the sage of the lake takes the Varunastra back after a lie");
S = fresh(); K.apply({ astraGrant: { id: "agneya", from: "fire_altar" } }); K.breakTags(["strike_unarmed"]);
ok(S.astras.length === 1 && S.astras[0].broken && S.curses.some((c) => c.id === "astra_condition"), "the fire's Agneyastra stays, its mantra cursed");
S = fresh({ boons: ["astra"] }); S.astra = { from: "penance" }; K.migrate && K.migrate(S);
ok(S.boons.includes("astra") && Array.isArray(S.astras), "an old save with boons:[astra] still holds its weapon");
// 14. Raksha and sanjivani each undo one death
S = fresh(); K.apply({ charge: { raksha: 1, sanjivani: 1 } });
K.apply({ die: true }); ok(S.alive && S.charges.raksha === 0 && S.charges.sanjivani === 1 && S.injuries.includes("scar"), "the raksha sutra undoes a death");
K.apply({ die: true }); ok(S.alive && S.charges.sanjivani === 0, "then the sanjivani root undoes one");
K.apply({ die: true }); ok(!S.alive, "and the third death holds");
// 15. Antardhana: a failed stealth check passes, once an act
S = fresh({ act: 5, boons: ["antardhana"] });
const sneak = { id: "s", check: { attr: "grace", skill: "stealth", dc: 99, pass: { text: "P" }, fail: { text: "F" } } };
r = K.choose({ id: "y", choices: [] }, sneak); ok(r.check.pass && S.vanishedAct === 5, "Antardhana turns a failed stealth check into a pass");
r = K.choose({ id: "y", choices: [] }, sneak); ok(!r.check.pass, "only once in an act");
// 16. Soma: +2 for a day, then -1 for the next day, then as before
S = fresh(); S.attrs.might = 4; S.attrs.aim = 1; S.attrs.grace = 1; S.attrs.wisdom = 1; S.attrs.command = 1;
S.attrs.might += 2; S.soma = { attr: "might", until: S.log.length + 3 };
for (let i = 0; i < 3; i++) { S.log.push("t" + i); K.somaTick(S, {}); }
ok(S.attrs.might === 3, "soma wears off into a day of weakness (" + S.attrs.might + ")");
for (let i = 0; i < 3; i++) { S.log.push("u" + i); K.somaTick(S, {}); }
ok(S.attrs.might === 4 && !S.soma, "then strength is as before");
// 17. At most two weapon quests offered in a life
S = fresh({ act: 5, astraOffers: 2 }); S.attrs.might = 5;
ok(!["w_fire", "w_dive", "w_riddle", "w_naga"].some((id) => K.test(K.SCENES[id].when, S)), "no third weapon quest");
S.astraOffers = 1; ok(K.test(K.SCENES.w_fire.when, S), "a second quest can still come");
// 18. The kavacha leaves one breath in a lethal fight
S = fresh({ act: 6, age: 40, side: "pandava" }); S.charges = { kavacha: 1 };
K.ENCOUNTERS.t_war = { id: "t_war", lethal: true, enemies: [{ name: "Soldier", hp: 30, atk: 99, def: 0 }], win: {}, lose: {} };
K.Combat.start("t_war", () => {}); { const B = K.Combat.state ? K.Combat.state() : null; const P = K.Combat.player(), E = B ? B.units.find((u) => u.side === "enemy") : null;
  if (E) { P.hp = 5; B.defNow = null; B.hit(E, P, 1); ok(P.hp === 1 && S.charges.kavacha === 0, "the kavacha leaves one breath after a killing blow"); B.hit(E, P, 1); ok(P.hp === 0, "and only once"); }
  else ok(false, "kavacha: no fight state to test on"); }
console.log(fails ? fails + " FAILED" : "all passed"); process.exit(fails ? 1 : 0);
