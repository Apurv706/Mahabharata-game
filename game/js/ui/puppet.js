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
  // Hair and headdress after the leather puppets of Andhra and Karnataka: a top knot (jata) with a
  // coloured fillet for most people, a peacock feather for the Yadavas and the forest people, tall
  // crowns (kirita) only for princes and kings.
  const HEADGEAR = { hastinapura: "jata", panchala: "jata", matsya: "band", mathura: "peacock", anga: "jata", suta: "band", nishada: "feather", gandhara: "band" };
  const ITEM = { archer: "bow", mace: "mace", charioteer: "whip", strategist: "scroll", healer: "bowl", spy: "dagger", bard: "lute" };

  K.puppetStage = (age) => (age < 13 ? "child" : age < 20 ? "youth" : age < 48 ? "adult" : "elder");
  K.puppetSpec = function (S = K.S) {
    if (!S) return null;
    const inj = S.injuries || [];
    // In the prologue's dream of the war you see yourself grown, with a sword; your age stays six.
    const dreaming = !!(K.SCENES && S.scene && K.SCENES[S.scene] && K.SCENES[S.scene].prologue);
    return {
      stage: dreaming ? "adult" : K.puppetStage(S.age || 6), pronoun: S.pronoun || "they", palette: PALETTE[S.origin] || PALETTE.none,
      headgear: HEADGEAR[S.origin] || null, temper: K.TEMPERAMENTS && K.TEMPERAMENTS[S.temperament] ? S.temperament : null,
      heir: S.heirloom && !(S.flags || []).includes("heirloom_lost") ? S.heirloom : null,
      cracked: (S.flags || []).includes("amulet_broken"),
      item: S.path ? ITEM[S.path] : dreaming ? "sword" : null,
      eye: inj.includes("eye"), sling: inj.includes("arm"), limp: inj.includes("leg"), scar: inj.includes("scar"),
      glow: (S.boons || []).includes("astra") || (S.astras || []).length > 0, // a faint light about one who carries a divine weapon
      chained: (S.flags || []).includes("imprisoned"), cuffed: (S.flags || []).includes("was_imprisoned") && !(S.flags || []).includes("imprisoned"), dead: S.alive === false
    };
  };

  // Other people: a few fixed traits; their age follows the player's for the princes.
  // The great ones of the epic wear tall crowns in their own stones, each with one mark of his own,
  // and stand a little larger than ordinary people once grown (size); a stance is how they stand.
  K.PUPPETS = {
    arjuna: { pronoun: "he", palette: ["#c27a44", "#f2ead2", "#3b6fb0"], headgear: "crown", crown: { gem: "#3b6fb0", tall: 1.05, trim: "#3b6fb0" }, item: "bow", gear: ["gandiva", "quivers"], stance: "hero", size: 1.12, peer: true },
    bhima: { pronoun: "he", palette: ["#a8622f", "#6f3a24", "#e2b55a"], headgear: "crown", crown: { gem: "#b2432a", broad: true, trim: "#6f3a24" }, item: "mace", studs: ["#d9a53a"], stance: "broad", big: true, size: 1.25, peer: true },
    karna: { pronoun: "he", palette: ["#c9813f", "#d8a536", "#f3d27a"], headgear: "crown", crown: { gem: "#b2432a", tall: 1, trim: "#b2432a" }, item: "bow", armour: true, gear: ["earrings"], stance: "hero", size: 1.12, peer: true },
    duryodhana: { pronoun: "he", palette: ["#b8703b", "#7a1f2a", "#e2b55a"], headgear: "crown", crown: { gem: ["#2f7d55", "#b2432a", "#2d5aa0", "#b2432a"], tall: 1.15, trim: "#7a1f2a" }, item: "mace", studs: ["#b2432a", "#2d5aa0", "#2f7d55", "#2d5aa0", "#b2432a"], stance: "haughty", size: 1.15, peer: true },
    dushasana: { pronoun: "he", palette: ["#b0683a", "#5e2430", "#c9a24e"], headgear: "mukuta", peer: true },
    // Drona, a brahmin, keeps his matted knot: a grey forked beard and a water-pot at his hip.
    drona: { pronoun: "he", headgear: "jata", palette: ["#c9905a", "#efe6cf", "#c9a24e"], beard: "forked", stage: "elder", item: "bow", gear: ["waterpot"], stance: "sage", size: 1.12 },
    kripa: { pronoun: "he", headgear: "jata", palette: ["#c48a55", "#e7dcc0", "#b49054"], beard: true, stage: "elder", item: "sword" },
    balarama: { pronoun: "he", palette: ["#e9d9b8", "#2c4c86", "#e2b55a"], headgear: "kirita", item: "plough", big: true, stage: "adult" },
    mauni: { pronoun: "he", headgear: "jata", palette: ["#b88352", "#c7a46c", "#8a6a3a"], beard: true, stage: "elder", item: "staff" },
    vidura: { pronoun: "he", headgear: "jata", palette: ["#c08a56", "#f0e8d6", "#9b8a6a"], beard: true, stage: "elder", item: "scroll" },
    // The sutradhara, who holds the strings of the story and opens each act.
    sutradhara: { pronoun: "he", headgear: "band", palette: ["#c8925e", "#e9dcc0", "#b2432a"], beard: true, stage: "elder", item: "scroll" },
    bhishma: { pronoun: "he", headgear: "crown", crown: { gem: "#d9a53a", tall: 0.85, white: true, trim: "#d9a53a" }, palette: ["#cfa274", "#f4efe2", "#d6c08a"], beard: "long", stage: "elder", item: "bow", stance: "sage", size: 1.22 },
    dhrishtadyumna: { pronoun: "he", headgear: "mukuta", palette: ["#c27a44", "#b2432a", "#e2b55a"], item: "sword", stage: "adult" },
    shakuni: { pronoun: "he", palette: ["#b78a5c", "#4b5a73", "#c9b07a"], headgear: "band", beard: true, stage: "elder", item: "dice" },
    charu: { pronoun: "they", palette: ["#a8683c", "#6b4a32", "#c9a066"], item: "hammer", peer: true },
    ugra: { pronoun: "he", palette: ["#9c5c32", "#5a4630", "#a8875a"], big: true, stage: "adult" },
    // Ordinary fighters wear helmets or turbans, never crowns: a palace guard in a tall turban and
    // sash, his spear upright; a soldier in a leather helmet and cuirass behind a round hide shield.
    guard: { pronoun: "he", palette: ["#9e6a40", "#5d3b2a", "#9f8250"], headgear: "turban", hat: "#c9a24e", hatTrim: "#6e3026", gear: ["sash"], item: "spear", stance: "square", stage: "adult" },
    soldier: { pronoun: "he", palette: ["#9e6a40", "#6e3026", "#b39255"], headgear: "helmet", gear: ["shield", "cuirass"], item: "spear", stance: "square", stage: "adult" },
    cousin: { pronoun: "she", palette: ["#b9743f", "#b2432a", "#e2b55a"], stage: "child" },
    healer: { pronoun: "she", palette: ["#b47a4a", "#e9dfc6", "#9a8a6a"], item: "bowl", stage: "adult" },
    boy: { pronoun: "he", palette: ["#b0703f", "#8a5a3a", "#c9a066"], stage: "youth" },
    abhimanyu: { pronoun: "he", palette: ["#c27a44", "#f2ead2", "#3b6fb0"], headgear: "mukuta", item: "sword", stage: "youth" }
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
  // Weapons and tools are drawn resting in a hanging hand, pointing up along the arm. When the arm
  // is raised or reaching (a strike, a block, a cheer), CSS turns them about the hand so they carry
  // on past the fist the way a held weapon does, instead of hanging upside down.
  const WIELD = new Set(["mace", "sword", "woodsword", "spear", "dagger", "hammer", "staff", "plough", "whip", "club"]);
  // o.tips: the Gandiva's gold tips; o.studs: stones (or gold studs) set in a mace's head.
  function itemSvg(kind, trim, o = {}) {
    switch (kind) {
      // A recurved bow held at its grip: the belly passes through the hand, the string runs behind the arm.
      case "bow": return '<path d="M50 86 Q72 126 50 166" fill="none" stroke="#5a3418" stroke-width="3.2" stroke-linecap="round"/>' +
        '<path d="M50 86 q-3.5 -2.5 -2 -6.5 M50 166 q-3.5 2.5 -2 6.5" fill="none" stroke="#5a3418" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M50 86 L50 166" stroke="#efe2c0" stroke-width="0.8"/><path d="M59.8 120 L61.6 132" stroke="' + trim + '" stroke-width="3.4"/>' +
        (o.tips ? '<circle cx="50" cy="84" r="2.6" fill="' + GOLD + '"' + OUT + '/><circle cx="50" cy="168" r="2.6" fill="' + GOLD + '"' + OUT + '/><path d="M50 86 Q72 126 50 166" fill="none" stroke="' + GOLD + '" stroke-width="1.1" stroke-dasharray="3 6"/>' : "");
      // The gada: a long haft with a wrapped grip and a pommel, a gold collar, and a heavy ribbed head
      // with a spike, tilted forward out of the figure so its shape reads at any size.
      case "mace": return '<g transform="rotate(20 58 126)">' +
        '<rect x="56.3" y="74" width="3.4" height="62" rx="1.2" fill="#6b4422"' + OUT + '/>' +
        '<path d="M56.3 119h3.4M56.3 123h3.4M56.3 127h3.4M56.3 131h3.4" stroke="' + trim + '" stroke-width="1.3"/>' +
        '<circle cx="58" cy="137.5" r="2.8" fill="' + GOLD + '"' + OUT + '/>' +
        '<path d="M58 44 L56.4 38.5 L58 33 L59.6 38.5 Z" fill="' + GOLD + '"' + OUT + '/>' +
        '<path d="M58 43 C66.5 43 70 51.5 69.5 59 C69 67.5 63.5 73 58 73 C52.5 73 47 67.5 46.5 59 C46 51.5 49.5 43 58 43 Z" fill="' + GOLD + '"' + OUT + '/>' +
        '<path d="M58 43 Q50.5 58 58 73 M58 43 Q65.5 58 58 73 M52 46 Q46.5 58 52 71 M64 46 Q69.5 58 64 71" fill="none" stroke="#7a5418" stroke-width="0.9"/>' +
        '<path d="M47 59 Q58 63 69 59" fill="none" stroke="' + trim + '" stroke-width="1.8"/>' + holes("M58 43 C66.5 43 70 51.5 69.5 59 C69 67.5 63.5 73 58 73 C52.5 73 47 67.5 46.5 59 C46 51.5 49.5 43 58 43 Z") +
        '<rect x="54.2" y="72" width="7.6" height="4.4" rx="1" fill="' + GOLD + '"' + OUT + '/>' +
        (o.studs ? [52, 58, 64, 55, 61].map((x, i) => '<circle cx="' + x + '" cy="' + [52, 50, 52, 64, 64][i] + '" r="2" fill="' + o.studs[i % o.studs.length] + '" stroke="#24120a" stroke-width=".7"/>').join("") : "") + "</g>";
      // A khadga: broad blade swelling towards a curved point, a cross-guard, a grip and a pommel.
      case "sword": return '<g transform="rotate(16 58 126)">' +
        '<path d="M56.2 119 L55.4 84 Q56 74 62.5 68 Q61.6 78 61 86 L59.8 119 Z" fill="#dcd7c8"' + OUT + '/><path d="M58 117 L57.8 86 Q58.6 78 61 73" fill="none" stroke="#9a9484" stroke-width="0.7"/>' +
        '<path d="M51.5 119.5 L64.5 119.5 L63 122.5 L53 122.5 Z" fill="' + GOLD + '"' + OUT + '/><rect x="56.4" y="122.5" width="3.2" height="9" fill="#5a3418"' + OUT + '/><circle cx="58" cy="133.5" r="2.4" fill="' + GOLD + '"' + OUT + '/></g>';
      // A practice sword of wood: the same broad blade in teak, a plain cross-piece, a cord-wrapped grip.
      case "woodsword": return '<g transform="rotate(16 58 126)">' +
        '<path d="M56.2 119 L55.4 84 Q56 74 62.5 68 Q61.6 78 61 86 L59.8 119 Z" fill="#b5834a"' + OUT + '/><path d="M58 117 L57.8 86 Q58.6 78 61 73" fill="none" stroke="#7a5228" stroke-width="0.8"/>' +
        '<path d="M52 119.5 L64 119.5 L64 122.5 L52 122.5 Z" fill="#8a5a2c"' + OUT + '/><rect x="56.4" y="122.5" width="3.2" height="9" fill="#5a3418"' + OUT + '/><path d="M56.4 125h3.2M56.4 128h3.2" stroke="#d9b26a" stroke-width="0.9"/></g>';
      // A spear: a long shaft, a leaf-shaped head on a collar, and a red tassel below it.
      case "spear": return '<path d="M58 176 L58 64" stroke="#5a3418" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M58 40 Q63.5 52 60.4 63 L55.6 63 Q52.5 52 58 40 Z" fill="#dcd7c8"' + OUT + '/><path d="M58 44 L58 62" stroke="#9a9484" stroke-width="0.7"/>' +
        '<rect x="55.8" y="62.5" width="4.4" height="3.4" fill="' + GOLD + '"' + OUT + '/><path d="M56.5 66 q-3 5 -1.5 10 M58 66 q-0.5 6 0.5 11 M59.5 66 q2.5 5 1.5 9.5" fill="none" stroke="#b2432a" stroke-width="1.3" stroke-linecap="round"/>';
      // A bandit's knotted club, thick at the head.
      case "club": return '<path d="M56.6 128 L55.4 96 Q53 84 56 74 Q61 66 66 72 Q68 82 62 96 L60 128 Z" fill="#6b4422"' + OUT + '/><circle cx="58" cy="82" r="1.6" fill="#3a2412"/><circle cx="62" cy="88" r="1.4" fill="#3a2412"/><circle cx="57" cy="94" r="1.2" fill="#3a2412"/>';
      case "plough": return '<path d="M58 165 L58 74" stroke="#6b4422" stroke-width="3"/><path d="M58 74 Q70 66 74 54 L66 60 Z" fill="#cfc7b2"' + OUT + "/>";
      case "staff": return '<path d="M60 200 L60 100" stroke="#6b4422" stroke-width="2.6" stroke-linecap="round"/>';
      case "whip": return '<path d="M58 126 L66 98" stroke="#5a3418" stroke-width="2"/><path d="M66 98 Q80 90 76 112 Q72 124 84 120" fill="none" stroke="#3d2412" stroke-width="1"/>';
      case "scroll": return '<rect x="52" y="122" width="14" height="7" rx="3" fill="#efe2c0"' + OUT + "/>";
      case "bowl": return '<path d="M50 124 Q58 134 66 124 Z" fill="#9a6a3a"' + OUT + '/><path d="M54 122c1-3 3-3 4 0M59 121c1-3 3-3 4 0" stroke="#4f7d3a" stroke-width="1" fill="none"/>';
      // A short dagger, its blade forward out of the fist.
      case "dagger": return '<g transform="rotate(38 58 126)"><path d="M56.6 120 L57.2 102 L58 98 L58.8 102 L59.4 120 Z" fill="#dcd7c8"' + OUT + '/><path d="M53.5 120 L62.5 120 L61.5 122.5 L54.5 122.5 Z" fill="' + GOLD + '"' + OUT + '/><rect x="56.6" y="122.5" width="2.8" height="7" fill="#5a3418"' + OUT + '/></g>';
      case "lute": return '<path d="M50 136 Q44 126 52 120 L72 100" stroke="#6b4422" stroke-width="2.6" fill="none"/><circle cx="50" cy="132" r="6" fill="#b9873f"' + OUT + "/>";
      case "hammer": return '<path d="M58 128 L58 100" stroke="#5a3418" stroke-width="2.4"/><rect x="51" y="94" width="14" height="7" fill="#6e6a62"' + OUT + "/>";
      case "dice": return '<rect x="55" y="120" width="5" height="12" rx="1" fill="#efe2c0"' + OUT + '/><rect x="61" y="121" width="5" height="12" rx="1" fill="#efe2c0"' + OUT + "/>";
      default: return "";
    }
  }
  // Hair first (a cap of dark hair over the skull), then the headdress on top of it.
  const HAIR = (c) => '<path d="M50 52 Q49 39 62 37.5 Q72 37.5 75.5 44 Q64 40.5 53 53 Z" fill="' + c + '"' + OUT + "/>";
  const KNOT = (c) => '<circle cx="57" cy="34.5" r="5.8" fill="' + c + '"' + OUT + "/>";
  const GOLD = "#d9a53a";
  // A crown for the great ones of the epic: twice the height of a kirita, with a fan of gold behind
  // the head as on the great leather puppets, and set with the hero's own stones. o.tall scales its
  // height, o.broad makes it broad and spiked instead, o.white is white and gold.
  function crownSvg(o) {
    const tall = o.tall || 1, top = 46 - 40 * tall, y1 = 46 - 22 * tall, y2 = 46 - 32 * tall, gem = o.gem || "#b2432a";
    const body = o.broad ? "M50 46 L50 34 Q51 24 62 22 Q73 24 74 34 L74 46 Z"
      : "M50.5 46 L52 37 L54.5 37 L55.5 " + y1 + " L58 " + y1 + " L59 " + y2 + " L60.6 " + y2 + " Q62 " + (top - 2) + " 63.4 " + y2 + " L65 " + y2 + " L66 " + y1 + " L68.5 " + y1 + " L69.5 37 L72 37 L73.5 46 Z";
    const metal = o.white ? "#efe6cf" : GOLD;
    const fanD = "M52 46 Q36 46 33 30 Q40 34 46 32 Q38 22 41 10 Q48 22 54 30 Q50 20 54 12 Q57 24 57 34 Z";
    const gems = (o.broad ? [[56, 38], [62, 34], [68, 38]] : [[62, 40], [62, 46 - 27 * tall], [56.5, 41], [67.5, 41]]).map(([x, y], i) => '<circle cx="' + x + '" cy="' + y + '" r="' + (i ? 1.5 : 2.4) + '" fill="' + (Array.isArray(gem) ? gem[i % gem.length] : gem) + '" stroke="#24120a" stroke-width=".7"/>').join("");
    return '<path d="' + fanD + '" fill="' + metal + '"' + OUT + "/>" + holes(fanD) +
      (o.broad ? '<path d="M50 34 L48 27 L53 30 L56 22 L59 27 L62 18 L65 27 L68 22 L71 30 L76 27 L74 34" fill="' + metal + '"' + OUT + "/>" : "") +
      '<path d="' + body + '" fill="' + metal + '"' + OUT + "/>" + holes(body) +
      '<path d="M50.6 43 Q62 39 73.4 43" fill="none" stroke="' + (o.trim || "#b2432a") + '" stroke-width="2"/>' + gems +
      (o.broad ? "" : '<circle cx="62" cy="' + (top - 3) + '" r="2.8" fill="' + metal + '"' + OUT + "/>") +
      '<path d="M50.5 45 Q62 38.5 74.5 44 L74 47 Q62 41.5 51 48 Z" fill="' + metal + '"' + OUT + "/>";
  }
  // A leather helmet with a spike and a neck flap, for soldiers; a horsehair crest on it for horsemen and champions.
  const HELMET = "M48 51 Q46 31 63 30 Q79 31 77 47 L73 47 Q63 41 53 53 Z";
  const helmetSvg = (t) => '<path d="' + HELMET + '" fill="#7a5a3a"' + OUT + "/>" + holes(HELMET) +
    '<path d="M50 41 Q63 32 77 44" fill="none" stroke="' + t + '" stroke-width="2.2"/><path d="M63 30 L63 22 M60 23 h6" stroke="#24120a" stroke-width="1.6" stroke-linecap="round"/><path d="M48 48 L43 64 L52 61 Z" fill="#6b4a2c"' + OUT + "/>";
  const TURBAN = "M49 48 Q48 30 63 28 Q78 30 77 45 Q63 38 49 48 Z";
  function headgearSvg(kind, trim, cloth, hair, elder, spec = {}) {
    const hat = spec.hat || cloth, ht = spec.hatTrim || trim;
    const band = (c) => '<path d="M50.5 45 Q62 38.5 74.5 44 L74 47 Q62 41.5 51 48 Z" fill="' + c + '"' + OUT + "/>";
    const fillet = band(trim), goldFillet = band(GOLD);
    switch (kind) {
      // A tall tiered crown, with a jewel at the front and a fan of ornament behind the ear.
      // A stepped temple crown, as the leather puppets of the south wear it.
      case "kirita": return '<path d="M52 45 Q46 42 47.5 35 Q51 40 55 41 Z" fill="' + GOLD + '"' + OUT + "/>" +
        '<path d="M53 43 L54 36 L56 36 L57 30 L59 30 L60 25 Q62 21 64 25 L65 30 L67 30 L68 36 L70 36 L71 43 Z" fill="' + GOLD + '"' + OUT + "/>" + holes("M53 43 L54 36 L56 36 L57 30 L59 30 L60 25 Q62 21 64 25 L65 30 L67 30 L68 36 L70 36 L71 43 Z") +
        '<path d="M55 38.5 L69 38.5 M57 32.5 L67 32.5" stroke="' + trim + '" stroke-width="1.3" fill="none"/><circle cx="62" cy="35.5" r="1.5" fill="' + trim + '"/><circle cx="62" cy="21" r="2.2" fill="' + GOLD + '"' + OUT + "/>" + goldFillet + '<circle cx="70" cy="44" r="1.7" fill="' + trim + '"/>';
      // A smaller crown for younger princes and lesser kings.
      case "mukuta": return '<path d="M54 43 L56 32 Q62 24 68 32 L70 43 Z" fill="' + GOLD + '"' + OUT + "/>" + holes("M54 43 L56 32 Q62 24 68 32 L70 43 Z") + '<path d="M56 37 Q62 33 68 37" stroke="' + trim + '" stroke-width="1.3" fill="none"/><circle cx="62" cy="24.5" r="2" fill="' + GOLD + '"' + OUT + "/>" + goldFillet;
      // A top knot tied with a coloured fillet.
      // Elders wear the knot bare: a sage's matted hair, with a string of rudraksha.
      case "jata": return KNOT(hair) + (elder ? '<path d="M52.5 36 Q57 31.5 61.5 36" stroke="#6b3a1c" stroke-width="1.4" stroke-dasharray="0.1 2" stroke-linecap="round" fill="none"/>' : '<path d="M52.5 36 Q57 32 61.5 36" stroke="' + trim + '" stroke-width="1.6" fill="none"/>' + fillet);
      case "band": return KNOT(hair) + fillet + '<circle cx="71" cy="44.6" r="1.9" fill="' + cloth + '"' + OUT + "/>";
      // A peacock feather in the knot, as the Yadavas wear it.
      case "peacock": return KNOT(hair) + '<path d="M57 32 Q56 20 62 13" stroke="#3f6b3a" stroke-width="1.2" fill="none"/><ellipse cx="62.5" cy="12" rx="3.6" ry="4.6" fill="#2f7d55"' + OUT + '/><ellipse cx="62.6" cy="12.4" rx="1.8" ry="2.4" fill="#2d5aa0"/><circle cx="62.7" cy="12.6" r="0.9" fill="#d9c27a"/>' + fillet;
      // Feathers stuck in the knot, for the forest people.
      case "feather": return KNOT(hair) + '<path d="M55 32 Q48 20 55 10 Q59 22 57 32 Z" fill="#3f6b3a"' + OUT + '/><path d="M59 32 Q62 21 68 16 Q66 26 61 33 Z" fill="#b2432a"' + OUT + "/>" + fillet;
      case "crown": return crownSvg(spec.crown || {});
      // A bandit's head scarf, its ends trailing behind.
      case "scarf": return '<path d="M50 47 Q52 36 63 35 Q74 36 76 44 L75 48 Q63 42 51 50 Z" fill="' + hat + '"' + OUT + '/><path d="M51 49 L39 58 L43 51 L36 55 L46 46 Z" fill="' + hat + '"' + OUT + '/><circle cx="51" cy="47" r="2.6" fill="' + hat + '"' + OUT + "/>";
      // A palace guard's tall wrapped turban.
      case "turban": return '<path d="' + TURBAN + '" fill="' + hat + '"' + OUT + "/>" + holes(TURBAN) + '<path d="M50 43 Q62 32 76 40 M50 37 Q62 28 74 34" fill="none" stroke="' + ht + '" stroke-width="1.4"/><path d="M63 28 Q66 22 70 24 Q66 26 65 29 Z" fill="' + ht + '"' + OUT + "/>";
      case "helmet": return helmetSvg(ht);
      case "crest": return helmetSvg(ht) + '<path d="M62 25 Q50 10 36 18 Q46 18 50 28 Q42 24 38 30 Q52 26 60 31 Z" fill="' + hat + '"' + OUT + "/>";
      // An archer's close cap with one white feather.
      case "capfeather": return '<path d="M50 47 Q50 34 63 33 Q76 34 76 45 Q63 39 50 47 Z" fill="' + hat + '"' + OUT + '/><path d="M51 44 Q63 37 75 43" fill="none" stroke="' + ht + '" stroke-width="1.6"/><path d="M54 36 Q46 20 52 8 Q58 22 57 35 Z" fill="#e9dcc0"' + OUT + '/><path d="M54 33 L53 14" stroke="#24120a" stroke-width=".7"/>';
      default: return "";
    }
  }

  // Marks of the great ones. Age in the beard, hung on the jaw so it moves with speech: Bhishma's long
  // and white to the waist, Drona's grey and forked to the chest, each with a drooping moustache.
  const BEARD = {
    long: '<path d="M54 57 Q51 72 55 86 Q59 100 64 110 Q67 99 71 88 Q77 73 74.5 58 Q64 66 54 57 Z" fill="#f6f2e6"' + OUT + '/><path d="M58 66 Q59 84 63 102 M63 66 Q64 84 65.5 104 M68 66 Q69 80 68 96 M72 63 Q73 74 71 86" fill="none" stroke="#b9b0a0" stroke-width=".8"/><path d="M68 59.5 Q74 57 79 60 Q80 66 77 70 Q76 63 70 62 Z" fill="#f6f2e6"' + OUT + "/>",
    forked: '<path d="M55 58 Q53 68 57 78 Q61 86 63 92 Q65 86 66 82 Q68 87 71 89 Q71 80 72 74 Q75 66 73 58 Q64 65 55 58 Z" fill="#b3ab9c"' + OUT + '/><path d="M59 66 Q60 76 62 86 M64 66 Q65 74 66 81 M69 64 Q70 72 70 82" fill="none" stroke="#7d7568" stroke-width=".8"/><path d="M68 59.5 Q74 57.4 78.6 60 Q79 64 77 67 Q75.6 62.6 70 62 Z" fill="#b3ab9c"' + OUT + "/>"
  };
  // Karna's great gold earrings, born with him; the jewel glowing in Ashwatthama's brow.
  const EARRING = '<circle cx="56.5" cy="60" r="5.4" fill="' + GOLD + '"' + OUT + '/><circle cx="56.5" cy="60" r="2.4" fill="#b2432a"' + OUT + '/><path d="M51.5 60 h10" stroke="#fff3c4" stroke-width=".6"/>';
  const BROWGEM = '<circle cx="72.6" cy="44" r="2.3" fill="#9fe8ff" stroke="#24120a" stroke-width=".8"/><circle cx="72.6" cy="44" r="5" fill="#9fe8ff" opacity=".35"/>';
  // Drona's water-pot (kamandalu) at his hip.
  const KAMANDALU = '<path d="M64 112 Q60 122 64 128 Q70 132 76 128 Q80 122 76 112 Z" fill="#8a5a2c"' + OUT + '/><path d="M68 112 Q70 104 74 106 L72 112" fill="none" stroke="#24120a" stroke-width="1.2"/><path d="M76 116 Q82 112 84 114" fill="none" stroke="#5a3418" stroke-width="1.8"/>';
  // Arjuna's twin quivers: the second, behind the first.
  const QUIVER2 = '<path d="M50 74 L42 76 L40 106 L46 106 Z" fill="#6b4422"' + OUT + '/><path d="M44 75 L40 64 M46.5 75 L44 64 M48.5 75 L48 64" stroke="#efe2c0" stroke-width="1.2"/><path d="M40 64 l-1.6 -3 l3 1 M44 64 l-1 -3 l2.6 1.6 M48 64 l0 -3 l2 2" fill="#b2432a" stroke="none"/>';
  // A champion's gold scale armour, with a shoulder piece.
  const SCALE = '<path d="M48 72 Q60 64 72 72 L71 106 Q60 112 49 106 Z" fill="' + GOLD + '"' + OUT + '/><g fill="none" stroke="#7a5418" stroke-width=".9"><path d="M50 78 q3 3 6 0 q3 3 6 0 q3 3 6 0"/><path d="M50 85 q3 3 6 0 q3 3 6 0 q3 3 6 0"/><path d="M50 92 q3 3 6 0 q3 3 6 0 q3 3 6 0"/><path d="M50 99 q3 3 6 0 q3 3 6 0 q3 3 6 0"/></g><path d="M44 72 Q48 64 56 68 L54 78 Q47 78 44 72 Z" fill="' + GOLD + '"' + OUT + "/>";
  // A round hide shield with a gold boss, on the back forearm.
  const shieldSvg = (r, t) => '<circle cx="58" cy="112" r="' + r + '" fill="#8a5a2c"' + OUT + '/><circle cx="58" cy="112" r="' + (r - 3.5) + '" fill="none" stroke="' + t + '" stroke-width="2"/><circle cx="58" cy="112" r="4" fill="' + GOLD + '"' + OUT + "/>" +
    holes("M" + (58 - r) + " 112 a" + r + " " + r + " 0 1 0 " + 2 * r + " 0 a" + r + " " + r + " 0 1 0 " + -2 * r + " 0");

  U.puppet = function (spec, o = {}) {
    if (!spec) return "";
    ensureDefs();
    const [skin, cloth, trim] = spec.palette || PALETTE.none;
    const she = spec.pronoun === "she", they = spec.pronoun === "they";
    const stage = spec.stage || "adult";
    const grown = stage === "adult" || stage === "elder";
    // Strength shows in the size: a bandit is small, a champion large, the great ones larger still once grown.
    const scale = o.fit ? (stage === "child" ? 0.86 : 1) : { child: 0.66, youth: 0.86, adult: 1, elder: 0.96 }[stage] * (grown && spec.size ? spec.size : spec.big ? 1.1 : 1);
    const gear = (g) => !!spec.gear && spec.gear.includes(g);
    const headScale = stage === "child" ? 1.38 : 1.14;
    // Only a known temperament id becomes a class (a stored figure or a pasted save code could hold anything).
    const bear = spec.temper && /^[a-z_]+$/.test(spec.temper) ? " t-" + spec.temper : "";
    const pose = o.pose || (spec.dead ? "dead" : "stand");
    // How someone stands when at rest (a bandit's stoop, a guard square behind his spear): a class for
    // the CSS pose, and data-stance for a live figure (puppet-anim.js). Only a known kind of word.
    const stance = spec.stance && /^[a-z]+$/.test(spec.stance) ? spec.stance : "";
    const clsx = ["pp", "pose-" + pose, "st-" + stage, bear, stance ? "sx sx-" + stance : "", spec.glow ? "glow" : "", spec.limp ? "limp" : "", spec.sling ? "sling" : "", spec.chained ? "chained" : "", spec.dead ? "dead" : "", o.flip ? "flip" : "", o.cls || ""].filter(Boolean).join(" ");
    const h = o.h || 120;
    // Clothing: a dhoti to the knee, a long sari, or a shawl over a dhoti; armour for Karna.
    const skirt = she ? "M48 106 L72 106 L85 190 L37 190 Z" : "M48.5 108 L71.5 108 L80 153 L40 153 Z";
    const hem = she ? "M37 190 L41 185 L45 190 L49 185 L53 190 L57 185 L61 190 L65 185 L69 190 L73 185 L77 190 L81 185 L85 190" : "M40 153 L44 148 L48 153 L52 148 L56 153 L60 148 L64 153 L68 148 L72 153 L76 148 L80 153";
    const torso = "M44 71 Q60 61 76 71 L72 96 L68 116 L52 116 L48 96 Z";
    const back = 'opacity="0.78"';
    const thigh = () => '<path d="M53 116 L67 116 L65.5 152 L54.5 152 Z" fill="' + skin + '"' + OUT + "/>";
    const shin = '<path d="M54.5 152 L65.5 152 L64 186 L56 186 Z" fill="' + skin + '"' + OUT + '/><path d="M55 186 L65 186 L78 191 L55 193 Z" fill="' + skin + '"' + OUT + '/><path d="M56 183h8" stroke="' + trim + '" stroke-width="1.6"/>';
    const upper = '<path d="M52 71 L64 71 L62.5 98 L53.5 98 Z" fill="' + skin + '"' + OUT + "/>";
    const fore = '<path d="M53.5 98 L62.5 98 L61 122 L55 122 Z" fill="' + skin + '"' + OUT + '/><circle cx="58" cy="125.5" r="4.6" fill="' + skin + '"' + OUT + '/><path d="M54.5 116h7" stroke="' + trim + '" stroke-width="1.6"/>' +
      (she ? '<path d="M54.6 113h7.2M54.8 110.5h7" stroke="' + trim + '" stroke-width="1.1"/>' : "");
    const neck = '<path d="M55.5 58 L64.5 58 L63.5 71 L56.5 71 Z" fill="' + skin + '"' + OUT + "/>";
    // No rods on the hands: drawn in the forearm's frame, a hand rod swung out ahead of every raised
    // or reaching arm like a stick. The body's main rod is enough to say "puppet".
    const rod = "";
    const armlet = '<path d="M52.8 80h11" stroke="' + trim + '" stroke-width="2.4"/>';
    // In chains while imprisoned; afterwards, the broken iron still on one wrist.
    const manacle = spec.chained ? '<rect x="54" y="117" width="8" height="4" fill="#5d5d5d"' + OUT + "/>" : "";
    const cuff = spec.cuffed ? '<rect x="53.5" y="114" width="9" height="3.6" fill="#6a6a6a"' + OUT + '/><path d="M62.5 115.8 l3 1.6" stroke="#6a6a6a" stroke-width="1.4"/>' : "";
    // The face in profile: brow, long nose, the large almond eye of a puppet; a tilak on the brow,
    // large round earrings, a curled moustache on grown men, a bun with flowers and a nose ring on women.
    const hair = stage === "elder" ? "#d4ccbc" : "#1d1410";
    const face = "M62 40 C70 40 75 45 75.5 50 L80 54 L75.5 56 C75 61 71 64 64 64 C55 64 50 58 50 51 C50 45 55 40 62 40 Z";
    const head =
      (she ? '<path d="M48 55 Q42 74 45 94" stroke="' + hair + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>' : "") +
      '<path d="' + face + '" fill="' + skin + '"' + OUT + "/>" + holes(face) +
      HAIR(hair) +
      (she ? '<circle cx="49" cy="48" r="6.6" fill="' + hair + '"' + OUT + '/><path d="M44 44 Q49 40 54 44" stroke="#f3ead2" stroke-width="1.8" stroke-dasharray="1.2 1.6" fill="none"/>' : "") +
      '<path d="M64 49 Q68 46.5 72 49 Q68 52 64 49 Z" fill="#fff3d6" stroke="#24120a" stroke-width="0.7"/><circle cx="68.6" cy="49.1" r="1.25" fill="#24120a"/>' +
      '<path d="M63.5 45.5 Q68 43.5 73 46" stroke="#24120a" stroke-width="0.9" fill="none"/>' +
      '<path d="M73.6 41.8 L74.3 45.6" stroke="#c0281e" stroke-width="1.3" stroke-linecap="round"/>' +
      (spec.eye ? '<path d="M62 44 L76 53" stroke="#24120a" stroke-width="2.4"/><ellipse cx="68.5" cy="49" rx="4" ry="3.2" fill="#2a1a12"/>' : "") +
      (!she && grown && !spec.beard ? '<path d="M71 58.2 Q74.5 56.6 77.4 58.4 Q78.6 60.4 76.6 60.6 Q76.8 59.2 74.6 59.2 Q72.8 59.4 71 58.2 Z" fill="' + hair + '"/>' : "") +
      // The lower jaw is a separate piece on a hinge (the beard rides on it), so the puppet can speak.
      '<g class="jaw"><path d="M56 59 Q63 67 73 60 L73.5 62 Q63 71 55.5 61 Z" fill="' + skin + '"' + OUT + "/>" +
      (spec.beard ? '<path d="M58 60 Q63 76 71 63 Q72.5 60 72 58 Q66 64 58 60 Z" fill="' + hair + '"' + OUT + "/>" : "") + (BEARD[spec.beard] || "") + "</g>" +
      (she ? '<circle cx="78.6" cy="57.2" r="1.7" fill="none" stroke="' + trim + '" stroke-width="0.9"/>' : "") +
      (stage !== "child" ? '<circle cx="56.5" cy="58.5" r="2.9" fill="' + trim + '"' + OUT + '/><circle cx="56.5" cy="58.5" r="1.1" fill="' + cloth + '"/>' : "") +
      headgearSvg(she ? (spec.headgear === "kirita" || spec.headgear === "mukuta" ? spec.headgear : null) : spec.headgear || (they ? "band" : "jata"), trim, cloth, hair, stage === "elder", spec) +
      (gear("earrings") ? EARRING : "") + (gear("browgem") ? BROWGEM : "");
    // Behind everything: Arjuna's second quiver, once he carries the Gandiva.
    const behind = gear("quivers") && grown ? QUIVER2 : "";
    // On the back arm: a round hide shield, or a horseman's small one.
    const backHand = gear("shield") ? shieldSvg(19, trim) : gear("buckler") ? shieldSvg(13, trim) : "";
    // Over the body: a leather cuirass, gold scale armour, a guard's sash, a torn hem, a water-pot at the hip.
    const bodyGear = (gear("torn") ? '<path d="M40 151 L43 160 L46 152 L49 163 L53 152 L56 158 L60 151 L63 162 L67 152 L71 159 L74 151 L78 157 L80 151 Z" fill="' + cloth + '"' + OUT + '/><path d="M48 112 L72 112" stroke="#3a2412" stroke-width="2.4"/>' : "") +
      (gear("sash") ? '<path d="M50 72 L70 106" stroke="' + (spec.hat || trim) + '" stroke-width="3"/>' : "") +
      (gear("cuirass") ? '<path d="M50 74 Q60 68 70 74 L69 104 Q60 108 51 104 Z" fill="#7a5a3a"' + OUT + '/><path d="M52 84h16M52 94h16" stroke="' + trim + '" stroke-width="1.2"/>' : "") +
      (gear("scale") ? SCALE : "") + (gear("waterpot") ? KAMANDALU : "");
    const backItem = (spec.heir === "bow" && spec.item !== "bow" ? '<path d="M46 74 Q34 98 46 122" fill="none" stroke="#5a3418" stroke-width="2.4"/><path d="M46 74 L46 122" stroke="#efe2c0" stroke-width="0.6"/>' : "") +
      // An archer's quiver over the shoulder; a healer's satchel at the hip.
      (spec.item === "bow" ? '<path d="M44 76 L52 74 L50 104 L44 105 Z" fill="#7a4a24"' + OUT + '/><path d="M46 76 L45 66 M48.5 75.5 L48 65 M51 75 L51 64" stroke="#efe2c0" stroke-width="1.2"/><path d="M45 66l1.6-3 1.4 3M47.5 65l1.6-3 1.4 3M50 64l1.6-3 1.4 3" fill="#b2432a" stroke="none"/>' : "") +
      (spec.item === "bowl" ? '<path d="M70 104 L80 104 L81 116 L69 116 Z" fill="#8a6a3a"' + OUT + '/><path d="M70 104 Q75 100 80 104" fill="none" stroke="#5a3418" stroke-width="1.4"/><path d="M50 73 L76 104" stroke="#5a3418" stroke-width="1.2"/>' : "");
    // The dhoti's pleats fall from the waist, with the end of the waist-sash hanging in front.
    const pleats = she ? '<path d="M58 110 L54 188 M62 110 L63 188 M66 110 L72 188" stroke="' + trim + '" stroke-width="0.9" opacity="0.55"/>'
      : '<path d="M58 110 L55 151 M61.5 110 L61 151 M65 110 L67 151" stroke="' + trim + '" stroke-width="0.9" opacity="0.6"/><path d="M66 108 L71 130 L66.5 128 L64 109 Z" fill="' + trim + '"' + OUT + "/>";
    const belt = pleats + '<path d="M49 108 L71 108" stroke="' + trim + '" stroke-width="3"/>' +
      (spec.heir === "manuscript" ? '<rect x="62" y="104" width="9" height="5" rx="2" fill="#efe2c0"' + OUT + "/>" : "") +
      (spec.heir === "debt" ? '<path d="M53 110 q-4 6 0 9 q4 -3 0 -9 Z" fill="#8a6a3a"' + OUT + '/><path d="M51 111 l4 0" stroke="#24120a" stroke-width="0.8"/>' : "");
    const chest = '<path d="M49 74 Q60 86 71 74" stroke="' + trim + '" stroke-width="2" fill="none"/><path d="M51 77 Q60 91 69 77" stroke="' + trim + '" stroke-width="1.6" fill="none" stroke-dasharray="0.1 2.6" stroke-linecap="round"/>' +
      (!she && stage !== "child" ? '<path d="M50 72 L68 107" stroke="#f3ead2" stroke-width="0.9" opacity="0.85"/>' : "") +
      // The end of the sari drawn up across the body and over the shoulder.
      (she ? '<path d="M71 106 L50 73 L57 70 L75 101 Z" fill="' + cloth + '"' + OUT + '/><path d="M71 106 L50 73" stroke="' + trim + '" stroke-width="1.4"/>' : "") +
      (spec.heir === "amulet" ? '<circle cx="60" cy="81" r="2.6" fill="' + trim + '"' + OUT + "/>" + (spec.cracked ? '<path d="M58.6 79.2 L61 81 L59.6 82.8" stroke="#24120a" stroke-width="0.7" fill="none"/>' : "") : "") +
      (spec.armour ? '<path d="M52 72 Q60 66 68 72 L67 100 Q60 104 53 100 Z" fill="' + trim + '" opacity="0.9"' + OUT + '/><path d="M54 80h12M54 88h12M55 96h10" stroke="#a37a2a" stroke-width="0.8"/>' : "") +
      // A scar: a patch of darker leather stitched over the wound, as puppet makers mend a tear.
      (spec.scar ? '<path d="M54.5 83 L64 81.5 L65.5 89.5 L56 91 Z" fill="#7a4628" opacity="0.9"' + OUT + '/><path d="M55 82.6 l1.2 1.4 M57.6 82.2 l1.2 1.4 M60.2 81.8 l1.2 1.4 M62.8 81.4 l1.2 1.4 M56.4 90.6 l1.2 -1.4 M59 90.2 l1.2 -1.4 M61.6 89.8 l1.2 -1.4 M64.2 89.4 l1.2 -1.4" stroke="#efe2c0" stroke-width="0.6"/>' : "");
    const svg =
      // Smaller figures (children) are drawn by widening the view around the feet, so every joint
      // keeps its own coordinates and the CSS joint origins stay exact.
      // A fallen figure lies along the ground, so it gets a long, low view.
      (pose === "dead" ? '<svg class="' + clsx + '" viewBox="-112 128 200 76" width="' + Math.round(h * 0.5 * 200 / 76) + '" height="' + Math.round(h * 0.5) + '"' :
      '<svg class="' + clsx + '" viewBox="' + [60 - 60 / scale, 200 - 200 / scale, 120 / scale, 210 / scale].map((v) => +v.toFixed(2)).join(" ") + '" width="' + Math.round(h * 120 / 210) + '" height="' + h + '"') +
      (stance ? ' data-stance="' + stance + '"' : "") + (o.label ? ' role="img" aria-label="' + U.esc(o.label) + '"' : ' aria-hidden="true"') + ">" +
      '<g class="pp-all">' +
      // The puppeteer's main rod, faintly, from the body down out of sight.
      (pose === "dead" ? "" : '<path class="rod main-rod" d="M60 112 L60 240" stroke="#1d0f08" stroke-width="1.1" opacity="0.45"/>') +
      '<g class="pp-body">' + behind +
        // Back limbs, a shade darker, behind the body.
        '<g class="j legB" ' + back + ">" + thigh() + '<g class="j shinB">' + shin + "</g></g>" +
        '<g class="j armB" ' + back + ">" + upper + '<g class="j foreB">' + fore + manacle + rod + backHand + "</g></g>" +
        backItem +
        neck + '<path d="' + torso + '" fill="' + skin + '"' + OUT + "/>" + holes(torso) + chest +
        '<path d="' + skirt + '" fill="' + cloth + '"' + OUT + "/>" + holes(skirt) +
        '<path d="' + skirt + '" fill="url(#pp-weave)"/>' + bodyGear + '<path d="' + hem + '" fill="none" stroke="' + trim + '" stroke-width="1.5"/>' + belt +
        '<g class="j head"><g transform="translate(62 64) scale(' + headScale + ') translate(-62 -64)">' + head + "</g></g>" +
        '<g class="j legF">' + thigh() + '<g class="j shinF">' + shin + "</g></g>" +
        '<g class="j armF">' + upper + armlet + '<g class="j foreF">' + fore + manacle + cuff + (spec.item ? '<g class="it' + (WIELD.has(spec.item) ? " it-w" : "") + '">' + itemSvg(spec.item, trim, { tips: gear("gandiva") && grown, studs: spec.studs }) + "</g>" : "") + rod +
          (gear("bracer") ? '<path d="M54 108 L62 108 L61.5 118 L54.6 118 Z" fill="#5a3418"' + OUT + "/>" : "") + "</g></g>" +
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
    el.setAttribute("class", keep + " pose-" + ({ win: "cheer", lose: "slump", vow: "kneel", shame: "shame", fold: "fold", tremble: "tremble" }[kind] || "stand") + " react-" + kind);
    clearTimeout(U.puppetReact.t);
    U.puppetReact.t = setTimeout(() => { if (el.isConnected) el.setAttribute("class", keep + " pose-stand"); }, 2600);
  };
})(window.K = window.K || {});
