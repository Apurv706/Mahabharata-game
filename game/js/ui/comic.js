/* The story as a comic: each scene is drawn as a strip of panels cut from its own painting, with the
   narration in caption boxes, spoken lines in balloons whose tails point at the speaker in the
   painting, the epic's own words in a red caption, and the choices as panels to pick from.

   A scene's layout comes from K.COMIC[sceneId] (content/comic_layouts.js), a list of beats:
     { w: 1 }                         the "As it is written" caption (the scene's witness)
     { p: [cx, cy, zoom, aspect], b: [items] }
                                      a panel: the painting centred on (cx, cy), fractions of the
                                      painting; zoom 1 shows its whole width; aspect "16/9" (default),
                                      "4/3" or "1/1". Items drawn over the panel:
                                        { i, k: "bal"|"cap", at: "tl"|"tr"|"bl"|"br"|"t"|"b", to: [x, y] }
                                        i: index into the scene's body; "bal" a balloon whose tail points
                                        at (x, y) in the painting (or "l"/"r"/"t"/"b": a speaker off panel);
                                        "cap" a caption box in that corner.
     { c: i }                         block i as a caption between panels
     { s: i }                         block i as a balloon between panels, beside the speaker's face
   Blocks the layout does not place (lines added later, or by your choices) follow as captions, so
   no part of the story is ever lost. A scene without a layout gets one panel and captions. */
