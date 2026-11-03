/* Comic layouts, group 4 (format in js/ui/comic.js). */
(function (K) {
  "use strict";
  K.COMIC = Object.assign(K.COMIC || {}, {
    // The arena of the wheel from above; then the ring of chariots at its edge.
    a6_ring_closes: [{ c: 0 }, { p: [0.5, 0.5, 1] }, { c: 1 }, { p: [0.88, 0.55, 2.5, "4/3"] }],
    // The ring at sunset, then the boy with the wheel raised.
    a6_fall_in_wheel: [{ c: 0 }, { p: [0.5, 0.4, 1.15] }, { p: [0.49, 0.3, 3.2, "4/3"] }],
    // Abhimanyu's chariot; Drona's order from off the panel; the ring passes it on.
    a6_d13_bow: [
      { c: 0, rest: 1 }, { p: [0.49, 0.36, 2] },
      { p: [0.85, 0.25, 2.6, "2/1"], b: [{ i: 0, q: "all", k: "bal", at: "tl", w: 48, to: "l" }] },
      { c: 1 }, { p: [0.15, 0.3, 2.6, "4/3"] }
    ],
    // Vasu in the tent, then his face.
    a6_vasu: [{ c: 0 }, { p: [0.5, 0.5, 1.15] }, { c: 1 }, { p: [0.64, 0.3, 3, "4/3"] }],
    // Bhishma's charge; the grandsire in his chariot; the lines meeting.
    a6_day1: [
      { w: 1 }, { c: 0 }, { p: [0.5, 0.35, 1.2] },
      { c: 1 }, { c: 2 }, { c: 3 }, { c: 4 }, { c: 5 }, { p: [0.3, 0.3, 3, "4/3"] },
      { c: 6 }, { p: [0.55, 0.4, 2.2, "2/1"] }
    ],
    // The grandsire on the arrows; then both armies come to him.
    a6_bhishma: [{ w: 1 }, { p: [0.5, 0.53, 2.4, "2/1"] }, { c: 0 }, { p: [0.5, 0.5, 1.5, "2/1"] }],
    // The field, then the king's white horses and parasol.
    a6_capture: [{ w: 1 }, { p: [0.5, 0.35, 1.2] }, { c: 0 }, { p: [0.53, 0.27, 2.8, "4/3"] }],
    // The wheel from outside; its rings; the boy who breaks in.
    a6_day13: [
      { w: 1 }, { p: [0.5, 0.3, 1.25] },
      { c: 0 }, { c: 1 }, { c: 2 }, { p: [0.66, 0.2, 2.6, "2/1"] },
      { c: 3 }, { c: 4 }, { p: [0.49, 0.27, 3, "4/3"] }
    ],
    // Inside the ring; Abhimanyu fighting alone.
    a6_d13_inside: [{ c: 0 }, { p: [0.5, 0.25, 1.3] }, { c: 1 }, { c: 2 }, { p: [0.47, 0.27, 2.6, "1/1"] }],
    // The darkened sun, then the torch-lit lines.
    a6_day14: [{ w: 1 }, { p: [0.6, 0.3, 2.2, "2/1"] }, { c: 0 }, { p: [0.5, 0.45, 1.3] }],
    // Drona on his chariot; his face; the dead elephant behind.
    a6_day15: [{ w: 1 }, { p: [0.5, 0.4, 1.2] }, { c: 0 }, { p: [0.46, 0.2, 3.2, "4/3"] }, { c: 1 }, { p: [0.82, 0.38, 2.4, "2/1"] }],
    // Karna at the head of the host, then Karna close.
    a6_day16: [{ w: 1 }, { p: [0.5, 0.45, 1.15] }, { c: 0 }, { p: [0.45, 0.4, 3, "4/3"] }],
    // The sunk wheel; Arjuna's chariot against the sun; Karna's face.
    a6_day17: [
      { w: 1 }, { p: [0.5, 0.35, 1.2] },
      { c: 0 }, { c: 1 }, { p: [0.84, 0.33, 2.6, "2/1"] },
      { c: 2 }, { p: [0.5, 0.3, 3.4, "4/3"] }
    ],
    // The emptied field at sunset, then the few figures still walking.
    a6_day18: [{ w: 1 }, { p: [0.5, 0.45, 1.15] }, { c: 0 }, { p: [0.55, 0.5, 3, "2/1"] }],
    // Duryodhana by the water; his face; the crown in the mud.
    a6_duryodhana: [{ c: 0 }, { p: [0.45, 0.42, 1.25] }, { c: 1 }, { p: [0.27, 0.25, 3, "4/3"] }, { p: [0.48, 0.66, 3.2, "2/1"] }],
    // The gate; the burning tents; Ashwatthama with the sword.
    a6_raid: [
      { w: 1 }, { p: [0.5, 0.45, 1.15] },
      { c: 0 }, { p: [0.6, 0.35, 2.4, "2/1"] },
      { c: 1 }, { c: 2 }, { c: 3 }, { p: [0.32, 0.42, 2.8, "4/3"] }
    ],
    // The commander and his bannerman before the army; his words.
    cmd_promotion_1: [
      { c: 0 }, { p: [0.5, 0.4, 1.1] },
      { p: [0.5, 0.3, 2.4, "4/3"], b: [{ i: 1, q: "all", k: "bal", at: "tl", w: 44, to: [0.54, 0.24] }] }
    ],
    // The council tent; the lamps at its edge.
    cmd_promotion_2: [{ c: 0 }, { p: [0.5, 0.45, 1.1] }, { c: 1 }, { p: [0.29, 0.5, 3, "4/3"] }],
    // The army's ranks from above, then one stretch of them.
    cmd_array_1: [{ c: 0 }, { p: [0.5, 0.5, 1] }, { c: 1 }, { p: [0.5, 0.86, 2.6, "2/1"] }],
    cmd_array_2: [{ c: 0 }, { p: [0.5, 0.12, 2, "2/1"] }, { c: 1 }, { p: [0.12, 0.82, 2.8, "4/3"] }],
    // The road at sunset; Karna's chariot in the haze.
    hold_karna_offer: [{ c: 0 }, { p: [0.5, 0.45, 1] }, { c: 1 }, { p: [0.32, 0.53, 3.4, "2/1"] }],
    // The open field; Duryodhana's host under its parasol.
    hold_duryodhana_offer: [{ c: 0 }, { p: [0.5, 0.42, 1] }, { c: 1 }, { p: [0.22, 0.4, 2.4, "2/1"] }],
    // The plain; the chariot and its white horses.
    hold_arjuna_offer: [{ c: 0 }, { p: [0.5, 0.42, 1] }, { c: 1 }, { p: [0.34, 0.48, 3.2, "2/1"] }],
    // The dust; the banners coming through it.
    hold_bhima_offer: [{ c: 0 }, { p: [0.5, 0.45, 1] }, { c: 1 }, { p: [0.31, 0.5, 3, "2/1"] }],
    // The broken line and the fallen banner; the wounded being lifted.
    hold_broken: [{ c: 0 }, { p: [0.5, 0.42, 1.1] }, { c: 1 }, { p: [0.36, 0.38, 2.8, "4/3"] }],
    // The council tent; the map of tomorrow's field.
    cmd_council_1: [{ c: 0 }, { p: [0.5, 0.4, 1.2] }, { c: 1 }, { p: [0.5, 0.57, 2.6, "2/1"] }],
    // The leader over the map; the silent watchers at the side.
    cmd_council_2: [{ c: 0 }, { p: [0.55, 0.3, 2.4, "4/3"] }, { c: 1 }, { p: [0.2, 0.38, 2.2, "4/3"] }],
    // The council at the map; one figure by the lamp.
    cmd_council_3: [{ c: 0 }, { p: [0.5, 0.48, 1.3] }, { c: 1 }, { p: [0.85, 0.35, 2.6, "4/3"] }]
  });
})(window.K = window.K || {});
