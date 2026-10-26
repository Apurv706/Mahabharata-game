/* DOM helpers shared by the screens. */
(function (K) {
  "use strict";
  const U = (K.UI = {});
  U.$ = (id) => document.getElementById(id);
  U.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  U.t = (s) => U.esc(K.fmt(s));
  U.el = function (html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  U.button = function (cls, html, onClick, id) {
    const b = document.createElement("button");
    b.type = "button"; b.className = cls; b.innerHTML = html;
    if (id) b.id = id;
    if (onClick) b.addEventListener("click", onClick);
    return b;
  };
  U.artUrl = (key) => (key ? "art/" + key + ".jpg" : null);

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
    const style = img ? "--img:url('" + img + "')" : "--field:color-mix(in srgb, " + field + " 42%, #13110e)";
    const kind = o.tagText ? '<span class="kind ' + (o.tag || "") + '">' + U.esc(o.tagText) + "</span>" : "";
    let cap = kind;
    if (o.title) cap += "<b>" + U.t(o.title) + "</b>";
    if (o.small) cap += "<small>" + U.t(o.small) + "</small>";
    if (!o.title && !o.small && o.caption) cap += img ? "<small>" + U.t(o.caption) + "</small>" : "<b>" + U.t(o.caption) + "</b>";
    return '<div class="plate' + (img ? " painted" : "") + (o.tall ? " tall" : "") + '" style="' + style + '">' +
      (cap ? '<span class="cap">' + cap + "</span>" : "") + "</div>";
  };

  U.where = function (html) { U.$("where").innerHTML = html; };
  U.setNav = function (on) { U.$("nav").hidden = !on; U.$("game").classList.toggle("wide", !on); U.$("ledger").hidden = !on; };

  // Number keys map to whatever buttons the current screen registers.
  let keyActions = [];
  U.keys = (list) => { keyActions = list; };
  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea, select")) return;
    if (document.querySelector(".scrim")) { if (e.key === "Escape") U.closeModal(); return; }
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
    const scrim = U.el('<div class="scrim" role="dialog" aria-modal="true" aria-label="' + U.esc(title) + '"><div class="modal"><header><h2>' + U.esc(title) +
      '</h2><button type="button" class="ghost" id="modal-close">Close</button></header><div id="modal-body">' + bodyHtml + "</div></div></div>");
    scrim.addEventListener("click", (e) => { if (e.target === scrim) U.closeModal(); });
    document.body.appendChild(scrim);
    U.$("modal-close").addEventListener("click", U.closeModal);
    if (onMount) onMount(U.$("modal-body"));
    U.$("modal-close").focus();
  };
  U.closeModal = function () { const s = document.querySelector(".scrim"); if (s) s.remove(); };
})(window.K = window.K || {});
