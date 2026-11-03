/* The story as a comic: each scene's panels, captions and balloons (format in js/ui/comic.js).
   Positions are fractions of the scene's painting: x across, y down. One beat to a panel. */
(function (K) {
  "use strict";
  K.COMIC = Object.assign(K.COMIC || {}, {
    a1_sage: [{ p: [0.5, 0.5, 1] }, { c: 0 }, { p: [0.36, 0.34, 2.4, "4/3"] }],
    a1_pasha: [{ c: 0 }, { p: [0.5, 0.55, 1.15] }, { p: [0.52, 0.3, 2, "4/3"], b: [{ i: 1, k: "bal", at: "tl", w: 46, to: [0.5, 0.26] }] }],
    ep_mentor_vidura: [{ c: 0 }, { p: [0.5, 0.5, 1] },
      { p: [0.5, 0.3, 2.4, "4/3"], b: [{ i: 1, q: 0, k: "bal", at: "tl", w: 34, to: [0.46, 0.27] }] },
      { p: [0.5, 0.42, 1.4, "4/3"], b: [{ i: 1, q: 1, k: "bal", at: "t", w: 92, to: [0.5, 0.3] }] }]
  });
})(window.K = window.K || {});
