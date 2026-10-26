/* Combat screen. Tap an enemy to target it, then pick an action (or press 1–9). */
(function (K) {
  "use strict";
  const U = K.UI;
  const C = K.Combat;
  let target = null;
  let onEndCb = null;
  let lastHp = {};
  let lastLogLen = 0;

  U.startBattle = function (encId, onEnd) {
    target = null;
    lastHp = {};
    lastLogLen = 0;
    onEndCb = onEnd;
    if (K.ENCOUNTERS[encId] && K.ENCOUNTERS[encId].lethal && K.Sound) K.Sound.play("conch");
    C.start(encId, onEnd);
  };

  // "Next: Heavy blow → you", under an enemy's name.
  function intentLine(u) {
    const it = C.intent(u);
    if (!it) return "";
    const ab = K.tr(it.name);
    let txt;
    if (it.target === "enemies") txt = K.tr("Next: {ab} → all of you", { ab });
    else if (it.unit && it.unit.side === "player") txt = K.tr("Next: {ab} → you", { ab });
    else if (it.unit && it.unit !== u) txt = K.tr("Next: {ab} → {who}", { ab, who: K.text(it.unit.src || it.unit.name) });
    else txt = K.tr("Next: {ab}", { ab });
    const danger = it.heavy && (it.target === "enemies" || (it.unit && it.unit.side === "player"));
    return '<span class="intent' + (danger ? " danger" : "") + '">' + U.esc(txt) + "</span>";
  }

  function unitCard(u, B) {
    const pct = Math.round((u.hp / u.maxHp) * 100);
    const st = Object.keys(u.status).map((s) => "<span>" + U.tr(K.STATUS_TEXT[s] || s) + "</span>").join("");
    const enemy = u.side === "enemy";
    const sel = enemy && target === u.uid ? " sel" : "";
    const label = u.side === "player" ? K.tr("You") : K.text(u.src || u.name);
    return '<button type="button" class="unit ' + u.side + sel + (u.hp <= 0 ? " down" : "") + '" data-uid="' + u.uid + '"' + (!enemy || u.hp <= 0 || B.over ? " disabled" : "") + ">" +
      '<span class="nm">' + (u.person && U.portraitKey(u.person) ? U.thumb(U.portraitKey(u.person), "face") : "") + "<em>" + U.esc(label) + "</em><span>" + u.hp + " / " + u.maxHp + "</span></span>" +
      '<span class="hpbar"><i style="width:' + pct + '%"></i></span>' +
      (st ? '<span class="st">' + st + "</span>" : "") +
      (enemy ? intentLine(u) : "") +
      (u.note ? '<span class="note">' + U.t(u.note) + "</span>" : "") + "</button>";
  }

  U.renderBattle = function (B) {
    if (!B) return;
    U.redraw = () => U.renderBattle(C.state() || B);
    U.setNav(true);
    const enc = B.enc;
    const enemies = B.units.filter((u) => u.side === "enemy");
    if (!target || !enemies.find((e) => e.uid === target && e.hp > 0)) target = (enemies.find((e) => e.hp > 0) || {}).uid || null;
    U.where("<b>" + U.tr("Battle") + "</b>" + U.t(K.val(enc.title)) + " · " + (enc.rounds ? U.tr("round {n} of {m}", { n: Math.min(B.round, enc.rounds), m: enc.rounds }) : U.tr("round {n}", { n: B.round })));
    const friends = B.units.filter((u) => u.side !== "enemy");
    const leaf = U.$("leaf");
    leaf.innerHTML = U.plate({ art: K.val(enc.art), grad: ["#8c5c38", "#2a1c1f"], caption: K.val(enc.caption), tag: enc.lethal ? "war" : "yours", tagText: K.tr(enc.lethal ? "Battle · you can die here" : "A fight") }) +
      '<div class="text battle"><h1>' + U.t(K.val(enc.title)) + "</h1>" +
      '<div class="sides"><div class="side"><span class="lbl">' + U.tr("Your side") + "</span>" + friends.map((u) => unitCard(u, B)).join("") +
      '</div><div class="side"><span class="lbl">' + U.tr("Against you · tap to target") + "</span>" + enemies.map((u) => unitCard(u, B)).join("") + "</div></div>" +
      '<div id="battle-actions"></div><ol class="blog" id="blog" aria-live="polite">' + B.log.slice(-8).map((l) => "<li" + (l.ev ? ' class="ev"' : "") + ">" + U.esc(C.line(l)) + "</li>").join("") + "</ol></div>";
    // Blows land visibly (and audibly): a card that lost health shakes and shows the damage; healing glows.
    if (K.Sound && B.log.length !== lastLogLen) {
      const fresh = B.log.slice(lastLogLen);
      const lost = B.units.some((u) => lastHp[u.uid] != null && u.hp < lastHp[u.uid]);
      const gained = B.units.some((u) => lastHp[u.uid] != null && u.hp > lastHp[u.uid]);
      if (fresh.some((l) => l.ev)) K.Sound.play("gong");
      if (lost) K.Sound.play("hit"); else if (gained) K.Sound.play("heal");
    }
    if (U.motion()) {
      for (const u of B.units) {
        const before = lastHp[u.uid];
        const el = leaf.querySelector('.unit[data-uid="' + u.uid + '"]');
        if (el && before != null && before !== u.hp) {
          const d = u.hp - before;
          el.classList.add(d < 0 ? "hit" : "healed");
          el.appendChild(U.el('<span class="dmg ' + (d < 0 ? "down" : "up") + '" aria-hidden="true">' + (d > 0 ? "+" : "") + d + "</span>"));
        }
      }
      const last = leaf.querySelector("#blog li:last-child");
      if (last && B.log.length !== lastLogLen) last.classList.add("fresh");
    }
    lastHp = Object.fromEntries(B.units.map((u) => [u.uid, u.hp]));
    lastLogLen = B.log.length;
    leaf.querySelectorAll(".unit.enemy").forEach((el) => el.addEventListener("click", () => { target = el.dataset.uid; U.renderBattle(B); }));
    const log = U.$("blog");
    log.scrollTop = log.scrollHeight;
    const box = U.$("battle-actions");
    const keys = [];

    if (B.over) {
      const msg = { win: K.val(enc.winLine) || "The fight is won.", lose: enc.lethal && !K.S.storyMode ? "You have fallen." : "You are beaten.", flee: "You leave the fight behind.", spare: "You let them live." }[B.over];
      box.appendChild(U.el('<div class="result"><p><b>' + U.t(msg) + "</b></p></div>"));
      const done = () => { const cb = onEndCb; const out = C.end().over; onEndCb = null; cb(out); };
      const cont = U.button("cta", U.tr("Continue"), done);
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
    C.fallen().forEach((u) => tools.appendChild(U.button("cta secondary", U.tr("Pull {name} out of the fighting", { name: K.text(u.src || u.name) }) + "<small>" + U.tr("Costs your turn") + "</small>", () => C.pull(u.uid))));
    C.spareable().forEach((e) => tools.appendChild(U.button("cta secondary", U.tr("Spare {name}", { name: K.text(e.src || e.name) }), () => C.spare(e.uid))));
    if (C.canFlee()) {
      const breaks = C.fleeBreaks();
      const label = breaks.length ? U.tr("Withdraw (breaks your vow: {vow!})", { vow: K.tr(K.VOWS[breaks[0]].name) }) : U.tr("Withdraw from the fight");
      let armed = false;
      const fb = U.button("ghost", label, () => {
        if (breaks.length && !armed) { armed = true; fb.textContent = K.tr("Tap again to break your vow and withdraw"); return; }
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
