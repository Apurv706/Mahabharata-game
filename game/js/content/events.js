/* Chance events. Five places in each life hold an event slot; at the first visit one of its events
   is drawn, or nothing happens (about one time in three), so no two lives meet the same small things.
   A slot is named like a scene: other scenes point their `next` at it (flow.js K.slot). */
(function (K) {
  "use strict";
  K.slot("s_child", { pool: ["ev_snake", "ev_bard"], then: "a1_poison" });
  K.slot("s_youth", { pool: ["ev_horses", "ev_deer"], then: "a2_spar" });
  K.slot("s_court", { pool: ["ev_lamps", "ev_flood"], then: "a3_rajasuya" });
  K.slot("s_exile", { pool: ["ev_riddle", "ev_bandits"], then: "a5_forest_boon" });
  K.slot("s_late", { pool: ["ev_teacher", "ev_letter"], then: "a5_matsya" });

  K.scenes([
    // ---------- Childhood ----------
    {
      id: "ev_snake", act: 1, art: "ev_snake", place: (S) => K.childPlace(S), caption: "The well-house at noon",
      title: "A cobra in the well-house",
      body: ["A cobra has made its home in the well-house, and the women will not go for water. Your grandmother says a cobra in the house is a guest of the gods. Your uncle has found a stick."],
      choices: [
        { id: "milk", t: "Lure it out with a bowl of milk and lead it to the fields",
          check: { attr: "grace", skill: "stealth", dc: 6,
            pass: { fx: { rep: { common: 1 }, attr: { grace: 1 }, flag: "led_the_cobra" }, text: "It drinks, and considers you for a long moment, and flows away into the millet. The women sing your name at the well for a week." },
            fail: { fx: {}, text: "It rears and spreads its hood. You drop the bowl and run. Your uncle uses the stick." } } },
        { id: "charmer", t: "Run to the next village for the snake-charmer", fx: { duty: { family: 1 }, skill: { lore: 1 } },
          text: "It takes all day. He charges a copper, sings it into a basket, and lets it go in the forest. On the way home he teaches you the song." },
        { id: "stick", t: "Hand your uncle the stick", fx: { attr: { might: 1 }, duty: { conscience: -1 } },
          text: "It is quick. Your grandmother does not speak to either of you until the next full moon." }
      ],
      next: "a1_poison"
    },
    {
      id: "ev_bard", act: 1, art: "ev_bard", place: (S) => K.childPlace(S), caption: "Under the village banyan",
      title: "A bard under the banyan",
      body: ["A wandering suta sets up under the village banyan with a veena and a voice like a river. Tonight he sings of the churning of the ocean, when gods and demons pulled a serpent back and forth for a thousand years."],
      choices: [
        { id: "listen", t: "Sit at his feet until the last verse", fx: { skill: { lore: 1 }, flag: "loved_stories" },
          text: "You fall asleep before the nectar rises out of the sea. You dream of it for years." },
        { id: "learn", t: "Ask him to teach you a verse of your own",
          check: { attr: "wisdom", skill: "lore", dc: 6,
            pass: { fx: { skill: { lore: 1 }, attr: { wisdom: 1 } }, text: "He teaches you one verse, and the trick of remembering a hundred more by hanging each one on a door of a house you know." },
            fail: { fx: {}, text: "He laughs, kindly. \"Come back when your voice breaks.\"" } } },
        { id: "pockets", t: "Pick the pockets of his audience while they listen", fx: { skill: { stealth: 1 }, duty: { conscience: -1 }, rep: { common: -1 } },
          text: "You come home with three coppers and a ring. The bard saw you. He said nothing, and sang a little louder." }
      ],
      next: "a1_poison"
    },

    // ---------- Youth ----------
    {
      id: "ev_horses", act: 2, art: "ev_horses", place: "The horse fair by the river road", caption: "Northern horses at the river road",
      title: "The grey mare",
      body: ["Horse-traders have come down the river road with forty northern horses. One grey mare lets no one near her. The traders want her gone before she kills someone."],
      choices: [
        { id: "gentle", t: "Try to gentle the grey mare",
          check: { attr: "grace", skill: "chariot", dc: 7,
            pass: { fx: { skill: { chariot: 1 }, rep: { common: 1 }, flag: "grey_mare", journal: "At the horse fair you gentled a grey mare no one else could touch." }, text: "It takes a whole day of standing still. By evening she eats from your hand. The traders sell her to you for the price of a meal, which is a joke and a compliment at once." },
            fail: { fx: {}, text: "She throws you into the fence. The traders help you up, and tell you better riders than you have tried." } } },
        { id: "haggle", t: "Haggle for a sound horse for your family", fx: { skill: { statecraft: 1 }, duty: { family: 1 } },
          text: "You beat the price down by a third and come home leading a bay gelding with kind eyes. Your father pretends not to be impressed." },
        { id: "watch", t: "Watch how the traders lie", fx: { attr: { wisdom: 1 } },
          text: "Every trader lies differently. By evening you can tell who is lying about what, and you wish you could not." }
      ],
      next: "a2_spar"
    },
    {
      id: "ev_deer", act: 2, art: "ev_deer", place: "The forest", caption: "A clearing in the forest",
      title: "The wounded doe",
      body: [
        "In the forest you find a doe with an arrow in her flank, still breathing. Behind you, a hunting party is crashing through the brush. A prince's party, by the sound of the horns.",
        { aside: "You think of King Pandu, who shot a deer in the forest and was cursed for it." }
      ],
      choices: [
        { id: "bind", t: "Draw out the arrow and bind the wound",
          check: { attr: "wisdom", skill: "healing", dc: 7,
            pass: { fx: { skill: { healing: 1 }, rep: { sages: 1 }, flag: "saved_doe" }, text: "She lies still under your hands, then stands, and is gone. An old woman gathering wood saw it all. She says the forest will remember." },
            fail: { fx: { duty: { conscience: 1 } }, text: "You do what you can. She dies with her head in your lap." } } },
        { id: "hide", t: "Hide her trail from the hunters", fx: { skill: { stealth: 1 }, rep: { kuru: -1 } },
          text: "You drag a branch across the blood. The horns go past, and fade." },
        { id: "call", t: "Call the hunters to her. It is their kill", fx: { rep: { kuru: 1 }, duty: { court: 1 } },
          text: "A young lord thanks you, and tosses you a coin, and does not look at the deer." }
      ],
      next: "a2_spar"
    },

    // ---------- Young adult ----------
    {
      id: "ev_lamps", act: 3, art: "ev_lamps", place: "The city, on the new-moon night", caption: "Lamps on every wall",
      title: "The night of lamps",
      body: ["On the new-moon night of Kartika the whole city sets out lamps, in rows along every wall and step. You have a hundred clay lamps and a little oil."],
      choices: [
        { id: "river", t: "Float them down the river for your family's dead", fx: { duty: { family: 1 }, attr: { wisdom: 1 } },
          text: "The river carries some of them a long way. You watch until the last one goes out." },
        { id: "potters", t: "Give your oil to the potters' lane, which has none", fx: { rep: { common: 2 }, duty: { conscience: 1 } },
          text: "The potters' lane is the brightest in the city that night. Nobody knows why, except the potters." },
        { id: "dice", t: "Spend the night at dice in the palace courtyard, as the nobles do", fx: { rep: { kuru: 1 }, skill: { statecraft: 1 }, flag: "gambled_lamps" },
          text: "You lose a little and win a little, and learn who at court owes what to whom. It is the custom, they tell you: the gods play dice on this night too." }
      ],
      next: "a3_rajasuya"
    },
    {
      id: "ev_flood", act: 3, art: "ev_flood", place: (S) => K.ORIGINS[S.origin].name, caption: "The river over its banks",
      title: "The river rises",
      body: ["The rains come late and then all at once. In the night the river comes over its banks, and the low quarter of the town is under water to the rooftops."],
      choices: [
        { id: "boat", t: "Take a boat into the low quarter",
          check: { attr: "might", skill: "chariot", dc: 7,
            pass: { fx: { rep: { common: 2 }, duty: { conscience: 1 }, flag: "flood_boat", journal: "In the flood year you rowed the low quarter out of the water." }, text: "You make eleven trips. On the last the boat goes over, and you swim a child to the temple roof on your back." },
            fail: { fx: { injury: "scar" }, text: "The current takes the boat on the first trip and a beam opens your arm. Someone else pulls you out." } } },
        { id: "organise", t: "Get the high town to open its doors", fx: { skill: { statecraft: 1 }, attr: { command: 1 }, rep: { common: 1 } },
          text: "You go from house to house until every family on the hill has taken in a family from the river." },
        { id: "grain", t: "Save your family's grain first", fx: { duty: { family: 2 }, rep: { common: -1 } },
          text: "Your family eats well that winter. Your neighbours notice." }
      ],
      next: "a3_rajasuya"
    },

    // ---------- The exile years ----------
    {
      id: "ev_riddle", act: 5, art: "ev_riddle", place: "A road in the dry season", caption: "An ascetic by the road",
      title: "The ascetic's riddle",
      body: [
        "An ascetic sits by the road with his eyes closed, as he has for days. As you pass he speaks without opening them.",
        { speaker: "The ascetic", line: "Answer me, and I will give you what you need. What, once given, can never be taken back?" }
      ],
      choices: [
        { id: "word", t: "\"Your word\"", fx: { rep: { sages: 1 }, attr: { wisdom: 1 }, item: { herbs: 2 } },
          text: "He opens his eyes. \"Yes,\" he says, and gives you two bundles of roots. \"For the war,\" he says. \"You will need them.\"" },
        { id: "gift", t: "\"A gift\"", fx: {}, text: "\"A gift can be taken back,\" he says. \"Ask any king.\" He closes his eyes again." },
        { id: "life", t: "\"A life\"", fx: { flag: "riddle_life" }, text: "\"Lives are given back all the time,\" he says. \"Ask the river.\" He closes his eyes again, and smiles." },
        { id: "walk", t: "Walk on. You have no time for riddles", fx: {} }
      ],
      next: "a5_forest_boon"
    },
    {
      id: "ev_bandits", act: 5, art: "ev_bandits", place: "Where the road narrows", caption: "Five men in the trees",
      title: "Bandits on the road",
      body: ["Five men step out of the trees where the road narrows. They are thin, and their weapons are farm tools. The one in front is shaking."],
      choices: [
        { id: "fight", t: "Draw your weapon", combat: "e_bandits" },
        { id: "feed", t: "Give them the food you carry", fx: { duty: { conscience: 2 } },
          text: "The one in front weeps. Their village is two days east. The king's men took its grain, for the war everyone says is coming." },
        { id: "hire", t: "Talk them into working for you instead",
          check: { attr: "command", skill: "statecraft", dc: 8,
            pass: { fx: { rep: { common: 2 }, attr: { command: 1 }, flag: "hired_bandits", journal: "On the road you turned five starving bandits into the most loyal workers you ever had." }, text: "They have nothing to lose. A year later they are the most loyal people you know." },
            fail: { fx: { item: { herbs: -1 } }, text: "They laugh. Then they rob you anyway, slowly and politely." } } }
      ],
      next: "a5_forest_boon"
    },
    {
      id: "ev_teacher", act: 5, when: (S) => S.teacher && S.teacher !== "self", skipTo: "a5_matsya",
      art: "ev_teacher", place: "Your teacher's house", caption: "A lamp by a sickbed",
      title: "Your teacher is ill",
      body: ["Word comes that {teacher} is ill and asking for students. The fever is in the chest. The physicians are not hopeful."],
      choices: [
        { id: "go", t: "Go at once and nurse {teacher} yourself", fx: { duty: { teacher: 2 }, skill: { healing: 1 } },
          text: "You sit up through eleven nights. On the twelfth the fever breaks, and {teacher} looks at you and says, \"Still here?\" That is all. It is enough." },
        { id: "send", t: "Send the best physician you can find", fx: { duty: { teacher: 1 } },
          text: "The physician comes back with a message: thank you, and come yourself next time." },
        { id: "stay", t: "You cannot leave. Send your regrets", fx: { duty: { teacher: -1 } } }
      ],
      next: "a5_matsya"
    },
    {
      id: "ev_letter", act: 5, art: "ev_letter", place: (S) => K.ORIGINS[S.origin].name, caption: "A palm-leaf letter",
      title: "A letter from home",
      body: (S) => [
        S.flags.includes("moved_capital") ? "Your parents went back to {origin} when your father's working years were done." : null,
        "A palm-leaf letter comes from {origin}, in your mother's hand, which has grown shaky. Your father is old now. The roof needs mending. When are you coming home?",
        !S.kin ? null
          : K.kinElder(S) ? { memory: ["She writes that {kin} died in the cold season, still asking after you.", { kin: S.kin }] }
          : S.kinRole === "mother" ? { memory: "At the bottom, in a hand that shakes more than it used to, she asks you to come before she is too old to know your face." }
          : { memory: ["At the bottom, in another hand you know at once: {kin} asks to see you before {kin} is too old to know your face.", { kin: S.kin }] }],
      choices: [
        { id: "go", t: "Go home for the rains", fx: { duty: { family: 2, court: -1 } },
          text: "The roof gets mended. Your father tells the same three stories every night. You do not mind." },
        { id: "write", t: "Send money and a long letter", fx: { duty: { family: 1 } } },
        { id: "here", t: "Write back that your place is here now", fx: { duty: { family: -1, court: 1 } } }
      ],
      next: "a5_matsya"
    }
  ]);

  K.encounter({
    id: "e_bandits", title: "Bandits on the road", art: "ev_bandits", caption: "Farm tools against your weapon", lethal: false,
    intro: "They come at you all at once, badly.",
    enemies: [K.foe("Hungry bandit", 2, { hp: 24 }), K.foe("Hungry bandit", 1, { hp: 20 })],
    win: { fx: { rep: { common: -1 } }, text: "They scatter into the trees. The last one to run is no older than sixteen." },
    lose: { fx: { item: { herbs: -1 } }, text: "They take your purse and your sandals, and apologise." }
  });
})(window.K = window.K || {});
