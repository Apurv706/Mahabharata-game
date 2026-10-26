/* Act VI — The war, part 1: the eve of battle to the thirteenth day. PRD §10.
   The Bhagavad Gita is witnessed from a distance, never played (PRD §12.1). Death is a full ending. */
(function (K) {
  "use strict";
  const fighting = { side: ["pandava", "kaurava"] };
  const vasuNear = (S) => S.child === "vasu" && !S.dead.includes("vasu") && S.flags.includes("vasu_with_you");
  K.warAllies = (S) => {
    const a = ["soldiers"];
    if (vasuNear(S)) a.push("vasu");
    if (S.spouse === "revat" && !S.dead.includes("revat")) a.push("revat");
    if (S.friend === "charu" && !S.dead.includes("charu") && S.side !== "neutral") a.push("charu");
    if ((S.flags.includes("beat_ugra") || S.flags.includes("lost_to_ugra")) && !S.dead.includes("ugra")) a.push("ugra");
    return a;
  };
  const foeSide = (S) => (S.side === "kaurava" ? "Pandava" : "Kaurava");

  K.scenes([
    {
      id: "a6_eve", act: 6, age: 44, canon: true, war: true, art: "war_eve", place: "Kurukshetra, before the first day", caption: "Two armies facing each other",
      title: "Before the first arrow",
      witness: [
        "Eighteen armies face each other across the plain of Kurukshetra. Conch shells sound from both sides.",
        "Arjuna drives his chariot out between the two armies and looks at his teachers, his grandfather and his cousins on the other side. He puts down his bow. Krishna, his charioteer, speaks to him for a long time.",
        "You are too far away to hear the words. You only see Arjuna stand up at last and take up his bow again."
      ],
      body: (S) => [S.side === "neutral" ? "The healers' tents stand behind both armies. You will see everything from there." : "You are forty-four. Where do you take your place?"],
      choices: [
        { id: "front", t: "In the front line, with your weapon", req: fighting, fx: { flag: "role_front", duty: { court: 1 } } },
        { id: "chariot", t: "Driving a chariot for a warrior who needs one", req: { side: ["pandava", "kaurava"], skill: ["chariot", 2] }, locked: "You need some skill with a chariot.", fx: { flag: "role_chariot", skill: { chariot: 1 } } },
        { id: "command", t: "Commanding a company", req: { side: ["pandava", "kaurava"], any: [{ path: "strategist" }, { attr: ["command", 4] }] }, locked: "You need a strategist's training or a commander's presence.", fx: { flag: "role_command", attr: { command: 1 } } },
        { id: "healer", t: "In the healers' tents", fx: { flag: "role_healer", skill: { healing: 1 } } },
        { id: "bard", t: "Singing to the troops before every battle", req: { path: "bard" }, fx: { flag: "role_bard", skill: { lore: 1 } } }
      ],
      next: "a6_vasu"
    },
    {
      id: "a6_vasu", when: { child: "vasu", alive: "vasu" }, skipTo: "a6_day1",
      act: 6, age: 44, war: true, place: "Your tent, the night before", art: "scene_vasu", plate: ["#5c3361", "#16131f"], caption: "A lamp in a tent",
      title: "Vasu asks to ride with you",
      body: (S) => [
        "Vasu is sixteen. He has a sword, a borrowed shield and no idea what tomorrow is going to be like. He wants to be beside you.",
        S.flags.includes("vasu_gentle") ? { memory: "You raised him to be kind before he was brave. He is trying very hard to be both." } : null
      ],
      choices: [
        { id: "with", t: "Keep him beside you, where you can see him", req: fighting, fx: { flag: "vasu_with_you", bond: { vasu: 1 } } },
        { id: "camp", t: "Order him to stay in the camp", fx: { flag: "vasu_in_camp", bond: { vasu: -1 }, duty: { family: 1 } }, text: "He argues, then sulks, then obeys. The camp is behind the lines. It should be safe." },
        { id: "away", t: "Let him join another company. He has to learn without you", req: fighting, fx: { flag: "vasu_away", attr: { wisdom: 1 } } }
      ],
      next: "a6_day1"
    },
    {
      id: "a6_day1", act: 6, age: 44, canon: true, war: true, art: "war_bhishma", place: "Kurukshetra · days 1 to 9", caption: "Bhishma commands the Kaurava host",
      title: "Nine days of Bhishma",
      witness: ["For nine days Bhishma, the grandsire, commands the Kaurava army, and no one can stand against him. He has promised not to kill the Pandava brothers themselves. He kills nearly everyone else."],
      body: (S) => [
        S.side === "pandava" ? "On the first day you watch Prince Uttara of Matsya fall." : S.side === "kaurava" ? "On your side, the old man fights like a storm. It is hard not to feel safe behind him." : "The first wounded reach the tents before noon. By evening there is nowhere left to lay them.",
        S.side !== "neutral" && S.flags.includes("beat_ugra") ? { memory: "In the line beside you stands a big man with a miller's shoulders. Ugra. \"You put me on my back once,\" he says. \"I have waited thirty years to stand next to you instead.\"" } : null,
        S.side !== "neutral" && S.flags.includes("lost_to_ugra") ? { memory: "In the line beside you stands a big man with a miller's shoulders. Ugra. \"You were the only one who ever stood up to me,\" he says. \"You lost. You still stood up. I am with you.\"" } : null,
        S.side !== "neutral" && S.flags.includes("shamed_ugra") ? { memory: "Across the field, under the enemy's banners, there is a big man with a miller's shoulders. Ugra never forgave the crowd for laughing, or you for making them." } : null,
        "These are the days of first battles, first kills and first friends lost."
      ],
      choices: [
        { id: "fight", t: "Fight in the line", req: fighting, combat: "e_day1" },
        { id: "supply", t: "Guard the supply lines and the river crossings", req: fighting, fx: { duty: { court: 1 }, rep: { common: 1 } } },
        { id: "tend", t: "Work in the healers' tents through the nine days",
          check: { attr: "wisdom", skill: "healing", dc: 8,
            pass: { fx: { rep: { common: 2, sages: 1 }, skill: { healing: 1 }, journal: "In the first nine days of the war you saved more lives than you could count." }, text: "You stop counting the ones you save. You never stop counting the ones you lose." },
            fail: { fx: { rep: { common: 1 } }, text: "There are too many of them, and too few of you." } } }
      ],
      next: "a6_bhishma"
    },
    {
      id: "a6_bhishma", act: 6, age: 44, canon: true, war: true, place: "Kurukshetra · day 10", art: "scene_arrows", plate: ["#d4a84b", "#2a1c1f"], caption: "A bed of arrows at dusk",
      title: "The bed of arrows",
      witness: [
        "On the tenth day the Pandavas put Shikhandi at the front of Arjuna's chariot. Bhishma will not fight one who was born a woman, and lowers his bow. Arjuna's arrows bring the grandsire down.",
        "He falls on a bed of arrows, so many that his body does not touch the ground. He has the boon of choosing the hour of his death, and he chooses to wait."
      ],
      body: ["That night, warriors from both armies lay down their weapons and come to see him."],
      choices: [
        { id: "duty", t: "Ask him how a person can know their duty", fx: { attr: { wisdom: 1 }, bond: { bhishma: 1 }, journal: "On the bed of arrows, Bhishma told you that duty is subtle, and that keeping your word can still lead you into wrong." },
          text: "\"With difficulty,\" he says, and almost smiles. \"I kept my word all my life, and look where it has brought us.\"" },
        { id: "vows", t: "Ask him about the vows you have made", req: (S) => S.vows.length > 0, fx: { duty: { conscience: 1 }, bond: { bhishma: 1 } },
          text: "\"A vow is a promise to the person you will become,\" he says. \"Be careful what you promise them.\"" },
        { id: "water", t: "Bring him water", fx: { bond: { bhishma: 1 }, rep: { sages: 1 } }, text: "He thanks you, but he does not drink. Later Arjuna shoots an arrow into the earth, and a spring of clear water rises to the old man's lips." },
        { id: "away", t: "Stay away. You cannot face him", fx: {} }
      ],
      next: "a6_capture"
    },
    {
      id: "a6_capture", act: 6, age: 44, canon: true, war: true, art: "war_capture", place: "Kurukshetra · days 11 and 12", caption: "Drona takes command",
      title: "Take the king alive",
      witness: ["Drona takes command of the Kaurava army. Duryodhana wants one thing from him: capture Yudhishthira alive, so the war can be won with another game of dice. For two days Arjuna stays close to his brother, and the plan fails."],
      body: (S) => [S.side === "pandava" ? "Your company is posted beside the king's chariot." : S.side === "kaurava" ? "Your company is sent to break through to the king's chariot." : "Both days, the fighting is thickest around one chariot. The wounded come from there."],
      choices: [
        { id: "guard", t: "Guard Yudhishthira's chariot", req: { side: "pandava" }, combat: "e_guard" },
        { id: "hunt", t: "Drive for Yudhishthira's chariot", req: { side: "kaurava" }, combat: "e_hunt" },
        { id: "carry", t: "Carry the wounded off the field under fire",
          check: { attr: "grace", skill: "chariot", dc: 8,
            pass: { fx: { rep: { common: 2 }, duty: { conscience: 1 }, journal: "You carried the wounded off the field on the eleventh and twelfth days." }, text: "Seven trips into the dust and back. Seven people who will see their families again." },
            fail: { fx: { injury: "leg" }, text: "On the fourth trip a horse goes down on top of you." } } }
      ],
      next: "a6_day13"
    },
    {
      id: "a6_day13", act: 6, age: 44, canon: true, war: true, art: "scene_day13", place: "Kurukshetra · day 13", caption: "The wheel formation",
      title: "The wheel formation",
      lamp: (S) => (S.side === "kaurava" ? { secs: 30, silent: "ring", note: "The ring is closing. If the lamp burns out, you will hold your place in it." }
        : S.side === "pandava" ? { secs: 30, silent: "gate", note: "The breach will not stay open. If the lamp burns out, you will be at the gate with the others." } : null),
      witness: (S) => S.side === "kaurava" ? [
        "Drona sets the Chakravyuha, a spinning wheel of warriors. Arjuna has been lured away to the far end of the field.",
        "A boy of sixteen, Abhimanyu, Arjuna's son, has broken into its heart alone, and he is cutting through the finest warriors of your side. The order comes down the ring: close in around him."
      ] : [
        "Drona sets the Chakravyuha, a spinning wheel of warriors. Arjuna has been lured away to the far end of the field. Only his son Abhimanyu, sixteen, knows how to break in. He does not know the way out.",
        "He breaks through. The rest of you are meant to follow. At the breach, Jayadratha, with his boon, holds back every Pandava who tries."
      ],
      body: (S) => [
        S.side === "pandava" && S.flags.includes("stood_with_karna") ? { memory: "Inside the wheel you glimpse Karna's banner. You remember the arena, and who stood where." } : null,
        S.side === "kaurava" && S.bonds.karna >= 6 ? { memory: "Karna is in the ring. He does not look at you." } : null,
        S.side === "kaurava" && S.flags.includes("stood_with_princes") ? { memory: "You think of Arjuna, whose side you once stood at, and whose son this is." } : null,
        vasuNear(S) ? "Vasu is in the chariot behind yours. He is the same age as Abhimanyu." : null
      ],
      choices: [
        { id: "ride_in", t: "Drive into the breach after Abhimanyu", req: { side: "pandava" }, combat: "e_wheel", noAfter: true, hint: "There may be no way back" },
        { id: "gate", t: "Hold at the gate and try to force it open", req: { side: "pandava" }, combat: "e_gate" },
        { id: "pull_vasu", t: "Pull back to get Vasu out when the line breaks", req: (S) => S.side === "pandava" && vasuNear(S), tags: ["retreat"],
          fx: { duty: { family: 3 }, bond: { vasu: 3 }, flag: "saved_vasu_d13", journal: "On the thirteenth day you pulled back to save your son." } },
        { id: "ring", t: "Hold your place in the ring as ordered", req: { side: "kaurava" }, tags: ["strike_unarmed"],
          fx: { duty: { court: 2, conscience: -3 }, flag: "held_the_ring", memory: ["all", "You were part of the ring that closed on the boy."], journal: "On the thirteenth day you held your place in the ring that closed on Abhimanyu." } },
        { id: "refuse", t: "Refuse to close in on a lone boy", req: { side: "kaurava" },
          fx: { duty: { conscience: 3, court: -3 }, rep: { kuru: -2 }, flag: "refused_ring", memory: ["all", "You lowered your bow and would not close in."], journal: "On the thirteenth day you lowered your bow and would not close in on Abhimanyu." } },
        { id: "carry", t: "Leave the ring to carry a wounded boy out", req: { side: "kaurava" }, tags: ["retreat"], fx: { duty: { family: 1, court: -1, conscience: 1 }, flag: "carried_wounded" } },
        { id: "tend", t: "Work the tents behind the wheel", req: { side: "neutral" }, fx: { rep: { common: 1 }, flag: "tended_d13" } }
      ],
      after: ["Abhimanyu fights until his bow is broken, then with his sword, then with a chariot wheel. Many warriors surround him at once, and he falls. That night Arjuna swears to kill Jayadratha before the next sunset, or walk into fire."],
      next: "a6_day14"
    },
    {
      id: "a6_d13_inside", act: 6, age: 44, canon: true, war: true, art: "scene_day13", place: "Inside the Chakravyuha", caption: "The gap closing behind you",
      title: "Inside the wheel",
      body: (S) => [
        "You made it through the breach. Behind you, the gap has closed. Ahead, Abhimanyu is fighting alone against Drona, Karna, Kripa, Ashwatthama and Duryodhana's sons.",
        K.hasVow("never_retreat") ? { aside: "You swore never to retreat." } : null,
        vasuNear(S) ? { memory: "Vasu is somewhere on the other side of that wall of chariots." } : null
      ],
      choices: [
        { id: "stay", t: "Stay beside Abhimanyu to the end", fx: { die: true, flag: "died_with_abhimanyu", deathText: "You fell beside Abhimanyu in the heart of the wheel, on the thirteenth day.", bond: { arjuna: 3 } } },
        { id: "out", t: "Cut your way back out while you still can", tags: ["retreat"],
          resolve: (S) => (S.curses.some((c) => !c.fired) ? { fireCurse: "any", injury: "eye", flag: "curse_fired_wheel", journal: "Your curse struck in the wheel. You lost an eye fighting your way out." } : { injury: "arm", journal: "You fought your way out of the wheel with a ruined arm." }),
          text: "You turn the chariot and drive at the weakest part of the wall. You come out the other side bleeding, alone, and alive." }
      ],
      after: ["Abhimanyu fights until his bow is broken, then with his sword, then with a chariot wheel. Many warriors surround him at once, and he falls. That night Arjuna swears to kill Jayadratha before the next sunset, or walk into fire."],
      next: "a6_day14"
    }
  ]);

  const war = (K.warEncounter = (id, title, enemies, extra) => K.encounter(Object.assign({
    id, title, art: "scene_day13", lethal: true, curse: true, allies: K.warAllies,
    flee: { tags: ["retreat"] }, spare: true,
    deathText: "You fell at Kurukshetra."
  }, extra, { enemies })));

  // Something happens on the field once in each deadly fight, as the third round begins (combat.js).
  // Fights draw from the common ones unless they name their own in `events`.
  const each = (B, side, fn) => B.living(side).forEach(fn);
  K.BATTLE_EVENTS = {
    conch: { common: true, text: "A conch sounds behind your line, then a hundred more. Your side takes heart.",
      run: (B) => each(B, "friends", (u) => B.status(u, "inspired", 2)) },
    arrows: { common: true, text: "A cloud of arrows comes down out of the dust, on friend and foe alike.",
      run: (B) => B.units.forEach((u) => { if (u.hp > 1) u.hp = Math.max(1, u.hp - Math.max(1, Math.round(u.maxHp * 0.08))); }) },
    horse: { common: true, text: "A riderless horse bolts through the enemy line, dragging its reins. {t} is caught in the open.",
      run: (B) => { const t = K.pick(B.living("enemy")); B.status(t, "exposed", 2); return { t }; } },
    water: { common: true, text: "A water-carrier runs along your line under the arrows. Everyone drinks.",
      run: (B) => each(B, "friends", (u) => { u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.12)); }) },
    elephant: { common: true, text: "A maddened elephant tears through the press. {t} is thrown down in its path.",
      run: (B) => { const t = K.pick(B.living("enemy")); B.status(t, "stun", 1); return { t }; } },
    bhishma_p: { text: "Far down the line, Bhishma's palm-tree banner turns your way. His arrows fall like rain, and your line bends under them.",
      run: (B) => each(B, "friends", (u) => B.status(u, "weakened", 2)) },
    bhishma_k: { text: "Bhishma's palm-tree banner sweeps down the line. Where the old man passes, the enemy ranks break, and your side surges after him.",
      run: (B) => { each(B, "friends", (u) => B.status(u, "inspired", 2)); each(B, "enemy", (u) => B.status(u, "exposed", 1)); } },
    ghatotkacha_p: { text: "Ghatotkacha, Bhima's giant son, roars out of the dark above the torches. The men in front of you falter and look up.",
      run: (B) => each(B, "enemy", (u) => B.status(u, "weakened", 2)) },
    ghatotkacha_k: { text: "Something huge moves in the dark above the torches, laughing. Ghatotkacha, Bhima's giant son. Your line shrinks from him.",
      run: (B) => each(B, "friends", (u) => B.status(u, "weakened", 2)) },
    smoke: { text: "The tents are burning. Smoke rolls between you, and for a breath he cannot see you.",
      run: (B) => each(B, "player", (u) => B.status(u, "evade", 1)) },
    moon: { text: "A cloud slides across the moon. In the sudden dark he loses you for a breath.",
      run: (B) => each(B, "player", (u) => B.status(u, "evade", 1)) }
  };

  war("e_day1", (S) => "The line holds against the " + foeSide(S) + "s", (S) => [S.flags.includes("shamed_ugra") ? K.foe("Ugra, the miller's son", 3, { abilities: ["strike", "heavy"] }) : K.foe(foeSide(S) + " spearman", 3), K.foe(foeSide(S) + " chariot-warrior", 4, { abilities: ["strike", "arrows"] })], { art: "war_bhishma",
    caption: "Days one to nine", events: (S) => [S.side === "kaurava" ? "bhishma_k" : "bhishma_p"],
    win: { fx: { duty: { court: 1 }, rep: { common: 1 }, journal: "You survived the first nine days of the war." }, text: "When the conches sound at sunset, you are still standing." },
    lose: { deathText: "You fell in the first days of the war, when Bhishma was still unstoppable." },
    flee: { fx: { duty: { court: -1 } }, text: "You fall back with the broken line. No one blames you. You blame yourself." },
    spare: { fx: { duty: { conscience: 1 } }, text: "You let a wounded enemy crawl away. Someone else will kill him, or no one will." }
  });
  war("e_guard", "Guarding the king", [K.foe("Kaurava chariot-warrior", 4, { abilities: ["strike", "heavy", "arrows"] }), K.foe("Kaurava horseman", 3)], { art: "war_capture",
    caption: "Around Yudhishthira's chariot",
    win: { fx: { bond: { yudhishthira: 2 }, rep: { pandava: 2 }, journal: "You guarded Yudhishthira's chariot when Drona tried to take him alive." }, text: "The attack breaks against your line. Yudhishthira raises a hand to you as his chariot turns." },
    lose: { deathText: "You fell guarding Yudhishthira's chariot on the eleventh day." },
    flee: { fx: { rep: { pandava: -1 } }, text: "You fall back, and others close the gap you left." },
    spare: { fx: { duty: { conscience: 1 } }, text: "You let the last of them go." }
  });
  war("e_hunt", "The drive for the king", [K.foe("Pandava guard", 4, { abilities: ["strike", "guard", "heavy"] }), K.foe("Panchala archer", 3, { abilities: ["strike", "arrows"] })], { art: "war_capture",
    caption: "Yudhishthira's guard",
    win: { fx: { rep: { kuru: 2 }, bond: { duryodhana: 1 } }, text: "You break through the guard, just in time to see Arjuna's chariot arrive and end the attack." },
    lose: { deathText: "You fell trying to take Yudhishthira alive on the twelfth day." },
    flee: { fx: { rep: { kuru: -1 } }, text: "You pull back with the rest of the attack." },
    spare: { fx: { duty: { conscience: 1 } }, text: "You let a wounded guard crawl back to his lines." }
  });
  war("e_wheel", "Into the wheel", [K.foe("Kaurava chariot-warrior", 5, { abilities: ["strike", "heavy", "arrows"] }), K.foe("Sindhu guard", 4)], {
    caption: "Through the breach", flee: null, spare: false,
    win: { next: "a6_d13_inside", fx: { bond: { arjuna: 1 } }, text: "You are through the breach before it closes." },
    lose: { deathText: "You fell in the breach of the Chakravyuha, trying to follow Abhimanyu." }
  });
  war("e_gate", "Holding the gate", [K.foe("Jayadratha's guard", 4, { abilities: ["strike", "guard"] }), K.foe("Sindhu archer", 3, { abilities: ["strike", "arrows"] })], {
    caption: "The breach Jayadratha holds", rounds: 5, roundsText: "The gate never opens. But you held your ground in front of it.", spare: false,
    win: { fx: { flag: "could_not_break_through", memory: ["arjuna", "You were among those who could not break through."], journal: "On the thirteenth day you were among those who could not break through." }, text: "Whatever you do, Jayadratha's line does not break today. Nothing would have broken it." },
    lose: { deathText: "You fell at the breach of the Chakravyuha, trying to reach Abhimanyu." },
    flee: { fx: { duty: { conscience: -1 } }, text: "You pull back from the gate." }
  });
})(window.K = window.K || {});
