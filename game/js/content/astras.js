/* Divine weapons and shields (PRD §18.7), magic and tapas (§18.8).
   - Tapas, spiritual merit, is earned by vows kept through an act (flow.js drift), by penance, by
     service to sages and by a handful of hard right choices (added here to existing choices), and
     spent on magic. A broken vow halves it.
   - Five named astras (K.ASTRAS), each with a quest in the exile years and a giver who names a
     condition; one mantra a battle, whichever weapon; against the epic's heroes it is always met by
     the counter-weapon. The old generic astra stays for the scenes that already grant it.
   - Shields: a sage's kavacha, a charmed shield, a raksha sutra. Magic: Bala and Atibala, the
     sanjivani root, Antardhana, elders' blessings, Soma, the rite that lifts a curse.
   - The Brahmastra is offered once, on the last night of the war, at a terrible price, and can be refused.
   Art comes later: STANDIN maps each picture the brief asks for to a painting the game already has.
   Scenes here come before scenes every road reaches (K.BEFORE), each only when it applies, and a
   life is offered at most two of the five quests. */
(function (K) {
  "use strict";
  const STANDIN = {
  };
  const art = (k) => STANDIN[k] || k;

  // ---------- The weapons ----------
  K.ASTRAS = {
    agneya: { name: "Agneyastra", mantra: "The mantra of fire: Agni, who eats everything and is never full.", kind: "agneya" },
    varuna: { name: "Varunastra", mantra: "The mantra of water: Varuna, who holds the oceans in a cupped hand.", kind: "varuna" },
    vayavya: { name: "Vayavyastra", mantra: "The mantra of wind: Vayu, who is never seen and never still.", kind: "vayavya" },
    sammohana: { name: "Sammohana", mantra: "The mantra of sleep: the one Arjuna spoke over the Kaurava host at Virata's border.", kind: "sammohana" },
    nagapasha: { name: "Nagapasha", mantra: "The serpent-noose: the mantra of the naga folk, who bind and do not kill.", kind: "nagapasha" }
  };
  // Who gives each one, and on what condition (core.js K.astraBreaksFor: tag is the choice tag that breaks it).
  Object.assign(K.ASTRA_GIVERS, {
    fire_altar: { who: "the voice in the fire", cond: "Never against someone who cannot fight back.", tag: "strike_unarmed", takes: false },
    lake_sage: { who: "the sage of the lake", cond: "Never lie about where it came from.", tag: "lie", takes: true },
    hermitage: { who: "the hermit of the heights", cond: "Never turn your back on a fight you chose.", tag: "retreat", takes: true },
    gandharva: { who: "the Gandharva", cond: "Never against one who is asleep or unarmed.", tag: "strike_unarmed", takes: true },
    naga: { who: "the naga", cond: "Never against someone who cannot fight back.", tag: "strike_unarmed", takes: true },
    mountain: { who: "the voice on the mountain", cond: "Never to lie about what you saw there.", tag: "lie", takes: false }
  });
  Object.assign(K.BOONS, {
    bala: { name: "Bala and Atibala", text: "The two mantras against hunger and weariness: +1 Might and +1 Grace for the rest of this act." },
    sanjivani: { name: "The sanjivani root", text: "One death, undone. Then it is gone." },
    antardhana: { name: "Antardhana, the vanishing", text: "Once in each act, a failed test of stealth becomes a pass, or a stealth test is skipped: you were simply not there." },
    charm_shield: { name: "A charmed shield", text: "Turns the first blow of every fight." },
    kavacha: { name: "A sage's kavacha", text: "Once in the whole war, a blow that would have killed you leaves you standing." },
    raksha: { name: "A raksha sutra", text: "A thread tied on your wrist before the war. Once, it turns a death outside battle into a wound." }
  });
  Object.assign(K.CURSES, {
    brahmastra: { name: "The Brahmastra's price", text: "You took the mantra no one should hold. It is waiting in you like a coal.", fireText: "The mantra you should never have taken stirs in you at the worst hour, and your hands shake so that nothing you hold will obey them." }
  });

  // ---------- Tapas on choices the game already has ----------
  // A tapas effect added to a choice by scene and choice id (quietly skipped if the scene changed).
  function addFx(scene, choice, fx) {
    const sc = K.SCENES[scene]; const list = sc && typeof sc.choices !== "function" ? sc.choices : null;
    const c = list && list.find((x) => x.id === choice);
    if (!c) return;
    if (typeof c.fx === "function") { const f = c.fx; c.fx = (S) => Object.assign({}, f(S) || {}, fx); } else c.fx = Object.assign({}, c.fx || {}, fx);
  }
  addFx("a2_ekalavya", "speak", { tapas: 1 });
  addFx("a2_ekalavya", "tend", { tapas: 1 });
  addFx("a5_charu", "go", { tapas: 1 });
  addFx("a5_forest_boon", "serve", { tapas: 2 });
  addFx("a6_bhishma", "water", { tapas: 1 });
  addFx("v_penance", "atone", { tapas: 3 });
  addFx("v_captive", "free", { tapas: 1 });
  if (K.YAKSHA && K.YAKSHA.win && K.YAKSHA.win.fx) K.YAKSHA.win.fx.tapas = (K.YAKSHA.win.fx.tapas || 0) + 2;
  addFx("a7_debt", "forgive", { tapas: 1 });

  // ---------- Magic, offered where it belongs ----------
  const needs = (n) => ["Needs {n} tapas", { n }];
  const push = (scene, choice) => { const sc = K.SCENES[scene]; if (sc && Array.isArray(sc.choices)) sc.choices.push(choice); };
  // At the ashram in the exile years: the two mantras, the vanishing, the rite.
  push("a5_forest_boon", { id: "bala", t: "Ask for the mantras against weariness", req: { tapas: 3, noFlag: "had_bala" }, locked: needs(3),
    // What the mantras actually add (an attribute already at 8 gains nothing), so exactly that is taken back.
    resolve: (S) => ({ attr: { might: 1, grace: 1 }, set: { balaUntil: 5, balaGain: { might: Math.min(1, 8 - S.attrs.might), grace: Math.min(1, 8 - S.attrs.grace) } } }),
    fx: { tapas: -3, boon: "bala", flag: "had_bala", journal: "The sages taught you Bala and Atibala. For a season you were never tired and never hungry." },
    hint: "Costs 3 tapas: +1 Might, +1 Grace until the war",
    text: "Two mantras, one for the morning and one for the night. The old sage makes you say them until he is satisfied, which takes four days." });
  push("a5_forest_boon", { id: "rite", t: "Ask them to lift your curse", req: { tapas: 6, cursed: true }, locked: "Needs a curse to lift, and 6 tapas.",
    fx: { tapas: -6, liftCurse: true }, hint: "Costs 6 tapas",
    text: "After seven nights of fire and fasting, the oldest sage pours water over your head. What was waiting for you waits no longer." });
  // The vanishing comes from the Gandharvas (the ambush in the exile years), or from a naga.
  const gand = K.ENCOUNTERS.e_gandharva;
  if (gand) {
    gand.spare = { fx: { astraGrant: { id: "sammohana", from: "gandharva" }, boon: "antardhana", rep: { sages: 1 }, journal: "You spared a beaten Gandharva, and he taught you the mantra of sleep and the art of vanishing." },
      text: "The Gandharva laughs and teaches you two things before dawn: the mantra that puts a host to sleep, and how not to be where you are looked for." };
  }
  // Soma at the Rajasuya: its own small scene before the sacrifice, for those with the merit to be offered it.
  K.scene({ id: "w_soma", act: 3, age: 29, away: true, when: (S) => (S.tapas || 0) >= 2 && !S.flags.includes("drank_soma"), enter: { flag: "soma_offered" }, next: "a3_rajasuya", skipTo: "a3_rajasuya",
    place: "Indraprastha, the morning of the sacrifice", art: art("scene_soma"), caption: "The pressing of the Soma", title: "The Soma",
    body: ["A priest offers you a cup of Soma."],
    choices: [
      { id: "drink", t: "Drink the Soma", req: { tapas: 2 }, locked: needs(2),
        resolve: (S) => { const best = ["might", "aim", "grace", "wisdom", "command"].sort((a, b) => S.attrs[b] - S.attrs[a])[0]; return { attr: { [best]: 2 }, set: { soma: { attr: best, until: S.log.length + 4, gain: Math.min(2, 8 - S.attrs[best]) } } }; },
        fx: { tapas: -2, flag: "drank_soma", journal: "You drank the Soma at Yudhishthira's sacrifice. For a day you were more than yourself, and the day after, less." },
        hint: "Costs 2 tapas: +2 to your best attribute for a day, then -1 for a day", text: "It is bitter and bright, and the hall is suddenly very clear. You will pay for it tomorrow." },
      { id: "no", t: "Pass the cup on", fx: { rep: { sages: 1 } }, text: "The priest nods as if you had answered a question." }
    ] });
  // The night before the war: a thread tied by mother or spouse, and an elder's blessing (both, either, or neither).
  K.scene({ id: "w_eve", act: 6, age: 44, war: true, when: (S) => S.side !== "neutral" && !S.flags.includes("eve_rites"), enter: { flag: "eve_rites" }, next: "a6_eve", skipTo: "a6_eve",
    place: "The camp, the night before the first day", to: "kurukshetra", travel: "You march to Kurukshetra with the army.", art: art("scene_raksha_sutra"), caption: "Lamps in the tents", title: "The night before",
    body: ["The night before the war."],
    choices: [
      // Tied by a living spouse, or by the parent who raised you (a grandparent is long gone by the war), or by the camp's old women.
      { id: "sutra", t: (S) => (S.spouse && !S.dead.includes(S.spouse) ? ["Let {spouse} tie the raksha sutra on your wrist", null] : S.kin && !K.kinElder(S) ? ["Let {kin} tie the raksha sutra on your wrist", { kin: S.kin }] : "Have the raksha sutra tied"),
        fx: { boon: "raksha", charge: { raksha: 1 }, flag: "has_raksha", duty: { family: 1 } }, hint: "Once, outside battle, it turns a death into a wound",
        text: "A red and yellow thread, tied with a prayer you half hear. You do not take it off." },
      { id: "bless", t: (S) => (S.teacher && S.teacher !== "self" ? ["Go to {teacher} for a blessing", null] : "Ask the elders' blessing"),
        fx: (S) => ({ set: { blessed: S.log.length + 4, blessedBy: "An elder's blessing is on you." }, duty: { teacher: 1 } }), hint: "+1 to every test for the next day",
        text: "A hand on your head, a few words. You walk back to your tent lighter than you went." },
      { id: "sleep", t: "Sleep while you can", fx: {} }
    ] });

  // ---------- The quests: five weapons, at most two offered in a life ----------
  const offers = (S) => (S.astraOffers || 0);
  const open = (id) => (S) => S.act === 5 && offers(S) < 2 && !(S.astras || []).some((a) => a.id === id);
  const take = (S) => ({ set: { astraOffers: offers(S) + 1 } });
  // The lake and the mountain are both on the road to Matsya: the strong are sent diving, the nimble climbing.
  const SPLIT = { varuna: (S) => S.attrs.might >= S.attrs.grace, vayavya: (S) => S.attrs.grace > S.attrs.might };
  const quest = (o) => Object.assign({ act: 5, away: true, enter: take, next: o.then, skipTo: o.then, when: (S) => open(o.astra)(S) && (!SPLIT[o.astra] || SPLIT[o.astra](S)) }, o.scene);

  // Agneya: a season of penance at a fire altar, through the storms.
  const FIRE = { t: "Keep the fire through the storms", game: "steady", hint: "A long test of stillness",
    trial: { attr: "wisdom", skill: "lore", stage: art("stage_fire_altar"), secs: 24, verb: "Shield the flame",
      tally: "Flame kept: {c}% · {s} seconds of storm left", wonLine: "The storm passes. The flame is still there, and so are you.", nearLine: "The flame gutters, and comes back, and gutters. Not yet.", lostLine: "The wind takes the flame, and the season with it.",
      rules: "Hold to shield the flame from the gusts; let go when the wind drops.",
      stakes: ["On the last night, a voice in the fire gives you the Agneyastra.", "The flame goes out. You come down the hill with nothing but a cough."] },
    win: { fx: { astraGrant: { id: "agneya", from: "fire_altar" }, tapas: 1 }, text: "On the last night a voice in the coals gives you the mantra of fire. Never against someone who cannot fight back." },
    lose: { fx: { attr: { wisdom: 1 } }, text: "The flame goes out on the fortieth night. You come down the hill thinner, with no weapon and a little more patience." } };
  K.scene(quest({ astra: "agneya", then: "a5_jayadratha", scene: {
    id: "w_fire", age: 34, place: "A bare hill above the hermitages", art: art("stage_fire_altar"), caption: "An altar in the rain", title: "The fire altar",
    body: ["A sage tells you of a fire altar where those who sit through a season of storms are sometimes answered."],
    choices: [K.testChoice("w_fire", "sit", FIRE), { id: "no", t: "Stay with the camp", fx: { rep: { pandava: 1 } } }] } }));

  // Varuna: a dive for a sage's lost offering, in the deep lake (the breath test, ui/breath.js).
  const DIVE = { t: "Dive for the offering", game: "breath", hint: "A test of breath",
    trial: { attr: "might", skill: "stealth", stage: art("stage_deep_lake"), dives: 3, need: 2, verb: "Dive",
      rules: "Hold to dive, let go to rise. Reach the glow before your breath runs out. Two of three dives.",
      stakes: ["The sage gives you the Varunastra for it.", "The lake keeps the vessel, and nearly keeps you."] },
    win: { fx: { astraGrant: { id: "varuna", from: "lake_sage" }, tapas: 1 }, text: "You come up with the vessel the second time, half-drowned. The sage gives you the mantra of water: never lie about where it came from." },
    lose: { fx: {}, text: "The current is stronger than you. The vessel stays on the lake bed, and the sage goes on sitting by the water as if you had never come." } };
  K.scene(quest({ astra: "varuna", then: "a5_matsya", scene: {
    id: "w_dive", age: 42, place: "A deep lake in the hills", art: art("stage_deep_lake"), caption: "Still water over deep water", title: "The sage's offering",
    body: ["An old sage's golden offering vessel lies at the bottom of a deep lake."],
    choices: [K.testChoice("w_dive", "dive", DIVE), { id: "no", t: "Leave him food", fx: { rep: { sages: 1 } } }] } }));

  // Vayavya: the climb to a Himalayan hermitage (a course up the mountain, on foot).
  const CLIMB = { t: "Climb to the hermitage", game: "race", hint: "A climb",
    trial: { attr: "grace", skill: "chariot", kind: "war", stage: art("stage_mountain_path"), vehicle: "foot", obstacles: ["rock", "ice"], hull: 3, speed: 2.8,
      tally: "Climbed: {d}% · Falls: {h} of {l}", bump: "Your foot goes through the crust, and the mountain takes a little more of you.", help: "Step aside from the rocks and the ice: up and down, or the buttons.", helpSide: "Step left and right around the rocks and the ice.",
      rules: "Climb through the falling rocks. Three falls and you turn back.",
      stakes: ["The hermit of the heights gives you the Vayavyastra. Nearly there, a sanjivani root on a ledge.", "You turn back below the snow line, frostbitten."] },
    win: { fx: { astraGrant: { id: "vayavya", from: "hermitage" }, tapas: 1 }, text: "The old hermit teaches you the mantra of wind over three days. Never turn your back on a fight you chose." },
    // Short of the hermitage, a ledge where the sanjivani root grows (§18.8: "a dangerous climb").
    close: { fx: { boon: "sanjivani", charge: { sanjivani: 1 }, journal: "Short of the hermitage, on a ledge in the snow, you dug up a sanjivani root and wore it home on a cord." }, text: "You do not reach the hermitage, but on the last ledge you dig a glowing root out of the snow: the sanjivani." },
    lose: { fx: {}, text: "Below the snow line your feet stop obeying you. You come down, and the hermitage stays where it is, above the clouds." } };
  K.scene(quest({ astra: "vayavya", then: "a5_matsya", scene: {
    id: "w_climb", age: 42, place: "The foot of the high mountains", art: art("stage_mountain_path"), caption: "A path into the snow", title: "The hermit of the heights",
    body: ["A hermit above the snow knows the mantra of the wind."],
    choices: [K.testChoice("w_climb", "climb", CLIMB), { id: "no", t: "Go on", fx: {} }] } }));

  // Sammohana: a Gandharva's riddles, at the edge of the Dvaita forest (the court road).
  const RIDDLES = [
    { line: "\"What is heavier than a mountain, and a child can carry it?\"", replies: ["A debt.", "Grief.", "Gold."] },
    { line: "\"What goes out of the house every morning and is home before it leaves?\"", replies: ["The mind.", "The sun.", "A dog."] },
    { line: "\"I am taken from you every night and given back every morning, and you are poorer each time.\"", replies: ["A day.", "Sleep.", "A dream."] }
  ];
  const RIDDLE = { t: "Answer the Gandharva's riddles", game: "retort", hint: "A test of wits",
    trial: { attr: "wisdom", skill: "lore", stage: art("stage_gandharva_grove"), rounds: RIDDLES,
      rules: "Answer the Gandharva's riddles before the lamp burns down. Two right of three.",
      stakes: ["He gives you the mantra of sleep, laughing.", "He lets you drink anyway, and keeps the mantra."] },
    win: { fx: { astraGrant: { id: "sammohana", from: "gandharva" }, tapas: 1 }, text: "He drops out of the tree, delighted, and gives you the mantra that puts a host to sleep. Never against the sleeping or the unarmed." },
    lose: { fx: {}, text: "\"Drink,\" he says, bored. \"You are no worse than the last hundred.\"" } };
  K.scene(quest({ astra: "sammohana", then: "a5_vikarna", scene: {
    id: "w_riddle", age: 36, place: "A pool at the edge of the Dvaita forest", art: art("stage_gandharva_grove"), caption: "A voice in the branches", title: "The Gandharva at the pool",
    body: ["At a forest pool, a voice in the branches forbids you to drink, yet."],
    choices: [K.testChoice("w_riddle", "answer", RIDDLE), { id: "no", t: "Ride on thirsty", fx: {} }] } }));

  // Nagapasha: healing a wounded naga by the river (your own life, before the forge).
  const NAGA = { t: "Draw the arrow and dress the wound", game: "steady", hint: "A test of steady hands",
    trial: { attr: "wisdom", skill: "healing", stage: art("stage_naga_bank"), secs: 18, verb: "Hold",
      tally: "The wound closing: {c}% · {s} seconds", wonLine: "The bleeding stops. The naga lets out a long breath that is almost a word.", nearLine: "Nearly. The wound keeps opening.", lostLine: "The naga pulls away from you and slides into the river, trailing blood.",
      rules: "Hold to press the wound; let go when he pulls away.",
      stakes: ["He gives you the serpent-noose for it.", "He goes back into the river without a word."] },
    win: { fx: { astraGrant: { id: "nagapasha", from: "naga" }, tapas: 1, rep: { common: 1 } }, text: "He teaches you the mantra of the serpent-noose, which binds and does not kill. Never against someone who cannot fight back." },
    lose: { fx: {}, text: "He goes into the river, and the water closes over him, and you do not know whether he lived." } };
  K.scene(quest({ astra: "nagapasha", then: "a5_forge", scene: {
    id: "w_naga", age: 35, place: "The riverbank below the village", art: art("stage_naga_bank"), caption: "A stranger on the bank", title: "The wounded naga",
    body: ["On the riverbank lies a wounded naga, an arrow through his shoulder."],
    choices: [K.testChoice("w_naga", "heal", NAGA), { id: "no", t: "Leave him", fx: { duty: { conscience: -1 } } }] } }));

  // Other ways: a year serving a sage; a stolen temple offering; the shrine of light on the mountain.
  push("a5_forest_boon", { id: "year", t: "Serve the sage a whole year", req: { rep: ["sages", 4], noAstra: "vayavya" }, locked: "The sages do not know you yet.",
    fx: { tapas: 3, astraGrant: { id: "vayavya", from: "hermitage" }, rep: { pandava: -1 }, flag: "served_a_year", journal: "You served a sage for a year in the exile, and he gave you the mantra of the wind." },
    hint: "A year of your life: tapas +3, and a divine weapon", text: "After a year of silence the sage gives you the mantra of the wind. Never turn your back on a fight you chose." });
  const OFFERING = { t: "Steal it back by night", game: "sneak", hint: "A test of stealth",
    trial: { twist: "dog", attr: "grace", skill: "stealth", stage: art("scene_temple_offering"),
      rules: "Cross the robber's house, in and out. Do not be seen twice.",
      stakes: ["The temple gets its lamp back, and its priest gives you a charmed shield.", "You are caught, and beaten, and let go as a fool."] },
    win: { fx: { boon: "charm_shield", tapas: 2, rep: { common: 1, sages: 1 } }, text: "By dawn the lamp is back on its chain, and the old priest gives you the temple's shield. \"It turns the first blow.\"" },
    lose: { fx: { injury: "scar" }, text: "A torch finds you on the stair. They beat you and throw you out, and keep the lamp." } };
  K.scene(Object.assign({ act: 5, away: true, when: (S) => S.act === 5 && !S.boons.includes("charm_shield") && !S.flags.includes("offering_tried"), enter: { flag: "offering_tried" }, next: "a5_matsya", skipTo: "a5_matsya" }, {
    id: "w_offering", age: 42, place: "A village temple on the road to Matsya", art: art("scene_temple_offering"), caption: "An empty hook over the altar", title: "The stolen offering",
    body: ["Robbers have stolen a village temple's lamp. The priest looks at the empty hook."],
    choices: [K.testChoice("w_offering", "steal", OFFERING), { id: "no", t: "Give the priest a coin", fx: { rep: { common: 1 } } }] }));
  const MOUNTAIN = { t: "Stand in the light", game: "steady", hint: "A test of stillness",
    trial: { attr: "wisdom", skill: "lore", stage: art("stage_shiva_mountain"), secs: 20, verb: "Hold still",
      tally: "Stillness: {c}% · {s} seconds", wonLine: "The light goes through you, and the voice says one word, and you do not remember it afterwards.", nearLine: "The light wavers, and so do you.", lostLine: "You step out of the light, shaking, and it is only snow.",
      rules: "Hold to keep still in the light as the cold and the fear push you.",
      stakes: ["Something is given to you: a weapon, or a kavacha against one death in the war.", "You come down, and never tell anyone what you saw."] },
    win: { resolve: (S) => (S.rep.sages >= 6 ? { charge: { kavacha: 1 }, boon: "kavacha", tapas: 2 } : { astraGrant: { id: "vayavya", from: "mountain" }, tapas: 2 }), fx: { flag: "stood_in_the_light" },
      text: "You kneel in the snow, and something is yours that was not before. You will not lie about what happened here." },
    lose: { fx: { attr: { wisdom: 1 } }, text: "You come down the mountain and do not speak for three days. Something was there, and it did not stay." } };
  K.scene(Object.assign({ act: 5, away: true, when: (S) => S.act === 5 && S.exile === "forest" && S.rep.sages >= 4 && !S.flags.includes("mountain_tried"), enter: { flag: "mountain_tried" }, next: "a5_yaksha", skipTo: "a5_yaksha" }, {
    id: "w_mountain", age: 36, place: "High in the mountains", art: art("stage_shiva_mountain"), caption: "A light where no lamp is", title: "The light on the mountain",
    body: ["On the mountain a light stands at dusk, with no lamp in it. Those who stand in it are sometimes given something."],
    choices: [K.testChoice("w_mountain", "stand", MOUNTAIN), { id: "no", t: "Stay below", fx: { attr: { wisdom: 1 } } }] }));
  // A win branch with a `resolve`: the choice engine only reads fx, so fold it in here.
  { const w = MOUNTAIN.win; const r = w.resolve; delete w.resolve; const base = w.fx; w.fx = (S) => Object.assign({}, base, r(S)); }

  // ---------- The Brahmastra, offered once and refusable ----------
  K.scene({
    id: "w_brahmastra", act: 6, war: true, canon: false, when: (S) => S.act === 6 && S.alive && !S.flags.includes("brahmastra_offered") && S.side !== "neutral", enter: { flag: "brahmastra_offered" }, next: "a6_raid", skipTo: "a6_raid",
    age: 44, place: "The camp, the night after the last day", to: "kurukshetra", art: art("scene_brahmastra"), caption: "A scroll in the dark", title: "The mantra no one should hold",
    body: ["An old brahmin offers you the Brahmastra, the weapon that ends everything it is pointed at."],
    choices: [
      { id: "take", t: "Take it", fx: (S) => ({ tapas: -(S.tapas || 0), curse: "brahmastra", flag: "took_brahmastra", duty: { conscience: -3 }, journal: "On the last night of the war you took the mantra of the Brahmastra. You never spoke it. It spoke in you." }),
        hint: "All your tapas, a curse, and a darker telling", text: "You learn it in an hour, and it is the easiest thing you have ever learned, and you are never again entirely alone in your own head." },
      { id: "refuse", t: "Refuse it", fx: { tapas: 2, flag: "refused_brahmastra", duty: { conscience: 2 }, rep: { sages: 1 }, journal: "On the last night of the war you were offered the Brahmastra, and refused it." },
        text: "You push the scroll back into his hands. He stares at you, and then, for the first time all night, he weeps." }
    ]
  });

  const before = (id, pre) => { (K.BEFORE[id] = K.BEFORE[id] || []).push(pre); };
  before("a5_jayadratha", "w_fire");
  before("a5_vikarna", "w_riddle");
  before("a5_forge", "w_naga");
  before("a5_yaksha", "w_mountain");
  before("a5_matsya", "w_offering"); before("a5_matsya", "w_dive"); before("a5_matsya", "w_climb");
  before("a6_raid", "w_brahmastra");
  before("a3_rajasuya", "w_soma");
  before("a6_eve", "w_eve");
})(window.K = window.K || {});
