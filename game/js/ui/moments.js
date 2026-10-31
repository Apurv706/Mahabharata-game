/* Moments (PRD §18.12, Change List 22): the big milestones of a life get a few seconds of their own.
   A painting slowly moving, a gold title, one line of memory, a short theme; tap to go on. For a
   friend, your figure and your friend's step in and clasp hands; for a divine weapon the screen
   darkens, the mantra runs as a line of light, and its emblem rises from the ground into your raised hand (its glow stays).
   Where a moment has no painting of its own yet, the person's portrait stands in a gold frame over
   the painting of the place (option A). With reduced motion: the still painting and the title.
   Moments are noticed in the engine (core.js), kept in S.moments for the character sheet and the
   Book of Lives, and played from K.momentQueue. */
(function (K) {
  "use strict";
  const U = K.UI;
  const PAINTED = { friend: ["arjuna", "bhima", "duryodhana", "karna", "charu"] };
  // A teacher's words when they take you on.
  const TEACHER_LINE = {
    drona: "\"Your arrow is mine now, and so is your fee, when I ask for it.\"",
    kripa: "\"Sweep the practice ground. Tomorrow we begin.\"",
    balarama: "\"Lift it again. Again. Good. You will do.\"",
    hermit: "\"Never say who taught you. That is the only fee.\"",
    vidura: "\"Notice everything. Say half of it.\""
  };
  const FRIEND_LINE = {
    arjuna: "You hit his swinging lamp in the dark when you were ten.",
    bhima: "You put him in the river when you were ten. He has never stopped telling people.",
    duryodhana: "You stood your ground in front of his brothers when you were ten.",
    karna: "You calmed a maddened horse beside him when you were ten.",
    charu: "You chose each other when you were ten."
  };

  // Everything one moment shows. Built from the record, so the card can be redrawn in any language.
  K.momentInfo = function (m, S = K.S) {
    const who = m.who ? K.personName(m.who, S) : "";
    switch (m.kind) {
      case "friend": return { theme: "friend", title: ["A friend for life: {who}", { who: K.PEOPLE[m.who].name }], line: FRIEND_LINE[m.who] || "",
        art: PAINTED.friend.includes(m.who) ? "moment_friend_" + m.who : null, portrait: U.portraitKey(m.who), with: m.who };
      case "farewell": return { theme: "farewell", title: ["A friendship ends: {who}", { who: K.PEOPLE[m.who].name }], line: (K.FAREWELLS || {})[m.who] || "",
        art: PAINTED.friend.includes(m.who) ? "moment_friend_" + m.who : null, portrait: U.portraitKey(m.who), grey: true };
      case "teacher": return { theme: "milestone", title: ["Your teacher: {who}", { who: (K.TEACHERS[m.who] || {}).short || m.who }], line: TEACHER_LINE[m.who] || "", art: "moment_teacher" };
      case "marriage": return { theme: "milestone", title: ["Married: {who}", { who: K.PEOPLE[m.who] ? K.PEOPLE[m.who].name : who }], line: "Seven steps around the fire, and the rest of your life to keep them.", art: "moment_marriage" };
      case "astra": {
        const g = (K.ASTRA_GIVERS || {})[m.from] || {}, A = m.which && K.ASTRAS && K.ASTRAS[m.which];
        return { theme: "astra", title: A ? ["The {name}", { name: A.name }] : "A divine weapon", line: g.cond ? ["Given by {who}, on one condition: “{cond}”", { who: g.who, cond: g.cond }] : "The mantra is yours now, and so is every place it lands.",
          sub: A ? A.mantra : "The mantra is yours now, and so is every place it lands.", art: "moment_astra", astra: true };
      }
      case "vow": {
        const V = K.VOWS[m.id] || {};
        const w = K.watcherNames(m.id, S);
        return { theme: "milestone", title: ["A vow: {vow}", { vow: V.name }], line: V.keep || V.gift, watch: w ? ["Watched by {who}", { who: w }, true] : null, price: V.price ? ["Broken: {price}", { price: V.price }] : null,
          art: null, place: "scene_vow", emblem: "vow_" + m.id };
      }
      case "company": return { theme: "milestone", title: "A company of your own", line: "They are yours to command, and yours to bring home.", art: null, place: "war_eve", emblem: "path_strategist" };
      default: return null;
    }
  };
  // The title alone, for cards and the Book of Lives.
  K.momentTitle = (m, S) => { const i = K.momentInfo(m, S); return i ? K.text(i.title, null, S) : ""; };
  K.momentThumb = (m) => { const i = K.momentInfo(m); return i ? i.art || i.portrait || i.emblem || i.place : null; };

  const tx = (v) => U.t(v);
  const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The emblem of a divine weapon: an arrow of light.
  const ASTRA_SVG = '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="mo-ag" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff8e0"/><stop offset="0.45" stop-color="#ffd680" stop-opacity="0.75"/><stop offset="1" stop-color="#ffb040" stop-opacity="0"/></radialGradient></defs>' +
    '<circle cx="60" cy="60" r="56" fill="url(#mo-ag)"/><path d="M60 14 L68 34 L63 32 L63 96 L57 96 L57 32 L52 34 Z" fill="#fff6d8" stroke="#a8742a" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M57 96 L50 108 M63 96 L70 108 M60 96 L60 110" stroke="#fff6d8" stroke-width="2.4" stroke-linecap="round"/></svg>';

  let running = null;
  // Play every moment waiting in the queue, one after another, then call done. Returns false (and
  // does not call done) when there is nothing to play.
  U.playMoments = function (done) {
    const q = K.momentQueue.splice(0).filter((m) => (K.S.moments || []).includes(m)); // only this life's
    if (!q.length || K.headless || /jsdom/i.test(navigator.userAgent || "")) return false; // nothing to play: the caller goes on
    const next = () => { const m = q.shift(); if (!m) { if (done) done(); return; } show(m, next); };
    next();
    return true;
  };

  function show(m, after) {
    const S = K.S, info = K.momentInfo(m, S);
    if (!info) return after();
    const still = reduced();
    const bg = info.art ? U.bgUrl(info.art) : U.bgUrl(info.place || (K.SCENES[S.scene] && typeof K.SCENES[S.scene].art === "string" ? K.SCENES[S.scene].art : "scene_vow"));
    const big = window.innerWidth >= 900 && window.innerHeight >= 700 ? 260 : 210; // the figures stand taller on a big screen
    const me = K.puppetSpec ? U.puppet(K.puppetSpec(S), { h: big, pose: info.astra ? "stand" : info.with ? "walk" : "stand", cls: "mo-me" }) : "";
    const friend = info.with && U.puppetFor ? U.puppet(U.puppetFor(info.with, S), { h: big, pose: "walk", flip: true, cls: "mo-friend" }) : "";
    const frame = !info.art && info.portrait ? '<i class="mo-frame" style="--img:url(\'' + U.artUrl(info.portrait) + '\')" aria-hidden="true"></i>' : "";
    const emblem = info.astra ? '<span class="mo-emblem astra">' + ASTRA_SVG + "</span>" : info.emblem ? '<span class="mo-emblem" style="--img:url(\'' + U.artUrl(info.emblem) + '\')"></span>' : "";
    const el = U.el('<div class="moment k-' + m.kind + (still ? " still" : "") + (info.grey ? " grey" : "") + (info.art ? " painted" : " framed") + '" role="dialog" aria-modal="true" aria-label="' + U.esc(K.text(info.title)) + '">' +
      '<div class="mo-art" style="--img:url(\'' + bg + '\')"></div>' + (info.astra ? '<div class="mo-dark"></div><div class="mo-mantra"><i></i></div>' : "") + frame +
      '<div class="mo-figs">' + (info.with || info.astra ? '<span class="mo-l">' + me + "</span>" : "") + (friend ? '<span class="mo-r">' + friend + "</span>" : "") + (info.astra ? emblem : "") + "</div>" + (info.astra ? "" : emblem) +
      '<div class="mo-text"><span class="mo-orn" aria-hidden="true"></span><b class="mo-title">' + tx(info.title) + "</b>" + (info.line ? '<p class="mo-line">' + tx(info.line) + "</p>" : "") +
      (info.watch ? '<p class="mo-sub">' + tx(info.watch) + "</p>" : "") + (info.price ? '<p class="mo-sub down">' + tx(info.price) + "</p>" : "") +
      (info.astra && info.sub && info.line !== info.sub ? '<p class="mo-sub">' + U.t(info.sub) + "</p>" : "") + "</div>" +
      '<span class="mo-tap">' + U.tr("Tap to go on") + "</span></div>");
    const before = document.activeElement;
    document.body.appendChild(el);
    el.tabIndex = -1; try { el.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
    if (K.Sound && K.Sound.moment) K.Sound.moment(info.theme);
    const run = (running = { el });
    // The figures meet: your friend's hand in yours; the weapon's emblem rises into your hand.
    const beats = [];
    const at = (ms, fn) => beats.push(setTimeout(() => { if (running === run) fn(); }, still ? 0 : ms));
    // The painting comes in once it has loaded (or after a moment, whatever happens); the figures'
    // beats are timed from then, so a slow painting does not leave them behind.
    let shown = false;
    const reveal = () => { if (shown || running !== run) return; shown = true; requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.add("in"); plan(); })); };
    const plan = () => {
      beats.push(setTimeout(close, still ? 6000 : info.astra ? 8200 : 7200));
      if (info.with) at(1900, () => {
        el.classList.add("met");
        el.querySelectorAll(".mo-figs svg").forEach((s) => s.setAttribute("class", s.getAttribute("class").replace(/\bpose-\S+/, "pose-clasp")));
      });
      if (info.astra) {
        at(2600, () => { el.classList.add("risen"); const s = el.querySelector(".mo-l svg"); if (s) s.setAttribute("class", s.getAttribute("class").replace(/\bpose-\S+/, "pose-lift")); });
        at(3600, () => {
          el.classList.add("taken");
          const s = el.querySelector(".mo-l svg"), em = el.querySelector(".mo-emblem.astra"), figs = el.querySelector(".mo-figs");
          if (s && !/\bglow\b/.test(s.getAttribute("class"))) s.setAttribute("class", s.getAttribute("class") + " glow");
          // Into the raised hand.
          if (s && em && figs) {
            const hand = s.querySelector(".foreF") || s, r = hand.getBoundingClientRect(), f = figs.getBoundingClientRect();
            em.style.left = (r.left - f.left + r.width / 2) + "px";
            em.style.bottom = (f.bottom - r.top) - 54 - 10 + "px";
          }
        });
      }
    };
    const im = new Image(); im.onload = reveal; im.onerror = reveal; im.src = bg; if (im.complete) reveal();
    setTimeout(reveal, 900);
    const close = () => {
      if (running !== run) return;
      running = null;
      beats.forEach(clearTimeout);
      window.removeEventListener("keydown", key, true);
      el.classList.add("out");
      setTimeout(() => { el.remove(); if (before && before.isConnected && before.focus) try { before.focus({ preventScroll: true }); } catch (e) { /* ignore */ } after(); }, still ? 0 : 420);
    };
    const key = (e) => { if ([" ", "Enter", "Escape", "ArrowRight"].includes(e.key)) { e.preventDefault(); e.stopPropagation(); close(); } };
    window.addEventListener("keydown", key, true);
    el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); close(); });
  }
})(window.K = window.K || {});
