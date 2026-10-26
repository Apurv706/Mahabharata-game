/* Scene screen: witness layer, the player's choices, results, and the canon "after" beat. */
(function (K) {
  "use strict";
  const U = K.UI;

  function header(sc) {
    const S = K.S;
    U.where("<b>" + U.esc(K.val(sc.actTitle) || K.ACT_TITLES[S.act] || "") + "</b>Age " + S.age + " · " + U.t(K.val(sc.place) || ""));
  }
  function artFor(sc) {
    const a = K.val(sc.art);
    return a === "origin" ? K.S.origin : a;
  }
  function tagFor(sc) {
    if (sc.canon) return ["canon", "Canon · this always happens"];
    if (sc.war) return ["war", "The war"];
    return ["yours", "Your life"];
  }

  U.renderScene = function (sc) {
    if (sc.ending) return U.renderEnding(sc);
    const S = K.S;
    U.setNav(true);
    header(sc);
    const [tag, tagText] = tagFor(sc);
    const witness = K.val(sc.witness);
    const leaf = U.$("leaf");
    leaf.innerHTML = U.plate({ art: artFor(sc), grad: sc.plate, caption: K.val(sc.caption), tag, tagText }) +
      '<div class="text"><h1>' + U.t(K.val(sc.title)) + "</h1>" +
      (witness ? '<div class="witness"><div class="lbl">What happens, whatever you do</div>' + U.blocks(witness) + "</div>" : "") +
      U.blocks(sc.body) + '<div class="choices" id="choices"></div><p class="hint" id="keyhint"></p></div>';
    const box = U.$("choices");
    const rows = K.choiceList(sc);
    const keys = [];
    rows.forEach(({ c, ok }, i) => {
      const fx = ok ? K.preview(c).map(([cls, t]) => '<span class="' + cls + '">' + U.esc(t) + "</span>").join("") : U.t(K.val(c.locked));
      const b = U.button("choice", '<span class="k">' + (i + 1) + '</span><span class="t">' + U.t(K.val(c.t)) + '</span><span class="fx">' + fx + "</span>", null, "choice-" + c.id);
      b.disabled = !ok;
      const run = () => pick(sc, c, b);
      b.addEventListener("click", run);
      keys.push(ok ? run : null);
      box.appendChild(b);
    });
    U.$("keyhint").textContent = rows.length > 1 ? "Press 1 to " + rows.length + " to choose." : "";
    U.keys(keys);
    U.renderLedger();
    U.scrollTop();
  };

  function pick(sc, c, btn) {
    const res = K.choose(sc, c);
    if (res.combat) {
      U.startBattle(res.combat, (outcome) => {
        const o = K.combatOutcome(res.combat, outcome, res.next);
        if (!K.S.alive) return K.go("end_death");
        U.renderScene(sc);
        showAfter(sc, c, { text: o.text, after: res.after, check: null, pre: res.text }, o.next);
      });
      return;
    }
    if (res.text || res.check || res.after) return showAfter(sc, c, res, res.next, btn);
    K.go(res.next);
  }

  function showAfter(sc, c, res, next) {
    const box = U.$("choices");
    const picked = U.button("choice picked", '<span class="k">·</span><span class="t">' + U.t(K.val(c.t)) + '</span><span class="fx">Your choice</span>');
    picked.disabled = true;
    box.innerHTML = "";
    box.appendChild(picked);
    if (res.pre || res.text || res.check) {
      const r = res.check;
      box.appendChild(U.el('<div class="result">' +
        (r ? '<span class="roll">' + U.esc(r.label) + ": rolled " + r.roll + ", total " + r.total + " against " + r.dc + ' · <b class="' + (r.pass ? "pass" : "fail") + '">' + (r.pass ? "Success" : "Failure") + "</b></span>" : "") +
        (res.pre ? "<p>" + U.esc(res.pre) + "</p>" : "") + (res.text ? "<p>" + U.esc(res.text) + "</p>" : "") + "</div>"));
    }
    if (res.after && K.S.alive) {
      box.appendChild(U.el('<div class="witness"><div class="lbl">And then, as it always does</div>' + U.blocks(res.after) + "</div>"));
    }
    const go = () => K.go(next);
    const cont = U.button("cta", "Continue", go);
    box.appendChild(cont);
    U.$("keyhint").innerHTML = "";
    U.keys([go]);
    U.renderLedger();
    cont.focus({ preventScroll: true });
  }
})(window.K = window.K || {});
