/* War storylines (PRD 18.13): Bhurishravas (#4) and your king falls (#6).
   Scenes here come before the war days through K.BEFORE, each only when it applies. Ids begin kb_
   (Bhurishravas, day 14) and kf_ (the kings, day 15).

   Who meets Bhurishravas: fighters on either side (front line, a chariot or a company; healers and
   bards stay in the tents) who are Yadava (born in Mathura or serving Dwaraka), lead a company
   (role_command), or are close to Satyaki (bond 4 or more). On the Kaurava side, also the Kuru court's
   own fighters (serving Hastinapura): Bhurishravas is a Kuru, of Bahlika's house, and the old court's
   levies stand in his division.
   Who meets the kings' fall: Pandava-side players born in Panchala or Matsya, or serving Drupada's or
   Virata's court (the court served comes first). The moment Dhrishtadyumna goes for Drona is also
   met by Drona's own students on either side.

   Canon is untouched: Arjuna's arrow takes Bhurishravas's arm and Satyaki beheads him; Drona kills
   Drupada and Virata, and Dhrishtadyumna kills Drona as he sits. The player holds, tries, carries,
   looks away, and is remembered for it.
   Flags: kb_held_full / kb_held_short / kb_fell_back, kb_tried_stop, kb_held_arms, kb_looked_away,
   kb_carried_body, kb_left_body, kb_said_*; kf_carried_king, kf_rode_with_dhrishta, kf_broke_debt,
   kf_tried_stop_d, kf_kept_away, kf_stood_between, kf_let_it_happen, kf_took_word, kf_stayed.
   S.kbHeld: the rounds Bhurishravas was held off Satyaki (0 to 6). S.missed: scenes passed by while
   away from the camp (a ride home), which K.BEFORE no longer offers (engine/flow.js). */
