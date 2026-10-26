/* Act V — The exile years (13-year time skip, ages 31–44). Three roads, then the incognito year. PRD §6. */
(function (K) {
  "use strict";
  // Where your spouse stands when the sides are drawn up, and what it costs to stand elsewhere.
  function spouseView(S) {
    const sp = S.spouse;
    if (!sp || S.dead.includes(sp)) return null;
    if (sp === "madhavi") return { side: "neutral", line: "Madhavi has already packed her herbs. She is going to the healers' tents, whoever wins, and she asks you to come with her." };
    if (sp === "revat") return { side: "pandava", line: "Revat has oiled the chariot axle every night for a week. \"They asked for five villages,\" Revat says. \"Drive for the ones who asked.\"" };
    if (sp === "charu") return S.court === "hastinapura"
      ? { side: "kaurava", line: "Charu says the king whose salt you eat is the king you fight for, and that is the end of it." }
      : { side: "pandava", line: "Charu says that anyone who asks for five villages and is refused should get the whole kingdom, and spits." };
    return null;
  }
  function withSpouse(S, side, fx) {
    const v = spouseView(S);
    if (v && v.side !== side) Object.assign(fx, { bond: { [S.spouse]: -1 }, memory: [S.spouse, "You chose a different side from the one I asked you to."] });
    return fx;
  }
  const forest = { exile: "forest" }, court = { exile: "court" }, own = { exile: "own" };

  K.scenes([
    {
      id: "a5_child", act: 5, age: 31, art: "origin", place: (S) => K.ORIGINS[S.origin].name,
      title: "Vasu",
      body: (S) => [
        S.spouse ? "Your son Vasu was born two years before the dice game. He is three now, and already climbing everything." : "Two years before the dice game you took in a boy whose parents died of fever. His name is Vasu. He is three now, and already climbing everything.",
        "How will you raise him?"
      ],
      choices: [
        { id: "warrior", t: "As a warrior. The world he will grow up in needs them", fx: { set: { child: "vasu" }, setBond: { vasu: 6 }, duty: { family: 1 }, flag: "vasu_warrior", journal: "You raised Vasu to be a warrior." } },
        { id: "gentle", t: "To be kind before he is brave", fx: { set: { child: "vasu" }, setBond: { vasu: 7 }, duty: { family: 1, conscience: 1 }, flag: "vasu_gentle", journal: "You raised Vasu to be kind before he was brave." } },
        { id: "craft", t: "In your own craft, so he can earn a living without a sword", fx: { set: { child: "vasu" }, setBond: { vasu: 6 }, duty: { family: 2 }, flag: "vasu_craft", journal: "You taught Vasu your own craft." } }
      ],
      next: "s_exile"
    },

    // ---------- The forest road ----------
    {
      id: "a5_forest_boon", when: forest, skipTo: "a5_court_raid",
      act: 5, age: 33, place: "An ashram on the upper Ganga", art: "scene_ashram", plate: ["#3e8c72", "#6f8fd8"], caption: "A hermitage in the mountains",
      title: "A season at the ashram",
      body: ["Arjuna has gone north alone to seek divine weapons from the gods. The rest of the camp moves between hermitages. You spend a season at an ashram where the sages will teach anyone patient enough to sit still."],
      choices: [
        { id: "astra", t: "Practise penance and ask for a divine weapon",
          check: { attr: "wisdom", skill: "lore", dc: 8,
            pass: { fx: { boon: "astra", journal: "After a season of penance you were granted a divine weapon." }, text: "On the last night of the season, a voice in the fire gives you a mantra. You will be able to call an astra once in any battle. You will also be responsible for where it lands." },
            fail: { fx: { attr: { wisdom: 1 } }, text: "No weapon comes. But you leave the ashram quieter and clearer than you arrived." } } },
        { id: "heal", t: "Learn from the ashram's healers", fx: { boon: "healing_hands", skill: { healing: 1 }, journal: "The ashram's healers taught you their remedies." } },
        { id: "serve", t: "Serve the sages: carry water, sweep, keep silent", req: { any: [{ flag: "kind_to_sage" }, { rep: ["sages", 5] }] }, locked: "The sages do not know you yet.", fx: { boon: "foresight", rep: { sages: 1 }, journal: "An old sage blessed you with foresight." },
          text: "On the last day, the oldest sage touches your forehead. \"You were kind to one of us once, on a dusty road,\" he says. You never told anyone." },
        { id: "hunt", t: "Hunt for the camp, which is always hungry", fx: { skill: { archery: 1 }, rep: { pandava: 1 }, bond: { bhima: 1 } } }
      ],
      next: "a5_jayadratha"
    },
    {
      id: "a5_jayadratha", when: forest, skipTo: "a5_court_raid",
      act: 5, age: 35, canon: true, place: "The Kamyaka forest", art: "scene_jayadratha", plate: ["#3e8c72", "#c0472f"], caption: "An empty hermitage",
      title: "Jayadratha",
      witness: ["While the Pandavas are out hunting, King Jayadratha of Sindhu, Duryodhana's brother-in-law, finds Draupadi alone at the hermitage and carries her off in his chariot."],
      body: ["You are the first to hear her shout. Jayadratha's guards are covering his escape."],
      choices: [
        { id: "chase", t: "Go after the chariot", combat: "e_jayadratha" },
        { id: "run", t: "Run to find Bhima and Arjuna", fx: { bond: { bhima: 1 }, rep: { pandava: 1 } }, text: "You find them by the river and point the way. Bhima is already running before you finish." },
        { id: "guard", t: "Guard Dhaumya and the hermitage in case they come back", fx: { rep: { sages: 1 } } }
      ],
      after: ["The Pandavas catch Jayadratha. Bhima shaves his head in five tufts as a mark of shame, and Yudhishthira lets him go. Jayadratha goes straight into the mountains to pray for a boon: one day on which he can hold back every Pandava except Arjuna."],
      next: "a5_yaksha"
    },
    {
      id: "a5_yaksha", when: forest, skipTo: "a5_court_raid",
      act: 5, age: 42, canon: true, place: "A lake in the forest", art: "scene_lake", plate: ["#6f8fd8", "#16131f"], caption: "A still lake in the heat",
      title: "The lake of questions",
      witness: [
        "In the twelfth year, the brothers grow desperate with thirst. One by one, Nakula, Sahadeva, Arjuna and Bhima go to a lake, ignore a voice that tells them to answer its questions first, drink, and fall down as if dead.",
        "Yudhishthira comes last, and agrees to answer."
      ],
      body: ["You came with Bhima. Your own throat is cracked with thirst, and the water is right there."],
      choices: [
        { id: "drink", t: "Drink. You cannot think for thirst", fx: { attr: { might: -1 } }, text: "Darkness, and then you are lying on the bank in the evening, alive, with a strange heaviness in your limbs that never quite leaves." },
        { id: "listen", t: "Wait, and listen to the questions", fx: { attr: { wisdom: 1 }, journal: "At the lake you heard the questions. What is faster than the wind? The mind. What is the greatest wonder? That every day people die, and the living act as if they never will." },
          text: "What is faster than the wind? The mind. What is more numerous than the grass? Thoughts. What is the greatest wonder? That every day people die, and the living act as if they never will. You remember every answer for the rest of your life." }
      ],
      after: ["Pleased with Yudhishthira's answers, the voice gives back his brothers' lives. It was Dharma himself, testing his son."],
      next: "a5_charu"
    },

    // ---------- The court road ----------
    {
      id: "a5_court_raid", when: court, skipTo: "a5_own_life",
      act: 5, age: 33, canon: true, place: "The edge of the Dvaita forest", art: "scene_cattle", plate: ["#d4a84b", "#3e8c72"], caption: "Royal tents near the forest",
      title: "The cattle count",
      witness: ["Duryodhana takes his court to the forest, saying it is to count the royal herds. Everyone knows it is to show off in front of the exiled Pandavas. A band of Gandharvas, forest warriors who serve no king, ambushes the royal camp. Karna's line breaks."],
      body: ["Duryodhana is being dragged off in chains."],
      choices: [
        { id: "fight", t: "Fight the Gandharvas", combat: "e_gandharva" },
        { id: "pandavas", t: "Run to the Pandavas' camp for help", fx: { rep: { pandava: 1 }, bond: { yudhishthira: 1, duryodhana: -1 } }, text: "Yudhishthira hears you out and sends Arjuna and Bhima at once. \"He is still our cousin,\" he says." },
        { id: "flee", t: "Get out with the rest of the court", tags: ["retreat"], fx: { duty: { court: -1 } } }
      ],
      after: ["Arjuna and Bhima free Duryodhana on Yudhishthira's orders. Rescued by his enemies, Duryodhana tries to starve himself to death from shame. His friends talk him out of it, and he comes home hating the Pandavas more than ever."],
      next: "a5_court_armour"
    },
    {
      id: "a5_court_armour", when: court, skipTo: "a5_own_life",
      act: 5, age: 38, canon: true, place: "The river at dawn", art: "scene_armour", plate: ["#e5872e", "#6f8fd8"], caption: "Karna at his morning prayers",
      title: "Karna's armour",
      witness: ["Karna was born with armour and earrings that make him almost impossible to kill. Every morning after his prayers to the sun, he gives anyone whatever they ask. One morning an old brahmin asks for the armour. Everyone says it is Indra, Arjuna's father, in disguise."],
      body: (S) => [S.bonds.karna >= 6 ? { memory: "You have known Karna for most of your life. You know he already knows." } : "You are at the river with the morning crowd."],
      choices: [
        { id: "warn", t: "Push through and warn Karna it is a trick", fx: { bond: { karna: 2 }, memory: ["karna", "You tried to save his armour."] },
          text: "\"I know who he is,\" Karna says quietly. \"I gave my word to give what is asked.\" He cuts the armour from his own body, and the brahmin gives him a spear in return that can kill anyone, once." },
        { id: "watch", t: "Watch in silence", fx: {} },
        { id: "astra", t: "Ask {teacher} to teach you the weapon you were promised", req: { teacher: ["drona", "kripa"], duty: ["teacher", 5] }, locked: "Your teacher must think you have earned it.", fx: { boon: "astra", duty: { teacher: 1 }, journal: "{teacher} taught you to call a divine weapon." },
          text: "{teacher} looks at you for a long time, then teaches you the mantra in a whisper. \"Never against someone who cannot fight back,\" he says." }
      ],
      next: "a5_charu"
    },

    // ---------- Your own road ----------
    {
      id: "a5_own_life", when: own, skipTo: "a5_charu",
      act: 5, age: 33, art: "origin", place: (S) => K.ORIGINS[S.origin].name,
      title: "A life of your own",
      body: (S) => [
        "Far from the courts, the years are your own. Vasu grows. Your hair starts to grey.",
        S.flags.includes("debt_refused") ? { memory: "Sudatta the moneylender has been patient. Now his men have fenced off your family's field." } : null,
        "How do you make your living?"
      ],
      choices: [
        { id: "trade", t: "Trade along the rivers", fx: { skill: { statecraft: 1 }, attr: { command: 1 } } },
        { id: "heal", t: "Open a healer's house", fx: { skill: { healing: 2 }, rep: { common: 1 } } },
        { id: "teach", t: "Teach the village children to fight", fx: { skill: { [ "mace" ]: 1 }, attr: { might: 1 }, rep: { common: 1 } } },
        { id: "sudatta", t: "Take your field back from Sudatta's men", req: { flag: "debt_refused" }, combat: "e_sudatta" }
      ],
      next: "a5_own_crisis"
    },
    {
      id: "a5_own_crisis", when: own, skipTo: "a5_charu",
      act: 5, age: 38, art: "origin", place: (S) => K.ORIGINS[S.origin].name,
      title: "The fever year",
      body: ["A fever comes up the river in the dry season. Half the village is sick, the granary is low, and the nearest king is busy with his own troubles."],
      choices: [
        { id: "tend", t: "Tend the sick yourself",
          check: { attr: "wisdom", skill: "healing", dc: 8,
            pass: { fx: { rep: { common: 3 }, duty: { conscience: 1 }, journal: "You nursed your village through the fever year." }, text: "You lose eleven people. Without you it would have been many more." },
            fail: { fx: { rep: { common: 1 } }, text: "You do everything you can. The fever takes its own count." } } },
        { id: "grain", t: "Ride to the next kingdom and come back with grain", fx: { skill: { chariot: 1 }, rep: { common: 2 } } },
        { id: "mauni", t: "Go into the forest to find Mauni, your old teacher", req: { teacher: "hermit", noFlag: "betrayed_hermit" }, locked: "", fx: { boon: "astra", rep: { common: 1 }, journal: "Mauni gave you medicine for the village, and a divine weapon for what was coming." },
          text: "Mauni is older, and just as silent. He gives you a bundle of roots for the fever, and then, before you leave, a mantra. \"You kept my secret,\" he says. \"Keep this one too.\"" }
      ],
      next: "a5_charu"
    },

    // ---------- A bond that asks something of you ----------
    {
      id: "a5_charu", when: (S) => (S.friend === "charu" || S.spouse === "charu") && !S.dead.includes("charu"), skipTo: "s_late",
      act: 5, art: "scene_smith", place: (S) => K.childPlace(S), caption: "A forge at dawn",
      title: "The old smith",
      body: (S) => [
        "A boy brings word from home. Old Kesava, Charu's father, the smith who first put a hammer in your hands, is dying.",
        S.spouse === "charu" ? "Charu is already packing, and does not ask whether you will come. Charu never asks." : "Charu has not sent for you. Charu never asks for anything."
      ],
      choices: [
        { id: "go", t: "Go home and sit with Charu until the end", fx: { bond: { charu: 2 }, duty: { family: 1 }, flag: "sat_with_kesava", memory: ["charu", "You came home when my father was dying."] },
          text: "Old Kesava knows you at once. On his last morning he puts his hammer in your hands and says nothing at all. Charu holds the lamp." },
        { id: "send", t: "Send word that you cannot leave", fx: { bond: { charu: -2 }, memory: ["charu", "You did not come when my father died."] },
          text: "Charu's answer comes back with the same boy, one line long. \"I know.\"" }
      ],
      next: "s_late"
    },

    // ---------- Everyone: the incognito year ----------
    {
      id: "a5_matsya", act: 5, age: 43, canon: true, art: "scene_virata", place: "King Virata's court, Matsya", caption: "The lake country of Matsya",
      title: "The hidden year",
      witness: [
        "For the thirteenth year the Pandavas must live unrecognised. They take service at King Virata's court: Yudhishthira as a dice master, Bhima as a cook, Arjuna as Brihannala, a teacher of dance, Draupadi as a queen's maid.",
        "When the king's commander Kichaka will not leave Draupadi alone, Bhima kills him one night in the dancing hall.",
        "With Kichaka dead, the Kauravas raid Matsya's cattle. Young Prince Uttara rides out to stop them, with the dance teacher Brihannala as his charioteer."
      ],
      body: (S) => [S.origin === "matsya" ? { memory: "This is your home. Those are your neighbours' herds." } : "You are in Matsya when the raid comes."],
      choices: [
        { id: "defend", t: "Ride out with Prince Uttara to save the herds", combat: "e_cattle" },
        { id: "raid", t: "Ride with the Kaurava raiders", req: { any: [{ court: "hastinapura" }, { exile: "court" }] }, combat: "e_cattle_k" },
        { id: "secret", t: "Recognise Brihannala, and keep the secret",
          check: { attr: "wisdom", skill: "stealth", dc: 8,
            pass: { fx: { bond: { arjuna: 2 }, flag: "kept_arjuna_secret", journal: "You recognised Arjuna in Matsya and kept his secret." }, text: "You know that walk, even in bangles. When your eyes meet, Arjuna puts a finger to his lips. You say nothing to anyone." },
            fail: { fx: {}, text: "Brihannala is just a dance teacher to you. Later you will feel a fool." } } },
        { id: "stay", t: "Stay out of it", fx: {} }
      ],
      after: ["Brihannala is Arjuna. He takes up his bow Gandiva, defeats the whole Kaurava force alone and drives them home. The thirteen years are over. Arjuna's son Abhimanyu marries Virata's daughter Uttara."],
      next: "a5_karna_secret"
    },
    {
      id: "a5_karna_secret", when: { any: [{ flag: "left_arena" }, { bond: ["karna", 7] }] }, skipTo: "a5_side",
      act: 5, age: 44, canon: true, place: "The river at dusk", art: "scene_birth", plate: ["#e5872e", "#16131f"], caption: "The river where a basket once floated",
      title: "The secret of Karna's birth",
      witness: [
        "Krishna meets Karna before the war and tells him the truth: he is Kunti's firstborn son, born before her marriage, set adrift on the river. He is the eldest Pandava. If he changes sides, he will be king.",
        "Karna refuses. Duryodhana stood by him when no one else would, and he will not leave him now."
      ],
      body: (S) => [
        S.flags.includes("left_arena") ? { memory: "You have known about the basket on the river since you were seventeen. Karna never knew you knew." } : { memory: "Karna tells you all of it that night. He has not told anyone else." }
      ],
      choices: [
        { id: "tell", t: "Tell Karna you have always known, and that it changes nothing for you", req: { flag: "left_arena" }, fx: { bond: { karna: 2 }, memory: ["karna", "You knew who he was all along, and stayed his friend."] },
          text: "Karna laughs, for the first time in weeks. \"Then you are the only one in the world who has not changed their mind about me today.\"" },
        { id: "urge", t: "Urge him to take the crown and stop the war", fx: { bond: { karna: -1 }, duty: { conscience: 1 } }, text: "\"And be remembered as the man who betrayed his only friend for a throne?\" he says. \"No.\"" },
        { id: "stand", t: "Tell him you will stand with him, whatever he decides", fx: { bond: { karna: 2 }, flag: "pledged_to_karna" } }
      ],
      after: ["Kunti comes to Karna at the river and asks him herself. He promises her she will still have five sons when the war ends: he will kill no Pandava except Arjuna."],
      next: "a5_side"
    },
    {
      id: "a5_side", act: 5, age: 44, canon: true, art: "scene_envoy", place: "Hastinapura", caption: "Thirteen years, gone",
      title: "Not a needle's point",
      witness: [
        "The Pandavas ask for their kingdom back. When that is refused, they ask for five villages. Krishna goes to Hastinapura himself to plead for peace.",
        "Duryodhana says he will not give them as much land as the point of a needle can cover. Both sides gather their armies at Kurukshetra."
      ],
      body: (S) => [
        S.teacher === "balarama" ? { memory: "Balarama has gone on pilgrimage rather than fight. He asked you to do the same." } : null,
        S.child === "vasu" && !S.dead.includes("vasu") ? "Vasu is sixteen. He will follow wherever you go." : null,
        spouseView(S) ? { memory: spouseView(S).line } : null,
        "This is the most important decision of your life."
      ],
      choices: [
        { id: "pandava", t: "Fight for the Pandavas", fx: (S) => withSpouse(S, "pandava", { set: { side: "pandava" }, rep: { pandava: 2 }, duty: { court: S.court === "hastinapura" ? -4 : 1, teacher: S.teacher === "balarama" ? -4 : 0 }, journal: "You chose to fight for the Pandavas." }) },
        { id: "kaurava", t: "Fight for the Kuru throne under Duryodhana", fx: (S) => withSpouse(S, "kaurava", { set: { side: "kaurava" }, rep: { kuru: 2 }, duty: { court: S.court === "indraprastha" ? -4 : 1, teacher: S.teacher === "balarama" ? -4 : 0 }, journal: "You chose to fight for Duryodhana and the Kuru throne." }) },
        { id: "neither", t: "Refuse to fight. Serve in the healers' tents, which take in both sides", fx: (S) => withSpouse(S, "neutral", { set: { side: "neutral" }, rep: { sages: 2, common: 1 }, skill: { healing: 1 }, journal: "You refused to fight, and went to serve in the healers' tents." }) },
        // A secret you hold can be spent. This one cannot change the story, and the story makes sure of it.
        { id: "secret", t: "Go to Arjuna and tell him who Karna really is", req: (S) => (S.flags.includes("left_arena") || S.seen.includes("a5_karna_secret")) && !S.flags.includes("tried_secret"),
          fx: { flag: "tried_secret", bond: { krishna: 1 }, memory: ["krishna", "You nearly told Arjuna the truth about Karna. Krishna asked you not to."], journal: "You set out to tell Arjuna the truth about Karna. Krishna stopped you on the road." },
          text: "Krishna is waiting on the road to Arjuna's tent, as if he knew you would come. \"Not from you,\" he says gently. \"If Arjuna learns it now, he will never lift his bow against his brother, and Karna has already chosen. Let him keep his choice.\" He holds your eyes until you nod.",
          hint: "A secret you could spend", next: "a5_side" }
      ],
      next: "a6_eve"
    }
  ]);

  K.encounter({
    id: "e_jayadratha", title: "After Jayadratha's chariot", art: "scene_jayadratha", caption: "Sindhu guards on the forest road", lethal: false,
    intro: "Two of Jayadratha's guards turn their horses to block the path.",
    enemies: [K.foe("Sindhu guard", 3), K.foe("Sindhu archer", 2, { abilities: ["strike", "arrows"] })],
    win: { fx: { rep: { pandava: 2 }, bond: { draupadi: 1, bhima: 1 }, journal: "You cut through Jayadratha's rearguard when he carried Draupadi off." }, text: "The guards break. Ahead, you can hear Bhima roaring." },
    lose: { fx: { injury: "scar" }, text: "They leave you in the dust. Bhima runs past you without stopping." }
  });
  K.encounter({
    id: "e_gandharva", title: "The Gandharva ambush", art: "scene_cattle", caption: "Forest warriors in the royal camp", lethal: false,
    enemies: [K.foe("Gandharva warrior", 3), K.foe("Gandharva warrior", 2)],
    win: { fx: { bond: { duryodhana: 2 }, rep: { kuru: 1 } }, text: "You hold your corner of the camp, but Duryodhana has already been carried off." },
    lose: { fx: { bond: { duryodhana: 1 } }, text: "They knock you down and leave you. At least you stayed." }
  });
  K.encounter({
    id: "e_sudatta", title: "Sudatta's men", art: "battle_field", caption: "A fence across your family's field", lethal: false,
    enemies: [K.foe("A hired club-man", 2), K.foe("A hired club-man", 1)],
    win: { fx: { unflag: "debt_refused", flag: "field_reclaimed", rep: { common: 1 }, duty: { family: 1 } }, text: "Sudatta's men leave and do not come back. The village brings sweets." },
    lose: { fx: { duty: { family: -1 } }, text: "They keep the field. You keep your pride, more or less." }
  });
  K.encounter({
    id: "e_cattle", title: "The cattle raid on Matsya", art: "battle_cattle", caption: "Dust over the grazing grounds", lethal: false,
    enemies: [K.foe("Kaurava horseman", 3), K.foe("Kaurava archer", 2, { abilities: ["strike", "arrows"] })],
    win: { fx: { rep: { pandava: 2, common: 1 }, bond: { arjuna: 1 }, journal: "You fought beside Prince Uttara when the Kauravas raided Matsya." }, text: "The raiders on your flank turn back. Ahead, one chariot is driving the whole Kaurava army before it." },
    lose: { fx: {}, text: "You are unhorsed. From the ground you watch one chariot drive the whole Kaurava army before it." }
  });
  K.encounter({
    id: "e_cattle_k", title: "Raiding Matsya's herds", art: "battle_cattle", caption: "A lone chariot comes for you", lethal: false,
    intro: "Matsya's cowherds fight harder than anyone expected. Then the arrows start coming from a single chariot.",
    enemies: [K.foe("Matsya cowherd", 2), { name: "Brihannala's chariot", hp: 140, atk: 12, def: 4, abilities: ["strike", "arrows"] }],
    win: { fx: { rep: { kuru: 1 } }, text: "Somehow you hold. Around you the rest of the army is running." },
    lose: { fx: { rep: { kuru: 1 }, journal: "At Matsya you were routed, with the whole Kaurava army, by a single chariot." }, text: "Like everyone else, you wake up in the grass, unhurt and stripped of your upper cloth, while the chariot drives away with the herds." }
  });
})(window.K = window.K || {});
