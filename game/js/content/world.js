/* World data: people, vows, boons, curses, origins, teachers, paths, courts, allies, glossary.
   Plain data. Prose is a working draft after the public-domain Ganguli translation (PRD §4.4). */
(function (K) {
  "use strict";
  K.FIRST_SCENE = "a1_home";
  K.ACT_TITLES = { 1: "Act I · Childhood", 2: "Act II · Training", 3: "Act III · Young adult", 4: "Act IV · The fracture", 5: "Act V · The exile years", 6: "Act VI · The war", 7: "Act VII · Aftermath" };

  const canon = (name) => ({ name, canon: true });
  const orig = (name) => ({ name, canon: false });
  Object.assign(K.PEOPLE, {
    karna: canon("Karna"), arjuna: canon("Arjuna"), bhima: canon("Bhima"), yudhishthira: canon("Yudhishthira"),
    duryodhana: canon("Duryodhana"), dushasana: canon("Dushasana"), drona: canon("Drona"), kripa: canon("Kripa"),
    vidura: canon("Vidura"), bhishma: canon("Bhishma"), draupadi: canon("Draupadi"), abhimanyu: canon("Abhimanyu"),
    ashwatthama: canon("Ashwatthama"), balarama: canon("Balarama"), shakuni: canon("Shakuni"), uttara: canon("Prince Uttara"),
    charu: orig("Charu"), mauni: orig("Mauni the hermit"), vasu: orig("Vasu"), madhavi: orig("Madhavi"), revat: orig("Revat"),
    bhadra: orig("Bhadra"), sudatta: orig("Sudatta the moneylender"), ugra: orig("Ugra")
  });

  Object.assign(K.VOWS, {
    never_retreat: { name: "Never to retreat", gift: "+1 attack in every fight. You cannot withdraw from a battle without breaking it." },
    never_lie: { name: "Never to speak a lie", gift: "Every court trusts your word." },
    spare_karna: { name: "Never to strike Karna", gift: "Karna trusts you completely. You may never fight him." },
    spare_unarmed: { name: "Never to strike the unarmed", gift: "Sages and common people honour you for it." },
    celibacy: { name: "A vow of celibacy", gift: "+1 Wisdom. You may not marry." },
    vengeance: { name: "A vow of vengeance", gift: "You will not rest until the wrong is answered." }
  });
  Object.assign(K.BOONS, {
    astra: { name: "A divine weapon (astra)", text: "Once per battle, a devastating strike. Turning it on someone who cannot fight back brings a curse." },
    foresight: { name: "Foresight", text: "A sage's blessing: you sense danger a moment before it comes." },
    healing_hands: { name: "Healing hands", text: "An ashram's teaching. You never run short of healing herbs before a battle." }
  });
  Object.assign(K.CURSES, {
    hermit: { name: "The hermit's curse", text: "You broke a promise to your teacher. At the worst hour, your skill will fail you.", fireText: "At the worst hour, the hermit's words come true. Your hands will not obey you." },
    sage: { name: "A sage's curse", text: "You mocked a sage. The curse is waiting.", fireText: "In the thick of the fighting, the sage's curse falls on you and your strength drains away." },
    astra_misuse: { name: "Curse of the misused astra", text: "You turned a divine weapon on the helpless.", fireText: "The weapon you misused grows heavy in your hands. It will not answer you cleanly again." }
  });
  Object.assign(K.INJURIES, {
    eye: { name: "Lost an eye", text: "You see the world from one side now.", attrs: { aim: -1 } },
    arm: { name: "A ruined arm", text: "Your sword arm never fully healed.", attrs: { might: -1 } },
    leg: { name: "A lame leg", text: "You walk with a limp.", attrs: { grace: -1 } },
    scar: { name: "Battle scars", text: "Scars that never fade.", attrs: {} }
  });

  K.ORIGINS = {
    hastinapura: { name: "Hastinapura", blurb: "Child of a palace official, raised beside the Kuru princes", detail: "Seat of the Kuru dynasty. You grow up close to the throne, among old families, soldiers and constant intrigue. You are always being watched.", fx: { duty: { court: 3 }, rep: { kuru: 2 }, skill: { statecraft: 1 }, attr: { command: 1 } } },
    panchala: { name: "Panchala", blurb: "Drupada's kingdom, Drona's old rival", detail: "A kingdom of archers and scholars that prizes skill over birth. Its king, Drupada, once humiliated his boyhood friend Drona, and Drona has not forgotten.", fx: { skill: { archery: 1 }, rep: { panchala: 3, kuru: -1 }, attr: { wisdom: 1 } } },
    matsya: { name: "Matsya", blurb: "King Virata's quiet land", detail: "Fields, lakes and horses under a gentle king. A small kingdom, often caught between larger ones. One day the Pandavas will hide here.", fx: { skill: { chariot: 1 }, duty: { family: 2 }, rep: { common: 1 }, attr: { grace: 1 } } },
    dwaraka: { name: "Dwaraka", blurb: "City of the Yadavas, by the western sea", detail: "An island city of traders, sailors and diplomats. The Yadavas are clever and proud, and when war comes they will fight on both sides.", fx: { skill: { statecraft: 1 }, rep: { yadava: 3 }, item: { herbs: 1 }, attr: { command: 1 } } },
    anga: { name: "Anga", blurb: "Karna's kingdom, gifted by Duryodhana", detail: "A wealthy kingdom on the Champa river, known for loyal people and skilled warriors. Here merit can rise above birth.", fx: { bond: { karna: 1 }, duty: { court: 1 }, skill: { mace: 1 }, attr: { might: 1 } } },
    suta: { name: "Charioteer family", blurb: "Raised among the sutas, like Karna", detail: "You grow up among horses, wheels and warriors, close to great men and never counted among them. Karna's foster father Adhiratha lives in your lane.", fx: { skill: { chariot: 2 }, bond: { karna: 2 }, rep: { kuru: -1, common: 2 } } },
    nishada: { name: "Nishada village", blurb: "Forest people outside the city order", detail: "A village of hunters and fishers between the river and the deep forest. You know the land better than any prince, and the cities look down on you.", fx: { skill: { archery: 1, stealth: 1 }, rep: { kuru: -2, common: 2 }, duty: { family: 2 } } },
    gandhara: { name: "Gandhara", blurb: "Shakuni's distant homeland", detail: "A crossroads kingdom in the far northwest, where many peoples meet. At the Kuru court you will always be a foreigner, and Shakuni will always assume you are his.", fx: { skill: { lore: 1 }, rep: { kuru: -1 }, attr: { wisdom: 1 } } }
  };
  K.TEMPERAMENTS = {
    bold: { name: "Bold", short: "+ Might", fx: { attr: { might: 1 } } },
    thoughtful: { name: "Thoughtful", short: "+ Wisdom", fx: { attr: { wisdom: 1 } } },
    devoted: { name: "Devoted", short: "+ Family duty", fx: { duty: { family: 2 }, item: { herbs: 1 } } },
    cunning: { name: "Cunning", short: "+ Grace, Stealth", fx: { attr: { grace: 1 }, skill: { stealth: 1 } } }
  };
  K.HEIRLOOMS = {
    bow: { name: "A worn bow", short: "+ Archery", fx: { skill: { archery: 1 } } },
    manuscript: { name: "A palm-leaf manuscript", short: "+ Lore", fx: { skill: { lore: 1 } } },
    amulet: { name: "An amulet", short: "Turns one killing blow", fx: { flag: "amulet_whole" } },
    debt: { name: "A family debt", short: "+ Family duty", fx: { duty: { family: 2 }, flag: "debt_owed" } }
  };

  K.TEACHERS = {
    drona: { name: "Drona, teacher of the princes", short: "Drona" },
    kripa: { name: "Kripa, preceptor of the Kuru house", short: "Kripa" },
    balarama: { name: "Balarama of the Yadavas", short: "Balarama" },
    hermit: { name: "Mauni, a hermit of the forest", short: "Mauni" },
    vidura: { name: "Vidura and his circle", short: "Vidura" },
    self: { name: "No one. You taught yourself", short: "no one" }
  };
  K.PATHS = {
    archer: { name: "Archer", skill: "archery", stat: "aim", abilities: ["aimed", "volley", "pin"], desc: "The master bowman: ranged damage, and the surest road to an astra." },
    mace: { name: "Mace fighter", skill: "mace", stat: "might", abilities: ["crush", "roar", "quake"], desc: "Raw strength. You stand in front and take the blows meant for others." },
    charioteer: { name: "Charioteer", skill: "chariot", stat: "grace", abilities: ["swerve", "ridedown", "rally"], desc: "The driver who sees the whole field. Speed, evasion and nerve." },
    strategist: { name: "Strategist", skill: "statecraft", stat: "command", abilities: ["command", "expose", "formation"], desc: "Advisor and commander. You make others stronger and find the gap in any line." },
    healer: { name: "Healer", skill: "healing", stat: "wisdom", abilities: ["salve", "steady", "nerve"], desc: "A vaidya, saving lives in a war of death." },
    spy: { name: "Spy and envoy", skill: "stealth", stat: "grace", abilities: ["feint", "vanish", "hamstring"], desc: "A duta who reads people, carries secrets and is never where the arrow lands." },
    bard: { name: "Bard", skill: "lore", stat: "wisdom", abilities: ["song", "verse", "hymn"], desc: "A suta storyteller. You keep the line standing, and you will tell what happened." }
  };
  K.COURTS = {
    hastinapura: { name: "Hastinapura", king: "Dhritarashtra" },
    indraprastha: { name: "Indraprastha", king: "Yudhishthira" },
    panchala: { name: "Panchala", king: "Drupada" },
    matsya: { name: "Matsya", king: "Virata" },
    dwaraka: { name: "Dwaraka", king: "Ugrasena" },
    anga: { name: "Anga", king: "Karna" },
    gandhara: { name: "Gandhara", king: "Subala" },
    nishada: { name: "the Nishada villages", king: "the village chief" },
    none: { name: "No court", king: "no one" }
  };
  K.HOME_COURT = { hastinapura: "hastinapura", panchala: "panchala", matsya: "matsya", dwaraka: "dwaraka", anga: "anga", suta: "anga", nishada: "nishada", gandhara: "gandhara" };

  // Allies who can fight beside you.
  K.UNITS = {
    charu: () => ({ name: "Charu", hp: 40, atk: 7, def: 2, abilities: ["strike", "heavy"], person: "charu" }),
    vasu: (S) => ({ name: "Vasu", hp: S.age >= 34 ? 44 : 26, atk: S.age >= 34 ? 8 : 4, def: 2, abilities: ["strike", "guard"], person: "vasu" }),
    madhavi: () => ({ name: "Madhavi", hp: 34, atk: 4, def: 1, abilities: ["strike", "salve"], person: "madhavi" }),
    revat: () => ({ name: "Revat", hp: 42, atk: 7, def: 2, abilities: ["strike", "swerve"], person: "revat" }),
    bhadra: () => ({ name: "Bhadra, an old soldier", hp: 48, atk: 7, def: 3, abilities: ["strike", "guard", "heavy"], person: "bhadra" }),
    spouse: (S) => (S.spouse && !S.dead.includes(S.spouse) ? K.UNITS[S.spouse](S) : null),
    soldiers: () => ({ name: "Your soldiers", hp: 50, atk: 6, def: 2, abilities: ["strike", "arrows"] })
  };

  K.GLOSSARY = {
    Akshauhini: "A full army division: chariots, elephants, horse and foot. Eighteen of them meet at Kurukshetra.",
    Ashram: "A forest hermitage where sages live and teach.",
    Astra: "A divine weapon, called up with a mantra. Granted only to a few, and dangerous to misuse.",
    Chakravyuha: "The spinning wheel formation Drona sets on the thirteenth day of the war.",
    Dharma: "Duty and right conduct. In this game it is not one rule but several duties that pull against each other.",
    Ghat: "Stone steps leading down to a river.",
    "Guru-dakshina": "The fee or service a student owes a teacher. A teacher may ask for it at any time.",
    Kauravas: "The hundred sons of King Dhritarashtra, led by Duryodhana.",
    Kurukshetra: "The plain where the war is fought, and the name of the war itself.",
    Nishada: "Forest peoples who live outside the cities' order. Ekalavya was a Nishada.",
    Pandavas: "The five sons of Pandu: Yudhishthira, Bhima, Arjuna, Nakula and Sahadeva.",
    Pratijna: "A solemn vow. Keeping it gives strength; breaking it marks you for life.",
    Rajasuya: "A great royal sacrifice that proclaims a king the overlord of others.",
    Sarathi: "A charioteer. A good one decides battles.",
    Suta: "A community of charioteers and bards. Karna was raised in a suta family.",
    Swayamvara: "A ceremony where a princess chooses her husband, often through a contest.",
    Vaidya: "A healer trained in the old medicine.",
    Vanaprastha: "Leaving home in later life to live in the forest.",
    Vyuha: "A battle formation. Each day of the war, the commanders set one."
  };
})(window.K = window.K || {});
