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
// 28. The night the lac house burns (§18.2)
S = fresh({ act: 3 });
ok(K.resolveScene("a3_fuse").id === "a3_fire", "the cellar scene is skipped by someone who does not know the plot");
S = fresh({ act: 3, teacher: "vidura" });
ok(K.resolveScene("a3_fuse").id === "a3_fuse", "a pupil of Vidura gets the cellar scene");
const fuse = K.SCENES.a3_fuse, fire = K.SCENES.a3_fire;
K.choose(fuse, fuse.choices.find((x) => x.id === "warn"));
ok(S.flags.includes("warned_pandavas") && S.flags.includes("bhima_debt"), "warning the Pandavas leaves Bhima in your debt");
S = fresh({ act: 3, teacher: "vidura" }); K.choose(fuse, fuse.choices.find((x) => x.id === "silent"));
ok(!S.flags.includes("bhima_debt"), "silence earns no debt");
S = fresh({ act: 3, teacher: "vidura" }); K.choose(fuse, fuse.choices.find((x) => x.id === "cut"), "win");
ok(S.flags.includes("cut_fuses") && S.flags.includes("bhima_debt"), "cutting the oil lines: cut_fuses and bhima_debt");
const run = fire.choices.find((x) => x.id === "run");
S = fresh({ act: 3, teacher: "vidura" }); S.flags.push("warned_pandavas"); K.choose(fire, run, "lose");
ok(!S.alive && S.flags.includes("died_in_fire"), "a failed escape is death, not a second try");
const endF = K.composeEnding(S); ok(endF.title === "The burnt house" && endF.art === "end_fire", "the fire death has its own ending");
S = fresh({ act: 3, storyMode: true }); S.flags.push("warned_pandavas"); K.choose(fire, run, "lose");
ok(S.alive && S.flags.includes("lac_burnt"), "story mode: burnt, not killed");
S = fresh({ act: 3 }); S.flags.push("warned_pandavas"); S.lacCarried = 1; K.choose(fire, run, "win");
ok(S.flags.includes("escaped_lac") && S.flags.includes("carried_out_lac"), "carrying a sleeper out is remembered");
ok(K.ENDINGS.some((e) => e.title === "The burnt house" && e.art === "end_fire"), "the burnt house is in the endings list");
// 29. Episodes (content/episodes.js): where they come, keepsakes, the telling
require(G + "content/episodes.js");
S = fresh({ act: 1, age: 6 });
ok(K.resolveScene("a1_first").id === "ep_sibling", "the elder sibling is asked about before the first scene");
K.apply({ set: { sibling: "devi" }, flag: "has_sibling" }); S.seen.push("ep_sibling");
ok(K.resolveScene("a1_first").id === "a1_first", "and only once");
ok(K.BEFORE.a3_rajasuya[0] !== "ep_mentor_vidura" && K.BEFORE.a3_rajasuya.includes("ep_mentor_vidura"), "episodes join the vow scenes before the Rajasuya, after them");
S = fresh(); K.apply({ keepsake: "letter" }); K.apply({ keepsake: "letter" });
ok(S.keepsakes.length === 1 && S.keepsakes[0] === "letter", "a keepsake is kept once");
S = fresh({ act: 6, side: "kaurava" }); K.apply({ flag: ["beat_ugra", "ugra_across"] });
ok(K.resolveScene("a6_day18").id === "a6_day18", "Ugra, beaten fairly at the fair, fights beside you and is never across the field");
ok(K.warAllies(S).includes("ugra"), "... he is in your line");
S = fresh({ act: 6, side: "kaurava" }); K.apply({ flag: ["shamed_ugra", "ugra_across"] });
ok(K.resolveScene("a6_day18").id === "ep_ugra_last", "Ugra, shamed at the fair, meets you across the field on the seventeenth day");
ok(!K.warAllies(S).includes("ugra"), "... and is never in your line");
S = fresh({ act: 7, age: 45, path: "archer", side: "pandava" }); K.apply({ flag: ["carried_false_orders", "bard_wrong"] });
const tl = K.composeEnding(S).telling.map((x) => (Array.isArray(x) ? x[0] : x)).join(" | ");
ok(/false orders across the river/.test(tl) && /^.*They say that /.test(tl), "the telling carries the false orders and the bard's wrong version");
// 30. Saves and save codes (code review, 1 Nov): cleaned before use, never half a choice, Continue stays put
{
  const evil = Object.assign(K.newLife(), { scene: "a1_home", seen: ["a1_home"], temperament: "x\"><img src=x onerror=alert(1)>", injuries: undefined, bonds: { arjuna: "<img src=x>" }, name: 7 });
  delete evil.injuries;
  const code = Buffer.from(unescape(encodeURIComponent(JSON.stringify(evil)))).toString("base64");
  const s2 = K.importCode(code);
  ok(s2.temperament === null && Array.isArray(s2.injuries) && !("arjuna" in s2.bonds) && typeof s2.name === "string", "a hostile save code is cleaned: unknown temperament dropped, missing lists restored, bonds are numbers");
  let msg = ""; try { K.importCode("123"); } catch (e) { msg = e.message; }
  ok(/could not be read/.test(msg), "a save code that is not a life gives the plain message, not a TypeError");
}
S = fresh({ act: 1, age: 6 }); K.go("a1_home");
{
  const sc = K.SCENES[S.scene], c = K.choiceList(sc).find((x) => x.ok).c, before = S.log.length;
  K.choose(sc, c);
  const exported = JSON.parse(decodeURIComponent(escape(Buffer.from(K.exportCode(), "base64").toString("binary"))));
  ok(S.log.length === before + 1 && exported.log.length === before, "the save code on a result page holds the life as the scene opened (the choice is not made twice)");
}
S = fresh({ act: 6, age: 44, side: "pandava" }); K.go("a6_eve"); // reaches w_eve first (its own flag is set on entry)
{
  const at = S.scene, saved = K.cleanLife(JSON.parse(JSON.stringify(S)));
  K.resume(saved);
  ok(at === "w_eve" && K.S.scene === "w_eve", "Continue returns to the scene that was saved, even one whose own flag would skip it");
}
// 31. A slot that draws nothing still plays the scenes that come before its `then` scene
S = fresh();
K.SCENES.zz_then = { id: "zz_then", act: 3, age: 20, body: ["x"], choices: [] }; K.SCENES.zz_pre = { id: "zz_pre", act: 3, age: 20, body: ["x"], choices: [], next: "zz_then" };
K.BEFORE.zz_then = ["zz_pre"]; K.slot("zz_slot", { pool: [], then: "zz_then", none: 1 });
ok(K.resolveScene("zz_slot").id === "zz_pre", "an empty event slot hands on to the scenes before its next scene");
// 32. Soma and Bala give back exactly what they took
S = fresh(); S.attrs.might = 7; S.attrs.aim = 1; S.attrs.grace = 1; S.attrs.wisdom = 1; S.attrs.command = 1;
K.apply(K.SCENES.w_soma.choices.find((c) => c.resolve).resolve(S));
ok(S.attrs.might === 8, "Soma at might 7 reaches the cap of 8");
for (let i = 0; i < 12; i++) { S.log.push("t" + i); K.somaTick(S, {}); }
ok(S.attrs.might === 7 && !S.soma, "... and wears off back to 7, not 6 (" + S.attrs.might + ")");
S = fresh({ act: 5, age: 32, tapas: 5, exile: "forest" }); S.attrs.might = 8; S.attrs.grace = 3;
{ const sc = K.SCENES.a5_forest_boon, c = sc.choices.find((x) => x.id === "bala"); K.choose(sc, c); }
K.SCENES.zz_act6 = { id: "zz_act6", act: 6, age: 44, body: ["x"], choices: [] }; K.go("zz_act6");
ok(S.attrs.might === 8 && S.attrs.grace === 3, "Bala at might 8 wears off without costing a point (might " + S.attrs.might + ", grace " + S.attrs.grace + ")");
// 33. Story fixes
S = fresh({ act: 5, age: 43, exile: "court" }); S.seen.push("a5_matsya");
ok(K.resolveScene("a5_herd").id !== "ep_false_name", "the hidden-year scenes are only for those hiding in Matsya");
S = fresh({ act: 5, age: 43, exile: "forest" }); S.seen.push("a5_matsya", "ep_false_name"); K.apply({ flag: "left_virata" });
ok(!K.test(K.SCENES.ep_kichaka.when, S), "leaving Virata's household keeps you out of the dancing hall");
S = fresh({ act: 6, age: 44, side: "pandava", child: "vasu" }); K.apply({ flag: ["vasu_in_camp", "slowed_ashwatthama"] });
ok(!K.vasuLostInRaid(S), "holding Ashwatthama at the gate saves Vasu, in the raid's lines and in Act VII alike");
ok(K.SCENES.a6_wheel_again && K.SCENES.a6_day13.next === "a6_day14", "the wheel test comes before the day-13 scene, which goes on to day 14");
S = fresh({ act: 7, age: 45, side: "pandava" }); S.vows.push({ id: "vengeance", broken: true, released: true, age: 30 }); K.apply({ vowTake: "vengeance" });
ok(K.hasVow("vengeance", S), "a released vow of vengeance can be sworn again");
S = fresh({ act: 6, age: 44, side: "kaurava" });
{ const sc = K.SCENES.a6_raid || Object.values(K.SCENES).find((x) => (x.choices || []).some && (x.choices || []).some((c) => c.id === "refuse" && /Refuse him/.test(String(c.t)))); const c = sc.choices.find((x) => x.id === "refuse"); K.choose(sc, c); }
ok(S.flags.includes("refused_ashwatthama") && !S.flags.includes("refused_raid"), "refusing the night raid is its own flag, not refusing Matsya");
S = fresh({ act: 5, age: 43, friend: "charu" }); S.vows.push({ id: "spare_unarmed", broken: false, age: 20 }); S.dead.push("charu");
ok(!K.test(K.SCENES.v_captive.when, S), "a dead friend does not ask you to silence a spy");
// 34. A leader's mark: allies turn on the enemy you pick out; Command makes them hit it harder
S = fresh({ act: 6, age: 44, side: "pandava" });
{ const B = K.Combat.start("e_guard", () => {}); ok(!K.Combat.canMark(), "without a command rank there is no mark"); K.Combat.end && K.Combat.end(); }
S = fresh({ act: 6, age: 44, side: "pandava" }); S.flags.push("role_command"); S.attrs.command = 6;
{
  const B = K.Combat.start("e_guard", () => {});
  const foes = B.units.filter((u) => u.side === "enemy");
  const pick = foes[foes.length - 1];
  ok(K.Combat.canMark() && K.Combat.mark(pick.uid) && K.Combat.marked() === pick.uid, "a company leader marks the enemy they pick out");
  ok(B.markBonus === 2, "command 7 or more (6, +1 for age) adds 2 to their blows against the mark (" + B.markBonus + ")");
  for (let i = 0; i < 4 && !B.over && pick.hp > 0; i++) K.Combat.act("guard");
  // Blows that land on every enemy at once (a volley) are left out: only aimed blows choose a target.
  const area = new Set(Object.values(K.ABILITIES).filter((a) => a.target === "enemies" && a.verb).map((a) => a.verb));
  const hits = B.log.filter((l) => l.u && l.u.a && l.u.a.side === "ally" && l.u.t && l.u.t.side === "enemy" && !area.has(l.key) && !/^Arrows rain/.test(l.key));
  ok(hits.length > 0 && hits.every((l) => l.u.t.uid === pick.uid || pick.hp === 0), "those beside you strike only the marked enemy while it stands (" + hits.length + " blows)");
  K.Combat.end && K.Combat.end();
}
// 35. You never grow younger (except waking from the prologue); Continue keeps your age
S = fresh({ act: 5, age: 41 }); S.scene = "w_mountain"; S.seen.push("w_mountain");
{ const sc = K.SCENES.ep_storm; const keep = sc.when; sc.when = null; K.go("ep_storm"); sc.when = keep; }
ok(K.S.age === 41, "a scene written younger than the one before it does not make you younger (" + K.S.age + ")");
S = fresh({ act: 1, age: 44 }); S.scene = "a0_dream"; K.go("a1_home");
ok(K.S.age === 6, "waking from the prologue's dream, you are six (" + K.S.age + ")");
S = fresh({ act: 2, age: 16 }); S.scene = "a2_teacher"; S.seen.push("a2_teacher"); K.go("a2_teacher", true);
ok(K.S.age === 16, "Continue on a scene keeps the age you had there (" + K.S.age + ")");
ok(K.SCENES.w_mountain.age <= 36 && K.SCENES.v_hold.age >= 42 && K.SCENES.ep_mentor_vidura.age >= 29, "the mountain, the river vow and Vidura's scene carry ages in story order");
// 36. The false-name test is a lie; those sworn never to lie have a truthful way through
{ const ch = K.SCENES.ep_false_name.choices; const nerve = ch.find((c) => c.id === "nerve"), truth = ch.find((c) => c.id === "truth");
  ok(nerve && (nerve.tags || []).includes("lie"), "answering the steward with a false name is tagged as a lie");
  S = fresh({ act: 5, age: 43 }); K.apply({ vowTake: "never_lie" });
  ok(K.vowBreaksFor(nerve.tags, S).length === 1, "a vow never to lie is warned of on the false-name test");
  ok(truth && K.test(truth.req, S) && !(truth.tags || []).includes("lie"), "a vow-holder can answer with only true things instead");
  S = fresh({ act: 5, age: 43 });
  ok(!K.test(truth.req, S), "without the vow, the truthful answer is not offered"); }
