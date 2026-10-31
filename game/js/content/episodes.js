/* Threads, episodes and small systems (PRD §18.4, §18.5, §18.6), and the after-war scenes.
   Every scene here is optional, comes before a scene every road reaches (K.BEFORE), only when it
   applies, and is marked `away` so the map does not move for it. Ids begin with ep_.
   Threads: Ugra the rival across a life; the secret of Karna's birth and whom you tell; a wrong ask
   from each teacher; an elder sibling who takes the other side in the war.
   Episodes: a storm in the forest; a friend who drinks first at the Yaksha's lake; the hidden year
   (your false name, Kichaka's dancing hall); the war (a raid on the supply carts, false orders across
   the river, the truce at dusk, Shikhandi's charge); after the war (the ruined quarter, the rite for
   the dead, a student of your own, the pilgrimage).
   Small systems: letters from across the lines; keepsakes that become choices; the bard who gets it
   wrong unless you correct him.
   Art: the truce, the ruined quarter, the rite, the student and the pilgrimage have their own
   paintings, and the tests play on their own stages (the storm, Virata's court, Kichaka's hall, the
   supply camp, the river crossing, the tournament arena, Drona's gate). The rest still use a painting
   from the game (STANDIN) until theirs is painted. */
(function (K) {
  "use strict";

  // The painting each scene wants (the brief's key) -> the painting it uses until that arrives.
  const STANDIN = {
    scene_tournament_crowd: "scene_tournament", scene_ugra_letter: "scene_note", scene_ugra_field: "war_day17",
    scene_secret_told: "scene_secret", scene_mentor_vidura: "scene_indraprastha", scene_mentor_kripa: "scene_dice_hall", scene_mentor_peace: "scene_ashram",
    stage_forest_storm: "stage_exile_storm", scene_lake_charu: "scene_lake", stage_virata_hall: "stage_virata_court", stage_dancing_hall: "stage_kichaka_hall_night",
    scene_supply_camp_night: "stage_supply_camp_night", fight_supply_carts: "fight_war_camp", scene_river_crossing: "stage_river_crossing_night",
    scene_shikhandi: "war_bhishma", scene_letter_camp: "scene_vasu", scene_sibling_field: "war_day17",
    scene_river_rite: "scene_forgiveness", scene_own_student: "scene_student", scene_bard: "end_teller"
  };
  const art = (k) => STANDIN[k] || k;
  const homeArt = (S) => (S.origin === "suta" && !S.flags.includes("moved_capital") ? "home_anga" : "home_" + S.origin);

  const sib = (S) => S.sibling && K.PEOPLE[S.sibling] ? K.PEOPLE[S.sibling].name : "your sibling";
  const sibAlive = (S) => !!S.sibling && !S.dead.includes(S.sibling);
  const sibP = (S) => ({ who: sib(S) });
  const other = (S) => (S.side === "kaurava" ? "pandava" : "kaurava");
  const FRIEND_SIDE = { karna: "kaurava", duryodhana: "kaurava", arjuna: "pandava", bhima: "pandava" };
  // A friend for life who fights on the other side of the field.
  const friendAcross = (S) => (S.friend && FRIEND_SIDE[S.friend] && S.side && S.side !== "neutral" && FRIEND_SIDE[S.friend] !== S.side && !S.dead.includes(S.friend) ? S.friend : null);
  const ugraMet = (S) => ["beat_ugra", "lost_to_ugra", "shamed_ugra"].some((f) => S.flags.includes(f));
  const ugraAcross = (S) => S.flags.includes("ugra_across") && !S.dead.includes("ugra") && S.side && S.side !== "neutral";
  const warring = (S) => S.side === "pandava" || S.side === "kaurava";

  Object.assign(K.PEOPLE, { dev: { name: "Dev", canon: false }, devi: { name: "Devi", canon: false } });
  // Shadow puppets for the sibling (puppet.js loads after the content, so they join on the first scene).
  const PUPPETS = {
    dev: { pronoun: "he", palette: ["#b8743f", "#5a4630", "#c9a066"], item: "spear", peer: true },
    devi: { pronoun: "she", palette: ["#b9743f", "#6b4a32", "#e2b55a"], item: "bow", peer: true }
  };
  // A keepsake is a small thing kept from a moment, that becomes a choice later (S.keepsakes).
  K.KEEPSAKES = {
    letter: { name: "a letter from across the lines", text: "Folded small, read many times." },
    amulet: { name: "your sibling's amulet", text: "A thread of dark cord with a copper disc." },
    hammer: { name: "Kesava's hammer", text: "The old smith put it in your hands on his last morning." },
    arrow: { name: "an arrow from the supply camp", text: "Picked out of a cart on the night of the raid." }
  };
  const hasKeep = (S, id) => (S.keepsakes || []).includes(id);

  // In the war, false orders delivered the night before weaken the enemy's line on the next day;
  // orders burned send your own line in with heart. Done once, at the start of that fight.
  K.on("combat", (B) => {
    const S = K.S;
    if (!B || B.over || B.round !== 1 || B._ep) return;
    B._ep = true;
    if (!B.enc.lethal || S.act !== 6) return;
    if (S.flags.includes("orders_delivered")) { B.living("enemy").forEach((u) => B.status(u, "weakened", 2)); B.say("Across the field the enemy's line is in the wrong place. Someone read your orders."); K.apply({ unflag: "orders_delivered" }); }
    else if (S.flags.includes("orders_burned")) { B.living("friends").forEach((u) => B.status(u, "inspired", 2)); B.say("Your own line is where it should be this morning, and knows it."); K.apply({ unflag: "orders_burned" }); }
  });

  // ---------- Tests reused with new words ----------
  const STORM = { id: "storm", t: "Run for the rock shelter before the flood comes down the ravine", game: "race", hint: "A run through the storm",
    trial: { attr: "grace", skill: "stealth", stage: "stage_exile_storm", vehicle: "foot", obstacles: ["rock", "fire"], hull: 3, speed: 3,
      tally: "Distance: {d}% · Falls: {h} of {l}", bump: "A branch takes you off your feet.", help: "Step aside from the branches and the water: up and down, or the buttons.", helpSide: "Step left and right around what the storm throws down.",
      rules: "The sky goes black at noon and the ravine fills. Run for the rock shelter: round the falling branches and the water coming down the gullies. Three falls and the flood has you.",
      stakes: ["You reach the shelter with the camp's children, and the storm passes over you.", "The flood takes your pack, and you limp in after dark."] },
    win: { fx: { flag: "ran_the_storm", rep: { common: 1 }, journal: "In the exile years you ran the camp's children to shelter through a forest storm." }, text: "You are under the rock with the last child when the ravine goes white. Nobody is lost." },
    lose: { fx: { item: { herbs: -1 }, injury: "leg" }, text: "The third branch takes you down and the water takes your pack, herbs and all. You crawl in after dark with a knee that will never be right." } };

  const SECOND_RIDDLES = [
    { line: "\"What is the one companion who follows a person past death?\"", replies: ["\"What they did.\"", "\"Their name.\"", "\"Their eldest son.\""] },
    { line: "\"What is the greatest wonder?\"", replies: ["\"That the living see the dead every day, and think they will not die.\"", "\"That the sun rises.\"", "\"That a king can be beaten at dice.\""] },
    { line: "\"By what is a person made a brahmin: birth, learning, or conduct?\"", replies: ["\"Conduct.\"", "\"Birth.\"", "\"Learning.\""] }
  ];
  const CHARU_LAKE = { id: "answer", t: "Answer for Charu", game: "retort", hint: "A test of wisdom",
    trial: { attr: "wisdom", skill: "lore", rounds: SECOND_RIDDLES, stage: "stage_forest_lake",
      rules: "\"One of you drank without answering,\" says the voice. \"Answer for both, and both of you may drink.\" Two right answers of three.",
      stakes: ["Charu sits up on the bank, coughing, and asks what you are staring at.", "The voice falls silent. Charu does not move again."] },
    win: { fx: { bond: { charu: 2 }, attr: { wisdom: 1 }, flag: "answered_for_charu", memory: ["charu", "I drank first at the lake. You answered for me."], journal: "At the lake in the forest Charu drank first and fell. You answered the voice for both of you." },
      text: "\"Drink,\" says the voice. Charu sits up on the bank, coughing up lake water, and asks what you are staring at." },
    lose: { fx: { die: "charu", duty: { conscience: -1 }, journal: "At the lake in the forest Charu drank first and fell, and your answers could not bring Charu back." },
      text: "Your last answer is wrong, and the voice is gone. The lake is only a lake. Charu does not move again." } };

  const FALSE_NAME = [
    { line: "\"You hold that bow like a soldier, not a groom. Where did a groom learn that?\"", replies: ["\"Horses kick, my lord. One learns to hold things firmly.\"", "\"I was a soldier once.\"", "\"I hold it as I was taught.\""] },
    { line: "\"The queen's maid says you speak like someone raised in a palace.\"", replies: ["\"The queen's maid is kind. My mother beat good speech into me with a ladle.\"", "\"I was raised in a palace.\"", "\"The queen's maid should mind her own business.\""] },
    { line: "\"Tell me the name of the village you came from, and your father's name, quickly.\"", replies: ["\"Kundapur, on the river, my lord, and my father was Haridas who kept the ferry.\"", "\"I would rather not say.\"", "\"My father was a charioteer of Hastinapura.\""] }
  ];
  const NERVE = { id: "nerve", t: "Answer the steward's questions without a flicker", game: "retort", hint: "A test of nerve",
    trial: { attr: "wisdom", skill: "statecraft", rounds: FALSE_NAME, stage: "stage_virata_court",
      rules: "Virata's steward has started asking questions about the new people in the household. Answer each one before the lamp burns down, and never say anything true. Two of three.",
      stakes: ["The steward loses interest, and your name stays yours.", "The steward keeps looking at you, and sends to Hastinapura to ask."] },
    win: { fx: { skill: { statecraft: 1 }, flag: "kept_false_name" }, text: "The steward grunts and goes to bother the cooks. Nobody asks again." },
    lose: { fx: { rep: { kuru: -1 }, flag: "name_suspected" }, text: "The steward says nothing more, which is worse. A rider leaves for Hastinapura that evening." } };

  const DANCE_HALL = { id: "hall", t: "Cross the dancing hall in the dark and get her out before he comes", game: "sneak", hint: "A test of stealth",
    trial: { attr: "grace", skill: "stealth", stage: "stage_kichaka_hall_night", trips: 2, spots: 2, watch: "guard", verb: "Move",
      help: "Hold to move along the pillars. Stop when Kichaka's lamp turns your way.", tally: "Crossed: {d} of {n} · Seen: {s} of {m} · {t} seconds", made: "Across. Now back, with her.", spotted: "The lamp swings toward you. You press into a pillar.",
      rules: "Kichaka has told the queen's maid to come to the dancing hall tonight. Bhima is going in her place, and the maid must be somewhere else, seen by no one. Cross the hall to her and back along the pillars while Kichaka's lamp sweeps the floor.",
      stakes: ["She is in the kitchens, among the women, when the screaming starts.", "Kichaka's lamp finds you, and you have to run before you reach her."] },
    win: { fx: { bond: { draupadi: 2, bhima: 1 }, duty: { conscience: 1 }, flag: "helped_draupadi_hall", journal: "In the hidden year you got Draupadi out of Kichaka's way the night Bhima was waiting for him." },
      text: "She is sitting among the kitchen women with her head covered when the screaming starts in the dancing hall. She does not look up. Her hands are perfectly still." },
    lose: { fx: { bond: { bhima: -1 }, flag: "hall_seen" }, text: "The lamp finds you, and you run. Bhima does the rest alone, as he would have anyway. In the morning he looks at you and says nothing." } };

  const CARTS = { id: "carts", t: "Go in through the horse lines and cut the carts loose", game: "sneak", hint: "A test of stealth",
    trial: { attr: "grace", skill: "stealth", stage: "stage_supply_camp_night", trips: 2, spots: 2, watch: "soldier", verb: "Move",
      help: "Hold to move between the carts. Stop when the sentry's torch turns.", tally: "Carts reached: {d} of {n} · Seen: {s} of {m} · {t} seconds", made: "The ropes are cut. Back to the dark.", spotted: "The sentry turns. You drop behind a wheel.",
      rules: "The enemy's grain and fodder carts stand in a camp behind their lines. A sentry walks the far side with a torch. Reach the carts twice: once to cut the horse lines, once to fire the fodder.",
      stakes: ["The fodder burns, and tomorrow the enemy's horses are hungry.", "The sentry raises the alarm, and you fight your way out."] },
    win: { fx: { flag: "burned_carts", keepsake: "arrow", journal: "One night in the war you crept into the enemy's supply camp and burned their fodder." }, text: "The fodder goes up with a sound like wind. You are back in the horse lines before the first shout." },
    lose: { fx: { flag: "carts_alarm" }, next: "ep_carts_fight", text: "The sentry turns too soon, and the camp wakes around you." } };

  const RIVER = { id: "swim", t: "Swim the river with the packet in your teeth", game: "sneak", hint: "A test of stealth",
    trial: { attr: "grace", skill: "stealth", stage: "stage_river_crossing_night", trips: 1, spots: 2, watch: "soldier", verb: "Swim",
      help: "Hold to swim. Stop and go under when the watch-fire's light reaches the water.", tally: "Across: {d} of {n} · Seen: {s} of {m} · {t} seconds", made: "The far bank.", spotted: "A sentry shouts. You go under and let the current take you.",
      rules: "Between the camps the river runs black under the watch-fires. Swim it with the packet dry and come up under the enemy's bank unseen.",
      stakes: ["You come up under their bank with the packet dry.", "A sentry sees the water move, and the night goes wrong."] },
    win: { fx: {}, text: "You come up under the enemy's bank with the packet dry, and lie in the reeds until your breath is quiet." },
    lose: { fx: { injury: "scar" }, text: "An arrow finds your shoulder in the water. You deliver the packet bleeding, and swim back the long way." } };

  const SIDE_PATH = { archer: "aim", mace: "push", charioteer: "race", strategist: "retort", healer: "steady", spy: "sneak", bard: "retort" };
  const STUDENT_ROUNDS = [
    { line: "\"Why do we bow to the teacher before we draw?\"", replies: ["\"So that the first thing the bow learns from us is respect.\"", "\"Because the teacher says so.\"", "\"To stretch the back.\""] },
    { line: "\"What do I do when I am afraid?\"", replies: ["\"The same thing you do when you are not.\"", "\"Run.\"", "\"Pray.\""] },
    { line: "\"When do I stop practising?\"", replies: ["\"When your fingers bleed, and then once more.\"", "\"When you have won.\"", "\"When it gets dark.\""] }
  ];
  function studentTest(S) {
    const kind = SIDE_PATH[S.path] || "retort";
    const base = { id: "test", t: "Set your student the test you were set", hint: "Your student's first test",
      win: { fx: { flag: "taught_student", attr: { wisdom: 1 }, rep: { common: 1 }, journal: "After the war you took a student of your own, and set the first test you were ever set." }, text: "Your student looks at you the way you once looked at your teacher. You understand, suddenly, several things your teacher never said." },
      lose: { fx: { flag: "taught_student" }, text: "Your student fails the first test, as you did. \"Again tomorrow,\" you hear yourself say, in your teacher's voice." } };
    const trials = {
      aim: { game: "aim", trial: { attr: "aim", skill: "archery", icon: "lamp", dark: true, shots: 3, need: 2, verb: "Release", stage: "stage_drona_gate", cast: ["boy"], rules: "You hang a lamp from a branch and set it swinging, as Arjuna once did. Show your student how it is done: two hits of three.", stakes: ["Your student sees it can be done.", "Your student sees that even teachers miss."] } },
      push: { game: "push", trial: { attr: "might", skill: "mace", stage: "stage_training_ground", cast: ["boy"], foe: "your student", rules: "Your student braces against you in the ring. Push as the ring meets the mark, and do not push too hard.", stakes: ["Your student learns what a clean push feels like.", "Your student learns that the teacher can slip too."] } },
      race: { game: "race", trial: { attr: "grace", skill: "chariot", stage: "stage_racetrack", vehicle: "chariot", obstacles: ["rock", "wreck"], hull: 3, speed: 3, rules: "You take your student round the old track with you at the reins, and show how a chariot threads the stakes.", stakes: ["Your student sees how it is done.", "Your student sees a wheel catch, and learns that too."] } },
      steady: { game: "steady", trial: { attr: "wisdom", skill: "healing", stage: "stage_healers_hall", cast: ["healer", "boy"], verb: "Hold", secs: 16, help: "Hold to press; let go to ease off. Keep your hands over the glow until it is set.", tally: "Set: {c}% · {s} seconds", rules: "A boy with a broken arm, and your student watching your hands. Set it while your student counts.", stakes: ["Your student has seen a bone set properly.", "Your student has seen that it is hard."] } },
      sneak: { game: "sneak", trial: { attr: "grace", skill: "stealth", stage: "stage_palace_corridor", trips: 2, spots: 2, watch: "guard", verb: "Move", help: "Hold to move. Stop before the light reaches you.", rules: "You set your student to watch with a lamp, and cross the corridor twice unseen, as you were once made to.", stakes: ["Your student never sees you cross.", "Your student catches you, and is very pleased."] } },
      retort: { game: "retort", trial: { attr: "wisdom", skill: "lore", rounds: STUDENT_ROUNDS, stage: "stage_vidura_table", cast: ["boy"], rules: "Your student asks the questions every student asks. Answer each before the lamp burns down. Two of three.", stakes: ["Your student writes your answers down.", "Your student finds a better teacher."] } }
    };
    return Object.assign(base, trials[kind]);
  }

  K.scenes([
    // ---------- Threads: an elder sibling ----------
    {
      id: "ep_sibling", act: 1, age: 6, away: true, when: (S) => !S.sibling && !S.flags.includes("no_sibling"), skipTo: "a1_first", next: "a1_first",
      art: homeArt, place: (S) => K.childPlace(S), caption: "The one who went ahead of you",
      title: "The one born before you",
      body: ["In most houses there is someone a few years older who went first: first to the river, first to the drills, first to be shouted at. Was there one in yours?"],
      choices: [
        { id: "dev", img: "p_revat", t: "A brother, Dev, three years older, who lets you follow him everywhere", fx: { set: { sibling: "dev" }, setBond: { dev: 6 }, flag: "has_sibling", memory: ["dev", "You followed me everywhere when you were six."] },
          text: "Dev pretends to mind. Dev never once sends you home." },
        { id: "devi", img: "p_madhavi", t: "A sister, Devi, four years older, who taught you to swim by pushing you in", fx: { set: { sibling: "devi" }, setBond: { devi: 6 }, flag: "has_sibling", memory: ["devi", "I pushed you in the river when you were six, and you swam."] },
          text: "Devi watches from the bank with her arms folded until you reach it. Then she claps, once." },
        { id: "none", t: "No one. You were the eldest, or the only one", fx: { flag: "no_sibling", duty: { family: 1 } } }
      ]
    },
    // ---------- Threads: Ugra at the tournament ----------
    {
      id: "ep_ugra_tournament", act: 2, age: 17, away: true, when: (S) => ugraMet(S) && !S.dead.includes("ugra"), skipTo: "a2_tournament", next: "a2_tournament",
      art: art("scene_tournament_crowd"), place: "Tournament grounds, Hastinapura", caption: "The morning before the princes' tournament",
      title: "The miller's son, again",
      body: (S) => [
        "The morning before the tournament, the grounds are full of levies from the villages come to carry water and hold horses. One of them is a head taller than the rest and has a miller's shoulders.",
        S.flags.includes("beat_ugra") ? { speaker: "Ugra", line: "You. The one from the fair. I have been practising." } : S.flags.includes("lost_to_ugra") ? { speaker: "Ugra", line: "You. The one who came back for a second throw. I told everyone in my village about you." } : { speaker: "Ugra", line: "You. You ran from my ring. Do you still run?" }
      ],
      choices: [
        { id: "bout", t: "Step into the dust with him, here and now", game: "push", hint: "A wrestling bout", trial: { attr: "might", skill: "mace", stage: "stage_tournament_arena", cast: ["ugra"], foe: "Ugra", rules: "Ugra plants his feet in the dust where the horses are watered. Push as the ring meets the mark. Three good pushes win; three slips lose.", stakes: ["Ugra laughs, and shakes your hand, and the levies cheer.", "Ugra puts you in the horse trough, and the levies cheer louder."] },
          win: { fx: { bond: { ugra: 2 }, flag: "ugra_tournament_won", rep: { common: 1 } }, text: "Ugra goes down in the dust, gets up, and laughs so loud the horses shy. \"Again at the next fair,\" he says." },
          lose: { fx: { bond: { ugra: 1 }, flag: "ugra_tournament_lost" }, text: "You come up out of the horse trough to find Ugra holding out a hand. \"Again at the next fair,\" he says." } },
        { id: "talk", t: "Ask him what a miller's son is doing at the princes' tournament", fx: { bond: { ugra: 1 }, attr: { wisdom: 1 } },
          text: "\"Holding horses,\" he says. \"And watching. Someone has to see how the princes fight, for when we have to fight them.\" He says it lightly. He does not mean it lightly." },
        { id: "ignore", t: "Walk past him. You have a tournament to watch", fx: { bond: { ugra: -1 }, flag: "ugra_slighted" }, text: "You feel his eyes on your back all the way to the stands." }
      ]
    },
    // ---------- Threads: a wrong ask from your teacher ----------
    {
      id: "ep_mentor_vidura", act: 3, age: 28, away: true, when: (S) => S.teacher === "vidura" && !!S.friend && S.friend !== "charu", skipTo: "a3_rajasuya", next: "a3_rajasuya",
      art: art("scene_mentor_vidura"), place: "Vidura's house", caption: "A lamp, a table, a question",
      title: "What Vidura asks",
      body: ["Vidura sends for you after dark, which he never does.",
        ["\"{friend} is close to you,\" he says. \"Closer than to anyone. I need to know what {friend} says when the court is not listening: who is spoken to, what is promised. For the kingdom's sake. You would be doing nothing wrong.\" He does not quite meet your eyes when he says the last part.", null]],
      choices: [
        { id: "obey", t: "Do as he asks, and report what your friend says", fx: (S) => ({ duty: { teacher: 2, conscience: -2 }, bond: { vidura: 1, [S.friend]: -1 }, flag: "spied_on_friend", memory: [S.friend, "Someone told Vidura things I said only to you. I never asked who."] }),
          text: "You carry Vidura what you hear, a little at a time. {friend} never finds out. You find that you cannot look at {friend} for very long." },
        { id: "half", t: "Tell him you will listen, and then tell him nothing he does not already know", check: { attr: "wisdom", skill: "statecraft", dc: 8,
          pass: { fx: { duty: { conscience: 1 } }, text: "You bring Vidura gossip the whole court knows. He listens gravely, and after a month stops asking, and you are fairly sure he always knew." },
          fail: { fx: { duty: { teacher: -2 }, bond: { vidura: -1 } }, text: "Vidura sees through it in a week. \"If you would not do it, you should have said so,\" he says, and it is the only time he is ever cold with you." } }, hint: "A test of wits" },
        { id: "refuse", t: "Refuse him to his face", fx: { duty: { teacher: -1, conscience: 2 }, bond: { vidura: 1 }, flag: "refused_vidura" },
          text: "Vidura is quiet for a long moment. \"Good,\" he says at last. \"I hoped you would say that. Forget I asked.\" You never quite do." }
      ]
    },
    {
      id: "ep_mentor_kripa", act: 4, age: 30, away: true, when: (S) => S.teacher === "kripa", skipTo: "a4_stakes", next: "a4_stakes",
      art: art("scene_mentor_kripa"), place: "The assembly hall, Hastinapura", caption: "Before the dice are thrown",
      title: "What Kripa asks",
      body: ["Before the game begins, Kripa finds you by the pillars. He has served the Kuru throne all his life, and he will serve it to the end, whatever it does.",
        { speaker: "Kripa", line: "Whatever happens in this hall today, the throne is in the right, because it is the throne. If anyone asks you afterwards, that is what you will say. Swear it to me." }],
      choices: [
        { id: "swear", t: "Swear it", tags: ["lie"], fx: { duty: { teacher: 2, conscience: -2 }, rep: { pandava: -1 }, flag: "swore_for_throne" }, text: "You swear it. An hour later you watch what the throne does, and the oath sits in your mouth like a stone." },
        { id: "evade", t: "Tell him you will say what you see", fx: { duty: { teacher: -1, conscience: 1 } }, text: "\"That is what I am afraid of,\" Kripa says, and goes to his seat." },
        { id: "refuse", t: "Refuse. A throne can be wrong", fx: { duty: { teacher: -2, conscience: 2 }, rep: { kuru: -1 }, flag: "refused_kripa" }, text: "Kripa looks at you as if you had struck him. \"Then you have learned nothing from me,\" he says. You think you have learned the one thing that matters." }
      ]
    },
    {
      id: "ep_mentor_peace", act: 5, age: 44, away: true, when: (S) => ["hermit", "balarama"].includes(S.teacher) && !S.flags.includes("betrayed_hermit"), skipTo: "a5_side", next: "a5_side",
      art: art("scene_mentor_peace"), place: "A road before the war", caption: "A teacher's last asking",
      title: (S) => (S.teacher === "balarama" ? "What Balarama asks" : "What Mauni asks"),
      body: (S) => (S.teacher === "balarama"
        ? ["Balarama finds you on the road. He has refused both sides and is going on pilgrimage along the Sarasvati rather than watch his students kill each other.", { speaker: "Balarama", line: "Come with me. Everything I taught you was for a quarrel, not for this. Promise me you will not fight in it." }]
        : ["A boy brings a leaf with three words burned into it, in Mauni's hand: never fight them. It is the longest message he has ever sent you."]),
      choices: [
        { id: "promise", t: "Promise not to fight in the war", fx: { duty: { teacher: 2 }, flag: "promised_peace" }, hint: "Fight anyway, and the promise is broken",
          text: (S) => (S.teacher === "balarama" ? "Balarama grips your shoulder. \"Then there is one of you I will not have to mourn.\"" : "You burn the leaf, as Mauni would want, and keep the words.") },
        { id: "refuse", t: "Tell the truth: you will go where your duty takes you", fx: { duty: { teacher: -2, conscience: 1 } },
          text: (S) => (S.teacher === "balarama" ? "Balarama nods slowly. \"Then at least be the one who comes back,\" he says, and walks on toward the river." : "You send the boy back with no answer. Mauni will understand the silence. He always did.") }
      ]
    },
    // ---------- Threads: the secret you carry ----------
    {
      id: "ep_secret_tell", act: 5, age: 44, away: true, when: (S) => S.flags.includes("left_arena") && !S.flags.includes("secret_told"), skipTo: "a5_karna_secret", next: "a5_karna_secret",
      art: art("scene_secret_told"), place: "Hastinapura, before the war", caption: "A thing known for twenty-seven years",
      title: "Who to tell",
      body: ["You have known since you were seventeen what Karna does not: whose son he is. The war is coming. A secret kept this long starts to feel like a weapon, and weapons want to be used."],
      choices: [
        { id: "duryodhana", t: "Tell Duryodhana. He should know whom he has made a king", req: { bond: ["duryodhana", 4] }, locked: "Duryodhana would need to listen to you.", fx: { flag: ["secret_told", "told_duryodhana_secret"], bond: { duryodhana: 1, karna: -3 }, duty: { conscience: -2 }, memory: ["karna", "You told Duryodhana what I was before you told me."] },
          text: "Duryodhana is silent for a long time. \"It changes nothing,\" he says at last. \"He is my friend.\" But he looks at Karna differently after that, and Karna, who notices everything, notices." },
        { id: "yudhishthira", t: "Tell Yudhishthira. He would not fight his own brother", req: { bond: ["yudhishthira", 3] }, locked: "Yudhishthira would need to know you.", fx: { flag: ["secret_told", "told_yudhishthira_secret"], bond: { yudhishthira: 2, krishna: -1 }, duty: { conscience: 1 } },
          text: "Yudhishthira weeps, and then asks you to tell no one else, and then goes to Krishna, who already knows, and who tells him what Kunti herself will tell Karna at the river. Nothing changes. Everything in Yudhishthira's face has." },
        { id: "kunti", t: "Go to Kunti, and tell her you know", fx: { flag: ["secret_told", "told_kunti_secret"], rep: { pandava: 1 }, attr: { wisdom: 1 } },
          text: "Kunti does not ask how you know. \"Then you know what I am going to the river to do,\" she says. \"Pray that I am braver than I was.\"" },
        { id: "keep", t: "Keep it. It was never yours", fx: { flag: "secret_told", duty: { conscience: 1 } }, text: "You keep it, as you have for twenty-seven years. Karna will hear it from the two people who should tell him." }
      ]
    },
    // ---------- Threads: Ugra rises in the other camp ----------
    {
      id: "ep_ugra_rise", act: 5, age: 44, away: true, when: (S) => ugraMet(S) && !S.dead.includes("ugra"), skipTo: "a5_side", next: "a5_side",
      art: art("scene_ugra_letter"), place: "Before the war", caption: "A letter in a miller's hand",
      title: "Ugra's letter",
      body: ["A letter comes, written in a large careful hand that learned late. Ugra, the miller's son, is a captain of levies now. He does not say whose. He says the pay is good, and that he thinks of the fair more than a grown man should, and that if the war comes he hopes to be on the same side as you, and that if he is not, he will not look for you in the press."],
      choices: [
        { id: "write", t: "Write back", fx: { bond: { ugra: 1 }, flag: "wrote_to_ugra" }, text: "You write back about the fair. You do not mention the war. He will have understood." },
        { id: "burn", t: "Burn it. There is a war coming", fx: { flag: "burned_ugra_letter" }, text: "You burn it, and remember every word anyway." }
      ],
      enter: { flag: "ugra_across" }
    },
    // ---------- Threads: the sibling takes the other side ----------
    {
      id: "ep_sibling_side", act: 5, age: 44, away: true, when: (S) => sibAlive(S) && warring(S), skipTo: "a6_eve", next: "a6_eve",
      art: homeArt, place: (S) => K.homePlace(S), caption: "Two spears in one house",
      title: "The other side of the house",
      body: (S) => [["{who} comes home the night before you leave for the field, in the colours of the other side.", sibP(S)],
        ["\"I serve who I serve,\" {who} says. \"So do you. If we meet out there, look the other way. I will.\"", sibP(S)]],
      choices: [
        { id: "promise", t: "Promise to look the other way", fx: (S) => ({ bond: { [S.sibling]: 2 }, flag: "sibling_promise", keepsake: "amulet", memory: [S.sibling, "We promised to look the other way on the field, and I gave you my amulet to remember it."] }),
          text: (S) => ["{who} takes off the copper amulet {who} has worn since you were children and ties it on your wrist. Neither of you says anything else.", sibP(S)] },
        { id: "argue", t: "Argue, all night, to change your sibling's side", check: { attr: "wisdom", skill: "statecraft", dc: 9,
          pass: { fx: (S) => ({ bond: { [S.sibling]: 1 }, flag: "sibling_same_side", memory: [S.sibling, "You talked all night, and in the morning I came with you."] }), text: "At dawn {who} puts the other side's colours in the fire. \"If we die, we die together, then,\" {who} says. \"Our mother will be furious.\"" },
          fail: { fx: (S) => ({ bond: { [S.sibling]: -2 }, flag: "sibling_quarrel" }), text: "{who} leaves before dawn without saying goodbye. You tell yourself there will be time afterwards." } }, hint: "A test of wits" },
        { id: "silent", t: "Say nothing. There is nothing to say", fx: {}, text: "You sit up together until the lamp goes out. In the morning you leave by different gates." }
      ]
    },
    // ---------- Episodes: a storm in the forest ----------
    {
      id: "ep_storm", act: 5, age: 36, away: true, when: (S) => S.seen.includes("a5_jayadratha") || S.seen.includes("a5_forest_boon"), skipTo: "a5_yaksha", next: "a5_yaksha",
      art: art("stage_forest_storm"), place: "The Kamyaka forest", caption: "The sky goes black at noon",
      title: "The storm",
      body: ["In the fourth year of the exile the rains come early and all at once. The camp is in a ravine, and the children are furthest from the rock shelter."],
      choices: [STORM, { id: "climb", t: "Climb a tree with whoever is nearest and wait it out", fx: { duty: { family: -1 } }, text: "You spend the night in the branches with two children clinging to you. In the morning the camp is a riverbed. Three people are missing, and found." }]
    },
    // ---------- Episodes: Charu drinks first ----------
    {
      id: "ep_lake_charu", act: 5, age: 42, away: true, when: (S) => S.friend === "charu" && !S.dead.includes("charu") && S.flags.includes("a5_yaksha_answer_again"), skipTo: "a5_yaksha_again", next: "a5_yaksha_again",
      art: art("scene_lake_charu"), place: "A lake in the forest", caption: "Charu, face down at the water's edge",
      title: "Charu drinks",
      body: ["While you stand with your wrong answer in your mouth, Charu, who came behind you and heard no voice at all, kneels and drinks. Charu falls face down at the water's edge and does not move.",
        "\"One of you drank without answering,\" says the voice."],
      choices: [CHARU_LAKE,
        { id: "drag", t: "Drag Charu away from the water and run for the camp", fx: { die: "charu", duty: { conscience: -1 }, journal: "At the lake in the forest Charu drank first and fell, and you could not carry Charu back to the camp in time." }, text: "You get Charu halfway to the camp. It is not far enough." }]
    },
    // ---------- Episodes: the hidden year ----------
    {
      id: "ep_false_name", act: 5, age: 43, away: true, when: (S) => S.seen.includes("a5_matsya"), skipTo: "a5_herd", next: "a5_herd",
      art: art("stage_virata_hall"), place: "King Virata's court, Matsya", caption: "The steward asks questions",
      title: "Your false name",
      body: ["In Virata's household you are someone else: a groom, a cook's helper, a hanger-on of the new dancing teacher. The steward has begun to count the new faces, and to ask."],
      choices: [NERVE, { id: "leave", t: "Leave the household before he asks you anything", fx: { rep: { common: -1 } }, text: "You take work in the town instead, and hear the rest of the year as rumour." }]
    },
    {
      id: "ep_kichaka", act: 5, age: 43, away: true, when: (S) => S.seen.includes("a5_matsya") && !S.flags.includes("left_virata"), skipTo: "a5_herd", next: "a5_herd",
      art: art("stage_dancing_hall"), place: "The dancing hall, Matsya", caption: "The night Bhima waited in the dark",
      title: "The dancing hall",
      witness: ["Kichaka, the queen's brother and the kingdom's commander, will not leave the queen's maid alone. The maid is Draupadi. Bhima tells her to send Kichaka to the dancing hall at midnight, and goes in her place."],
      body: ["Draupadi must be somewhere else when it happens, seen by people who will swear to it. Bhima asks you to see to it."],
      choices: [DANCE_HALL, { id: "no", t: "Stay out of it. It is a family matter", fx: { bond: { bhima: -1 } }, text: "Bhima does it alone, as he would have anyway. In the morning there is a thing in the dancing hall that used to be a man." }],
      after: ["Bhima kills Kichaka in the dark, and leaves what is left for the court to find. The dancers say a Gandharva did it. Nobody believes the dancers, and nobody says so."]
    },
    // ---------- Episodes: the war ----------
    {
      id: "ep_shikhandi", act: 6, age: 44, away: true, war: true, when: (S) => S.side === "pandava", skipTo: "a6_bhishma", next: "a6_bhishma",
      art: art("scene_shikhandi"), place: "Kurukshetra · the tenth day", caption: "Shikhandi at the front of the chariot",
      title: "In front of Shikhandi",
      body: ["On the tenth morning the word goes down the line: Shikhandi will ride at the front of Arjuna's chariot, and the grandsire will not loose at one who was born a woman. Someone must ride in front of Shikhandi, to take the arrows of the men around Bhishma who have no such scruple."],
      choices: [
        { id: "ride", t: "Ride in front of Shikhandi", combat: "e_ep_bhishma", fx: { flag: "rode_with_shikhandi" } },
        { id: "refuse", t: "Refuse. There is no honour in this", fx: { duty: { conscience: 1, court: -1 }, rep: { pandava: -1 }, flag: "refused_shikhandi" }, text: "Someone else rides. You watch the grandsire fall from the back of the line, and are not sure which of you was right." }
      ]
    },
    {
      id: "ep_letter_1", act: 6, age: 44, away: true, war: true, when: (S) => !!(friendAcross(S) || (sibAlive(S) && S.flags.includes("sibling_other_side_set")) || ugraAcross(S)), skipTo: "a6_capture", next: "a6_capture",
      art: art("scene_letter_camp"), place: "Your tent, after the tenth day", caption: "A letter carried under a truce flag",
      title: "A letter from across the field",
      body: (S) => {
        const f = friendAcross(S), who = f ? K.PEOPLE[f].name : sibAlive(S) && S.flags.includes("sibling_other_side_set") ? sib(S) : "Ugra";
        return [["A boy under a truce flag brings a letter from {who}, across the field.", { who }],
          f === "karna" ? { speaker: "Karna", line: "I saw your banner today and turned my chariot the other way. Do not make me do it twice." }
            : f === "duryodhana" ? { speaker: "Duryodhana", line: "I have not forgotten who stood with me when I was ten. Stay out of my path and I will stay out of yours." }
            : f === "arjuna" ? { speaker: "Arjuna", line: "If we meet, I will aim at your chariot and not at you. Do the same for me, and we can argue about it afterwards." }
            : f === "bhima" ? { speaker: "Bhima", line: "I will throw you in the river again when this is over. Keep your head down until then." }
            : who === "Ugra" ? { speaker: "Ugra", line: "I said I would not look for you in the press. I am looking anyway. Stay alive, you stubborn fool." }
            : { speaker: who, line: "Mother sends word that she is not speaking to either of us. Look the other way. I am." }];
      },
      choices: [
        { id: "reply", t: "Write back, and keep the letter", fx: (S) => { const f = friendAcross(S) || (S.flags.includes("sibling_other_side_set") ? S.sibling : "ugra"); return { bond: { [f]: 1 }, keepsake: "letter", flag: "replied_letter" }; }, text: "You write three lines and send the boy back with them. The letter you fold small and keep against your skin." },
        { id: "silent", t: "Send the boy back with nothing", fx: (S) => { const f = friendAcross(S) || (S.flags.includes("sibling_other_side_set") ? S.sibling : "ugra"); return { bond: { [f]: -1 } }; }, text: "The boy waits a long time before he understands, and goes." },
        { id: "burn", t: "Burn it unread. You cannot afford it", fx: { duty: { court: 1, conscience: -1 } }, text: "You put it in the lamp without opening it. You tell yourself it was the right thing. You do not sleep." }
      ]
    },
    {
      id: "ep_carts", act: 6, age: 44, away: true, war: true, when: (S) => warring(S) && (S.path === "spy" || (S.skills.stealth || 0) >= 2), skipTo: "a6_day13", next: "a6_day13",
      art: art("scene_supply_camp_night"), place: "Behind the enemy lines, the night of the twelfth day", caption: "Grain carts under the watch-fires",
      title: "The supply carts",
      body: ["The night after the twelfth day a captain asks for someone who can move quietly. The enemy's grain and fodder stand in carts behind their lines, and hungry horses pull badly."],
      choices: [CARTS, { id: "no", t: "Say no. You fight by daylight", fx: { duty: { court: -1 } }, text: "Someone else goes. Someone else does not come back." }]
    },
    {
      id: "ep_carts_fight", act: 6, age: 44, away: true, war: true, art: art("fight_supply_carts"), place: "The enemy's supply camp", caption: "The camp wakes",
      title: "Out of the camp",
      body: ["Torches, shouting, men coming out of tents with whatever is nearest to hand. The horse lines are behind you."],
      choices: [{ id: "fight", t: "Fight your way out", combat: "e_ep_carts" }],
      next: "a6_day13"
    },
    {
      id: "ep_orders", act: 6, age: 44, away: true, war: true, when: (S) => warring(S) && S.flags.includes("role_command"), skipTo: "a6_day14", next: "a6_day14",
      art: art("scene_river_crossing"), place: "The river between the camps, the night of the thirteenth day", caption: "A packet, sealed with the wrong seal",
      title: "False orders",
      body: ["After the wheel closed, a captain of your own side puts a sealed packet in your hands: orders in the enemy's own cipher, with the enemy's own seal, telling their left division to be somewhere it should not be at dawn. \"Someone they trust has to carry it,\" he says. \"You have a face no one has seen.\""],
      choices: [
        Object.assign({}, RIVER, { fx: { flag: ["orders_delivered", "carried_false_orders"], duty: { court: 2, conscience: -2 }, journal: "On the night of the thirteenth day you carried false orders across the river, and in the morning the enemy's line was in the wrong place." } }),
        { id: "burn", t: "Burn the packet, and tell the captain the river was watched", fx: { flag: ["orders_burned", "refused_false_orders"], duty: { conscience: 2, court: -1 }, memory: ["all", "You would not carry a lie across the river, even in a war."] },
          text: "You burn it in the lamp and tell the captain the river was watched. He looks at you for a long moment and does not call you a liar. In the morning the line goes in honestly, and knows it." }
      ]
    },
    {
      id: "ep_truce", act: 6, age: 44, away: true, war: true, when: (S) => warring(S) && !!(friendAcross(S) || (sibAlive(S) && S.flags.includes("sibling_other_side_set")) || ugraAcross(S)), skipTo: "a6_day16", next: "a6_day16",
      art: art("scene_truce_river"), place: "The river at dusk, after the fifteenth day", caption: "Soldiers of both sides at the water",
      title: "The truce at dusk",
      body: (S) => {
        const f = friendAcross(S), who = f ? K.PEOPLE[f].name : sibAlive(S) && S.flags.includes("sibling_other_side_set") ? sib(S) : "Ugra";
        return [S.flags.includes("council_truce") ? "The truce you argued for at the council holds for an hour at dusk: soldiers of both sides go down to the river for water and the dead, and nobody draws." : "Every evening after the horns there is an hour at the river when both sides go down for water and the dead, and nobody draws.",
          ["Across the water, filling a skin, is {who}.", { who }]];
      },
      choices: [
        { id: "cross", t: "Wade across and speak", fx: (S) => { const f = friendAcross(S) || (S.flags.includes("sibling_other_side_set") ? S.sibling : "ugra"); return { bond: { [f]: 2 }, flag: "truce_spoke", memory: [f, "You waded across the river at dusk to speak to me, in the middle of the war."] }; },
          text: "You talk about nothing: the water, the mosquitoes, a horse. Neither of you mentions tomorrow. When the horns sound you wade back without looking round." },
        { id: "raise", t: "Raise a hand, and no more", fx: (S) => { const f = friendAcross(S) || (S.flags.includes("sibling_other_side_set") ? S.sibling : "ugra"); return { bond: { [f]: 1 } }; }, text: "A hand raised, a hand raised back. It will have to do." },
        { id: "away", t: "Turn away before you are seen", fx: { duty: { conscience: -1 } }, text: "You fill your skin upstream and do not look back." }
      ]
    },
    {
      id: "ep_letter_2", act: 6, age: 44, away: true, war: true, when: (S) => S.flags.includes("replied_letter") && !!(friendAcross(S) || (sibAlive(S) && S.flags.includes("sibling_other_side_set")) || ugraAcross(S)), skipTo: "a6_day17", next: "a6_day17",
      art: art("scene_letter_camp"), place: "Your tent, the night before the seventeenth day", caption: "A second letter, shorter",
      title: "The second letter",
      body: (S) => {
        const f = friendAcross(S), who = f ? K.PEOPLE[f].name : sibAlive(S) && S.flags.includes("sibling_other_side_set") ? sib(S) : "Ugra";
        return [["The same boy, thinner. A second letter from {who}, shorter than the first.", { who }], { speaker: who, line: "Tomorrow is the day. Whatever happens, I was glad of you." }];
      },
      choices: [
        { id: "reply", t: "Write back the same", fx: (S) => { const f = friendAcross(S) || (S.flags.includes("sibling_other_side_set") ? S.sibling : "ugra"); return { bond: { [f]: 1 }, flag: "replied_twice" }; }, text: "Three words. The boy runs." },
        { id: "keep", t: "Keep it, and send nothing. Words are used up", fx: {}, text: "You fold it into the first one." }
      ]
    },
    {
      id: "ep_sibling_field", act: 6, age: 44, away: true, war: true, when: (S) => sibAlive(S) && S.flags.includes("sibling_other_side_set") && warring(S), skipTo: "a6_day18", next: "a6_day18",
      art: art("scene_sibling_field"), place: "Kurukshetra · the seventeenth day", caption: "A face you know, across a spear's length",
      title: "Across a spear's length",
      body: (S) => [["In the press of the seventeenth day a chariot comes broadside to yours, and the one on it is {who}.", sibP(S)],
        S.flags.includes("sibling_promise") ? { memory: "You promised to look the other way. The amulet is on your wrist." } : S.flags.includes("sibling_quarrel") ? { memory: "The last thing between you was a quarrel, and a gate closing before dawn." } : null],
      choices: [
        { id: "spare", t: "Lower your weapon and turn your chariot away", fx: (S) => ({ bond: { [S.sibling]: 2 }, duty: { court: -1, conscience: 1 }, flag: "spared_sibling", memory: [S.sibling, "On the seventeenth day you turned your chariot away from mine."] }),
          text: (S) => ["{who} lowers the spear a heartbeat after you do. The press carries you apart. You will both deny it afterwards.", sibP(S)] },
        { id: "strike", t: "Strike first. This is war", fx: (S) => ({ die: S.sibling, duty: { court: 1, conscience: -3, family: -3 }, flag: "killed_sibling", journal: "On the seventeenth day you struck first, and it was your own sibling." }),
          text: (S) => ["It is quick. {who} looks surprised, and then looks like nothing at all. You do not remember the rest of the day.", sibP(S)] },
        { id: "avoid", t: "Shout to your driver to turn, and do not look", fx: (S) => ({ flag: "avoided_sibling" }), resolve: (S) => (K.rng() < 0.5 ? { die: S.sibling, journal: "You turned away from your sibling on the seventeenth day. Someone else did not." } : null),
          text: (S) => (S.dead.includes(S.sibling) ? ["You turn away. That evening they bring you {who}'s amulet. Someone else did not turn.", sibP(S)] : ["You turn away, and the press closes between you. {who} lives through the day. So do you.", sibP(S)]) }
      ]
    },
    {
      id: "ep_ugra_last", act: 6, age: 44, away: true, war: true, when: (S) => ugraAcross(S) && !S.flags.includes("shamed_ugra"), skipTo: "a6_day18", next: "a6_day18",
      art: art("scene_ugra_field"), place: "Kurukshetra · the seventeenth day", caption: "The miller's son, with a captain's spear",
      title: "The miller's son, the last time",
      body: ["On the seventeenth day a captain of levies comes through the smoke with his spear up and stops dead. It is Ugra. He has been looking for you after all."],
      choices: [
        { id: "fight", t: "Fight him, as you did at the fair", combat: "e_ep_ugra" },
        { id: "mercy", t: "Lower your weapon and tell him to go home to his mill", check: { attr: "command", skill: "statecraft", dc: 8,
          pass: { fx: { bond: { ugra: 2 }, flag: "sent_ugra_home", duty: { conscience: 1 } }, text: "Ugra looks at you for a long time. Then he turns his levies round and walks them off the field, and does not come back. He is the only captain on either side who goes home that day with all his men." },
          fail: { fx: { bond: { ugra: 1 } }, text: "\"I have a hundred men behind me,\" he says, \"and they have fathers.\" He goes past you into the smoke, and you let him." } }, hint: "A test of command" }
      ]
    },
    // ---------- After the war ----------
    {
      id: "ep_rebuild", act: 7, age: 45, away: true, when: (S) => S.alive, skipTo: "a7_final", next: "a7_final",
      art: art("scene_rebuild"), place: "Hastinapura, the ruined quarter", caption: "A quarter of the city, roofless",
      title: "The ruined quarter",
      body: ["The quarter below the walls burned in the last week of the war, when nobody was left to put it out. The new king has no men to spare. The people who lived there are living in it anyway."],
      choices: [
        { id: "work", t: "Work on the roofs yourself, every day, until they are done", fx: { rep: { common: 2 }, duty: { family: -1 }, flag: "rebuilt_quarter", journal: "After the war you rebuilt the roofs of the burned quarter with your own hands." }, text: "By the rains the quarter has roofs. People call the lane you worked on by your name, and will for a generation, long after they have forgotten why." },
        { id: "organise", t: "Organise it: find the timber, set the carpenters, argue with the treasury", check: { attr: "command", skill: "statecraft", dc: 8,
          pass: { fx: { rep: { common: 1, pandava: 1 }, attr: { command: 1 }, flag: "rebuilt_quarter" }, text: "It takes a season of arguing and the quarter is rebuilt before the rains. Nobody thanks you, which is how you know it was done properly." },
          fail: { fx: { rep: { common: -1 } }, text: "The treasury has no timber, the carpenters have gone home to their own ruined villages, and the rains come first." } }, hint: "A test of command" },
        { id: "no", t: "It is not your city. Go home", fx: { duty: { family: 1 } } }
      ]
    },
    {
      id: "ep_rite", act: 7, age: 45, away: true, when: (S) => S.alive && S.dead.length > 0, skipTo: "a7_final", next: "a7_final",
      art: art("scene_river_rite"), place: "The river, below Hastinapura", caption: "Lamps on the water for the dead",
      title: "The rite for the dead",
      body: (S) => ["A month after the war the whole city goes down to the river with lamps for the dead. You have your own to send out.",
        ["Yours: {list}.", { list: K.list(S.dead.filter((w) => K.PEOPLE[w]).map((w) => K.tr(K.PEOPLE[w].name))) }, true]],
      choices: [
        { id: "forgive", t: "Send a lamp for your dead, and one for whoever killed them", fx: { duty: { conscience: 2 }, attr: { wisdom: 1 }, rep: { sages: 1 }, flag: "forgave_at_river" }, text: "Two lamps. The second is harder to let go of than the first. It goes out around the bend, like the other one." },
        { id: "own", t: "Send lamps for your own, and no one else's", fx: { duty: { family: 2 } }, text: "You send them out one by one, saying each name. The river takes them." },
        { id: "none", t: "Stay on the bank. You have nothing to say to the river", fx: { duty: { conscience: -1 } }, text: "You watch the lamps go. Someone else lights one for yours." }
      ]
    },
    {
      id: "ep_student", act: 7, age: 45, away: true, when: (S) => S.alive && !!S.path, skipTo: "a7_final", next: "a7_final",
      art: art("scene_own_student"), place: (S) => K.homePlace(S), caption: "A child with a stick, waiting at your door",
      title: "A student of your own",
      body: ["A child from the lane has been waiting at your door every morning for a week, with a stick for a spear, the way you once followed the soldiers. There is no one else left to teach."],
      choices: (S) => [studentTest(S), { id: "no", t: "Send the child away. You have taught enough people to die", fx: { duty: { conscience: -1 } }, text: "The child comes back the next morning anyway. You close the door. The morning after, the stick is leaning against it, and the child is gone." }]
    },
    {
      id: "ep_pilgrimage", act: 7, age: 45, away: true, when: (S) => S.alive, skipTo: "a7_final", next: "a7_final",
      art: art("scene_pilgrimage"), place: "The road to the forest", caption: "Three old people on the road, and you",
      title: "The pilgrimage",
      body: ["Before they leave the city for the last time, the old king, the queen and Kunti go on foot to the holy places along the river. They ask for someone to walk with them who is not their son."],
      choices: [
        { id: "walk", t: "Walk with them the whole way", fx: { attr: { wisdom: 1 }, rep: { sages: 1 }, flag: "walked_with_elders", journal: "After the war you walked the holy places with Dhritarashtra, Gandhari and Kunti." },
          text: "Dhritarashtra asks you every evening how many of his sons you killed. Gandhari asks you nothing at all. Kunti, on the last night, asks whether you ever met Karna, and you tell her the truth, and she holds your hand until the fire goes out." },
        { id: "part", t: "Walk the first day, and turn back", fx: { duty: { family: 1 } }, text: "At the first shrine you turn back. Kunti raises a hand. You think she understands." },
        { id: "no", t: "Let them go without you", fx: {} }
      ]
    },
    {
      id: "ep_keepsakes", act: 7, age: 45, away: true, when: (S) => S.alive && (hasKeep(S, "letter") || hasKeep(S, "amulet") || hasKeep(S, "arrow") || S.flags.includes("sat_with_kesava")), skipTo: "a7_final", next: "a7_final",
      enter: (S) => (S.flags.includes("sat_with_kesava") && !hasKeep(S, "hammer") ? { keepsake: "hammer" } : null),
      art: "scene_note", place: (S) => K.homePlace(S), caption: "A few small things on a cloth",
      title: "What you kept",
      body: (S) => ["You lay out on a cloth the few small things you kept through all of it.", ["On the cloth: {list}.", { list: K.list((S.keepsakes || []).map((k) => K.tr(K.KEEPSAKES[k].name))) }, true]],
      choices: (S) => [
        hasKeep(S, "letter") ? { id: "letter", t: "Read the letter from across the lines one last time, and put it in the fire", fx: { duty: { conscience: 1 }, flag: "burned_letter_after" }, text: "You know it by heart. The fire takes the paper. The words stay where they were." } : null,
        hasKeep(S, "amulet") && S.sibling && S.dead.includes(S.sibling) ? { id: "amulet_pyre", t: "Take the amulet to the river and send it after your sibling", fx: { duty: { family: 2 }, flag: "amulet_to_river" }, text: "The copper disc sinks at once. You stand there until your feet are numb." } : null,
        hasKeep(S, "amulet") && S.sibling && !S.dead.includes(S.sibling) ? { id: "amulet_back", t: "Give the amulet back, and say what it meant", fx: (S2) => ({ bond: { [S2.sibling]: 2 }, flag: "amulet_returned" }), text: (S2) => ["{who} ties it back on, and says nothing, and that is the whole of the conversation, and it is enough.", sibP(S2)] } : null,
        hasKeep(S, "hammer") ? { id: "hammer", t: "Hang Kesava's hammer over your own door", fx: { duty: { family: 1 }, bond: { charu: 1 }, flag: "hung_hammer" }, text: "It hangs there for the rest of your life, and your children's." } : null,
        hasKeep(S, "arrow") ? { id: "arrow", t: "Break the arrow from the supply camp and bury the pieces", fx: { duty: { conscience: 1 } }, text: "It was never a trophy. You bury it where nobody will dig." } : null,
        { id: "keep", t: "Wrap them up again. They are yours", fx: {} }
      ].filter(Boolean)
    },
    {
      id: "ep_bard", act: 7, age: 45, away: true, when: (S) => S.alive, skipTo: "a7_final", next: "a7_final",
      art: art("scene_bard"), place: "A courtyard in Hastinapura", caption: "A bard sings the war, and gets it wrong",
      title: "What the bards sing",
      body: (S) => ["In a courtyard a bard is singing the war to anyone who will listen. He has a fine voice and he has your name in it, and he has one thing wrong.",
        { speaker: "The bard", line: bardWrong(S) }],
      choices: [
        { id: "correct", t: "Correct him, there in front of everyone", check: { attr: "wisdom", skill: "lore", dc: 7,
          pass: { fx: { flag: "corrected_bard", skill: { lore: 1 } }, text: "You tell him what happened. He listens, nods, and sings it again, right this time, and the right version is the one that travels." },
          fail: { fx: { flag: "bard_wrong" }, text: "You tell him what happened. He thanks you kindly and sings it the old way the next night, because it rhymes better." } }, hint: "Lore helps" },
        { id: "stand", t: "Let it stand. Songs are not the truth", fx: { flag: "bard_wrong", attr: { wisdom: 1 } }, text: "You put a coin in his bowl and walk on. The wrong version travels, and in a hundred years it will be the only one." }
      ]
    }
  ]);

  // The bard's wrong line: one thing the life did, turned the other way round.
  function bardWrong(S) {
    const has = (f) => S.flags.includes(f);
    if (has("helped_ekalavya")) return "...and when the forest boy cut off his thumb, {name} laughed with the princes...";
    if (has("refused_dakshina")) return "...and {name} rode first against Panchala, for Drona's fee...";
    if (has("objected_dice") || has("stood_between")) return "...and in the dice hall {name} was silent, like all the rest...";
    if (has("refused_ring") || has("refused_bow_order")) return "...and on the thirteenth day {name} was among those who closed on the boy in the wheel...";
    if (has("spared_sibling")) return "...and on the seventeenth day {name} struck down {their} own kin without a word...";
    if (S.vows.some((v) => !v.broken)) return "...and every vow {name} swore, {they} broke before the end...";
    return "...and {name} fled the field on the first day, and was not seen again...";
  }
  K.BARD_WRONG = bardWrong;

  // ---------- Encounters ----------
  K.encounter({
    id: "e_ep_bhishma", title: "In front of Shikhandi", art: "war_bhishma", caption: "The grandsire's arrows", lethal: true, curse: true, rounds: 3, roundsText: "Shikhandi's chariot draws level with the grandsire's, and Bhishma lowers his bow.",
    allies: (S) => K.warAllies(S), spare: false, flee: { tags: ["retreat"] }, callHelp: K.warHelp,
    intro: "Bhishma will not loose at Shikhandi. The men around him have no such scruple, and every one of them is looking at you.",
    // Bhishma himself does not loose at Shikhandi's chariot: only his guard is fought.
    enemies: [K.foe("Kaurava chariot-guard", 4, { abilities: ["strike", "arrows"] }), K.foe("Bhishma's archers", 3, { plural: true, abilities: ["arrows"] })],
    beats: [{ round: 2, text: "The grandsire's arrows come like rain, and none of them is aimed at you. His guard's are.", run: (B) => B.living("friends").forEach((u) => B.status(u, "exposed", 1)) }],
    win: { fx: { rep: { pandava: 2 }, bond: { arjuna: 1 }, flag: "held_for_shikhandi", journal: "On the tenth day you rode in front of Shikhandi, and took the arrows meant for him until the grandsire lowered his bow." }, text: "Shikhandi's chariot draws level with Bhishma's. The old man looks at Shikhandi, and lowers his bow, and Arjuna's arrows begin." },
    lose: { deathText: "{They} rode in front of Shikhandi on the tenth day, and the grandsire's guard did what the grandsire would not." }
  });
  K.encounter({
    id: "e_ep_carts", title: "Out of the supply camp", art: "fight_war_camp", caption: "Torches in the horse lines", lethal: false,
    enemies: [K.foe("Camp sentry", 3), K.foe("Half-dressed spearman", 3)], flee: { tags: ["retreat"], fx: { flag: "carts_fled" }, text: "You go over the horse lines and into the dark." }, spare: true,
    win: { fx: { flag: "carts_fought_out", keepsake: "arrow" }, text: "You are out and running before the rest of the camp finds its boots." },
    lose: { fx: { flag: "carts_taken" }, text: "They take you, and trade you back at the next truce, with your hands tied in front of you and nothing to show for the night." },
    spare: { fx: { duty: { conscience: 1 } }, text: "You leave the last of them in the mud and go over the horse lines." }
  });
  K.encounter({
    id: "e_ep_ugra", title: "Ugra, the last time", art: "war_day17", caption: "A captain of levies, and his hundred", lethal: true, curse: true,
    allies: (S) => K.warAllies(S), spare: true, flee: { tags: ["retreat"] },
    enemies: [K.foe("Ugra, the miller's son", 6, { abilities: ["strike", "heavy"], person: "ugra", hp: 90, atk: 11 }), K.foe("Ugra's levies", 3, { plural: true, abilities: ["strike", "arrows"] })],
    intro: "Ugra comes on the way he did at the fair, head down, and his levies behind him.",
    win: { fx: { die: "ugra", duty: { conscience: -1 }, journal: "On the seventeenth day you fought Ugra, the miller's son, and he did not get up." }, text: "He goes down the way he never did at the fair, and this time he does not laugh, and does not get up." },
    spare: { fx: { bond: { ugra: 3 }, flag: "spared_ugra", duty: { conscience: 1 }, journal: "On the seventeenth day you had Ugra, the miller's son, at your mercy, and let him go." }, text: "He is on his knees in the mud. \"Go home to your mill,\" you say. He looks at you a long time, and goes." },
    lose: { deathText: "{They} fell on the seventeenth day to Ugra, the miller's son, whom {they} first fought at a spring fair." }
  });

  // ---------- Where the scenes come ----------
  const before = (id, list) => { K.BEFORE[id] = (K.BEFORE[id] || []).concat(list); };
  before("a1_first", ["ep_sibling"]);
  before("a2_tournament", ["ep_ugra_tournament"]);
  before("a3_rajasuya", ["ep_mentor_vidura"]);
  before("a4_stakes", ["ep_mentor_kripa"]);
  before("a5_yaksha", ["ep_storm"]);
  before("a5_yaksha_again", ["ep_lake_charu"]);
  before("a5_herd", ["ep_false_name", "ep_kichaka"]);
  before("a5_karna_secret", ["ep_secret_tell"]);
  before("a5_side", ["ep_mentor_peace", "ep_ugra_rise"]);
  before("a6_eve", ["ep_sibling_side"]);
  before("a6_bhishma", ["ep_shikhandi"]);
  before("a6_capture", ["ep_letter_1"]);
  before("a6_day13", ["ep_carts"]);
  before("a6_day14", ["ep_orders"]);
  before("a6_day16", ["ep_truce"]);
  before("a6_day17", ["ep_letter_2"]);
  before("a6_day18", ["ep_sibling_field", "ep_ugra_last"]);
  before("a7_final", ["ep_rebuild", "ep_rite", "ep_student", "ep_pilgrimage", "ep_keepsakes", "ep_bard"]);

  // The sibling's side is drawn when yours is: the other one, unless you talked them round.
  K.on("scene", (sc) => {
    const S = K.S;
    if (K.PUPPETS && !K.PUPPETS.dev) Object.assign(K.PUPPETS, PUPPETS);
    if (sc.id === "a6_eve" && S.sibling && !S.flags.includes("sibling_other_side_set") && !S.flags.includes("sibling_same_side") && warring(S)) S.flags.push("sibling_other_side_set");
  });

  // ---------- What the telling says ----------
  (K.TELL_HOOKS = K.TELL_HOOKS || []).push((S, t, has) => {
    if (has("ugra_tournament_won")) t.push("At seventeen {they} put the miller's son in the dust before the princes' tournament.");
    if (has("sent_ugra_home")) t.push("On the seventeenth day {they} sent Ugra, the miller's son, home to his mill with all his men.");
    if (has("spared_ugra")) t.push("On the seventeenth day {they} had Ugra at {their} mercy, and let him go.");
    if (S.dead.includes("ugra") && S.seen.includes("ep_ugra_last")) t.push("On the seventeenth day {they} killed Ugra, the miller's son, whom {they} first fought at a fair.");
    if (has("told_duryodhana_secret")) t.push("{They} told Duryodhana whose son Karna was, before Karna knew it himself.");
    if (has("told_kunti_secret")) t.push("{They} went to Kunti before the war and told her {they} knew.");
    if (has("spied_on_friend")) t.push("{They} carried a friend's words to Vidura, and the friend never knew.");
    if (has("refused_vidura")) t.push("When Vidura asked {them} to spy on a friend, {they} refused him to his face.");
    if (has("swore_for_throne")) t.push("Before the dice {they} swore to Kripa that the throne was in the right, and watched what the throne did.");
    if (has("refused_kripa")) t.push("{They} told Kripa that a throne can be wrong.");
    if (has("promised_peace") && warring(S)) t.push("{They} promised {their} teacher not to fight in the war, and fought in it.");
    if (has("promised_peace") && S.side === "neutral") t.push("{They} promised {their} teacher not to fight in the war, and kept the promise in the healers' tents.");
    if (S.sibling) {
      if (has("killed_sibling")) t.push(["On the seventeenth day {they} struck down {who}, {their} own {kin}, and did not remember the rest of the day.", { who: sib(S), kin: S.sibling === "dev" ? "brother" : "sister" }]);
      else if (has("spared_sibling")) t.push(["On the seventeenth day {they} turned {their} chariot away from {who}, {their} own {kin}.", { who: sib(S), kin: S.sibling === "dev" ? "brother" : "sister" }]);
      else if (S.dead.includes(S.sibling)) t.push(["{who}, {their} {kin}, fell on the other side of the field.", { who: sib(S), kin: S.sibling === "dev" ? "brother" : "sister" }]);
      else if (has("sibling_same_side")) t.push(["{They} talked {who}, {their} {kin}, round to {their} own side in one night.", { who: sib(S), kin: S.sibling === "dev" ? "brother" : "sister" }]);
    }
    if (has("ran_the_storm")) t.push("In the forest storm {they} ran the camp's children to the rock shelter.");
    if (has("answered_for_charu")) t.push("At the lake in the forest {they} answered the voice for Charu, who had drunk first.");
    if (has("kept_false_name")) t.push("In the hidden year {they} kept {their} false name under the steward's questions.");
    if (has("helped_draupadi_hall")) t.push("The night Bhima waited in the dancing hall, {they} saw to it that Draupadi was somewhere else, and seen.");
    if (has("held_for_shikhandi")) t.push("On the tenth day {they} rode in front of Shikhandi and took the arrows meant for him.");
    if (has("burned_carts")) t.push("One night in the war {they} crept into the enemy's camp and burned their fodder.");
    if (has("carried_false_orders")) t.push("{They} carried false orders across the river between the camps.");
    if (has("refused_false_orders")) t.push("{They} would not carry a lie across the river, even in a war.");
    if (has("truce_spoke")) t.push("At the truce at dusk {they} waded the river to speak to someone on the other side.");
    if (has("rebuilt_quarter")) t.push("After the war {they} rebuilt the roofs of the burned quarter.");
    if (has("forgave_at_river")) t.push("At the river {they} sent a lamp for {their} dead, and one for whoever killed them.");
    if (has("taught_student")) t.push("{They} took a student of {their} own, and set the first test {they} were ever set.");
    if (has("walked_with_elders")) t.push("{They} walked the holy places with the old king and queen and Kunti.");
    if (has("corrected_bard")) t.push("When a bard sang it wrong, {they} corrected him, and the right version is the one that travelled.");
  });
  // The bard's version, when it was let stand, is the one the Book of Lives keeps.
  K.TELL_WRONG = (S) => (S.flags.includes("bard_wrong") ? bardWrong(S).replace(/^\.\.\.and /, "They say that ").replace(/\.\.\.$/, ".") : null);
})(window.K = window.K || {});
