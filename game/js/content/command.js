/* Rising to command (PRD §18.3): the rungs above a company, the army battles a division officer
   sets, the four holding fights against the other side's champions, and the war council.
   Scenes come before a day's scene through K.BEFORE, each only when it applies and once.
   Flags: role_command (a company, from the eve of the war) → role_division → role_council;
   company_broken (the company is gone for the rest of the war); line_broken (the day's fight
   follows with the enemy inspired); held_<champion> / broke_<champion>; council_flank, council_truce,
   council_mercy, council_raid. */
(function (K) {
  "use strict";
  const fighting = { side: ["pandava", "kaurava"] };
  const won = (S) => K.record(S).last === "won";
  const foeSide = (S) => (S.side === "kaurava" ? "Pandava" : "Kaurava");
  // The paintings for each screen (arrived 31 Oct; docs/Art_Brief_New_Storylines.pdf).
  const STANDIN = {
    scene_war_council: "scene_war_council", stage_array_field: "stage_vyuha_top", scene_promotion: "scene_command_banner",
    fight_hold_karna: "fight_karna_chariot", fight_hold_duryodhana: "fight_duryodhana_line", fight_hold_arjuna: "fight_arjuna_chariot", fight_hold_bhima: "fight_bhima_charge"
  };
  K.COMMAND_STANDIN = STANDIN;
  const companies = (S) => { const a = K.warAllies(S); return [a[0]].concat(a.length > 1 ? ["ally"] : [], ["soldiers"]); };

  // ---------- Rank ----------
  K.RANKS = { role_council: "A seat at the war council", role_division: "Division officer", role_command: "Company leader" };
  K.rankOf = (S = K.S) => Object.keys(K.RANKS).find((f) => S.flags.includes(f)) || null;

  // ---------- The army battle, as a choice ----------
  const arrayChoice = (id, day, array) => ({
    id, t: "Set your division in the day's array", req: { flag: "role_division" }, game: "array", hint: "The orders are yours today",
    trial: { attr: "command", skill: "statecraft", kind: "war", array, rounds: day === 1 ? 4 : 6, stage: STANDIN.stage_array_field, companies: (S) => companies(S),
      rules: "The commander names the array and points at your part of the line. Put your companies on its marks. Then, round by round, the enemy pushes: hold, strike their flank, give ground, or send the reserve where they strike.",
      stakes: ["The line holds, and the day's fighting goes your way.", "The line breaks, and the day's fighting finds you with the enemy already through."] },
    win: { fx: { duty: { court: 1 }, attr: { command: 1 }, flag: "line_held_" + day, journal: "You set your division in the array and held the line to the end of the day." }, text: "When the conches sound at dusk the line is where it was at dawn. The commander says nothing, which from him is praise." },
    close: { fx: { flag: "line_held_" + day }, text: "The line bends and holds, and holds, and at dusk it is still a line." },
    lose: { fx: { flag: ["line_broken", "line_broke_" + day], duty: { court: -1 } }, text: "The line breaks in the middle of the afternoon. What is left of your division fights its way back to the camp in pieces, and the enemy is already through." }
  });

  // ---------- The holding fights ----------
  // Each is a fight that cannot be won by killing: the champion is held for N rounds, or the line breaks.
  const holdEnc = (id, title, hold, foes, extra) => K.encounter(Object.assign({
    id, title, hold, hard: true, lethal: false, curse: true, allies: K.warAllies, spare: false, flee: { tags: ["retreat"] },
    holdText: "The sun touches the horizon. You held.", art: STANDIN["fight_" + id] || "scene_day13", callHelp: K.warHelp
  }, extra, { enemies: foes }));
  holdEnc("hold_karna", "Karna's chariot, pinned", 6,
    [K.foe("Karna", 10, { abilities: ["strike", "arrows", "heavy"], hero: true, person: "karna", hp: 900, atk: 8 }), K.foe("Karna's charioteer", 4, { abilities: ["strike", "guard"] })],
    { caption: "Until sunset", intro: "The order is simple and impossible: keep Karna's chariot here, on this stretch of road, until the sun goes down. Not to beat him. To be in his way.",
      beats: [{ round: 2, text: "Karna's arrows come in a sheet. Your company's shields go up together.", run: (B) => B.living("friends").forEach((u) => B.status(u, "guard", 1)) },
        { round: 4, text: "He has found your charioteer. The horses are loose. You fight on foot now.", run: (B) => { const p = B.living("player")[0]; if (p) B.status(p, "weakened", 2); } }],
      win: { fx: { flag: "held_karna", rep: { pandava: 2 }, journal: "On the sixteenth day you kept Karna's chariot pinned on the road until sunset." }, text: "The sun goes down. Karna lowers his bow, looks at you once across the wreckage, and turns his chariot back toward his own lines." },
      lose: { fx: { flag: ["broke_karna", "company_broken"] }, next: "hold_broken", text: "The line in front of Karna's chariot breaks, and your company breaks with it." },
      flee: { fx: { flag: "broke_karna" }, text: "You pull back off the road. Karna's chariot rolls through where you stood." } });
  holdEnc("hold_duryodhana", "The king's flank", 8,
    [K.foe("Duryodhana", 9, { abilities: ["strike", "heavy"], hero: true, person: "duryodhana", hp: 800, atk: 6 }), K.foe("Kaurava spearman", 3)],
    { caption: "Eight rounds", holdText: "Yudhishthira's chariot has moved on. The flank is safe.",
      intro: "Duryodhana's division is coming at the king's flank, and yours is what stands between. Hold eight rounds and the king will be gone.",
      beats: [{ round: 3, text: "Duryodhana himself comes forward with his mace, roaring at his men to follow.", run: (B) => B.living("enemy").forEach((u) => B.status(u, "inspired", 2)) },
        { round: 7, text: "Your company is thinning. The ones who are left close the gaps without being told.", run: (B) => B.living("friends").forEach((u) => B.status(u, "guard", 1)) }],
      win: { fx: { flag: "held_duryodhana", bond: { yudhishthira: 2 }, journal: "You kept Duryodhana's division off Yudhishthira's flank for eight rounds." }, text: "The king's chariot is gone from the flank. Duryodhana sees it, and his face does something you will not forget." },
      lose: { fx: { flag: ["broke_duryodhana", "company_broken"] }, next: "hold_broken", text: "The flank gives way. Your company goes down around you." },
      flee: { fx: { flag: "broke_duryodhana" }, text: "You fall back. Others close the flank, late." } });
  holdEnc("hold_arjuna", "Against Arjuna's chariot", 6,
    [K.foe("Arjuna", 10, { abilities: ["strike", "arrows", "aimed"], hero: true, person: "arjuna", hp: 900, atk: 6 }), K.foe("Pandava chariot-warrior", 4, { abilities: ["strike", "arrows"] })],
    { caption: "Six rounds under the arrows", holdText: "A conch calls Arjuna's chariot away. You are still standing.",
      intro: "Arjuna's chariot is turning toward your stretch of the line. No one has stood in front of it and stayed. The order is to stand in front of it.",
      beats: [{ round: 2, text: "His arrows come faster than you can see them. Men fall on either side of you.", run: (B) => B.living("friends").forEach((u) => { if (u.side !== "player") u.hp = Math.max(1, u.hp - Math.round(u.maxHp * 0.15)); }) },
        { round: 4, text: "The white horses are close enough to see their eyes.", run: (B) => B.living("friends").forEach((u) => B.status(u, "weakened", 2)) }],
      win: { fx: { flag: "held_arjuna", rep: { kuru: 2 }, journal: "You stood against Arjuna's chariot for six rounds, and were still standing when it turned away." }, text: "Krishna turns the chariot toward some greater need, and Arjuna looks back once at the line that did not break." },
      lose: { fx: { flag: ["broke_arjuna", "company_broken"] }, next: "hold_broken", text: "The arrows do what arrows do. The line in front of Arjuna's chariot is gone." },
      flee: { fx: { flag: "broke_arjuna" }, text: "You pull back out of the arrows. No one who saw it blames you." } });
  holdEnc("hold_bhima", "Bhima's charge", 7,
    [K.foe("Bhima", 10, { abilities: ["strike", "heavy"], hero: true, person: "bhima", hp: 950, atk: 6 }), K.foe("Pandava footsoldier", 3)],
    { caption: "Seven rounds", holdText: "Bhima turns toward another part of the field, roaring. You held.",
      intro: "Bhima comes across the field like a wall falling, with his mace up and his brothers' names in his mouth. Stand against it for seven rounds.",
      beats: [{ round: 2, text: "The first charge hits. The front rank is simply not there any more.", run: (B) => B.living("friends").forEach((u) => { if (u.side !== "player") u.hp = Math.max(1, u.hp - Math.round(u.maxHp * 0.2)); }) },
        { round: 5, text: "He has seen your banner. He is coming for it.", run: (B) => { const p = B.living("player")[0]; if (p) B.status(p, "exposed", 2); } }],
      win: { fx: { flag: "held_bhima", rep: { kuru: 2 }, journal: "You stood against Bhima's charge for seven rounds." }, text: "Bhima wheels away toward the Kaurava princes he has sworn to kill. Your line is a ruin, and it is still a line." },
      lose: { fx: { flag: ["broke_bhima", "company_broken"] }, next: "hold_broken", text: "Bhima goes through your company like a hand through smoke." },
      flee: { fx: { flag: "broke_bhima" }, text: "You fall back before the charge reaches you. The men who stayed do not." } });

  const holdScene = (id, title, enc, when, skipTo, body, extra) => Object.assign({
    id, act: 6, age: 44, war: true, away: true, art: STANDIN["fight_" + enc], place: "Kurukshetra", caption: "A champion to hold", title, when, skipTo, next: skipTo,
    body, choices: [
      { id: "hold", t: "Hold them, with your division", combat: enc, hint: "Won by standing, not by killing" },
      { id: "decline", t: "Ask that another division take it", fx: { duty: { court: -1 } }, text: "Another division takes it. You hear how it went for them before nightfall." }
    ]
  }, extra || {});
  const ranked = (S) => S.flags.includes("role_division") || S.flags.includes("role_council");
  const flank = (S, which) => !S.flags.includes("council_flank") || S.flags.includes("council_flank_" + which);
  const once = (S, enc) => !S.seen.includes(enc + "_offer");

  K.scenes([
    // ---------- Rank: promotions ----------
    {
      id: "cmd_promotion_1", when: (S) => fighting.side.includes(S.side) && S.flags.includes("role_command") && !S.flags.includes("role_division") && K.attr("command", S) >= 4 && won(S),
      skipTo: "a6_bhishma", next: "a6_bhishma", away: true,
      act: 6, age: 44, war: true, art: STANDIN.scene_promotion, place: "The camp at night", caption: "After nine days", title: "Division officer",
      body: (S) => [S.side === "kaurava" ? "On the ninth night Bhishma sends for you. Your company has held every day it was asked to, and he has lost three division officers in nine days." : "On the ninth night Dhrishtadyumna sends for you. Your company has held every day it was asked to, and he has lost three division officers in nine days.",
        "\"Three companies,\" he says. \"Yours and two more. From tomorrow the array on your part of the line is yours to set.\""],
      choices: [
        { id: "accept", t: "Accept the division", fx: { flag: "role_division", duty: { court: 1 }, attr: { command: 1 }, journal: "After nine days of the war you were given a division: three companies, and the array on your stretch of the line to set." }, text: "He gives you the banner himself. It is heavier than it looks." },
        { id: "decline", t: "Ask to stay with your company", fx: { duty: { family: 1 }, bond: { charu: 1 } }, text: "\"Your company, then,\" he says. \"Keep them alive.\" You intend to." }
      ]
    },
    {
      id: "cmd_promotion_2", when: (S) => fighting.side.includes(S.side) && S.flags.includes("role_division") && !S.flags.includes("role_council") && K.attr("command", S) >= 5 && won(S) && !S.flags.includes("company_broken"),
      skipTo: "a6_day14", next: "a6_day14", away: true,
      act: 6, age: 44, war: true, art: STANDIN.scene_war_council, place: "The commander's tent", caption: "After the thirteenth day", title: "A seat at the council",
      body: (S) => [S.side === "kaurava" ? "After the wheel, Drona calls the council: Karna, Duryodhana, Shakuni, Kripa, Ashwatthama, and the officers whose divisions still stand. Yours stands. There is a mat for you at the edge of the lamplight." : "After the wheel, Yudhishthira calls the council: Krishna, Arjuna, Bhima, Dhrishtadyumna, Satyaki, and the officers whose divisions still stand. Yours stands. There is a mat for you at the edge of the lamplight.",
        "No one says what the seat means. Everyone knows."],
      choices: [
        { id: "sit", t: "Take the seat", fx: { flag: "role_council", duty: { court: 1 }, journal: "After the thirteenth day you were given a seat at the war council." }, text: "You sit. For a long time you only listen." },
        { id: "stand", t: "Stand at the back, as an officer should", fx: { duty: { conscience: 1 } }, text: "You stand at the back with the other officers. Later you will wonder what you might have said." }
      ]
    },

    // ---------- Army battles ----------
    {
      id: "cmd_array_1", when: (S) => ranked(S) && fighting.side.includes(S.side) && !S.flags.includes("company_broken"), skipTo: "a6_capture", next: "a6_capture", away: true,
      act: 6, age: 44, war: true, art: STANDIN.stage_array_field, place: "Kurukshetra · day 11, at dawn", caption: "The day's array", title: "Your part of the line",
      body: ["At dawn the commander rides along the line naming the day's array to each division officer in turn. He reaches you, names it, points at your stretch of the field, and rides on.", "Three companies, and the morning to put them where they belong."],
      choices: [arrayChoice("array", 1), { id: "line", t: "Let a senior officer set it, and fight in the line", fx: {}, text: "An older officer sets your division in the array. You take your place in it, like anyone." }]
    },
    {
      id: "cmd_array_2", when: (S) => ranked(S) && fighting.side.includes(S.side) && !S.flags.includes("company_broken"), skipTo: "a6_day15", next: "a6_day15", away: true,
      act: 6, age: 44, war: true, art: STANDIN.stage_array_field, place: "Kurukshetra · day 15, at dawn", caption: "The day's array", title: "The line after the night",
      body: ["The army that fought by torchlight is grey with tiredness. The commander names the array anyway, and points at your stretch of the field.", "The men you set today have not slept."],
      choices: [arrayChoice("array", 2), { id: "line", t: "Fight in the line today", fx: {}, text: "Someone else sets the array. You fight where you are put." }]
    },

    // ---------- Holding fights ----------
    holdScene("hold_karna_offer", "Karna's chariot", "hold_karna", (S) => S.side === "pandava" && ranked(S) && flank(S, "chariot") && !S.flags.includes("company_broken") && !K.hasVow("spare_karna", S) && !S.dead.includes("karna"), "a6_day17",
      ["On the sixteenth day Karna commands the Kaurava army, and his chariot goes where it likes. Dhrishtadyumna wants it kept on one stretch of road until sunset, so that the king's wing can withdraw.", "He does not say anyone will survive it. He asks whose division it will be."]),
    holdScene("hold_duryodhana_offer", "The king's flank", "hold_duryodhana", (S) => S.side === "pandava" && ranked(S) && flank(S, "division") && !S.flags.includes("company_broken"), "a6_day16",
      ["Duryodhana's division has found Yudhishthira's flank. The king must be got away, and someone must stand on the flank while it happens.", "Eight rounds, Dhrishtadyumna says. Eight rounds, and the king is gone."]),
    holdScene("hold_arjuna_offer", "Arjuna's chariot", "hold_arjuna", (S) => S.side === "kaurava" && ranked(S) && flank(S, "chariot") && !S.flags.includes("company_broken"), "a6_day16",
      ["Arjuna's white horses are turning toward your part of the line. Drona's order comes down the line ahead of them: stand, and keep standing, until something draws him away.", "Nobody who has stood in front of that chariot has told anyone what it was like."]),
    holdScene("hold_bhima_offer", "Bhima's charge", "hold_bhima", (S) => S.side === "kaurava" && ranked(S) && flank(S, "division") && !S.flags.includes("company_broken"), "a6_day17",
      ["Bhima is coming across the field toward the Kaurava princes, and your division is in the way. Karna, who commands now, sends one word: hold.", "Seven rounds, the runner says. Then he looks at your company, and does not say anything else."]),
    // After a broken line: fall back with a wound, be taken, or stay with the men who stayed.
    {
      id: "hold_broken", act: 6, age: 44, war: true, away: true, art: "scene_line_broken", place: "Kurukshetra", caption: "The line, after", title: "What is left",
      body: ["The line is gone. Your company is gone, or scattered, or lying where it stood. The champion's banner is already moving on to the next stretch of the field.", "There is a moment, no longer, in which you can still choose what happens to you."],
      choices: [
        { id: "back", t: "Fall back with the wounded", fx: { injury: "scar", journal: "Your company broke in front of the enemy's champion. You fell back with the wounded, and carried the mark of it." }, text: "You get the ones who can walk to the rear. You are one of them, barely." },
        { id: "rally", t: "Try to rally the scattered men", check: { attr: "command", skill: "statecraft", dc: 9,
          peril: () => ({ kind: "prison", by: "the enemy's soldiers", place: "A prisoners' pen behind the enemy's lines", text: "You are still shouting for the banner when the enemy's second rank reaches you. They take you alive, which is more than they do for most.", journal: "Rallying a broken division, you were taken by the enemy." }),
          pass: { fx: { flag: "rallied_broken", attr: { command: 1 }, journal: "Your company broke, and you rallied what was left of it under the banner before dusk." }, text: "Forty men. Then sixty. By dusk there is something that can be called a company again, standing around a torn banner." },
          fail: { fx: { injury: "arm" }, text: "Nobody hears you. A spear finds your arm while you are still shouting." } }, hint: "A test of command" },
        { id: "stay", t: "Stay with the men who stayed", fx: { die: true, deathText: "{They} stayed with the men who stayed, when the line broke in front of the enemy's champion, and fell with them.", flag: "stayed_with_the_line" }, hint: "This is the end of the story" }
      ],
      next: (S) => (S.flags.includes("broke_duryodhana") || S.flags.includes("broke_arjuna") ? "a6_day16" : "a6_day17")
    },

    // ---------- The war council ----------
    {
      id: "cmd_council_1", when: (S) => S.flags.includes("role_council") && fighting.side.includes(S.side), skipTo: "a6_day15", next: "a6_day15", away: true,
      act: 6, age: 44, war: true, art: STANDIN.scene_war_council, place: "The council tent, after the night of torches", caption: "The war council", title: "Which flank",
      body: ["The council sits late. Tomorrow's array is argued over, and then someone asks where your division will stand.", "You may ask for the flank where the enemy's chariots come, or the one where their divisions press. The council will give you what you ask."],
      choices: [
        { id: "chariot", t: "The flank where their chariots come", fx: { flag: ["council_flank", "council_flank_chariot"], duty: { court: 1 } }, text: "\"The chariots, then,\" the commander says, and writes nothing down, because he does not need to." },
        { id: "division", t: "The flank where their divisions press", fx: { flag: ["council_flank", "council_flank_division"], duty: { court: 1 } }, text: "\"The divisions, then.\" Someone at the far end of the tent lets out a breath he had been holding." },
        { id: "truce", t: "Argue for a truce at dusk, to gather the dead", fx: { flag: "council_truce", duty: { conscience: 1 }, rep: { common: 1 } }, text: "There is a silence. Then the oldest man at the council says that his father's war had such truces, and the matter is agreed before anyone can argue." }
      ]
    },
    {
      id: "cmd_council_2", when: (S) => S.flags.includes("role_council") && fighting.side.includes(S.side), skipTo: "a6_day16", next: "a6_day16", away: true,
      act: 6, age: 44, war: true, art: STANDIN.scene_war_council, place: "The council tent, the night Drona fell", caption: "The war council", title: "After Drona",
      body: (S) => [S.side === "kaurava" ? "Drona is dead. Karna will command tomorrow. Ashwatthama wants the Narayana weapon loosed on the whole Pandava army tonight, and half the tent agrees with him." : "Drona is dead, by a half-truth. Bhima wants Karna next, by any means. Half the tent agrees with him, and Yudhishthira will not look at anyone.",
        "The council turns, as councils do, to the officer who has said nothing yet."],
      choices: [
        { id: "mercy", t: (S) => (S.side === "kaurava" ? "Counsel against the weapon: it will take the war with it" : "Counsel that Karna be fought, not trapped"), fx: { flag: "council_mercy", duty: { conscience: 2 }, rep: { sages: 1 } }, text: "You say it. Some of them hate you for it. One or two will remember it when they are old." },
        { id: "war", t: "Counsel whatever ends the war soonest", fx: { duty: { court: 2, conscience: -1 } }, text: "You say it. The commander nods. It is what he wanted to hear." },
        { id: "silent", t: "Say nothing. It is not your council", fx: { duty: { conscience: -1 } }, text: "You say nothing. You think about it for the rest of your life." }
      ]
    },
    {
      id: "cmd_council_3", when: (S) => S.flags.includes("role_council") && fighting.side.includes(S.side), skipTo: "a6_day17", next: "a6_day17", away: true,
      act: 6, age: 44, war: true, art: STANDIN.scene_war_council, place: "The council tent, before the seventeenth day", caption: "The war council", title: "Before Karna's day",
      body: (S) => [S.side === "kaurava" ? "Karna will meet Arjuna tomorrow. Everyone in the tent knows it. Shakuni wants the king's own guard thrown at the Pandava flank to make it certain; Kripa wants the army kept whole." : "Arjuna will meet Karna tomorrow. Everyone in the tent knows it. Krishna says little. Bhima wants the whole army thrown at the Kaurava centre to make it certain; Yudhishthira wants the army kept whole for what comes after.",
        "The commander asks the council for one word each."],
      choices: [
        { id: "all", t: "Throw everything at it", fx: { flag: "council_all", duty: { court: 1 } }, text: "\"Everything,\" you say. The commander counts the word." },
        { id: "whole", t: "Keep the army whole for what comes after", fx: { flag: "council_whole", attr: { wisdom: 1 } }, text: "\"Whole,\" you say. Across the tent, an old man you have never spoken to nods at you." },
        { id: "raid", t: (S) => (S.side === "kaurava" ? "Warn against any night attack on the sleeping camp" : "Warn against striking Karna when he cannot fight back"), fx: { flag: "council_raid", duty: { conscience: 2 } }, text: "You say it out loud, into the lamplight. No one answers. Later, you will know whether anyone heard." }
      ]
    }
  ]);

  // Holding fights stand on their own painting, tall on upright screens (ui/battle.js).
  K.COMMAND_FIGHT_BG = { hold_karna: STANDIN.fight_hold_karna, hold_duryodhana: STANDIN.fight_hold_duryodhana, hold_arjuna: STANDIN.fight_hold_arjuna, hold_bhima: STANDIN.fight_hold_bhima };

  // Where each comes: before a day's scene, when it applies (other streams add to these lists too).
  const before = (id, pre) => { K.BEFORE[id] = (K.BEFORE[id] || []).concat(pre); };
  before("a6_bhishma", ["cmd_promotion_1"]);
  before("a6_capture", ["cmd_array_1"]);
  before("a6_day14", ["cmd_promotion_2"]);
  before("a6_day15", ["cmd_council_1", "cmd_array_2"]);
  before("a6_day16", ["cmd_council_2", "hold_duryodhana_offer", "hold_arjuna_offer"]);
  before("a6_day17", ["cmd_council_3", "hold_karna_offer", "hold_bhima_offer"]);
})(window.K = window.K || {});
