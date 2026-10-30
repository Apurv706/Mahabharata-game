/* Combat abilities. Each path (PRD §8) brings three; everyone has Strike and Guard.
   target: "enemy" | "self" | "ally" (any living friend, including self) | "enemies" | "allies" */
(function (K) {
  "use strict";
  const pct = (u, p) => Math.max(1, Math.round(u.maxHp * p));

  K.ABILITIES = {
    strike: { name: "Strike", target: "enemy", cd: 0, desc: "A plain attack with your weapon.", use: (B, u, t) => B.hit(u, t, 1) },
    guard: { name: "Guard", target: "self", cd: 0, desc: "Halve the next blow against you.", use: (B, u) => B.status(u, "guard", 1, "braces behind a shield") },
    herbs: {
      name: "Healing herbs", target: "ally", cd: 2, item: "herbs", desc: "Use one bundle of herbs to restore 30% health.",
      use: (B, u, t) => { K.S.items.herbs = Math.max(0, (K.S.items.herbs || 0) - 1); B.heal(u, t, pct(t, 0.3)); }
    },
    // Shout for a friend, once. Who comes (if anyone) is the fight's to say (enc.callHelp).
    call: {
      name: "Call for help", target: "self", once: true, desc: "Shout for a friend. Once per battle; who comes depends on what you have been to them.",
      use: (B, u) => {
        const h = K.val(B.enc.callHelp, K.S) || {};
        if (h.text) B.say(h.text);
        if (h.unit) { const a = B.join(h.unit, h.stay || 2); B.status(a, "inspired", 2); }
        if (h.run) h.run(B);
      }
    },
    astra: {
      name: "Invoke astra", target: "enemy", cd: 99, once: true, desc: "A divine weapon. Once per battle. Using it on an unarmed or helpless foe is a grave wrong.",
      use: (B, u, t) => {
        // A weapon won by penance whose condition you broke: in a deadly fight, the mantra fails once.
        const broken = B.enc.lethal && K.S.curses.find((c) => c.id === "astra_condition" && !c.fired);
        if (broken) { K.apply({ fireCurse: "astra_condition", journal: K.CURSES.astra_condition.fireText }); B.say(K.CURSES.astra_condition.fireText); return; }
        if (!t.armed) {
          B.say("You loose the astra at a foe who cannot defend himself. The sky goes dark. Somewhere, a sage has seen.");
          K.apply({ curse: "astra_misuse", duty: { conscience: -3 }, rep: { sages: -2 }, journal: "You used a divine weapon on someone who could not fight back." });
        }
        // The epic's heroes know the counter to every astra: it is met in mid-air. The clash staggers
        // them for a moment, and that is all it buys.
        B.astraOut = { uid: t.uid, kind: B.enc.astraKind || "generic", clash: !!t.hero };
        if (t.hero) { B.tell("{t} answers with the counter-weapon. The two meet in the air in a blaze of light, and both are gone.", { t }); B.status(t, "stun", 1); return; }
        B.hit(u, t, 3, { pierce: true, verb: "The astra strikes {t} for {n}." });
      }
    },

    // Archer
    aimed: { name: "Aimed shot", target: "enemy", cd: 2, desc: "Take your time. A heavy, precise hit.", use: (B, u, t) => B.hit(u, t, 1.8, { verb: "A long, careful shot hits {t} for {n}." }) },
    volley: { name: "Volley", target: "enemies", cd: 3, desc: "Arrows across the whole line.", use: (B, u, ts) => ts.forEach((t) => B.hit(u, t, 0.7, { verb: "Arrows fall on {t} for {n}." })) },
    pin: { name: "Pinning shot", target: "enemy", cd: 3, desc: "Pin a foe so they lose their next turn.", use: (B, u, t) => { B.hit(u, t, 0.6); B.status(t, "stun", 1, "is pinned in place"); } },

    // Mace fighter
    crush: { name: "Crushing blow", target: "enemy", cd: 2, desc: "A huge swing. May stun.", use: (B, u, t) => { B.hit(u, t, 1.6); if (K.rng() < 0.35) B.status(t, "stun", 1, "staggers"); } },
    roar: { name: "War cry", target: "self", cd: 3, desc: "Draw every enemy's attention and brace.", use: (B, u) => { B.status(u, "taunt", 2, "roars a challenge"); B.status(u, "guard", 1); } },
    quake: { name: "Ground-shaker", target: "enemies", cd: 3, desc: "Hit everyone in reach.", use: (B, u, ts) => ts.forEach((t) => B.hit(u, t, 0.65, { verb: "The blow shakes {t} for {n}." })) },

    // Charioteer
    swerve: { name: "Swerve", target: "self", cd: 2, desc: "Dodge the next attack; your next hit lands harder.", use: (B, u) => { B.status(u, "evade", 1, "swerves the chariot"); B.status(u, "inspired", 2); } },
    ridedown: { name: "Ride them down", target: "enemy", cd: 3, desc: "Drive straight through a foe.", use: (B, u, t) => { B.hit(u, t, 1.4, { verb: "The chariot runs down {t} for {n}." }); if (K.rng() < 0.3) B.status(t, "stun", 1, "is knocked flat"); } },
    rally: { name: "Rally the horses", target: "self", cd: 4, desc: "Recover 20% health and shake off effects.", use: (B, u) => { B.cleanse(u); B.heal(u, u, pct(u, 0.2)); } },

    // Strategist
    command: { name: "Command", target: "ally", cd: 2, needsAlly: true, desc: "An ally attacks at once, hitting harder.", use: (B, u, t) => { if (t === u) return B.hit(u, B.firstEnemy(), 1); B.status(t, "inspired", 2); B.hit(t, B.firstEnemy(), 1.2, { verb: "On your order, {a} hits {t} for {n}." }); } },
    expose: { name: "Read the field", target: "enemy", cd: 2, desc: "Find the gap. The foe takes 40% more damage for 2 turns.", use: (B, u, t) => B.status(t, "exposed", 2, "is exposed") },
    formation: { name: "Close formation", target: "allies", cd: 3, desc: "Every ally guards.", use: (B, u, ts) => ts.forEach((t) => B.status(t, "guard", 1, "closes ranks")) },

    // Healer
    salve: { name: "Herbal salve", target: "ally", cd: 3, desc: "Restore 28% health. No herbs needed.", use: (B, u, t) => B.heal(u, t, pct(t, 0.28)) },
    steady: { name: "Steady hands", target: "ally", cd: 3, desc: "Remove harmful effects and guard.", use: (B, u, t) => { B.cleanse(t); B.status(t, "guard", 1); } },
    nerve: { name: "Nerve strike", target: "enemy", cd: 2, desc: "You know where the body is weak. May stun.", use: (B, u, t) => { B.hit(u, t, 1); if (K.rng() < 0.5) B.status(t, "stun", 1, "goes numb"); } },

    // Spy / envoy
    feint: { name: "Feint", target: "self", cd: 2, desc: "Your next attack is a critical hit.", use: (B, u) => B.status(u, "crit", 1, "feints") },
    vanish: { name: "Vanish into the dust", target: "self", cd: 3, desc: "Avoid the next attack.", use: (B, u) => B.status(u, "evade", 1, "slips out of sight") },
    hamstring: { name: "Hamstring", target: "enemy", cd: 2, desc: "A cut that keeps bleeding for 3 turns.", use: (B, u, t) => { B.hit(u, t, 0.9); B.status(t, "bleed", 3, "is bleeding"); } },

    // Bard
    song: { name: "Battle song", target: "allies", cd: 3, desc: "Allies hit 30% harder for 2 turns.", use: (B, u, ts) => ts.forEach((t) => B.status(t, "inspired", 2)) || B.tell(u.side === "player" ? "You sing, and the line stands taller." : "{a} sings, and the line stands taller.", { a: u }) },
    verse: { name: "Mocking verse", target: "enemy", cd: 2, desc: "The foe hits 30% softer for 2 turns.", use: (B, u, t) => B.status(t, "weakened", 2, "falters at the verse") },
    hymn: { name: "Steadying hymn", target: "allies", cd: 3, desc: "Every ally recovers 10% health.", use: (B, u, ts) => ts.forEach((t) => B.heal(u, t, pct(t, 0.1))) },

    // Enemy techniques
    heavy: { name: "Heavy blow", target: "enemy", cd: 3, desc: "", use: (B, u, t) => B.hit(u, t, 1.6, { heavy: true, verb: "A heavy blow hits {t} for {n}." }) },
    breaker: { name: "Shield-breaker", target: "enemy", cd: 3, desc: "", use: (B, u, t) => B.hit(u, t, 1.25, { heavy: true, breaks: true, verb: "A shield-breaking blow hits {t} for {n}." }) },
    brace: { name: "Brace", target: "self", cd: 2, desc: "", use: (B, u) => B.status(u, "guard", 1, "braces for your next blow") },
    arrows: { name: "Arrow storm", target: "enemies", cd: 3, desc: "", use: (B, u, ts) => ts.forEach((t) => B.hit(u, t, 0.6, { verb: "Arrows rain on {t} for {n}." })) },
    disarm: { name: "Break the bow", target: "enemy", cd: 4, desc: "", use: (B, u, t) => { B.hit(u, t, 0.8); B.status(t, "weakened", 2, "loses grip on the weapon"); } }
  };

  K.STATUS_TEXT = {
    guard: "Guarding", evade: "Evading", stun: "Stunned", exposed: "Exposed", weakened: "Weakened",
    inspired: "Inspired", bleed: "Bleeding", crit: "Ready to strike", taunt: "Drawing fire", cursed: "Cursed"
  };
})(window.K = window.K || {});
