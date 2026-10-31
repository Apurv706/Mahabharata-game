/* Act III — Young adult (ages 20–30). PRD §6. */
(function (K) {
  "use strict";
  const pledge = (court) => (S) => ({ set: { court }, duty: { court: 6 - S.duty.court } });

  // The tunnel at Varnavata: Act III's test for those who know of it (the others try the great bow).
  const TUNNEL = { t: "Help carry the earth out of the tunnel at night", req: { any: [{ teacher: "vidura" }, { path: "spy" }, { friend: ["bhima", "arjuna"] }] }, game: "sneak", hint: "A test of stealth",
    trial: { attr: "grace", skill: "stealth", verb: "Move", stage: "stage_lac_wall", cast: ["guard"], help: "Hold to creep along the wall with the basket. Stop before the torchlight reaches you.",
      rules: "Purochana's guard walks the house with a torch. Carry two baskets of earth out of the tunnel without being seen. Seen twice, and you must stop for the night.",
      stakes: ["The tunnel grows by a night's digging, and the Pandavas will owe you.", "You have to stop for the night. The miner will try again tomorrow, with or without you."] },
    retryStakes: ["The tunnel grows by a night's digging, and the Pandavas will owe you.", "A guard sees you, and Purochana starts asking questions. It counts as two failures, and it will weigh on every stealth test to come; if your stealth is low, the guard may not stop at questions."],
    win: { fx: { bond: { yudhishthira: 2, bhima: 1 }, rep: { pandava: 2 }, flag: ["helped_tunnel", "act3_tested"], journal: "You helped dig the tunnel under the house at Varnavata." }, text: "Night after night you carry baskets of earth into the dark. No one sees you." },
    lose: { fx: { flag: "act3_tested" }, text: "A torch swings your way. You drop the basket and crawl back into the dark. \"Tomorrow night,\" the miner whispers." },
    peril: { kind: "death", art: "scene_lac", caption: "The garden of the lac house, at night", text: "The guard does not shout. He takes you for a thief in the dark, and he does not ask questions.",
      deathText: "{They} carried earth out of the tunnel at Varnavata by night, and one of Purochana's guards took {them} for a thief." },
    retryLose: { penalty: 1, fx: { rep: { kuru: -2 }, flag: ["seen_at_tunnel", "tunnel_twice"] }, text: "One of Purochana's guards sees a figure near the house at night. He does not see your face, but he will keep looking." } };

  // The night of the fire: who knows what the house is for, and who is inside it when it burns.
  const KNOWS_PLOT = { any: [{ teacher: "vidura" }, { path: "spy" }, { flag: "helped_tunnel" }] };
  const INSIDE = (S) => S.flags.includes("tried_nishada") || S.flags.includes("helped_tunnel") || S.flags.includes("warned_pandavas") || S.flags.includes("cut_fuses");

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
      id: "a3_lac", act: 3, age: 23, canon: true, place: "Varnavata", to: "varnavata", travel: "You go to Varnavata for the spring festival.", art: "scene_lac", clipAfter: true, plate: ["#e5872e", "#2a1c1f"], caption: "A new house that smells of resin",
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
          text: "They drank deep at Kunti's feast and do not wake, however hard you shake them. You sit down beside them in the dark, meaning to try again in a little while." },
        { id: "tell", t: "Warn Duryodhana that people are talking about the house", req: { friend: "duryodhana" }, fx: { bond: { duryodhana: 2 }, duty: { court: 1, conscience: -2 }, flag: "warned_duryodhana" } },
        { id: "stay", t: "Keep away from the house", fx: {} }
      ],
      after: ["On the last night of the festival, the house of lac burns."],
      next: "a3_tunnel_again"
    },
    {
      id: "a3_tunnel_again", when: K.retryWhen("a3_lac", ["dig"]), skipTo: "a3_fuse", act: 3, age: 23, art: "stage_lac_wall", place: "Varnavata", caption: "The next night",
      title: "The next night", body: ["The miner is waiting at the mouth of the tunnel with an empty basket. You will not be asked a third time."],
      choices: [K.retryChoice("a3_lac", "dig", TUNNEL), { id: "let", t: "Leave the digging to the miner", fx: {}, text: "You stay away. The miner digs on alone." }],
      next: "a3_fuse"
    },
    // ---------- The night the house burns (PRD §18.2) ----------
    // Earlier that night, those who know the plot can go down to the cellar and cut Purochana's oil
    // lines; every line cut buys time when the fire comes. Or warn Yudhishthira plainly. Or say
    // nothing, and keep your own family out of it.
    {
      id: "a3_fuse", when: KNOWS_PLOT, skipTo: "a3_fire", act: 3, age: 23, away: true, art: "stage_lac_cellar", place: "Varnavata", caption: "The cellar under the house of lac",
      title: "The last night of the festival",
      body: ["The feast is over. Kunti and her sons are asleep upstairs, and so are the Nishada woman and her five sons, who drank what was given them. In the cellar, Purochana's oil lines run from the door to every sleeping room.",
        "He means to light them tonight. The fire will come whatever you do. What you do before it comes is yours."],
      choices: [
        { id: "cut", t: "Go down to the cellar and cut the oil lines", game: "fuse", hint: "A test of stealth",
          trial: { attr: "grace", skill: "stealth", stage: "stage_lac_cellar", lines: 3, secs: 32, verb: "Cut",
            rules: "Purochana's guard walks the cellar with a lamp. Choose a line and hold to cut it while the light is away; caught in the light, let go. Cut two of the three before the guard has seen you twice.",
            stakes: ["Every line cut slows the fire tonight, and the Pandavas will owe you.", "The guard sends you up the stairs with the lines whole. The fire will run as fast as Purochana meant it to."] },
          win: { fx: { flag: ["cut_fuses", "bhima_debt"], bond: { yudhishthira: 1, bhima: 1 }, journal: "On the last night at Varnavata you cut Purochana's oil lines in the cellar." }, text: "The oil runs out across the stone and soaks into the earth. Upstairs, someone turns over in their sleep." },
          close: { fx: { flag: ["cut_fuses", "bhima_debt"] }, text: "One line parts before the lamp comes back for good. It will have to be enough." },
          lose: { fx: {}, text: "The lamp finds you twice, and the second time the guard does not look away. You go up the stairs with the lines whole." } },
        { id: "warn", t: "Tell Yudhishthira plainly what is in the walls, and that it is tonight", fx: { flag: ["warned_pandavas", "bhima_debt"], bond: { yudhishthira: 2, bhima: 1 }, rep: { kuru: -1 }, duty: { conscience: 1 } },
          text: "Yudhishthira listens without surprise. \"Vidura told me in a riddle,\" he says. \"You have told me in plain words. We will not forget either.\"" },
        { id: "silent", t: "Say nothing. Your family lives under Duryodhana's hand", fx: { duty: { family: 1, conscience: -2 }, memory: ["all", "You knew what the house at Varnavata was for, and said nothing."] },
          text: "You go to bed with the smell of resin in your clothes, and do not sleep." }
      ],
      next: "a3_fire"
    },
    // The fire. Those inside the house play the escape through the burning rooms to the tunnel;
    // those outside can run in. The epic has written who dies here: a Nishada woman and her five
    // sons, and Purochana. A failed escape is death, not a second chance.
    {
      id: "a3_fire", act: 3, age: 23, canon: true, art: "scene_lac_fire", place: "Varnavata", plate: ["#e5872e", "#2a1c1f"], caption: "The house of lac, burning",
      title: "The night of the fire",
      witness: ["The house of lac burns on the last night of the festival. Kunti and the Pandavas go down into the tunnel and out into the forest. Purochana dies in his own fire."],
      body: (S) => [
        INSIDE(S) ? (S.flags.includes("tried_nishada") ? "You wake beside the sleepers who would not wake, with smoke in your mouth. The far wall is already light." : "You are in the house when it goes up, between the sleeping rooms and the storeroom where the tunnel mouth is.")
          : "Shouting wakes you. From the lane you can see the roof of the new house burning, and the heat of it on your face.",
        S.flags.includes("cut_fuses") ? { memory: "The oil lines you cut have slowed it. There is a little more time than Purochana meant there to be." } : null
      ],
      choices: [
        { id: "run", t: (S) => (INSIDE(S) ? "Get to the tunnel" : "Run into the house to get people out"), game: "escape", hint: "The way through the burning rooms",
          trial: { attr: "grace", skill: "stealth", stage: "stage_lac_fire_top", start: (S) => (INSIDE(S) ? (S.flags.includes("tried_nishada") ? "deep" : "hall") : "door"), auto: 0.7,
            rules: "The fire comes from Purochana's side, room by room, with the smoke ahead of it. Move through the doors to the storeroom, where the tunnel mouth is. Some doors are stuck: hold to force them. Sleepers can be woken and carried, and each one slows you.",
            stakes: ["You reach the tunnel, and whoever you carried comes with you.", "The fire catches you in the house. There is no second chance tonight."] },
          win: { fx: (S) => Object.assign({ flag: ["escaped_lac"], duty: { conscience: 1 }, journal: "You got out of the burning house at Varnavata through the tunnel." },
              S.lacCarried ? { flag: ["escaped_lac", "carried_out_lac"], rep: { common: 1 }, duty: { conscience: 2 }, memory: ["all", "You carried someone out of the house of lac."] } : {}),
            text: (S) => (S.lacCarried ? "The tunnel mouth is cold and black and smells of earth. You put the one you carried down at the bottom of the shaft, and only then feel your hands shaking." : "You drop into the tunnel mouth as the storeroom roof comes down behind you. The dark smells of earth, and of nothing burning.") },
          close: { fx: { flag: ["escaped_lac", "lac_late"], injury: "scar", journal: "You came through the flames at Varnavata, and not everyone you carried came with you." },
            text: "You come through the last room with your sleeve alight. Whoever was on your back is not there when you drop into the dark, and you cannot go back." },
          lose: { fx: (S) => (S.storyMode ? { injury: "scar", flag: ["lac_burnt"], journal: "The fire caught you in the house at Varnavata. Someone dragged you out, burnt." }
              : { die: true, flag: ["died_in_fire"], deathText: "{They} died in the house of lac at Varnavata, on the night everyone believes the Pandavas died.", set: { deathAt: { art: "end_fire", caption: "The house at Varnavata, at dawn", act: 3 } } }),
            text: (S) => (S.storyMode ? "The smoke takes your legs before the fire does. The next thing you know is cold air, and someone's hands under your arms, and your own skin." : "The smoke takes your legs before the fire does. The last thing you hear is the roof.") } },
        { id: "stay", t: "Stay with the sleepers and keep shaking them", req: { flag: "tried_nishada" }, locked: "", hint: "They will not wake",
          fx: (S) => (S.storyMode ? { injury: "scar", flag: ["lac_burnt"], duty: { conscience: 1 } } : { die: true, flag: ["died_in_fire"], duty: { conscience: 1 }, deathText: "{They} would not leave the Nishada woman and her sons in the house of lac, and died beside them.", set: { deathAt: { art: "end_fire", caption: "The house at Varnavata, at dawn", act: 3 } } }),
          text: (S) => (S.storyMode ? "They do not wake. You are still shaking the youngest when the smoke takes you, and still holding him when someone drags you out by the collar." : "They do not wake. You are still shaking the youngest when the smoke takes you.") },
        { id: "back", t: "Stay back with the crowd", req: (S) => !INSIDE(S), locked: "", fx: { memory: ["all", "You watched the house of lac burn from the lane."] },
          text: "You stand in the lane with everyone else and watch the roof fall in. Nobody comes out." }
      ],
      after: ["In the ashes they find six bodies: a Nishada woman and her five sons. Everyone believes they are Kunti and the Pandavas. In Hastinapura, Dhritarashtra weeps, and Duryodhana weeps louder."],
      next: "a3_kampilya"
    },
    // Going to Kampilya is a choice. Those who go may try the great bow; those who stay have the
    // spring hunt at home, and hear of the swayamvara from travellers.
    {
      id: "a3_kampilya", act: 3, age: 25, art: (S) => K.childArt(S), place: (S) => K.homePlace(S), caption: "Messengers on every road",
      travel: (S) => (S.flags.includes("helped_tunnel") ? "You slip away from Varnavata before anyone can ask questions, and go home." : "After the festival, you go home."),
      title: "A swayamvara at Kampilya",
      body: (S) => [
        "Messengers ride out from Kampilya to every court in the land. King Drupada will give his daughter Draupadi in a swayamvara, to whoever can string the great bow and hit the mark.",
        S.flags.includes("helped_tunnel") ? { memory: "Somewhere in the forest, five brothers everyone believes dead are still alive. You know it, because you carried the earth out of their tunnel." } : null,
        "Half the land is going. Are you?"
      ],
      choices: [
        { id: "ride", t: "Ride to Kampilya for the swayamvara", fx: { flag: "went_kampilya" }, next: "a3_bow", hint: (S) => (S.flags.includes("act3_tested") ? null : "The great bow will be there") },
        { id: "stay", t: "Stay home. The year's work will not wait", fx: { flag: "stayed_home_a3" }, next: "a3_hunt", hint: (S) => (S.flags.includes("act3_tested") ? null : "The spring hunt comes at the end of the rains") }
      ],
      next: "a3_bow"
    },
    {
      id: "a3_swayamvara", act: 3, age: 25, canon: true, place: "Drupada's hall, Panchala", to: "panchala", travel: "You ride to Kampilya for the swayamvara.", art: "scene_swayamvara", plate: ["#d4a84b", "#c0472f"], caption: "A golden fish turning above the water",
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
          peril: { kind: "death", art: "scene_swayamvara", caption: "Drupada's hall, in uproar", text: "A king's bodyguard does not wait for you to finish your sentence.",
            deathText: "{They} stepped between the angry kings at Draupadi's swayamvara, and did not step back out." },
          check: { attr: "command", skill: "statecraft", dc: 8,
            pass: { fx: { rep: { panchala: 1, yadava: 1, common: 1 }, flag: "calmed_kings" }, text: "Two kings sheathe their swords and walk out with you. Fewer men are hurt that day because of it." },
            fail: { fx: {}, text: "Nobody listens to you. You step back as the fighting starts." } } },
        { id: "kings", t: "Side with the kings. A contest for kshatriyas was won by a brahmin", fx: { bond: { duryodhana: 1, arjuna: -1 }, rep: { kuru: 1, panchala: -1 } } },
        { id: "watch", t: "Stay against the wall and watch", fx: {} }
      ],
      after: ["The brahmins were Arjuna and Bhima in disguise. The Pandavas are alive. Draupadi becomes the wife of all five brothers, as their mother's word and Draupadi's own fate decree, and the news reaches Hastinapura like thunder."],
      next: "a3_court"
    },
    // For those who stayed at home: the same story, told by travellers.
    {
      id: "a3_news", act: 3, age: 25, canon: true, place: (S) => K.homePlace(S), art: "scene_swayamvara", caption: "A traveller's story",
      title: "News from Kampilya",
      witness: [
        "At Draupadi's swayamvara, king after king failed to string the great bow. Karna strung it, and walked back to his seat. Then a young brahmin in a deerskin strung it in one motion, and hit the fish's eye.",
        "The brahmins were Arjuna and Bhima in disguise. The Pandavas are alive, and Draupadi is the wife of all five brothers."
      ],
      body: (S) => [
        "You hear it from a traveller at the well, and then from everyone. By evening the story has grown a fight with a hundred kings and an uprooted tree.",
        S.flags.includes("spring_deer") ? { memory: "Your deer is already forgotten. Nobody is going to make up a song about it now." } : null
      ],
      choices: [
        { id: "glad", t: "Drink to the Pandavas being alive", fx: { rep: { pandava: 1 }, duty: { conscience: 1 } } },
        { id: "worry", t: "Wonder aloud what Duryodhana will do now", fx: { skill: { statecraft: 1 } }, text: "An old man at the well looks at you sharply. \"Nothing good,\" he says." },
        { id: "shrug", t: "Shrug. Kings and their weddings are nothing to you", fx: { rep: { common: 1 } } }
      ],
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
      next: "a3_courttest"
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
      id: "a3_rajasuya", act: 3, age: 29, canon: true, place: "Indraprastha", travel: "All the kings of Bharata go to Indraprastha for Yudhishthira's great sacrifice, and you go too.", art: "scene_rajasuya", plate: ["#6f8fd8", "#d4a84b"], caption: "The hall that Maya built",
      title: "The Rajasuya",
      witness: [
        "Yudhishthira performs the Rajasuya sacrifice and is proclaimed emperor. When King Shishupala insults Krishna past all bearing, Krishna's discus ends his life, and the gathered kings fall silent.",
        "Duryodhana stays to see the wonders of the hall built by the architect Maya. He mistakes a polished floor for water and lifts his robes, then walks into real water and falls in. Bhima laughs, and the servants laugh with him."
      ],
      body: ["You are standing near the pool when Duryodhana comes up, soaked and shaking with rage."],
      choices: [
        { id: "laugh", t: "Laugh with everyone else", fx: { bond: { bhima: 1, duryodhana: -2 }, memory: ["duryodhana", "You laughed when he fell in the water."] } },
        { id: "help", t: "Give Duryodhana your hand and a dry cloak", fx: { bond: { duryodhana: 2 }, duty: { conscience: 1 }, memory: ["duryodhana", "You helped him out of the water when everyone was laughing."] } },
        { id: "listen", t: "Follow Duryodhana and Shakuni and listen",
          peril: { kind: "death", art: "scene_rajasuya", caption: "Behind a curtain in Maya's hall", text: "The curtain moves behind you. Shakuni's man is there before you can turn, and his hand is over your mouth.",
            deathText: "{They} listened behind a curtain at Indraprastha, and Shakuni's men made sure {they} never told what {they} heard." }, req: { any: [{ path: "spy" }, { teacher: "vidura" }, { attr: ["grace", 4] }] }, locked: "You would need to be quiet on your feet.",
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
