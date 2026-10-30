/* Vows that matter (PRD §18.12): the friends who want you to break a vow, from the start, and the
   ways back (one heavy penance a life, and a scene with a friend you lost). These scenes come before
   a scene every road reaches (K.BEFORE), each only when it applies. */
(function (K) {
  "use strict";
  const friendIs = (S, ids) => [].concat(ids).includes(S.friend);
  const lostAlive = (S) => (S.lostFriends || []).find((x) => !S.dead.includes(x.who) && !(S.flags || []).includes("mend_tried_" + x.who));
  const atonable = (S) => S.vows.find((v) => v.broken && !v.released && !v.atoned);

  K.scenes([
    // Never to lie: your friend asks you to lie for them at court.
    {
      id: "v_word", when: (S) => K.hasVow("never_lie", S) && !!S.friend, skipTo: "a3_rajasuya", next: "a3_rajasuya", away: true,
      act: 3, age: 28, art: "scene_dice_question", place: "The king's court", caption: "A word before the court",
      title: "Swear it for me",
      body: (S) => friendIs(S, "duryodhana")
        ? ["One of Duryodhana's men has beaten a farmer half to death over a boundary stone. The farmer's family has come to the king's court. Duryodhana finds you in the corridor before the hearing.",
          { speaker: "Duryodhana", line: "You were on the road that evening. Say the farmer struck first. They will believe you. Everyone knows you never lie." }]
        : ["A granary steward is accused of selling the king's grain, and the night it went missing {friend} was with him, at a dice table no one is supposed to know about. If the court asks where the steward was, {friend}'s name comes out with his.",
          ["{friend} takes your arm in the corridor before the hearing. \"Say he was with you,\" {friend} whispers. \"They will believe you. Everyone knows you never lie.\"", null]],
      choices: [
        { id: "lie", t: "Swear what your friend asks", tags: ["lie"], fx: (S) => ({ bond: { [S.friend]: 2 }, duty: { conscience: -1 } }),
          text: "You say it, in a clear voice, and the court believes you. Your friend squeezes your arm afterwards. You do not feel the squeeze for long." },
        { id: "truth", t: "Tell the court only what you saw, and keep your friend out of it", check: { attr: "wisdom", skill: "statecraft", dc: 8,
          pass: { fx: { duty: { conscience: 1 } }, text: "You tell the truth, all of it that you saw, and nothing more. The court is satisfied. Your friend's name is never spoken." },
          fail: { fx: (S) => ({ bond: { [S.friend]: -1 } }), text: "You tell the truth, and the court asks one more question than you hoped. Your friend's name comes out. You did not say it, but you were there when it was said." } },
          hint: "Honest persuasion" },
        { id: "refuse", t: "Refuse. You will not lie, not even for a friend", fx: (S) => ({ bond: Object.assign({ [S.friend]: -2 }, S.friend === "duryodhana" ? { vidura: 1 } : { yudhishthira: 1 }), duty: { conscience: 1 } }),
          text: (S) => S.friend === "duryodhana" ? "Duryodhana stares at you, then laughs without any warmth and walks away. That evening Vidura sends for you, and says nothing about it, and pours you a cup of water himself." : "{friend} lets go of your arm. Later, Yudhishthira finds you on the steps and sits beside you for a while, without saying why." }
      ]
    },
    // Never to retreat: your friend is down, and the only way out is back.
    {
      id: "v_hold", when: (S) => K.hasVow("never_retreat", S) && !!S.friend && !S.dead.includes(S.friend), skipTo: "a5_charu", next: "a5_charu", away: true,
      act: 5, age: 40, art: "scene_raid", place: "A camp in the forest", caption: "Raiders at the river crossing",
      title: "Fall back",
      body: ["Raiders come over the river at dusk, more of them than anyone counted. {friend} takes a spear in the thigh and goes down beside you.",
        ["\"Fall back to the trees,\" {friend} gasps. \"Carry me. We can hold them at the trees.\" Falling back is the one thing you swore you would never do.", null]],
      choices: [
        { id: "carry", t: "Carry your friend back to the trees", tags: ["retreat"], fx: (S) => ({ bond: { [S.friend]: 2 }, memory: [S.friend, "You carried me out of the river crossing, and broke your vow to do it."] }),
          text: "You get {friend} over your shoulder and run. At the trees you turn, and hold, and the raiders give up before dark. Your vow is broken, and your friend is alive." },
        { id: "hold", t: "Hold the crossing, and shout for someone else to carry your friend", check: { attr: "might", skill: "mace", dc: 8,
          pass: { fx: { attr: { command: 1 } }, text: "You stand in the water and do not move, and others drag {friend} back to the trees. When the raiders break, you are still standing in the river." },
          fail: { fx: (S) => ({ bond: { [S.friend]: -2 }, injury: "leg" }), text: "You hold, and it costs you: a raider's axe across the leg. Someone gets {friend} to the trees, late. {friend} does not look at you when they bring you in." } },
          hint: "A test of might" },
        { id: "stand", t: "Stand over your friend and fight where you are", fx: (S) => ({ bond: { [S.friend]: -1 }, duty: { conscience: 1 } }),
          text: "You stand over {friend} until the raiders run out of courage. \"You would have let me bleed for your vow,\" {friend} says afterwards, and is not entirely joking." }
      ]
    },
    // Never to strike the unarmed: your friend wants a captive silenced.
    {
      id: "v_captive", when: (S) => K.hasVow("spare_unarmed", S) && !!S.friend, skipTo: "a5_karna_secret", next: "a5_karna_secret", away: true,
      act: 5, age: 43, art: "scene_secret", place: "A camp at night", caption: "A spy, bound at the wrists",
      title: "Before he talks",
      body: ["A spy is caught at the edge of the camp, a boy hardly older than you were when you first held a bow. He has seen where everyone sleeps.",
        ["{friend} draws you aside. \"If he gets back to his masters, we are all dead by the new moon,\" {friend} says. \"It has to be done, and it has to be you. The men will not do it.\"", null]],
      choices: [
        { id: "strike", t: "Do it, quickly, while he is bound", tags: ["strike_unarmed"], fx: (S) => ({ bond: { [S.friend]: 1 }, duty: { conscience: -3 }, memory: [S.friend, "You did the thing no one else would do, at the edge of the camp."] }),
          text: "It is quick. It is not clean. You wash your hands in the river for a long time, and they do not feel washed." },
        { id: "free", t: "Cut his bonds and let him run", fx: (S) => ({ bond: { [S.friend]: -2 }, rep: { common: 1 }, duty: { conscience: 1 } }),
          text: "The boy runs. You break camp before dawn and move everyone to the far side of the hills. {friend} does not speak to you for three days." },
        { id: "keep", t: "Keep him bound, and carry him with you until it no longer matters", check: { attr: "grace", skill: "stealth", dc: 7,
          pass: { fx: { duty: { conscience: 1 } }, text: "For a month he walks bound in the middle of the column, and when you let him go at last there is nothing left to tell. He thanks you, which you did not expect." },
          fail: { fx: (S) => ({ bond: { [S.friend]: -1 } }), text: "On the fourth night he slips his rope and is gone. You break camp in the dark. {friend} looks at you and says nothing, which says enough." } },
          hint: "A test of stealth" }
      ]
    },
    // Never to strike Karna: your friend wants you to loose at him, open in the ford.
    {
      id: "v_ford", when: (S) => K.hasVow("spare_karna", S) && ["arjuna", "bhima", "charu"].includes(S.friend) && !S.dead.includes("karna"), skipTo: "a5_karna_secret", next: "a5_karna_secret", away: true,
      act: 5, age: 43, art: "scene_cattle", place: "A ford, at the end of the hidden year", caption: "Karna in the river",
      title: "Open in the ford",
      body: ["Duryodhana's men come raiding for cattle at the end of the hidden year, and you are caught up in the fighting at a ford. Karna's chariot is stuck halfway across, the water to its axles, and he has his back to you.",
        ["\"Now!\" {friend} shouts. \"He will never be this open again. Loose!\"", null]],
      choices: [
        { id: "loose", t: "Loose at Karna", tags: ["strike_karna"], fx: (S) => ({ bond: { [S.friend]: 1 } }),
          text: "Your arrow takes him in the shoulder. He turns in the water and looks straight at you, and you will see that look for the rest of your life." },
        { id: "banner", t: "Loose at his banner instead, and let him go", check: { attr: "aim", skill: "archery", dc: 8,
          pass: { fx: { duty: { conscience: 1 } }, text: "The elephant-rope banner falls into the river. Karna's men lose heart, and the raid turns back. {friend} grumbles that it was a waste of a good shot, and buys you a drink that night." },
          fail: { fx: (S) => ({ bond: { [S.friend]: -1 } }), text: "Your arrow goes wide of the banner, and the chariot lurches out of the ford and away. {friend} says nothing, loudly." } },
          hint: "A test of aim" },
        { id: "lower", t: "Lower your bow", fx: (S) => ({ bond: { [S.friend]: -1, karna: 1 } }),
          text: "You lower your bow. Karna's chariot heaves out of the water, and as it passes he sees you, and nods once. {friend} stares at you as if you were a stranger." }
      ]
    },
    // The way back from a broken vow: one heavy penance in a life.
    {
      id: "v_penance", when: (S) => !!atonable(S) && !S.penanceDone, skipTo: "a5_side", next: "a5_side", away: true,
      act: 5, age: 44, art: "scene_ashram", place: "An ashram in the hills", caption: "A season of fasting",
      enter: (S) => ({ set: { penanceVow: atonable(S).id } }),
      title: "The penance",
      body: (S) => [["Before the armies gather, you go up into the hills to an old ashram, where the sage there will hear what you did. You swore “{vow!}”, and broke it.", { vow: K.VOWS[S.penanceVow].name }],
        "He tells you what it costs: a season of fasting and silence, sleeping on the ground, while the world goes to war without you for a while. It will not mend the vow. It may lift the shame."],
      choices: [
        { id: "atone", t: "Do the penance, the whole season of it", fx: (S) => ({ penance: S.penanceVow }),
          text: "You come down out of the hills thinner, quieter, and lighter in some way you could not explain. People look at you differently. Some of them, at least." },
        { id: "not", t: "Go back down. There is no time", text: "You go back down the hill. The sage does not seem surprised." }
      ]
    },
    // The way back to a friend you lost: only through a scene with that friend.
    {
      id: "v_mend", when: (S) => !!lostAlive(S), skipTo: "a5_side", next: "a5_side", away: true,
      act: 5, age: 44, art: "scene_journey", place: "A road before the war", caption: "An old friend, on the road",
      enter: (S) => ({ set: { mendWho: lostAlive(S).who } }),
      title: "The road back",
      body: (S) => [["Before the war, you hear that {who} is camped half a day's ride away.", { who: K.PEOPLE[S.mendWho].name }],
        "You have not spoken since the friendship ended. You could ride over. You could also not."],
      choices: [
        { id: "go", t: (S) => ["Ride over and find {who}", { who: K.PEOPLE[S.mendWho].name }], check: { attr: "wisdom", dc: 8, bonus: (S) => (S.penanceDone ? 1 : 0),
          pass: { fx: (S) => { const w = S.mendWho; return { reconcile: w, flag: "mend_tried_" + w, memory: [w, "You rode half a day to find me before the war. I had been hoping you would."] }; },
            text: "You find the camp at dusk. Neither of you says sorry. Neither of you has to. By the time the fire burns down you are laughing about something stupid from when you were ten." },
          fail: { fx: (S) => ({ flag: "mend_tried_" + S.mendWho }), text: "You find the camp at dusk. You are given water and a place by the fire, and a polite good night. Some doors, once shut, stay shut." } },
          hint: "Doing penance first would help" },
        { id: "no", t: "Let it be", fx: (S) => ({ flag: "mend_tried_" + S.mendWho }), text: "You ride on toward the war. You think about it more than you expected to." }
      ]
    }
  ]);
  K.BEFORE.a3_rajasuya = ["v_word"];
  K.BEFORE.a5_charu = ["v_hold"];
  K.BEFORE.a5_karna_secret = ["v_captive", "v_ford"];
  K.BEFORE.a5_side = ["v_penance", "v_mend"];
})(window.K = window.K || {});
