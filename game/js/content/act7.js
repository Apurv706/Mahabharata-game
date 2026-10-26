/* Act VII — Aftermath, and every ending (PRD §6, §11). */
(function (K) {
  "use strict";
  const vasuLost = (S) => S.side !== "kaurava" && S.child === "vasu" && !S.dead.includes("vasu") &&
    (S.flags.includes("vasu_in_camp") || S.flags.includes("vasu_with_you")) &&
    !["saved_vasu_raid", "woke_camp", "slowed_ashwatthama"].some((f) => S.flags.includes(f));

  K.scenes([
    {
      id: "a7_field", act: 7, age: 44, canon: true, art: "scene_women_field", place: "Kurukshetra, after", caption: "Dawn over the field",
      title: "The women on the field",
      enter: (S) => (vasuLost(S) ? { die: "vasu", journal: "Vasu died in the night raid on the camp." } : null),
      witness: [
        "The women of both houses come to the battlefield to find their dead. Gandhari, who has worn a blindfold all her married life so as not to see more than her husband could, walks among her hundred sons.",
        "In her grief she curses Krishna: as the Kuru clan destroyed itself, so will his own Yadavas, thirty-six years from now. Krishna accepts the curse without a word.",
        "At the water rites, Kunti tells her sons that Karna was their eldest brother. Yudhishthira weeps for a long time."
      ],
      body: (S) => [
        S.dead.includes("vasu") ? { curse: "You carry Vasu to the pyres yourself." } : S.child === "vasu" ? { memory: "Vasu is alive. You keep touching his shoulder to make sure." } : null,
        S.friend && K.PEOPLE[S.friend]?.canon && ["karna", "duryodhana"].includes(S.friend) ? { memory: "{friend}, your oldest friend, is among the dead." } : null
      ],
      choices: [
        { id: "pyres", t: "Help build the pyres for the dead of both sides", fx: { rep: { common: 2 }, duty: { conscience: 1 } } },
        { id: "mourn", t: "Sit with your own dead and let no one move you", fx: { duty: { family: 1 }, attr: { wisdom: 1 } } },
        { id: "hunt", t: "Swear vengeance on Ashwatthama", req: (S) => S.side !== "kaurava" && K.activeVows(S).length < K.MAX_VOWS && !K.hasVow("vengeance", S),
          fx: { vowTake: "vengeance", flag: "vengeance_ashwatthama" }, hint: "He has been cursed to wander the earth. You could follow" }
      ],
      next: "a7_bhishma"
    },
    {
      id: "a7_bhishma", act: 7, age: 44, canon: true, place: "The bed of arrows", art: "scene_teaching", plate: ["#d4a84b", "#5c3361"], caption: "The grandsire's last teaching",
      title: "The last teaching",
      witness: ["Bhishma has waited on his bed of arrows for the sun to turn north. Before he dies, he teaches Yudhishthira how to rule, at great length, while the Pandavas and the survivors listen."],
      body: ["You sit at the edge of the crowd. When he pauses, he looks at you as if he expects a question."],
      choices: [
        { id: "rule", t: "Ask how a king should rule", fx: { skill: { statecraft: 1 }, attr: { command: 1 } } },
        { id: "grief", t: "Ask how to carry grief", fx: { attr: { wisdom: 1 }, duty: { family: 1 } }, text: "\"Like water,\" he says. \"You cannot put it down. You can learn to walk with it.\"" },
        { id: "vow", t: "Ask how to live with a broken vow", req: (S) => S.vows.some((v) => v.broken && !v.released), fx: { duty: { conscience: 2 } }, text: "\"Keep the next promise,\" he says. \"That is all any of us can do.\"" },
        { id: "listen", t: "Ask nothing. Just listen", fx: { skill: { lore: 1 } } },
        { id: "dream", t: "Ask him about the other life you dream of", req: { flag: "reborn" }, fx: { attr: { wisdom: 1 }, duty: { conscience: 1 }, unflag: "karmic_debt" },
          text: "\"Amba came back to me as Shikhandi, to finish what she began,\" he says. \"Perhaps you came back to finish something too.\" He looks at you for a long time. \"Did you?\"" }
      ],
      after: ["When the sun turns north, Bhishma dies. Yudhishthira is crowned king of Hastinapura, and reigns over an empty kingdom."],
      next: "a7_note"
    },
    {
      id: "a7_note", when: { flag: "debt_refused" }, skipTo: "a7_final",
      act: 7, age: 45, art: "scene_note", place: (S) => K.ORIGINS[S.origin].name, caption: "A doorway after the war",
      title: "The note, again",
      body: [
        "A young man finds you after the war. He has his grandfather's patience, and his grandfather's palm-leaf note. Sudatta is dead. The debt is not.",
        { speaker: "Sudatta's grandson", line: "I lost two brothers on the field. I would like to be paid." }
      ],
      choices: [
        { id: "pay", t: "Pay him, whatever it costs", fx: { duty: { conscience: 2, family: -1 }, unflag: "debt_refused", flag: "debt_paid_late", journal: "After the war you paid Sudatta's grandson your grandfather's debt." },
          text: "It takes most of what you have. He counts it twice, and thanks you, and you see that he did not expect it." },
        { id: "forgive", t: "Ask him to forgive it",
          check: { attr: "wisdom", skill: "statecraft", dc: 8,
            pass: { fx: { duty: { conscience: 1 }, unflag: "debt_refused", flag: "debt_forgiven" }, text: "He listens to the end. Then he tears the note in half himself. \"Everyone is owed something this year,\" he says. \"Nobody is getting paid.\"" },
            fail: { fx: {}, text: "\"My grandfather forgave nothing,\" he says. \"Neither do I.\" He keeps the note." } } },
        { id: "tear", t: "Tear it up again", fx: { rep: { common: -1 }, duty: { conscience: -1 }, flag: "debt_torn_twice" },
          text: "He watches the pieces fall. \"My son will come,\" he says, and goes." }
      ],
      next: "a7_final"
    },
    {
      id: "a7_final", act: 7, age: 45, art: "scene_years_remain", place: "After the war", caption: "By the river, after everything",
      title: "The years that remain",
      body: ["You are forty-five. Everything you were raised for has happened. How will you spend the rest of your life?"],
      choices: [
        { id: "elder", t: "Serve Yudhishthira's court as an advisor", req: { any: [{ rep: ["pandava", 5] }, { attr: ["wisdom", 6] }] }, locked: "The new court would need to trust you.", fx: { set: { endChoice: "elder" } } },
        { id: "forest", t: "Go to the forest with Dhritarashtra, Gandhari and Kunti", fx: { set: { endChoice: "forest" } } },
        { id: "teller", t: "Tell the story of the war, as it really happened", req: { any: [{ path: "bard" }, { skill: ["lore", 3] }, { flag: "remembered_hall" }] }, locked: "You would need a storyteller's training or memory.", fx: { set: { endChoice: "teller" } } },
        { id: "vengeance", t: "Hunt Ashwatthama to the ends of the earth", req: { vow: "vengeance", flag: "vengeance_ashwatthama" }, fx: { set: { endChoice: "vengeance" } } },
        { id: "home", t: "Go home", req: (S) => (S.spouse && !S.dead.includes(S.spouse)) || (S.child && !S.dead.includes(S.child)) || S.origin, fx: { set: { endChoice: "home" } } },
        { id: "wander", t: "Walk away from everything", fx: { set: { endChoice: "wander" } } }
      ],
      next: "end_life"
    },
    { id: "end_life", act: 7, ending: (S) => K.composeEnding(S) },
    { id: "end_death", act: 6, ending: (S) => K.composeEnding(S) }
  ]);

  // ---------- Ending composer ----------
  function telling(S) {
    // Whole sentences only, so each one translates as a unit; [text, values] pairs carry names.
    const t = [];
    const has = (f) => S.flags.includes(f);
    const self = S.teacher === "self", taught = S.teacher && !self;
    t.push(S.path
      ? (self ? "They sing of {name}, born in {origin}, {path!}, who taught {them}self by night." : taught ? "They sing of {name}, born in {origin}, {path!}, student of {teacher}." : "They sing of {name}, born in {origin}, {path!}.")
      : (self ? "They sing of {name}, born in {origin}, who taught {them}self by night." : taught ? "They sing of {name}, born in {origin}, student of {teacher}." : "They sing of {name}, born in {origin}."));
    if (S.friend) t.push("As a child {they} chose {friend} for a friend, and that choice followed {them} all {their} life.");
    if (has("stood_with_karna")) t.push("At seventeen {they} stood beside Karna when the arena laughed at him.");
    if (has("stood_with_princes")) t.push("At seventeen {they} stood with the princes, and Karna remembered it.");
    if (has("helped_ekalavya")) t.push("{They} bound Ekalavya's hand when no one else would.");
    if (has("refused_dakshina")) t.push("{They} refused to ride against Panchala, and Drona never forgot it.");
    if (has("helped_tunnel")) t.push("{They} carried earth out of the tunnel at Varnavata, night after night.");
    if (has("objected_dice") || has("stood_between")) t.push("In the dice hall, when the elders were silent, {they} {were} not.");
    if (has("silent_draupadi")) t.push("In the dice hall {they} said nothing, like most of the people there.");
    if (has("left_dice") || has("absent_dice")) t.push("{They} {were} not in the hall to see the worst of it.");
    S.vows.forEach((v) => t.push([v.released ? "{They} swore “{vow!}”, and the vow was answered." : v.broken ? "{They} swore “{vow!}” and broke it." : "{They} swore “{vow!}” and kept it.", { vow: K.VOWS[v.id].name }]));
    if (has("could_not_break_through")) t.push("On the thirteenth day {they} {were} among those who could not break through.");
    if (has("held_the_ring")) t.push("On the thirteenth day {they} held {their} place in the ring that closed on Abhimanyu.");
    if (has("refused_ring")) t.push("On the thirteenth day {they} lowered {their} bow and would not close in on a lone boy.");
    if (has("spread_the_lie")) t.push("On the fifteenth day {they} shouted the half-truth that killed Drona.");
    if (has("shot_karna")) t.push("On the seventeenth day {they} loosed an arrow at Karna as he lifted his wheel.");
    if (has("joined_raid")) t.push("On the last night {they} went with Ashwatthama into the sleeping camp. No one sings that part aloud.");
    if (has("saved_vasu_raid") || has("woke_camp")) t.push("On the night of the raid {they} pulled the living out of the fire.");
    if (has("nishada_came")) t.push("When {they} whistled in the dark, the Nishada archers came, because of a hand {they} once bound.");
    if (has("tried_secret")) t.push("{They} knew Karna's secret before the war, and kept it, because Krishna asked.");
    if (has("saw_swap")) t.push(has("spoke_dice") ? "{They} saw Shakuni's hands in the dice hall, and said so." : "{They} saw Shakuni's hands in the dice hall, and told no one.");
    if (has("kept_home_earth")) t.push("{They} carried a handful of {origin}'s earth all {their} life.");
    if (has("sat_with_kesava")) t.push("{They} went home to sit with an old smith on his last nights, because {their} friend would never ask.");
    const CURSE_LINE = {
      hermit: "The hermit's curse found {them} at the worst hour.",
      sage: "The sage's curse found {them} at the worst hour.",
      astra_misuse: "The curse of the misused astra found {them} at the worst hour."
    };
    S.curses.filter((c) => c.fired && CURSE_LINE[c.id]).forEach((c) => t.push(CURSE_LINE[c.id]));
    if (!S.alive) t.push(S.deathText || "{They} fell at Kurukshetra.");
    return t;
  }

  function fates(S) {
    const f = [];
    if (S.child === "vasu") {
      if (S.dead.includes("vasu")) f.push("Vasu died in the night raid. You built his pyre with your own hands.");
      else if (!S.alive) f.push("Vasu carried your story home, and told it to his own children.");
      else f.push(S.flags.includes("vasu_gentle") ? "Vasu grew into the kind man you hoped for, and never picked up a sword again." : S.flags.includes("vasu_craft") ? "Vasu went back to the craft you taught him, and did well." : "Vasu served in Parikshit's guard and rose high.");
    }
    if (S.kin && K.kinElder(S)) f.push(["You taught your own children what {kin} taught you.", { kin: S.kin }]);
    else if (S.kin) f.push(S.alive && S.endChoice === "home" ? ["{kin}, who shaped you as a child, lived to see you come home.", { kin: S.kin }] : S.alive ? ["{kin} kept every message you sent from the war.", { kin: S.kin }] : ["In {origin}, {kin} told the children who you had been.", { kin: S.kin }]);
    if (S.spouse) f.push(S.alive ? "{spouse} grew old beside you." : "{spouse} never remarried.");
    if (S.friend === "charu") f.push(S.alive ? "Charu outlived everyone, and complained about it." : "Charu kept a lamp lit for you every year.");
    if (S.flags.includes("debt_paid_late")) f.push("Sudatta's grandson told everyone that you paid what your grandfather owed.");
    if (S.flags.includes("debt_forgiven")) f.push("Sudatta's grandson tore up your family's note himself, and never spoke of it.");
    if (S.flags.includes("debt_torn_twice")) f.push("Sudatta's family still keeps the pieces of your grandfather's note.");
    if ((S.flags.includes("beat_ugra") || S.flags.includes("lost_to_ugra")) && S.side && S.side !== "neutral") f.push(S.alive ? "Ugra, the miller's son, went home and told the story of the fair to anyone who would listen." : "Ugra, the miller's son, carried you off the field.");
    if (S.friend === "karna" || S.bonds.karna >= 7) f.push("Karna's sons all died in the war. His name lived on.");
    if (S.friend === "duryodhana") f.push("Duryodhana, your oldest friend, went to heaven, the stories say, for dying as a warrior.");
    if (S.teacher && S.teacher !== "self") f.push(S.duty.teacher >= 7 ? "Your debt to {teacher} was paid in full." : S.duty.teacher <= 2 ? "Your debt to {teacher} was never paid." : "Your debt to {teacher} was partly paid, as most are.");
    // Composed when the ending is shown, so the list is built in the current language ("done" pair).
    if (S.injuries.length) f.push(["You carried the war in your body: {list}.", { list: K.list(S.injuries.map((i) => K.low(K.tr(K.INJURIES[i].name)))) }, true]);
    return f;
  }

  // Every ending, for the Book of Lives. Undiscovered ones show only their hint.
  K.ENDINGS = [
    { title: "The wise elder", art: "end_elder", hint: "Survive, with the new court's trust." },
    { title: "Renunciation", art: "end_forest", hint: "Survive, and follow the old king into the forest." },
    { title: "The teller", art: "end_teller", hint: "Survive with a storyteller's memory." },
    { title: "Vengeance", art: "end_vengeance", hint: "Swear to hunt Ashwatthama, and keep the oath." },
    { title: "The homecoming", art: "end_survivor", hint: "Survive, and go home with most of your people alive." },
    { title: "Broken survivor", art: "end_broken", hint: "Survive, having lost most of those you loved." },
    { title: "The wanderer", art: "end_river", hint: "Survive, and walk away from everything." },
    { title: "Glorious death", art: "end_death", hint: "Fall in battle with every vow kept." },
    { title: "Fallen at Kurukshetra", art: "end_death", hint: "Fall in battle." },
    { title: "Into the wheel", art: "end_wheel", hint: "Follow Abhimanyu to the end." },
    { title: "Beside Karna", art: "war_day17", hint: "Stand beside Karna on his last day." }
  ];

  K.composeEnding = function (S) {
    const vows = S.vows;
    const intact = vows.length > 0 && vows.every((v) => !v.broken || v.released);
    const lost = [S.spouse, S.child, S.friend].filter((p) => p && S.dead.includes(p)).length;
    const weakBonds = Object.values(S.bonds).filter((b) => b <= 2).length;
    let title, art = "end_survivor", caption = "Dawn over the field";
    if (!S.alive) {
      const wheel = S.flags.includes("died_with_abhimanyu"), karna = S.flags.includes("died_with_karna");
      art = wheel ? "end_wheel" : karna ? "war_day17" : "end_death";
      caption = wheel ? "The ring of chariots at sunset" : karna ? "A chariot wheel sinks into the earth" : "The day ends without you";
      title = S.flags.includes("died_with_abhimanyu") ? "Into the wheel" : S.flags.includes("died_with_karna") ? "Beside Karna" : intact ? "Glorious death" : "Fallen at Kurukshetra";
    } else {
      const c = S.endChoice;
      if (c === "elder") { title = "The wise elder"; art = "end_elder"; caption = "The palace school, in old age"; }
      else if (c === "forest") { title = "Renunciation"; art = "end_forest"; caption = "The forest, in old age"; }
      else if (c === "teller") { title = "The teller"; art = "end_teller"; caption = "A lamp, and a long story"; }
      else if (c === "vengeance") { title = "Vengeance"; art = "end_vengeance"; caption = "A road that does not end"; }
      else if (c === "home") { title = lost >= 2 ? "Broken survivor" : "The homecoming"; art = lost >= 2 ? "end_broken" : "home_" + S.origin; caption = lost >= 2 ? "An empty house at evening" : K.ORIGINS[S.origin].name; }
      else if (lost >= 1 || weakBonds >= 4) { title = "Broken survivor"; art = "end_broken"; caption = "An empty house at evening"; }
      else { title = "The wanderer"; art = "end_river"; caption = "By the river, after everything"; }
    }
    const coda = {
      "The wise elder": "You sat at Yudhishthira's right hand for thirty-six years, and you told him the truth when no one else would.",
      Renunciation: "You walked into the forest with the old king and queen and Kunti, and lived simply, and when the forest fire came you did not run.",
      "The teller": "You told it all, the good and the shameful, to anyone who would listen. Some of it found its way into the great telling. Listen closely and you may hear your own name.",
      Vengeance: "You followed Ashwatthama across the world. People say you are still following him.",
      "The homecoming": "You went home. The house was smaller than you remembered. You stayed.",
      "Broken survivor": "You lived. Most of the people you loved did not. You learned to walk with it, the way Bhishma said.",
      "The wanderer": "You walked away from the courts and the kings, and nobody ever found out where you went."
    }[title];
    const tell = telling(S);
    if (coda) tell.push(coda);
    return { title, art, caption, telling: tell, fates: fates(S) };
  };
})(window.K = window.K || {});