(function (K) {
  "use strict";
  const U = K.UI;

  U.comicOn = () => K.prefs().comic !== false;

  const ASPECT = { "2/1": 2, "16/9": 16 / 9, "4/3": 4 / 3, "1/1": 1, "3/4": 3 / 4 };
  // Which painting file a panel cuts from: the 16:9 version where it is painted, else the 3:1 strip.
  const fileOf = (key) => (U.hasWide(key) && !/^stage_/.test(key) ? key + "_wide" : key);
  // Paintings with no "_wide" copy that are themselves painted 16:9 (fights, stages, newer scenes).
  const SIXTEEN_NINE = new Set(["end_cut_short", "end_fire", "fight_arjuna_chariot", "fight_between_lines", "fight_bhima_charge", "fight_border_road", "fight_camp_gate_night", "fight_chakravyuha_inner", "fight_drupada_yard", "fight_duryodhana_line", "fight_fair_ring", "fight_forest_road", "fight_grazing", "fight_karna_chariot", "fight_lake_reeds_night", "fight_night_torches", "fight_royal_camp", "fight_supply_carts", "fight_swayamvara", "fight_war_camp", "fight_war_chariot", "fight_war_field", "fight_war_sunset", "key_art", "moment_astra", "moment_child_eve", "moment_friend_arjuna", "moment_friend_bhima", "moment_friend_charu", "moment_friend_duryodhana", "moment_friend_karna", "moment_marriage", "moment_shakti", "moment_teacher", "scene_armoury", "scene_cell", "scene_command_banner", "scene_lac_fire", "scene_pilgrimage", "scene_prisoners_pen", "scene_rebuild", "scene_truce_river", "scene_war_council", "stage_board_table", "stage_border_village", "stage_bow_courtyard", "stage_chakravyuha_top", "stage_city_ruins", "stage_deep_lake", "stage_dice_board_top", "stage_drona_gate", "stage_drupada_hall", "stage_elephant_grounds", "stage_fire_altar", "stage_forest_clearing_night", "stage_forest_edge", "stage_forest_lake", "stage_forest_maze_top", "stage_gandharva_grove", "stage_healers_hall", "stage_khandava_top", "stage_lac_fire_top", "stage_lake_reeds", "stage_lotus_garden", "stage_mango_yard", "stage_mountain_path", "stage_muster_field_top", "stage_naga_bank", "stage_palace_garden_night", "stage_river_shallows", "stage_shiva_mountain", "stage_smithy", "stage_stable_yard", "stage_tournament_arena", "stage_training_ground", "stage_vidura_table", "stage_virata_court", "stage_vyuha_top"]);
  const ratioOf = (key) => (fileOf(key) !== key || SIXTEEN_NINE.has(key) ? 16 / 9 : 3);

  function blockKind(b) {
    if (typeof b === "string" || Array.isArray(b)) return "p";
    if (b.speaker) return "said";
    if (b.memory) return "memory";
    if (b.curse) return "curse";
    if (b.aside) return "aside";
    return null;
  }
  const textOf = (b) => (typeof b === "string" || Array.isArray(b) ? b : b.line || b.memory || b.curse || b.aside || "");
  // A paragraph that is all speech ("..." she says) reads as a balloon; its quote marks go.
  function lettering(b, asBalloon) {
    let t = U.t(textOf(b));
    if (asBalloon && /^[“"]/.test(t.trim())) {
      const s = t.trim(); const end = s.search(/[”"](?=[^”"]*$)/);
      // Only a paragraph that is one quoted speech: "...". Anything with narration around it stays whole.
      if (end === s.length - 1) t = s.slice(1, -1);
    }
    return t;
  }

  // Speech inside a narration paragraph: the quoted parts, and the sentences around them that carry
  // no speech. ('He looks at you. "Nothing good," he says.' -> "Nothing good." / "He looks at you.")
  const QUOTE = /[“"]([^”"]+)[”"]/g;
  const stop = () => (document.documentElement.lang === "hi" ? "।" : ".");
  const quotesOf = (t) => [...t.matchAll(QUOTE)].map((m) => m[1].trim().replace(/[,，]$/, stop()));
  // The sentences with no speech in them: those before the first speech, and those after it.
  function restOf(t) {
    // A quote that ends its sentence ends it here too; one that ends in a comma runs on ("..., he says.").
    const marked = t.replace(QUOTE, (m, q) => (/[.!?।]$/.test(q.trim()) ? "\u0001. " : "\u0001,"));
    const parts = (marked.match(/[^.!?।]+(?:[.!?।]+|$)/g) || []).map((x) => x.trim()).filter(Boolean);
    const first = parts.findIndex((x) => x.includes("\u0001"));
    const keep = (arr) => arr.filter((x) => !x.includes("\u0001")).join(" ");
    return first < 0 ? { before: keep(parts), after: "" } : { before: keep(parts.slice(0, first)), after: keep(parts.slice(first)) };
  }

  function capClass(b) {
    const k = blockKind(b);
    return k === "memory" ? " memory" : k === "curse" ? " curse" : k === "aside" ? " aside" : "";
  }

  // The speaker's face for a balloon between panels: their portrait, or their puppet.
  function faceOf(b) {
    if (!b || !b.speaker) return "";
    const who = U.personByName(b.speaker), face = U.portraitKey(who);
    if (face) return '<span class="cm-face">' + U.thumb(face, "face") + "</span>";
    if (who && K.PUPPETS && K.PUPPETS[who] && U.puppetBadge) return '<span class="cm-face fig">' + U.puppetBadge(U.puppetFor(who), { h: 58 }) + "</span>";
    return "";
  }
  const nameTag = (b) => (b && b.speaker ? '<span class="cm-who">' + U.t(b.speaker) + "</span>" : "");

  function panel(art, beat, body, used, after) {
    const pre = [], post = []; // narration from around a balloon's words: before the panel, and after it
    const [cx = 0.5, cy = 0.45, z0 = 1, asp = "16/9"] = beat.p || [];
    const A = ratioOf(art), P = ASPECT[asp] || 16 / 9;
    const z = Math.max(z0 || 1, A / P, 1);
    const cw = 1 / z, ch = cw * A / P;
    const left = Math.min(Math.max(cx - cw / 2, 0), 1 - cw), top = Math.min(Math.max(cy - ch / 2, 0), 1 - ch);
    const pos = (o, w) => (w >= 0.999 ? 50 : (o / (1 - w)) * 100).toFixed(2) + "%";
    const style = "--img:url('" + U.artUrl(fileOf(art)) + "');--asp:" + asp.replace("/", " / ") + ";background-size:" + (z * 100).toFixed(2) + "% auto;background-position:" + pos(left, cw) + " " + pos(top, ch);
    let items = "";
    for (const it of beat.b || []) {
      const b = body[it.i];
      const key = it.q != null ? it.i + "q" + it.q : it.i;
      if (!b || used.has(key) || used.has(it.i)) continue;
      used.add(key);
      const at = it.at || "tl";
      let words = null;
      if (it.q != null) {
        const full = K.text(textOf(b)), all = quotesOf(full);
        // A translation whose speech does not line up with the English: the whole paragraph, as a caption.
        if (!all.length || (it.q !== "all" && !all[it.q])) { used.add(it.i); pre.push(gutterCap(b)); continue; }
        words = U.esc(it.q === "all" ? all.join(" ") : all[it.q]);
        if (!used.has(it.i + "r")) {
          used.add(it.i + "r");
          const r = restOf(full);
          if (r.before) pre.push('<div class="cm-cap">' + U.esc(r.before) + "</div>");
          if (r.after) after[it.i] = '<div class="cm-cap">' + U.esc(r.after) + "</div>";
        }
        // What follows the speech is told after the panel with its last words.
        if (after[it.i] && (it.q === "all" || it.q >= all.length - 1)) { post.push(after[it.i]); delete after[it.i]; }
      } else used.add(it.i);
      if (it.k === "cap") { items += '<div class="cm-cap on-panel at-' + at + capClass(b) + '"' + (it.w ? ' style="max-width:' + it.w + '%"' : "") + ">" + lettering(b, false) + "</div>"; continue; }
      let to = "";
      if (Array.isArray(it.to)) to = ' data-tx="' + ((it.to[0] - left) / cw).toFixed(4) + '" data-ty="' + ((it.to[1] - top) / ch).toFixed(4) + '"';
      else if (typeof it.to === "string") to = ' data-edge="' + it.to + '"';
      const think = it.k === "think" ? " think" : "";
      const wide = it.w ? ' style="max-width:' + it.w + '%"' : "";
      items += '<div class="cm-bal at-' + at + think + '"' + to + wide + ">" + (it.name ? nameTag(b) : "") + (words != null ? words : lettering(b, true)) + "</div>";
    }
    return [...pre.map((h) => ({ t: h })), { pic: '<div class="cm-pic" style="' + style + '"><svg class="cm-tails" aria-hidden="true"></svg>' + items + '<svg class="cm-plugs" aria-hidden="true"></svg></div>' }, ...post.map((h) => ({ t: h }))];
  }

  function gutterCap(b) { return '<div class="cm-cap' + capClass(b) + '">' + lettering(b, false) + "</div>"; }
  function gutterSay(b) {
    const face = faceOf(b);
    return '<div class="cm-say' + (face ? "" : " noface") + '">' + face + '<div class="cm-bal said">' + (face ? "" : nameTag(b)) + lettering(b, true) + "</div></div>";
  }

  // The default for a scene without a layout of its own: the painting, then the words.
  function autoLayout(sc, body) {
    const out = [];
    if (K.val(sc.witness)) out.push({ w: 1 });
    out.push({ p: [0.5, 0.45, 1] });
    body.forEach((b, i) => { if (b) out.push(blockKind(b) === "said" ? { s: i } : { c: i }); });
    return out;
  }

  // The scene as a comic: a title banner, the beats, and anything not yet placed.
  U.comicPage = function (sc, o) {
    const art = o.art;
    const body = [].concat(K.val(sc.body) || []);
    const lay = (K.COMIC && K.COMIC[sc.id]) || autoLayout(sc, body);
    const used = new Set();
    const witness = K.val(sc.witness);
    const bits = []; // { t: words } and { pic: picture }, folded into panels at the end
    const after = {}; // narration that follows a speech, waiting for the panel with its last words
    let html = '<header class="cm-title pagehead"><div class="cm-tline"><span class="kind ' + o.tag + '">' + U.esc(o.tagText) + "</span>" +
      (K.val(sc.caption) ? "<small>" + U.t(K.val(sc.caption)) + "</small>" : "") + "</div><h1>" + U.t(K.val(sc.title) || "") + "</h1>" +
      (K.S && K.puppetSpec ? U.puppetBadge(K.puppetSpec(K.S), { fit: true }) : "") + "</header>";
    let witnessDone = false, panels = 0;
    for (const beat of lay) {
      if (beat.w) { if (witness && !witnessDone) { witnessDone = true; bits.push({ t: '<div class="cm-cap witness"><span class="lbl">' + U.tr("As it is written") + "</span>" + U.blocks(witness) + "</div>" }); } continue; }
      if (beat.p) { if (art) { bits.push(...panel(art, beat, body, used, after)); panels++; } continue; }
      const i = beat.c != null ? beat.c : beat.s;
      const b = body[i];
      if (beat.rest) {
        // Only the narration of a paragraph whose speech goes in a balloon further down the strip.
        if (!b || used.has(i) || used.has(i + "r")) continue;
        used.add(i + "r");
        const full = K.text(textOf(b));
        if (!quotesOf(full).length) { used.add(i); bits.push({ t: gutterCap(b) }); } else { const r = restOf(full), t = [r.before, r.after].filter(Boolean).join(" "); if (t) bits.push({ t: '<div class="cm-cap">' + U.esc(t) + "</div>" }); }
        continue;
      }
      if (!b || used.has(i)) continue;
      used.add(i);
      bits.push({ t: beat.s != null || blockKind(b) === "said" ? gutterSay(b) : gutterCap(b) });
    }
    if (witness && !witnessDone) bits.unshift({ t: '<div class="cm-cap witness"><span class="lbl">' + U.tr("As it is written") + "</span>" + U.blocks(witness) + "</div>" });
    if (!panels && art) bits.push(...panel(art, { p: [0.5, 0.45, 1] }, body, used, after));
    for (const k in after) bits.push({ t: after[k] });
    body.forEach((b, i) => { if (b && !used.has(i) && ![...used].some((u) => typeof u === "string" && u.indexOf(i + "q") === 0)) bits.push({ t: blockKind(b) === "said" ? gutterSay(b) : gutterCap(b) }); });
    if (o.loop) bits.unshift({ t: '<div class="cm-cap aside">' + o.loop + "</div>" });
    // Every word inside a panel: what comes before a picture is told along that panel's top edge;
    // anything after the last picture, along its foot.
    const panelsOut = [];
    let words = [];
    for (const x of bits) {
      if (x.t) { words.push(x.t); continue; }
      panelsOut.push({ top: words, pic: x.pic, foot: [] }); words = [];
    }
    if (words.length) { if (panelsOut.length) panelsOut[panelsOut.length - 1].foot.push(...words); else return html + words.join(""); }
    const n = panelsOut.length;
    html += '<div class="cm-grid n' + n + '">' + panelsOut.map((q) => '<figure class="cm-panel">' + (q.top.length ? '<div class="cm-band">' + q.top.join("") + "</div>" : "") + q.pic +
      (q.foot.length ? '<div class="cm-band foot">' + q.foot.join("") + "</div>" : "") + "</figure>").join("") + "</div>";
    return html;
  };

  // ---------- Balloon tails ----------
  // Drawn once the strip is laid out, and again whenever it changes size: from the balloon's edge
  // toward the speaker, stopping short of the face so it never covers it.
  function drawTails(fig) {
    const tails = fig.querySelector(".cm-tails"), plugs = fig.querySelector(".cm-plugs");
    if (!tails) return;
    const W = fig.clientWidth, H = fig.clientHeight;
    if (!W || !H) return;
    tails.setAttribute("viewBox", "0 0 " + W + " " + H); plugs.setAttribute("viewBox", "0 0 " + W + " " + H);
    let t = "", p = "";
    const fr = fig.getBoundingClientRect();
    fig.querySelectorAll(".cm-bal").forEach((bal) => {
      const r = bal.getBoundingClientRect();
      const bx = r.left - fr.left, by = r.top - fr.top, bw = r.width, bh = r.height;
      if (!bw) return;
      let tx, ty;
      const e = bal.dataset.edge;
      if (bal.dataset.tx) { tx = +bal.dataset.tx * W; ty = +bal.dataset.ty * H; }
      else if (e) { tx = e === "l" ? -20 : e === "r" ? W + 20 : bx + bw / 2; ty = e === "t" ? -20 : e === "b" ? H + 20 : by + bh * 0.6; }
      else return;
      const cx = bx + bw / 2, cy = by + bh / 2;
      // The tail leaves from the side of the balloon facing the speaker.
      const below = ty > by + bh, above = ty < by;
      let x0, y0, horiz = false;
      if (below || above) { x0 = Math.min(Math.max(tx, bx + 22), bx + bw - 22); x0 = (x0 + cx) / 2; y0 = below ? by + bh - 2 : by + 2; }
      else { horiz = true; x0 = tx < cx ? bx + 2 : bx + bw - 2; y0 = Math.min(Math.max(ty, by + 14), by + bh - 14); }
      // The tip stops short of the speaker: no tail over a face.
      const dx = tx - x0, dy = ty - y0, d = Math.hypot(dx, dy) || 1;
      const len = Math.max(14, Math.min(d - 16, 90));
      const ex = x0 + dx / d * len, ey = y0 + dy / d * len;
      const half = Math.min(9, Math.max(6, len / 6));
      const a = horiz ? [x0, y0 - half] : [x0 - half, y0], c = horiz ? [x0, y0 + half] : [x0 + half, y0];
      const f = (n) => n.toFixed(1);
      // A gentle curve, as a letterer draws it.
      const mx = (x0 + ex) / 2 + (horiz ? 0 : (ex > x0 ? -6 : 6)), my = (y0 + ey) / 2 + (horiz ? (ey > y0 ? -6 : 6) : 0);
      const d1 = "M" + f(a[0]) + " " + f(a[1]) + " Q" + f(mx) + " " + f(my) + " " + f(ex) + " " + f(ey) + " Q" + f(mx) + " " + f(my) + " " + f(c[0]) + " " + f(c[1]) + "Z";
      t += '<path d="' + d1 + '"/>';
      // Over the balloon's own border, where the tail joins it: white, so the two read as one shape.
      const inset = 3.5;
      const pa = horiz ? [x0 + (ex > x0 ? -inset : inset), y0 - half + 2] : [x0 - half + 2, y0 + (ey > y0 ? -inset : inset)];
      const pc = horiz ? [x0 + (ex > x0 ? -inset : inset), y0 + half - 2] : [x0 + half - 2, y0 + (ey > y0 ? -inset : inset)];
      const pe = [x0 + dx / d * 5, y0 + dy / d * 5];
      p += '<path d="M' + f(pa[0]) + " " + f(pa[1]) + " L" + f(pe[0]) + " " + f(pe[1]) + " L" + f(pc[0]) + " " + f(pc[1]) + 'Z"' + (bal.classList.contains("think") ? ' class="think"' : "") + "/>";
      if (bal.classList.contains("think")) t = t.replace(/<path d="[^"]*"\/>$/, ""), t += '<circle cx="' + f((x0 + ex) / 2) + '" cy="' + f((y0 + ey) / 2) + '" r="5"/><circle cx="' + f(ex) + '" cy="' + f(ey) + '" r="3"/>';
    });
    tails.innerHTML = t; plugs.innerHTML = p;
  }
  // Words that do not fit on their panel at this screen size (a long line on a small phone) come off it:
  // they follow the panel as a caption, or a balloon pointing up at it, so nothing is ever cut off.
  function spill(pic) {
    const fr = pic.getBoundingClientRect();
    if (!fr.height) return;
    const fig = pic.closest(".cm-panel");
    let foot = null;
    pic.querySelectorAll(".cm-bal, .cm-cap.on-panel").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom <= fr.bottom + 6 && r.top >= fr.top - 6 && r.height < fr.height * 0.82) return;
      if (!foot) { foot = fig.querySelector(".cm-band.foot.spill") || document.createElement("div"); foot.className = "cm-band foot spill"; pic.after(foot); }
      el.removeAttribute("style");
      if (el.classList.contains("cm-bal")) { const out = document.createElement("div"); out.className = "cm-say spilled noface"; el.className = "cm-bal said up"; out.appendChild(el); foot.appendChild(out); }
      else { el.className = el.className.replace(/\bon-panel\b|\bat-\S+/g, "").trim(); foot.appendChild(el); }
    });
  }
  let ro = null;
  U.comicTails = function (root) {
    const figs = [...(root || document).querySelectorAll(".cm-pic")];
    figs.forEach(spill);
    figs.forEach(drawTails);
    if (window.ResizeObserver) {
      if (ro) ro.disconnect();
      ro = new ResizeObserver((es) => es.forEach((e) => drawTails(e.target.closest ? e.target.closest(".cm-pic") || e.target : e.target)));
      figs.forEach((f) => { ro.observe(f); f.querySelectorAll(".cm-bal").forEach((b) => ro.observe(b)); });
    }
  };
})(window.K = window.K || {});
