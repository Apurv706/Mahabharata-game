/* Combat screen. Tap an enemy to target it, then pick an action (or press 1–9). */
(function (K) {
  "use strict";
  const U = K.UI;
  const C = K.Combat;
  let target = null;
  let onEndCb = null;

  U.startBattle = function (encId, onEnd) {
    target = null;
    onEndCb = onEnd;
    C.start(encId, onEnd);
  };

  function unitCard(u, B) {
    const pct = Math.round((u.hp / u.maxHp) * 100);
    const st = Object.keys(u.status).map((s) => "<span>" + U.esc(K.STATUS_TEXT[s] || s) + "</span>").join("");
    const enemy = u.side === "enemy";
    const sel = enemy && target === u.uid ? " sel" : "";
    const label = u.side === "player" ? "You" : u.name;
    return '<button type="button" class="unit ' + u.side + sel + (u.hp <= 0 ? " down" : "") + '" data-uid="' + u.uid + '"' + (!enemy || u.hp <= 0 || B.over ? " disabled" : "") + ">" +
      '<span class="nm">' + U.esc(label) + "<span>" + u.hp + " / " + u.maxHp + "</span></span>" +
      '<span class="hpbar"><i style="width:' + pct + '%"></i></span>' +
      (st ? '<span class="st">' + st + "</span>" : "") +
      (u.note ? '<span class="note">' + U.t(u.note) + "</span>" : "") + "</button>";
  }

  U.renderBattle = function (B) {
    if (!B) return;
    U.setNav(true);
    const enc = B.enc;
    const enemies = B.units.filter((u) => u.side === "enemy");
    if (!target || !enemies.find((e) => e.uid === target && e.hp > 0)) target = (enemies.find((e) => e.hp > 0) || {}).uid || null;
    U.where("<b>Battle</b>" + U.t(K.val(enc.title)) + (enc.rounds ? " · round " + Math.min(B.round, enc.rounds) + " of " + enc.rounds : " · round " + B.round));
    const friends = B.units.filter((u) => u.side !== "enemy");
    const leaf = U.$("leaf");
    leaf.innerHTML = U.plate({ art: K.val(enc.art), grad: ["#8c5c38", "#2a1c1f"], caption: K.val(enc.caption), tag: enc.lethal ? "war" : "yours", tagText: enc.lethal ? "Battle · you can die" : "Fight" }) +
      '<div class="text battle"><h1>' + U.t(K.val(enc.title)) + "</h1>" +
      '<div class="sides"><div class="side"><span class="lbl">Your side</span>' + friends.map((u) => unitCard(u, B)).join("") +
      '</div><div class="side"><span class="lbl">Against you · tap to target</span>' + enemies.map((u) => unitCard(u, B)).join("") + "</div></div>" +
      '<div id="battle-actions"></div><ol class="blog" id="blog" aria-live="polite">' + B.log.slice(-8).map((l) => "<li>" + U.esc(l) + "</li>").join("") + "</ol></div>";
    leaf.querySelectorAll(".unit.enemy").forEach((el) => el.addEventListener("click", () => { target = el.dataset.uid; U.renderBattle(B); }));
    const log = U.$("blog");
    log.scrollTop = log.scrollHeight;
    const box = U.$("battle-actions");
    const keys = [];

    if (B.over) {
      const msg = { win: K.val(enc.winLine) || "The fight is won.", lose: enc.lethal && !K.S.storyMode ? "You have fallen." : "You are beaten.", flee: "You leave the fight behind.", spare: "You let them live." }[B.over];
      box.appendChild(U.el('<div class="result"><p><b>' + U.t(msg) + "</b></p></div>"));
      const done = () => { const cb = onEndCb; const out = C.end().over; onEndCb = null; cb(out); };
      const cont = U.button("cta", "Continue", done);
      box.appendChild(cont);
      U.keys([done]);
      U.renderLedger();
      cont.focus({ preventScroll: true });
      return;
    }

    const acts = U.el('<div class="actions"></div>');
    C.available().forEach((a, i) => {
      const special = !["strike", "guard", "herbs"].includes(a.id);
      const extra = a.count != null ? " (" + a.count + ")" : "";
      const b = U.button("act" + (special ? " special" : ""), "<b>" + (i + 1) + ". " + U.esc(a.name + extra) + "</b><small>" + U.esc(a.why || a.desc) + "</small>");
      b.disabled = !!a.why;
      const run = () => C.act(a.id, a.target === "enemy" ? target : null);
      b.addEventListener("click", run);
      keys.push(a.why ? null : run);
      acts.appendChild(b);
    });
    box.appendChild(acts);

    const tools = U.el('<div class="battle-tools"></div>');
    C.spareable().forEach((e) => tools.appendChild(U.button("cta secondary", "Spare " + U.esc(e.name), () => C.spare(e.uid))));
    if (C.canFlee()) {
      const breaks = C.fleeBreaks();
      const label = breaks.length ? "Withdraw (breaks your vow: " + U.esc(K.VOWS[breaks[0]].name.toLowerCase()) + ")" : "Withdraw from the fight";
      let armed = false;
      const fb = U.button("ghost", label, () => {
        if (breaks.length && !armed) { armed = true; fb.textContent = "Tap again to break your vow and withdraw"; return; }
        C.flee();
      });
      tools.appendChild(fb);
    }
    if (tools.children.length) box.appendChild(tools);
    U.keys(keys);
    U.renderLedger();
  };

  K.on("combat", (B) => U.renderBattle(B));
})(window.K = window.K || {});
