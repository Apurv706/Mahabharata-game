/* Scene screen: witness layer, the player's choices, results, and the canon "after" beat. */
(function (K) {
  "use strict";
  const U = K.UI;

  function header(sc) {
    const S = K.S;
    U.where("<b>" + U.t(K.val(sc.actTitle) || K.ACT_TITLES[S.act] || "") + "</b><span>" + U.tr("Age {n}", { n: S.age }) + " · " + U.t(K.val(sc.place) || "") + "</span>");
  }
  function artFor(sc) {
    const a = K.val(sc.art);
    // The charioteer family's Champa years use Anga's painting.
    if (a === "origin") return K.S.origin === "suta" && !K.S.flags.includes("moved_capital") ? "home_anga" : "home_" + K.S.origin;
    return a;
  }
  function tagFor(sc) {
    // Fate: what the epic has already written, and the part of your life that is still unwritten.
    if (sc.canon && sc.war) return ["canon war", K.tr("Written · the war")];
    if (sc.canon) return ["canon", K.tr("Written")];
    if (sc.war) return ["war", K.tr("Unwritten · the war")];
    return ["yours", K.tr("Unwritten")];
  }

  // Other moments where everything is at stake: the music turns tense for these too.
  let lastPlace = null;
  const TENSE = new Set(["a1_poison", "a3_lac", "a5_karna_secret", "a5_side"]);
  // A conch for each day of the war, once per scene (not again when the screen is redrawn).
  let lastConch = null;
  let settledFor = null; // the scene whose painting has moved up above its page
  U.renderScene = function (sc) {
    stopLamp();
    if (U.stageFx) U.stageFx.stop();
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
    // A new place on the map: the journey comes first, then the scene. The reason is the scene's
    // own travel line, or what lies ahead.
    const moved = K.travel ? K.travel(sc) : null;
    // Arriving somewhere new: the place's own short piece (audio.js), once per arrival.
    if (!moved && S.at && S.at !== lastPlace && K.Sound && K.Sound.place) { lastPlace = S.at; K.Sound.place(S.origin === "suta" && S.at === "anga" ? "suta" : S.at); }
    if (moved && U.journeyPage) {
      if (K.headless) U.mapOf(S);
      else {
        const place = K.val(sc.place);
        const why = K.val(sc.travel) || (K.homePlace && place === K.homePlace(S) ? ["You go home to {place}.", { place }] : ["Ahead: {what}", { what: K.val(sc.title) || "" }]);
        return U.journeyPage(moved[0], moved[1], why, () => U.renderScene(sc));
      }
    }
    const [tag, tagText] = tagFor(sc);
    // Each new scene opens in beats: an act card when a new act begins, the scene's title card, the
    // painting alone for a moment, and only then the page. Once per scene, never on a redraw.
    U.beatStop();
    if (beatSeen !== sc.id && U.beatsOn()) {
      beatSeen = sc.id;
      const newAct = actSeen !== S.act;
      actSeen = S.act;
      return U.sceneBeats(sc, { act: newAct, full: newAct || bigScene(sc), tag, tagText }, () => U.renderScene(sc));
    }
    beatSeen = sc.id; actSeen = S.act;
    const witness = K.val(sc.witness);
    const leaf = U.$("leaf");
    leaf.className = "leaf split";
    leaf.innerHTML = U.plate({ art: artFor(sc), still: !!sc.clipAfter, grad: sc.plate, caption: K.val(sc.caption), tag, tagText, heading: K.val(sc.title) }) +
      '<div class="text"><div class="story" id="story" tabindex="0">' +
      (witness ? '<div class="witness"><div class="lbl">' + U.tr("As it is written") + "</div>" + U.blocks(witness) + "</div>" : "") +
      (S.loopThen && S.loopThen.scene === sc.id ? '<p class="aside loopnote">' + U.tr("You are back at the same choice. One way is closed to you now.") + "</p>" : "") +
      U.blocks(sc.body) + '</div><div class="actions"><div class="choices" id="choices"></div><p class="hint" id="keyhint"></p></div></div>';
    U.follow(U.$("story"));
    const box = U.$("choices");
    const rows = K.choiceList(sc);
    const keys = [];
    rows.forEach(({ c, ok, crossed }, i) => {
      // A way closed by two failed tests stays on the page, struck through, with the reason.
      const fx = crossed ? '<span class="down">' + U.t(crossed) + "</span>" : ok ? K.preview(c).map(([cls, t]) => '<span class="' + cls + '">' + U.esc(t) + "</span>").join("") : U.t(K.val(c.locked));
      const img = K.val(c.img);
      const b = U.button("choice" + (img ? " has-img" : "") + (crossed ? " crossed" : ""), '<span class="k">' + (i + 1) + "</span>" + (img ? U.thumb(img) : "") + '<span class="t">' + U.t(K.val(c.t)) + '</span><span class="fx">' + fx + "</span>", null, "choice-" + c.id);
      b.disabled = !ok;
      const run = () => pick(sc, c, b);
      b.addEventListener("click", run);
      keys.push(ok ? run : null);
      box.appendChild(b);
    });
    // Beside a second chance: "Practise first, then try again" (ui/practice.js).
    if (U.practiceOffer) U.practiceOffer(sc, rows, box);
    U.$("keyhint").textContent = rows.length > 1 ? K.tr("Press 1 to {n} to choose.", { n: rows.length }) : "";
    U.renderLedger();
    U.scrollTop();
    // Set the scene first, then offer the choices.
    const text = leaf.querySelector(".story");
    const story = [];
    for (const el of text.children) {
      if (el.classList.contains("witness")) { el.dataset.hold = 250; story.push(el, ...el.children); }
      else story.push(el);
    }
    const plate = leaf.querySelector(".plate, .pagehead");
    if (plate) plate.dataset.hold = 500;
    const h1 = text.querySelector("h1");
    if (h1) h1.dataset.hold = 650;
    [...box.children].forEach((b) => { b.dataset.hold = 110; });
    // The scene-setting lines are written out by the quill.
    story.forEach((el) => { if (el.tagName === "P" || el.classList.contains("said")) el.classList.add("write"); });
    U.keys([]);
    // The page comes up over the whole painting and grows as the story is written (lines and
    // choices not shown yet take no room). The painting holds still behind it; once everything is
    // there, it moves up into the space above the page, in one movement.
    if (settledFor !== sc.id) U.settled = false;
    U.fitBackdrop();
    const acts = box.parentElement;
    acts.dataset.hold = 0;
    U.stage([plate, ...story, acts, ...box.children, U.$("keyhint")], () => {
      U.keys(keys); startLamp(sc, rows);
      // Before a choice that could cost your life or your freedom, the figure trembles.
      if (K.inPeril && rows.some((r) => r.ok && r.c.peril && K.inPeril(r.c))) U.puppetReact("tremble");
      settledFor = sc.id; U.settled = true;
      setTimeout(() => U.fitBackdrop(), U.motion() ? 450 : 0);
    });
    U.livePlay();
    if (U.playMoments && K.momentQueue && K.momentQueue.length) U.playMoments();
    // The paintings this scene's choices lead to, loaded while the player reads.
    setTimeout(() => {
      const keys = [];
      for (const { c } of rows) {
        const nx = typeof c.next === "string" ? K.SCENES[c.next] : null;
        if (nx) { try { const a = artFor(nx); if (typeof a === "string") keys.push(a); } catch (e) { /* art that needs a later state */ } }
        if (c.trial && typeof c.trial.stage === "string") keys.push(c.trial.stage);
      }
      if (typeof sc.next === "string" && K.SCENES[sc.next]) { try { const a = artFor(K.SCENES[sc.next]); if (typeof a === "string") keys.push(a); } catch (e) { /* later state */ } }
      U.preloadArt(keys);
    }, 1500);
  };

  // ---------- Beats: act cards and scene titles ----------
  // Act card: "Act II", its name and one line, over the painting dimmed, with a gong. About three
  // seconds, or a tap. Title card: Unwritten or Written, the title, your age and place, and your
  // puppet; about a second and a half, or a tap. Then the painting alone, then the page.
  // Full title cards are for act openings, the epic's own scenes, tests, fights and other big
  // moments; ordinary scenes get the short version, the title over the painting. The menu's
  // "Scene titles: short" gives every scene the short version (act cards stay).
  let beatSeen = null, actSeen = null, beatRun = null;
  U.beatsOn = () => !K.headless && !/jsdom/i.test(navigator.userAgent || "") && K.prefs().beats !== false;
  function bigScene(sc) {
    if (sc.canon || sc.war || K.val(sc.lamp) || TENSE.has(sc.id) || sc.big) return true;
    return K.choiceList(sc).some(({ c }) => c.trial || c.game || c.combat);
  }
  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII"];
  U.beatStop = function () {
    if (!beatRun) return;
    clearTimeout(beatRun.timer);
    window.removeEventListener("keydown", beatRun.key, true);
    beatRun.el.remove();
    beatRun = null;
    document.body.classList.remove("beating");
    U.fitBackdrop();
  };
  U.sceneBeats = function (sc, o, done) {
    const S = K.S;
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    U.setBackdrop(o.art !== undefined ? o.art : artFor(sc) || null, { still: !!sc.clipAfter });
    const leaf = U.$("leaf");
    leaf.className = "leaf"; leaf.innerHTML = "";
    document.body.classList.add("beating");
    const el = U.el('<div class="beat" id="beat" role="presentation"></div>');
    document.body.appendChild(el);
    const title = o.title || K.val(sc.title) || K.val(sc.caption) || "";
    const where = U.tr("Age {n}", { n: S.age }) + " · " + U.t(K.val(sc.place) || "");
    // A living painting plays full-screen under the cards, then for a few seconds on its own.
    const live = U.liveReady();
    if (live) U.livePlay();
    const steps = [];
    if (o.act) {
      const full = U.t(K.ACT_TITLES[S.act] || "");
      const cut = full.indexOf(" · ");
      const num = cut > 0 ? full.slice(0, cut) : U.tr("Act {n}", { n: ROMAN[S.act] || S.act });
      const name = cut > 0 ? full.slice(cut + 3) : full;
      const line = K.ACT_LINES && K.ACT_LINES[S.act];
      steps.push({ cls: "dim", ms: 3000, html: '<div class="beat-act">' + (U.puppetFor ? '<span class="b-sutra">' + U.puppet(U.puppetFor("sutradhara"), { h: 150, pose: "fold" }) + "</span>" : "") + '<span class="b-num">' + U.esc(num) + "</span><b>" + U.esc(name) + "</b>" +
        '<i class="b-orn" aria-hidden="true"></i>' + (line ? "<p>" + U.t(line) + "</p>" : "") + "</div>",
        on: () => { if (K.Sound) K.Sound.play("gong"); } });
    }
    if (title && (o.full && K.prefs().titles !== "short")) {
      const fig = K.puppetSpec ? U.puppetBadge(K.puppetSpec(S), { fit: true }) : "";
      steps.push({ cls: "veil", ms: 1500, html: '<div class="beat-title">' + fig + '<span class="kind ' + o.tag + '">' + U.esc(o.tagText) + "</span><b>" + U.t(title) + "</b><small>" + where + "</small></div>" });
      steps.push({ cls: "clear", ms: live ? 4200 : 2000, html: "" });
    } else if (title) {
      steps.push({ cls: "low", ms: 1100, html: '<div class="beat-short"><span class="kind ' + o.tag + '">' + U.esc(o.tagText) + "</span><b>" + U.t(title) + "</b></div>" });
      steps.push({ cls: "clear", ms: live ? 3600 : 1300, html: "" });
    } else if (live) steps.push({ cls: "clear", ms: 4200, html: "" });
    const run = { el, timer: null, i: -1, key: null };
    beatRun = run;
    const finish = () => { if (beatRun !== run) return; U.beatStop(); done(); };
    const next = () => {
      if (beatRun !== run) return;
      clearTimeout(run.timer);
      const cur = el.firstElementChild;
      run.i++;
      const st = steps[run.i];
      if (!st) {
        if (cur) cur.classList.replace("in", "out");
        el.classList.add("gone");
        run.timer = setTimeout(finish, still ? 0 : 260);
        return;
      }
      const show = () => {
        if (beatRun !== run) return;
        el.className = "beat " + st.cls;
        el.innerHTML = st.html ? '<div class="beat-in">' + st.html + "</div>" : "";
        const inner = el.firstElementChild;
        if (inner) { if (still) inner.classList.add("in"); else requestAnimationFrame(() => requestAnimationFrame(() => inner.classList.add("in"))); }
        if (st.on) st.on();
        run.timer = setTimeout(next, st.ms);
      };
      if (cur && !still) { cur.classList.replace("in", "out"); run.timer = setTimeout(show, 240); }
      else show();
    };
    // A tap, a click or Space/Enter/Escape moves on to the next beat.
    el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); next(); });
    run.key = (e) => {
      if (document.querySelector(".scrim")) return;
      if ([" ", "Enter", "Escape", "ArrowRight"].includes(e.key)) { e.preventDefault(); e.stopPropagation(); next(); }
    };
    window.addEventListener("keydown", run.key, true);
    next();
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
      if (!document.hidden && !U.paused() && !document.querySelector(".scrim")) left -= now - last;
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
    if (res.peril === "death" && K.Sound) K.Sound.play("bell");
    if (res.combat) {
      U.startBattle(res.combat, (outcome) => {
        const o = K.combatOutcome(res.combat, outcome, res.next);
        if (!K.S.alive) return K.go("end_death");
        U.renderScene(sc);
        showAfter(sc, c, { text: o.text, after: res.after, check: null, pre: res.text, lampOut: res.lampOut, lostFight: outcome === "lose" ? res.combat : null }, o.next);
      });
      return;
    }
    if (res.text || res.check || res.after || res.lampOut) return showAfter(sc, c, res, res.next, btn);
    K.go(res.next);
  }

  const KIND = { aim: "archery", push: "strength", draw: "strength", steady: "strength", sneak: "stealth", retort: "wits", notice: "wits", hands: "wits", pasha: "wits",
    rhythm: "strength", race: "war", herd: "stealth", drill: "wits", rings: "wits", chaupar: "wits", baghchal: "wits", moksha: "wits", escape: "stealth", fuse: "stealth" };
  // A test written without a painted stage is still played on one: the usual ground for its kind.
  const STAGE_FOR = { aim: "stage_training_ground", push: "stage_training_ground", draw: "stage_bow_courtyard", steady: "stage_healers_hall", sneak: "stage_palace_corridor",
    retort: "stage_lotus_garden", notice: "stage_vidura_table", hands: "stage_dice_board_top", rhythm: "stage_smithy", race: "stage_racetrack", herd: "stage_khandava_top",
    drill: "stage_training_ground", rings: "stage_chakravyuha_top", chaupar: "stage_board_table", baghchal: "stage_board_table", moksha: "stage_board_table", escape: "stage_lac_fire_top", fuse: "stage_lac_cellar" };
  // A choice that is a game: the game takes the place of the choices, and its outcome picks the branch.
  function playGame(sc, c) {
    if (c.trial && !c.trial.stage && STAGE_FOR[c.game]) c.trial.stage = STAGE_FOR[c.game];
    const box = U.$("choices");
    const pimg = K.val(c.img);
    box.innerHTML = "";
    const picked = U.button("choice picked" + (pimg ? " has-img" : ""), '<span class="k">·</span>' + (pimg ? U.thumb(pimg) : "") + '<span class="t">' + U.t(K.val(c.t)) + '</span><span class="fx">' + U.tr("Your choice") + "</span>");
    picked.disabled = true;
    box.appendChild(picked);
    U.$("keyhint").textContent = "";
    U.keys([]);
    // While a test runs, the story steps aside and the test has the whole page.
    U.$("leaf").classList.add("testing");
    // The test is played inside its own painted stage, with its own weather.
    const stage = c.trial && K.val(c.trial.stage);
    if (stage) { U.setBackdrop(stage); U.stageFx.start(stage); }
    if (K.Sound && K.Sound.test) K.Sound.test(c.game);
    const game = U.games[c.game](box, (outcome, summary) => {
      if (K.Sound && K.Sound.test) K.Sound.test(null);
      // A won test gets its own short theme: archery, strength, stealth, wits or war.
      if (outcome === "win" && K.Sound && K.Sound.flourish) K.Sound.flourish((c.trial && c.trial.kind) || KIND[c.game] || "wits");
      else if (outcome !== "win" && K.Sound && !(c.trial && c.trial.practice)) K.Sound.play("lose");
      const res = K.choose(sc, c, outcome);
      if (res.peril === "death" && K.Sound) K.Sound.play("bell");
      res.pre = summary;
      showAfter(sc, c, res, res.next);
    }, c);
    U.redraw = () => game.draw();
  }

  function showAfter(sc, c, res, next) {
    // A language switch now must repaint this state, never offer the choices again.
    U.redraw = () => { U.renderScene(sc); showAfter(sc, c, res, next); };
    const leaf = U.$("leaf");
    leaf.classList.remove("testing");
    if (U.stageFx) U.stageFx.stop();
    U.setBackdrop(artFor(sc), { still: !!sc.clipAfter });
    // A clip that shows what happens after the choice (the fire) plays now.
    if (sc.clipAfter && res.after) U.addClip();
    // What you chose and what came of it are written into the story; Continue waits below.
    const story = U.$("story"), box = U.$("choices");
    const pimg = K.val(c.img);
    const picked = U.el('<div class="choice picked' + (pimg ? " has-img" : "") + '"><span class="k">·</span>' + (pimg ? U.thumb(pimg) : "") + '<span class="t">' + U.t(K.val(c.t)) + '</span><span class="fx">' + U.tr("Your choice") + "</span></div>");
    box.innerHTML = "";
    const added = [picked];
    story.appendChild(picked);
    if (res.pre || res.text || res.check || res.lampOut) {
      const r = res.check;
      added.push(story.appendChild(U.el('<div class="result">' +
        (r && r.word ? '<span class="roll">' + U.tr("Your word is enough. The court believes you without a test.") + "</span>" :
          r ? '<span class="roll">' + U.tr("{label}: rolled {roll}, total {total} against {dc}", { label: r.ch ? K.checkLabel(r.ch) : r.label, roll: r.roll, total: r.total, dc: r.dc }) +
          ' · <b class="' + (r.pass ? "pass" : "fail") + '">' + U.tr(r.pass ? "Success" : "Failure") + "</b></span>" : "") +
        (res.lampOut ? '<p class="aside">' + U.tr("The lamp went out before you chose.") + "</p>" : "") +
        (res.pre ? "<p>" + U.t(res.pre) + "</p>" : "") + (res.text ? "<p>" + U.t(res.text) + "</p>" : "") + "</div>")));
    }
    if (res.after && K.S.alive) {
      added.push(story.appendChild(U.el('<div class="witness"><div class="lbl">' + U.tr("And then, as it is written") + "</div>" + U.blocks(res.after) + "</div>")));
    }
    // A scene that tells why you are leaving: the journey on the map comes now, after its story.
    const go = () => {
      const moved = sc.travelAfter && K.S.alive && K.travel ? K.travel(sc, K.S, true) : null;
      if (moved && U.journeyPage && !K.headless) return U.journeyPage(moved[0], moved[1], K.val(sc.travel) || ["Ahead: {what}", { what: "" }], () => K.go(next));
      K.go(next);
    };
    const cont = U.button("cta", U.tr("Continue"), go);
    box.appendChild(cont);
    U.$("keyhint").innerHTML = "";
    U.keys([]);
    U.renderLedger();
    const parts = [];
    for (const el of added) {
      if (el.classList.contains("witness") || el.classList.contains("result")) { el.dataset.hold = 250; parts.push(el, ...el.children); }
      else parts.push(el);
    }
    parts.push(cont);
    // After a lost fight that was not deadly: the way to the practice ground (ui/practice.js).
    { const pb = res.lostFight && U.practiceAfterFight ? U.practiceAfterFight(res.lostFight) : null; if (pb) { box.appendChild(pb); parts.push(pb); } }
    parts.forEach((el) => { if (el.tagName === "P" || el.classList.contains("said")) el.classList.add("write"); });
    story.dataset.follow = "1";
    U.toEnd(story, true);
    const won = res.check ? res.check.pass : res.outcome ? res.outcome === "win" : null;
    const D = K.lastDelta || {};
    if (D.vowTaken) setTimeout(() => U.puppetReact("vow"), 400);
    // The figure answers what you did: shame for a wrong done, folded hands for respect given.
    else if ((D["duty.conscience"] || 0) <= -2) setTimeout(() => U.puppetReact("shame"), 400);
    else if (won === null && ((D["duty.teacher"] || 0) > 0 || Object.keys(D).some((k) => k.startsWith("bond.") && D[k] >= 2))) setTimeout(() => U.puppetReact("fold"), 400);
    else if (won !== null) setTimeout(() => U.puppetReact(won ? "win" : "lose"), 400);
    U.stage(parts, () => { U.toEnd(story, true); U.keys([go]); cont.focus({ preventScroll: true }); });
    // A milestone just reached (a friend for life, a divine weapon, a vow...) gets its moment now,
    // over the page; the result is waiting underneath.
    if (U.playMoments) U.playMoments();
  }
})(window.K = window.K || {});
