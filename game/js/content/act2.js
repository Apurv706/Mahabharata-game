/* Act II — Training (ages 14–20). PRD §6, §7 teachers, §8 paths. */
(function (K) {
  "use strict";
  const COURTISH = ["hastinapura", "anga", "gandhara", "matsya"];
  const pathChoice = (id, t, extra = {}) => ({
    id, t, fx: Object.assign({ set: { path: id }, skill: { [K.PATHS[id].skill]: 2 }, journal: "You chose the path of the {path!}." }, extra),
    hint: K.PATHS[id].desc
  });

  K.scenes([
    {
      id: "a2_teacher", act: 2, age: 14, art: "scene_teacher", place: "Hastinapura and beyond", caption: "The training grounds at dawn",
      title: "Who will teach you?",
      body: (S) => [
        "You are fourteen. Drona, a brahmin who knows the secrets of every weapon, now teaches the Kuru princes. Every family with ambition wants a place near him.",
        S.origin === "nishada" ? { memory: "In your village they still speak of Ekalavya, who asked Drona to teach him and was turned away." } : null,
        S.origin === "panchala" ? { aside: "Drona hates your king, Drupada. Whether he will hold that against a child of Panchala, no one can say." } : null,
        "A teacher shapes your skills, and you will owe them for the rest of your life."
      ],
      choices: [
        { id: "drona", t: "Ask Drona to take you as a student", req: { not: { origin: ["suta", "nishada"] } }, locked: "Drona refuses you. He teaches only those born to the royal and priestly orders.",
          fx: { set: { teacher: "drona" }, duty: { teacher: 5 }, skill: { archery: 2 }, rep: { kuru: 1 }, flag: "drona_student", journal: "Drona accepted you as a student." }, hint: "His fee may one day set you against your friends" },
        { id: "kripa", t: "Train with Kripa, preceptor of the Kuru house", req: { any: [{ origin: COURTISH }, { rep: ["kuru", 5] }] }, locked: "Kripa teaches those tied to the Kuru court.",
          fx: { set: { teacher: "kripa" }, duty: { teacher: 3, court: 2 }, skill: { mace: 1, archery: 1 }, journal: "Kripa took you into his school." }, hint: "His price is loyalty to the Kuru throne" },
        { id: "balarama", t: "Go to Balarama, who teaches the mace", req: { any: [{ origin: "dwaraka" }, { flag: "balarama_noticed" }] }, locked: "Balarama teaches Yadavas, and those he has seen fight.",
          fx: { set: { teacher: "balarama" }, duty: { teacher: 4 }, skill: { mace: 2 }, rep: { yadava: 2 }, journal: "Balarama agreed to teach you the mace." }, hint: "He will ask you to stay out of the war his family cannot avoid" },
        { id: "hermit", t: "Follow Mauni, the forest hermit who shoots blindfolded",
          fx: { set: { teacher: "hermit" }, duty: { teacher: 5, conscience: 1 }, skill: { archery: 1, stealth: 1, lore: 1 }, flag: "hermit_secret", journal: "Mauni the hermit took you as his student and made you promise never to say who taught you." }, hint: "He asks one thing: never say who taught you" },
        { id: "vidura", t: "Join Vidura's circle of scribes, envoys and listeners", req: { origin: ["hastinapura", "anga", "gandhara"] }, locked: "Vidura draws his people from the court.",
          fx: { set: { teacher: "vidura" }, duty: { teacher: 3, conscience: 1 }, skill: { statecraft: 2, stealth: 1 }, bond: { vidura: 2 }, journal: "You joined Vidura's circle." }, hint: "Vidura will judge every choice you make" },
        { id: "self", t: "Teach yourself, in secret, at night", fx: { set: { teacher: "self" }, skill: { archery: 1 }, attr: { aim: 1 }, flag: "self_taught", journal: "You taught yourself, alone, by night." }, hint: "No debt, and no one to protect you" }
      ],
      next: "a2_path"
    },
    {
      id: "a2_path", act: 2, age: 15, place: (S) => (S.teacher === "hermit" ? "Mauni's clearing" : S.teacher === "self" ? "A clearing at night" : "Your teacher's school"), art: "scene_path", plate: ["#3e8c72", "#d4a84b"], caption: "Your first year of training",
      title: "Your path",
      body: (S) => [
        (S.teacher === "self" ? "After a year, you know what you are good at. The path you choose now decides how you fight, and how you are useful when you are not fighting." : "After a year, {teacher} knows what you are good at. The path you choose now decides how you fight, and how you are useful when you are not fighting."),
        "Every path is open to you, wherever you were born. Some doors will still be harder to open than others."
      ],
      choices: [
        pathChoice("archer", "The bow, like Arjuna and Karna"),
        pathChoice("mace", "The mace and wrestling, like Bhima and Duryodhana"),
        pathChoice("charioteer", "The reins, like the great charioteers", { attr: { grace: 1 } }),
        pathChoice("strategist", "Strategy and statecraft, like Vidura", { attr: { command: 1 } }),
        pathChoice("healer", "Healing, which no one else at your school wants", { item: { herbs: 2 } }),
        pathChoice("spy", "Listening and carrying secrets", { attr: { grace: 1 } }),
        pathChoice("bard", "The songs and stories of the sutas", { attr: { wisdom: 1 } })
      ],
      next: "a2_ekalavya"
    },
    {
      id: "a2_ekalavya", act: 2, age: 16, canon: true, place: "The forest near Hastinapura", art: "scene_ekalavya", plate: ["#3e8c72", "#16131f"], caption: "A clay image in a forest clearing",
      title: "Ekalavya's fee",
      witness: [
        "On a hunt, the princes' dog barks at a dark-skinned boy in the forest. Seven arrows close its mouth without drawing blood. The boy is Ekalavya, a Nishada prince. Drona once refused to teach him, so he made a clay image of Drona and practised in front of it.",
        "He is a better archer than Arjuna. Arjuna reminds Drona of his promise that no one would surpass him.",
        "Drona asks Ekalavya for his fee as a student: his right thumb. Ekalavya cuts it off and gives it without a word."
      ],
      body: (S) => [
        S.teacher === "drona" ? "You are standing behind Drona when he asks." : "You are with the hunting party, holding the horses.",
        S.origin === "nishada" ? { memory: "He is from a village like yours. You know his mother's name." } : null
      ],
      choices: [
        { id: "speak", t: "Say out loud that this is wrong", fx: (S) => ({ duty: { conscience: 2, teacher: S.teacher === "drona" ? -2 : 0 }, bond: { arjuna: -1 }, rep: { common: 1 }, memory: ["drona", "You objected to the fee he asked of Ekalavya."] }) , hint: "Drona and Arjuna will remember" },
        { id: "silent", t: "Keep silent. It is between a teacher and a student", fx: { duty: { conscience: -1, teacher: 1 } } },
        { id: "tend", t: "Go back afterwards and bind Ekalavya's hand",
          check: { attr: "wisdom", skill: "healing", dc: 7,
            pass: { fx: { rep: { common: 2 }, duty: { conscience: 1 }, flag: "helped_ekalavya", journal: "You bound Ekalavya's hand. He thanked you and said he would learn to shoot with two fingers." }, text: "The wound is clean when you leave. Ekalavya says he will learn to draw a bow with two fingers. You believe him." },
            fail: { fx: { duty: { conscience: 1 }, flag: "helped_ekalavya" }, text: "You do what you can. It is not much. He thanks you anyway." } } },
        { id: "kin", t: "Walk away from Drona's party and stay with Ekalavya", req: { origin: "nishada" }, fx: { duty: { conscience: 3 }, rep: { common: 2, kuru: -2 }, flag: "stood_with_ekalavya", memory: ["all", "You chose your own people over the princes' hunt."] } }
      ],
      next: "a2_spar"
    },
    {
      id: "a2_spar", act: 2, age: 17, art: "scene_teacher", place: "The practice ground", caption: "Sparring at the practice ground",
      title: "The sparring trial",
      body: ["Before the princes' tournament, every student must prove themselves in a sparring bout. Your opponent is Ketan, the armourer's son, who has beaten everyone this season."],
      choices: [
        { id: "fight", t: "Take the bout", combat: "e_spar" },
        { id: "skip", t: "Train alone instead. You have nothing to prove", fx: { attr: { wisdom: 1 } } }
      ],
      next: "a2_tournament"
    },
    {
      id: "a2_tournament", act: 2, age: 17, canon: true, art: "scene_tournament", place: "Tournament grounds, Hastinapura", caption: "Karna walks into the arena",
      title: "The tournament",
      witness: [
        "Arjuna splits target after target, and the city roars for him. Then a stranger in golden armour walks into the arena and matches every feat. He is Karna. He challenges Arjuna to single combat.",
        { speaker: "Kripa", line: "\"Arjuna is Pandu's son, of the Kuru line. Name your father and your house, stranger. Princes do not duel nameless men.\"" },
        "Karna lowers his bow. Duryodhana rises in the royal box."
      ],
      body: (S) => [
        S.origin === "suta" ? { memory: "You know the old charioteer pushing through the crowd. Everyone in your lane knows Adhiratha." } : null,
        S.friend === "karna" ? { memory: "Karna is your closest friend. You know exactly what this moment is costing him." } : null,
        "You are standing in the stands."
      ],
      choices: [
        { id: "beside", t: "Step down and stand beside Karna", fx: { bond: { karna: 3, arjuna: -1 }, duty: { conscience: 1, court: -1 }, flag: "stood_with_karna", memory: ["karna", "You stood beside him when the arena laughed."] } },
        { id: "shout", t: "Shout the name of your own charioteer house beside his", req: { origin: "suta" },
          fx: { bond: { karna: 4 }, rep: { kuru: -2, common: 2 }, duty: { court: -2, family: 1 }, flag: ["stood_with_karna", "named_house"], memory: ["karna", "You said your father's trade out loud, in front of the princes."] } },
        { id: "princes", t: "Stay with the princes", fx: { duty: { court: 2, teacher: 1 }, bond: { karna: -2, arjuna: 2 }, flag: "stood_with_princes", memory: ["arjuna", "You stayed at his side."] } },
        { id: "silent", t: "Say nothing and watch", fx: { duty: { conscience: -1 }, bond: { karna: -1 }, flag: "silent_at_tournament", memory: ["karna", "You were in the stands, and you said nothing."] } },
        { id: "leave", t: "Leave the arena", fx: { rep: { kuru: -1 }, bond: { karna: 1 }, flag: "left_arena" }, hint: "Opens a hidden thread" }
      ],
      after: ["Duryodhana makes Karna king of Anga on the spot. When old Adhiratha comes forward to embrace his son, Bhima laughs at the charioteer's boy who would be king. The sun sets before the duel can begin."],
      next: "a2_drupada"
    },
    {
      id: "a2_drupada", act: 2, age: 18, canon: true, place: "The road to Panchala", art: "scene_drupada", plate: ["#c0472f", "#5c3361"], caption: "The road to Drupada's capital",
      title: "Drona's fee",
      witness: [
        "Their training is done, and Drona asks his students for his fee: bring him King Drupada of Panchala, the friend who once humiliated him, as a prisoner.",
        "The Kauravas ride first, and the Panchala army throws them back."
      ],
      body: (S) => [
        S.origin === "panchala" ? { memory: "Panchala is your home. Your mother's arrows are in those quivers." } : null,
        S.teacher === "drona" ? "Drona looks at each of his students in turn, and then at you." : "The army passes your door on its way east."
      ],
      choices: [
        { id: "ride", t: "Ride with Drona's students against Panchala", req: { teacher: "drona" }, combat: "e_panchala",
          resolve: (S) => (S.origin === "panchala" ? { duty: { conscience: -3, family: -2 }, memory: ["all", "You rode against your own homeland to pay your teacher."] } : null) },
        { id: "refuse", t: "Refuse to ride. Your fee will be paid some other way", req: { teacher: "drona" },
          fx: { duty: { teacher: -4, conscience: 1 }, rep: { panchala: 2 }, flag: "refused_dakshina", memory: ["drona", "You refused to help him take Drupada."] } },
        { id: "defend", t: "Defend Panchala's border villages", req: { origin: "panchala", not: { teacher: "drona" } }, combat: "e_border" },
        { id: "warn", t: "Run ahead and warn the villages on the road", req: { not: { teacher: "drona" } },
          check: { attr: "grace", skill: "stealth", dc: 7,
            pass: { fx: { rep: { panchala: 2, common: 1, kuru: -1 }, flag: "warned_panchala" }, text: "The villages empty before the army arrives. No one there dies that day." },
            fail: { fx: { rep: { kuru: -2 } }, text: "Kaurava outriders catch you on the road and send you home bruised. Your name is noted." } } },
        { id: "watch", t: "Stay out of it", fx: {} }
      ],
      after: [
        "Arjuna takes Drupada prisoner and lays him at Drona's feet. Drona keeps half of Panchala and gives the rest back, as a friend would.",
        "Drupada goes home and performs a great sacrifice. From the fire come a son born to kill Drona, and a daughter, Draupadi, who people say will bring the Kurus to ruin."
      ],
      next: "a2_vow"
    },
    {
      id: "a2_vow", act: 2, age: 19, art: "scene_vow", place: "The river ghat, at night", caption: "Lamps on the dark river",
      title: "A vow by the river",
      body: (S) => [
        S.flags.includes("left_arena") ? { memory: "Months ago, outside the arena, you found Adhiratha alone by the chariots. He told you Karna was found as a baby, floating down this river in a basket." } : null,
        "The river is full of lamps. People make vows here. A vow gives you strength, and breaking one marks you for life. You may hold up to three."
      ],
      choices: [
        { id: "retreat", t: "Swear never to retreat in battle", fx: { vowTake: "never_retreat" } },
        { id: "lie", t: "Swear never to speak a lie", fx: { vowTake: "never_lie", rep: { sages: 1 } } },
        { id: "unarmed", t: "Swear never to strike someone who cannot defend themselves", fx: { vowTake: "spare_unarmed", rep: { sages: 1, common: 1 } } },
        { id: "karna", t: "Swear never to raise a weapon against Karna", req: { bond: ["karna", 6] }, locked: "Needs a close bond with Karna.", fx: { vowTake: "spare_karna", bond: { karna: 1 } } },
        { id: "celibate", t: "Swear a vow of celibacy, as Bhishma did", fx: { vowTake: "celibacy", attr: { wisdom: 1 } } },
        { id: "none", t: "Make no vow", fx: {}, hint: "Nothing to keep, nothing to break" }
      ],
      next: "a3_secret"
    }
  ]);

  K.encounter({
    id: "e_spar", title: "The sparring trial", art: "scene_teacher", caption: "Blunted weapons, real bruises", lethal: false,
    intro: "Ketan bows, then comes at you fast.",
    enemies: [K.foe("Ketan, the armourer's son", 2, { hp: 40 })],
    win: { fx: (S) => ({ skill: { [K.PATHS[S.path].skill]: 1 }, duty: { teacher: 1 }, journal: "You won the sparring trial against Ketan." }), text: "Ketan yields, grinning through a bloody nose. Your teacher nods once, which is more than most students get." },
    lose: { fx: { attr: { wisdom: 1 } }, text: "Ketan wins. Afterwards he shows you exactly what you did wrong, and you never do it again." }
  });
  K.encounter({
    id: "e_panchala", title: "The raid on Panchala", art: "scene_drupada", caption: "Drupada's palace guard", lethal: false,
    intro: "Drupada's guard forms a line in the palace yard.",
    enemies: [K.foe("Panchala guard captain", 2), K.foe("Panchala archer", 1, { abilities: ["strike", "arrows"] })],
    win: { fx: { duty: { teacher: 2 }, rep: { panchala: -3, kuru: 1 }, journal: "You rode with Drona's students and helped take King Drupada." }, text: "The yard is yours. Arjuna's chariot is already at the palace steps." },
    lose: { fx: { duty: { teacher: 1 }, rep: { panchala: -1 }, injury: "scar" }, text: "You are knocked out of your chariot and wake up after it is over. Drona's prisoner is already in chains." }
  });
  K.encounter({
    id: "e_border", title: "The border villages", caption: "Kaurava raiders on the road", lethal: false,
    intro: "A band of Kaurava raiders turns off the road toward the village granary.",
    allies: ["charu"],
    enemies: [K.foe("Kaurava raider", 2), K.foe("Kaurava raider", 1)],
    win: { fx: { rep: { panchala: 3, kuru: -1, common: 1 }, flag: "defended_panchala", journal: "You defended the Panchala border villages." }, text: "The raiders ride back to the main army. The granary stands." },
    lose: { fx: { rep: { panchala: 1 } }, text: "You are beaten back, but the villagers saw who stood in the road for them." }
  });
})(window.K = window.K || {});
