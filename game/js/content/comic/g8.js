/* Comic layouts, group 8 (format in js/ui/comic.js). */
(function (K) {
  "use strict";
  K.COMIC = Object.assign(K.COMIC || {}, {
    oath_fire: [{ c: 0 }, { p: [0.5, 0.42, 1] }, { p: [0.55, 0.36, 2.2, "4/3"], b: [{ i: 1, k: "bal", at: "tl", w: 46, to: [0.545, 0.42] }] }, { c: 2 }, { p: [0.47, 0.42, 3, "1/1"] }],
    oath_crescent: [{ c: 0 }, { p: [0.5, 0.36, 1] }, { c: 1 }, { p: [0.53, 0.26, 2.4, "2/1"] }],
    bh_day9: [{ c: 0 }, { p: [0.5, 0.32, 1.2] }, { c: 1 }, { p: [0.29, 0.22, 3, "4/3"] }],
    bh_wheel: [{ c: 0 }, { p: [0.3, 0.2, 2.6, "4/3"] }, { c: 1 }, { p: [0.6, 0.33, 1.4, "2/1"] }, { c: 2 }, { p: [0.78, 0.38, 2.8, "4/3"] }],
    bh_guard9: [{ c: 0 }, { p: [0.5, 0.32, 1] }, { c: 1 }, { p: [0.28, 0.22, 2.8, "1/1"] }],
    bh_fall: [{ c: 0 }, { p: [0.33, 0.3, 2.1, "4/3"] }, { c: 1 }, { p: [0.84, 0.4, 3, "4/3"] }],
    cross_call: [{ w: 1 }, { p: [0.5, 0.4, 1] }, { c: 0 }, { p: [0.52, 0.44, 3, "4/3"] }, { c: 1 }, { p: [0.15, 0.4, 2.4, "2/1"] }],
    cross_watched: [{ c: 0 }, { p: [0.5, 0.42, 1.5, "2/1"] }, { s: 1 }, { p: [0.2, 0.4, 2.6, "4/3"] }, { c: 2 }, { p: [0.88, 0.42, 3, "1/1"] }],
    cross_explain: [{ c: 0 }, { p: [0.4, 0.42, 1.5, "2/1"] }, { s: 1 }, { p: [0.85, 0.38, 2.4, "4/3"] }],
    cross_spy: [{ c: 0 }, { p: [0.6, 0.42, 1.5, "2/1"] }, { c: 1 }, { p: [0.14, 0.42, 3, "1/1"] }],
    kd_son: [{ c: 0 }, { p: [0.5, 0.42, 1] }, { c: 1 }, { p: [0.45, 0.3, 3.2, "4/3"] }, { c: 2 }, { p: [0.35, 0.6, 3, "1/1"] }],
    kd_guard: [{ c: 0 }, { p: [0.5, 0.36, 1] }, { c: 1 }, { p: [0.49, 0.4, 2.8, "2/1"] }],
    fs_sk_6: [{ c: 0 }, { p: [0.32, 0.26, 1.8] }, { c: 1 }, { p: [0.78, 0.36, 2.4, "4/3"] }],
    fs_sk_11: [{ c: 0 }, { p: [0.82, 0.28, 2.2, "4/3"] }, { c: 1 }, { p: [0.5, 0.34, 1.4, "2/1"] }],
    fs_d3: [{ c: 0 }, { p: [0.4, 0.26, 1.5] }, { c: 1 }, { p: [0.86, 0.36, 2.6, "4/3"] }],
    fs_d12: [{ c: 0 }, { p: [0.5, 0.32, 1] }, { c: 1 }, { p: [0.24, 0.3, 2.6, "4/3"] }],
    fs_d13: [{ c: 0 }, { p: [0.55, 0.16, 2, "2/1"] }, { c: 1 }, { p: [0.5, 0.3, 1.25] }],
    fs_d14: [{ c: 0 }, { p: [0.5, 0.36, 1] }, { c: 1 }, { p: [0.23, 0.44, 3, "4/3"] }],
    fs_d15: [{ c: 0 }, { p: [0.47, 0.28, 1.7, "4/3"] }, { c: 1 }, { p: [0.72, 0.2, 2, "2/1"] }],
    fs_d16: [{ c: 0 }, { p: [0.5, 0.4, 1] }, { c: 1 }, { p: [0.86, 0.46, 2.6, "4/3"] }],
    fs_d18: [{ c: 0 }, { p: [0.5, 0.4, 1] }, { c: 1 }, { p: [0.53, 0.47, 3.5, "4/3"] }]
  });

  // These paintings are listed as 3:1 strips but the files are 16:9 (2560x1440). The layouts below are
  // written in TRUE painting coordinates; while the renderer still treats the file as 3:1 they are
  // converted so the crop and the tails land where intended. If the file is ever registered as wide,
  // they are used as written.
  const TRUE16 = {
    oath_south: ["fight_arjuna_chariot", [{ c: 0 }, { p: [0.42, 0.4, 1.5, "2/1"] }, { c: 1 }, { p: [0.55, 0.44, 3, "4/3"] }]],
    oath_again: ["fight_arjuna_chariot", [{ c: 0 }, { p: [0.5, 0.38, 1.5, "2/1"] }, { c: 1 }, { p: [0.34, 0.47, 3.2, "4/3"] }]],
    oath_king: ["fight_war_chariot", [{ c: 0 }, { p: [0.28, 0.36, 2.2, "2/1"] }]],
    cross_duel: ["fight_between_lines", [{ c: 0 }, { p: [0.5, 0.4, 1.5, "2/1"] }, { s: 1 }, { p: [0.5, 0.56, 2.6, "4/3"] }, { c: 2 }, { c: 3 }, { p: [0.86, 0.44, 2.6, "2/1"] }]],
    cross_called: ["fight_between_lines", [{ c: 0 }, { p: [0.12, 0.44, 2.4, "2/1"] }, { c: 1 }, { p: [0.5, 0.42, 1.5, "2/1"] }]],
    cross_truth: ["scene_war_council", [{ c: 0 }, { c: 1 }, { p: [0.5, 0.4, 1.5, "2/1"] }, { p: [0.55, 0.3, 2.5, "4/3"], b: [{ i: 2, k: "bal", at: "tl", w: 44, to: [0.53, 0.25] }] }]]
  };
  const ASP = { "2/1": 2, "16/9": 16 / 9, "4/3": 4 / 3, "1/1": 1, "3/4": 3 / 4 };
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  function convert(art, beats) {
    const U = K.UI;
    const assumed = U && U.hasWide && U.hasWide(art) ? 16 / 9 : 3, real = 16 / 9;
    if (assumed === real) return beats;
    return beats.map((bt) => {
      if (!bt.p) return bt;
      const [cx = 0.5, cy = 0.45, z0 = 1, asp = "16/9"] = bt.p, P = ASP[asp] || 16 / 9;
      const z = Math.max(z0 || 1, assumed / P, 1);
      const chA = assumed / (z * P), chT = real / (z * P);
      const pct = chT >= 0.999 || chA >= 0.999 ? 0.5 : clamp(cy - chT / 2, 0, 1 - chT) / (1 - chT);
      const topT = pct * (1 - chT), topA = pct * (1 - chA);
      const p = [cx, chA >= 0.999 ? 0.5 : topA + chA / 2, z0, asp];
      const b = (bt.b || []).map((it) => (Array.isArray(it.to) ? Object.assign({}, it, { to: [it.to[0], topA + ((it.to[1] - topT) / chT) * chA] }) : it));
      return Object.assign({}, bt, { p, b });
    });
  }
  for (const id of Object.keys(TRUE16)) {
    const [art, beats] = TRUE16[id];
    Object.defineProperty(K.COMIC, id, { configurable: true, enumerable: true, get: () => convert(art, beats) });
  }
})(window.K = window.K || {});
