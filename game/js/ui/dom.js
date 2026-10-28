/* DOM helpers shared by the screens. */
(function (K) {
  "use strict";
  const U = (K.UI = {});
  U.$ = (id) => document.getElementById(id);
  U.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  U.t = (s) => U.esc(K.text(s));            // story text: translate, fill the life's tokens, escape
  U.tr = (s, p) => U.esc(K.tr(s, p));        // interface text: translate (and fill params), escape
  U.el = function (html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  U.button = function (cls, html, onClick, id) {
    const b = document.createElement("button");
    b.type = "button"; b.className = cls; b.innerHTML = html;
    if (id) b.id = id;
    if (onClick) b.addEventListener("click", onClick);
    return b;
  };
  // Absolute, because a url() carried in a CSS custom property is resolved against the stylesheet
  // that reads it (css/), not the page: a relative "art/x.jpg" would load css/art/x.jpg.
  U.artUrl = function (key) {
    if (!key) return null;
    const file = "art/" + key + (/^(path|vow)_/.test(key) ? ".png" : ".jpg"); // emblems are transparent PNGs
    try { return new URL(file, document.baseURI).href; } catch (e) { return file; }
  };

  // Portraits of the people you know (art/p_*.jpg). Vasu grows up: the child portrait until 40.
  const PORTRAITS = ["karna", "arjuna", "bhima", "drona", "kripa", "duryodhana", "abhimanyu", "mauni", "charu", "madhavi", "revat"];
  U.portraitKey = function (id) {
    if (id === "vasu") return K.S && K.S.age >= 40 ? "p_vasu_16" : "p_vasu_6";
    return PORTRAITS.includes(id) ? "p_" + id : null;
  };
  U.personByName = function (name) {
    for (const [id, p] of Object.entries(K.PEOPLE || {})) if (p.name === name) return id;
    return null;
  };
  // A small picture: "face" (round portrait), "emblem" (contained, transparent) or "card" (4:3).
  U.thumb = function (key, kind, label) {
    if (!key) return "";
    kind = kind || (/^p_/.test(key) ? "face" : /^(path|vow)_/.test(key) ? "emblem" : "card");
    return '<i class="thumb ' + kind + '" style="--img:url(\'' + U.artUrl(key) + '\')"' + (label ? ' role="img" aria-label="' + U.esc(label) + '"' : ' aria-hidden="true"') + "></i>";
  };

  // Story text blocks: plain strings, speech, memories, curses, asides.
  U.blocks = function (arr) {
    return [].concat(K.val(arr) || []).filter(Boolean).map((b) => {
      if (typeof b === "string" || Array.isArray(b)) return "<p>" + U.t(b) + "</p>";
      if (b.speaker) {
        const face = U.portraitKey(U.personByName(b.speaker));
        return '<div class="said' + (face ? " with-face" : "") + '">' + (face ? U.thumb(face, "face") : "") + '<div><div class="lbl">' + U.t(b.speaker) + '</div><p class="speech">' + U.t(b.line) + "</p></div></div>";
      }
      if (b.memory) return '<p class="memory">' + U.t(b.memory) + "</p>";
      if (b.curse) return '<p class="curse">' + U.t(b.curse) + "</p>";
      if (b.aside) return '<p class="aside">' + U.t(b.aside) + "</p>";
      return "";
    }).join("");
  };

  // ---------- The painting behind everything ----------
  // In the story the scene's painting fills the screen and the page lies over it. A 16:9 "_wide"
  // version is used when there is one; the older 3:1 paintings are dimmed and softened behind the
  // page. Each painting can carry a focal point, so a phone (which shows only the middle of a wide
  // picture) crops around its subject.
  const WIDE = new Set(["home_anga", "home_gandhara", "home_hastinapura", "home_mathura", "home_matsya", "home_nishada", "home_panchala",
    "scene_day13", "scene_dice_hall", "scene_dice_throws", "scene_exile", "scene_fair", "scene_indraprastha", "scene_lac", "scene_poison",
    "scene_princes", "scene_swayamvara", "scene_teacher", "scene_teaching", "scene_tournament", "scene_virata", "scene_women_field",
    "war_day17", "war_day18", "war_eve"]);
  const FOCAL = { scene_teacher: "62% 45%", scene_dice_throws: "28% 35%", home_anga: "30% 50%", scene_princes: "34% 55%", scene_poison: "45% 45%" };
  U.hasWide = (key) => WIDE.has(key) || /^stage_/.test(key || "");
  let bdKey = null, bdFlip = 0;
  U.setBackdrop = function (key) {
    const bd = U.$("backdrop");
    if (!bd || key === bdKey) return;
    bdKey = key;
    const layers = bd.querySelectorAll(".bd");
    const next = layers[bdFlip = 1 - bdFlip], prev = layers[1 - bdFlip];
    const wide = key && U.hasWide(key);
    next.style.backgroundImage = key ? "url('" + U.artUrl(WIDE.has(key) ? key + "_wide" : key) + "')" : "none";
    next.style.backgroundPosition = FOCAL[key] || "50% 45%";
    next.classList.toggle("flat", !!key && !wide);
    next.classList.add("on"); prev.classList.remove("on");
  };

  // The scene's painting, or (until the art exists) a flat field in the scene's own colour with its
  // caption set large, so a missing picture still reads as a designed page, never a gradient.
  // In the story itself the painting goes behind the page, and the page gets a small header instead.
  U.plate = function (o) {
    if (U.inScene) {
      U.setBackdrop(o.art || null);
      const kind = o.tagText ? '<span class="kind ' + (o.tag || "") + '">' + U.esc(o.tagText) + "</span>" : "";
      const fig = K.S && K.puppetSpec && !o.noFigure ? U.puppetBadge(K.puppetSpec(K.S), { pose: o.pose, fit: true }) : "";
      return '<header class="pagehead"><div class="ph-text"><div class="ph-line">' + kind +
        (o.small ? "<small>" + U.t(o.small) + "</small>" : o.caption ? "<small>" + U.t(o.caption) + "</small>" : "") + "</div>" +
        (o.heading ? "<h1>" + U.t(o.heading) + "</h1>" : o.title ? "<b>" + U.t(o.title) + "</b>" : "") + "</div>" + fig + "</header>";
    }
    const img = U.artUrl(o.art);
    const field = (o.grad || ["#5a3a22"])[0];
    const style = img ? "--img:url('" + img + "')" : "--field:color-mix(in srgb, " + field + " 40%, var(--ground))";
    const kind = o.tagText ? '<span class="kind ' + (o.tag || "") + '">' + U.esc(o.tagText) + "</span>" : "";
    let cap = kind;
    if (o.title) cap += "<b>" + U.t(o.title) + "</b>";
    if (o.small) cap += "<small>" + U.t(o.small) + "</small>";
    if (!o.title && !o.small && o.caption) cap += img ? "<small>" + U.t(o.caption) + "</small>" : "<b>" + U.t(o.caption) + "</b>";
    return '<div class="plate' + (img ? " painted" : "") + (o.tall ? " tall" : "") + '" style="' + style + '">' +
      (cap ? '<span class="cap">' + cap + "</span>" : "") + "</div>";
  };

  U.where = function (html) { U.$("where").innerHTML = html; };
  U.inScene = false;
  U.setNav = function (on) {
    document.body.classList.remove("titling"); // the title screen adds it back after this call
    U.inScene = !!on;
    const leaf = U.$("leaf"); if (leaf) leaf.className = "leaf"; // each screen sets its own page shape
    document.body.classList.toggle("inscene", !!on);
    U.$("nav").hidden = !on; U.$("game").classList.toggle("wide", !on);
    U.$("nav-standing").hidden = !on;
    if (!on) { U.$("ledger").hidden = true; U.$("nav-standing").setAttribute("aria-expanded", "false"); U.setBackdrop(null); }
  };

  // The story area follows the pen as it writes, unless the player has scrolled back to reread;
  // it follows again once they are back at the bottom.
  U.follow = function (story) {
    if (!story) return;
    const atEnd = () => story.scrollHeight - story.scrollTop - story.clientHeight < 28;
    story.dataset.follow = "1";
    const check = () => { story.dataset.follow = atEnd() ? "1" : ""; };
    story.addEventListener("wheel", () => setTimeout(check, 60), { passive: true });
    story.addEventListener("touchmove", () => setTimeout(check, 60), { passive: true });
    story.addEventListener("keydown", () => setTimeout(check, 60));
  };
  U.toEnd = function (story, smooth) {
    if (!story || story.dataset.follow === "") return;
    if (typeof story.scrollTo === "function") story.scrollTo({ top: story.scrollHeight, behavior: smooth && U.motion() ? "smooth" : "auto" });
    else story.scrollTop = story.scrollHeight;
  };

  // ---------- Staged reveal ----------
  // Story screens bring their parts in one after another: painting, title, each line of the scene,
  // and only then the choices. The pause after each line follows its length. A tap on the page,
  // Space, Enter or a number key shows everything at once. Off with reduced motion, in the
  // automated tests, or when the player turns "Reveal the story line by line" off in the menu.
  U.motion = function () {
    if (/jsdom/i.test(navigator.userAgent || "")) return false;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return K.prefs().gradual !== false;
  };
  let stageRun = null;
  U.stage = function (items, done) {
    U.stageFinish(false);
    items = items.filter(Boolean);
    if (!U.motion()) { items.forEach((el) => el.classList.remove("staged")); if (done) done(); return; }
    items.forEach((el) => { el.classList.add("staged"); el.classList.remove("shown"); });
    const run = { items, i: 0, timer: null, done };
    stageRun = run;
    const holdAfter = (el) => {
      if (el.dataset.hold) return +el.dataset.hold;
      const n = (el.textContent || "").trim().length;
      return Math.min(1900, 320 + n * 13);
    };
    const step = () => {
      if (stageRun !== run) return;
      const el = run.items[run.i++];
      if (!el) return U.stageFinish(true);
      el.classList.add("shown");
      if (el.classList.contains("write")) U.write(el, () => { if (stageRun === run) run.timer = setTimeout(step, 320); });
      else run.timer = setTimeout(step, holdAfter(el));
    };
    run.timer = setTimeout(step, 60);
  };
  U.staging = () => !!stageRun;

  // ---------- The quill ----------
  // Scene-setting lines are written out letter by letter by a peacock-feather pen. Letters are cut
  // as whole graphemes, so a Devanagari syllable with its vowel signs appears in one stroke.
  const QUILL = '<svg viewBox="0 0 60 120" aria-hidden="true">' +
    '<path d="M5 117 C18 88 30 52 50 10" stroke="#e8dcc0" stroke-width="1.6" fill="none"/>' +
    '<g stroke="#4f9a6a" stroke-width="0.9" opacity="0.85" fill="none">' +
    '<path d="M14 92 l-8 -10 M14 92 l10 -4 M19 80 l-9 -11 M19 80 l11 -5 M24 68 l-9 -12 M24 68 l12 -5 M30 56 l-9 -12 M30 56 l12 -6 M35 45 l-8 -12 M35 45 l12 -6"/></g>' +
    '<ellipse cx="49" cy="17" rx="10" ry="15" transform="rotate(28 49 17)" fill="#2f7d55"/>' +
    '<ellipse cx="49" cy="17" rx="7" ry="11" transform="rotate(28 49 17)" fill="#e2b55a"/>' +
    '<ellipse cx="49.5" cy="17.5" rx="4.6" ry="7.4" transform="rotate(28 49 17)" fill="#1f56b0"/>' +
    '<ellipse cx="50" cy="18" rx="2.2" ry="3.6" transform="rotate(28 49 17)" fill="#0b1d45"/>' +
    '<path d="M2 120 L6 113 L8 116 Z" fill="#1a1208"/></svg>';
  let writer = null;
  const segmenter = window.Intl && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  const graphemes = (t) => (segmenter ? Array.from(segmenter.segment(t), (x) => x.segment) : Array.from(t));
  U.write = function (el, done) {
    U.writeFinish();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      const frag = document.createDocumentFragment();
      for (const g of graphemes(n.nodeValue)) { const sp = document.createElement("span"); sp.className = "ch"; sp.textContent = g; frag.appendChild(sp); }
      n.parentNode.replaceChild(frag, n);
    }
    const chars = el.querySelectorAll(".ch");
    const host = el.closest(".witness, .result, .telling, .text, .hero-copy, .life-head") || el.parentElement;
    let quill = host.querySelector(":scope > .quill");
    if (!quill) { quill = U.el('<span class="quill">' + QUILL + "</span>"); host.appendChild(quill); }
    el.classList.add("writing");
    quill.classList.add("on");
    const total = chars.length;
    const duration = Math.min(7000, Math.max(800, total * 36)); // an unhurried hand, about 28 letters a second
    const start = performance.now();
    let shown = 0;
    const w = (writer = { el, chars, quill, done, raf: 0 });
    const frame = (now) => {
      if (writer !== w) return;
      const n = Math.min(total, Math.ceil(((now - start) / duration) * total));
      if (n > shown && K.Sound && /\S/.test(chars[n - 1].textContent)) K.Sound.play("quill");
      for (; shown < n; shown++) chars[shown].classList.add("on");
      const last = chars[Math.max(0, shown - 1)];
      if (last) {
        const r = last.getBoundingClientRect(), h = host.getBoundingClientRect();
        quill.style.transform = "translate(" + (r.right - h.left - 3) + "px," + (r.bottom - h.top - 85) + "px)";
        // Keep the line being written in view inside a scrolling story.
        const story = el.closest(".story");
        if (story && story.dataset.follow !== "") { const sr = story.getBoundingClientRect(); if (r.bottom > sr.bottom - 18) story.scrollTop += r.bottom - sr.bottom + 36; }
      }
      if (shown >= total) return finish(true);
      w.raf = requestAnimationFrame(frame);
    };
    const finish = (callDone) => {
      if (writer !== w) return;
      writer = null;
      cancelAnimationFrame(w.raf);
      chars.forEach((c) => c.classList.add("on"));
      el.classList.remove("writing");
      quill.classList.remove("on");
      if (callDone && done) done();
    };
    w.finish = finish;
    w.raf = requestAnimationFrame(frame);
  };
  U.writeFinish = function () { if (writer) writer.finish(false); };
  U.stageFinish = function (callDone = true) {
    const run = stageRun;
    if (!run) return;
    stageRun = null;
    clearTimeout(run.timer);
    U.writeFinish();
    run.items.forEach((el) => el.classList.add("shown", "now"));
    if (callDone && run.done) run.done();
  };
  document.addEventListener("click", (e) => {
    if (!stageRun || e.target.closest("button, a, input, textarea, .scrim")) return;
    if (e.target.closest("#leaf")) U.stageFinish(true);
  });

  // Number keys map to whatever buttons the current screen registers.
  let keyActions = [];
  U.keys = (list) => { keyActions = list; };
  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea, select")) return;
    if (document.querySelector(".scrim")) { if (e.key === "Escape") U.closeModal(); return; }
    if (stageRun && (e.key === " " || e.key === "Enter" || /^[1-9]$/.test(e.key))) { e.preventDefault(); U.stageFinish(true); return; }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9 && keyActions[n - 1]) { e.preventDefault(); keyActions[n - 1](); }
  });

  U.scrollTop = function () {
    const leaf = U.$("leaf");
    if (leaf && leaf.scrollIntoView && leaf.getBoundingClientRect().top < 0) leaf.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  // Modal shell
  U.openModal = function (title, bodyHtml, onMount) {
    U.closeModal();
    const scrim = U.el('<div class="scrim" role="dialog" aria-modal="true" aria-label="' + U.tr(title) + '"><div class="modal"><header><h2>' + U.tr(title) +
      '</h2><button type="button" class="ghost" id="modal-close">' + U.tr("Close") + '</button></header><div id="modal-body">' + bodyHtml + "</div></div></div>");
    scrim.addEventListener("click", (e) => { if (e.target === scrim) U.closeModal(); });
    document.body.appendChild(scrim);
    U.$("modal-close").addEventListener("click", U.closeModal);
    if (onMount) onMount(U.$("modal-body"));
    U.$("modal-close").focus();
  };
  U.closeModal = function () { const s = document.querySelector(".scrim"); if (s) s.remove(); };

  // ---------- Language ----------
  // Each screen registers how to draw itself again (U.redraw), so a language switch can repaint
  // the current screen in place, including a scene whose choice has already been made.
  U.redraw = null;
  U.applyStatic = function () {
    const html = document.documentElement;
    html.lang = (K.LANGS[K.lang] || K.LANGS.en).htmlLang;
    document.title = K.tr("Kurukshetra: A Life");
    U.$("brand").textContent = K.tr("Kurukshetra: A Life");
    U.$("nav").setAttribute("aria-label", K.tr("Game menu"));
    U.$("nav-char").textContent = K.tr("Character");
    U.$("nav-journal").textContent = K.tr("Journal");
    U.$("nav-map").textContent = K.tr("Map");
    U.$("nav-menu").textContent = K.tr("Menu");
    U.$("standing-label").textContent = K.tr("Standing");
    U.$("nav-standing").setAttribute("aria-label", K.tr("Obligations, bonds, vows and memories"));
    U.$("ledger").setAttribute("aria-label", K.tr("Obligations, bonds, vows and memories"));
  };
  U.setLang = function (lang, reopen) {
    if (!K.LANGS[lang] || lang === K.lang) return;
    K.lang = lang;
    K.prefs({ lang });
    U.applyStatic();
    if (U.redraw) U.redraw();
    if (reopen) reopen();
  };
  // The two-button language switch used on the title screen and in the menu.
  U.langSwitch = function (onPick) {
    const box = U.el('<div class="langs" role="group" aria-label="Language / भाषा"></div>');
    for (const [id, l] of Object.entries(K.LANGS)) {
      const b = U.button("lang", U.esc(l.name), () => onPick(id));
      b.setAttribute("lang", l.htmlLang);
      b.setAttribute("aria-pressed", String(K.lang === id));
      box.appendChild(b);
    }
    return box;
  };
})(window.K = window.K || {});