// 37. Step-mode fights never wait on nothing: stunned foes lose their turn, fallen foes are passed over
S = fresh({ act: 2, age: 18, path: "archer" }); S.attrs.aim = 8;
{
  const C = K.Combat; const B = C.start("e_bandits", () => {}); B.stepMode = true;
  let stuck = 0;
  for (let r = 0; r < 30 && !B.over; r++) {
    B.units.filter((u) => u.side === "enemy" && u.hp > 0).forEach((u) => { u.status.stun = 1; });
    const acted = C.act("strike", B.units.find((u) => u.side === "enemy" && u.hp > 0).uid);
    if (!acted) { stuck++; break; }
    for (let g = 0; g < 10 && C.foesPending(); g++) C.resolve(null);
  }
  ok(!stuck, "with every foe stunned, your move is always taken and the foes' turns always finish");
  C.end && C.end();
  const B2 = C.start("e_bandits", () => {}); B2.stepMode = true;
  C.act("guard"); // foes are now queued
  B2.units.filter((u) => u.side === "enemy").forEach((u) => { u.hp = u.side === "enemy" && u !== B2.units.find((x) => x.side === "enemy") ? 0 : u.hp; });
  B2.queue = B2.units.filter((u) => u.side === "enemy" && u.hp === 0).map((u) => u.uid);
  ok(!C.foesPending() && B2.queue === null && C.act("strike") === true, "a queue of fallen foes is closed, and it is your turn");
  C.end && C.end();
}
// 38. Your child on the field (war_child.js): the thread on the eve, and a fate decided by what he lived through
["content/episodes", "content/war_child"].forEach((f) => require(G + f + ".js"));
{
  const kid = (side, o) => { const S = fresh(Object.assign({ act: 6, age: 44, side, child: "vasu" }, o)); S.flags.push("vasu_away"); return S; };
  S = kid("pandava"); K.go("a6_day1");
  ok(K.S.scene === "wc_child_eve", "a child sent to another company comes to the eve scene first (" + K.S.scene + ")");
  K.choose(K.SCENES.wc_child_eve, K.SCENES.wc_child_eve.choices.find((c) => c.id === "satyaki"));
  ok(S.flags.includes("child_cmd_satyaki") && S.moments.some((m) => m.kind === "child_eve" && m.who === "vasu"), "choosing his commander ties the thread, with its moment");
  S.flags.push("child_line_held");
  ok(!K.childInRaidCamp(S) && !K.vasuLostInRaid(S), "unhurt under Satyaki, he is away from the camp on the night of the raid");
  S.flags.push("child_fell");
  ok(K.childHurt(S) && K.childInRaidCamp(S) && K.vasuLostInRaid(S), "hurt and not got out, he lies in the camp, and dies there unless the raid is stopped");
  S.flags.push("woke_camp"); ok(!K.vasuLostInRaid(S), "waking the camp saves him");
  S = kid("pandava"); S.flags.push("child_cmd_virata", "child_line_held");
  ok(K.childInRaidCamp(S) && K.vasuLostInRaid(S), "under Virata he sleeps in the camp whatever his day was");
  ok(typeof K.SCENES.a6_raid.choices.find((c) => c.id === "wake").hint === "function" && K.val(K.SCENES.a6_raid.choices.find((c) => c.id === "wake").hint, S) === "The only way to reach Vasu", "waking the camp is named as the only way to reach him");
  S = kid("kaurava"); S.flags.push("child_cmd_ashwatthama", "child_line_broken"); K.go("a6_duryodhana");
  ok(K.S.scene === "wc_child_dusk" && S.dead.includes("vasu") && /last day/.test(K.childDeath(S)), "Kaurava side: hurt on his day, he falls on the last day, and the fates say where");
  S = kid("kaurava"); S.flags.push("child_cmd_ashwatthama", "child_line_held"); K.go("a6_duryodhana");
  ok(!S.dead.includes("vasu") && S.flags.includes("child_survived_war"), "Kaurava side: held beside you, he lives");
}
// 39. On his day he goes down; dragging him out, or a friend called in, saves him
{
  const S0 = fresh({ act: 6, age: 44, side: "pandava", child: "vasu", friend: "bhima" }); S0.bonds.bhima = 8; S0.flags.push("vasu_away", "child_cmd_virata");
  let B = K.Combat.start("wc_e_child_line", () => {});
  let v = B.units.find((u) => u.person === "vasu");
  ok(!!v, "Vasu fights beside you on his day");
  v.hp = 0; const h = K.ENCOUNTERS.wc_e_child_line.callHelp(S0);
  ok(h.unit && h.unit.person === "bhima" && /stands over him/.test(K.text(h.text)), "with Vasu down, the friend you call goes to him");
  h.run(B); ok(v.hp > 0 && B.shielded, "and stands over him until he can get up");
  B.over = "win"; K.childFightEnd(B); K.Combat.end();
  ok(S0.flags.includes("child_saved") && !K.childHurt(Object.assign(S0, { flags: S0.flags.concat("child_line_broken") })), "a shielded child counts as saved, even when the line breaks");
  const S1 = fresh({ act: 6, age: 44, side: "kaurava", child: "vasu" }); S1.flags.push("vasu_away", "child_cmd_bhurishravas");
  B = K.Combat.start("wc_e_child_line", () => {}); v = B.units.find((u) => u.person === "vasu"); v.hp = 0; B.over = "win"; K.childFightEnd(B); K.Combat.end();
  ok(S1.flags.includes("child_fell") && K.childHurt(S1), "left where he fell, he is hurt");
}
// 40. The Shakti spent: what you say to Karna on the fourteenth night is what he answers on the seventeenth
{
  const call = K.SCENES.wc_shakti_call, pick = (id) => call.choices.find((c) => c.id === id);
  S = fresh({ act: 6, age: 44, side: "kaurava", friend: "karna", origin: "anga" }); S.bonds.duryodhana = 5;
  ok(K.test(K.SCENES.wc_shakti_k.when, S) && K.resolveScene("a6_day15").id === "wc_shakti_k", "beside Karna, the night of day 14 comes before the dawn");
  const gh = K.ENCOUNTERS.wc_e_ghost.callHelp(S);
  ok(gh.unit && gh.unit.person === "karna" && K.ENCOUNTERS.wc_e_ghost.hold, "against Ghatotkacha's night form you can only hold, and the call brings Karna");
  K.choose(call, pick("use"));
  ok(S.bonds.duryodhana === 7 && S.moments.some((m) => m.kind === "shakti" && m.from === "kaurava"), "urging him to use it: Duryodhana +2, and the spear's moment");
  ok(K.val(K.SCENES.a6_day17.body, S).some((b) => b && b.speaker === "Karna" && /Do not carry that/.test(b.line)), "on day 17 his last words forgive you");
  S = fresh({ act: 6, age: 44, side: "kaurava", friend: "karna" }); K.choose(call, pick("keep"));
  ok(/You were right/.test(K.karnaLastWords(S)), "urging him to keep it: his last words say you were right");
  S = fresh({ act: 6, age: 44, side: "kaurava", friend: "karna" }); S.flags.push("calmed_the_horse"); K.choose(call, pick("silent"));
  ok(/horse in the stable yard/.test(K.karnaLastWords(S)), "silent: his last words are about the horse, from childhood");
  S = fresh({ act: 6, age: 44, side: "kaurava" }); ok(!K.val(K.SCENES.a6_day17.body, S).some((b) => b && b.speaker === "Karna"), "no last words for those who were not there");
  S = fresh({ act: 6, age: 44, side: "pandava", friend: "bhima" });
  ok(K.resolveScene("a6_day15").id === "wc_shakti_p", "beside Bhima's son, the Pandava side tries to reach Karna's chariot");
  K.combatOutcome("wc_e_reach", "win", "wc_shakti_p_fall");
  ok(S.flags.includes("shakti_tried_stop") && S.memories.some((m) => m.who === "bhima"), "the attempt is remembered, by Bhima");
  K.go("wc_shakti_p_fall"); ok(S.moments.some((m) => m.kind === "shakti" && m.from === "pandava"), "the spear still flies, seen from the Pandava side");
}
// 41. War storylines (PRD 18.13): Bhurishravas on day 14 and the kings' fall on day 15 (content/war_kings.js)
require(G + "content/war_kings.js");
{
  const sc = (id) => K.SCENES[id], ch = (id, cid) => K.val(sc(id).choices, K.S).find((c) => c.id === cid);
  const war = (o, flags) => { const s = fresh(Object.assign({ act: 6, age: 44 }, o)); s.flags.push(...(flags || ["role_front"])); return s; };
  S = war({ side: "pandava", origin: "anga", court: "anga" });
  ok(K.test(sc("kb_ride").when, S) && !K.test(sc("kb_drag").when, S), "every Pandava fighter is ordered to ride with Satyaki, and meets Bhurishravas only by riding");
  S.flags.push("kb_rode");
  ok(K.test(sc("kb_drag").when, S), "riding with Satyaki leads to Bhurishravas");
  S = war({ side: "kaurava", origin: "anga", court: "hastinapura" });
  ok(K.test(sc("kb_drag").when, S), "a Kuru court fighter on the Kaurava side is in Bhurishravas's division");
  S = war({ side: "kaurava", origin: "mathura", court: "hastinapura" }, ["role_healer"]);
  ok(!K.test(sc("kb_drag").when, S), "healers stay in the tents");
  // The hold: Bhurishravas is held off Satyaki, never killed, and the rounds held are counted.
  S = war({ side: "pandava", origin: "mathura", path: "archer" }); S.attrs.aim = 6; S.attrs.might = 5;
  {
    const C = K.Combat, B = C.start("e_kb_hold", () => {});
    const bh = B.units.find((u) => u.person === "bhurishravas");
    for (let i = 0; i < 12 && !B.over; i++) C.act(i % 3 === 2 ? "guard" : "strike", bh.uid);
    ok(B.over && bh.hp >= Math.round(bh.maxHp * 0.1) - 1, "Bhurishravas cannot be brought down in the hold (" + bh.hp + " of " + bh.maxHp + ", " + B.over + ")");
    K.kbHoldCount(B);
    ok(S.kbHeld >= 0 && S.kbHeld <= 6 && (B.over !== "win" || S.kbHeld === 6), "the rounds held are counted (" + S.kbHeld + ", " + B.over + ")");
    const r2 = K.combatOutcome("e_kb_hold", B.over, "a6_day14");
    ok(r2.next === "kb_sits" && /takes off his arm/.test(r2.text), "however long you held, Arjuna's arrow takes the arm, and Bhurishravas sits down");
    C.end && C.end();
  }
  // Holding his arm for Satyaki breaks the vow never to strike the unarmed, with its full price.
  S = war({ side: "pandava", origin: "mathura", teacher: "drona" }); S.vows.push({ id: "spare_unarmed", broken: false, age: 20 }); S.bonds.arjuna = 6;
  K.apply({ boon: "astra", astraFrom: "teacher" });
  K.choose(sc("kb_sits"), ch("kb_sits", "arms"));
  ok(S.vows[0].broken && S.bonds.arjuna === 3 && S.bonds.satyaki === 6 && !S.boons.includes("astra"), "holding Bhurishravas's arm breaks the vow (Arjuna -3, Drona's weapon taken back) and Satyaki +3");
  S = war({ side: "pandava", origin: "mathura" }); const c5 = S.duty.conscience;
  K.choose(sc("kb_sits"), ch("kb_sits", "stop"));
  ok(S.duty.conscience === c5 + 2 && S.bonds.satyaki === 0 && S.memories.some((m) => m.who === "yudhishthira") && S.flags.includes("kb_tried_stop"), "trying to stop Satyaki: conscience +2, Satyaki -3, Yudhishthira remembers, pass or fail");
  ok(K.val(sc("kb_sits").choices, war({ side: "kaurava", court: "hastinapura" })).every((c) => ["carry", "leave"].includes(c.id)), "on the Kaurava side you come too late, and can only carry him back");
  // The kings: your court first, then the land you were born in.
  S = war({ side: "pandava", origin: "panchala", court: "indraprastha" });
  ok(K.test(sc("kf_reach").when, S) && K.val(sc("kf_reach").title, S) === "Drupada's parasol", "a Panchala-born Pandava reaches for Drupada");
  S = war({ side: "pandava", origin: "panchala", court: "matsya" });
  ok(K.val(sc("kf_reach").title, S) === "Virata's parasol", "in Virata's service, Virata is your king");
  ok(!K.test(sc("kf_reach").when, war({ side: "kaurava", origin: "panchala" })), "not on the Kaurava side");
  S = war({ side: "pandava", origin: "matsya" });
  K.choose(sc("kf_fall"), sc("kf_fall").choices[0], "lose");
  ok(S.flags.includes("kf_carried_king") && S.injuries.includes("arm"), "failing the carry costs a wound, not the body");
  // Riding with Dhrishtadyumna breaks a student's debt to Drona for good, and Drona takes his weapon back.
  ok(Array.isArray(K.val(sc("a6_day15").after, war({ side: "pandava", origin: "anga" }))), "for everyone else it closes the day as before");
  S = war({ side: "pandava", origin: "panchala", teacher: "drona" }); S.duty.teacher = 7; S.seen.push("kf_fall");
  K.apply({ boon: "astra", astraFrom: "teacher" });
  ok(K.val(sc("a6_day15").after, S) === null, "the half-truth's closing line waits for Dhrishtadyumna's sword");
  K.choose(sc("kf_drona"), ch("kf_drona", "ride"));
  ok(S.duty.teacher === 0 && S.flags.includes("kf_broke_debt") && !S.boons.includes("astra") && S.astra.broken, "riding with Dhrishtadyumna: teacher's debt to 0, Drona's weapon taken back");
  // A Kaurava student who steps between, out of depth: death; in story mode, a scar.
  for (const story of [false, true]) {
    S = war({ side: "kaurava", teacher: "drona", storyMode: story }); S.attrs.might = 1; S.skills.mace = 0;
    const step = ch("kf_drona", "step"), rng = K.rng; K.rng = () => 0;
    ok(K.inPeril(step, S), "stepping between, out of your depth, is perilous");
    K.choose(sc("kf_drona"), step); K.rng = rng;
    ok(story ? S.alive && S.injuries.includes("scar") : !S.alive && /Dhrishtadyumna's sword/.test(S.deathText), story ? "story mode: a scar instead" : "out of your depth: Dhrishtadyumna's sword does not stop");
  }
  // Taking word home: the rest of the night in the camp is passed by, and the road picks up on day 16.
  S = war({ side: "pandava", origin: "panchala" }, ["role_front", "role_division", "role_council"]); S.seen.push("kf_fall", "kf_drona", "kf_word");
  ok(K.resolveScene("a6_day16").id === "kb_debate", "staying, the night debate comes first");
  S.seen.push("kb_debate");
  ok(K.resolveScene("a6_day16").id === "cmd_council_2", "then the night council, before the sixteenth day");
  S.seen.pop();
  K.choose(sc("kf_word"), ch("kf_word", "home"));
  ok(S.flags.includes("kf_took_word") && S.missed.includes("cmd_council_2") && S.missed.includes("kb_debate") && K.resolveScene("a6_day16").id === "a6_day16", "riding home, the night is missed and the war's road goes on at day 16");
}
// 42. War storyline (PRD 18.13): the great duel on day 17 (content/war_duel.js)
require(G + "content/war_duel.js");
{
  const sc = (id) => K.SCENES[id];
  const war = (o, flags) => { const s = fresh(Object.assign({ act: 6, age: 44 }, o)); s.flags.push(...(flags || ["role_front"])); return s; };
  ok(K.BEFORE.a6_day17.includes("kd_son") && K.BEFORE.a6_day17.includes("kd_guard"), "both sides of the duel come before the wheel scene");
  ok(K.test(sc("kd_son").when, war({ side: "kaurava" })) && !K.test(sc("kd_son").when, war({ side: "kaurava" }, ["role_healer"])), "Kaurava fighters ride beside Vrishasena; healers stay in the tents");
  // Holding him: rounds counted; four or more and Karna's bond rises and his last words name it.
  S = war({ side: "kaurava", path: "archer" }); S.attrs.aim = 6; S.attrs.might = 5; S.bonds.karna = 4;
  {
    const C = K.Combat, B = C.start("kd_e_son", () => {});
    ok(B.units.some((u) => u.person === "vrishasena" && u.side === "ally"), "Vrishasena fights beside you");
    const ar = B.units.find((u) => u.person === "arjuna");
    for (let i = 0; i < 14 && !B.over; i++) C.act(i % 3 === 2 ? "guard" : "strike", ar.uid);
    ok(B.over && ar.hp >= Math.round(ar.maxHp * 0.1) - 1, "Arjuna is held off, never brought down (" + B.over + ")");
    K.kdHoldCount(B);
    ok(S.kdHeld >= 0 && S.kdHeld <= 6 && (B.over !== "win" || S.kdHeld === 6), "the rounds held are counted (" + S.kdHeld + ")");
    C.end && C.end();
  }
  S = war({ side: "kaurava" }); S.bonds.karna = 4; S.kdHeld = 6;
  const r1 = K.combatOutcome("kd_e_son", "win", "a6_day17");
  ok(S.bonds.karna === 6 && S.flags.includes("kd_stood") && /Vrishasena's throat/.test(r1.text), "held to the end: Karna +2, and Vrishasena still falls");
  ok(/my son's wheel/.test(K.karnaLastWords(S)) && K.val(sc("a6_day17").body, S).some((b) => b && b.speaker === "Karna"), "his last words name it");
  S.flags.push("shakti_urged_keep");
  ok(/my son.s wheel/.test(K.karnaLastWords(S)[0]) && /keep the spear/.test(K.karnaLastWords(S)[1]) && K.val(sc("a6_day17").body, S).filter((b) => b && b.speaker === "Karna").length === 2, "joined to what you told him on the fourteenth night, one set of last words");
  S = war({ side: "kaurava" }); S.bonds.karna = 4; S.kdHeld = 2; S.flags.push("shakti_urged_keep");
  const r2 = K.combatOutcome("kd_e_son", "flee", "a6_day17");
  ok(S.bonds.karna === 2 && S.flags.includes("kd_withdrew") && /Vrishasena's throat/.test(r2.text), "withdrew early: Karna -2, and Vrishasena still falls");
  ok(K.karnaLastWords(S) === null && !K.val(sc("a6_day17").body, S).some((b) => b && b.speaker === "Karna"), "he does not look at you again: no last words, warm or otherwise");
  S = war({ side: "kaurava" }); S.kdHeld = 5; K.combatOutcome("kd_e_son", "lose", "a6_day17");
  ok(S.flags.includes("kd_stood"), "four rounds or more counts, even if you went down after");
  { const pull = sc("a6_day17").choices.find((c) => c.id === "pull").req, s2 = war({ side: "kaurava" }); const before = K.test(pull, s2); s2.seen.push("kd_son"); ok(!before && K.test(pull, s2), "the way back from his side is for those who were there"); }
  // Vrishasena and Karna die on day 17 in every life: every road through these scenes goes on to the
  // wheel, every outcome of the son's fight ends with him falling, and the wheel's close is untouched.
  for (const id of ["kd_son", "kd_guard"]) ok(sc(id).next === "a6_day17" && sc(id).skipTo === "a6_day17", id + " goes on to the wheel scene");
  for (const o of ["win", "lose", "flee"]) {
    for (const n of [0, 6]) { S = war({ side: "kaurava" }); S.kdHeld = n; const r = K.combatOutcome("kd_e_son", o, "a6_day17"); ok(r.next === "a6_day17" && /Vrishasena's throat/.test(r.text), "Vrishasena falls (" + o + ", held " + n + ")"); }
    S = war({ side: "pandava" }); const r = K.combatOutcome("kd_e_wheel", o, "a6_day17"); ok(r.next === "a6_day17", "the wheel-guard goes on to the wheel (" + o + ")");
  }
  for (const side of ["pandava", "kaurava", "neutral"]) {
    S = war({ side }); const after = K.val(sc("a6_day17").after, S), wit = K.val(sc("a6_day17").witness, S);
    ok(after.some((b) => typeof b === "string" && /Arjuna's arrow takes Karna's life/.test(b)) && wit.some((b) => /Vrishasena/.test(b)), "day 17, " + side + ": Vrishasena falls and Arjuna's arrow takes Karna");
  }
  // The wheel-guard: never under the vow never to strike Karna.
  S = war({ side: "pandava" });
  ok(K.test(sc("kd_guard").when, S), "a Pandava fighter rides at Arjuna's wheel");
  S.vows.push({ id: "spare_karna", broken: false, age: 20 });
  ok(!K.test(sc("kd_guard").when, S), "never under the vow never to strike Karna");
  S = war({ side: "pandava" }); S.seen.push("hold_karna_offer");
  ok(!K.test(sc("kd_guard").when, S), "nor a division that already stood against Karna's chariot that day");
  // Held: the princes remember you on the night of the raid. Broken: a wound, and a shaken company.
  S = war({ side: "pandava" }); K.combatOutcome("kd_e_wheel", "win", "a6_day17");
  ok(K.val(sc("a6_raid").body, S).some((b) => b && /Yudhamanyu/.test(b.memory || "")) && K.val(sc("a6_raid").after, S).some((b) => b && /called your name/.test(b.memory || "")), "held: the Panchala princes remember you on the night of the raid");
  S = war({ side: "pandava" }); K.combatOutcome("kd_e_wheel", "lose", "a6_day17");
  ok(S.flags.includes("kd_guard_broken") && S.flags.includes("company_shaken") && S.injuries.length === 1, "broken: a wound, and the company shaken in its next fight");
  ok(!K.val(sc("a6_raid").after, S).some((b) => b && /called your name/.test(b.memory || "")), "and the princes do not call your name");
}
// 43. War storylines, second pass (content/war_kings.js): the ride with Satyaki on day 14 and the cry on day 15
{
  const sc = (id) => K.SCENES[id], ch = (id, cid) => K.val(sc(id).choices, K.S).find((c) => c.id === cid);
  const war = (o, flags) => { const s = fresh(Object.assign({ act: 6, age: 44 }, o)); s.flags.push(...(flags || ["role_front"])); return s; };
  ok(!K.test(sc("kb_ride").when, war({ side: "pandava" }, ["role_healer"])) && !K.test(sc("kb_ride").when, war({ side: "kaurava" })), "healers and the Kaurava side are not sent with Satyaki");
  // Refusing: Satyaki remembers, and you do not see Bhurishravas.
  S = war({ side: "pandava", origin: "mathura" }, ["role_command"]); S.bonds.satyaki = 4;
  K.choose(sc("kb_ride"), ch("kb_ride", "stay"));
  ok(S.bonds.satyaki === 2 && S.memories.some((m) => m.who === "satyaki") && !K.test(sc("kb_drag").when, S), "staying with Yudhishthira: Satyaki -2, he remembers, and no Bhurishravas, even for a Yadava company leader");
  // The ride: Satyaki fights beside you, and how it goes sets how worn out he is.
  S = war({ side: "pandava", path: "swordsman" }); S.flags.push("kb_rode");
  {
    const C = K.Combat, B = C.start("e_kb_ride", () => {});
    const sat = B.units.find((u) => u.person === "satyaki");
    ok(sat && sat.side !== "enemy", "Satyaki rides beside you as an ally");
    for (let i = 0; i < 14 && !B.over; i++) C.act(i % 3 === 2 ? "guard" : "strike", B.living("enemy")[0] && B.living("enemy")[0].uid);
    K.kbRideCount(B);
    ok([0, 1, 2].includes(S.kbRide), "how worn out Satyaki is, is counted (" + S.kbRide + ", " + B.over + ")");
    C.end && C.end();
    for (const o of ["win", "lose"]) ok(K.combatOutcome("e_kb_ride", o, "a6_day14").next === "kb_drag", "the ride goes on to Bhurishravas (" + o + ")");
  }
  const atk = (n) => { S.kbRide = n; return K.val(K.ENCOUNTERS.e_kb_hold.enemies, S)[0].atk; };
  ok(atk(0) > atk(1) && atk(1) > atk(2), "the more worn out Satyaki is, the harder Bhurishravas hits in the hold");
  ok(K.val(sc("kb_sits").body, S).some((b) => b && b.speaker === "Satyaki"), "Satyaki speaks for himself over Bhurishravas");
  ok(!K.test(sc("kf_cry").when, war({ side: "pandava" }, ["role_healer"])) && K.test(sc("kf_cry").when, war({ side: "pandava" }, ["role_chariot"])), "the cry reaches every Pandava on the field, not the healers' tents");
  // The cry: a lie, with the vow's full price; heavier for Drona's students; Drona falls either way.
  S = war({ side: "pandava", teacher: "drona" }); S.duty.teacher = 6; S.vows.push({ id: "never_lie", broken: false, age: 20 }); S.bonds.dhrishtadyumna = 0;
  K.choose(sc("kf_cry"), ch("kf_cry", "cry"));
  ok(S.vows[0].broken && S.duty.teacher === 2 && S.bonds.dhrishtadyumna === 2 && S.flags.includes("spread_the_lie"), "taking up the cry breaks the vow never to lie, the teacher's debt falls, Dhrishtadyumna +2");
  S.seen.push("kf_cry");
  ok(!K.val(sc("a6_day15").choices, S).some((c) => ["spread", "refuse", "warn"].includes(c.id)) && /Ashwatthama hears how his father died/.test(JSON.stringify(K.val(sc("a6_day15").after, war({ side: "pandava" })))), "the half-truth does not ask again, and Drona still falls");
  S = war({ side: "pandava" }); const c0 = S.duty.conscience;
  K.choose(sc("kf_cry"), ch("kf_cry", "silent"));
  ok(S.duty.conscience === c0 + 1 && S.memories.some((m) => m.who === "bhima") && S.flags.includes("refused_lie"), "staying silent: conscience +1, and Bhima notices");
  // Day 14 comes back on day 15.
  S = war({ side: "pandava", teacher: "drona" }); S.flags.push("kb_held_arms"); S.seen.push("kf_fall");
  ok(/held an old man's arm/.test(JSON.stringify(ch("kf_drona", "stop").check)), "holding Bhurishravas's arm is thrown back at you when you try to stop Dhrishtadyumna");
  S = war({ side: "pandava" }); S.flags.push("kb_tried_stop"); K.go("kf_cry");
  ok(S.memories.some((m) => m.who === "ashwatthama") && K.val(sc("a6_raid").body, S).some((b) => b && /Satyaki's sword/.test(b.memory || "")), "trying to stop Satyaki: Ashwatthama remembers, and says so on the night of the raid");
  // The night debate: two deaths, for anyone who did either.
  S = war({ side: "pandava" }); S.flags.push("kf_cried");
  ok(K.test(sc("kb_debate").when, S) && K.val(sc("kb_debate").body, S).some((b) => b && /shouted it with the rest/.test(b.memory || "")), "the night debate quotes the cry back at you");
  ok(!K.test(sc("kb_debate").when, war({ side: "pandava" })), "and is not for those who did neither");
}
// 44. War storyline (PRD 18.13): Iravan on day 8 (content/war_lake.js)
require(G + "content/war_lake.js");
{
  const sc = (id) => K.SCENES[id], ch = (id, cid) => K.val(sc(id).choices, K.S).find((c) => c.id === cid);
  const war = (o, flags) => { const s = fresh(Object.assign({ act: 6, age: 44 }, o)); s.flags.push(...(flags || ["role_front"])); return s; };
  const naga = (s) => { s.astras = [{ id: "nagapasha", from: "naga", age: 35 }]; return s; };
  ok(K.BEFORE.a6_bhishma[0] === "wl_iravan", "Iravan comes before the tenth day");
  ok(K.test(sc("wl_iravan").when, naga(war({ side: "pandava" }))) && !K.test(sc("wl_iravan").when, naga(war({ side: "kaurava" }))) && !K.test(sc("wl_iravan").when, war({ side: "pandava" })),
    "only Pandava players with a naga tie (the serpent-noose from the healed naga) meet Iravan");
  S = naga(war({ side: "pandava" })); S.astras[0].broken = true;
  ok(!K.test(sc("wl_iravan").when, S), "a broken naga condition is no tie");
  // Canon: he dies on day 8 in every life, met or not; riding with him or not, the news comes.
  S = war({ side: "pandava" }); K.apply(sc("a6_bhishma").enter);
  ok(S.dead.includes("iravan"), "Iravan is dead by the tenth day in a life that never met him");
  ok(ch("wl_iravan", "ride").next === "wl_iravan_body" && ch("wl_iravan", "line").next === "wl_iravan_body" && sc("wl_iravan_body").enter.die === "iravan", "both roads hear that he has fallen");
  const E = K.ENCOUNTERS.e_iravan;
  ok(E.hold === 6 && !E.lethal && K.val(E.allies).some((u) => u.person === "iravan"), "the fight beside Iravan: held for six rounds, not deadly, Iravan an ally");
  // The carrying: done, the nagas remember; failed, nothing is lost but their regard.
  S = naga(war({ side: "pandava" })); S.bonds.arjuna = 5;
  let r = K.choose(sc("wl_iravan_body"), ch("wl_iravan_body", "carry"), "win");
  ok(S.flags.includes("naga_regard") && r.next === "wl_iravan_river" && S.memories.some((m) => m.who === "ulupi"), "carried to the river: the nagas remember, Ulupi's people take him");
  S = naga(war({ side: "pandava" })); S.bonds.arjuna = 5; const before = JSON.stringify([S.bonds, S.rep, S.attrs, S.injuries]);
  r = K.choose(sc("wl_iravan_body"), ch("wl_iravan_body", "carry"), "lose");
  ok(!S.flags.includes("naga_regard") && S.alive && JSON.stringify([S.bonds, S.rep, S.attrs, S.injuries]) === before && r.next === "a6_bhishma", "failed: nothing lost but the nagas' regard");
  // The naga answers one call for help, in a deadly war fight, through K.warHelp.
  S = war({ side: "pandava", friend: "bhima" }); S.flags.push("naga_regard");
  {
    const C = K.Combat, B = C.start("hold_duryodhana", () => {});
    ok(!(K.warHelp(S).unit || {}).person || K.warHelp(S).unit.person !== "naga", "not in a holding fight that cannot kill you");
    C.end && C.end();
  }
  {
    const C = K.Combat, B = C.start("e_day18", () => {});
    ok(C.act("call"), "call for help in the last battle");
    ok(B.units.some((u) => u.person === "naga" && u.side !== "enemy") && S.flags.includes("naga_answered"), "a naga of Ulupi's comes, and the promise is spent");
    C.end && C.end();
  }
  ok((K.warHelp(S).unit || {}).person === "bhima", "the next call reaches your friend again, not the naga");
  S.flags.push("iravan_fought"); const t = []; K.TELL_HOOKS.forEach((h) => h(S, t, (f) => S.flags.includes(f)));
  ok(t.some((l) => /carried Iravan/.test(l)) && t.some((l) => /a naga came/.test(l)), "the telling remembers the river and the naga");
}
// 45. War storyline (PRD 18.13): the lake on day 18 (content/war_lake.js)
{
  const sc = (id) => K.SCENES[id], ch = (id, cid) => K.val(sc(id).choices, K.S).find((c) => c.id === cid);
  const war = (o, flags) => { const s = fresh(Object.assign({ act: 6, age: 44 }, o)); s.flags.push(...(flags || ["role_front"])); return s; };
  ok(K.BEFORE.a6_duryodhana.includes("wl_lake"), "the lake comes before Duryodhana lies dying");
  const lw = sc("wl_lake").when;
  S = war({ side: "kaurava" }); S.bonds.duryodhana = 5;
  ok(K.test(lw, war({ side: "pandava", path: "spy" })) && K.test(lw, S) && !K.test(lw, war({ side: "pandava", path: "archer" })) && !K.test(lw, war({ side: "neutral", path: "spy" })),
    "spies, scouts and Duryodhana's friends on either side search the lake; others do not");
  S = war({ side: "pandava", path: "spy" }); r = K.choose(sc("wl_lake"), ch("wl_lake", "search"), "lose");
  ok(S.flags.includes("lake_late") && r.next === "wl_lake_reeds", "lost search: the hunters are first");
  ok(!K.choiceList(sc("wl_lake_found")).find((x) => x.c.id === "tell").ok, "and there is nothing to tell the Pandavas they do not already know");
  // Who stands where in the reeds.
  const ids = (s) => K.val(sc("wl_lake_reeds").choices, s).map((c) => c.id).join(",");
  S = war({ side: "kaurava", path: "spy" }); ok(ids(S) === "stand,hide", "Kaurava: stand with the three, or hide");
  S = war({ side: "pandava", path: "spy" }); ok(ids(S) === "scout,hide", "Pandava: go in with the scouts, or hide");
  S = war({ side: "pandava", path: "spy" }); S.bonds.duryodhana = 6; ok(ids(S) === "stand,scout,hide", "Pandava friend of Duryodhana: may stand with the three");
  ok(K.ENCOUNTERS.e_lake_three.hold && K.val(K.ENCOUNTERS.e_lake_three.enemies).every((u) => u.hero), "the three cannot be killed: a holding fight against champions");
  // Out of your depth, losing the reeds fight is a death (story mode: a scar).
  S = war({ side: "kaurava", path: "spy" }); S.attrs.grace = 1; S.skills.stealth = 0;
  ok(K.lakeDeep(S) && ch("wl_lake_reeds", "stand").combat === "e_lake_hold_deep", "out of your depth: the deadly reeds fight");
  K.combatOutcome("e_lake_hold_deep", "lose", "wl_lake_found");
  ok(!S.alive && /Dvaipayana/.test(S.deathText), "losing it is a death at Dvaipayana");
  S = war({ side: "kaurava", path: "spy", storyMode: true }); S.attrs.grace = 1; S.skills.stealth = 0;
  K.combatOutcome("e_lake_hold_deep", "lose", "wl_lake_found");
  ok(S.alive && S.injuries.includes("scar"), "story mode: a scar");
  S = war({ side: "kaurava", path: "spy" }); K.combatOutcome("e_lake_hold", "win", "wl_lake_found");
  ok(K.lakeLines.raid(S) && /Four of us/.test(K.lakeLines.raid(S).memory), "held beside Ashwatthama: he says so on the night of the raid");
  // The choice: tell, keep silent, warn. Every road goes on to the duel.
  S = war({ side: "pandava", path: "spy" }); S.flags.push("lake_first"); S.rep.pandava = 3;
  r = K.choose(sc("wl_lake_found"), ch("wl_lake_found", "tell"));
  ok(S.rep.pandava === 5 && S.flags.includes("lake_told") && r.next === "a6_duryodhana", "told: Pandava reputation +2, on to the duel");
  S.bonds.duryodhana = 7; ok(/gods your name/.test(K.lakeLines.dying(S).memory), "and Duryodhana names you as he dies");
  S = war({ side: "kaurava", path: "spy" }); S.bonds.duryodhana = 4;
  r = K.choose(sc("wl_lake_found"), ch("wl_lake_found", "warn"));
  ok(S.bonds.duryodhana === 7 && S.flags.includes("saw_duel") && r.next === "a6_duryodhana" && /fight/.test(r.text), "warned: he will not run, bond +3, and you stand witness");
  S = war({ side: "pandava", path: "spy" }); S.bonds.duryodhana = 6; S.attrs.grace = 6; S.skills.stealth = 2;
  r = K.choose(sc("wl_lake_found"), ch("wl_lake_found", "warn_p"));
  ok(r.check.pass && S.flags.includes("saw_duel") && !S.flags.includes("captive"), "a Pandava who warns him unseen stands witness too");
  S = war({ side: "pandava", path: "farmer" }); S.bonds.duryodhana = 6; S.attrs.grace = 0; S.skills.stealth = 0; S.rep.pandava = 5;
  r = K.choose(sc("wl_lake_found"), ch("wl_lake_found", "warn_p"));
  ok(!r.check.pass && S.rep.pandava === 2 && S.flags.includes("captive") && r.next === "x_captive" && S.captive.then === "a6_duryodhana" && !S.flags.includes("saw_duel"),
    "seen warning him, out of your depth: Pandava reputation -3, Bhima's men hold you through the duel");
  ok(!/glad you saw/.test(K.lakeLines.dying(S).memory), "and he knows you did not see it");
  ok(K.val(sc("wl_lake_found").choices).every((c) => !c.next || c.next === "a6_duryodhana") && sc("wl_lake_found").next === "a6_duryodhana" && ch("wl_lake", "leave").next === "a6_duryodhana",
    "canon: whatever you do, he is found and the duel is fought");
}
// 46. The Samshaptakas' oath (PRD 18.13, content/war_oath.js): a fourth vow for one war, its gift, its price, its ending
require(G + "content/war_oath.js");
{
  const war = { act: 6, age: 44, side: "kaurava", path: "warrior" };
  S = fresh(war); ["never_lie", "never_retreat", "spare_unarmed"].forEach((id) => K.apply({ vowTake: id }));
  ok(K.resolveScene("a6_wheel").id === "oath_fire", "after the eleventh day a Kaurava warrior comes to the Samshaptakas' fire");
  const swear = K.SCENES.oath_fire.choices.find((c) => c.id === "swear");
  ok(K.preview(swear, S).some(([, t]) => /fourth vow/.test(t)) && K.preview(swear, S).some(([cls]) => cls === "vow"), "the oath shows as a vow, and as a fourth one");
  K.choose(K.SCENES.oath_fire, swear);
  ok(S.vows.length === 4 && K.hasVow("samshaptaka", S) && K.vowsHeld(S) === 3 && S.tapas === 3, "the oath is sworn above the limit of three (tapas +3), and stands outside the count");
  K.apply({ vowTake: "celibacy" });
  ok(!K.hasVow("celibacy", S), "any other vow is still refused past three");
  const p0 = (() => { const keep = S.vows; S.vows = keep.filter((v) => v.id !== "samshaptaka"); const B = K.Combat.start("oath_arjuna_12", () => {}); const r = { atk: B.units[0].atk, def: B.units[0].def }; K.Combat.end(); S.vows = keep; return r; })();
  const B1 = K.Combat.start("oath_arjuna_12", () => {});
  ok(B1.units[0].atk === p0.atk + 2 && B1.units[0].def === p0.def + 1, "while the oath holds: +2 attack, +1 defence");
  ok(B1.enc.lethal && B1.enc.hold === 7 && B1.units.some((u) => u.person === "arjuna" && u.hero) && K.Combat.fleeBreaks().includes("samshaptaka"), "Arjuna's chariot is a deadly hold, and pulling out of it breaks the oath");
  K.Combat.end();
  S.seen.push("oath_fire");
  ok(K.resolveScene("a6_wheel").id === "oath_south", "the sworn face Arjuna's chariot on the twelfth day");
  ok(K.resolveScene("a6_day16").id === "oath_again", "and again on the sixteenth");
  S.flags.push("role_division", "council_flank", "council_flank_chariot");
  ok(!K.test(K.SCENES.hold_arjuna_offer.when, S), "the division's hold against Arjuna is not offered twice to the sworn");
  S.alive = false;
  let e = K.composeEnding(S);
  ok(e.title === "The oath to the death" && e.art === "end_oath", "falling with the oath on you is its own ending");
  ok(K.ENDINGS.some((x) => x.title === "The oath to the death" && x.art === "end_oath"), "it is in the endings list");
  S = fresh(war); K.apply({ vowTake: "samshaptaka" }); S.bonds.duryodhana = 7; S.bonds.karna = 6; S.bonds.drona = 5;
  K.choose(K.SCENES.oath_south, K.SCENES.oath_south.choices.find((c) => c.id === "withdraw"));
  ok(!K.hasVow("samshaptaka", S) && S.flags.includes("broke_samshaptaka") && S.bonds.duryodhana === 4 && S.bonds.karna === 3 && S.bonds.drona === 2, "withdrawing breaks the oath: every watcher's bond -3");
  S.alive = false; e = K.composeEnding(S);
  ok(e.title !== "The oath to the death" && e.telling.some((x) => /oath-breaker/.test(Array.isArray(x) ? x[0] : x)), "an oath-breaker does not get its ending, and the telling names them");
  S = fresh(Object.assign({ storyMode: true }, war)); K.apply({ vowTake: "samshaptaka" });
  K.combatOutcome("oath_arjuna_12", "lose", "a6_wheel");
  ok(S.alive && K.hasVow("samshaptaka", S) && S.flags.includes("oath_carried_off") && S.injuries.length, "story mode: carried off with a wound, the oath kept");
  S = fresh({ act: 6, age: 44, side: "pandava" }); S.flags.push("role_command");
  ok(K.resolveScene("a6_wheel").id === "oath_crescent", "on the Pandava side, the crescent array on the twelfth day");
  const arr = K.SCENES.oath_crescent.choices.find((c) => c.id === "array");
  ok(arr.trial.array === "crescent" && K.test(arr.req, S), "a company leader sets companies on the crescent");
  const rr = K.choose(K.SCENES.oath_crescent, arr, "lose");
  ok(rr.next === "oath_king" && !rr.after && K.ENCOUNTERS.oath_king_hold.hold && K.ENCOUNTERS.oath_king_hold.enemies.some((u) => u.person === "drona"), "if the crescent breaks, a holding fight at the king's chariot follows");
}
// 47. The oath and canon: Arjuna is only ever held, never brought down; the oath is kept to the war's end, when Susharma falls to him
{
  ok(["oath_arjuna_12", "oath_arjuna_16"].every((id) => K.ENCOUNTERS[id].hold && K.ENCOUNTERS[id].enemies.some((u) => u.person === "arjuna" && u.hero)), "Arjuna's chariot is a fight to hold, never to win by killing him");
  S = fresh({ act: 6, age: 44, side: "kaurava", path: "warrior" }); K.apply({ vowTake: "samshaptaka" }); S.seen.push("a6_day18");
  K.oathEnds(K.SCENES.a6_duryodhana, S);
  ok(!K.hasVow("samshaptaka", S) && S.vows.some((v) => v.id === "samshaptaka" && v.released) && S.journal.some((j) => /Susharma/.test(JSON.stringify(j))), "after the eighteenth day the oath is released, kept, and Susharma falls as written");
}
// 80. War storylines (PRD 18.13 #1): Yuyutsu's call, the only way to change sides
["content/episodes", "content/war_crossing"].forEach((f) => require(G + f + ".js"));
K.UI = K.UI || { esc: (x) => x }; require(G + "ui/map.js");
{
  const KAURAVA_ONLY = ["a6_d13_bow"], canonDead = (S) => S.dead.filter((w) => K.PEOPLE[w] && K.PEOPLE[w].canon);
  S = fresh({ act: 6, age: 44, side: "kaurava", friend: "duryodhana", court: "hastinapura", sibling: "dev", at: "camp_kaurava", storyMode: true });
  Object.assign(S.bonds, { duryodhana: 8, drona: 6, bhishma: 5, arjuna: 4, dev: 6, ugra: 5 });
  S.flags.push("role_command", "beat_ugra", "sibling_same_side"); S.vows.push({ id: "never_retreat", broken: false, age: 30 });
  K.go("a6_day1");
  ok(S.scene === "cross_call", "a fighter meets Yuyutsu's call before the first day (" + S.scene + ")");
  const sc = K.SCENES.cross_call, cross = K.choiceList(sc).map((x) => x.c).find((c) => c.id === "cross");
  const pv = K.preview(cross).map((x) => x[1]).join(" | ");
  ok(/Breaks vow: Never to retreat/.test(pv) && /Ends your friendship with Duryodhana/.test(pv), "the crossing says first that it is a retreat and ends a friend for life there: " + pv);
  K.choose(sc, cross);
  ok(S.side === "pandava" && S.flags.includes("crossed_lines") && S.friend === null && S.moments.some((m) => m.kind === "farewell" && m.who === "duryodhana") && S.moments.some((m) => m.kind === "crossed"), "crossing: the side changes, the friend for life there says farewell, and the crossing has its moment");
  ok(S.bonds.drona === 3 && S.bonds.bhishma === 2 && S.bonds.arjuna === 4 && S.bonds.dev === 3 && S.bonds.ugra === 2, "every bond on the side left falls by 3, and only those");
  ok(K.vowBreaksFor(["retreat"], S).length === 0 && S.vows[0].broken, "crossing broke the vow never to retreat");
  ok(!K.rankOf(S) && !K.warAllies(S).includes("company") && !K.warAllies(S).includes("ugra"), "a commander loses the company, and Ugra no longer stands beside you");
  ok(K.ugraAcross(S) && S.flags.includes("sibling_other_side_set"), "Ugra and the sibling who stood beside you are across the field now");
  ok(/do not know you/.test(String(K.warHelp(S).text)), "on the new side the first call for help reaches no one");
  K.go("a6_day1");
  ok(S.scene === "cross_watched" && S.flags.includes("suspected_spy"), "the first evening: the new side suspects a spy, and sets a guard (" + S.scene + ")");
  const moved = K.travel(K.SCENES.cross_watched, S);
  ok(moved && moved[0] === "camp_kaurava" && moved[1] === "camp_pandava" && S.at === "camp_pandava", "the map marker moves from the Kaurava camp to the Pandava camp (" + moved + ")");
  K.choose(K.SCENES.cross_watched, K.SCENES.cross_watched.choices[0]); K.go("a6_day1");
  ok(S.scene === "cross_duel", "the second morning: the old side sends someone (" + S.scene + ")");
  ok(K.val(K.ENCOUNTERS.cross_e_duel.enemies).some((u) => u.person === "ugra") && K.ENCOUNTERS.cross_e_duel.lethal && /no one moves/.test(K.ENCOUNTERS.cross_e_duel.callHelp(S).text), "Ugra comes for you in a deadly duel with no call for help");
  K.combatOutcome("cross_e_duel", "win", "a6_day1");
  ok(S.dead.includes("ugra") && S.flags.includes("crossed_trusted") && S.flags.includes("proven_duel") && !S.flags.includes("suspected_spy") && K.rankOf(S) === "role_command" && S.flags.includes("company_given_back") && !/do not know you/.test(String(K.warHelp(S).text)), "winning the duel brings trust: the call for help, and rank opens again (a company)");
  // The rest of the war, as one who crossed: no content for the old side, the Pandava camp on the map.
  let at = "a6_day1", old = [], map = [], steps = 0;
  K.go(at);
  while (S.act === 6 && steps++ < 120) {
    const here = K.SCENES[S.scene];
    if (KAURAVA_ONLY.includes(here.id)) old.push(here.id);
    const list = K.choiceList(here).filter((x) => x.ok);
    // A choice for the old side: one its req allows only to a Kaurava.
    const as = (side) => Object.assign({}, S, { side });
    list.forEach((x) => { const r = x.c.req; if (r && K.test(r, as("kaurava")) && !K.test(r, as("pandava"))) old.push(here.id + ":" + x.c.id); });
    const place = String(K.val(here.place, S) || ""), loc = K.locOf(place, S);
    if (/Kurukshetra/.test(place) && loc !== "camp_pandava") map.push(here.id + " " + loc);
    if (!list.length) break;
    const c = list[0].c, r = c.game ? K.choose(here, c, "win") : K.choose(here, c);
    let next = r.next;
    if (r.combat) next = K.combatOutcome(r.combat, "win", r.next).next;
    K.go(next);
  }
  ok(S.act === 7 && !old.length, "one who crossed never meets the old side's content again (" + (old.join(", ") || "none") + ", reached act " + S.act + ")");
  ok(!map.length, "the war's scenes put the marker in the Pandava camp (" + (map.join(", ") || "all") + ")");
  ok(!canonDead(S).some((w) => !["bhishma", "drona", "karna", "abhimanyu", "duryodhana", "dushasana", "jayadratha", "shakuni", "shalya", "iravan", "ghatotkacha", "bhurishravas", "drupada", "virata"].includes(w)), "crossing kills no canon figure the epic does not (" + canonDead(S) + ")");
}
// 80b. Those in the healers' tents watch the call; a child sent to a Kaurava division stays there
S = fresh({ act: 6, age: 44, side: "neutral" }); K.go("a6_day1");
ok(S.scene === "cross_call" && K.choiceList(K.SCENES.cross_call).map((x) => x.c.id).join() === "tents", "the healers' tents see Yuyutsu cross too, and only watch");
S = fresh({ act: 6, age: 44, side: "kaurava", child: "vasu" }); S.bonds.vasu = 7; S.flags.push("vasu_away", "child_cmd_ashwatthama", "role_chariot");
K.go("a6_day1"); K.choose(K.SCENES.cross_call, K.choiceList(K.SCENES.cross_call).find((x) => x.c.id === "cross").c);
ok(S.flags.includes("vasu_left_behind") && !S.flags.includes("vasu_away") && !S.flags.some((f) => f.startsWith("child_cmd_") || f === "role_chariot") && S.bonds.vasu === 4 && !K.test(K.SCENES.wc_child_line.when, S),
  "crossing: Vasu stays in his Kaurava division (bond -3, no Pandava-side scenes of his line), and the chariot is gone");
// 80c. Suspected of spying until proven: the duel (killing, not sparing), the truth before Yudhishthira, or the spy caught; else for the war
const crossNow = (o, flags) => { S = fresh(Object.assign({ act: 6, age: 44, side: "kaurava" }, o)); S.flags.push(...(flags || [])); K.go("a6_day1"); K.choose(K.SCENES.cross_call, K.choiceList(K.SCENES.cross_call).find((x) => x.c.id === "cross").c); };
const sceneNext = () => { K.go("a6_day1"); return S.scene; };
crossNow({ storyMode: true }, ["role_command"]);
ok(!K.rankOf(S) && S.flags.includes("role_front") && S.flags.includes("company_left"), "crossing: the company is lost, and you fight as a spearman");
r = K.combatOutcome("cross_e_duel", "lose", "a6_day1");
ok(S.alive && S.injuries.includes("scar") && !K.rankOf(S) && S.flags.includes("suspected_spy") && /dust between the lines/.test(r.text), "story mode: dragged back with a scar; still suspected, no rank");
K.combatOutcome("e_day1", "win", "a6_bhishma");
ok(S.flags.includes("crossed_untrusted") && /do not know you/.test(String(K.warHelp(S).text)), "a deadly fight won is not proof: the call for help stays closed");
S.seen.push("cross_watched", "cross_duel");
ok(sceneNext() === "cross_truth", "the third night: before Yudhishthira (" + S.scene + ")");
{ const tell = K.SCENES.cross_truth.choices.find((c) => c.id === "tell"); S.bonds.duryodhana = 5; const c0 = S.duty.conscience;
  ok(tell.game === "retort" && tell.trial.rounds.length === 3, "the truth is a retort test of three questions");
  K.choose(K.SCENES.cross_truth, tell, "win");
  ok(S.flags.includes("proven_truth") && !S.flags.includes("suspected_spy") && K.rankOf(S) === "role_command" && S.bonds.duryodhana === 4 && S.duty.conscience === c0 - 1 && !/do not know you/.test(String(K.warHelp(S).text)),
    "the truth believed: suspicion clears, the call for help and the company come back; the old side's bonds -1, conscience -1"); }
ok(sceneNext() === "a6_day1", "the proven skip the fourth night (" + S.scene + ")");
crossNow({}); K.combatOutcome("cross_e_duel", "spare", "a6_day1"); S.seen.push("cross_watched", "cross_duel");
ok(S.flags.includes("suspected_spy") && sceneNext() === "cross_explain", "sparing him feeds the suspicion: Dhrishtadyumna wants a reason (" + S.scene + ")");
S.attrs.wisdom = 9; S.skills.statecraft = 9;
r = K.choose(K.SCENES.cross_explain, K.SCENES.cross_explain.choices(S).find((c) => c.id === "explain"));
ok(r.check.pass && S.flags.includes("proven_spared") && !S.flags.includes("suspected_spy"), "a reason that holds clears it");
crossNow({}); K.combatOutcome("cross_e_duel", "spare", "a6_day1"); S.seen.push("cross_watched", "cross_duel");
K.choose(K.SCENES.cross_explain, K.SCENES.cross_explain.choices(S).find((c) => c.id === "silent"));
K.choose(K.SCENES.cross_truth, K.SCENES.cross_truth.choices.find((c) => c.id === "refuse")); S.seen.push("cross_explain", "cross_truth");
ok(sceneNext() === "cross_spy", "the fourth night: a spy in the camp, and you are blamed (" + S.scene + ")");
{ const rem = K.SCENES.cross_spy.choices.find((c) => c.id === "remember");
  ok(rem.game === "notice" && rem.trial.things.length >= rem.trial.count + 6, "catching him is a notice test, with enough faces to ask about");
  const keep = JSON.parse(JSON.stringify(S));
  K.choose(K.SCENES.cross_spy, rem, "win");
  ok(S.flags.includes("proven_spy") && !S.flags.includes("suspected_spy"), "remember him well and he is caught: proven");
  K.S = S = keep; K.choose(K.SCENES.cross_spy, rem, "lose");
  ok(S.flags.includes("suspected_war") && S.flags.includes("suspected_spy") && /do not know you/.test(String(K.warHelp(S).text)) && sceneNext() === "a6_day1", "not proven by the fourth night: suspected for the war, and no call for help");
  ok(/two paces behind you all day/.test(JSON.stringify(K.val(K.SCENES.a6_day1.body, S))) && /stopped pretending/.test(JSON.stringify(K.val(K.SCENES.a6_day16.body, S))), "the worst posting, and a shadow in later scenes");
  S.alive = false; ok(K.composeEnding(S).telling.some((l) => /never trusted/.test(JSON.stringify(l))), "and the telling says the Pandavas never trusted you"); }
S = fresh({ act: 6, age: 44, side: "kaurava" }); S.flags.push("role_healer");
K.go("a6_day1"); K.choose(K.SCENES.cross_call, K.choiceList(K.SCENES.cross_call).find((x) => x.c.id === "cross").c);
ok(S.flags.includes("role_healer") && !S.flags.includes("role_front"), "a healer who crosses keeps to the tents");
// 81. Calling someone across, from the Pandava side
S = fresh({ act: 6, age: 44, side: "pandava", sibling: "devi", friend: "duryodhana" }); S.bonds.devi = 6; S.bonds.duryodhana = 7; S.flags.push("sibling_other_side_set");
S.attrs.wisdom = 8; S.skills.statecraft = 6;
K.go("a6_day1");
{
  const sc = K.SCENES[S.scene], ids = K.choiceList(sc).filter((x) => x.ok).map((x) => x.c.id);
  ok(sc.id === "cross_call" && ids.includes("call") && ids.includes("call_friend") && !ids.includes("cross"), "the Pandava side can call a sibling or a friend across, and cannot cross (" + ids + ")");
  K.choose(sc, K.choiceList(sc).find((x) => x.c.id === "call_friend").c);
  ok(S.friend === "duryodhana" && S.memories.some((m) => m.who === "duryodhana") && S.side === "pandava", "Duryodhana will not come (canon), and remembers that you asked");
  S.seen = S.seen.filter((x) => x !== "cross_call"); K.go("a6_day1");
  K.choose(K.SCENES.cross_call, K.choiceList(K.SCENES.cross_call).find((x) => x.c.id === "call").c);
  ok(S.calledAcross === "devi" && !S.flags.includes("sibling_other_side_set") && K.warAllies(S).includes("devi") && S.bonds.devi === 8, "a sibling who comes fights beside you for the war, and the bond rises");
  K.go("a6_day1");
  ok(S.scene === "cross_called" && K.val(K.ENCOUNTERS.cross_e_called.allies).includes("devi"), "the second morning, you fight beside her against the riders sent after her (" + S.scene + ")");
}
S = fresh({ act: 6, age: 44, side: "pandava", sibling: "dev" }); S.bonds.dev = 6; S.flags.push("sibling_other_side_set"); S.attrs.wisdom = 0; S.skills.statecraft = 0;
K.go("a6_day1"); K.choose(K.SCENES.cross_call, K.choiceList(K.SCENES.cross_call).find((x) => x.c.id === "call").c);
ok(!S.calledAcross && S.flags.includes("sibling_other_side_set") && S.memories.some((m) => m.who === "dev" && /not forgotten that you asked/.test(m.src)), "a sibling who will not come remembers that you asked");
// 82. The one who crossed: a death between the lines is its own ending; the telling names it
S = fresh({ act: 6, age: 44, side: "kaurava" }); S.flags.push("lost_to_ugra");
K.go("a6_day1"); K.choose(K.SCENES.cross_call, K.choiceList(K.SCENES.cross_call).find((x) => x.c.id === "cross").c); K.go("a6_day1");
K.combatOutcome("cross_e_duel", "lose", "a6_day1");
{ const e = K.composeEnding(S);
  ok(!S.alive && e.title === "The one who crossed" && e.art === "end_crossed" && K.ENDINGS.some((x) => x.title === e.title && x.art === "end_crossed"), "falling in the duel between the lines is the ending \"The one who crossed\"");
  ok(e.telling.some((l) => /the one who crossed/.test(String(l))) && /between the lines/.test(S.deathText), "the bards call you the one who crossed"); }
S = fresh({ act: 6, age: 44, side: "pandava" }); K.apply({ die: true, deathText: "x" });
ok(K.composeEnding(S).title !== "The one who crossed", "a death without crossing keeps its own ending");
// 83. The canon lock: nothing in the crossing kills or saves a canon figure
{
  const dies = [];
  for (const foe of ["ugra", "kanaka"]) { const T = fresh({ act: 6, age: 44, side: "pandava", crossFoe: foe }); const w = K.ENCOUNTERS.cross_e_duel.win.fx(T); if (w.die) dies.push(w.die); }
  ok(dies.length === 2 && dies.every((w) => !(K.PEOPLE[w] && K.PEOPLE[w].canon)), "the duel's dead are never canon figures (" + dies + ")");
  const T = fresh({ act: 6, age: 44, side: "kaurava", friend: "karna" }); T.bonds.karna = 9;
  const fx = K.SCENES.cross_call.choices(T).find((c) => c.id === "cross").fx;
  ok(!fx.die && !JSON.stringify(fx).includes("unflag\":[\"dead"), "crossing takes no life and gives none back");
}
// 84. Where it matters most, the war says you crossed; the telling names the child left behind
S = fresh({ act: 6, age: 44, side: "kaurava", child: "vasu", friend: "duryodhana" }); S.bonds.duryodhana = 10; S.bonds.vasu = 6; S.flags.push("vasu_away", "child_cmd_bhurishravas");
K.go("a6_day1"); K.choose(K.SCENES.cross_call, K.choiceList(K.SCENES.cross_call).find((x) => x.c.id === "cross").c);
{ const said = (id) => JSON.stringify(K.val(K.SCENES[id].body, S));
  ok(/common spearman/.test(said("a6_day1")) && /walked out of his army/.test(said("a6_bhishma")) && /walk out of it/.test(said("a6_duryodhana")) && /Eighteen days ago/.test(said("a6_day18")), "day 1, Bhishma's bed, Duryodhana's last night and day 18 each say you crossed");
  S.alive = false; S.flags.push("won_crossing_duel"); S.crossFoe = "kanaka"; S.duty.conscience = 8;
  const t = K.composeEnding(S).telling.map((l) => JSON.stringify(l)).join(" ");
  ok(/say it gently/.test(t) && /son Vasu stayed in the Kaurava ranks/.test(t) && /killed {who}/.test(t), "the telling: the one who crossed (gently, for a good conscience), the duel, and Vasu left behind"); }
console.log(fails ? fails + " FAILED" : "all passed"); process.exit(fails ? 1 : 0);
