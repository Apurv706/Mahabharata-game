/* The shadow puppet: you, as a leather puppet in the style of tholu bommalata, drawn in code.
   One jointed figure (head, arms, forearms, thighs, shins) seen in profile, cut from coloured,
   translucent leather pricked with holes, held up on thin rods. It is built from the life:
   age (child, youth, adult, elder), pronoun, birthplace (colours and headgear), temperament
   (bearing), heirloom, path (what the grown-up carries), wounds, chains, and death.
   Poses are joint angles set by a class on the figure (pose-aim, pose-push, pose-walk...), so
   CSS animates from one pose to the next. Other people (Arjuna, Bhima, a guard) are puppets too.

   U.puppet(spec, { pose, h, flip, cls, label }) → an SVG string.
   K.puppetSpec(S) → the spec for the player.
   U.puppetFor(id, S) → the spec for someone else (K.PUPPETS). */
(function (K) {
  "use strict";
  const U = K.UI;

  // Leather colours for each homeland: [body, cloth, trim].
  const PALETTE = {
    hastinapura: ["#c9773a", "#a3302a", "#e2b55a"],
    panchala: ["#c98a52", "#2d5aa0", "#e2b55a"],
    matsya: ["#c47d45", "#2f7d55", "#d9c27a"],
    mathura: ["#b9733f", "#d79a2b", "#3b6fb0"],
    anga: ["#c27440", "#b2432a", "#e8c46a"],
    suta: ["#b06c3c", "#7a5232", "#d8b77a"],
    nishada: ["#a3643a", "#3f5a2c", "#c9a066"],
    gandhara: ["#c48450", "#4f6178", "#d6c6a2"],
    none: ["#c27a44", "#8a3a2a", "#e2b55a"]
  };
  const HEADGEAR = { hastinapura: "crownlet", panchala: "band", matsya: "band", mathura: "turban", anga: "turban", suta: "turban", nishada: "feather", gandhara: "cap" };
  const ITEM = { archer: "bow", mace: "mace", charioteer: "whip", strategist: "scroll", healer: "bowl", spy: "dagger", bard: "lute" };

  K.puppetStage = (age) => (age < 13 ? "child" : age < 20 ? "youth" : age < 48 ? "adult" : "elder");
  K.puppetSpec = function (S = K.S) {
    if (!S) return null;
    const inj = S.injuries || [];
    return {
      stage: K.puppetStage(S.age || 6), pronoun: S.pronoun || "they", palette: PALETTE[S.origin] || PALETTE.none,
      headgear: HEADGEAR[S.origin] || null, temper: S.temperament || null,
      heir: S.heirloom && !(S.flags || []).includes("heirloom_lost") ? S.heirloom : null,
      cracked: (S.flags || []).includes("amulet_broken"),
      item: S.path ? ITEM[S.path] : null,
      eye: inj.includes("eye"), sling: inj.includes("arm"), limp: inj.includes("leg"), scar: inj.includes("scar"),
      chained: (S.flags || []).includes("imprisoned"), dead: S.alive === false
    };
  };

  // Other people: a few fixed traits; their age follows the player's for the princes.
  K.PUPPETS = {
    arjuna: { pronoun: "he", palette: ["#c27a44", "#f2ead2", "#3b6fb0"], headgear: "crownlet", item: "bow", peer: true },
    bhima: { pronoun: "he", palette: ["#a8622f", "#6f3a24", "#e2b55a"], headgear: "band", item: "mace", big: true, peer: true },
    karna: { pronoun: "he", palette: ["#c9813f", "#d8a536", "#f3d27a"], headgear: "crownlet", item: "bow", armour: true, peer: true },
    duryodhana: { pronoun: "he", palette: ["#b8703b", "#7a1f2a", "#e2b55a"], headgear: "crownlet", item: "mace", peer: true },
    dushasana: { pronoun: "he", palette: ["#b0683a", "#5e2430", "#c9a24e"], headgear: "band", peer: true },
    drona: { pronoun: "he", palette: ["#c9905a", "#efe6cf", "#c9a24e"], beard: true, stage: "elder", item: "bow" },
    kripa: { pronoun: "he", palette: ["#c48a55", "#e7dcc0", "#b49054"], beard: true, stage: "elder", item: "sword" },
    balarama: { pronoun: "he", palette: ["#e9d9b8", "#2c4c86", "#e2b55a"], headgear: "turban", item: "plough", big: true, stage: "adult" },
    mauni: { pronoun: "he", palette: ["#b88352", "#c7a46c", "#8a6a3a"], beard: true, stage: "elder", item: "staff" },
    vidura: { pronoun: "he", palette: ["#c08a56", "#f0e8d6", "#9b8a6a"], beard: true, stage: "elder", item: "scroll" },
    bhishma: { pronoun: "he", palette: ["#cfa274", "#f4efe2", "#d6c08a"], beard: true, stage: "elder" },
    shakuni: { pronoun: "he", palette: ["#b78a5c", "#4b5a73", "#c9b07a"], headgear: "cap", beard: true, stage: "elder", item: "dice" },
    charu: { pronoun: "they", palette: ["#a8683c", "#6b4a32", "#c9a066"], item: "hammer", peer: true },
    ugra: { pronoun: "he", palette: ["#9c5c32", "#5a4630", "#a8875a"], big: true, stage: "adult" },
    guard: { pronoun: "he", palette: ["#9e6a40", "#5d3b2a", "#9f8250"], headgear: "turban", item: "spear", stage: "adult" },
    soldier: { pronoun: "he", palette: ["#9e6a40", "#6e3026", "#b39255"], headgear: "band", item: "spear", stage: "adult" },
    cousin: { pronoun: "she", palette: ["#b9743f", "#b2432a", "#e2b55a"], stage: "child" },
    healer: { pronoun: "she", palette: ["#b47a4a", "#e9dfc6", "#9a8a6a"], item: "bowl", stage: "adult" },
    boy: { pronoun: "he", palette: ["#b0703f", "#8a5a3a", "#c9a066"], stage: "youth" },
    abhimanyu: { pronoun: "he", palette: ["#c27a44", "#f2ead2", "#3b6fb0"], headgear: "crownlet", item: "sword", stage: "youth" }
  };
  U.puppetFor = function (id, S = K.S) {
    const p = K.PUPPETS[id] || K.PUPPETS.guard;
    return Object.assign({ stage: p.peer && S ? K.puppetStage(S.age || 10) : "adult" }, p);
  };

  // Leather is pricked with small holes; one shared pattern for every puppet on the page.
  function ensureDefs() {
    if (document.getElementById("pp-defs")) return;
    const d = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    d.setAttribute("id", "pp-defs"); d.setAttribute("aria-hidden", "true");
    d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    d.innerHTML = '<defs><pattern id="pp-dots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="0.75" fill="#fff3d0" opacity="0.55"/></pattern>' +
      '<pattern id="pp-weave" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 3h6" stroke="#fff3d0" stroke-width="0.6" opacity="0.35"/></pattern></defs>';
    document.body.appendChild(d);
  }

  const OUT = ' stroke="#24120a" stroke-width="1.1" stroke-linejoin="round"';
  const holes = (d) => '<path d="' + d + '" fill="url(#pp-dots)"/>';
  // The things a puppet carries, drawn near the front hand (58,126).
  function itemSvg(kind, trim) {
    switch (kind) {
      case "bow": return '<path d="M61 90 Q82 126 61 162" fill="none" stroke="#5a3418" stroke-width="3" stroke-linecap="round"/><path d="M61 90 L61 162" stroke="#efe2c0" stroke-width="0.8"/>';
      case "mace": return '<path d="M58 128 L58 92" stroke="#5a3418" stroke-width="3"/><circle cx="58" cy="86" r="8.5" fill="' + trim + '"' + OUT + '/><path d="M51 86h14M58 79v14" stroke="#24120a" stroke-width="0.8"/>';
      case "sword": return '<path d="M58 126 L58 88" stroke="#d9d4c6" stroke-width="2.4"/><path d="M53 124h10" stroke="#5a3418" stroke-width="2.4"/>';
      case "spear": return '<path d="M58 160 L58 70" stroke="#5a3418" stroke-width="2"/><path d="M58 60 L62 72 L54 72 Z" fill="#d9d4c6"' + OUT + "/>";
      case "plough": return '<path d="M58 165 L58 74" stroke="#6b4422" stroke-width="3"/><path d="M58 74 Q70 66 74 54 L66 60 Z" fill="#cfc7b2"' + OUT + "/>";
      case "staff": return '<path d="M60 200 L60 100" stroke="#6b4422" stroke-width="2.6" stroke-linecap="round"/>';
      case "whip": return '<path d="M58 126 L66 98" stroke="#5a3418" stroke-width="2"/><path d="M66 98 Q80 90 76 112 Q72 124 84 120" fill="none" stroke="#3d2412" stroke-width="1"/>';
      case "scroll": return '<rect x="52" y="122" width="14" height="7" rx="3" fill="#efe2c0"' + OUT + "/>";
      case "bowl": return '<path d="M50 124 Q58 134 66 124 Z" fill="#9a6a3a"' + OUT + '/><path d="M54 122c1-3 3-3 4 0M59 121c1-3 3-3 4 0" stroke="#4f7d3a" stroke-width="1" fill="none"/>';
      case "dagger": return '<path d="M58 126 L68 112" stroke="#d9d4c6" stroke-width="2"/><path d="M56 122l5 5" stroke="#5a3418" stroke-width="2"/>';
      case "lute": return '<path d="M50 136 Q44 126 52 120 L72 100" stroke="#6b4422" stroke-width="2.6" fill="none"/><circle cx="50" cy="132" r="6" fill="#b9873f"' + OUT + "/>";
      case "hammer": return '<path d="M58 128 L58 100" stroke="#5a3418" stroke-width="2.4"/><rect x="51" y="94" width="14" height="7" fill="#6e6a62"' + OUT + "/>";
      case "dice": return '<rect x="55" y="120" width="5" height="12" rx="1" fill="#efe2c0"' + OUT + '/><rect x="61" y="121" width="5" height="12" rx="1" fill="#efe2c0"' + OUT + "/>";
      default: return "";
    }
  }
  function headgearSvg(kind, trim, cloth) {
    switch (kind) {
      case "crownlet": return '<path d="M52 41 L54 31 L58 38 L62 29 L66 38 L70 31 L72 41 Z" fill="' + trim + '"' + OUT + "/>";
      case "band": return '<path d="M50 43 Q62 37 74 43 L74 46 Q62 40 50 46 Z" fill="' + trim + '"' + OUT + '/><circle cx="70" cy="43" r="1.8" fill="' + cloth + '"/>';
      case "turban": return '<path d="M48 46 Q49 30 63 30 Q76 31 75 45 Q62 38 48 46 Z" fill="' + cloth + '"' + OUT + '/><path d="M52 39 Q62 33 73 39" stroke="' + trim + '" stroke-width="1.4" fill="none"/>';
      case "cap": return '<path d="M50 44 Q50 26 62 25 Q74 26 74 44 Z" fill="' + cloth + '"' + OUT + '/><path d="M50 44 Q62 40 74 44" stroke="' + trim + '" stroke-width="1.6" fill="none"/>';
      case "feather": return '<path d="M55 40 Q48 24 56 14 Q60 26 58 40 Z" fill="#3f6b3a"' + OUT + '/><path d="M56 16 L57 38" stroke="#d9c27a" stroke-width="0.6"/>';
      default: return "";
    }
  }

  U.puppet = function (spec, o = {}) {
    if (!spec) return "";
    ensureDefs();
    const [skin, cloth, trim] = spec.palette || PALETTE.none;
    const she = spec.pronoun === "she", they = spec.pronoun === "they";
    const stage = spec.stage || "adult";
    const scale = o.fit ? (stage === "child" ? 0.86 : 1) : { child: 0.66, youth: 0.86, adult: 1, elder: 0.96 }[stage] * (spec.big ? 1.1 : 1);
    const headScale = stage === "child" ? 1.38 : 1.14;
    const bear = spec.temper ? " t-" + spec.temper : "";
    const pose = o.pose || (spec.dead ? "dead" : "stand");
    const clsx = ["pp", "pose-" + pose, "st-" + stage, bear, spec.limp ? "limp" : "", spec.sling ? "sling" : "", spec.chained ? "chained" : "", spec.dead ? "dead" : "", o.flip ? "flip" : "", o.cls || ""].filter(Boolean).join(" ");
    const h = o.h || 120;
    // Clothing: a dhoti to the knee, a long sari, or a shawl over a dhoti; armour for Karna.
    const skirt = she ? "M48 106 L72 106 L85 190 L37 190 Z" : "M48.5 108 L71.5 108 L80 153 L40 153 Z";
    const hem = she ? "M37 190 L41 185 L45 190 L49 185 L53 190 L57 185 L61 190 L65 185 L69 190 L73 185 L77 190 L81 185 L85 190" : "M40 153 L44 148 L48 153 L52 148 L56 153 L60 148 L64 153 L68 148 L72 153 L76 148 L80 153";
    const torso = "M44 71 Q60 61 76 71 L72 96 L68 116 L52 116 L48 96 Z";
    const back = 'opacity="0.78"';
    const thigh = () => '<path d="M53 116 L67 116 L65.5 152 L54.5 152 Z" fill="' + skin + '"' + OUT + "/>";
    const shin = '<path d="M54.5 152 L65.5 152 L64 186 L56 186 Z" fill="' + skin + '"' + OUT + '/><path d="M55 186 L65 186 L78 191 L55 193 Z" fill="' + skin + '"' + OUT + '/><path d="M56 183h8" stroke="' + trim + '" stroke-width="1.6"/>';
    const upper = '<path d="M52 71 L64 71 L62.5 98 L53.5 98 Z" fill="' + skin + '"' + OUT + "/>";
    const fore = '<path d="M53.5 98 L62.5 98 L61 122 L55 122 Z" fill="' + skin + '"' + OUT + '/><circle cx="58" cy="125.5" r="4.6" fill="' + skin + '"' + OUT + '/><path d="M54.5 116h7" stroke="' + trim + '" stroke-width="1.6"/>';
    const neck = '<path d="M55.5 58 L64.5 58 L63.5 71 L56.5 71 Z" fill="' + skin + '"' + OUT + "/>";
    const rod = '<path class="rod" d="M58 128 L58 236" stroke="#1d0f08" stroke-width="0.9" opacity="0.7"/>';
    const armlet = '<path d="M52.8 80h11" stroke="' + trim + '" stroke-width="2.4"/>';
    const manacle = spec.chained ? '<rect x="54" y="117" width="8" height="4" fill="#5d5d5d"' + OUT + "/>" : "";
    // The face in profile: brow, long nose, the large almond eye of a puppet.
    const head =
      (she ? '<circle cx="49" cy="50" r="6.5" fill="#1d1410"' + OUT + '/><path d="M48 56 Q44 76 47 92" stroke="#1d1410" stroke-width="3.2" fill="none"/>' : "") +
      '<path d="M62 40 C70 40 75 45 75.5 50 L80 54 L75.5 56 C75 61 71 64 64 64 C55 64 50 58 50 51 C50 45 55 40 62 40 Z" fill="' + skin + '"' + OUT + "/>" +
      holes("M62 40 C70 40 75 45 75.5 50 L75.5 56 C75 61 71 64 64 64 C55 64 50 58 50 51 C50 45 55 40 62 40 Z") +
      '<path d="M64 49 Q68 46.5 72 49 Q68 52 64 49 Z" fill="#fff3d6" stroke="#24120a" stroke-width="0.7"/><circle cx="68.6" cy="49.1" r="1.25" fill="#24120a"/>' +
      '<path d="M63.5 45.5 Q68 43.5 73 46" stroke="#24120a" stroke-width="0.9" fill="none"/>' +
      (spec.eye ? '<path d="M62 44 L76 53" stroke="#24120a" stroke-width="2.4"/><ellipse cx="68.5" cy="49" rx="4" ry="3.2" fill="#2a1a12"/>' : "") +
      (!she && !they && !spec.headgear && stage !== "child" ? '<circle cx="57" cy="38" r="4.6" fill="#1d1410"' + OUT + "/>" : "") +
      (they && !spec.headgear ? '<path d="M49 52 Q50 36 63 37 Q73 38 75 44 Q63 40 52 50 Z" fill="' + cloth + '"' + OUT + "/>" : "") +
      (spec.beard ? '<path d="M58 60 Q63 74 70 63 Q72 60 72 58 Q66 64 58 60 Z" fill="#efe8da"' + OUT + "/>" : "") +
      (stage === "elder" && !spec.headgear ? '<path d="M50 50 Q52 40 62 39 Q56 42 52 52 Z" fill="#e8e2d4"/>' : "") +
      headgearSvg(spec.headgear, trim, cloth);
    const backItem = spec.heir === "bow" && spec.item !== "bow" ? '<path d="M46 74 Q34 98 46 122" fill="none" stroke="#5a3418" stroke-width="2.4"/><path d="M46 74 L46 122" stroke="#efe2c0" stroke-width="0.6"/>' : "";
    const belt = '<path d="M49 108 L71 108" stroke="' + trim + '" stroke-width="3"/>' +
      (spec.heir === "manuscript" ? '<rect x="62" y="104" width="9" height="5" rx="2" fill="#efe2c0"' + OUT + "/>" : "") +
      (spec.heir === "debt" ? '<path d="M53 110 q-4 6 0 9 q4 -3 0 -9 Z" fill="#8a6a3a"' + OUT + '/><path d="M51 111 l4 0" stroke="#24120a" stroke-width="0.8"/>' : "");
    const chest = '<path d="M49 74 Q60 86 71 74" stroke="' + trim + '" stroke-width="2" fill="none"/><path d="M52 78 Q60 88 68 78" stroke="' + trim + '" stroke-width="1" fill="none" stroke-dasharray="1.5 1.5"/>' +
      (spec.heir === "amulet" ? '<circle cx="60" cy="81" r="2.6" fill="' + trim + '"' + OUT + "/>" + (spec.cracked ? '<path d="M58.6 79.2 L61 81 L59.6 82.8" stroke="#24120a" stroke-width="0.7" fill="none"/>' : "") : "") +
      (spec.armour ? '<path d="M52 72 Q60 66 68 72 L67 100 Q60 104 53 100 Z" fill="' + trim + '" opacity="0.9"' + OUT + '/><path d="M54 80h12M54 88h12M55 96h10" stroke="#a37a2a" stroke-width="0.8"/>' : "") +
      (spec.scar ? '<path d="M56 86 l8 6 M58 84 l6 5" stroke="#5a2014" stroke-width="0.9"/>' : "");
    const svg =
      // Smaller figures (children) are drawn by widening the view around the feet, so every joint
      // keeps its own coordinates and the CSS joint origins stay exact.
      '<svg class="' + clsx + '" viewBox="' + [60 - 60 / scale, 200 - 200 / scale, 120 / scale, 210 / scale].map((v) => +v.toFixed(2)).join(" ") + '" width="' + Math.round(h * 120 / 210) + '" height="' + h + '"' +
      (o.label ? ' role="img" aria-label="' + U.esc(o.label) + '"' : ' aria-hidden="true"') + ">" +
      '<g class="pp-all">' +
      '<g class="pp-body">' +
        // Back limbs, a shade darker, behind the body.
        '<g class="j legB" ' + back + ">" + thigh() + '<g class="j shinB">' + shin + "</g></g>" +
        '<g class="j armB" ' + back + ">" + upper + '<g class="j foreB">' + fore + manacle + rod + (spec.item === "bow" ? "" : "") + "</g></g>" +
        backItem +
        neck + '<path d="' + torso + '" fill="' + skin + '"' + OUT + "/>" + holes(torso) + chest +
        '<path d="' + skirt + '" fill="' + cloth + '"' + OUT + "/>" + holes(skirt) +
        '<path d="' + skirt + '" fill="url(#pp-weave)"/><path d="' + hem + '" fill="none" stroke="' + trim + '" stroke-width="1.5"/>' + belt +
        '<g class="j head"><g transform="translate(62 64) scale(' + headScale + ') translate(-62 -64)">' + head + "</g></g>" +
        '<g class="j legF">' + thigh() + '<g class="j shinF">' + shin + "</g></g>" +
        '<g class="j armF">' + upper + armlet + '<g class="j foreF">' + fore + manacle + itemSvg(spec.item, trim) + rod + "</g></g>" +
        (spec.sling ? '<path d="M50 76 Q58 112 68 76" fill="none" stroke="#efe2c0" stroke-width="3" opacity="0.9"/>' : "") +
      "</g></g></svg>";
    return svg;
  };

  // A figure in a small frame, for the corner of the page, cards and lists.
  U.puppetBadge = function (spec, o = {}) {
    return '<span class="ppbadge' + (o.cls ? " " + o.cls : "") + '">' + U.puppet(spec, Object.assign({ h: 86 }, o)) + "</span>";
  };
  // Make the corner figure react to what just happened: stand tall, slump, kneel.
  U.puppetReact = function (kind) {
    const el = document.querySelector(".pagehead .ppbadge svg, .ppbadge svg");
    if (!el) return;
    const keep = el.getAttribute("class").replace(/\bpose-\S+/g, "").replace(/\breact-\S+/g, "").trim();
    el.setAttribute("class", keep + " pose-" + ({ win: "cheer", lose: "slump", vow: "kneel" }[kind] || "stand") + " react-" + kind);
    clearTimeout(U.puppetReact.t);
    U.puppetReact.t = setTimeout(() => { if (el.isConnected) el.setAttribute("class", keep + " pose-stand"); }, 2600);
  };
})(window.K = window.K || {});
