/* Act IV — The fracture: the dice game, played as one long scene in several beats. PRD §6, §12.
   Draupadi's humiliation is shown through the hall's reaction, never lingered on. The dice never
   involve the player's money or any paid randomness (PRD §13). */
(function (K) {
  "use strict";
  K.scenes([
    {
      id: "a4_invite", act: 4, age: 30, canon: true, art: "scene_dice_hall", place: "Hastinapura", caption: "The new assembly hall",
      title: "An invitation to dice",
      witness: [
        "Dhritarashtra builds a new assembly hall and invites Yudhishthira to a friendly game of dice. Vidura carries the invitation, and his face says what his words cannot.",
        "Yudhishthira accepts. A king does not refuse a challenge."
      ],
      body: (S) => [
        S.flags.includes("knows_dice_plot") ? { memory: "You heard Shakuni plan this game. You know he cannot lose." } : null,
        "You are thirty. Half the kingdom will be in that hall. Will you?"
      ],
      choices: [
        { id: "warn", t: "Warn Yudhishthira that Shakuni's dice cannot lose", req: { flag: "knows_dice_plot" }, fx: { bond: { yudhishthira: 1 }, rep: { pandava: 1 }, flag: "warned_yudhishthira" },
          text: "He thanks you, and takes your hand, and goes anyway. \"If I am called, I must play,\" he says." },
        { id: "go", t: "Go to the hall", fx: { flag: "at_dice" }, next: "a4_hands" },
        { id: "stay", t: "Stay away. You want no part of it", fx: { flag: "absent_dice", journal: "You stayed away from the dice game." }, next: "a4_message" }
      ],
      next: "a4_stakes"
    },
    {
      id: "a4_stakes", act: 4, age: 30, canon: true, art: "scene_dice_throws", place: "The assembly hall, Hastinapura", caption: "The first throws",
      title: "The stakes",
      witness: [
        "Shakuni throws for Duryodhana. Yudhishthira stakes his jewels and loses. Then his gold, his chariots, his servants, his army and his kingdom. Every throw goes the same way.",
        "Then he stakes his brothers, one by one, and loses them. Then he stakes himself, and loses.",
        "Bhishma, Drona and Kripa sit very still. Dhritarashtra keeps asking who has won."
      ],
      body: ["You are standing among the courtiers by the pillars."],
      choices: [
        { id: "cheat", t: "Call out that Shakuni's dice are false",
          check: { attr: "wisdom", skill: "stealth", dc: 8, bonus: (S) => (S.flags.includes("saw_swap") ? 3 : 0),
            pass: { fx: { rep: { pandava: 1, kuru: -2 }, flag: "spoke_dice" }, text: "You have watched Shakuni's hands, and you say exactly what they are doing. Shakuni smiles. Nobody stops the game, but Vidura looks at you as if marking your face for later." },
            fail: { fx: { rep: { kuru: -2 }, flag: "spoke_dice" }, text: "You shout, and the hall turns to look at you. Shakuni asks, very kindly, whether you would like to inspect the dice yourself. People laugh." } } },
        { id: "bhishma", t: "Beg Bhishma to stop the game", fx: { duty: { conscience: 1 }, bond: { bhishma: 1 } }, text: "Bhishma looks at his hands. \"The way of dharma is subtle,\" he says, and says nothing more." },
        { id: "silent", t: "Stay silent. It is the king's game", fx: { duty: { court: 1, conscience: -1 }, flag: "silent_dice" } },
        { id: "leave", t: "Leave the hall now", fx: { flag: "left_dice", duty: { conscience: -1 }, journal: "You walked out of the dice game before the worst of it." }, next: "a4_aftermath" }
      ],
      next: "a4_draupadi"
    },
    {
      id: "a4_draupadi", act: 4, age: 30, canon: true, art: "scene_dice_question", place: "The assembly hall, Hastinapura", caption: "The question no one answers",
      title: "Draupadi's question",
      lamp: { secs: 35, silent: "silent", note: "The hall is waiting. If the lamp burns out before you act, you will have said nothing." },
      witness: [
        "Yudhishthira stakes Draupadi, and loses her. Duryodhana sends for her as a slave. She sends back a question: did he lose me before or after he lost himself?",
        "Dushasana drags her into the hall by her hair. She stands before the elders and asks again. No one answers her.",
        "Then Vikarna, one of Duryodhana's own brothers, stands up: a man who has lost himself has nothing left to stake. The hall shouts him down."
      ],
      body: (S) => [
        S.friend === "duryodhana" ? { memory: "Duryodhana is your oldest friend. He is laughing." } : null,
        "Everyone in this hall will be remembered for what they did now."
      ],
      choices: [
        { id: "answer", t: "Stand beside Vikarna and answer her question out loud",
          fx: { duty: { conscience: 3, court: -2 }, rep: { pandava: 2, kuru: -2 }, bond: { draupadi: 2, yudhishthira: 1, dushasana: -4 }, flag: ["objected_dice", "enemy_dushasana"], memory: ["dushasana", "You spoke against him in the hall."], journal: "In the dice hall you answered Draupadi's question out loud. Dushasana marked you." },
          hint: "The Pandavas will trust you. Dushasana will not forget" },
        { id: "between", t: "Step between Dushasana and Draupadi",
          check: { attr: "might", skill: "mace", dc: 9,
            pass: { fx: { duty: { conscience: 3, court: -3 }, rep: { pandava: 3, kuru: -3 }, bond: { draupadi: 2, bhima: 2, dushasana: -5 }, flag: ["stood_between", "enemy_dushasana"], journal: "You held Dushasana's wrist in the dice hall, for one breath, before the guards pulled you off." }, text: "You catch Dushasana's wrist and hold it for one long breath before the guards drag you back. The hall saw it." },
            fail: { fx: { duty: { conscience: 2 }, rep: { kuru: -2 }, bond: { dushasana: -3 }, injury: "scar", flag: "enemy_dushasana" }, text: "Dushasana's guards throw you to the floor before you reach him. You taste blood on the marble." } } },
        { id: "friend", t: "Beg Duryodhana, as his oldest friend, to stop this", req: { friend: "duryodhana" }, fx: { bond: { duryodhana: -2 }, duty: { conscience: 2 }, memory: ["duryodhana", "You begged him to stop, in front of everyone."] },
          text: "He looks at you as if he has never seen you before." },
        { id: "silent", t: "Say nothing", fx: { duty: { conscience: -2, court: 1 }, flag: "silent_draupadi", memory: ["draupadi", "You were in the hall, and you said nothing."] } },
        { id: "leave", t: "Leave the hall. You cannot watch this", fx: { duty: { conscience: -1 }, flag: "left_dice" }, next: "a4_aftermath" }
      ],
      next: "a4_robe"
    },
    {
      id: "a4_robe", act: 4, age: 30, canon: true, art: "scene_dice_cloth", place: "The assembly hall, Hastinapura", caption: "The cloth that does not end",
      title: "The cloth that does not end",
      witness: [
        "Karna, who has not forgotten the swayamvara, says she is a slave now and may be treated like one. Duryodhana bares his thigh to her.",
        "Dushasana takes hold of her garment and pulls. It does not end. However hard he pulls, there is more cloth, until he falls back exhausted on a heap of it.",
        "Bhima rises and swears, before everyone, that he will break Duryodhana's thigh and drink Dushasana's blood on the battlefield."
      ],
      body: ["Outside, jackals are howling in daylight. The old king is afraid."],
      choices: [
        { id: "vow", t: "Swear your own vow that this will be answered", req: { vowSlot: true }, locked: "You already hold three vows.", fx: { vowTake: "vengeance", flag: "vengeance_dice", bond: { bhima: 1 } } },
        { id: "karna", t: "Tell Karna he is better than this", req: { bond: ["karna", 5] }, fx: { bond: { karna: -1 }, duty: { conscience: 1 }, memory: ["karna", "You told him he was better than what he said in the hall."] },
          text: "Karna does not look at you. His jaw is tight. Later you will wonder whether he agreed." },
        { id: "remember", t: "Remember every face in the hall, and what each one did", fx: { skill: { lore: 1 }, flag: "remembered_hall", journal: "You memorised every face in the dice hall: who spoke, who laughed, who looked away." } },
        { id: "away", t: "Look at the floor until it is over", fx: { duty: { conscience: -1 } } }
      ],
      after: [
        "Frightened by the omens, Dhritarashtra offers Draupadi boons. She asks only for her husbands' freedom, and their weapons.",
        "Then Yudhishthira is called back for one more game. The loser will go into exile for twelve years, and a thirteenth year in hiding. He loses."
      ],
      next: "a4_aftermath"
    },
    {
      id: "a4_aftermath", act: 4, age: 30, canon: true, place: "The road out of Hastinapura", art: "scene_exile", plate: ["#5c3361", "#16131f"], caption: "The Pandavas walk into exile",
      title: "Thirteen years",
      witness: [
        "The Pandavas walk out of Hastinapura in deerskins, with Draupadi beside them, her hair still unbound. Kunti stays behind with Vidura.",
        "The city watches in silence. Everyone knows that when the thirteen years end, there will be war."
      ],
      body: (S) => [
        S.flags.includes("absent_dice") || S.flags.includes("left_dice") ? "You hear the story secondhand, and it changes with every telling." : "You saw it all. You will see it every night for years.",
        "What will you do with the next thirteen years?"
      ],
      choices: [
        { id: "forest", t: "Follow the Pandavas into the forest", fx: { set: { exile: "forest" }, rep: { pandava: 2, kuru: -1 }, duty: { court: -2 }, journal: "You followed the Pandavas into exile." } },
        { id: "court", t: "Stay at Hastinapura and watch Duryodhana rule", fx: { set: { exile: "court" }, rep: { kuru: 1 }, duty: { court: 1 }, journal: "You stayed at the Kuru court through the exile years." } },
        { id: "own", t: "Go home, make your fortune and raise a family", fx: { set: { exile: "own" }, duty: { family: 2 }, journal: "You went home to make your own life." } }
      ],
      next: "a5_child"
    }
  ]);
})(window.K = window.K || {});
