/* One action test per act, after Act I (whose friendship tests live in act1.js).
   Each test is a scene of its own with one variant per situation (your teacher, your side in the
   war), and a second-chance scene behind it. Fail the first try and the second-chance scene opens;
   fail that too and it counts twice in your record, leaves a mark on the skill (K.MERITS) and costs
   standing with whoever watched. The games themselves are in ui/trials.js and ui/games.js. */
(function (K) {
  "use strict";

  // A branch with one more flag added to its effects.
  const addFlag = (br, f) => { const fx = Object.assign({}, br && br.fx); fx.flag = [].concat(fx.flag || [], f); return Object.assign({}, br, { fx }); };
  const againFlag = (id, k) => id + "_" + k + "_again";

  // A test as a choice, and as its second chance. Used by K.trialScenes and by scenes that hold a
  // test among other choices (the tunnel at Varnavata).
  K.testChoice = (id, k, v) => ({ id: k, t: v.t, img: v.img, req: v.req, locked: "", game: v.game, hint: v.hint, trial: v.trial, win: v.win,
    close: addFlag(v.close || v.lose, againFlag(id, k)), lose: addFlag(v.lose, againFlag(id, k)) });
  K.retryChoice = (id, k, v) => ({ id: k, t: v.retryT || v.t, img: v.img, req: { flag: againFlag(id, k) }, locked: "", game: v.game, hint: "Your second chance",
    trial: Object.assign({}, v.trial, { stakes: v.retryStakes }), win: v.win, close: v.retryLose, lose: v.retryLose });
  K.retryWhen = (id, keys) => (S) => keys.some((k) => S.flags.includes(againFlag(id, k)));

  // d: { id, scene: {...}, tests: { key: variant }, next, retry: { id, scene: {...}, letGo, letText } }
  K.trialScenes = function (d) {
    const keys = Object.keys(d.tests);
    const main = Object.assign({}, d.scene, { id: d.id, choices: keys.map((k) => K.testChoice(d.id, k, d.tests[k])), next: d.retry ? d.retry.id : d.next });
    if (!d.retry) return [main];
    const r = d.retry;
    const again = Object.assign({}, r.scene, { id: r.id, when: K.retryWhen(d.id, keys), skipTo: d.next,
      choices: keys.map((k) => K.retryChoice(d.id, k, d.tests[k])).concat([{ id: "let", t: r.letGo || "Let it go", fx: {}, text: r.letText || null }]), next: d.next });
    return [main, again];
  };

  // What these tests leave behind: a point on later tests of the same skill, or a point against.
  K.MERITS.push(
    { flag: "drona_bird", on: ["aim", "archery"], n: 1, text: "You saw only the bird's eye, and hit it." },
    { flag: "missed_bird_twice", on: ["archery"], n: -1, text: "You missed Drona's bird twice, and he stopped watching you shoot." },
    { flag: "kripa_drill", on: ["grace", "mace"], n: 1, text: "You turned every one of Kripa's cuts." },
    { flag: "kripa_twice", on: ["mace"], n: -1, text: "Kripa's wooden sword found your ribs two mornings running." },
    { flag: "balarama_drill", on: ["might", "mace"], n: 1, text: "You struck clean through Balarama's guard." },
    { flag: "balarama_twice", on: ["mace"], n: -1, text: "Balarama knocked the mace from your hands twice." },
    { flag: "mauni_bell", on: ["aim", "archery"], n: 1, text: "You hit Mauni's bell half-blind." },
    { flag: "mauni_twice", on: ["archery"], n: -1, text: "You missed Mauni's bell twice, and he went back to silence." },
    { flag: "vidura_eye", on: ["wisdom", "statecraft"], n: 1, text: "You remembered everything on Vidura's table." },
    { flag: "vidura_twice", on: ["statecraft"], n: -1, text: "Twice you could not say what was on Vidura's table." },
    { flag: "leaf_night", on: ["aim", "archery"], n: 1, text: "You split a leaf on a thread, alone, at night." },
    { flag: "leaf_twice", on: ["archery"], n: -1, text: "Two nights the leaf beat you, and you began to believe it." },
    { flag: "strung_great_bow", on: ["might", "archery"], n: 1, text: "You strung the great bow of Panchala." },
    { flag: "bow_twice", on: ["archery"], n: -1, text: "The great bow of Panchala beat you twice, in front of the kings' men." },
    { flag: "tunnel_twice", on: ["stealth"], n: -1, text: "Two nights running, the guards nearly had you at Varnavata." },
    { flag: "message_carried", on: ["grace", "stealth"], n: 1, text: "You carried Vidura's message past Duryodhana's watchmen." },
    { flag: "message_twice", on: ["stealth"], n: -1, text: "Twice Duryodhana's watchmen turned you back from Kunti's door." },
    { flag: "hands_twice", on: ["wisdom"], n: -1, text: "Twice you stared at Shakuni's hands and saw nothing, and the court saw you staring." },
    { flag: "turned_herd", on: ["grace", "chariot"], n: 1, text: "You turned Virata's herd at the ford." },
    { flag: "herd_twice", on: ["chariot"], n: -1, text: "Virata's herd ran past you twice." },
    { flag: "held_wheel", on: ["might", "command"], n: 1, text: "On the thirteenth day you did what the wheel asked of you." },
    { flag: "wheel_twice", on: ["command"], n: -1, text: "On the thirteenth day you failed your company twice." },
    { flag: "bhishma_answered", on: ["wisdom", "lore"], n: 1, text: "You answered Bhishma's questions on the bed of arrows." },
    { flag: "bhishma_twice", on: ["lore"], n: -1, text: "Twice Bhishma asked, and twice you had no answer." }
  );

  // ---------- Act II: your teacher's test ----------
  const TEACHER = {
    drona: { t: "Take your place under the tree", img: "teacher_drona", req: { teacher: "drona" }, game: "aim", hint: "An archery test",
      trial: { attr: "aim", skill: "archery", icon: "bird", small: true, verb: "Release",
        rules: "Drona has set a wooden bird high in a tree. \"What do you see?\" he asks each of you. Arjuna sees only the eye. Now it is your turn: three arrows, and two must find the eye.",
        stakes: ["Drona counts you among his best.", "Drona says nothing, which is worse. You may shoot again at dawn."] },
      retryStakes: ["Drona counts you among his best.", "Drona stops watching you shoot. It counts as two failures, and it will weigh on every archery test to come."],
      win: { fx: { skill: { archery: 1 }, duty: { teacher: 1 }, bond: { drona: 1 }, flag: "drona_bird", journal: "You hit the eye of Drona's wooden bird." }, text: "Drona nods once. \"You saw the eye,\" he says. From him, that is a speech." },
      lose: { fx: {}, text: "Your arrows rattle through the leaves. Drona moves on to the next student without a word." },
      retryLose: { penalty: 1, fx: { bond: { drona: -2 }, duty: { teacher: -1 }, flag: "missed_bird_twice" }, text: "You miss again. Drona turns away before your last arrow lands. He will not watch you shoot again." } },
    kripa: { t: "Pick up the wooden sword", img: "teacher_kripa", req: { teacher: "kripa" }, game: "push", hint: "A sword drill",
      trial: { attr: "grace", skill: "mace", foe: "Kripa", verb: "Parry", tally: "Parries: {g} of 3 · Hits taken: {b} of 3", good: "Parried!", soon: "Too soon. He feints, and you bite.", late: "Too late. The wood cracks on your ribs.",
        rules: "Kripa attacks with a wooden sword, faster each time. Parry as the ring meets the mark. Three clean parries pass; three hits and you are done.",
        stakes: ["Kripa trusts you with real steel.", "Kripa sends you to the back row. Tomorrow you may try again."] },
      retryStakes: ["Kripa trusts you with real steel.", "Kripa gives up on you, and the court hears of it. It counts as two failures, and it will weigh on every weapon test to come."],
      win: { fx: { skill: { mace: 1 }, bond: { kripa: 1 }, flag: "kripa_drill" }, text: "Kripa lowers the sword. \"Tomorrow,\" he says, \"steel.\"" },
      lose: { fx: {}, text: "Three welts across your ribs. Kripa points to the back row." },
      retryLose: { penalty: 1, fx: { bond: { kripa: -2 }, rep: { kuru: -1 }, flag: "kripa_twice" }, text: "Down again. Kripa sighs and calls the next student. The court hears of it by evening." } },
    balarama: { t: "Lift the practice mace", img: "teacher_balarama", req: { teacher: "balarama" }, game: "push", hint: "A mace drill",
      trial: { attr: "might", skill: "mace", foe: "Balarama", verb: "Strike", period: 0.95, tally: "Clean strikes: {g} of 3 · Blocked: {b} of 3", good: "Through his guard!", soon: "Too soon. He reads it.", late: "Too late. He knocks your mace aside.",
        rules: "Balarama opens his guard for a heartbeat at a time. Strike as the ring meets the mark. Three clean strikes pass.",
        stakes: ["Balarama laughs and calls you a real Yadava.", "Balarama sends you to haul water. You may try again tomorrow."] },
      retryStakes: ["Balarama laughs and calls you a real Yadava.", "Balarama stops teaching you, and the Yadavas hear why. It counts as two failures, and it will weigh on every mace test to come."],
      win: { fx: { skill: { mace: 1 }, bond: { balarama: 1 }, rep: { yadava: 1 }, flag: "balarama_drill" }, text: "Balarama roars with laughter and claps you on the back hard enough to bruise. \"A real Yadava!\"" },
      lose: { fx: {}, text: "The mace flies out of your hands. Balarama hands you two water jars instead." },
      retryLose: { penalty: 1, fx: { bond: { balarama: -2 }, rep: { yadava: -1 }, flag: "balarama_twice" }, text: "Your mace hits the dust again. Balarama shrugs and walks away. The Yadavas hear why." } },
    hermit: { t: "Let Mauni tie the cloth", img: "teacher_mauni", req: { teacher: "hermit" }, game: "aim", hint: "An archery test, half-blind",
      trial: { attr: "aim", skill: "archery", icon: "bell", dark: true, blind: true, easy: 0.03, verb: "Release",
        rules: "Mauni ties a thin cloth over your eyes. Through it you see the swinging bell only at the ends of its swing, where it rings. Shoot where it will be. Two hits of three.",
        stakes: ["Mauni breaks his silence to say your name.", "Mauni unties the cloth and says nothing. You may try again tomorrow night."] },
      retryStakes: ["Mauni breaks his silence to say your name.", "Mauni goes back to his silence, and does not come out of it for you. It counts as two failures, and it will weigh on every archery test to come."],
      win: { fx: { skill: { archery: 1 }, bond: { mauni: 1 }, flag: "mauni_bell" }, text: "The bell rings twice, sharp and wrong, as your arrows strike it. Mauni says your name. It is the first word he has spoken in a month." },
      lose: { fx: {}, text: "The bell swings on, untouched. Mauni unties the cloth and walks into the trees." },
      retryLose: { penalty: 1, fx: { bond: { mauni: -2 }, duty: { teacher: -1 }, flag: "mauni_twice" }, text: "You miss again. Mauni folds the cloth away. For the rest of your training he teaches you only with his hands." } },
    vidura: { t: "Step up to Vidura's table", img: "teacher_vidura", req: { teacher: "vidura" }, game: "notice", hint: "A test of what you notice",
      trial: { attr: "wisdom", skill: "statecraft",
        rules: "Vidura lifts a cloth from a table for a few heartbeats, then covers it again. \"What was there?\" he asks. Two right answers of three.",
        stakes: ["Vidura gives you your first real errand.", "Vidura covers the table and says \"again tomorrow\"."] },
      retryStakes: ["Vidura gives you your first real errand.", "Vidura stops trusting your eyes. It counts as two failures, and it will weigh on every test of statecraft to come."],
      win: { fx: { skill: { statecraft: 1 }, bond: { vidura: 1 }, flag: "vidura_eye" }, text: "Vidura covers the table. \"Good,\" he says. \"Tomorrow you carry a letter.\"" },
      lose: { fx: {}, text: "Vidura covers the table. \"Again tomorrow,\" he says, gently." },
      retryLose: { penalty: 1, fx: { bond: { vidura: -2 }, flag: "vidura_twice" }, text: "Again you cannot say. Vidura gives your errands to someone else." } },
    self: { t: "Hang the leaf on its thread", img: "teacher_self", req: { teacher: ["self", null, undefined] }, game: "aim", hint: "An archery test, alone",
      trial: { attr: "aim", skill: "archery", icon: "leaf", dark: true, small: true, verb: "Release",
        rules: "Alone at night, you have hung a leaf from a thread. If you miss, no one will ever know. You will. Two hits of three.",
        stakes: ["You know you are good, and no one can take that away.", "You go to bed angry. Tomorrow night, again."] },
      retryStakes: ["You know you are good, and no one can take that away.", "You begin to believe the people who say you cannot teach yourself. It counts as two failures, and it will weigh on every archery test to come."],
      win: { fx: { skill: { archery: 1 }, flag: "leaf_night" }, text: "The leaf splits on its thread. You stand there in the dark, grinning at nobody." },
      lose: { fx: {}, text: "The leaf turns on its thread, untouched. You go to bed angry." },
      retryLose: { penalty: 1, fx: { duty: { conscience: -1 }, rep: { common: -1 }, flag: "leaf_twice" }, text: "The leaf beats you again. For the first time, you wonder if they were right about you." } }
  };

  // ---------- Act VI: the wheel ----------
  const WHEEL = {
    pandava: { t: "Drive at the gate with Abhimanyu", req: { side: "pandava" }, game: "push", hint: "A test in battle",
      trial: { attr: "might", skill: "mace", kind: "war", foe: "The wheel's gate", verb: "Charge", period: 0.9, tally: "Breaches: {g} of 3 · Thrown back: {b} of 3", good: "The line buckles!", soon: "Too soon. Spears meet you.", late: "Too late. The gap closes.",
        rules: "The gate in the wheel opens and closes like a breath. Charge as the ring meets the mark. Three breaches carry your company through.",
        stakes: ["Your company holds the breach open longer than anyone thought it could.", "Your company is thrown back. A second wave is forming."] },
      retryStakes: ["Your company holds the breach open longer than anyone thought it could.", "The breach closes, and your company blames you. It counts as two failures, and it will weigh on your command."],
      win: { fx: { rep: { pandava: 1 }, flag: "held_wheel" }, text: "For a few heartbeats the gate is yours. Men pour through behind you." },
      lose: { fx: {}, text: "The spears drive you back. Behind you, the second wave is forming." },
      retryLose: { penalty: 1, fx: { rep: { pandava: -1 }, flag: "wheel_twice" }, text: "Thrown back again. The gate closes, and your company does not look at you." } },
    kaurava: { t: "Hold your place in the ring", req: { side: "kaurava" }, game: "push", hint: "A test in battle",
      trial: { attr: "might", skill: "mace", kind: "war", foe: "The Pandava charge", verb: "Brace", period: 0.9, tally: "Charges held: {g} of 3 · Ground lost: {b} of 3", good: "The charge breaks on you!", soon: "Too soon. You brace on nothing.", late: "Too late. They are through.",
        rules: "The Pandava chariots come at the ring in waves. Brace as the ring meets the mark. Hold three charges.",
        stakes: ["Your part of the ring holds.", "Your part of the ring gives. A second charge is coming."] },
      retryStakes: ["Your part of the ring holds.", "The ring breaks where you stand, and Drona sees it. It counts as two failures, and it will weigh on your command."],
      win: { fx: { rep: { kuru: 1 }, flag: "held_wheel" }, text: "The charge breaks on your shields and falls back." },
      lose: { fx: {}, text: "They are through you before you can close. The second charge is already coming." },
      retryLose: { penalty: 1, fx: { rep: { kuru: -1 }, flag: "wheel_twice" }, text: "The ring breaks where you stand. Drona sees it, and remembers your face." } },
    neutral: { t: "Kneel by the wounded boy", req: { side: ["neutral", null, undefined] }, game: "steady", hint: "A test of steady hands",
      trial: { attr: "grace", skill: "healing", kind: "war", verb: "Press", help: "Hold to press; let go to ease. Keep your hands over the glow.", tally: "Bleeding slowed: {c}% · {s} seconds",
        wonLine: "The bleeding stops. He will live.", nearLine: "Nearly. The bleeding slows, but does not stop.", lostLine: "The blood comes through your fingers.",
        rules: "A boy from the wheel is bleeding out on the tent floor. Press when it helps; ease off when he fights you. Keep your hands over the glow until the bleeding stops.",
        stakes: ["The boy lives.", "The bleeding does not stop. You have one more chance before it is too late."] },
      retryStakes: ["The boy lives.", "The boy dies under your hands, and the healers see it. It counts as two failures, and it will weigh on every healing test to come."],
      win: { fx: { rep: { common: 1 }, flag: "held_wheel" }, text: "The bleeding stops. The boy opens his eyes and asks for his mother." },
      lose: { fx: {}, text: "The blood keeps coming. You shout for clean cloth and start again." },
      retryLose: { penalty: 1, fx: { rep: { common: -1 }, flag: "wheel_twice" }, text: "The boy goes still under your hands. The other healers say nothing, and that is worse." } }
  };

  // ---------- Act VII: Bhishma's questions ----------
  const BHISHMA_ROUNDS = [
    { line: "\"What is heavier than the earth?\"", replies: ["\"A mother.\"", "\"A king's crown.\"", "\"Mount Meru.\""] },
    { line: "\"What is faster than the wind?\"", replies: ["\"The mind.\"", "\"An arrow from Arjuna's bow.\"", "\"A rumour.\""] },
    { line: "\"What, when you give it up, makes you loved?\"", replies: ["\"Pride.\"", "\"Wealth.\"", "\"Anger.\""] }
  ];
  const BHISHMA_AGAIN = [
    { line: "\"What is more numerous than the grass?\"", replies: ["\"Thoughts.\"", "\"The dead on this field.\"", "\"The stars.\""] },
    { line: "\"What is the greatest wonder?\"", replies: ["\"That every day people die, and the living think they will not.\"", "\"That the war lasted only eighteen days.\"", "\"That a man can lie on arrows and live.\""] },
    { line: "\"What is the path?\"", replies: ["\"The one the great have walked.\"", "\"The one the scriptures argue over.\"", "\"The one you make yourself.\""] }
  ];
  const BHISHMA = { t: "Answer him", req: null, game: "retort", hint: "A test of wisdom",
    trial: { attr: "wisdom", skill: "lore", rounds: BHISHMA_ROUNDS,
      rules: "Bhishma asks the questions the spirit of the lake once asked Yudhishthira. Answer before the lamp burns down. Two right answers of three.",
      stakes: ["Bhishma blesses you, and you will carry his answers all your life.", "Bhishma closes his eyes. He may ask again tomorrow, if he lives."] },
    retryStakes: ["Bhishma blesses you, and you will carry his answers all your life.", "Bhishma turns his face away, and the sages remember it. It counts as two failures, and it will weigh on every test of lore to come."],
    win: { fx: { attr: { wisdom: 1 }, bond: { bhishma: 1 }, flag: "bhishma_answered", journal: "You answered Bhishma's questions on the bed of arrows, and he blessed you." }, text: "Bhishma smiles, which must hurt. \"Then you were listening,\" he says, \"all those years.\"" },
    lose: { fx: {}, text: "The words do not come. Bhishma closes his eyes. \"Tomorrow,\" he says, \"if I am here.\"" },
    retryLose: { penalty: 1, fx: { bond: { bhishma: -1 }, rep: { sages: -1 }, flag: "bhishma_twice" }, text: "Again the words will not come. Bhishma turns his face to the sky and does not ask again." } };

  K.scenes([].concat(
    K.trialScenes({
      id: "a2_trial", next: "a2_ekalavya", tests: TEACHER,
      scene: { act: 2, age: 15, art: "scene_teacher", place: (S) => (S.teacher === "hermit" ? "Mauni's clearing" : S.teacher === "self" ? "A clearing at night" : "Your teacher's school"), caption: "The end of the first year",
        title: "Your teacher's test",
        body: (S) => [S.teacher === "self" ? "A year of teaching yourself. Tonight you find out whether it worked." : "A year of training. Today {teacher} finds out what you have learned.", "If you fail, you will get one more chance. Only one."] },
      retry: { id: "a2_trial_again", letGo: "Let it go. There will be other tests", letText: "You let it go. Your teacher does not mention it, and neither do you.",
        scene: { act: 2, age: 15, art: "scene_teacher", place: (S) => (S.teacher === "hermit" ? "Mauni's clearing" : S.teacher === "self" ? "A clearing at night" : "Your teacher's school"), caption: "The next morning",
          title: "Once more", body: ["You did not sleep. You have one more chance, and you will not be offered a third."] } }
    }),
    // Act III: the great bow, for those who did not go down the tunnel at Varnavata.
    K.trialScenes({
      id: "a3_bow", next: "a3_swayamvara",
      tests: { bow: { t: "Take the great bow", game: "draw", hint: "A test of strength",
        trial: { attr: "might", skill: "archery", verb: "Draw", tally: "Try {n} of {m} · Strung: {w}", help: "Hold to bend the bow. Let go while the bar is in the bright band. Hold too long and the string slips.",
          rules: "The night before the contest, Drupada's bow-masters let young warriors try the great bow in the courtyard, so that no king is shamed tomorrow by an unknown. Three tries; string it twice.",
          stakes: ["You string the great bow, and the kings' men see it.", "The bow wins. The bow-master offers you one more try at first light."] },
        retryStakes: ["You string the great bow, and the kings' men see it.", "The bow beats you again, and the kings' men laugh. It counts as two failures, and it will weigh on every archery test to come."],
        win: { fx: { rep: { panchala: 1, common: 1 }, skill: { archery: 1 }, flag: "strung_great_bow", journal: "You strung the great bow of Panchala the night before Draupadi's swayamvara." }, text: "The bow bends, groans, and the string drops into its notch. The courtyard goes quiet. Tomorrow, the kings will ask who you are." },
        lose: { fx: {}, text: "The bow springs straight and nearly takes your teeth. The bow-master grins. \"First light,\" he says. \"Once more.\"" },
        retryLose: { penalty: 1, fx: { rep: { panchala: -1, common: -1 }, flag: "bow_twice" }, text: "The string slips again. The kings' men laugh, and someone throws you a child's bow." } } },
      scene: { when: (S) => !S.flags.includes("act3_tested"), skipTo: "a3_swayamvara", act: 3, age: 25, art: "scene_swayamvara", place: "Drupada's hall, Panchala", caption: "The night before the contest",
        title: "The great bow",
        body: ["Every warrior in the land has come to Kampilya for the princess's swayamvara. In the courtyard, under torches, the great bow lies on a rack. It is said that only five men alive can string it."] },
      retry: { id: "a3_bow_again", letGo: "Leave the bow to the kings", letText: "You leave the bow on its rack. Tomorrow, the kings can break their backs on it.",
        scene: { act: 3, age: 25, art: "scene_swayamvara", place: "Drupada's hall, Panchala", caption: "First light", title: "First light", body: ["The courtyard is empty except for the bow-master, the bow, and you."] } }
    }),
    // Act IV: Shakuni's hands, in the hall; or a message past the watchmen, for those who stayed away.
    K.trialScenes({
      id: "a4_hands", next: "a4_stakes",
      tests: { watch: { t: "Watch Shakuni's hands", game: "hands", hint: "A test of your eyes",
        win: { fx: { flag: ["watched_hands", "saw_swap"], journal: "In the dice hall you saw Shakuni swap a die from his sleeve." }, text: "One of those throws showed a face no long die has. His sleeve moved before it, and after. You are sure now." },
        lose: { fx: { flag: "watched_hands" }, text: "You watch until your eyes ache. If he did anything, you did not see it. He is about to throw again." },
        retryLose: { penalty: 1, fx: { rep: { kuru: -1 }, flag: "hands_twice" }, text: "You stare so hard that the courtiers nudge each other and laugh. You saw nothing." } } },
      scene: { act: 4, age: 30, art: "scene_dice_throws", place: "The assembly hall, Hastinapura", caption: "Before the stakes",
        title: "Shakuni's hands",
        body: ["Before the real stakes, Shakuni throws a few rounds for nothing, to warm the dice. You are close enough to see his hands.", "If you see a dishonest throw, you will know what is happening here. If you miss it, you will not."] },
      retry: { id: "a4_hands_again", letGo: "Look away", letText: "You look away. Whatever he is doing, you cannot see it.",
        scene: { act: 4, age: 30, art: "scene_dice_throws", place: "The assembly hall, Hastinapura", caption: "Another round", title: "Once more", body: ["Shakuni gathers the dice for another round. You will not get a third look."] } }
    }),
    K.trialScenes({
      id: "a4_message", next: "a4_aftermath",
      tests: { carry: { t: "Carry the message", game: "sneak", hint: "A test of stealth",
        trial: { attr: "grace", skill: "stealth", verb: "Move", help: "Hold to move along the wall. Stop before the torchlight reaches you.", tally: "Messages through: {d} of {n} · Seen: {s} of {m} · {t} seconds", made: "Through. Back for the next.", spotted: "A shout. You run back into the dark.",
          rules: "Vidura's servant finds you. The game is lost, the Pandavas leave for exile at dawn, and Duryodhana's watchmen guard Kunti's door. Carry Vidura's two messages past them unseen.",
          stakes: ["Kunti gets Vidura's words before her sons leave.", "The watchmen turn you back. You may try again before dawn."] },
        retryStakes: ["Kunti gets Vidura's words before her sons leave.", "The watchmen catch you, and Duryodhana hears your name. It counts as two failures, and it will weigh on every stealth test to come."],
        win: { fx: { rep: { pandava: 1 }, bond: { vidura: 1 }, flag: "message_carried", journal: "You carried Vidura's message to Kunti the night the Pandavas went into exile." }, text: "Kunti reads Vidura's words by the last of the lamp, and folds them into her sari." },
        lose: { fx: {}, text: "A torch swings your way and you run. You still have the message. Dawn is a few hours off." },
        retryLose: { penalty: 1, fx: { rep: { kuru: -1, pandava: -1 }, flag: "message_twice" }, text: "A watchman catches your sleeve. You tear free, but he has seen your face, and by morning Duryodhana knows your name." } } },
      scene: { when: (S) => S.flags.includes("absent_dice"), skipTo: "a4_aftermath", act: 4, age: 30, art: "scene_years_remain", place: "Hastinapura", caption: "The night after the dice game",
        title: "Vidura's message", body: ["You stayed away from the hall, but the news reaches you before midnight: everything is lost."] },
      retry: { id: "a4_message_again", letGo: "Give it up", letText: "You burn the message. Kunti never knows what Vidura wanted to tell her.",
        scene: { act: 4, age: 30, art: "scene_years_remain", place: "Hastinapura", caption: "Before dawn", title: "Before dawn", body: ["The sky is going grey. One more try, or none."] } }
    }),
    // Act V: the herds scattered by the raid on Matsya.
    K.trialScenes({
      id: "a5_herd", next: "a5_karna_secret",
      tests: { rope: { t: "Throw your rope", game: "aim", hint: "A test of hand and eye",
        trial: { attr: "grace", skill: "chariot", kind: "stealth", icon: "calf", field: true, verb: "Throw", speed: 1.7,
          rules: "The raid has stampeded Virata's herds toward the river. Ride alongside and throw your rope over the lead cow as she crosses your line. Two throws of three turn the herd.",
          stakes: ["You turn the herd before the ford, and the herders cheer you.", "The herd thunders past. They will slow at the ford, and you may get there first."] },
        retryStakes: ["You turn the herd before the ford, and the herders cheer you.", "The herd goes into the river, and calves drown. It counts as two failures, and it will weigh on every riding test to come."],
        win: { fx: { rep: { common: 1 }, bond: { uttara: 1 }, flag: "turned_herd", journal: "You turned Virata's stampeding herd at the ford." }, text: "The lead cow swings round on your rope, and the herd follows her. The herders cheer you all the way back." },
        lose: { fx: {}, text: "Your rope falls on dust. The herd thunders past toward the ford." },
        retryLose: { penalty: 1, fx: { rep: { common: -1 }, flag: "herd_twice" }, text: "The herd goes into the river. Not all of it comes out. The herders do not look at you." } } },
      scene: { act: 5, age: 43, art: "scene_cattle", place: "King Virata's court, Matsya", caption: "Dust on the river road",
        title: "The herds", body: ["The Kaurava drums have stampeded Virata's cattle. Thousands of them are running for the river."] },
      retry: { id: "a5_herd_again", letGo: "Let the herders deal with it", letText: "You rein in and let the herders try. Some of the herd is saved.",
        scene: { act: 5, age: 43, art: "scene_cattle", place: "King Virata's court, Matsya", caption: "The ford", title: "The ford", body: ["The herd slows at the ford. You cut across the bend and get there first."] } }
    }),
    // Act VI: the wheel on the thirteenth day.
    K.trialScenes({
      id: "a6_wheel", next: "a6_day14", tests: WHEEL,
      scene: { act: 6, age: 44, war: true, art: "scene_day13", place: "Kurukshetra · day 13", caption: "The wheel formation",
        title: "What the wheel asks", body: ["The wheel turns. Everything you have learned comes down to the next few heartbeats."] },
      retry: { id: "a6_wheel_again", letGo: "Fall back", letText: "You fall back with the others. Someone else takes your place.",
        scene: { act: 6, age: 44, war: true, art: "scene_day13", place: "Kurukshetra · day 13", caption: "The second wave", title: "Again", body: ["There is no time to think. Again."] } }
    }),
    // Act VII: Bhishma on the bed of arrows.
    K.trialScenes({
      id: "a7_question", next: "a7_note", tests: { answer: BHISHMA },
      scene: { act: 7, age: 44, art: "scene_teaching", place: "The bed of arrows", caption: "The grandsire's questions",
        title: "Bhishma's questions", body: ["Before he finishes, Bhishma turns his head on the arrows and looks at you. \"You,\" he says. \"Answer me.\""] },
      retry: { id: "a7_question_again", letGo: "Stay silent", letText: "You stay silent. Bhishma does not ask again.",
        scene: { act: 7, age: 44, art: "scene_teaching", place: "The bed of arrows", caption: "The next day", title: "The next day", body: ["Bhishma is still alive. He asks for you."] } }
    }).map((sc) => (sc.id === "a7_question_again" ? Object.assign(sc, { choices: sc.choices.map((c) => (c.id === "answer" ? Object.assign(c, { trial: Object.assign({}, c.trial, { rounds: BHISHMA_AGAIN }) }) : c)) }) : sc))
  ));
})(window.K = window.K || {});
