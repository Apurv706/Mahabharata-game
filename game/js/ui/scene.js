/* Scene screen: witness layer, the player's choices, results, and the canon "after" beat. */
(function (K) {
  "use strict";
  const U = K.UI;

  function header(sc) {
    const S = K.S;
    U.where("<b>" + U.t(K.val(sc.actTitle) || K.ACT_TITLES[S.act] || "") + "</b>" + U.tr("Age {n}", { n: S.age }) + " · " + U.t(K.val(sc.place) || ""));
  }
  function artFor(sc) {
    const a = K.val(sc.art);
    return a === "origin" ? "home_" + K.S.origin : a;
  }
  function tagFor(sc) {
    if (sc.canon) return ["canon", K.tr("Canon · this always happens")];
    if (sc.war) return ["war", K.tr("The war")];
    return ["yours", K.tr("Your life")];
  }

  // Other moments where everything is at stake: the music turns tense for these too.
  const TENSE = new Set(["a1_poison", "a3_lac", "a5_karna_secret", "a5_side"]);
  // A conch for each day of the war, once per scene (not again when the screen is redrawn).
  let lastConch = null;
  U.renderScene = function (sc) {
    stopLamp();
    if (sc.ending) return U.renderEnding(sc);
    const S = K.S;
    if (sc.war && lastConch !== sc.id && K.Sound) K.Sound.play("conch");
    // The music follows the stakes: the war, the dice hall and timed moments are tense.
    // The music follows the stage: the war plays the battle anthem; the dice game, the exile years and
    // high-stakes moments the fusion piece; everything else the heroic theme.
    if (K.Sound) K.Sound.mood(sc.war || sc.act === 6 ? "battle" : sc.act === 4 || sc.act === 5 || K.val(sc.lamp) || TENSE.has(sc.id) ? "tense" : "calm");
    lastConch = sc.id;
    U.redraw = () => U.renderScene(sc);
    U.setNav(true);
    header(sc);
    // A new place on the map: the journey plays over the scene.
    const moved = K.travel ? K.travel(sc) : null;
    if (moved && U.showJourney) U.showJourney(moved[0], moved[1]);
    const [tag, tagText] = tagFor(sc);
    const witness = K.val(sc.witness);
    const leaf = U.$("leaf");
    leaf.innerHTML = U.plate({ art: artFor(sc), grad: sc.plate, caption: K.val(sc.caption), tag, tagText }) +
      '<div class="text"><h1>' + U.t(K.val(sc.title)) + "</h1>" +
      (witness ? '<div class="witness"><div class="lbl">' + U.tr("What happens, whatever you do") + "</div>" + U.blocks(witness) + "</div>" : "") +
      U.blocks(sc.body) + '<div class="choices" id="choices"></div><p class="hint" id="keyhint"></p></div>';
    const box = U.$("choices");
    const rows = K.choiceList(sc);
    const keys = [];
    rows.forEach(({ c, ok }, i) => {
      const fx = ok ? K.preview(c).map(([cls, t]) => '<span class="' + cls + '">' + U.esc(t) + "</span>").join("") : U.t(K.val(c.locked));
      const img = K.val(c.img);
      const b = U.button("choice" + (img ? " has-img" : ""), '<span class="k">' + (i + 1) + "</span>" + (img ? U.thumb(img) : "") + '<span class="t">' + U.t(K.val(c.t)) + '</span><span class="fx">' + fx + "</span>", null, "choice-" + c.id);
      b.disabled = !ok;
      const run = () => pick(sc, c, b);
      b.addEventListener("click", run);
      keys.push(ok ? run : null);
      box.appendChild(b);
    });
    U.$("keyhint").textContent = rows.length > 1 ? K.tr("Press 1 to {n} to choose.", { n: rows.length }) : "";
    U.renderLedger();
    U.scrollTop();
    // Set the scene first, then offer the choices.
    const text = leaf.querySelector(".text");
    const story = [];
    for (const el of text.children) {
      if (el.id === "choices" || el.id === "keyhint") continue;
      if (el.classList.contains("witness")) { el.dataset.hold = 250; story.push(el, ...el.children); }
      else story.push(el);
    }
    const plate = leaf.querySelector(".plate");
    if (plate) plate.dataset.hold = 700;
    const h1 = text.querySelector("h1");
    if (h1) h1.dataset.hold = 650;
    [...box.children].forEach((b) => { b.dataset.hold = 110; });
    // The scene-setting lines are written out by the quill.
    story.forEach((el) => { if (el.tagName === "P" || el.classList.contains("said")) el.classList.add("write"); });
    U.keys([]);
    U.stage([plate, ...story, ...box.children, U.$("keyhint")], () => { U.keys(keys); startLamp(sc, rows); });
  };

  // ---------- The lamp ----------
  // At a few moments the story will not wait: a lamp burns down beside the choices, and if it goes
  // out, the scene's `lamp.silent` choice is made for you. Scene data: lamp: { secs, silent, note }.
  // The lamp pauses while the tab is hidden or a window is open, keeps its oil through a language
  // switch, and is off in the tests and when "Timed moments" is turned off in the menu.
  U.timed = () => !/jsdom/i.test(navigator.userAgent || "") && K.prefs().timed !== false;
  // The painted clay lamp (art/diya.png) with its flame as a separate layer, so the flame alone shrinks.
  const DIYA = '<img class="body" src="art/diya.png" alt="">' +
    '<svg class="smoke" viewBox="0 0 330 264" aria-hidden="true"><path d="M285 140 C266 112 302 96 284 68 C266 40 298 26 288 2" fill="none" stroke="#c3a585" stroke-width="7" stroke-linecap="round"/></svg>' +
    '<img class="flame" src="art/diya_flame.png" alt="">';
  let lampRun = null;
  const lampMemo = { key: null, left: 0 };
  function stopLamp() { if (lampRun) { clearTimeout(lampRun.timer); lampRun = null; } }
  function startLamp(sc, rows) {
    stopLamp();
    const L = K.val(sc.lamp);
    if (!L || !U.timed()) return;
    const silent = rows.find((r) => r.ok && r.c.id === K.val(L.silent));
    const box = U.$("choices");
    if (!silent || !box) return;
    const total = L.secs * 1000;
    const key = sc.id + "#" + K.S.log.length; // the same moment, even after a redraw
    let left = lampMemo.key === key ? lampMemo.left : total;
    const el = U.el('<div class="lamp" role="timer"><span class="diya">' + DIYA + '</span><span class="oil"><i></i></span><span class="lamp-note">' + U.t(L.note) + "</span></div>");
    el.style.setProperty("--oil", (left / total).toFixed(3));
    box.parentNode.insertBefore(el, box);
    const run = (lampRun = { timer: 0 });
    let last = performance.now(), warned = left <= 5000;
    if (K.Sound) K.Sound.play("lamp");
    const tick = () => {
      if (lampRun !== run) return;
      if (!document.body.contains(el)) return stopLamp();
      const now = performance.now();
      if (!document.hidden && !document.querySelector(".scrim")) left -= now - last;
      last = now;
      lampMemo.key = key; lampMemo.left = left;
      el.style.setProperty("--oil", Math.max(0, left / total).toFixed(3));
      if (left <= 5000 && !warned) { warned = true; el.classList.add("low"); if (K.Sound) K.Sound.play("lamp"); }
      if (left <= 0) {
        stopLamp();
        el.classList.add("out");
        lampMemo.key = null;
        return pick(sc, silent.c, U.$("choice-" + silent.c.id), true);
      }
      run.timer = setTimeout(tick, 100);
    };
    if (left <= 5000) el.classList.add("low");
    run.timer = setTimeout(tick, 100);
  }

  // The chosen card lights up and the others fall away before the result comes in.
  function pick(sc, c, btn, lampOut) {
    if (btn !== null) {
      stopLamp();
      lampMemo.key = null;
      if (!lampOut) { const l = U.$("leaf").querySelector(".lamp"); if (l) l.remove(); }
      if (K.Sound) K.Sound.play("choose");
    }
    if (U.motion() && btn && !btn.classList.contains("chosen")) {
      U.keys([]);
      btn.classList.add("chosen");
      U.$("choices").querySelectorAll(".choice").forEach((o) => { if (o !== btn) o.classList.add("dismiss"); o.disabled = true; });
      setTimeout(() => pick(sc, c, null, lampOut), 520);
      return;
    }
    if (c.game && U.games[c.game]) return playGame(sc, c);
    const res = K.choose(sc, c);
    if (lampOut) res.lampOut = true;
    if (K.lastDelta.vowTaken && K.Sound) K.Sound.play("gong");
    if (res.combat) {
      U.startBattle(res.combat, (outcome) => {
        const o = K.combatOutcome(res.combat, outcome, res.next);
        if (!K.S.alive) return K.go("end_death");
        U.renderScene(sc);
        showAfter(sc, c, { text: o.text, after: res.after, check: null, pre: res.text, lampOut: res.lampOut }, o.next);
      });
      return;
    }
    if (res.text || res.check || res.after || res.lampOut) return showAfter(sc, c, res, res.next, btn);
    K.go(res.next);
  }

  // A choice that is a game: the game takes the place of the choices, and its outcome picks the branch.
  function playGame(sc, c) {
    const box = U.$("choices");
    const pimg = K.val(c.img);
    box.innerHTML = "";
    const picked = U.button("choice picked" + (pimg ? " has-img" : ""), '<span class="k">·</span>' + (pimg ? U.thumb(pimg) : "") + '<span class="t">' + U.t(K.val(c.t)) + '</span><span class="fx">' + U.tr("Your choice") + "</span>");
    picked.disabled = true;
    box.appendChild(picked);
    U.$("keyhint").textContent = "";
    U.keys([]);
    const game = U.games[c.game](box, (outcome, summary) => {
      const res = K.choose(sc, c, outcome);
      res.pre = summary;
      showAfter(sc, c, res, res.next);
    }, c);
    U.redraw = () => game.draw();
  }

  function showAfter(sc, c, res, next) {
    // A language switch now must repaint this state, never offer the choices again.
    U.redraw = () => { U.renderScene(sc); showAfter(sc, c, res, next); };
    const box = U.$("choices");
    const pimg = K.val(c.img);
    const picked = U.button("choice picked" + (pimg ? " has-img" : ""), '<span class="k">·</span>' + (pimg ? U.thumb(pimg) : "") + '<span class="t">' + U.t(K.val(c.t)) + '</span><span class="fx">' + U.tr("Your choice") + "</span>");
    picked.disabled = true;
    box.innerHTML = "";
    box.appendChild(picked);
    if (res.pre || res.text || res.check || res.lampOut) {
      const r = res.check;
      box.appendChild(U.el('<div class="result">' +
        (r ? '<span class="roll">' + U.tr("{label}: rolled {roll}, total {total} against {dc}", { label: r.ch ? K.checkLabel(r.ch) : r.label, roll: r.roll, total: r.total, dc: r.dc }) +
          ' · <b class="' + (r.pass ? "pass" : "fail") + '">' + U.tr(r.pass ? "Success" : "Failure") + "</b></span>" : "") +
        (res.lampOut ? '<p class="aside">' + U.tr("The lamp went out before you chose.") + "</p>" : "") +
        (res.pre ? "<p>" + U.t(res.pre) + "</p>" : "") + (res.text ? "<p>" + U.t(res.text) + "</p>" : "") + "</div>"));
    }
    if (res.after && K.S.alive) {
      box.appendChild(U.el('<div class="witness"><div class="lbl">' + U.tr("And then, as it always does") + "</div>" + U.blocks(res.after) + "</div>"));
    }
    const go = () => K.go(next);
    const cont = U.button("cta", U.tr("Continue"), go);
    box.appendChild(cont);
    U.$("keyhint").innerHTML = "";
    U.keys([]);
    U.renderLedger();
    const parts = [];
    for (const el of [...box.children].slice(1)) {
      if (el.classList.contains("witness") || el.classList.contains("result")) { el.dataset.hold = 250; parts.push(el, ...el.children); }
      else parts.push(el);
    }
    parts.forEach((el) => { if (el.tagName === "P" || el.classList.contains("said")) el.classList.add("write"); });
    U.stage(parts, () => { U.keys([go]); cont.focus({ preventScroll: true }); });
  }
})(window.K = window.K || {});
