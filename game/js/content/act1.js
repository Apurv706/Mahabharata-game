/* Act I — Childhood (ages 6–14). PRD §6. */
(function (K) {
  "use strict";
  const homeLine = {
    hastinapura: "Your father keeps the palace stores. You learn early that everyone in the palace is listening.",
    panchala: "Your mother makes arrows for the king's archers. In Panchala, people say a good arrow matters more than a good name.",
    matsya: "Your family keeps horses on the lake shore. Visitors from the big kingdoms rarely come this far.",
    mathura: "Your uncle trades up and down the Yamuna. Mathura smells of river mud and cardamom, everyone argues about everything, and everyone lowers their voice when they speak of King Kamsa.",
    anga: "Your family serves in the Anga guard. Anga pays tribute to the Kuru throne, and its guard goes wherever the Kuru king sends it.",
    suta: "Your father drives chariots for the Kuru nobles. He tells you to keep your eyes down and your hands steady.",
    nishada: "Your village fishes the river and hunts the forest. City people call you Nishada as if it were an insult.",
    gandhara: "Your family serves in the household of King Subala, high in the mountains. Everyone still talks about his daughter Gandhari, who married the blind Kuru king and bound her own eyes so as never to see more than he could."
  };

  // Why a family from a far land comes to live near the Kuru capital.
  const journeyLine = {
    gandhara: "When you are seven, word comes down from Hastinapura: Queen Gandhari wants people from home around her. Your family packs everything it owns and joins the long caravan east, out of the mountains, across the Indus and the five rivers. It takes two months.",
    mathura: "Your uncle is sent to Hastinapura with a Yadava embassy. Kunti, the mother of the Pandavas, was born a Yadava, and while Kamsa rules at home the clans want friends at the Kuru court. Your family goes with him, and stays.",
    matsya: "The Kuru royal stables need horses, and your family breeds the best in Matsya. Your father takes the work of keeping the king's horses, and the whole family moves east to the stable quarter outside Hastinapura.",
    anga: "Your father's company of the Anga guard is posted to Hastinapura, where the Kuru king keeps soldiers from every land that pays him tribute. You ride the whole month up the Ganga in a baggage cart.",
    panchala: "The Kuru armoury has sent for Panchala arrowsmiths, whatever the two kings think of each other. Your mother takes the work, and your family moves into the craft quarter of Hastinapura.",
    nishada: "The princes' tutors need guides for the royal hunts, and nobody knows the forest like your father. Your family moves to the forest's edge outside Hastinapura, close enough to hear the palace drums."
  };
  // Where the childhood that follows happens: near the capital for families who moved there.
  K.childPlace = (S) => (S.flags.includes("moved_capital") ? (S.origin === "nishada" ? "The forest's edge outside Hastinapura" : "Hastinapura") : K.ORIGINS[S.origin].name);
  // Where you live as an adult: the court you joined in act 3, otherwise where you grew up.
  K.homePlace = (S) => { const c = S.act >= 3 && S.court && S.court !== "none" && K.COURTS[S.court]; return c ? c.name : K.childPlace(S); };
  K.childArt = (S) => (S.flags.includes("moved_capital") && S.origin !== "nishada" ? "home_hastinapura" : "home_" + S.origin);

  // ---------- Act I's action tests ----------
  // A friendship has to be earned: each prince sets a test. Fail it (or come close) and Charu stays
  // your friend, with one more chance at the spring fair. Fail that too and it costs you.
  const FRIENDS = {
    arjuna: {
      game: "aim", hint: "An archery test",
      trial: { attr: "aim", skill: "archery", dark: true, icon: "lamp",
        rules: "Arjuna has hung a lamp from a branch and set it swinging in the dark. \"I shoot at the flame,\" he says. \"You try.\" Three arrows: release as the flame crosses your line. Two hits win his friendship.",
        stakes: ["Arjuna becomes your closest friend.", "Charu stays your closest friend, and Arjuna remembers you missed. You will get one more chance."] },
      retryStakes: ["Arjuna becomes your closest friend.", "Arjuna gives up on you. It counts as two failures, and it will weigh on every archery test to come."],
      win: { fx: { set: { friend: "arjuna" }, bond: { arjuna: 3 }, setBond: { charu: 4 }, flag: "hit_the_lamp", memory: ["arjuna", "You hit his swinging lamp in the dark when you were ten."], journal: "Arjuna became your closest friend. You earned it with a bow." },
        text: "Arjuna looks at the flame, then at you. \"Again tomorrow,\" he says. \"And the day after.\" From then on, you practise together." },
      close: { fx: { set: { friend: "charu" }, setBond: { charu: 7 }, bond: { arjuna: 2 }, flag: "second_arjuna" },
        text: "One arrow finds the flame. \"Not bad,\" Arjuna says, and means it, but he goes back to his practice alone. Charu is waiting for you at the gate." },
      lose: { fx: { set: { friend: "charu" }, setBond: { charu: 7 }, bond: { arjuna: 1 }, flag: "second_arjuna" },
        text: "Three arrows vanish into the dark. Arjuna laughs, not unkindly, and shows you how to hold the bow. Charu is waiting for you at the gate." },
      retryLose: { penalty: 1, fx: { bond: { arjuna: -2 }, flag: "missed_lamp_twice", memory: ["arjuna", "You missed his lamp twice. He stopped offering."] },
        text: "You miss again, in front of the whole fair. Arjuna lowers his bow and turns back to the lamp. He does not offer again." },
      line: "At the spring fair there is an archery stall: a lamp on a cord, swinging in the shade of an awning. Arjuna is there. He sees you, and holds out his bow."
    },
    bhima: {
      game: "push", hint: "A wrestling test",
      trial: { attr: "might", skill: "mace", foe: "Bhima",
        rules: "Bhima wants to wrestle in the river shallows. A ring closes as he shifts his weight: push just as it meets the mark. Three good pushes and he goes into the water. Three slips and you do.",
        stakes: ["Bhima becomes your closest friend.", "Charu stays your closest friend, and Bhima laughs about it for a week. You will get one more chance."] },
      retryStakes: ["Bhima becomes your closest friend.", "Bhima stops taking you seriously. It counts as two failures, and it will weigh on every wrestling test to come."],
      win: { fx: { set: { friend: "bhima" }, bond: { bhima: 3 }, setBond: { charu: 4 }, flag: "threw_bhima", memory: ["bhima", "You put him in the river when you were ten. He has never stopped telling people."], journal: "Bhima became your closest friend. You put him in the river to earn it." },
        text: "Bhima comes up spluttering and roaring with laughter. \"Again!\" he shouts, and from that day you are hardly ever apart." },
      lose: { fx: { set: { friend: "charu" }, setBond: { charu: 7 }, bond: { bhima: 1 }, flag: "second_bhima" },
        text: "You go into the river three times. Bhima hauls you out each time, delighted. \"Grow a little,\" he says, \"and come back.\" Charu is waiting on the bank with a dry cloth." },
      retryLose: { penalty: 1, fx: { bond: { bhima: -2 }, flag: "thrown_by_bhima_twice", memory: ["bhima", "He threw you in the river twice. He calls you \"little fish\" now."] },
        text: "Into the river again, in front of the whole fair. Bhima pats your head and calls you \"little fish\". The name sticks for years." },
      line: "At the spring fair Bhima is wrestling all comers in the river shallows. He sees you on the bank and grins. \"Bigger now?\""
    },
    duryo: {
      game: "retort", hint: "A test of nerve",
      trial: { attr: "command", skill: "statecraft",
        rules: "Duryodhana's brothers circle you by the lotus pond to see what you are made of. He is watching. Answer each taunt before the lamp burns down. Two good answers win his respect.",
        stakes: ["Duryodhana becomes your closest friend.", "Charu stays your closest friend, and the brothers remember you backed down. You will get one more chance."],
        rounds: [
          { line: "\"Who let this one into the gardens? Did the stables send us a present?\"", replies: ["\"The prince asked me here. Did he ask for you?\"", "\"I am sorry. I will go.\"", "\"Better the stables than your father's kitchen.\""] },
          { line: "Dushasana plants his foot on yours and leans. \"Say please, and I will move.\"", replies: ["\"I can stand here as long as you can.\"", "\"Please.\"", "Shove him into the pond."] },
          { line: "Duryodhana speaks at last. \"They say you are nobody. Are they right?\"", replies: ["\"Today, yes. Ask me again in ten years.\"", "\"I am whatever you want me to be, prince.\"", "\"They are fools, and so are you for listening to them.\""] }
        ] },
      retryStakes: ["Duryodhana becomes your closest friend.", "The brothers will never let you forget it. It counts as two failures, and it will weigh on every test of statecraft to come."],
      win: { fx: { set: { friend: "duryodhana" }, bond: { duryodhana: 3 }, setBond: { charu: 4 }, flag: "stood_your_ground", memory: ["duryodhana", "You stood your ground in front of his brothers when you were ten."], journal: "Duryodhana became your closest friend. You stood your ground to earn it." },
        text: "Duryodhana laughs and throws an arm around your shoulders. \"This one is mine,\" he tells his brothers. Nobody argues." },
      lose: { fx: { set: { friend: "charu" }, setBond: { charu: 7 }, flag: "second_duryo" },
        text: "The brothers laugh you out of the garden. Duryodhana does not laugh. He simply looks away, which is worse. Charu walks you home." },
      retryLose: { penalty: 1, fx: { bond: { duryodhana: -2 }, rep: { kuru: -1 }, flag: "backed_down_twice", memory: ["duryodhana", "You backed down in front of his brothers twice."] },
        text: "Again the words will not come. Dushasana tells the story at every feast for a year, and the court laughs with him." },
      line: "At the spring fair Duryodhana's brothers find you again by the sweet stalls. Duryodhana is with them. \"Well?\" he says. \"Have you grown a tongue?\""
    },
    karna: {
      game: "steady", hint: "A test of a steady hand",
      trial: { attr: "grace", skill: "chariot",
        rules: "A festival drum has maddened one of the chariot horses, and Karna is trying to hold it. \"Help me,\" he says. Keep your hand over the glow until the horse is calm.",
        stakes: ["Karna becomes your closest friend.", "Charu stays your closest friend, and Karna has to manage alone. You will get one more chance."] },
      retryStakes: ["Karna becomes your closest friend.", "Karna stops asking. It counts as two failures, and it will weigh on every chariot test to come."],
      win: { fx: { set: { friend: "karna" }, bond: { karna: 3 }, setBond: { charu: 4 }, flag: "calmed_the_horse", memory: ["karna", "You calmed a maddened horse beside him when you were ten."], journal: "Karna became your closest friend. You calmed a horse together to earn it." },
        text: "The horse drops its head into your hands. Karna lets out a long breath. \"You have the touch,\" he says. \"Most people only have the whip.\"" },
      lose: { fx: { set: { friend: "charu" }, setBond: { charu: 7 }, bond: { karna: 1 }, flag: "second_karna" },
        text: "The horse tears free, and Karna is dragged half across the yard before he catches it again. He is not angry, only alone with it. Charu walks you home." },
      retryLose: { penalty: 1, fx: { bond: { karna: -2 }, flag: "horse_beat_you_twice", memory: ["karna", "Twice he asked for your help with a horse, and twice it beat you."] },
        text: "The stallion throws you into the straw. Karna gets it in hand alone, as he always has, and does not ask you again." },
      line: "At the spring fair a horse-dealer's grey stallion has thrown two grooms. Karna is holding its rope, and losing. He sees you. \"Once more?\""
    }
  };
  const friendTest = (k, retry) => {
    const f = FRIENDS[k];
    return { game: f.game, hint: f.hint, trial: Object.assign({}, f.trial, retry ? { stakes: f.retryStakes } : {}), win: f.win,
      close: retry ? f.retryLose : f.close || f.lose, lose: retry ? f.retryLose : f.lose };
  };
  const SECOND = { arjuna: "second_arjuna", bhima: "second_bhima", duryo: "second_duryo", karna: "second_karna" };
  const UGRA_WIN = { fx: { rep: { common: 1 }, bond: { charu: 1 }, flag: ["beat_ugra", "balarama_noticed"], journal: "You beat Ugra in the ring at the spring fair. A giant of a man with a plough on his shoulder asked your name." },
    text: "Ugra hits the sand, and the crowd roars. He lets go of Charu and leaves the ring without a word. At the edge of the crowd a giant of a man with a plough on his shoulder asks your name." };
  const ugraTrial = (retry) => ({ attr: "might", skill: "mace", foe: "Ugra",
    rules: "Ugra fights the fair way: falls in the ring. A ring closes as he shifts his weight. Push just as it meets the mark.",
    stakes: retry ? ["Ugra lets Charu go, in front of everyone.", "Ugra wins twice. It counts as two failures, the crowd will not forget it, and it will weigh on every wrestling test to come."]
      : ["Ugra lets Charu go, in front of everyone.", "Ugra keeps his grip on Charu. You can get up and ask for another bout."] });

  K.scenes([
    {
      id: "a1_home", act: 1, age: 6, art: "origin", place: (S) => K.ORIGINS[S.origin].name,
      title: "Your earliest memory",
      body: (S) => [homeLine[S.origin],
        S.karma ? { memory: ["At night you dream you are someone else: {past}, born in {land}, grown and grey, with a whole life behind them. In the dream it always ends the same way: {end!}.", { past: S.karma.name, land: K.ORIGINS[S.karma.origin]?.name || "", end: S.karma.title }] } : null,
        "You are six years old. How do you spend your days?"],
      choices: [
        { id: "drills", t: "Follow the soldiers to their drills and copy them", fx: { skill: { mace: 1 }, attr: { might: 1 } } },
        { id: "stories", t: "Sit with the old storyteller in the evenings", fx: { skill: { lore: 1 }, attr: { wisdom: 1 }, flag: "loved_stories" } },
        { id: "wild", t: "Run wild by the river and the woods", fx: { skill: { stealth: 1 }, attr: { grace: 1 } } },
        { id: "home", t: "Help at home with the animals and the little ones", fx: { skill: { healing: 1 }, duty: { family: 1 }, attr: { wisdom: 1 } } }
      ],
      next: "a1_first"
    },
    // The first test comes at once, and does not count: it shows how tests work.
    {
      id: "a1_first", act: 1, age: 6, art: "origin", place: (S) => K.homePlace(S),
      title: "Three pebbles",
      body: (S) => [
        S.origin === "gandhara" ? "At the edge of the yard grows an old apricot tree, and the best fruit always hangs where no one can reach it." : "At the edge of the yard grows an old mango tree, and the best fruit always hangs where no one can reach it.",
        "Your cousin, three years older and very sure of herself, puts three smooth pebbles in your hand. \"Knock one down,\" she says, \"and it is yours.\""
      ],
      choices: [
        { id: "throw", t: "Take the pebbles and aim", game: "aim", hint: "A first test",
          trial: { practice: true, attr: "aim", icon: "fruit", verb: "Throw", shots: 3, need: 1, easy: 0.07, speed: 1.1,
            rules: "The fruit sways on its branch. Throw as it crosses your line. One hit is enough." },
          win: { fx: { flag: "first_throw" }, text: (S) => (S.origin === "gandhara" ? "The apricot drops into the grass. It is the best thing you have ever eaten, and you tell everyone so, loudly." : "The mango drops into the grass. It is the best thing you have ever eaten, and you tell everyone so, loudly.") },
          lose: { fx: {}, text: "Three pebbles, three misses. Your cousin knocks one down with her first throw and gives it to you anyway. \"Again tomorrow,\" she says." } }
      ],
      next: "a1_roots"
    },
    // Families from the far lands come to live near Hastinapura, so the childhood that follows happens
    // within reach of the palace. Hastinapura and the charioteer families are already there.
    {
      id: "a1_journey", when: (S) => !["hastinapura", "suta"].includes(S.origin), skipTo: "a1_princes",
      act: 1, age: 7, art: "home_hastinapura", place: "The road to Hastinapura", caption: "Hastinapura, at the end of the road", // art: a stand-in until scene_journey is painted
      enter: { flag: "moved_capital" },
      title: "The road to Hastinapura",
      body: (S) => [
        journeyLine[S.origin],
        "Hastinapura is a city of elephants: walls, gateways, a river crowded with boats, and somewhere behind it all, a palace full of princes your own age.",
        "On the long road, what do you hold on to?"
      ],
      choices: [
        { id: "guards", t: "Watch the caravan guards, and learn how they keep watch at night", fx: { skill: { stealth: 1 } },
          text: "By the end of the road you can tell a guard who is awake from one who only looks awake." },
        { id: "words", t: "Learn the words and ways of the new city from everyone you meet", fx: { skill: { statecraft: 1 }, rep: { kuru: 1 } },
          text: "You arrive speaking like a Kuru child, nearly. Your parents are proud and a little sad." },
        { id: "reins", t: "Ride up front with the drivers and beg to hold the reins", fx: { skill: { chariot: 1 } },
          text: "On the last day, on a straight stretch of road, the old driver lets you." },
        { id: "earth", t: "Keep a handful of earth from home, tied in a cloth", fx: { duty: { family: 1 }, flag: "kept_home_earth", journal: { src: "You carried a handful of earth from {origin} to Hastinapura." } },
          text: "You keep it under your sleeping mat. Years later, you still have it." }
      ],
      next: "a1_princes"
    },
    {
      id: "a1_princes", act: 1, age: 8, canon: true, place: "The palace gardens, Hastinapura", art: "scene_princes", plate: ["#d4a84b", "#3e8c72"], caption: "The palace gardens",
      title: "The princes at play",
      witness: [
        "King Pandu has died in the forest, and his five sons have come to Hastinapura with their mother Kunti. They grow up beside their hundred cousins, the sons of blind King Dhritarashtra.",
        "Bhima, the second Pandava, wins every game. He holds the Kaurava boys under water until they gasp, and shakes trees until they fall out with the fruit. He means it as play.",
        "Duryodhana, eldest of the hundred, does not laugh."
      ],
      body: ["You are eight. The palace has opened its gardens for a festival, and half the city has come in. The princes are choosing sides for a game of tag by the lotus pond."],
      choices: [
        { id: "bhima", t: "Play on Bhima's side", fx: { bond: { bhima: 2, duryodhana: -1 }, flag: "played_bhima" } },
        { id: "duryo", t: "Join Duryodhana and his brothers", fx: { bond: { duryodhana: 2, bhima: -1 }, flag: "played_duryodhana" } },
        { id: "arjuna", t: "Slip away and watch Arjuna practise with a borrowed bow", fx: { bond: { arjuna: 1 }, skill: { archery: 1 }, flag: "watched_arjuna" } },
        { id: "karna", t: "Help the charioteers' boy Karna rub down the horses", req: { origin: ["suta", "anga"] }, locked: "", fx: { bond: { karna: 2 }, skill: { chariot: 1 }, flag: "met_karna_young" } }
      ],
      next: "a1_sage"
    },
    {
      id: "a1_sage", act: 1, age: 9, place: "The road home", art: "scene_sage", plate: ["#c9a24a", "#5c3361"], caption: "A dusty road at noon",
      title: "A sage on the road",
      body: ["On the way home, an old sage sits by the road. His hair is matted, his body grey with ash, his water pot empty. He holds it out to you without a word."],
      choices: [
        { id: "give", t: "Give him water and the best of your food", fx: { rep: { sages: 2 }, duty: { conscience: 1 }, flag: "kind_to_sage" }, text: "He drinks, blesses you, and walks on. You feel watched over for days." },
        { id: "mock", t: "Make fun of his ash and his matted hair", fx: { curse: "sage", rep: { sages: -2 }, journal: "You mocked a sage on the road. He said you would remember it when you most needed your strength." },
          text: "He looks at you for a long moment. \"You will remember this,\" he says quietly, \"when you most need your strength.\" You are cursed, and you do not know when it will strike." },
        { id: "pass", t: "Walk past. Your mother told you not to talk to strangers", fx: {} }
      ],
      next: "a1_friend"
    },
    {
      id: "a1_friend", act: 1, age: 10, art: (S) => K.childArt(S), place: (S) => K.childPlace(S),
      title: "A friend for life",
      body: [
        "Charu, the blacksmith's child from your lane, has followed you everywhere for a year. Charu is loud, loyal and afraid of nothing except the dark.",
        "Children choose their friends as if it were nothing. It is the most important choice of your childhood."
      ],
      choices: [
        { id: "charu", img: "p_charu", t: "Charu, who has never once left your side", fx: { set: { friend: "charu" }, setBond: { charu: 7 }, flag: "chose_charu", memory: ["charu", "You chose each other when you were ten."], journal: "Charu became your closest friend." } },
        { id: "bhima", img: "p_bhima", t: "Bhima, who laughs louder than anyone", req: { flag: "played_bhima" }, locked: "You would have needed to play on Bhima's side.", ...friendTest("bhima") },
        { id: "duryo", img: "p_duryodhana", t: "Duryodhana, who remembers every kindness and every slight", req: { flag: "played_duryodhana" }, locked: "You would have needed to join Duryodhana's side.", ...friendTest("duryo") },
        { id: "arjuna", img: "p_arjuna", t: "Arjuna, who practises until his fingers bleed", req: { flag: "watched_arjuna" }, locked: "You would have needed to watch Arjuna practise.", ...friendTest("arjuna") },
        { id: "karna", img: "p_karna", t: "Karna, the charioteer's son who wants to be more", req: { bond: ["karna", 4] }, locked: "You would need to know Karna already.", ...friendTest("karna") }
      ],
      next: "s_child"
    },
    {
      id: "a1_poison", act: 1, age: 12, canon: true, place: "Pramanakoti, on the Ganga", art: "scene_poison", plate: ["#3b5ba9", "#16131f"], caption: "Pavilions by the river",
      title: "The river at Pramanakoti",
      witness: [
        "Duryodhana holds a river festival at Pramanakoti. He feeds Bhima sweets laced with poison, and when Bhima falls asleep he has him tied with vines and rolled into the Ganga.",
        "Bhima does not come back that night, or the next."
      ],
      body: (S) => [
        "You saw two of Duryodhana's men carrying something heavy to the water at dusk. Nobody else seems to have noticed.",
        S.friend === "duryodhana" ? { memory: "Duryodhana is your closest friend. He catches your eye across the pavilion and smiles." } : null,
        S.friend === "bhima" ? { memory: "Bhima is your closest friend. His mother has not slept." } : null
      ],
      choices: [
        { id: "tell", t: "Tell Vidura what you saw", fx: { duty: { conscience: 2 }, bond: { duryodhana: -3, vidura: 2 }, rep: { pandava: 1 }, memory: ["duryodhana", "You told Vidura what his men did at the river."] },
          text: "Vidura listens without surprise. \"Say this to no one else,\" he tells you. \"Not yet.\"" },
        { id: "search", t: "Search the riverbank yourself after dark",
          check: { attr: "grace", skill: "stealth", dc: 7,
            pass: { fx: { bond: { bhima: 2 }, flag: "found_vines" }, text: "Downstream you find cut vines on a sandbar, and footprints leading out of the water, not in. Whatever happened to Bhima, he walked out alive." },
            fail: { fx: { bond: { duryodhana: -1 } }, text: "Duryodhana's men find you on the bank. They send you home with a warning and a split lip." } } },
        { id: "silent", t: "Say nothing. It is not your quarrel", fx: { duty: { conscience: -1 }, bond: { duryodhana: 1 }, memory: ["duryodhana", "You saw, and kept quiet."] } },
        { id: "ask", t: "Ask Duryodhana to tell the elders it was a prank", req: { friend: "duryodhana" }, locked: "", fx: { bond: { duryodhana: -1 }, duty: { conscience: 1 } },
          text: "He laughs, then stops laughing. \"You of all people,\" he says, and walks away. He does not speak to you for a month." }
      ],
      after: ["Eight days later Bhima walks back into the palace, stronger than before. He says the serpents beneath the river drew out the poison and gave him the strength of a thousand elephants. No one is punished. Everyone remembers."],
      next: "a1_second"
    },
    // The second chance at a friendship, for those who failed its test at ten.
    {
      id: "a1_second", when: (S) => Object.values(SECOND).some((f) => S.flags.includes(f)), skipTo: "a1_pasha",
      act: 1, age: 13, art: "scene_fair", place: "The spring fair", caption: "The spring fair",
      title: "One more chance",
      body: (S) => [Object.keys(SECOND).filter((k) => S.flags.includes(SECOND[k])).map((k) => FRIENDS[k].line)[0], "You will not be asked a third time."],
      choices: [
        Object.assign({ id: "arjuna", img: "p_arjuna", t: "Take Arjuna's bow", req: { flag: "second_arjuna" }, locked: "" }, friendTest("arjuna", true)),
        Object.assign({ id: "bhima", img: "p_bhima", t: "Wade in and wrestle Bhima", req: { flag: "second_bhima" }, locked: "" }, friendTest("bhima", true)),
        Object.assign({ id: "duryo", img: "p_duryodhana", t: "Face Duryodhana's brothers again", req: { flag: "second_duryo" }, locked: "" }, friendTest("duryo", true)),
        Object.assign({ id: "karna", img: "p_karna", t: "Take the stallion's rope beside Karna", req: { flag: "second_karna" }, locked: "" }, friendTest("karna", true)),
        { id: "let", t: "Let it go. Charu is friend enough", fx: { bond: { charu: 1 } }, text: "You walk on with Charu, who pretends not to be pleased." }
      ],
      next: "a1_pasha"
    },
    {
      id: "a1_pasha", act: 1, age: 13, art: "scene_pasha", place: "The spring fair", caption: "Dice under a striped awning",
      title: "The dice-board under the awning",
      body: [
        "The spring fair has come. Under a striped awning an old man called Haridatta keeps a dice-board: a cloth cross of squares, and three long dice of ivory, each marked one, two, five and six.",
        { speaker: "Haridatta", line: "Kings have lost kingdoms at this board. Sit down, if you have a copper. I will teach you for nothing, and beat you for one." }
      ],
      choices: [
        { id: "play", t: "Put down a copper and play him", game: "pasha", hint: "A game of dice, best of three rounds",
          win: { fx: { item: { herbs: 1 }, flag: ["learned_pasha", "beat_haridatta"], journal: "You beat old Haridatta at dice at the spring fair." },
            text: "Haridatta laughs, pays you with a bundle of healing herbs from the next stall, and tells you never to play a stranger. \"The dice are honest,\" he says. \"Men are not.\"" },
          lose: { fx: { flag: "learned_pasha" },
            text: "Haridatta keeps your copper and pats your head. \"Remember the faces,\" he says. \"One, two, five, six. Someone who knows the dice knows when they lie.\"" } },
        { id: "watch", t: "Watch the grown men play, and listen to their stories", fx: { skill: { lore: 1 } },
          text: "The players talk while they throw. A king called Nala, they say, once lost his kingdom at dice, and his wife, and very nearly himself." },
        { id: "walk", t: "Go on to the wrestling ground", fx: {} }
      ],
      next: "a1_wrestle"
    },
    {
      id: "a1_wrestle", act: 1, age: 13, art: "scene_fair", place: "The wrestling ground at the spring fair",
      title: "Ugra at the fair",
      body: (S) => [
        "Ugra, the miller's son, is two years older and twice your size. Every fair he takes the smaller children's sweets and dares anyone to stop him.",
        S.friend === "charu" ? "Today he has Charu's arm twisted behind Charu's back." : "Today he has a little girl's bangles in his fist, and she is crying."
      ],
      choices: [
        { id: "fight", t: "Step into the wrestling ring and challenge him", req: { noFlag: "chose_charu" }, locked: "", combat: "e_ugra" },
        { id: "bout", t: "Step into the wrestling ring and challenge him", req: { flag: "chose_charu" }, locked: "", game: "push", hint: "A wrestling test", trial: ugraTrial(false),
          win: UGRA_WIN, lose: { fx: {}, text: "Ugra throws you out of the ring. Charu is still in his grip.", next: "a1_rematch" } },
        { id: "talk", t: "Shame him in front of the crowd",
          check: { attr: "command", skill: "lore", dc: 7,
            pass: { fx: { rep: { common: 1 }, flag: "shamed_ugra" }, text: "You turn the crowd's laughter on him. Ugra drops what he took and stalks off. He looks back once, at you." },
            fail: { fx: {}, text: "The crowd laughs at you instead. Ugra keeps his prize." } } },
        { id: "leave", t: "Walk away. He is too big", fx: { duty: { conscience: -1 } } }
      ],
      next: "a2_teacher"
    },
    {
      id: "a1_rematch", act: 1, age: 13, art: "scene_fair", place: "The wrestling ground at the spring fair",
      title: "Get up",
      body: ["The crowd is laughing. Ugra is laughing. Charu is not."],
      choices: [
        { id: "again", t: "Get up and ask for another bout", game: "push", hint: "Your second chance", trial: ugraTrial(true), win: UGRA_WIN,
          lose: { penalty: 1, fx: { rep: { common: -1 }, flag: ["lost_to_ugra", "ugra_twice"], memory: ["charu", "You got up and fought Ugra twice for Charu. You lost twice. Charu never forgot either part."] },
            text: "He throws you again, harder. The crowd stops laughing, which is worse. Ugra lets Charu go anyway, bored, and Charu helps you home." } },
        { id: "down", t: "Stay down", fx: { flag: "lost_to_ugra" }, text: "You stay down. Ugra lets Charu go anyway, bored. On the way home neither of you says anything." }
      ],
      next: "a2_teacher"
    }
  ]);

  K.encounter({
    id: "e_ugra", title: "Ugra at the fair", art: "scene_fair", caption: "The wrestling ring", lethal: false,
    intro: "The crowd makes a ring. Ugra grins and spits on his palms.",
    enemies: [K.foe("Ugra, the miller's son", 1, { hp: 26, atk: 4 })],
    win: { fx: { rep: { common: 1 }, bond: { charu: 1 }, flag: ["beat_ugra", "balarama_noticed"], journal: "You beat Ugra in the ring at the spring fair. A giant of a man with a plough on his shoulder asked your name." },
      text: "Ugra stays down. In the crowd, a huge man with a plough over his shoulder laughs and asks your name. People say afterwards that it was Balarama of the Yadavas." },
    lose: { fx: { duty: { conscience: 1 }, flag: "lost_to_ugra" }, text: "You lose, badly. But you stood up to him, and everyone saw. Ugra most of all." }
  });
})(window.K = window.K || {});
