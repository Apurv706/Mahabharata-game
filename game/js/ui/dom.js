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
    try { return new URL("art/" + key + ".jpg", document.baseURI).href; } catch (e) { return "art/" + key + ".jpg"; }
  };

  // Story text blocks: plain strings, speech, memories, curses, asides.
  U.blocks = function (arr) {
    return [].concat(K.val(arr) || []).filter(Boolean).map((b) => {
      if (typeof b === "string") return "<p>" + U.t(b) + "</p>";
      if (b.speaker) return '<div><div class="lbl">' + U.t(b.speaker) + '</div><p class="speech">' + U.t(b.line) + "</p></div>";
      if (b.memory) return '<p class="memory">' + U.t(b.memory) + "</p>";
      if (b.curse) return '<p class="curse">' + U.t(b.curse) + "</p>";
      if (b.aside) return '<p class="aside">' + U.t(b.aside) + "</p>";
      return "";
    }).join("");
  };

  // The scene's painting, or (until the art exists) a flat field in the scene's own colour with its
  // caption set large, so a missing picture still reads as a designed page, never a gradient.
  U.plate = function (o) {
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
  U.setNav = function (on) {
    document.body.classList.remove("titling"); // the title screen adds it back after this call
    U.$("nav").hidden = !on; U.$("game").classList.toggle("wide", !on); U.$("ledger").hidden = !on;
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
      run.timer = setTimeout(step, holdAfter(el));
    };
    run.timer = setTimeout(step, 60);
  };
  U.staging = () => !!stageRun;
  U.stageFinish = function (callDone = true) {
    const run = stageRun;
    if (!run) return;
    stageRun = null;
    clearTimeout(run.timer);
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
    U.$("nav-menu").textContent = K.tr("Menu");
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
