/* Comic layouts, group 1 (format in js/ui/comic.js). */
(function (K) {
  "use strict";
  K.COMIC = Object.assign(K.COMIC || {}, {
    // Drona among the students at the practice field.
    a2_trial: [{ c: 0 }, { p: [0.5, 0.45, 1] }, { p: [0.5, 0.32, 2.6, "4/3"], b: [{ i: 1, k: "cap", at: "tr", w: 40 }] }],
    a2_trial_again: [{ c: 0 }, { p: [0.77, 0.42, 2.2, "2/1"] }],
    // The training ground: archers, wrestlers, chariots.
    a2_pathtest: [{ c: 0 }, { p: [0.5, 0.42, 1] }, { p: [0.12, 0.38, 3, "4/3"], b: [{ i: 1, k: "cap", at: "br", w: 46 }] }],
    a2_pathtest_again: [{ c: 0 }, { p: [0.65, 0.4, 2.2, "2/1"] }],
    // The swayamvara hall: the bow on the steps, the fish above.
    a3_bow: [{ c: 0 }, { p: [0.5, 0.42, 1] }, { p: [0.53, 0.47, 3, "2/1"] }],
    a3_bow_again: [{ c: 0 }, { p: [0.56, 0.45, 2.6, "4/3"] }],
    // Home on the river: fields, landing, the fort across the water.
    a3_hunt: [{ c: 0 }, { p: [0.22, 0.35, 2, "2/1"] }],
    a3_hunt_again: [{ c: 0 }, { p: [0.15, 0.3, 2.6, "4/3"] }],
    a3_courttest: [{ c: 0 }, { p: [0.5, 0.45, 1], b: [{ i: 1, k: "cap", at: "bl", w: 44 }] }],
    a3_courttest_again: [{ c: 0 }, { p: [0.68, 0.32, 2, "2/1"] }],
    // Shakuni's throw.
    a4_hands: [{ c: 0 }, { p: [0.5, 0.4, 1] }, { c: 1 }, { p: [0.45, 0.44, 2.6, "2/1"] }, { c: 2 }],
    a4_hands_again: [{ c: 0 }, { p: [0.36, 0.28, 2.4, "4/3"] }],
    // The house by the river, the grandmother and the child on the steps.
    a4_household: [{ c: 0 }, { p: [0.5, 0.45, 1] }, { p: [0.44, 0.5, 3, "4/3"], b: [{ i: 1, k: "cap", at: "tr", w: 40 }] }],
    a4_household_again: [{ p: [0.7, 0.3, 2.2, "2/1"], b: [{ i: 0, k: "cap", at: "tl", w: 45 }] }],
    // The dice hall; Vikarna is not painted, so he speaks beside his face.
    a5_vikarna: [{ c: 0 }, { p: [0.5, 0.45, 1] }, { s: 1 }],
    a5_vikarna_again: [{ p: [0.48, 0.55, 2.2], b: [{ i: 0, k: "cap", at: "b", w: 50 }] }],
    // The forge; the hammer on the mat.
    a5_forge: [{ c: 0 }, { p: [0.5, 0.45, 1] }, { p: [0.3, 0.62, 2.6, "2/1"] }, { s: 1 }],
    a5_forge_again: [{ c: 0 }, { p: [0.42, 0.42, 1.9, "1/1"] }],
    // The stampede through the camp (3:1 painting).
    a5_herd: [{ c: 0 }, { p: [0.45, 0.55, 1.5, "2/1"] }, { p: [0.4, 0.55, 3, "4/3"] }],
    a5_herd_again: [{ c: 0 }, { p: [0.78, 0.55, 2.4, "4/3"] }],
    // The court where you are alone on the floor.
    a5_prison: [{ c: 0 }, { p: [0.5, 0.45, 1] }, { p: [0.43, 0.5, 3, "4/3"], b: [{ i: 1, k: "cap", at: "tr", w: 42 }] }],
    a5_prison_again: [{ c: 0 }, { p: [0.75, 0.4, 2, "2/1"] }],
    // Raiders at the border (3:1 painting).
    a5_local: [{ c: 0 }, { p: [0.45, 0.5, 1.5, "2/1"] }, { p: [0.53, 0.45, 3.2, "2/1"], b: [{ i: 1, k: "cap", at: "b", w: 60 }] }],
    a5_local_again: [{ p: [0.86, 0.45, 2.6, "4/3"], b: [{ i: 0, k: "cap", at: "bl", w: 48 }] }],
    // The Chakravyuha and Abhimanyu's chariot.
    a6_wheel: [{ c: 0 }, { p: [0.5, 0.4, 1] }, { p: [0.48, 0.3, 2.6, "4/3"] }],
    a6_wheel_again: [{ p: [0.55, 0.25, 2.2, "2/1"], b: [{ i: 0, k: "cap", at: "tr", w: 40 }] }],
    // Torchlight battle.
    a6_night: [{ p: [0.5, 0.42, 1], b: [{ i: 0, k: "cap", at: "tl", w: 45 }] }],
    a6_night_again: [{ p: [0.4, 0.42, 2.4, "2/1"], b: [{ i: 0, k: "cap", at: "tl", w: 45 }] }]
  });
})(window.K = window.K || {});
