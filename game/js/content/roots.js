/* Act I roots: two scenes in the homeland before any journey, so each life has a home to remember.
   K.ROOTS: who in the family shaped you (sets S.kin, who comes back later in the story).
   K.CUSTOMS: a festival or custom of the homeland, and how you took part. */
(function (K) {
  "use strict";
  const kin = (name, fx) => Object.assign({ set: { kin: name } }, fx);

  K.ROOTS = {
    hastinapura: {
      body: "The palace stores are a city inside the city: grain, cloth, weapons, gifts from kings. Three people in your family seem to know every corner of it.",
      choices: [
        { id: "grandmother", t: "Grandmother Sumitra, who knows the name and the secrets of every lord at court", fx: kin("Sumitra", { skill: { statecraft: 1 } }), text: "She teaches you to listen more than you speak. \"Everyone in a palace is telling you something,\" she says, \"usually by accident.\"" },
        { id: "father", t: "Your father Devaka, who counts every sack and never loses one", fx: kin("Devaka", { attr: { wisdom: 1 } }), text: "He lets you keep the tally sticks. You learn that numbers tell the truth even when people do not." },
        { id: "cousin", t: "Your cousin Kirti, who stands guard at the palace gate", fx: kin("Kirti", { skill: { mace: 1 } }), text: "Kirti lets you hold the spear when no captain is looking, and shows you how a guard stands all night without falling asleep." }
      ]
    },
    panchala: {
      body: "The house smells of feathers, glue and river mud. Arrows lie drying on every roof beam. Three people in your family are always busy.",
      choices: [
        { id: "grandfather", t: "Grandfather Bhadrasena, who drew a bow in King Drupada's father's army", fx: kin("Bhadrasena", { skill: { archery: 1 } }), text: "His hands shake now, but when he puts a bow in yours he holds your elbow steady, and the arrow flies true." },
        { id: "mother", t: "Your mother Vrinda, who makes the best arrows in Kampilya", fx: kin("Vrinda", { skill: { healing: 1 } }), text: "You learn which feathers fly and which do not, and how to bind a cut finger so it heals clean. Arrowsmiths cut themselves often." },
        { id: "aunt", t: "Your aunt Kalindi, who ferries people across the Ganga", fx: kin("Kalindi", { attr: { grace: 1 } }), text: "She takes you out in her boat and lets you steer. You learn to read the river: where it is deep, where it lies." }
      ]
    },
    matsya: {
      body: "Your family's horses graze the lake meadows all summer. Three people in your family are always out among them.",
      choices: [
        { id: "grandmother", t: "Grandmother Sunanda, who can heal a horse that others would put down", fx: kin("Sunanda", { skill: { healing: 1 } }), text: "She shows you how to feel a leg for heat and how to make a poultice of river clay. Horses trust her, and soon they trust you." },
        { id: "father", t: "Your father Ajaka, who breeds horses for kings", fx: kin("Ajaka", { skill: { chariot: 1 } }), text: "He puts you on a horse before you can walk properly. By six you can harness a pair by yourself." },
        { id: "sister", t: "Your elder sister Tara, who rides in the summer races and wins", fx: kin("Tara", { attr: { grace: 1 } }), text: "Tara rides as if she were part of the horse. She lets you ride behind her, and tells you never to look at the ground." }
      ]
    },
    mathura: {
      body: "The house looks over the Yamuna ghats, and every day boats come in from up and down the river. Three people in your family each bring the river home differently.",
      choices: [
        { id: "uncle", t: "Your uncle Satyaka, who trades up and down the Yamuna", fx: kin("Satyaka", { skill: { statecraft: 1 } }), text: "He takes you to the ghats and teaches you to bargain in three dialects, badly. \"Smile first,\" he says. \"Then name the price.\"" },
        { id: "grandmother", t: "Grandmother Lavanya, who sings the old songs of the Yadava clans", fx: kin("Lavanya", { skill: { lore: 1 } }), text: "She knows the name of every Yadava chief for twenty generations, and a song for most of them. You learn half the songs by heart." },
        { id: "cousin", t: "Your cousin Megha, who swims the Yamuna in the flood season", fx: kin("Megha", { attr: { might: 1 } }), text: "Megha teaches you to swim against the current until your arms burn, and to let the river carry you when it is stronger than you. You never reach the far bank. Megha does, twice." }
      ]
    },
    anga: {
      body: "Your family has served in the Anga guard for four generations. Three people in your family taught you what that means, each in a different way.",
      choices: [
        { id: "father", t: "Your father Virasena, a captain of the guard", fx: kin("Virasena", { skill: { mace: 1 } }), text: "He drills you every morning in the courtyard, with a stick for a mace. \"A guard does not need to win,\" he says. \"A guard needs to still be standing.\"" },
        { id: "grandmother", t: "Grandmother Champavati, who keeps the shrine by the river", fx: kin("Champavati", { attr: { wisdom: 1 } }), text: "She lights the lamps at dusk and lets you help. She says the river has seen every king of Anga come and go, and will see the next ones too." },
        { id: "uncle", t: "Your uncle Hastika, a mahout with an elephant called Megharaja", fx: kin("Hastika", { skill: { chariot: 1 } }), text: "Megharaja lets you sit on her neck. Hastika teaches you the words an elephant answers to, and how to be patient with something much bigger than you." }
      ]
    },
    suta: {
      body: "Sutas drive the chariots of kings and sing the stories of kings, and your family does both. Three people in your family shaped what kind of suta you will be.",
      choices: [
        { id: "father", t: "Your father Dhruva, who drives for the Kuru nobles", fx: kin("Dhruva", { skill: { chariot: 1 } }), text: "He lets you walk the horses after a drive, and tells you a good charioteer is the calmest person on any battlefield." },
        { id: "grandmother", t: "Grandmother Saumya, a bard who has sung before three kings", fx: kin("Saumya", { skill: { lore: 1 } }), text: "She teaches you the first verses of the great stories, and how to watch a king's face while you sing, so you know when to stop." },
        { id: "brother", t: "Your elder brother Rathin, who mends wheels and axles", fx: kin("Rathin", { attr: { might: 1 } }), text: "You hold the wheel while Rathin hammers. Your arms ache every night, and grow strong." }
      ]
    },
    nishada: {
      body: "Your village lives between the river and the deep forest. Three people in your family each taught you a different part of that world.",
      choices: [
        { id: "grandmother", t: "Grandmother Malati, who knows every healing root in the forest", fx: kin("Malati", { skill: { healing: 1 } }), text: "She takes you into the forest at dawn and names every plant. Some heal, some kill, and a few do both, depending on the dose." },
        { id: "father", t: "Your father Sharabha, the best tracker in the village", fx: kin("Sharabha", { skill: { stealth: 1 } }), text: "He shows you how to read a broken twig, a bent blade of grass, a bird that stops singing. The forest is always talking, he says." },
        { id: "uncle", t: "Your uncle Nadija, who fishes the river at night", fx: kin("Nadija", { attr: { grace: 1 } }), text: "You learn to stand still in cold water for an hour, and to strike faster than a fish can turn." }
      ]
    },
    gandhara: {
      body: "Snow lies on the passes above your town most of the year, and caravans from the far west come through all summer. Three people in your family shaped you there.",
      choices: [
        { id: "grandfather", t: "Grandfather Ashvaka, who tames the wild mountain horses", fx: kin("Ashvaka", { skill: { chariot: 1 } }), text: "He tells you never to break a horse, only to persuade it. You spend a whole summer persuading one pony, and it works." },
        { id: "greataunt", t: "Your great-aunt Pushkala, who remembers songs in four languages", fx: kin("Pushkala", { skill: { lore: 1 } }), text: "Travellers stop at her door to hear her sing. You learn that every people has a story about a great war, and that the stories are always sad." },
        { id: "mother", t: "Your mother Uttama, who weaves the finest wool in the valley", fx: kin("Uttama", { attr: { wisdom: 1 } }), text: "She teaches you patience, one thread at a time. A whole shawl, she says, is only a thousand small decisions." }
      ]
    }
  };

  // Record which relative was chosen (grandmother, mother, cousin...), so later lines fit their age:
  // a grandparent will not still be alive when you are forty-five.
  Object.values(K.ROOTS).forEach((r) => r.choices.forEach((c) => { c.fx.set.kinRole = c.id; }));
  K.kinElder = (S) => ["grandmother", "grandfather", "greataunt"].includes(S.kinRole);

  K.CUSTOMS = {
    hastinapura: {
      title: "The king's procession", art: "home_hastinapura",
      body: "Once a year blind King Dhritarashtra is carried through the city on an elephant draped in gold, with Queen Gandhari, her eyes bound, beside him. The whole city comes out.",
      choices: [
        { id: "front", t: "Push through to the front to see the elephants", fx: { attr: { might: 1 }, flag: "saw_procession" }, text: "An elephant looks right at you as it passes. You will remember its eye for the rest of your life." },
        { id: "kitchens", t: "Slip away into the palace kitchens while everyone is watching", fx: { skill: { stealth: 1 } }, text: "Nobody stops you. You come home with sweets in both fists and the knowledge that a palace has many back doors." },
        { id: "names", t: "Stay with your family and learn the name of every lord who rides past", fx: { skill: { statecraft: 1 }, rep: { kuru: 1 } }, text: "By the end of the day you know thirty lords by their banners. Three of them, it turns out, owe your family money." }
      ]
    },
    panchala: {
      title: "The children's games at Kampilya", art: "home_panchala",
      body: "Every spring King Drupada holds archery games on the river meadow, and on the first day the children shoot at a straw deer.",
      choices: [
        { id: "shoot", t: "Enter the children's contest", check: { attr: "aim", skill: "archery", dc: 6,
          pass: { fx: { skill: { archery: 1 }, rep: { panchala: 1 }, flag: "won_kampilya" }, text: "Your arrow takes the straw deer through the neck. A royal servant gives you a wooden bow painted red. You sleep with it." },
          fail: { fx: {}, text: "Your arrow goes into the river. The crowd laughs kindly. You practise every day for the rest of the year." } } },
        { id: "stall", t: "Help at your family's arrow stall", fx: { duty: { family: 1 }, skill: { statecraft: 1 } }, text: "You sell more arrows than your mother expected. Archers like to buy from a child who knows what the fletching is for." },
        { id: "veterans", t: "Sit with the old soldiers and listen to them argue about the great archers", fx: { skill: { lore: 1 } }, text: "They argue about Bhishma, about Parashurama who taught him, and about a poor brahmin called Drona who studied beside King Drupada when they were boys. Everyone agrees about Bhishma." }
      ]
    },
    matsya: {
      title: "The cattle festival", art: "home_matsya",
      body: "At the end of the rains Matsya garlands its cattle, paints their horns and races its calves across the lake meadow. The children run the calves.",
      choices: [
        { id: "race", t: "Run a calf in the race", check: { attr: "grace", skill: "chariot", dc: 6,
          pass: { fx: { attr: { grace: 1 }, rep: { common: 1 }, flag: "won_calf_race" }, text: "Your calf wins by a nose. A royal steward comes over to look at it, and asks your father who trained it." },
          fail: { fx: {}, text: "Your calf stops halfway to eat a garland. Everyone remembers it for years. So do you." } } },
        { id: "lame", t: "Help your grandmother with a lame calf instead", fx: { skill: { healing: 1 }, duty: { conscience: 1 } }, text: "By the evening the calf is standing. Your grandmother says nothing, but she lets you carry her bag home." },
        { id: "song", t: "Lead the herding song as the cattle come home", fx: { skill: { lore: 1 }, rep: { common: 1 } }, text: "Your voice cracks on the high part. The cattle come home anyway, and the old herders nod at you." }
      ]
    },
    mathura: {
      title: "Lamps on the Yamuna", art: "custom_mathura",
      body: "On the full moon of Kartika, every family in Mathura sets a little leaf boat with a lamp on the Yamuna, for the ones who went away and the ones who will. Even King Kamsa's guards stop to watch.",
      choices: [
        { id: "reef", t: "Swim out to the sandbank with the older children", check: { attr: "might", skill: "stealth", dc: 6,
          pass: { fx: { attr: { might: 1 }, flag: "swam_the_reef" }, text: "You touch the sandbank and swim back with the lamps all around you, like stars on the water." },
          fail: { fx: { duty: { family: 1 } }, text: "The current turns you back. Your cousin pulls you out by the hair, and your mother does not let go of you all night." } } },
        { id: "traders", t: "Wander the traders' stalls along the ghats", fx: { skill: { statecraft: 1 }, rep: { yadava: 1 } }, text: "A trader from the far west lets you hold a glass bead the colour of the river at dusk. You trade a song for it." },
        { id: "boat", t: "Make the family's boat yourself, and name the people it is for", fx: { duty: { family: 1 }, attr: { wisdom: 1 } }, text: "You name your grandfather, whom you never met, and every boat your uncle has ever taken down the river. The little boat goes a long way." }
      ]
    },
    anga: {
      title: "The elephant day at Champa", art: "home_anga",
      body: "Once a year the elephants of Anga are painted, belled and led through Champa to bathe in the river, and the children run beside them.",
      choices: [
        { id: "ride", t: "Ride on your uncle's elephant at the head of the line", fx: { skill: { chariot: 1 }, flag: "rode_elephant" }, text: "From up there you can see the whole city, the river and the forests beyond. It looks small. You do not feel small." },
        { id: "flowers", t: "Carry flowers to the river shrine with your grandmother", fx: { rep: { sages: 1 }, duty: { conscience: 1 } }, text: "She lets you set the first lamp on the water. It does not go out, which she says is a good sign." },
        { id: "wrestle", t: "Wrestle the other guards' children on the riverbank", fx: { skill: { mace: 1 } }, text: "You lose twice and win once. The one you beat becomes your friend for the summer." }
      ]
    },
    suta: {
      title: "Blessing the horses", art: "home_suta",
      body: "On the charioteers' feast day, every horse in the royal stables is washed, garlanded and blessed, and the suta children help.",
      choices: [
        { id: "groom", t: "Groom the king's own horses until they shine", fx: { skill: { chariot: 1 } }, text: "The stablemaster inspects your work, says nothing, and gives you the hardest horse next year. That is praise." },
        { id: "bards", t: "Listen to the bards sing the deeds of charioteers", fx: { skill: { lore: 1 } }, text: "They sing of charioteers who turned battles, whom no one else remembers. You decide someone should." },
        { id: "race", t: "Race the other children with a borrowed cart", check: { attr: "grace", skill: "chariot", dc: 6,
          pass: { fx: { attr: { grace: 1 }, flag: "won_cart_race" }, text: "You win, and nearly tip over on the last turn. Your father pretends to be angry." },
          fail: { fx: {}, text: "The cart loses a wheel. You walk it back, carrying the wheel, while everyone cheers." } } }
      ]
    },
    nishada: {
      title: "The first hunt", art: "home_nishada",
      body: "At seven, Nishada children go with the hunters for the first time. They are meant to watch, and carry water, and come home with a story.",
      choices: [
        { id: "track", t: "Find the deer's trail before the hunters do", fx: { skill: { stealth: 1 }, flag: "first_trail" }, text: "You see the bent grass first. The hunters let you lead for an hour, and the whole village hears about it." },
        { id: "fawn", t: "Free a fawn caught in a snare, when no one is looking", fx: { duty: { conscience: 1 }, rep: { sages: 1 } }, text: "It runs off without looking back. Your father sees, and says nothing, and that evening gives you the best piece of the meal." },
        { id: "offering", t: "Make the offering to the river goddess with the old women", fx: { attr: { wisdom: 1 } }, text: "You learn the words that are said before a hunt and after it, asking forgiveness for what is taken. You never forget them." }
      ]
    },
    gandhara: {
      title: "The horse fair in the high valley", art: "home_gandhara",
      body: "Every summer the herders bring their horses down from the high pastures, and caravans from as far as the western deserts stop to trade.",
      choices: [
        { id: "pony", t: "Ride a mountain pony in the children's race", check: { attr: "grace", skill: "chariot", dc: 6,
          pass: { fx: { attr: { grace: 1 }, flag: "won_pony_race" }, text: "Your pony knows the way better than you do, and you let it. You win by a length." },
          fail: { fx: {}, text: "The pony stops dead at the river and you go over its head. You get up, laughing, and ride it across." } } },
        { id: "caravan", t: "Trade with the caravan people from the far west", fx: { skill: { statecraft: 1 } }, text: "You come away with a silver coin with a stranger's face on it, and a few words of a language no one at home speaks." },
        { id: "songs", t: "Sit with your great-aunt as she sings for the travellers", fx: { skill: { lore: 1 }, attr: { wisdom: 1 } }, text: "One traveller weeps at her song and gives her a ring. She gives it to you. \"Songs are worth more than rings,\" she says, \"but keep it anyway.\"" }
      ]
    }
  };

  K.scenes([
    {
      id: "a1_roots", act: 1, age: 6, art: (S) => "roots_" + S.origin, place: (S) => K.ORIGINS[S.origin].name, caption: (S) => K.ORIGINS[S.origin].region,
      title: "The people you came from",
      body: (S) => [K.ROOTS[S.origin].body, "Who shaped you most?"],
      choices: (S) => K.ROOTS[S.origin].choices,
      next: "a1_custom"
    },
    {
      id: "a1_custom", act: 1, age: 7, art: (S) => K.CUSTOMS[S.origin].art, place: (S) => K.ORIGINS[S.origin].name,
      title: (S) => K.CUSTOMS[S.origin].title,
      body: (S) => [K.CUSTOMS[S.origin].body],
      choices: (S) => K.CUSTOMS[S.origin].choices,
      next: "a1_journey"
    }
  ]);
})(window.K = window.K || {});
