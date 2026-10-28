/* The ledger: obligations, bonds, vows, boons, curses and memories. In the story it sits behind the
   "Standing" button at the top right; when something changes, a short note floats up beside it. */
(function (K) {
  "use strict";
  const U = K.UI;

  function meter(label, v, key, max = 10, face = null) {
    const d = K.lastDelta[key] || 0;
    let pips = "";
    for (let i = 0; i < 10; i++) {
      const on = i < Math.round((v / max) * 10);
      const cls = on ? (d > 0 && i >= v - d ? "flash" : "on") : d < 0 && i < v - d ? "lost" : "";
      pips += "<i class=\"" + cls + "\"></i>";
    }
    const delta = d ? ' <b class="' + (d > 0 ? "d-up" : "d-down") + '">' + (d > 0 ? "+" : "") + d + "</b>" : "";
    return '<div class="meter' + (face ? " with-face" : "") + '">' + (face ? U.thumb(face, "face") : "") + '<div class="row"><span>' + U.esc(label) + "</span><span>" + v + " / " + max + delta + '</span></div><div class="pips" aria-hidden="true">' + pips + "</div></div>";
  }

  U.renderLedger = function () {
    const S = K.S, L = U.$("ledger");
    if (!L) return;
    floatChanges();
    const teacherName = K.TEACHERS && K.TEACHERS[S.teacher] ? ": " + K.tr(K.TEACHERS[S.teacher].short) : "";
    const kingName = K.COURTS && K.COURTS[S.court] ? ": " + K.tr(K.COURTS[S.court].king) : "";
    const duties = Object.entries(K.DUTIES).map(([k, n]) =>
      meter(K.tr(n) + (k === "teacher" ? teacherName : k === "court" ? kingName : ""), S.duty[k], "duty." + k)).join("");

    const bondIds = Object.keys(S.bonds).filter((id) => !S.dead.includes(id))
      .sort((a, b) => (K.lastDelta["bond." + b] ? 1 : 0) - (K.lastDelta["bond." + a] ? 1 : 0) || S.bonds[b] - S.bonds[a]).slice(0, 6);
    const bonds = bondIds.map((id) => meter(K.personName(id), S.bonds[id], "bond." + id, 10, U.portraitKey(id))).join("") || '<p class="empty">' + U.tr("No close bonds yet.") + "</p>";

    const vows = S.vows.map((v) => '<div class="vowcard ' + (v.broken ? "broken" : "") + '">' + U.thumb("vow_" + v.id, "emblem") + '<b>' + U.tr(K.VOWS[v.id].name) + "</b><small>" +
      (v.released ? U.tr("Released through penance.") : v.broken ? U.tr("Broken at {n}. The shame is visible to everyone.", { n: v.brokenAge }) : U.tr(K.VOWS[v.id].gift)) + "</small></div>").join("") || '<p class="empty">' + U.tr("No vows taken.") + "</p>";

    const chips = []
      .concat(S.boons.map((b) => '<span class="chip good" title="' + U.tr(K.BOONS[b].text) + '">' + U.tr(K.BOONS[b].name) + "</span>"))
      .concat(S.curses.map((c) => '<span class="chip bad" title="' + U.tr(c.fired ? "This curse has struck." : "You do not know when it will strike.") + '">' +
        (c.fired ? U.tr("{curse} (struck)", { curse: K.tr(K.CURSES[c.id].name) }) : U.tr(K.CURSES[c.id].name)) + "</span>"))
      .concat(S.injuries.map((i) => '<span class="chip bad">' + U.tr(K.INJURIES[i].name) + "</span>"));

    const secrets = (K.SECRETS || []).filter((s) => K.test(s.when, S)).map((s) => "<li>" + U.tr(s.text) + "</li>").join("");

    const mems = S.memories.slice(-5).reverse().map((m) => "<li>" + U.esc(K.entryText(m)) + "<em>" +
      (m.who === "all" ? U.tr("Remembered by many · age {n}", { n: m.age }) : U.tr("Remembered by {who} · age {n}", { who: K.personName(m.who), n: m.age })) + "</em></li>").join("");

    L.innerHTML =
      "<h2>" + U.tr("Obligations") + '</h2><p class="sub">' + U.tr("Choices pull these against each other. There is no good or evil bar.") + "</p>" + duties +
      "<h2>" + U.tr("Bonds") + "</h2>" + bonds +
      "<h2>" + U.tr("Vows ({n} / {max})", { n: K.activeVows().length, max: K.MAX_VOWS }) + "</h2>" + vows +
      (chips.length ? "<h2>" + U.tr("Boons, curses and wounds") + '</h2><div class="chips">' + chips.join("") + "</div>" : "") +
      (secrets ? "<h2>" + U.tr("Secrets you keep") + '</h2><ul class="secrets">' + secrets + "</ul>" : "") +
      "<h2>" + U.tr("Memories") + "</h2>" + (mems ? '<ul class="mems">' + mems + "</ul>" : '<p class="empty">' + U.tr("Nothing remembered yet.") + "</p>");
  };

  // ---------- The Standing panel ----------
  U.toggleLedger = function (force) {
    const L = U.$("ledger"), b = U.$("nav-standing");
    const open = force === undefined ? L.hidden : force;
    L.hidden = !open;
    b.setAttribute("aria-expanded", String(open));
    if (open) { U.renderLedger(); L.focus && L.focus(); }
  };
  document.addEventListener("click", (e) => {
    const L = U.$("ledger");
    if (!L || L.hidden || e.target.closest("#ledger, #nav-standing")) return;
    U.toggleLedger(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && U.$("ledger") && !U.$("ledger").hidden) U.toggleLedger(false); });

  // What just changed, as short notes floating up by the button: "+1 Loyalty to your king".
  let floated = null;
  function floatChanges() {
    const box = U.$("floats"), d = K.lastDelta || {};
    if (!box || d === floated) return;
    floated = d;
    const name = (key) => {
      const [kind, id] = key.split(".");
      if (kind === "duty") return K.tr(K.DUTIES[id]);
      if (kind === "bond") return K.personName(id);
      if (kind === "rep") return K.tr(K.FACTIONS[id]);
      if (kind === "skill") return K.tr(K.SKILLS[id]);
      if (kind === "attr") return K.tr(K.ATTRS[id]);
      return null;
    };
    const notes = Object.entries(d).filter(([k, n]) => typeof n === "number" && n && name(k)).slice(0, 4);
    notes.forEach(([k, n], i) => {
      const el = U.el('<span class="float ' + (n > 0 ? "up" : "down") + '">' + (n > 0 ? "+" : "") + n + " " + U.esc(name(k)) + "</span>");
      el.style.animationDelay = i * 0.35 + "s";
      box.appendChild(el);
      setTimeout(() => el.remove(), 3200 + i * 350);
    });
  }
})(window.K = window.K || {});
