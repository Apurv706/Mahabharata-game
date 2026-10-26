/* The ledger: obligations, bonds, vows, boons, curses and memories, always visible beside the scene. */
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
    if (!L || L.hidden) return;
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

    const mems = S.memories.slice(-5).reverse().map((m) => "<li>" + U.esc(K.entryText(m)) + "<em>" +
      (m.who === "all" ? U.tr("Remembered by many · age {n}", { n: m.age }) : U.tr("Remembered by {who} · age {n}", { who: K.personName(m.who), n: m.age })) + "</em></li>").join("");

    L.innerHTML =
      "<h2>" + U.tr("Obligations") + '</h2><p class="sub">' + U.tr("Choices pull these against each other. There is no good or evil bar.") + "</p>" + duties +
      "<h2>" + U.tr("Bonds") + "</h2>" + bonds +
      "<h2>" + U.tr("Vows ({n} / {max})", { n: K.activeVows().length, max: K.MAX_VOWS }) + "</h2>" + vows +
      (chips.length ? "<h2>" + U.tr("Boons, curses and wounds") + '</h2><div class="chips">' + chips.join("") + "</div>" : "") +
      "<h2>" + U.tr("Memories") + "</h2>" + (mems ? '<ul class="mems">' + mems + "</ul>" : '<p class="empty">' + U.tr("Nothing remembered yet.") + "</p>");
  };
})(window.K = window.K || {});
