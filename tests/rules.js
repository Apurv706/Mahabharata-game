/* The rules of vows, divine weapons, friendships and moments (PRD §18.12), checked directly on the engine.
   Usage: node tests/rules.js */
global.window = global; global.K = {};
const G = require("path").join(__dirname, "..", "game", "js") + "/";
["engine/i18n","engine/core","engine/flow","engine/abilities","engine/combat","content/world","content/tests","content/act1","content/roots","content/act2","content/act3","content/act4","content/act5","content/act6a","content/act6b","content/act7","content/events","content/vows"].forEach((f) => require(G + f + ".js"));
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
console.log(fails ? fails + " FAILED" : "all passed"); process.exit(fails ? 1 : 0);