(function (K) {
  "use strict";

  Object.assign(K.PEOPLE, {
    satyaki: { name: "Satyaki", canon: true }, bhurishravas: { name: "Bhurishravas", canon: true },
    drupada: { name: "Drupada", canon: true }, virata: { name: "Virata", canon: true }, dhrishtadyumna: { name: "Dhrishtadyumna", canon: true }
  });
  // Bhurishravas needs a figure of his own in the fight (puppet.js loads after the content, so he
  // joins on the first scene). Satyaki has none, so his lines show his portrait.
  const PUPPETS = {
    bhurishravas: { pronoun: "he", headgear: "crown", crown: { gem: "#2f7d55", tall: 0.9, trim: "#6b4a2a" }, palette: ["#c08a56", "#efe6cf", "#c9a24e"], beard: true, item: "sword", stance: "proud", stage: "adult", size: 1.1 }
  };

  const has = (S, f) => S.flags.includes(f);
  const fighter = (S) => ["role_front", "role_chariot", "role_command"].some((f) => has(S, f));
  const yadava = (S) => S.origin === "mathura" || S.court === "dwaraka";
  const nearBhurishravas = (S) => fighter(S) && (
    S.side === "pandava" ? has(S, "role_command") || yadava(S) || (S.bonds.satyaki || 0) >= 4
      : S.side === "kaurava" ? has(S, "role_command") || yadava(S) || S.court === "hastinapura" : false);
  const HOLD = 6; // the most rounds before Arjuna's arrow comes
  const held = (S) => (S.kbHeld != null ? S.kbHeld : has(S, "kb_held_full") ? HOLD : 2);

  // Your king: the court you serve, else the land you were born in.
  const KINGS = { drupada: { who: "Drupada", home: "Kampilya" }, virata: { who: "Virata", home: "Viratanagara" } };
  const BY_LAND = { panchala: "drupada", matsya: "virata" };
  const kingOf = (S) => BY_LAND[S.court] || BY_LAND[S.origin] || null;
  const KP = (S) => KINGS[kingOf(S)] || KINGS.drupada;
  const pupil = (S) => S.teacher === "drona";
  const nearDrona = (S) => (S.side === "pandava" && (S.seen.includes("kf_fall") || pupil(S))) || (S.side === "kaurava" && pupil(S));

  // A test of your strongest kind: a hand on the sword arm (Might and Mace) or a voice that carries
  // (Command and Statecraft).
  const strongest = (S) => (K.attr("might", S) + (S.skills.mace || 0) >= K.attr("command", S) + (S.skills.statecraft || 0) ? { attr: "might", skill: "mace" } : { attr: "command", skill: "statecraft" });

  K.scenes([
    // ---------- Day 14: Bhurishravas ----------
    {
      id: "kb_drag", act: 6, age: 44, war: true, away: true, when: nearBhurishravas, skipTo: "a6_day14", next: "a6_day14",
      art: "fight_war_field", place: "Kurukshetra · day 14", caption: (S) => (S.side === "kaurava" ? "The Yadava guard closing in" : "Bhurishravas over Satyaki"),
      title: (S) => (S.side === "kaurava" ? "The Yadava guard" : "Satyaki in the dust"),
      body: (S) => (S.side === "kaurava"
        ? ["At noon word comes down the line: Bhurishravas has Satyaki down, out beyond the chariots. Satyaki's Yadava guard has seen it too, and is closing round the two of them.",
          "Bhurishravas is a Kuru, of Bahlika's house. Whatever happens out there, someone from his own side should be near it."]
        : ["All morning Satyaki has cut his way through the Kaurava divisions toward Arjuna. By noon his horses are dead and his sword arm is tired, and Bhurishravas finds him.",
          "When you reach them Satyaki is on his back in the dust. Bhurishravas has him by the hair and is dragging him, sword raised, while both armies watch."]),
      choices: [
        { id: "hold", t: "Get between them and hold Bhurishravas off", req: { side: "pandava" }, combat: "e_kb_hold", hint: "Every round you hold, Satyaki is hurt less" },
        { id: "through", t: "Cut through the Yadava guard to Bhurishravas", req: { side: "kaurava" }, combat: "e_kb_guard", hint: "Won by getting through, not by killing" }
      ]
    },
    {
      id: "kb_sits", act: 6, age: 44, war: true, away: true, art: "scene_bhurishravas", place: "Kurukshetra · day 14", caption: "A seat of arrows on the open field",
      title: "Bhurishravas sits down",
      body: (S) => {
        const n = held(S);
        return S.side === "kaurava"
          ? ["You come through as Bhurishravas spreads his arrows on the ground and sits down on them, facing the sun, his arm in the dust beside him. Satyaki is on his feet with a sword.",
            "You are thirty paces away. You run, and Satyaki's sword comes down before you are halfway."]
          : ["Bhurishravas looks at his arm in the dust, and then across the field at Arjuna's chariot. \"Not from you,\" he says. Then he spreads his arrows on the ground, sits down on them facing the sun, and closes his eyes to wait for death.",
            { memory: n >= 5 ? "Satyaki gets up with nothing worse than a cut scalp. You held long enough for that." : n >= 2 ? "Satyaki gets up bleeding from the head and the shoulder. It could have been worse." : "Satyaki gets up at last with his scalp opened and his shoulder cut through. You could not hold long enough." },
            "Satyaki picks up a sword.",
            K.hasVow("spare_unarmed", S) ? { aside: "You swore never to strike the unarmed." } : null];
      },
      choices: (S) => {
        if (S.side === "kaurava") return [
          { id: "carry", t: "Carry his body back to his men", fx: { rep: { kuru: 1 }, duty: { court: 1 }, flag: "kb_carried_body", memory: ["all", "You came for Bhurishravas, and carried him back to his own lines."], journal: "On the fourteenth day you came too late to save Bhurishravas, and carried him back to his own lines." },
            text: "You and two of his men carry him back to the Kuru lines on a broken chariot board. His men walk beside you the whole way and say nothing. They will remember who came." },
          { id: "leave", t: "Leave him. There is half a day still to fight", fx: { flag: "kb_left_body" }, text: "You leave him in the dust with his arrows. Someone else will carry him." }
        ];
        const st = strongest(S);
        return [
          { id: "stop", t: st.attr === "might" ? "Catch Satyaki's sword arm" : "Call out to Satyaki that the man is at prayer",
            fx: { duty: { conscience: 2 }, bond: { satyaki: -3 }, rep: { sages: 1 }, flag: "kb_tried_stop", memory: ["yudhishthira", "You tried to stop Satyaki's sword when Bhurishravas sat at prayer."], journal: "On the fourteenth day you tried to stop Satyaki from killing Bhurishravas at his prayer." },
            check: Object.assign({ dc: 9 }, st, {
              pass: { fx: { flag: "kb_stayed_a_breath" }, text: "For a breath Satyaki stops, and Bhurishravas finishes his prayer. Then Satyaki strikes." },
              fail: { text: "Satyaki goes past you as if you were not there. The sword comes down." } }) },
          { id: "arms", t: "Hold Bhurishravas's arm for Satyaki", tags: ["strike_unarmed"], fx: { duty: { conscience: -2 }, bond: { satyaki: 3 }, flag: "kb_held_arms", journal: "On the fourteenth day you held Bhurishravas's arm while Satyaki killed him at his prayer." },
            text: "You take his one arm and hold it. He does not fight you. He opens his eyes once to see who it is, and closes them again. Satyaki strikes." },
          { id: "away", t: "Look away", fx: { flag: "kb_looked_away" }, text: "You look at the ground. You hear it anyway." }
        ];
      },
      after: ["Both armies shout at once, that it was murder and that it was war. Satyaki says he swore long ago to kill any man who struck him while he lay on the ground."],
      next: "a6_day14"
    },
    // That night, at the council or around the fire, both camps argue whether it was dharma.
    {
      id: "kb_debate", act: 6, age: 44, war: true, away: true, when: (S) => S.seen.includes("kb_sits"), skipTo: "a6_day15", next: "a6_day15",
      art: (S) => (has(S, "role_council") ? "scene_war_council" : "battle_night"), place: "The camp, the night of day 14", caption: (S) => (has(S, "role_council") ? "The war council" : "Around the fire"),
      title: "Was it dharma?",
      body: (S) => [
        has(S, "role_council") ? "Late in the night the torches burn down, and both armies sleep where they stand. The council sits anyway, and before anyone speaks of tomorrow, it argues about Bhurishravas."
          : "Late in the night the torches burn down, and both armies sleep where they stand. Around your fire nobody sleeps. They are arguing about Bhurishravas.",
        S.side === "kaurava" ? { speaker: "One of Bhurishravas's men", line: "His arm was in the dust and his eyes were shut. Arjuna struck from behind another man's back, and Satyaki struck a man at prayer. Put that in your songs." }
          : { speaker: "Satyaki", line: "He dragged me by the hair while I lay on the ground. I swore long ago what I would do to the man who did that." },
        has(S, "kb_held_arms") ? { memory: "Someone says that you held the old man's arm for Satyaki. Nobody answers for you." }
          : has(S, "kb_tried_stop") ? { memory: "Someone says that you tried to stop Satyaki. Everyone looks at you, and Satyaki looks longest." }
          : has(S, "kb_looked_away") ? { memory: "Someone says you were there. \"What did you see?\" You saw the ground." }
          : has(S, "kb_carried_body") ? { memory: "\"You came for him,\" one of his men says to you. \"We saw.\"" }
          : has(S, "kb_left_body") ? { memory: "\"You were there,\" one of his men says to you. \"You left him in the dust.\"" } : null
      ],
      choices: (S) => [
        { id: "adharma", t: "Say it was not dharma, whichever side did it",
          fx: S.side === "kaurava" ? { duty: { conscience: 1 }, rep: { sages: 1, kuru: -1 }, flag: "kb_said_adharma" } : { duty: { conscience: 1 }, rep: { sages: 1 }, bond: { satyaki: -1 }, flag: "kb_said_adharma" },
          text: S.side === "kaurava" ? "\"He dragged a fallen man by the hair first,\" you say. \"None of it was dharma.\" His men look at you for a long time." : "\"He dragged a fallen man by the hair, and Satyaki cut down a man at prayer,\" you say. \"None of it was dharma.\" Satyaki gets up and leaves." },
        S.side === "kaurava"
          ? { id: "murder", t: "Say a man at prayer was murdered, and the Pandavas will answer for it", fx: { duty: { court: 1 }, rep: { kuru: 1 }, flag: "kb_said_murder" }, text: "His men beat their spear-butts on the ground. By morning the whole army is saying it." }
          : { id: "war", t: "Say a man who drags the fallen by the hair has no claim to mercy", fx: { duty: { court: 1 }, bond: { satyaki: 1 }, flag: "kb_said_war" }, text: "Satyaki nods at you. Nobody else says anything for a while." },
        { id: "silent", t: "Say nothing", fx: {}, text: "You say nothing. The argument goes round without you, and comes back, and goes round again." }
      ]
    },

    // ---------- Day 15: your king falls ----------
    {
      id: "kf_reach", act: 6, age: 44, war: true, away: true, when: (S) => S.side === "pandava" && !!kingOf(S), skipTo: "a6_day15", next: "a6_day15",
      art: "war_capture", place: "Kurukshetra · day 15", caption: "Two white parasols",
      title: (S) => (kingOf(S) === "virata" ? "Virata's parasol" : "Drupada's parasol"),
      body: (S) => ["In the grey before sunrise, after the night of torches, Drona drives his division at the Panchala and Matsya lines. Drupada and Virata ride out to meet him side by side, two old kings under white parasols.",
        ["You are a hundred paces behind {who}, and Drona's chariots are already closing the gap.", { who: KP(S).who }]],
      choices: [{ id: "reach", t: "Cut through to your king", combat: "e_kf_reach", hint: "Won by getting through, not by killing" }]
    },
    {
      id: "kf_fall", act: 6, age: 44, war: true, away: true, art: "scene_kings_fall", place: "Kurukshetra · day 15", caption: "A white parasol in the dust",
      title: "The king falls",
      body: (S) => ["You are thirty paces off when Drona's arrows find the two old kings, one after the other. Drupada falls, then Virata, and the white parasols go down in the dust. Drona's chariot turns away toward whatever is next in its way.",
        ["{who} is dead when you reach him. The arrows are still coming.", { who: KP(S).who }]],
      choices: [{ id: "carry", t: "Carry him off the field under the arrows", game: "steady", hint: "A test of strength under the arrows",
        trial: { attr: "might", skill: "mace", stage: "fight_war_field", verb: "Carry", secs: 16,
          help: "Hold to take his weight; let go when you stagger. Keep your feet over the glow until you reach the line.", tally: "Back to the line: {c}% · {s} seconds",
          wonLine: "You lay him down behind your own line.", nearLine: "Ten paces short, an arrow takes you in the shoulder.", lostLine: "An arrow takes you in the shoulder, and you go down under him.",
          rules: (S) => ["{who} is heavy in his armour, and Drona's archers are still loosing at anything that moves near the parasols. Carry him back to your own line: hold to take his weight, ease off when you stagger.", { who: KP(S).who }],
          stakes: ["You bring him back to his own people, and nothing touches you.", "An arrow finds you on the way. You still bring him back."] },
        win: { fx: (S) => ({ flag: "kf_carried_king", rep: { common: 1 }, journal: { src: "On the fifteenth day you carried {who} from the field under Drona's arrows.", p: { who: KP(S).who } } }),
          text: "You lay him down behind your own line. His charioteer's boy is there, and covers his face with the edge of his own cloth." },
        // A failure costs a wound, never the body: you still bring him back.
        lose: { fx: (S) => ({ flag: "kf_carried_king", injury: "arm", journal: { src: "On the fifteenth day you carried {who} from the field under Drona's arrows, and took an arrow doing it.", p: { who: KP(S).who } } }),
          text: "The arrow goes into your shoulder, and you go down under him. You get up. You bring him the rest of the way with one arm." } }],
      next: "a6_day15"
    },
    // The moment Dhrishtadyumna goes for Drona, after the half-truth (a6_day15).
    {
      id: "kf_drona", act: 6, age: 44, war: true, away: true, when: nearDrona, skipTo: "a6_day16", next: "a6_day16",
      art: "war_day15", place: "Kurukshetra · day 15", caption: "Drona with his bow laid down",
      title: "Dhrishtadyumna's sword",
      body: (S) => {
        const warned = S.log.includes("a6_day15:warn");
        return S.side === "kaurava"
          ? [warned ? "You rode to his chariot to tell him his son was alive, and he did not hear you. Now he lays his bow across his knees and closes his eyes, and you are ten paces away."
              : "The shout reaches you and you run. You reach Drona's chariot as he lays his bow across his knees and closes his eyes.",
            "Dhrishtadyumna is coming across the open ground on foot, with a sword in his hand.",
            { memory: "Drona taught you everything you know." }]
          : [warned ? "You told him his son was alive, and he did not hear you. Now he has laid his bow across his knees and closed his eyes." : "Drona has laid his bow across his knees and closed his eyes. All down the line men are still shouting that Ashwatthama is dead.",
            "Dhrishtadyumna jumps down from his chariot with a sword in his hand. His father's blood is still on his armour from the morning. He passes close enough to touch.",
            pupil(S) ? { memory: "Drona taught you everything you know." } : null];
      },
      choices: (S) => {
        if (S.side === "kaurava") return [
          { id: "step", t: "Step between Dhrishtadyumna and your teacher", fx: { duty: { teacher: 3, court: 1 }, flag: "kf_stood_between" },
            peril: { kind: "death", flag: "died_for_drona", art: "war_day15", caption: "Drona with his bow laid down", text: "His sword does not stop for you.",
              spareText: "His sword opens you from shoulder to hip. You wake in the healers' tents with a scar you will carry all your life.",
              deathText: "{They} stepped between Dhrishtadyumna's sword and Drona, {their} teacher, on the fifteenth day." },
            check: { attr: "might", skill: "mace", dc: 9,
              pass: { fx: { bond: { ashwatthama: 2 }, memory: ["ashwatthama", "You stood between my father and the sword."] }, text: "You are in his way, and then you are not: a shoulder, the flat of the sword, and you are in the dust and he is past you. You hear it from the ground." },
              fail: { fx: { injury: "arm" }, text: "His sword opens your arm to the bone, and he is past you before you hit the ground." } } },
          { id: "let", t: "Let it happen", fx: { duty: { teacher: -2, conscience: -1 }, flag: "kf_let_it_happen" }, text: "You do not move. Afterwards you cannot say why, and nobody asks." }
        ];
        // Drona's students feel this hardest: riding with him breaks the teacher's debt for good, and
        // Drona takes back the weapon he gave (its condition: never against one who cannot fight back).
        const p = pupil(S), takes = p && S.astra && S.astra.from === "drona" && !S.astra.broken && S.boons.includes("astra");
        const st = strongest(S);
        return [
          { id: "ride", t: "Ride with him", fx: Object.assign({ duty: p ? { conscience: -1, teacher: -10 } : { conscience: -1 }, bond: { dhrishtadyumna: 1 }, flag: p ? ["kf_rode_with_dhrishta", "kf_broke_debt"] : "kf_rode_with_dhrishta",
            journal: p ? "On the fifteenth day you rode with Dhrishtadyumna to your own teacher's chariot, and broke your debt to Drona for good." : "On the fifteenth day you rode with Dhrishtadyumna to Drona's chariot." }, takes ? { astraBreak: true } : {}),
            hint: p ? (takes ? "Your debt to Drona is broken for good, and he takes back the weapon he gave you" : "Your debt to Drona is broken for good") : null,
            text: "You ride at his wheel to Drona's chariot, and see him climb up into it. The old man does not open his eyes." },
          { id: "stop", t: st.attr === "might" ? "Catch Dhrishtadyumna's arm" : "Call out to Dhrishtadyumna to let the old man be",
            fx: { duty: p ? { conscience: 2, teacher: 2 } : { conscience: 2 }, bond: { dhrishtadyumna: -2 }, flag: "kf_tried_stop_d", journal: "On the fifteenth day you tried to stop Dhrishtadyumna's sword when Drona sat unarmed." },
            check: Object.assign({ dc: 9 }, st, {
              pass: { fx: { flag: "kf_saw_drona_go" }, text: "He stops for one breath. In that breath you see that the old man's face is already empty, as if he has gone somewhere else. Then Dhrishtadyumna pulls free and climbs into the chariot." },
              fail: { text: "He goes past you without turning his head, and climbs into the chariot." } }) },
          { id: "away", t: "Keep away", fx: { flag: "kf_kept_away" }, text: "You turn your horse away. Behind you the shouting changes, and you know it is done." }
        ];
      },
      after: ["When it is over, Ashwatthama hears how his father died. He swears by everything he knows that the Pandavas will pay."]
    },
    // That night the king's household asks you to take word home. Going means missing the rest of
    // the night in the camp; the war's road picks up again on the sixteenth day.
    {
      id: "kf_word", act: 6, age: 44, war: true, away: true, when: (S) => S.seen.includes("kf_fall"), skipTo: "a6_day16", next: "a6_day16",
      art: "scene_letter_camp", place: "The camp, the night of day 15", caption: "The king's ring in a cloth",
      title: "Word for home",
      body: (S) => [["That night {who}'s old steward finds you, with the king's ring wrapped in a cloth.", { who: KP(S).who }],
        ["\"Someone must take it home to the queen in {home},\" he says. \"Someone from home, not a runner.\"", { home: KP(S).home }]],
      choices: (S) => [
        { id: "home", t: ["Take the ring home to {home}", { home: KP(S).home }], hint: "You will miss the rest of the night in the camp",
          fx: { duty: { family: 2 }, flag: "kf_took_word", journal: { src: "On the night of the fifteenth day you took {who}'s ring home to the queen in {home}.", p: { who: KP(S).who, home: KP(S).home } } },
          resolve: (S2) => { const list = K.BEFORE.a6_day16 || [], i = list.indexOf("kf_word"); return { set: { missed: (Array.isArray(S2.missed) ? S2.missed : []).concat(list.slice(i + 1).filter((id) => !S2.seen.includes(id))) } }; },
          text: "You ride through the night with the ring against your chest. The queen takes it from your hand and does not open the cloth. By the time you are back at the lines, the sixteenth day's fighting has begun." },
        { id: "stay", t: "Stay with the army, and let him send a runner", fx: { duty: { court: 1 }, flag: "kf_stayed" }, text: "The steward nods and goes to find a runner. You stay where the king left you." }
      ]
    }
  ]);

  // ---------- Encounters ----------
  // Arjuna's arrow comes from very far away: Arjuna himself is never near enough to answer a call.
  const nearHelp = (S) => (S.friend === "arjuna" && !S.dead.includes("arjuna") ? { text: "You shout for Arjuna. He is far across the field, cutting his way toward Jayadratha, and his chariot does not turn." } : K.warHelp(S));
  const ARM = "an arrow from far across the field takes off his arm, sword and all.";
  K.encounter({
    id: "e_kb_hold", title: "Over Satyaki", art: "fight_war_field", caption: "Six rounds at most", hold: HOLD, hard: true, lethal: false, curse: true,
    allies: (S) => K.warAllies(S), callHelp: nearHelp, spare: false,
    holdText: "From very far away, an arrow is already in the air.",
    intro: "Bhurishravas lets go of Satyaki's hair and turns his sword on you. Behind you, Satyaki tries to get up, and cannot.",
    enemies: [K.foe("Bhurishravas", 9, { abilities: ["strike", "heavy"], hero: true, person: "bhurishravas", hp: 800, atk: 7 }), K.foe("Kuru spearman", 3)],
    beats: [
      { round: 3, text: "Behind you Satyaki gets to one knee and shouts your name. Your arm remembers what it is for.", run: (B) => B.living("player").forEach((u) => B.status(u, "inspired", 1)) },
      { round: 5, text: "Bhurishravas fights the old way, without a wasted step, and he is not tired yet.", run: (B) => B.living("player").forEach((u) => B.status(u, "exposed", 1)) }
    ],
    win: { next: "kb_sits", fx: { flag: "kb_held_full", bond: { satyaki: 3 }, journal: "On the fourteenth day you held Bhurishravas off Satyaki until Arjuna's arrow came." }, text: "You are still standing over Satyaki when " + ARM },
    lose: { next: "kb_sits", fx: (S) => ({ flag: "kb_held_short", bond: { satyaki: Math.floor(held(S) / 2) } }), text: "You go down in the dust beside Satyaki. Bhurishravas lifts his sword over him again, and " + ARM },
    flee: { tags: ["retreat"], next: "kb_sits", fx: (S) => ({ flag: "kb_fell_back", bond: { satyaki: Math.floor(held(S) / 2) - 1 } }), text: "You fall back. Bhurishravas turns to Satyaki again and lifts his sword, and " + ARM }
  });
  K.encounter({
    id: "e_kb_guard", title: "Satyaki's Yadava guard", art: "fight_war_field", caption: "Five rounds to get through", hold: 5, hard: true, lethal: false, curse: true,
    allies: (S) => K.warAllies(S), callHelp: K.warHelp, spare: false, flee: null,
    holdText: "The Yadava shields part. You are through.",
    intro: "The Yadavas lock their shields across your road. Beyond them, in the dust, Bhurishravas still has Satyaki down.",
    enemies: [K.foe("Satyaki's Yadava guard", 5, { plural: true, abilities: ["strike", "guard", "heavy"], hp: 300, atk: 6 }), K.foe("Yadava archers", 4, { plural: true, abilities: ["strike", "arrows"], hp: 180, atk: 5 })],
    win: { next: "kb_sits", text: "You come through the last of the guard in time to see " + ARM },
    lose: { next: "kb_sits", fx: { injury: "scar" }, text: "They throw you back twice. When you get through at last, bleeding, " + ARM }
  });
  K.encounter({
    id: "e_kf_reach", title: "Through Drona's division", art: "war_capture", caption: "Five rounds to the parasols", hold: 5, hard: true, lethal: false, curse: true,
    allies: (S) => K.warAllies(S), callHelp: K.warHelp, spare: false, flee: null,
    holdText: "The chariots in front of you give way.",
    intro: "Drona's chariots wheel between you and the two white parasols. Every one of them has the same order: keep the kings alone.",
    enemies: [K.foe("Drona's chariot-warriors", 5, { plural: true, abilities: ["strike", "arrows"], hp: 260, atk: 6 }), K.foe("Kaurava spearman", 4, { abilities: ["strike", "heavy"] })],
    beats: [{ round: 3, text: "Ahead, Drona's arrows are falling around the white parasols like rain on a pond.", run: (B) => B.living("player").forEach((u) => B.status(u, "inspired", 1)) }],
    win: { next: "kf_fall", text: "The last chariot in your way slews aside, and the ground ahead is open." },
    lose: { next: "kf_fall", fx: { injury: "scar" }, text: "They throw you back twice. You come through the third time with blood in your eyes, and late." }
  });
  // The holding fights stand on the war field's painting, tall on upright screens (ui/battle.js).
  Object.assign(K.COMMAND_FIGHT_BG = K.COMMAND_FIGHT_BG || {}, { e_kb_hold: "fight_war_field", e_kb_guard: "fight_war_field", e_kf_reach: "fight_war_chariot" });

  // How long Bhurishravas was held off Satyaki: counted when the fight ends, before its outcome.
  K.kbHoldCount = (B) => {
    if (!B || !B.over || B._kb || !B.enc || B.enc.id !== "e_kb_hold") return;
    B._kb = true;
    K.S.kbHeld = B.over === "win" ? HOLD : Math.max(0, Math.min(HOLD, B.round - 1));
  };
  K.on("combat", K.kbHoldCount);

  K.on("scene", () => {
    const S = K.S;
    if (K.PUPPETS) for (const [id, p] of Object.entries(PUPPETS)) if (!K.PUPPETS[id]) K.PUPPETS[id] = p;
    // Riding against your own teacher breaks the debt for good: nothing raises it again.
    if (has(S, "kf_broke_debt") && S.duty.teacher > 0) S.duty.teacher = 0;
  });

  // ---------- Where the scenes come ----------
  // Day 14 at noon, after the night's council and orders. The night debate comes before the day-15
  // council and dawn array (so first in its list); the kings fall in the morning, after them.
  // Dhrishtadyumna's sword and the word for home come straight after the half-truth, before the
  // night council, the truce at dusk and the sixteenth day's offers.
  const before = (id, list) => { K.BEFORE[id] = (K.BEFORE[id] || []).concat(list); };
  const first = (id, list) => { K.BEFORE[id] = list.concat(K.BEFORE[id] || []); };
  before("a6_day14", ["kb_drag"]);
  first("a6_day15", ["kb_debate"]);
  before("a6_day15", ["kf_reach"]);
  first("a6_day16", ["kf_drona", "kf_word"]);
  // The half-truth's closing line (Ashwatthama's oath) waits until Dhrishtadyumna's sword has fallen,
  // for those who are there to see it: kf_drona carries it instead.
  const d15 = K.SCENES.a6_day15;
  if (d15) { const was = d15.after; d15.after = (S) => (nearDrona(S) && !S.seen.includes("kf_drona") ? null : K.val(was, S)); }

  // ---------- What the telling says ----------
  (K.TELL_HOOKS = K.TELL_HOOKS || []).push((S, t, h) => {
    if (h("kb_held_full")) t.push("On the fourteenth day {they} stood over Satyaki against Bhurishravas until Arjuna's arrow came.");
    else if (h("kb_held_short") || h("kb_fell_back")) t.push("On the fourteenth day {they} tried to hold Bhurishravas off Satyaki, and could not hold for long.");
    if (h("kb_tried_stop")) t.push("When Bhurishravas sat down on his arrows to die, {they} tried to stop Satyaki's sword.");
    if (h("kb_held_arms")) t.push("When Bhurishravas sat down on his arrows to die, {they} held his arm for Satyaki.");
    if (h("kb_looked_away")) t.push("{They} {were} there when Satyaki killed Bhurishravas at his prayer, and looked at the ground.");
    if (h("kb_carried_body")) t.push("{They} carried Bhurishravas back to his own lines, and his men remembered who came.");
    if (h("kf_carried_king")) t.push(["On the fifteenth day {they} carried {who} from the field under Drona's arrows.", { who: KP(S).who }]);
    if (h("kf_took_word")) t.push(["{They} took {who}'s ring home to the queen in {home}.", { who: KP(S).who, home: KP(S).home }]);
    if (h("kf_broke_debt")) t.push("When Drona laid down his weapons, {they} rode at Dhrishtadyumna's wheel against {their} own teacher.");
    else if (h("kf_rode_with_dhrishta")) t.push("When Drona laid down his weapons, {they} rode at Dhrishtadyumna's wheel.");
    if (h("kf_tried_stop_d")) t.push("When Drona sat unarmed, {they} tried to stop Dhrishtadyumna's sword.");
    if (h("kf_stood_between") && S.alive) t.push("{They} stepped between Dhrishtadyumna and {their} teacher, and could not stop the sword.");
  });
})(window.K = window.K || {});
