/* Act III — Young adult (ages 20–30). PRD §6. */
(function (K) {
  "use strict";
  const pledge = (court) => (S) => ({ set: { court }, duty: { court: 6 - S.duty.court } });

  // The tunnel at Varnavata: Act III's test for those who know of it (the others try the great bow).
  const TUNNEL = { t: "Help carry the earth out of the tunnel at night", req: { any: [{ teacher: "vidura" }, { path: "spy" }, { friend: ["bhima", "arjuna"] }] }, game: "sneak", hint: "A test of stealth",
    trial: { attr: "grace", skill: "stealth", verb: "Move", help: "Hold to creep along the wall with the basket. Stop before the torchlight reaches you.",
      rules: "Purochana's guard walks the house with a torch. Carry two baskets of earth out of the tunnel without being seen. Seen twice, and you must stop for the night.",
      stakes: ["The tunnel grows by a night's digging, and the Pandavas will owe you.", "You have to stop for the night. The miner will try again tomorrow, with or without you."] },
    retryStakes: ["The tunnel grows by a night's digging, and the Pandavas will owe you.", "A guard sees you, and Purochana starts asking questions. It counts as two failures, and it will weigh on every stealth test to come."],
    win: { fx: { bond: { yudhishthira: 2, bhima: 1 }, rep: { pandava: 2 }, flag: ["helped_tunnel", "act3_tested"], journal: "You helped dig the tunnel under the house at Varnavata." }, text: "Night after night you carry baskets of earth into the dark. No one sees you." },
    lose: { fx: { flag: "act3_tested" }, text: "A torch swings your way. You drop the basket and crawl back into the dark. \"Tomorrow night,\" the miner whispers." },
    retryLose: { penalty: 1, fx: { rep: { kuru: -2 }, flag: ["seen_at_tunnel", "tunnel_twice"] }, text: "One of Purochana's guards sees a figure near the house at night. He does not see your face, but he will keep looking." } };

  K.scenes([
    {
      id: "a3_secret", when: { flag: "hermit_secret" }, skipTo: "a3_debt",
      act: 3, age: 21, art: "scene_secret", place: "The Kuru assembly hall", caption: "Before the Kuru court",
      title: "Who taught you?",
      body: ["Your skill has been noticed. Drona himself asks, in front of the whole court, who trained you. Mauni made you promise never to say."],
      choices: [
        { id: "tell", t: "Tell the truth: a hermit in the forest", fx: { duty: { teacher: -3, court: 1 }, rep: { kuru: 1 }, curse: "hermit", flag: "betrayed_hermit", journal: "You told the court who taught you, and broke your promise to Mauni." },
          text: "Drona nods, satisfied. That night a boy brings you three words from the forest: \"At the worst hour.\" You are cursed." },
        { id: "lie", t: "Say you taught yourself", tags: ["lie"], fx: { duty: { teacher: 1, conscience: -1 } } },
        { id: "refuse", t: "Refuse to answer the teacher of the princes", fx: { rep: { kuru: -2 }, duty: { teacher: 2, court: -2 }, memory: ["drona", "You refused him in open court."] } }
      ],
      next: "a3_debt"
    },
    {
      id: "a3_debt", when: { flag: "debt_owed" }, skipTo: "a3_lac",
      act: 3, age: 21, art: (S) => K.childArt(S), place: (S) => K.childPlace(S),
      title: "The debt comes due",
      body: ["Sudatta the moneylender arrives at your door with a palm-leaf note your grandfather signed. With interest, it is more than your family owns. He is polite about it, which is worse."],
      choices: [
        { id: "serve", t: "Work it off on his trading caravans for a year", fx: { skill: { statecraft: 1 }, duty: { family: 1 }, unflag: "debt_owed", flag: "debt_paid", journal: "You worked a year on Sudatta's caravans to clear your family's debt." } },
        { id: "friend", t: "Ask {friend} for help", req: { has: "friend" },
          resolve: (S) => ({ bond: { [S.friend]: 1 }, unflag: "debt_owed", flag: "debt_paid", memory: [S.friend, "They paid your family's debt without being asked twice."] }) },
        { id: "tear", t: "Tear up the note in front of him", fx: { rep: { common: -1 }, duty: { family: -2 }, flag: "debt_refused", journal: "You tore up Sudatta's note. He said he would be patient." }, hint: "Sudatta will be patient" }
      ],
      next: "a3_lac"
    },
    {
      id: "a3_lac", act: 3, age: 23, canon: true, place: "Varnavata", art: "scene_lac", plate: ["#e5872e", "#2a1c1f"], caption: "A new house that smells of resin",
      title: "The house at Varnavata",
      witness: [
        "Duryodhana's minister Purochana builds a beautiful house at Varnavata for Kunti and her sons. It is made of lac, hemp and resin, and it is meant to burn.",
        "Vidura warns Yudhishthira in a riddle only he understands, and sends a miner to dig a tunnel under the floor."
      ],
      body: (S) => [
        "You are in Varnavata for the spring festival. You have noticed the smell of resin in the new house's walls.",
        S.teacher === "vidura" ? "Vidura's miner needs someone to carry the earth out at night without being seen." : null
      ],
      choices: [
        Object.assign(K.testChoice("a3_lac", "dig", TUNNEL), { locked: "Only Vidura's people know about the tunnel." }),
        { id: "warn", t: "Try to wake the Nishada woman and her sons sleeping in the house", fx: (S) => ({ duty: { conscience: 2 }, flag: "tried_nishada", memory: ["all", "You tried to wake the family who died at Varnavata."], rep: S.origin === "nishada" ? { common: 2 } : {} }),
          text: "They drank deep at Kunti's feast and do not wake, however hard you shake them. Then the smoke comes, and someone drags you out by the collar." },
        { id: "tell", t: "Warn Duryodhana that people are talking about the house", req: { friend: "duryodhana" }, fx: { bond: { duryodhana: 2 }, duty: { court: 1, conscience: -2 }, flag: "warned_duryodhana" } },
        { id: "stay", t: "Keep away from the house", fx: {} }
      ],
      after: ["That night the house burns to the ground. In the ashes they find six bodies: a Nishada woman and her five sons. Everyone believes they are Kunti and the Pandavas. In Hastinapura, Dhritarashtra weeps, and Duryodhana weeps louder."],
      next: "a3_tunnel_again"
    },
    {
      id: "a3_tunnel_again", when: K.retryWhen("a3_lac", ["dig"]), skipTo: "a3_bow", act: 3, age: 23, art: "scene_lac", place: "Varnavata", caption: "The next night",
      title: "The next night", body: ["The miner is waiting at the mouth of the tunnel with an empty basket. You will not be asked a third time."],
      choices: [K.retryChoice("a3_lac", "dig", TUNNEL), { id: "let", t: "Leave the digging to the miner", fx: {}, text: "You stay away. The miner digs on alone." }],
      next: "a3_bow"
    },
    {
      id: "a3_swayamvara", act: 3, age: 25, canon: true, place: "Drupada's hall, Panchala", art: "scene_swayamvara", plate: ["#d4a84b", "#c0472f"], caption: "A golden fish turning above the water",
      title: "Draupadi's swayamvara",
      witness: [
        "Drupada holds a contest for his daughter's hand. A golden fish turns on a wheel high above a pool. The winner must string a great bow and hit the fish's eye while looking only at its reflection.",
        "King after king fails to even string the bow. Karna rises and strings it, and the hall goes quiet. Whatever passes between him and the princess, he walks back to his seat.",
        "Then a young brahmin in a deerskin steps forward, strings the bow in one motion, and hits the eye."
      ],
      body: ["The kings are on their feet, furious that a brahmin has beaten them. Some are drawing swords. A huge brahmin beside the winner pulls up a tree by the roots."],
      choices: [
        { id: "fight", t: "Stand with the two brahmins against the angry kings", combat: "e_kings" },
        { id: "calm", t: "Talk the nearest kings down before blood is spilled",
          check: { attr: "command", skill: "statecraft", dc: 8,
            pass: { fx: { rep: { panchala: 1, yadava: 1, common: 1 }, flag: "calmed_kings" }, text: "Two kings sheathe their swords and walk out with you. Fewer men are hurt that day because of it." },
            fail: { fx: {}, text: "Nobody listens to you. You step back as the fighting starts." } } },
        { id: "kings", t: "Side with the kings. A contest for kshatriyas was won by a brahmin", fx: { bond: { duryodhana: 1, arjuna: -1 }, rep: { kuru: 1, panchala: -1 } } },
        { id: "watch", t: "Stay against the wall and watch", fx: {} }
      ],
      after: ["The brahmins were Arjuna and Bhima in disguise. The Pandavas are alive. Draupadi becomes the wife of all five brothers, as their mother's word and Draupadi's own fate decree, and the news reaches Hastinapura like thunder."],
      next: "a3_court"
    },
    {
      id: "a3_court", act: 3, age: 26, canon: true, place: "Hastinapura and Indraprastha", art: "scene_indraprastha", plate: ["#3e8c72", "#d4a84b"], caption: "A new city rises from burned forest",
      title: "Two kingdoms",
      witness: [
        "To avoid war, Dhritarashtra gives the Pandavas half the kingdom: the wild land of Khandavaprastha. The Khandava forest is burned to clear it, and on the ashes they build Indraprastha, a city of white stone and glass.",
        "Now there are two courts, and everyone must decide where they belong."
      ],
      body: (S) => ["You are twenty-six. Where do you make your life?", S.friend && K.PEOPLE[S.friend]?.canon ? { memory: "{friend} asks where you will go." } : null],
      choices: [
        { id: "hastinapura", t: "Serve the old throne at Hastinapura", fx: { rep: { kuru: 2 }, bond: { duryodhana: 1 }, journal: "You pledged yourself to the court at Hastinapura." }, resolve: pledge("hastinapura") },
        { id: "indraprastha", t: "Go to Indraprastha and serve Yudhishthira", fx: { rep: { pandava: 2 }, bond: { yudhishthira: 1 }, journal: "You went to Indraprastha to serve Yudhishthira." }, resolve: pledge("indraprastha") },
        { id: "home", t: "Go home and serve your own people", fx: { rep: { common: 1 }, duty: { family: 1 }, journal: "You went home to serve your own people." }, resolve: (S) => pledge(K.HOME_COURT[S.origin])(S),
          text: (S) => (S.origin === "mathura" ? "Your people are no longer in Mathura. Krishna killed Kamsa, and when Jarasandha's armies kept coming, the Yadavas moved to a new city by the western sea: Dwaraka. You follow them there." : null) },
        { id: "none", t: "Serve no king. Go where your skills are needed", fx: { set: { court: "none" }, rep: { common: 1 }, journal: "You chose to serve no king." }, resolve: (S) => ({ duty: { court: 1 - S.duty.court } }) }
      ],
      next: "a3_marriage"
    },
    {
      id: "a3_marriage", act: 3, age: 27, art: "origin", place: (S) => K.COURTS[S.court]?.name || "Home",
      title: "A marriage",
      body: (S) => [
        "Your family has been talking about marriage for years. Two names keep coming up, and a third you have never said out loud.",
        "Madhavi is a healer's daughter from home, quiet and stubborn. Revat trains horses for the royal stables and laughs at everything.",
        K.hasVow("celibacy") ? { aside: "You swore a vow of celibacy. Marrying would break it." } : null
      ],
      choices: [
        { id: "madhavi", img: "p_madhavi", t: "Marry Madhavi", tags: ["marry"], fx: { set: { spouse: "madhavi" }, setBond: { madhavi: 7 }, duty: { family: 2 }, item: { herbs: 1 }, journal: "You married Madhavi." } },
        { id: "revat", img: "p_revat", t: "Marry Revat", tags: ["marry"], fx: { set: { spouse: "revat" }, setBond: { revat: 7 }, duty: { family: 2 }, skill: { chariot: 1 }, journal: "You married Revat." } },
        { id: "charu", img: "p_charu", t: "Marry Charu, your oldest friend", req: { friend: "charu" }, tags: ["marry"], fx: { set: { spouse: "charu" }, bond: { charu: 2 }, duty: { family: 2 }, journal: "You married Charu, your oldest friend." } },
        { id: "none", t: "Do not marry", fx: {} }
      ],
      next: "s_court"
    },
    {
      id: "a3_rajasuya", act: 3, age: 29, canon: true, place: "Indraprastha", art: "scene_rajasuya", plate: ["#6f8fd8", "#d4a84b"], caption: "The hall that Maya built",
      title: "The Rajasuya",
      witness: [
        "Yudhishthira performs the Rajasuya sacrifice and is proclaimed emperor. When King Shishupala insults Krishna past all bearing, Krishna's discus ends his life, and the gathered kings fall silent.",
        "Duryodhana stays to see the wonders of the hall built by the architect Maya. He mistakes a polished floor for water and lifts his robes, then walks into real water and falls in. Bhima laughs, and the servants laugh with him."
      ],
      body: ["You are standing near the pool when Duryodhana comes up, soaked and shaking with rage."],
      choices: [
        { id: "laugh", t: "Laugh with everyone else", fx: { bond: { bhima: 1, duryodhana: -2 }, memory: ["duryodhana", "You laughed when he fell in the water."] } },
        { id: "help", t: "Give Duryodhana your hand and a dry cloak", fx: { bond: { duryodhana: 2 }, duty: { conscience: 1 }, memory: ["duryodhana", "You helped him out of the water when everyone was laughing."] } },
        { id: "listen", t: "Follow Duryodhana and Shakuni and listen", req: { any: [{ path: "spy" }, { teacher: "vidura" }, { attr: ["grace", 4] }] }, locked: "You would need to be quiet on your feet.",
          check: { attr: "grace", skill: "stealth", dc: 8,
            pass: { fx: { flag: "knows_dice_plot", journal: "You overheard Shakuni planning a game of dice to ruin the Pandavas." }, text: "Behind a curtain you hear Shakuni say it plainly: Yudhishthira cannot refuse a challenge to dice, and Shakuni cannot lose." },
            fail: { fx: { rep: { kuru: -1 } }, text: "A guard moves you along before you hear anything useful." } } },
        { id: "away", t: "Look away and leave him his dignity", fx: { duty: { conscience: 1 } } }
      ],
      after: ["Duryodhana goes home and tells his uncle Shakuni he would rather die than live with this. Shakuni tells him there is no need for either."],
      next: "a4_invite"
    }
  ]);

  K.encounter({
    id: "e_kings", title: "The brawl at the swayamvara", art: "scene_swayamvara", caption: "Kings with drawn swords", lethal: false,
    intro: "The angry kings' guards rush the two brahmins. You are in the way.",
    allies: [{ name: "The huge brahmin (Bhima)", hp: 90, atk: 11, def: 3, abilities: ["strike", "heavy"] }],
    enemies: [K.foe("A king's bodyguard", 3), K.foe("A king's bodyguard", 2)],
    win: { fx: { bond: { arjuna: 2, bhima: 2 }, rep: { panchala: 2, kuru: -2 }, flag: "swayamvara_fought", journal: "You fought beside two brahmins at Draupadi's swayamvara. They were Bhima and Arjuna." }, text: "The guards fall back. The huge brahmin claps you on the shoulder hard enough to bruise." },
    lose: { fx: { bond: { bhima: 1 }, injury: "scar" }, text: "You go down early, and the huge brahmin steps over you to finish the fight." }
  });
})(window.K = window.K || {});
