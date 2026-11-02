/* War storylines (PRD 18.13): Yuyutsu's call: the only way to change sides (#1).
   Before the first arrow Yudhishthira calls across the field that anyone may still change sides, and
   Yuyutsu, Dhritarashtra's son, crosses to the Pandavas. Every fighter meets the call on the first
   morning (cross_call, before a6_day1):
   - on the Kaurava side you may cross with him. S.side becomes "pandava" and everything keyed by side
     follows it (the war days, command, letters, the map's camp). Every bond on the side you left falls
     by 3 and a friend for life there ends at once; a commander loses the company; crossing counts as
     retreat; the new side gives you a place, not trust (crossed_untrusted: no call for help, no rank)
     until you win a deadly fight. Flags: crossed_lines, crossed_to_pandava;
   - on the Pandava side you may call your sibling across (a test of statecraft against their loyalty):
     if they come they fight beside you for the war (S.calledAcross, K.warAllies); either way they
     remember. A friend for life on the other side (Duryodhana) can be called, and refuses: canon;
   - or stand still.
   On the second morning (cross_duel) your old side sends someone to bring you back or kill you: Ugra
   if he stood beside you, else Kanaka, a comrade of your old company. A caller whose sibling came
   fights beside them against the riders sent after them (cross_called).
   Scenes and encounters begin with cross_. The ending "The one who crossed" is in act7.js. */
