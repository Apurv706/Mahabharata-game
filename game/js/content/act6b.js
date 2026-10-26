/* Act VI — The war, part 2: day 14 to the night raid. PRD §10. */
(function (K) {
  "use strict";
  const fighting = { side: ["pandava", "kaurava"] };
  const war = K.warEncounter;
  const vasuAt = (S, where) => S.child === "vasu" && !S.dead.includes("vasu") && S.flags.includes(where);

  K.scenes([
    {
      id: "a6_day14", act: 6, age: 44, canon: true, war: true, art: "war_day14", place: "Kurukshetra · day 14", caption: "A sun that seems to set early",
      title: "Sunset and torches",
      witness: [
        "All day Arjuna cuts his way toward Jayadratha, who is hidden deep behind the Kaurava lines. Near evening the sky darkens as if the sun has set. Jayadratha steps out to watch Arjuna fail. The sun is still up, and Arjuna's arrow finds him.",
        "The fighting does not stop at dusk. For the first time, the armies fight on by torchlight. To save the Pandavas from Karna, Bhima's son Ghatotkacha fights through the dark until Karna is forced to spend the one spear that could have killed Arjuna."
      ],
      body: (S) => [S.side === "neutral" ? "The tents are lit with torches all night." : "Your company is ordered forward into the dark."],
      choices: [
        { id: "road", t: "Clear the road for Arjuna's chariot", req: { side: "pandava" }, combat: "e_road" },
        { id: "jaya", t: "Guard the ground in front of Jayadratha", req: { side: "kaurava" }, combat: "e_jaya" },
        { id: "torches", t: "Fight on in the night battle", req: fighting, combat: "e_night" },
        { id: "light", t: "Carry torches for the healers searching the field", fx: { rep: { common: 1 }, duty: { conscience: 1 } }, text: "You find a boy from your own country under a dead horse, and drag him out alive." }
      ],
      next: "a6_day15"
    },
    {
      id: "a6_day15", act: 6, age: 44, canon: true, war: true, art: "war_day15", place: "Kurukshetra · day 15", caption: "An elephant named Ashwatthama",
      title: "Ashwatthama is dead",
      witness: [
        "Drona cannot be beaten while he holds his bow. Bhima kills an elephant named Ashwatthama, the same name as Drona's son, and shouts that Ashwatthama is dead.",
        "Drona does not believe it. He asks Yudhishthira, who has never told a lie. Yudhishthira says, \"Ashwatthama is dead,\" and then, under his breath, \"the elephant.\" Drona lays down his weapons, and Dhrishtadyumna kills him where he sits."
      ],
      body: (S) => [
        S.teacher === "drona" ? { memory: "Drona taught you everything you know." } : null,
        S.side === "pandava" ? "Bhima is shouting it, and he wants everyone else shouting it too." : S.side === "kaurava" ? "The rumour races down your line toward Drona's chariot." : "Even in the tents, people are repeating it."
      ],
      choices: [
        { id: "spread", t: "Shout it along the line: Ashwatthama is dead", req: { side: "pandava" }, tags: ["lie"],
          fx: (S) => ({ flag: "spread_the_lie", duty: { teacher: S.teacher === "drona" ? -4 : 0, conscience: -2 }, rep: { pandava: 1 }, journal: "On the fifteenth day you helped spread the half-truth that killed Drona." }) },
        { id: "refuse", t: "Refuse to repeat it", req: { side: "pandava" }, fx: { duty: { conscience: 1 }, flag: "refused_lie" } },
        { id: "warn", t: "Ride to Drona and tell him his son is alive", req: { any: [{ side: "kaurava" }, { teacher: "drona" }] },
          fx: (S) => ({ duty: { teacher: S.teacher === "drona" ? 3 : 1, court: S.side === "pandava" ? -3 : 1 }, memory: ["drona", "You rode to tell him the truth."], journal: "On the fifteenth day you tried to tell Drona his son was alive." }),
          text: "You reach his chariot and shout it. He looks past you, toward Yudhishthira, the one man he trusts not to lie. He does not hear you." },
        { id: "tend", t: "Stay with the wounded", fx: { rep: { common: 1 } } }
      ],
      after: ["When it is over, Ashwatthama hears how his father died. He swears by everything he knows that the Pandavas will pay."],
      next: "a6_day16"
    },
    {
      id: "a6_day16", act: 6, age: 44, canon: true, war: true, art: "war_day16", place: "Kurukshetra · day 16", caption: "Karna takes command",
      title: "Bhima's vow",
      witness: ["Karna takes command of the Kaurava army. On the sixteenth day, Bhima finds Dushasana on the field and fulfils the terrible vow he made in the dice hall, thirteen years ago."],
      body: (S) => [S.flags.includes("enemy_dushasana") ? { memory: "Dushasana never forgot your face from the dice hall. Before Bhima finds him, his men find you." } : "The fighting is fiercer than it has ever been."],
      choices: [
        { id: "ambush", t: "Fight Dushasana's men", req: { flag: "enemy_dushasana" }, combat: "e_dushasana" },
        { id: "fight", t: "Fight in the line", req: { side: ["pandava", "kaurava"], noFlag: "enemy_dushasana" }, combat: "e_day16" },
        { id: "tend", t: "Stay with the wounded", req: { noFlag: "enemy_dushasana" }, fx: { rep: { common: 1 } } }
      ],
      next: "a6_day17"
    },
    {
      id: "a6_day17", act: 6, age: 44, canon: true, war: true, art: "war_day17", place: "Kurukshetra · day 17", caption: "A chariot wheel sinks into the earth",
      title: "Karna",
      enter: (S) => (K.hasVow("vengeance") && S.flags.includes("vengeance_dice") ? { vowRelease: "vengeance", flag: "vengeance_answered", journal: "Your vow of vengeance for the dice hall was answered by Bhima's hand." } : null),
      witness: [
        "Arjuna and Karna meet at last. In the middle of the duel, Karna's chariot wheel sinks into the earth, as a brahmin once cursed it would. He reaches for the mantra of his greatest weapon, and it is gone from his mind, as his teacher Parashurama once cursed it would be.",
        "He climbs down to lift the wheel and asks Arjuna to wait, as the rules of war demand."
      ],
      body: (S) => [
        S.bonds.karna >= 6 ? { memory: S.flags.includes("met_karna_young") ? "You have known Karna since you were children." : "You have known Karna since the day in the arena." } : null,
        K.hasVow("spare_karna") ? { aside: "You swore never to raise a weapon against Karna." } : null,
        S.side === "kaurava" ? "Your chariot is the nearest to his." : S.side === "pandava" ? "You are close enough to see his face." : "You are close enough to see his face."
      ],
      choices: [
        { id: "shoot", t: "Loose an arrow at Karna while he lifts the wheel", req: { side: "pandava" }, tags: ["strike_karna", "strike_unarmed"], fx: { duty: { conscience: -2 }, bond: { arjuna: 1, karna: -3 }, flag: "shot_karna", journal: "On the seventeenth day you shot at Karna while he was lifting his chariot wheel." } },
        { id: "call", t: "Shout to Arjuna to wait until Karna is armed", req: { side: "pandava" }, fx: { duty: { conscience: 2 }, bond: { arjuna: -1, karna: 1 }, memory: ["karna", "You called out for a fair fight."] } },
        { id: "wheel", t: "Jump down and help Karna lift the wheel", req: { side: "kaurava" },
          check: { attr: "might", skill: "chariot", dc: 9,
            pass: { fx: { bond: { karna: 2 }, flag: "lifted_wheel" }, text: "The wheel moves. It moves too slowly." },
            fail: { fx: { bond: { karna: 1 } }, text: "The earth will not give it back." } } },
        { id: "stand", t: "Stand over Karna and fight to the end", req: { side: "kaurava" }, fx: { die: true, flag: "died_with_karna", deathText: "You fell beside Karna on the seventeenth day, standing over him as the wheel sank.", bond: { karna: 3 } }, hint: "You will not survive this" },
        { id: "home", t: "Pull back while you can. Vasu is waiting", req: (S) => S.side === "kaurava" && S.child === "vasu" && !S.dead.includes("vasu"), tags: ["retreat"], fx: { duty: { family: 2 }, flag: "left_karna" } },
        { id: "watch", t: "Watch, and remember", fx: { flag: "watched_karna" } }
      ],
      after: (S) => [
        "Arjuna's arrow takes Karna's life. People say a light left his body and rose into the sun.",
        S.bonds.karna >= 7 ? { memory: "His last look was for the sky, not for you. You tell yourself that is all right." } : null,
        "Only after the war does Kunti tell her sons that Karna was their eldest brother."
      ],
      next: "a6_day18"
    },
    {
      id: "a6_day18", act: 6, age: 44, canon: true, war: true, art: "war_day18", place: "Kurukshetra · day 18", caption: "The last day",
      title: "The last day",
      witness: [
        "Shalya leads what is left of the Kaurava army and falls to Yudhishthira. Sahadeva kills Shakuni, who started all of this with a pair of dice.",
        "Duryodhana, alone, hides in a lake. The Pandavas find him and he comes out to fight Bhima with the mace. Bhima strikes him on the thigh, below the waist, against every rule of mace fighting. Balarama, who taught them both, has to be held back from striking Bhima."
      ],
      body: ["It is the last day. Survival is not certain."],
      choices: [
        { id: "fight", t: "Fight in the last battle", req: fighting, combat: "e_day18" },
        { id: "lake", t: "Go to the lake to witness the duel", fx: { flag: "saw_duel" } },
        { id: "tend", t: "Stay with the wounded", fx: { rep: { common: 1 } } }
      ],
      next: "a6_duryodhana"
    },
    {
      id: "a6_duryodhana", when: { any: [{ friend: "duryodhana" }, { bond: ["duryodhana", 7] }] }, skipTo: "a6_raid",
      act: 6, age: 44, war: true, place: "The lakeside at dusk", art: "scene_duryodhana", plate: ["#5c3361", "#2a1c1f"], caption: "A broken king by the water",
      title: "Duryodhana at the lake",
      body: ["Duryodhana lies where Bhima left him, his thigh shattered. He is waiting to die. He sees you, and for a moment he looks like the boy at the lotus pond."],
      choices: [
        { id: "comfort", t: "Sit with him, and talk about when you were young", fx: { bond: { duryodhana: 2 }, memory: ["duryodhana", "You sat with him at the end."], journal: "You sat with Duryodhana by the lake as he lay dying." } },
        { id: "truth", t: "Tell him what he did to all of you", fx: { duty: { conscience: 2 }, bond: { duryodhana: -2 } }, text: "\"I lived as a king,\" he says. \"I am dying as one. Which of them can say that?\"" },
        { id: "leave", t: "Leave him to the night", fx: {} }
      ],
      after: ["Before midnight, Ashwatthama comes to the lake. Duryodhana makes him commander of an army of three: Ashwatthama, Kripa and Kritavarma."],
      next: "a6_raid"
    },
    {
      id: "a6_raid", act: 6, age: 44, canon: true, war: true, place: "The Pandava camp, the night after the last day", art: "scene_raid", plate: ["#c0472f", "#16131f"], caption: "Fire in the sleeping camp",
      title: "The night raid",
      witness: ["The war is over. The Pandava camp sleeps for the first time in eighteen days. Ashwatthama, mad with grief for his father, comes through the gate in the dark with a sword."],
      body: (S) => [
        S.side === "kaurava" ? "Ashwatthama finds you before he goes. He wants one more sword." : "You wake to screaming.",
        S.boons.includes("foresight") && S.side !== "kaurava" ? { memory: "Your foresight woke you a moment before the first scream." } : null,
        S.side !== "kaurava" && (vasuAt(S, "vasu_in_camp") || vasuAt(S, "vasu_with_you")) ? { memory: "Vasu is sleeping three tents away." } : null
      ],
      choices: [
        { id: "vasu", t: "Run to Vasu's tent", req: (S) => S.side !== "kaurava" && (vasuAt(S, "vasu_in_camp") || vasuAt(S, "vasu_with_you")),
          fx: { flag: "saved_vasu_raid", bond: { vasu: 2 }, duty: { family: 2 }, journal: "On the night of the raid you got Vasu out of the burning camp." }, text: "You drag him out under the back of the tent, into the dark, and you do not stop running until the fire is a glow behind you." },
        { id: "wake", t: "Wake the camp", req: { not: { side: "kaurava" } },
          check: { attr: "command", skill: "statecraft", dc: 8, bonus: (S) => (S.boons.includes("foresight") ? 2 : 0),
            pass: { fx: { rep: { pandava: 2, common: 2 }, flag: "woke_camp", journal: "On the night of the raid your shouting woke enough of the camp to save many lives." }, text: "Your voice carries. Tents empty into the dark. Many who should have died that night live." },
            fail: { resolve: null, fx: { flag: "raid_failed_wake" }, text: "The smoke takes your voice. Too few hear you." } } },
        { id: "gate", t: "Fight Ashwatthama at the gate", req: { not: { side: "kaurava" } }, combat: "e_raid" },
        { id: "join", t: "Go with Ashwatthama into the sleeping camp", req: { side: "kaurava" }, tags: ["strike_unarmed"],
          fx: { duty: { conscience: -5 }, rep: { sages: -3, common: -2 }, flag: "joined_raid", journal: "You went into the sleeping Pandava camp with Ashwatthama." } },
        { id: "refuse", t: "Refuse him", req: { side: "kaurava" }, fx: { duty: { conscience: 2 }, flag: "refused_raid" }, text: "\"Then go home,\" he says, \"and live with that.\"" },
        { id: "stop", t: "Try to stop him", req: { side: "kaurava" }, combat: "e_ash" }
      ],
      after: (S) => [
        "Ashwatthama kills Dhrishtadyumna, Shikhandi and all five of Draupadi's sons in their sleep, and sets the camp on fire. Of the eighteen armies, a handful of people are left alive.",
        S.side !== "kaurava" && S.child === "vasu" && !S.dead.includes("vasu") && (S.flags.includes("vasu_in_camp") || S.flags.includes("vasu_with_you")) && !S.flags.includes("saved_vasu_raid") && !S.flags.includes("woke_camp")
          ? { curse: "You find Vasu at dawn, in what is left of his tent." } : null
      ],
      next: "a7_field"
    }
  ]);

  const foeSide = (S) => (S.side === "kaurava" ? "Pandava" : "Kaurava");
  war("e_road", "The road to Jayadratha", [K.foe("Kaurava chariot-warrior", 5, { art: "war_day14", abilities: ["strike", "heavy", "arrows"] }), K.foe("Kaurava horseman", 4)], {
    caption: "Day fourteen",
    win: { fx: { bond: { arjuna: 2 }, rep: { pandava: 2 } }, text: "You break a hole in the line, and Arjuna's chariot goes through it like water." },
    lose: { deathText: "You fell on the fourteenth day, clearing the road for Arjuna." },
    flee: { text: "You fall back from the road." }, spare: { fx: { duty: { conscience: 1 } }, text: "You let him go." }
  });
  war("e_jaya", "Guarding Jayadratha", [K.foe("Pandava chariot-warrior", 5, { art: "war_day14", abilities: ["strike", "heavy", "arrows"] }), K.foe("Pandava footsoldier", 4)], {
    caption: "Day fourteen",
    win: { fx: { rep: { kuru: 2 } }, text: "You hold your ground all afternoon. It does not matter. The sun is still up." },
    lose: { deathText: "You fell on the fourteenth day, guarding Jayadratha." },
    flee: { text: "You fall back toward Jayadratha's hiding place." }, spare: { fx: { duty: { conscience: 1 } }, text: "You let him go." }
  });
  war("e_night", "The night battle", (S) => [K.foe(foeSide(S) + " torch-bearer", 4), K.foe(foeSide(S) + " archer", 4, { art: "war_day14", abilities: ["strike", "arrows"] })], {
    caption: "Torchlight on the field",
    win: { fx: { journal: "You survived the night battle of the fourteenth day." }, text: "Dawn comes. You are still alive, and you cannot remember most of the night." },
    lose: { deathText: "You fell in the dark on the night of the fourteenth day." },
    flee: { text: "You fall back into the dark." }, spare: { fx: { duty: { conscience: 1 } }, text: "You let him go into the dark." }
  });
  war("e_dushasana", "Dushasana's men", [K.foe("Dushasana's bodyguard", 5, { art: "war_day16", abilities: ["strike", "heavy"] }), K.foe("Dushasana's bodyguard", 4)], {
    caption: "Day sixteen",
    win: { fx: { flag: "survived_dushasana", journal: "On the sixteenth day Dushasana sent his men for you, and you survived them." }, text: "His men lie in the dust. Across the field, Bhima has found Dushasana." },
    lose: { deathText: "On the sixteenth day, Dushasana's men found you. He had not forgotten the dice hall." },
    flee: { text: "You escape them in the press of the battle." }, spare: { fx: { duty: { conscience: 1 } }, text: "You let the last of them go." }
  });
  war("e_day16", "The sixteenth day", (S) => [K.foe(foeSide(S) + " chariot-warrior", 5, { art: "war_day16", abilities: ["strike", "arrows"] }), K.foe(foeSide(S) + " spearman", 4)], {
    caption: "Day sixteen",
    win: { fx: { rep: { common: 1 } }, text: "You survive another day." },
    lose: { deathText: "You fell on the sixteenth day." },
    flee: { text: "You fall back." }, spare: { fx: { duty: { conscience: 1 } }, text: "You let him go." }
  });
  war("e_day18", "The last battle", (S) => [K.foe(foeSide(S) + " veteran", 5, { art: "war_day18", abilities: ["strike", "heavy"] }), K.foe(foeSide(S) + " chariot-warrior", 5, { abilities: ["strike", "arrows"] })], {
    caption: "Day eighteen",
    win: { fx: { journal: "You survived the eighteenth and last day of the war." }, text: "There is no one left to fight." },
    lose: { deathText: "You fell on the eighteenth day, the last day of the war." },
    flee: { text: "You fall back, for the last time." }, spare: { fx: { duty: { conscience: 1 } }, text: "You let him go. The war is nearly over." }
  });
  war("e_raid", "Ashwatthama at the gate", [{ name: "Ashwatthama", hp: 115, atk: 12, def: 3, abilities: ["strike", "heavy", "arrows"] }], { art: "scene_raid",
    caption: "Fire in the camp", allies: [], spare: false,
    win: { fx: { rep: { pandava: 2 }, flag: "slowed_ashwatthama", journal: "You fought Ashwatthama at the gate of the burning camp, and lived." }, text: "He breaks away from you and vanishes into the smoke. You held him for long enough that some got out." },
    lose: { deathText: "You died at the gate of the Pandava camp, fighting Ashwatthama in the dark." },
    flee: { text: "You run, like everyone else." }
  });
  war("e_ash", "Standing in Ashwatthama's way", [{ name: "Ashwatthama", hp: 115, atk: 12, def: 3, abilities: ["strike", "heavy", "arrows"] }], { art: "scene_raid",
    caption: "The road to the sleeping camp", allies: [], spare: false,
    win: { fx: { duty: { conscience: 3 }, flag: "fought_ashwatthama", journal: "You tried to stop Ashwatthama on the road to the sleeping camp." }, text: "He staggers, and then goes around you. You cannot stop him. You slowed him down." },
    lose: { deathText: "You died on the road, trying to stop Ashwatthama from reaching the sleeping camp." },
    flee: { text: "You let him go." }
  });
})(window.K = window.K || {});
