/* The ledger: obligations, bonds, vows, boons, curses and memories, always visible beside the scene. */
(function (K) {
  "use strict";
  const U = K.UI;

  function meter(label, v, key, max = 10) {
    const d = K.lastDelta[key] || 0;
    let pips = "";
    for (let i = 0; i < 10; i++) {
      const on = i < Math.round((v / max) * 10);
      const cls = on ? (d > 0 && i >= v - d ? "flash" : "on") : d < 0 && i < v - d ? "lost" : "";
      pips += "<i class=\"" + cls + "\"></i>";
    }
    const delta = d ? ' <b class="' + (d > 0 ? "d-up" : "d-down") + '">' + (d > 0 ? "+" : "") + d + "</b>" : "";
    return '<div class="meter"><div class="row"><span>' + U.esc(label) + "</span><span>" + v + " / " + max + delta + '</span></div><div class="pips" aria-hidden="true">' + pips + "</div></div>";
  }

  U.renderLedger = function () {
    const S = K.S, L = U.$("ledger");
    if (!L || L.hidden) return;
    const teacherName = K.TEACHERS && K.TEACHERS[S.teacher] ? ": " + K.TEACHERS[S.teacher].short : "";
    const kingName = K.COURTS && K.COURTS[S.court] ? ": " + K.COURTS[S.court].king : "";
    const duties = Object.entries(K.DUTIES).map(([k, n]) =>
      meter(n + (k === "teacher" ? teacherName : k === "court" ? kingName : ""), S.duty[k], "duty." + k)).join("");

    const bondIds = Object.keys(S.bonds).filter((id) => !S.dead.includes(id))
      .sort((a, b) => (K.lastDelta["bond." + b] ? 1 : 0) - (K.lastDelta["bond." + a] ? 1 : 0) || S.bonds[b] - S.bonds[a]).slice(0, 6);
    const bonds = bondIds.map((id) => meter(K.personName(id), S.bonds[id], "bond." + id)).join("") || '<p class="empty">No close bonds yet.</p>';

    const vows = S.vows.map((v) => '<div class="vowcard ' + (v.broken ? "broken" : "") + '"><b>' + U.esc(K.VOWS[v.id].name) + "</b><small>" +
      (v.released ? "Released through penance." : v.broken ? "Broken at " + v.brokenAge + ". The shame is visible to everyone." : U.esc(K.VOWS[v.id].gift)) + "</small></div>").join("") || '<p class="empty">No vows taken.</p>';

    const chips = []
      .concat(S.boons.map((b) => '<span class="chip good" title="' + U.esc(K.BOONS[b].text) + '">' + U.esc(K.BOONS[b].name) + "</span>"))
      .concat(S.curses.map((c) => '<span class="chip bad" title="' + U.esc(c.fired ? "This curse has struck." : "You do not know when it will strike.") + '">' + U.esc(K.CURSES[c.id].name) + (c.fired ? " (struck)" : "") + "</span>"))
      .concat(S.injuries.map((i) => '<span class="chip bad">' + U.esc(K.INJURIES[i].name) + "</span>"));

    const mems = S.memories.slice(-5).reverse().map((m) => "<li>" + U.esc(m.text) + "<em>" +
      (m.who === "all" ? "Remembered by many" : "Remembered by " + U.esc(K.personName(m.who))) + " · age " + m.age + "</em></li>").join("");

    L.innerHTML =
      "<h2>Obligations</h2><p class=\"sub\">Choices pull these against each other. There is no good or evil bar.</p>" + duties +
      "<h2>Bonds</h2>" + bonds +
      "<h2>Vows (" + K.activeVows().length + " / " + K.MAX_VOWS + ")</h2>" + vows +
      (chips.length ? '<h2>Boons, curses and wounds</h2><div class="chips">' + chips.join("") + "</div>" : "") +
      "<h2>Memories</h2>" + (mems ? '<ul class="mems">' + mems + "</ul>" : '<p class="empty">Nothing remembered yet.</p>');
  };
})(window.K = window.K || {});