(function (K) {
  "use strict";

  Object.assign(K.PEOPLE, { kanaka: { name: "Kanaka", canon: false }, yuyutsu: { name: "Yuyutsu", canon: true } });
  // A sibling who came across at your call fights beside you (K.warAllies, act6a.js).
  Object.assign(K.UNITS, {
    dev: () => ({ name: "Dev", hp: 44, atk: 7, def: 2, abilities: ["strike", "guard"], person: "dev" }),
    devi: () => ({ name: "Devi", hp: 40, atk: 7, def: 2, abilities: ["strike", "arrows"], person: "devi" })
  });

  const has = (S, f) => S.flags.includes(f);
  const crossed = (S) => has(S, "crossed_lines");
  K.crossedLines = crossed;
  const sibName = (S) => (S.sibling && K.PEOPLE[S.sibling] ? K.PEOPLE[S.sibling].name : "your sibling");
  const sibAlive = (S) => !!S.sibling && !S.dead.includes(S.sibling);
  // Who serves the Kuru throne, for the bonds that fall when you leave it.
  const KAURAVA = ["duryodhana", "karna", "dushasana", "drona", "kripa", "bhishma", "ashwatthama", "shakuni", "vikarna", "bhurishravas", "jayadratha", "shalya", "kritavarma"];
  // The one your old side sends after you: Ugra, if he stood beside you, else a comrade of your company.
  // Settled when the second morning comes (S.crossFoe), so the telling still names him afterwards.
  const duelFoe = (S) => S.crossFoe || (has(S, "ugra_left_behind") && !S.dead.includes("ugra") ? "ugra" : "kanaka");
  const foeName = (S) => (duelFoe(S) === "ugra" ? "Ugra" : "Kanaka");

  // What crossing costs, as one effect, so the choice can show it before you choose.
  function crossFx(S) {
    const bond = {}, flag = ["crossed_lines", "crossed_to_pandava", "crossed_untrusted", "role_front"], unflag = ["role_command", "role_chariot"];
    const people = KAURAVA.slice();
    if (K.ugraAlly && K.ugraAlly(S)) { people.push("ugra"); flag.push("ugra_left_behind"); }
    if (sibAlive(S) && has(S, "sibling_same_side")) { people.push(S.sibling); unflag.push("sibling_same_side"); flag.push("sibling_other_side_set", "sibling_left_behind"); }
    else if (sibAlive(S) && has(S, "sibling_other_side_set")) { unflag.push("sibling_other_side_set"); flag.push("sibling_joined"); }
    for (const w of people) if (S.bonds[w] != null && !S.dead.includes(w)) bond[w] = -3;
    // A friend for life on the side you leave: the friendship ends at once (core.js says farewell).
    const f = S.friend;
    if (f && KAURAVA.includes(f) && S.spouse !== f && !S.dead.includes(f)) bond[f] = -Math.max(3, (S.bonds[f] ?? 3) - 2);
    if (has(S, "role_command")) flag.push("company_left");
    return { set: { side: "pandava" }, unflag, flag, bond, duty: { court: -3 }, rep: { kuru: -3, pandava: 1 },
      memory: ["all", "You crossed the field on the first morning of the war, behind Yuyutsu."],
      journal: "On the first morning of the war you answered Yudhishthira's call and crossed the field to the Pandavas, behind Yuyutsu." };
  }
  const crossText = (S) => {
    const v = S.child === "vasu" && !S.dead.includes("vasu");
    if (v && has(S, "vasu_with_you")) return "You walk out of the line. Nobody stops you. Vasu catches up before you are halfway and walks beside you, and the whole field watches the two of you cross.";
    if (v && has(S, "vasu_in_camp")) return "You walk out of the line. Nobody stops you. The whole field watches you cross. That night Vasu finds his way over from the Kaurava camp and does not ask why.";
    if (v && has(S, "vasu_away")) return "You walk out of the line. Nobody stops you. You pass the company Vasu joined, and he does not look at you.";
    return "You walk out of the line. Nobody stops you. The whole field watches you cross, and the Pandava line opens a gap for you and closes behind you.";
  };

  K.scenes([
    {
      id: "cross_call", act: 6, age: 44, war: true, when: (S) => S.side === "pandava" || S.side === "kaurava", skipTo: "a6_day1", next: "a6_day1",
      art: "scene_yuyutsu_crossing", place: "Kurukshetra · the first morning", caption: "One man crossing the empty ground",
      title: "The call across the field",
      witness: [
        "Before the first arrow, Yudhishthira steps down from his chariot and calls across the field: anyone who wants to change sides may still do it, and will be welcome.",
        "No one moves. Then Yuyutsu, a son of Dhritarashtra by a maid of the palace, walks out of the Kaurava ranks alone and crosses the empty ground to the Pandavas."
      ],
      body: (S) => (S.side === "kaurava"
        ? ["The ground between the armies is empty again. The call still stands.",
          S.friend && KAURAVA.includes(S.friend) ? { memory: "{friend} is somewhere behind you in this army." } : null,
          K.hasVow("never_retreat", S) ? { aside: "You swore never to retreat. Walking out of your own line counts." } : null]
        : ["Yuyutsu walks into your lines. Men make room for him without quite looking at him.",
          sibAlive(S) && has(S, "sibling_other_side_set") ? ["Across the field, under the Kaurava banners, is {who}. The call still stands.", { who: sibName(S) }] : "Across the field the Kaurava ranks are very still."]),
      choices: (S) => (S.side === "kaurava" ? [
        { id: "cross", t: "Walk out after Yuyutsu, and cross to the Pandavas", tags: ["retreat"], fx: crossFx(S), hint: "The new side will give you a place. Trust comes later", text: crossText },
        { id: "stay", t: "Stay in your place in the line", fx: { duty: { court: 1 } }, text: "You stay. Beside you, someone lets out a breath." }
      ] : [
        sibAlive(S) && has(S, "sibling_other_side_set") ? { id: "call", t: ["Call across the field to {who}", { who: sibName(S) }], hint: "A test of wits",
          check: { attr: "wisdom", skill: "statecraft", dc: 10,
            // Their loyalty: a promise and a close bond make it easier; a quarrel harder.
            bonus: (S2) => (has(S2, "sibling_promise") ? 1 : 0) + ((S2.bonds[S2.sibling] ?? 0) >= 8 ? 1 : 0) - (has(S2, "sibling_quarrel") ? 1 : 0),
            pass: { fx: (S2) => ({ set: { calledAcross: S2.sibling }, unflag: "sibling_other_side_set", flag: ["called_across", "called_across_came"], bond: { [S2.sibling]: 2 },
                memory: [S2.sibling, "You called me across on the first morning, and I came."], journal: { src: "On the first morning of the war you called {who} across the field, and {who} came.", p: { who: sibName(S2) } } }),
              text: (S2) => ["{who} stands very still for a long moment. Then {who} hands the spear to the next soldier, walks out of the Kaurava line, and does not look back until you are side by side.", { who: sibName(S2) }] },
            fail: { fx: (S2) => ({ flag: "called_across", bond: { [S2.sibling]: 1 }, memory: [S2.sibling, "You called me across on the first morning. I could not come, and I have not forgotten that you asked."] }),
              text: (S2) => ["{who} hears you. Everyone hears you. {who} raises a hand, lowers it, and stays where {who} is.", { who: sibName(S2) }] } } } : null,
        S.friend === "duryodhana" && !S.dead.includes("duryodhana") ? { id: "call_friend", t: "Call across the field to Duryodhana", hint: "He will not come. He will remember",
          fx: { flag: "called_duryodhana", memory: ["duryodhana", "You called me across on the first morning, as if I were Yuyutsu."] },
          text: "Duryodhana hears you. Everyone hears you. He laughs once, and turns his chariot away." } : null,
        { id: "welcome", t: "Make room for Yuyutsu beside you", fx: { duty: { conscience: 1 }, flag: "welcomed_yuyutsu" }, text: "He takes the place, thanks you, and says nothing else all morning. He keeps looking back at his brothers' banners." },
        { id: "still", t: "Go back to your place. There is a war to fight", fx: { duty: { court: 1 } }, text: "You take your place. The conches begin." }
      ].filter(Boolean))
    },
    {
      // The second morning: the old side sends someone to bring you back, or not.
      id: "cross_duel", act: 6, age: 44, war: true, when: crossed, skipTo: "a6_day1", next: "a6_day1",
      art: "fight_between_lines", place: "Kurukshetra · between the lines, the second morning", caption: "Open ground, and both armies watching",
      travel: "You crossed the open ground behind Yuyutsu. The Pandava camp gave you a place to sleep, and no one spoke to you.",
      title: "Between the lines",
      enter: (S) => ({ set: { crossFoe: duelFoe(S) } }),
      body: (S) => [
        duelFoe(S) === "ugra" ? "On the second morning a big man with a miller's shoulders walks out of the Kaurava line and stops halfway across. It is Ugra, the miller's son, who stood in the line beside you yesterday morning."
          : "On the second morning a man walks out of the Kaurava line and stops halfway across. It is Kanaka, who shared your fire on the march to Kurukshetra.",
        duelFoe(S) === "ugra" ? { speaker: "Ugra", line: "I waited thirty years to stand next to you, and you stood there one morning. Come back, or come out here." }
          : { speaker: "Kanaka", line: "They sent me to bring you back. Or not to. Come out and we will see which." },
        "Both armies have stopped to watch.",
        has(S, "crossed_untrusted") ? { aside: "No one on this side of the field knows you yet. No one will come if you call." } : null
      ],
      choices: [
        { id: "meet", t: "Walk out and meet him", combat: "cross_e_duel", hint: "A deadly fight, with both armies watching" },
        { id: "refuse", t: "Stay in the line and let him wait", fx: { duty: { conscience: -1 }, flag: "refused_crossing_duel" },
          text: "He waits until the sun is high. Then he walks back, and the Kaurava line jeers, and the men around you say nothing at all." }
      ]
    },
    {
      // The second morning, for one who called a sibling across and was answered.
      id: "cross_called", act: 6, age: 44, war: true, when: (S) => has(S, "called_across_came") && !!S.calledAcross && !S.dead.includes(S.calledAcross), skipTo: "a6_day1", next: "a6_day1",
      art: "fight_between_lines", place: "Kurukshetra · the second morning", caption: "Riders from the Kaurava line",
      title: "Riders from the other side",
      body: (S) => [["On the second morning a knot of riders comes out of the Kaurava line for {who}. Their captain shouts that {who} can walk back with them or be carried.", { who: sibName(S) }],
        "Both armies stop to watch."],
      choices: [{ id: "stand", t: (S) => ["Stand beside {who} and fight them", { who: sibName(S) }], combat: "cross_e_called" }]
    }
  ]);

  // ---------- The fights ----------
  K.encounter({
    id: "cross_e_duel", title: "Between the lines", art: "fight_between_lines", caption: "Both armies watching", lethal: true, curse: true,
    allies: [], spare: true, flee: null,
    // Your first deadly fight on the new side: no one answers.
    callHelp: () => ({ text: "You shout for help. Behind you the Pandava line hears it, and no one moves. They are waiting to see what you are." }),
    intro: (S) => (duelFoe(S) === "ugra" ? "Ugra comes on the way he did at the fair, head down. Neither army makes a sound." : "Kanaka circles you once, the way you both learned on the march. Neither army makes a sound."),
    enemies: (S) => (duelFoe(S) === "ugra"
      ? [K.foe("Ugra, the miller's son", 6, { abilities: ["strike", "heavy"], person: "ugra", hp: 80, atk: 10 })]
      : [K.foe("Kanaka", 5, { abilities: ["strike", "heavy", "guard"] })]),
    win: { fx: (S) => ({ die: duelFoe(S), flag: "won_crossing_duel", journal: { src: "On the second morning of the war your old side sent {who} to bring you back. You killed him between the lines, with both armies watching.", p: { who: foeName(S) } } }),
      text: (S) => (duelFoe(S) === "ugra" ? "Ugra goes down in the open ground, the way he never did at the fair, and does not get up. A shout goes up behind you from the Pandava line. It is the first one that has been for you."
        : "Kanaka goes down in the dust between the lines and does not get up. A shout goes up behind you from the Pandava line. It is the first one that has been for you.") },
    spare: { fx: (S) => ({ flag: "spared_crossing_duel", duty: { conscience: 1 }, bond: duelFoe(S) === "ugra" ? { ugra: 2 } : {}, journal: { src: "On the second morning of the war you beat {who}, whom your old side sent after you, and let him walk home.", p: { who: foeName(S) } } }),
      text: "He is on his knees in the dust. You step back and let him go. He walks back across the field, and by evening both camps know that you could have killed him and did not." },
    lose: { fx: { flag: "lost_crossing_duel" }, deathText: "{They} crossed the field at Yuyutsu's call, and fell between the lines on the second morning, with both armies watching.",
      text: (S) => (S.alive ? "You go down in the dust between the lines. Hands drag you back to the Pandava line by your belt. You wake in a tent that is not yours yet, with a new scar." : null) }
  });
  K.encounter({
    id: "cross_e_called", title: "Riders from the other side", art: "fight_between_lines", caption: "The second morning", lethal: true, curse: true,
    allies: (S) => K.warAllies(S), spare: true, callHelp: K.warHelp,
    intro: (S) => ["The riders come at {who} first. You get there before they do.", { who: sibName(S) }],
    enemies: [K.foe("Kaurava rider", 4, { abilities: ["strike", "heavy"] }), K.foe("Kaurava riders' captain", 5, { abilities: ["strike", "heavy", "guard"] })],
    flee: { tags: ["retreat"], fx: (S) => ({ flag: ["sibling_other_side_set", "sibling_taken_back"], unflag: "called_across_came", set: { calledAcross: null }, bond: { [S.sibling]: -2 } }),
      text: (S) => ["You fall back. The riders take {who} back across the field between two horses.", { who: sibName(S) }] },
    win: { fx: (S) => ({ bond: { [S.sibling]: 1 }, flag: "kept_called_across", journal: { src: "On the second morning you fought beside {who} against the riders sent to take {who} back.", p: { who: sibName(S) } } }),
      text: (S) => ["The last rider turns his horse and goes. {who} is breathing hard beside you, and laughing.", { who: sibName(S) }] },
    spare: { fx: (S) => ({ bond: { [S.sibling]: 1 }, duty: { conscience: 1 }, flag: "kept_called_across" }), text: "You let the captain ride back to tell them. Nobody else comes." },
    lose: { deathText: "{They} called {their} own kin across the field on the first morning, and fell the next day keeping them there.",
      text: (S) => (S.alive ? "You go down under the horses. When you wake, you are in the healers' tent, and your sibling is sitting beside you." : null) }
  });
  // Their paintings, tall on upright screens (ui/battle.js reads this map).
  Object.assign(K.COMMAND_FIGHT_BG = K.COMMAND_FIGHT_BG || {}, { cross_e_duel: "fight_between_lines", cross_e_called: "fight_between_lines" });

  // ---------- Trust ----------
  // The new side trusts you once you win a deadly fight for it: the call for help answers again
  // (K.warHelp), and a commander who left a company behind is given one.
  const combatOutcome = K.combatOutcome;
  K.combatOutcome = function (encId, outcome, fallbackNext) {
    const r = combatOutcome.call(this, encId, outcome, fallbackNext);
    const S = K.S, enc = K.ENCOUNTERS[encId];
    if (S.alive && enc && enc.lethal && (outcome === "win" || outcome === "spare") && has(S, "crossed_untrusted")) {
      K.apply({ unflag: "crossed_untrusted", flag: ["crossed_trusted"].concat(has(S, "company_left") ? ["role_command", "company_given_back"] : []),
        journal: has(S, "company_left") ? "Your new side began to trust you, and Dhrishtadyumna gave you a company of Panchala spearmen." : "Your new side began to trust you." });
    }
    return r;
  };

  // ---------- Where the scenes come ----------
  K.BEFORE.a6_day1 = (K.BEFORE.a6_day1 || []).concat(["cross_call", "cross_duel", "cross_called"]);

  // ---------- What the telling says ----------
  // The bards' name for one who crossed: kindly or not, by conscience and by how the war ended for them.
  (K.TELL_HOOKS = K.TELL_HOOKS || []).push((S, t, h) => {
    if (crossed(S)) {
      const kind = S.duty.conscience >= 6;
      t.push(kind ? (S.alive ? "The bards call {them} the one who crossed, and they say it kindly. {They} heard Yudhishthira's call on the first morning and walked into it."
        : "The bards call {them} the one who crossed, and they say it gently. {They} answered Yudhishthira's call and did not live to be thanked for it.")
        : (S.alive ? "The bards call {them} the one who crossed, and they do not say it kindly. {They} changed sides on the first morning and came out of the war on the winning one."
          : "The bards call {them} the one who crossed. Neither army sang for {them}."));
      if (h("won_crossing_duel")) t.push(["On the second morning {they} killed {who}, whom {their} old side sent after {them}, between the lines.", { who: foeName(S) }]);
      else if (h("spared_crossing_duel")) t.push(["On the second morning {they} beat {who}, whom {their} old side sent after {them}, and let him walk home.", { who: foeName(S) }]);
      else if (h("refused_crossing_duel")) t.push("When {their} old side sent a man to call {them} out, {they} stayed in the line.");
    }
    if (h("called_across_came")) t.push(["On the first morning {they} called {who} across the field, and {who} came.", { who: sibName(S) }]);
    else if (h("sibling_taken_back")) t.push(["On the first morning {they} called {who} across the field. The next day riders took {who} back.", { who: sibName(S) }]);
    else if (h("called_across")) t.push(["On the first morning {they} called {who} across the field, and {who} could not come.", { who: sibName(S) }]);
  });
})(window.K = window.K || {});
