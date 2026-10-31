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
    stage_fire_altar: "stage_forest_clearing_night", stage_deep_lake: "stage_forest_lake", stage_mountain_path: "stage_forest_edge",
    stage_gandharva_grove: "stage_forest_clearing_night", stage_naga_bank: "stage_healers_hall", stage_shiva_mountain: "stage_forest_edge",
    scene_temple_offering: "stage_palace_corridor", scene_sage_year: "scene_ashram", scene_brahmastra: "scene_raid", scene_raksha_sutra: "war_eve", scene_soma: "scene_rajasuya"
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
  push("a5_forest_boon", { id: "bala", t: "Ask the sages for the mantras against hunger and weariness", req: { tapas: 3, noFlag: "had_bala" }, locked: needs(3),
    fx: { tapas: -3, boon: "bala", attr: { might: 1, grace: 1 }, flag: "had_bala", set: { balaUntil: 5 }, journal: "The sages taught you Bala and Atibala. For a season you were never tired and never hungry." },
    hint: "Costs 3 tapas: +1 Might, +1 Grace until the war",
    text: "Two mantras, one for the morning and one for the night. The old sage makes you say them until he is satisfied, which takes four days." });
  push("a5_forest_boon", { id: "rite", t: "Ask the sages to lift the curse on you", req: { tapas: 6, cursed: true }, locked: "Needs a curse to lift, and 6 tapas.",
    fx: { tapas: -6, liftCurse: true }, hint: "Costs 6 tapas",
    text: "Seven nights of fire and fasting. On the last morning the oldest sage pours water over your head and says the thing that was waiting for you is waiting no longer." });
  // The vanishing comes from the Gandharvas (the ambush in the exile years), or from a naga.
  const gand = K.ENCOUNTERS.e_gandharva;
  if (gand) {
    gand.spare = { fx: { astraGrant: { id: "sammohana", from: "gandharva" }, boon: "antardhana", rep: { sages: 1 }, journal: "You spared a beaten Gandharva, and he taught you the mantra of sleep and the art of vanishing." },
      text: "The Gandharva you have beaten lowers his sword and laughs. \"Arjuna spared Chitraratha once, and was given a gift for it,\" he says. \"Here is yours.\" He teaches you two things before dawn: the mantra that puts a host to sleep, and the trick of not being where you are looked for." };
  }
  // Soma at the Rajasuya: its own small scene before the sacrifice, for those with the merit to be offered it.
  K.scene({ id: "w_soma", act: 3, age: 29, away: true, when: (S) => (S.tapas || 0) >= 2 && !S.flags.includes("drank_soma"), enter: { flag: "soma_offered" }, next: "a3_rajasuya", skipTo: "a3_rajasuya",
    place: "Indraprastha, the morning of the sacrifice", art: art("scene_soma"), caption: "The pressing of the Soma", title: "The Soma",
    body: ["Before the great sacrifice the priests press the Soma, and a cup of it is offered to those who have kept their vows. One of them holds a cup out to you."],
    choices: [
      { id: "drink", t: "Drink the Soma", req: { tapas: 2 }, locked: needs(2),
        resolve: (S) => { const best = ["might", "aim", "grace", "wisdom", "command"].sort((a, b) => S.attrs[b] - S.attrs[a])[0]; return { attr: { [best]: 2 }, set: { soma: { attr: best, until: S.log.length + 4 } } }; },
        fx: { tapas: -2, flag: "drank_soma", journal: "You drank the Soma at Yudhishthira's sacrifice. For a day you were more than yourself, and the day after, less." },
        hint: "Costs 2 tapas: +2 to your best attribute for a day, then -1 for a day", text: "It is bitter and bright, and the hall is suddenly very clear. You will pay for it tomorrow." },
      { id: "no", t: "Pass the cup on", fx: { rep: { sages: 1 } }, text: "The priest nods as if you had answered a question." }
    ] });
  // The night before the war: a thread tied by mother or spouse, and an elder's blessing (both, either, or neither).
  K.scene({ id: "w_eve", act: 6, age: 44, war: true, when: (S) => S.side !== "neutral" && !S.flags.includes("eve_rites"), enter: { flag: "eve_rites" }, next: "a6_eve", skipTo: "a6_eve",
    place: "The camp, the night before the first day", to: "kurukshetra", travel: "You march to Kurukshetra with the army.", art: art("scene_raksha_sutra"), caption: "Lamps in the tents", title: "The night before",
    body: ["The night before the first arrow, the camp does the small things: threads are tied, blessings asked, letters written that may not be sent."],
    choices: [
      { id: "sutra", t: (S) => (S.spouse ? ["Let {spouse} tie the raksha sutra on your wrist", null] : S.kin ? ["Let {kin} tie the raksha sutra on your wrist", { kin: S.kin }] : "Let the old women of the camp tie the raksha sutra on your wrist"),
        fx: { boon: "raksha", charge: { raksha: 1 }, flag: "has_raksha", duty: { family: 1 } }, hint: "Once, outside battle, it turns a death into a wound",
        text: "A red and yellow thread, tied with a prayer you half hear. It is only a thread. You do not take it off." },
      { id: "bless", t: (S) => (S.teacher && S.teacher !== "self" ? ["Go to {teacher} for a blessing", null] : "Go to the elders of the camp for a blessing"),
        fx: (S) => ({ set: { blessed: S.log.length + 4, blessedBy: "An elder's blessing is on you." }, duty: { teacher: 1 } }), hint: "+1 to every test for the next day",
        text: "A hand on your head, a few words. You walk back to your tent lighter than you went." },
      { id: "sleep", t: "Sleep while you can", fx: {} }
    ] });

  // ---------- The quests: five weapons, at most two offered in a life ----------
  const offers = (S) => (S.astraOffers || 0);
  const open = (id) => (S) => S.act === 5 && offers(S) < 2 && !(S.astras || []).some((a) => a.id === id);
  const take = (S) => ({ set: { astraOffers: offers(S) + 1 } });
  const quest = (o) => Object.assign({ act: 5, away: true, enter: take, next: o.then, skipTo: o.then, when: open(o.astra) }, o.scene);

  // Agneya: a season of penance at a fire altar, through the storms.
  const FIRE = { t: "Sit at the altar and keep the fire alive through the storms", game: "steady", hint: "A long test of stillness",
    trial: { attr: "wisdom", skill: "lore", stage: art("stage_fire_altar"), secs: 24, verb: "Shield the flame",
      tally: "Flame kept: {c}% · {s} seconds of storm left", wonLine: "The storm passes. The flame is still there, and so are you.", nearLine: "The flame gutters, and comes back, and gutters. Not yet.", lostLine: "The wind takes the flame, and the season with it.",
      rules: "A fire altar on a bare hill, and the rains coming. Keep your hands around the flame as the gusts push it: hold to shield it, let go when the wind drops. If it goes out, the season is lost.",
      stakes: ["On the last night, a voice in the fire gives you the Agneyastra.", "The flame goes out. You come down the hill with nothing but a cough."] },
    win: { fx: { astraGrant: { id: "agneya", from: "fire_altar" }, tapas: 1 }, text: "On the last night a voice speaks out of the coals, and gives you the mantra of fire, and one condition: never against someone who cannot fight back." },
    lose: { fx: { attr: { wisdom: 1 } }, text: "The flame goes out on the fortieth night. You come down the hill thinner, with no weapon and a little more patience." } };
  K.scene(quest({ astra: "agneya", then: "a5_jayadratha", scene: {
    id: "w_fire", age: 34, place: "A bare hill above the hermitages", art: art("stage_fire_altar"), caption: "An altar in the rain", title: "The fire altar",
    body: ["Arjuna has gone north for weapons. A sage at the hermitage tells you there is a smaller road: a fire altar on the hill above, where those who can sit still through a season of storms are sometimes answered.",
      "It is the rains. The altar is open to the sky."],
    choices: [K.testChoice("w_fire", "sit", FIRE), { id: "no", t: "Stay with the camp. Someone has to hunt", fx: { rep: { pandava: 1 } } }] } }));

  // Varuna: a dive for a sage's lost offering, in the deep lake (the breath test, ui/breath.js).
  const DIVE = { t: "Dive for the offering", game: "breath", hint: "A test of breath",
    trial: { attr: "might", skill: "stealth", stage: art("stage_deep_lake"), dives: 3, need: 2, verb: "Dive",
      rules: "The sage's golden vessel lies on the lake bed, and the current moves it. Hold to dive and let go to rise; reach the glow before your breath runs out, and surface before it is gone. Three dives: bring it up on two.",
      stakes: ["The sage gives you the Varunastra for it.", "The lake keeps the vessel, and nearly keeps you."] },
    win: { fx: { astraGrant: { id: "varuna", from: "lake_sage" }, tapas: 1 }, text: "You come up with the vessel the second time, half-drowned. The sage takes it without a word, then gives you one: the mantra of water, on the condition that you never lie about where it came from." },
    lose: { fx: {}, text: "The current is stronger than you. The vessel stays on the lake bed, and the sage goes on sitting by the water as if you had never come." } };
  K.scene(quest({ astra: "varuna", then: "a5_matsya", scene: {
    id: "w_dive", age: 42, place: "A deep lake in the hills", art: art("stage_deep_lake"), caption: "Still water over deep water", title: "The sage's offering",
    body: ["An old sage sits by a lake that no one fishes. His golden vessel, the one he pours the morning offering from, slipped from his hands into the deep water a month ago, and he has not eaten since.",
      "The lake is cold and very deep, and something moves the water at the bottom."],
    choices: [K.testChoice("w_dive", "dive", DIVE), { id: "no", t: "Leave him food, and go on", fx: { rep: { sages: 1 } } }] } }));

  // Vayavya: the climb to a Himalayan hermitage (a course up the mountain, on foot).
  const CLIMB = { t: "Climb to the hermitage", game: "race", hint: "A climb",
    trial: { attr: "grace", skill: "chariot", kind: "war", stage: art("stage_mountain_path"), vehicle: "foot", obstacles: ["rock", "ice"], hull: 3, speed: 2.8,
      tally: "Climbed: {d}% · Falls: {h} of {l}", bump: "Your foot goes through the crust, and the mountain takes a little more of you.", help: "Step aside from the rocks and the ice: left and right, or the buttons.",
      rules: "A path up through snow to a hermitage no one has reached in years. Rocks come down it, and the ice gives way. Three falls and you turn back.",
      stakes: ["The hermit of the heights gives you the Vayavyastra.", "You turn back below the snow line, frostbitten."] },
    win: { fx: { astraGrant: { id: "vayavya", from: "hermitage" }, tapas: 1 }, text: "The hermit is very old and very amused that anyone came. He teaches you the mantra of wind over three days, and makes you promise one thing: never to turn your back on a fight you chose." },
    lose: { fx: {}, text: "Below the snow line your feet stop obeying you. You come down, and the hermitage stays where it is, above the clouds." } };
  K.scene(quest({ astra: "vayavya", then: "a5_matsya", scene: {
    id: "w_climb", age: 42, place: "The foot of the high mountains", art: art("stage_mountain_path"), caption: "A path into the snow", title: "The hermit of the heights",
    body: ["In the last year of the forest a herdsman tells you of a hermit who lives above the snow, who knows the mantra of the wind and gives it to no one, because no one comes."],
    choices: [K.testChoice("w_climb", "climb", CLIMB), { id: "no", t: "It is too late in the year. Go on", fx: {} }] } }));

  // Sammohana: a Gandharva's riddles, at the edge of the Dvaita forest (the court road).
  const RIDDLES = [
    { line: "\"What is heavier than a mountain, and a child can carry it?\"", replies: ["A debt.", "Grief.", "Gold."] },
    { line: "\"What goes out of the house every morning and is home before it leaves?\"", replies: ["The mind.", "The sun.", "A dog."] },
    { line: "\"I am taken from you every night and given back every morning, and you are poorer each time.\"", replies: ["A day.", "Sleep.", "A dream."] }
  ];
  const RIDDLE = { t: "Answer the Gandharva's riddles", game: "retort", hint: "A test of wits",
    trial: { attr: "wisdom", skill: "lore", stage: art("stage_gandharva_grove"), rounds: RIDDLES,
      rules: "The Gandharva sits in the branches above the pool and will not let you drink until you have answered him. Three riddles; answer before the lamp burns down. Two right of three.",
      stakes: ["He gives you the mantra of sleep, laughing.", "He lets you drink anyway, and keeps the mantra."] },
    win: { fx: { astraGrant: { id: "sammohana", from: "gandharva" }, tapas: 1 }, text: "He drops out of the tree, delighted. \"No one has answered me in a hundred years. Here: the mantra that puts a host to sleep. Never against one who is asleep already, or unarmed, or I will come and take it back.\"" },
    lose: { fx: {}, text: "\"Drink,\" he says, bored. \"You are no worse than the last hundred.\"" } };
  K.scene(quest({ astra: "sammohana", then: "a5_vikarna", scene: {
    id: "w_riddle", age: 36, place: "A pool at the edge of the Dvaita forest", art: art("stage_gandharva_grove"), caption: "A voice in the branches", title: "The Gandharva at the pool",
    body: ["Riding the forest's edge on the court's business, you stop at a pool to drink, and a voice in the branches tells you that you may not, yet."],
    choices: [K.testChoice("w_riddle", "answer", RIDDLE), { id: "no", t: "Ride on thirsty", fx: {} }] } }));

  // Nagapasha: healing a wounded naga by the river (your own life, before the forge).
  const NAGA = { t: "Draw the arrow and dress the wound", game: "steady", hint: "A test of steady hands",
    trial: { attr: "wisdom", skill: "healing", stage: art("stage_naga_bank"), secs: 18, verb: "Hold",
      tally: "The wound closing: {c}% · {s} seconds", wonLine: "The bleeding stops. The naga lets out a long breath that is almost a word.", nearLine: "Nearly. The wound keeps opening.", lostLine: "The naga pulls away from you and slides into the river, trailing blood.",
      rules: "A man of the naga folk lies on the bank with a hunter's arrow through his shoulder, and he does not trust your hands. Keep your hand steady on the wound as he flinches: hold to press, let go when he pulls away.",
      stakes: ["He gives you the serpent-noose for it.", "He goes back into the river without a word."] },
    win: { fx: { astraGrant: { id: "nagapasha", from: "naga" }, tapas: 1, rep: { common: 1 } }, text: "Before he goes back into the water he teaches you the mantra of the serpent-noose, which binds and does not kill, on one condition: never against someone who cannot fight back." },
    lose: { fx: {}, text: "He goes into the river, and the water closes over him, and you do not know whether he lived." } };
  K.scene(quest({ astra: "nagapasha", then: "a5_forge", scene: {
    id: "w_naga", age: 35, place: "The riverbank below the village", art: art("stage_naga_bank"), caption: "A stranger on the bank", title: "The wounded naga",
    body: ["Coming down to the river at dusk you find a man on the bank with an arrow through his shoulder, and eyes that are not quite a man's. The naga folk do not come out of the water. This one has."],
    choices: [K.testChoice("w_naga", "heal", NAGA), { id: "no", t: "Leave him. The river people look after their own", fx: { duty: { conscience: -1 } } }] } }));

  // Other ways: a year serving a sage; a stolen temple offering; the shrine of light on the mountain.
  push("a5_forest_boon", { id: "year", t: "Stay a whole year in the sage's service, and let the camp go on without you", req: { rep: ["sages", 4], noAstra: "vayavya" }, locked: "The sages do not know you yet.",
    fx: { tapas: 3, astraGrant: { id: "vayavya", from: "hermitage" }, rep: { pandava: -1 }, flag: "served_a_year", journal: "You served a sage for a year in the exile, and he gave you the mantra of the wind." },
    hint: "A year of your life: tapas +3, and a divine weapon", text: "A year of water carried and silence kept. On the last day the sage gives you the mantra of the wind, and tells you never to turn your back on a fight you chose." });
  const OFFERING = { t: "Go into the robber chief's house by night and bring it back", game: "sneak", hint: "A test of stealth",
    trial: { attr: "grace", skill: "stealth", stage: art("scene_temple_offering"),
      rules: "The temple's golden lamp hangs in the robber chief's own room. His men keep watch with torches. Cross the house twice, in and out, and do not be seen twice.",
      stakes: ["The temple gets its lamp back, and its priest gives you a charmed shield.", "You are caught, and beaten, and let go as a fool."] },
    win: { fx: { boon: "charm_shield", tapas: 2, rep: { common: 1, sages: 1 } }, text: "The lamp is back on its chain by dawn. The old priest gives you a shield that hung in the temple longer than anyone remembers. \"It turns the first blow,\" he says. \"After that you are on your own.\"" },
    lose: { fx: { injury: "scar" }, text: "A torch finds you on the stair. They beat you and throw you out, and keep the lamp." } };
  K.scene(Object.assign({ act: 5, away: true, when: (S) => S.act === 5 && !S.boons.includes("charm_shield") && !S.flags.includes("offering_tried"), enter: { flag: "offering_tried" }, next: "a5_matsya", skipTo: "a5_matsya" }, {
    id: "w_offering", age: 42, place: "A village temple on the road to Matsya", art: art("scene_temple_offering"), caption: "An empty hook over the altar", title: "The stolen offering",
    body: ["On the road to Matsya you sleep in a village whose temple lamp was carried off by a robber band in the spring. The priest does not ask you for anything. He only looks at the empty hook."],
    choices: [K.testChoice("w_offering", "steal", OFFERING), { id: "no", t: "Give the priest a coin, and sleep", fx: { rep: { common: 1 } } }] }));
  const MOUNTAIN = { t: "Climb to the light, and stand in it", game: "steady", hint: "A test of stillness",
    trial: { attr: "wisdom", skill: "lore", stage: art("stage_shiva_mountain"), secs: 20, verb: "Hold still",
      tally: "Stillness: {c}% · {s} seconds", wonLine: "The light goes through you, and the voice says one word, and you do not remember it afterwards.", nearLine: "The light wavers, and so do you.", lostLine: "You step out of the light, shaking, and it is only snow.",
      rules: "A light on the mountain, with no lamp in it, and a voice with no one speaking. Stand in it and do not move: hold to keep still as the cold and the fear push you. No one has told you what is in there.",
      stakes: ["Something is given to you: a weapon, or a kavacha against one death in the war.", "You come down, and never tell anyone what you saw."] },
    win: { resolve: (S) => (S.rep.sages >= 6 ? { charge: { kavacha: 1 }, boon: "kavacha", tapas: 2 } : { astraGrant: { id: "vayavya", from: "mountain" }, tapas: 2 }), fx: { flag: "stood_in_the_light" },
      text: "When you can see again you are kneeling in the snow and something is yours that was not yours before. You will not lie about what happened here. You could not if you tried." },
    lose: { fx: { attr: { wisdom: 1 } }, text: "You come down the mountain and do not speak for three days. Something was there. It did not stay." } };
  K.scene(Object.assign({ act: 5, away: true, when: (S) => S.act === 5 && S.exile === "forest" && S.rep.sages >= 4 && !S.flags.includes("mountain_tried"), enter: { flag: "mountain_tried" }, next: "a5_yaksha", skipTo: "a5_yaksha" }, {
    id: "w_mountain", age: 41, place: "High in the mountains", art: art("stage_shiva_mountain"), caption: "A light where no lamp is", title: "The light on the mountain",
    body: ["Arjuna came back from the north with weapons from the gods, and will not say much about it. A sage of the camp tells you that there is a place on the mountain where a light stands at dusk, with no lamp in it, and those who stand in it are sometimes given something, and sometimes only frightened."],
    choices: [K.testChoice("w_mountain", "stand", MOUNTAIN), { id: "no", t: "Some things are not for you. Stay below", fx: { attr: { wisdom: 1 } } }] }));
  // A win branch with a `resolve`: the choice engine only reads fx, so fold it in here.
  { const w = MOUNTAIN.win; const r = w.resolve; delete w.resolve; const base = w.fx; w.fx = (S) => Object.assign({}, base, r(S)); }

  // ---------- The Brahmastra, offered once and refusable ----------
  K.scene({
    id: "w_brahmastra", act: 6, war: true, canon: false, when: (S) => S.act === 6 && S.alive && !S.flags.includes("brahmastra_offered") && S.side !== "neutral", enter: { flag: "brahmastra_offered" }, next: "a6_raid", skipTo: "a6_raid",
    age: 44, place: "The camp, the night after the last day", to: "kurukshetra", art: art("scene_brahmastra"), caption: "A scroll in the dark", title: "The mantra no one should hold",
    body: ["An old brahmin of the camp, whose sons are all dead, finds you in the dark with a palm-leaf scroll. \"It was given to Drona's son tonight, as it was given to him,\" he says. \"The Brahmastra. The weapon that ends everything it is pointed at, and the one who points it, slower. I can give it to you too. You have the merit to hold it.\"",
      "He is not lying. You can feel it in the scroll, like heat."],
    choices: [
      { id: "take", t: "Take it", fx: (S) => ({ tapas: -(S.tapas || 0), curse: "brahmastra", flag: "took_brahmastra", duty: { conscience: -3 }, journal: "On the last night of the war you took the mantra of the Brahmastra. You never spoke it. It spoke in you." }),
        hint: "All your tapas, a curse, and a darker telling", text: "You learn it in an hour, and it is the easiest thing you have ever learned, and you are never again entirely alone in your own head." },
      { id: "refuse", t: "Refuse it", fx: { tapas: 2, flag: "refused_brahmastra", duty: { conscience: 2 }, rep: { sages: 1 }, journal: "On the last night of the war you were offered the Brahmastra, and refused it." },
        text: "You push the scroll back into his hands. He looks at you for a long moment, and then, for the first time all night, he weeps." }
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
