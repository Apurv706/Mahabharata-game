/* Action tests: moments where the player has to do the thing, not just choose it.
   A choice with `game: "aim" | "push" | "steady" | "retort"` and `trial: { ... }` opens a test in
   place of the choices: first the stakes (what you win, what you risk, how your stats help), then
   the action itself. The outcome ("win", "close" or "lose") picks the choice's branch, as with the
   dice games. Your stats set the difficulty; how you play decides the result.

   trial: { attr, skill,           stats that widen the window
            stakes: [win, lose],   shown before you begin
            rules,                 one line on what to do
            target, foe,           what you aim at / who you push against (names, translated)
            practice: true }       a first test that does not count (no record, no merits)

   Under the test harness (K.headless) a test is a single .cta that rolls against the same stats,
   so the automated playthroughs reach every branch. */
(function (K) {
  "use strict";
  const U = K.UI;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // How much the player's stats help: attribute + skill + what their past still does for them.
  K.trialPower = function (t, S = K.S) {
    const a = t.attr ? K.attr(t.attr) : 0, s = t.skill ? S.skills[t.skill] || 0 : 0;
    return a + s + K.merits({ attr: t.attr, skill: t.skill }, S).n;
  };
  const statNames = (t) => K.list([t.attr && K.tr(K.ATTRS[t.attr]), t.skill && K.tr(K.SKILLS[t.skill])].filter(Boolean));

  // The frame every test shares: stakes first, then the action, with one key for the action.
  // How each kind of test holds the figures, and how you move when you act.
  const STANCE = { aim: "stand", push: "brace", draw: "aim", steady: "hold", sneak: "sneak", retort: "speak", notice: "think", rhythm: "brace", race: "hold", herd: "hold", board: "think", drill: "stand", rings: "think" };
  const ACT = { aim: "loose", push: "push", draw: "loose", steady: "hold", sneak: "walk", retort: "speak", notice: "think", rhythm: "strike", race: "hold", herd: "walk", board: "think", drill: "speak", rings: "think" };
  const FOE = { push: "brace", rhythm: "block" };
  K.TRIAL_STANCE = STANCE;

  const IMMERSIVE = new Set(["aim", "board"]);
  function frame(box, done, c, kind, play) {
    const t = c.trial || {};
    // The stage: a strip of the painting with the figures on it, above the test itself.
    // Immersive tests: the stage painting is the playing field. The page, the top bar and the
    // story fall away; the figures stand big on the painting's ground, the score sits at the top
    // and the controls at the foot. (Being built test by test: IMMERSIVE lists those done.)
    const deep = !!(U.inScene && t.stage && IMMERSIVE.has(kind) && !K.headless);
    const wrap = U.el('<div class="trial trial-' + kind + (deep ? " immersive" : "") + '">' + U.castBand(t) +
      (deep ? '<header class="t-head"><span class="t-name">' + U.t(K.val(c.t)) + "</span></header>" : "") + '<div class="trial-body"></div></div>');
    box.appendChild(wrap);
    if (deep) document.body.classList.add("intest");
    const host = wrap.querySelector(".trial-body");
    U.castStance(wrap, STANCE[kind] || "stand", FOE[kind] || "stand");
    // The figures answer what happens: you move as you act, the other side staggers when you score.
    const cue = (ev) => {
      if (ev === "act") U.castPose(wrap, "me", ACT[kind] || "strike", 450);
      else if (ev === "good") { U.castPose(wrap, "foe", "hit", 520); U.castPose(wrap, "me", "cheer", 520); }
      else if (ev === "bad") { U.castPose(wrap, "me", "hit", 520); U.castPose(wrap, "foe", FOE[kind] === "brace" ? "push" : "cheer", 520); }
      else if (ev === "hold") U.castPose(wrap, "me", ACT[kind] || "hold", 0);
      else if (ev === "rest") U.castPose(wrap, "me", STANCE[kind] || "stand", 0);
    };
    const power = K.trialPower(t);
    let phase = "intro", stop = null, finished = false;
    function intro() {
      host.innerHTML =
        (t.practice ? '<p class="trial-practice">' + U.tr("A first test. This one does not count; it shows you how tests work.") + "</p>" : "") +
        '<p class="game-rules">' + U.t(K.val(t.rules)) + "</p>" +
        (t.stakes ? '<ul class="stakes"><li class="win"><b>' + U.tr("If you succeed") + "</b> " + U.t(K.val(t.stakes[0])) + '</li><li class="lose"><b>' + U.tr("If you fail") + "</b> " + U.t(K.val(t.stakes[1])) + "</li></ul>" : "") +
        (t.attr || t.skill ? '<p class="trial-stats">' + U.tr("Helped by your {what}: {n}. The higher, the easier.", { what: statNames(t), n: power }) + "</p>" : "") +
        '<div class="btnrow"></div>';
      const go = () => begin();
      host.querySelector(".btnrow").appendChild(U.button("cta", U.tr("Begin"), go));
      U.keys([go]);
    }
    function finish(outcome, summary) {
      if (finished) return;
      if (!host.isConnected) { finished = true; if (stop) stop(); return; } // the scene was left mid-test
      finished = true;
      if (stop) stop();
      wrap.classList.remove("playing");
      const page = wrap.closest(".leaf"); if (page) page.classList.remove("playing");
      // The outcome, large over the scene, while the figures react; then the story page returns.
      if (deep) {
        wrap.classList.add("done");
        const word = outcome === "win" ? "You win" : outcome === "close" ? "So close" : "You lose";
        wrap.appendChild(U.el('<div class="t-result ' + outcome + '"><b>' + U.tr(word) + "</b></div>"));
        if (K.Sound) K.Sound.play(outcome === "win" ? "gong" : "drum");
      }
      U.castStance(wrap, outcome === "win" ? "cheer" : "slump", outcome === "win" ? "slump" : "cheer");
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("keyup", onKeyUp, true);
      if (K.Sound && outcome !== "win") K.Sound.play("hit");
      if (K.headless) done(outcome, summary);
      else setTimeout(() => { document.body.classList.remove("intest"); done(outcome, summary); }, deep ? 1700 : 700);
    }
    // One action key: Space or Enter (the scene's own keys are paused while a test runs).
    let act = null, actUp = null;
    const onKey = (e) => { if ((e.key === " " || e.key === "Enter") && act) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) act(); } };
    const onKeyUp = (e) => { if ((e.key === " " || e.key === "Enter") && actUp) { e.preventDefault(); e.stopPropagation(); actUp(); } };
    function begin() {
      phase = "play";
      U.keys([]);
      // While it plays, the test fills the page and its play area takes the height that is left.
      wrap.classList.add("playing");
      const page = wrap.closest(".leaf"); if (page) page.classList.add("playing");
      if (K.headless) return auto();
      document.addEventListener("keydown", onKey, true);
      document.addEventListener("keyup", onKeyUp, true);
      stop = play({ host, power, t, finish, cue, onAct: (f, up) => { act = f; actUp = up || null; } });
    }
    // The harness rolls instead of playing: the better your stats, the likelier the win.
    function auto() {
      const p = clamp((t.auto != null ? t.auto : 0.2) + power * 0.055, 0.1, 0.72), r = K.rng();
      finish(r < p ? "win" : r < p + 0.15 && (kind === "aim" || kind === "steady") ? "close" : "lose", null);
    }
    intro();
    return { draw: () => { if (phase === "intro") intro(); } };
  }

  // A press button big enough for a thumb; it also answers the action key.
  function pressButton(label, down, up) {
    const b = U.button("cta trial-press", U.tr(label), null);
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); down(); });
    if (up) { b.addEventListener("pointerup", up); b.addEventListener("pointerleave", up); b.addEventListener("pointercancel", up); }
    else b.addEventListener("click", (e) => { if (e.detail === 0) down(); }); // keyboard click on the focused button
    return b;
  }
  // Runs every frame until stopped, or until its test is no longer on screen.
  // Game time stands still while the game is paused (the phone turned sideways, the tab hidden).
  const loop = (fn, el) => { let id, on = true; const t0 = U.clock(); const f = () => { if (!on) return; if (el && !el.isConnected) { on = false; return; } if (!U.paused()) fn((U.clock() - t0) / 1000); id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); return () => { on = false; cancelAnimationFrame(id); }; };

  // Shared with the other kinds of test (ui/play.js, ui/boards.js).
  U.trialFrame = frame; U.pressButton = pressButton; U.loop = loop;

  // ---------- Aim: a target swings; release when it crosses your line ----------
  // trial.shots (3), trial.need (2): hits needed to win; one fewer is "close".
  U.games.aim = function (box, done, c) {
    return frame(box, done, c, "aim", ({ host, power, t, finish, onAct, cue }) => {
      const shots = t.shots || 3, need = t.need || 2;
      const win = clamp(0.085 + power * 0.012 + (t.easy || 0), 0.08, 0.2) * (t.small ? 0.75 : 1); // half-width of the hit zone, as a share of the swing
      let shot = 0, hits = 0, speed = t.speed || 1.6, phase = 0, x = 0, busy = false;
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="range' + (t.dark ? " dark" : t.field ? " field" : "") + '"><div class="zone" style="width:' + win * 90 + '%"></div><div class="line"></div>' +
        '<div class="target"><i class="t-' + (t.icon || "lamp") + '"></i></div><div class="arrow"></div></div><p class="game-note" aria-live="polite"></p><div class="btnrow"></div>';
      const range = host.querySelector(".range"), tgt = host.querySelector(".target"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const marks = () => { score.textContent = K.tr("Shot {n} of {m}", { n: Math.min(shot + 1, shots), m: shots }) + " · " + K.tr("Hits: {h}", { h: hits }); };
      marks();
      const release = () => {
        if (busy) return;
        busy = true;
        const hit = Math.abs(x) <= win;
        if (hit) hits++;
        cue("act"); setTimeout(() => cue(hit ? "good" : "bad"), 260);
        range.classList.remove("hit", "miss"); void range.offsetWidth; range.classList.add(hit ? "hit" : "miss");
        if (K.Sound) K.Sound.play(hit ? "choose" : "quill");
        note.textContent = K.tr(hit ? "A hit!" : Math.abs(x) <= win * 1.8 ? "So close." : "A miss.");
        shot++;
        marks();
        const left = shots - shot;
        if (hits >= need || hits + left < need - 1 || left === 0) {
          const out = hits >= need ? "win" : need > 1 && hits === need - 1 ? "close" : "lose";
          return setTimeout(() => finish(out, ["You hit {h} of {n}.", { h: hits, n: shot }]), 500);
        }
        setTimeout(() => { busy = false; speed *= 1.15; note.textContent = ""; range.classList.remove("hit", "miss"); }, 700);
      };
      host.querySelector(".btnrow").appendChild(pressButton(t.verb || "Release", release));
      onAct(release);
      let last = 0;
      return loop((s) => {
        const dt = s - last; last = s;
        if (!busy) phase += dt * speed;
        // A pendulum with a little wind in it: never quite the same swing twice.
        x = Math.sin(phase * 2.2) * (0.86 + 0.1 * Math.sin(phase * 0.7));
        tgt.style.left = (50 + x * 45) + "%";
        // Blindfolded: the target shows itself only at the ends of its swing, where the bell rings.
        if (t.blind) tgt.style.opacity = String(clamp((Math.abs(x) - 0.62) / 0.22, 0, 1));
      }, host);
    });
  };

  // ---------- Push: a ring closes on your opponent; push as it meets him ----------
  // Three good pushes win; three bad ones lose.
  U.games.push = function (box, done, c) {
    return frame(box, done, c, "push", ({ host, power, t, finish, onAct, cue }) => {
      const tol = clamp(0.035 + power * 0.007, 0.03, 0.08); // how close to the mark counts, as a share of the ring's travel
      let good = 0, bad = 0, cycle = 0, period = t.period || 1.05, start = 0, now = 0, wait = false;
      const foe = K.tr(t.foe || "your opponent");
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="pushpit"><div class="balance"><i></i></div><div class="ringbox"><div class="mark"></div><div class="ring"></div><span class="who">' + U.esc(foe) + '</span></div></div><p class="game-note" aria-live="polite"></p><div class="btnrow"></div>';
      const ring = host.querySelector(".ring"), bal = host.querySelector(".balance i"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const show = () => { score.textContent = K.tr(t.tally || "Good pushes: {g} of 3 · Slips: {b} of 3", { g: good, b: bad }); bal.style.left = (50 + (good - bad) * 15) + "%"; };
      show();
      const MARK = 0.3; // the ring meets the mark at 30% of its starting size
      const push = () => {
        if (wait) return;
        const p = clamp((now - start) / period, 0, 1), size = 1 - p * (1 - MARK) / 0.85;
        const ok = Math.abs(size - MARK) <= tol;
        resolve(ok, ok ? t.good || "He gives ground!" : size > MARK ? t.soon || "Too soon. He braces." : t.late || "Too late. He shoves back.");
      };
      function resolve(ok, msg) {
        wait = true;
        ok ? good++ : bad++;
        cue("act"); setTimeout(() => cue(ok ? "good" : "bad"), 200);
        note.textContent = K.tr(msg);
        host.querySelector(".pushpit").classList.remove("good", "bad"); void host.offsetWidth; host.querySelector(".pushpit").classList.add(ok ? "good" : "bad");
        if (K.Sound) K.Sound.play(ok ? "hit" : "quill");
        show();
        if (good >= 3 || bad >= 3) return setTimeout(() => finish(good >= 3 ? "win" : "lose", ["Good pushes {g}, slips {b}.", { g: good, b: bad }]), 450);
        setTimeout(() => { wait = false; cycle++; period = Math.max(0.62, period * 0.9); start = now; note.textContent = ""; }, 650);
      }
      host.querySelector(".btnrow").appendChild(pressButton(t.verb || "Push", push));
      onAct(push);
      return loop((s) => {
        now = s;
        if (wait) return;
        const p = (now - start) / period;
        if (p > 1) return resolve(false, t.late || "Too late. He shoves back.");
        const size = Math.max(0.12, 1 - p * (1 - MARK) / 0.85);
        ring.style.transform = "translate(-50%, -50%) scale(" + size + ")";
      }, host);
    });
  };

  // ---------- Steady: keep your hand over the horse's mood, by holding and letting go ----------
  U.games.steady = function (box, done, c) {
    return frame(box, done, c, "steady", ({ host, power, t, finish, onAct, cue }) => {
      const band = clamp(0.11 + power * 0.015, 0.1, 0.2), LIMIT = t.secs || 15;
      let pos = 0.5, vel = 0, holding = false, mood = 0.5, moodV = 0, calm = 0, last = 0;
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="steady"><div class="mood" style="width:' + band * 100 + '%"></div><div class="hand"></div></div><div class="calm"><i></i></div><p class="game-note">' + U.tr(t.help || "Hold to move your hand right; let go and it drifts back. Keep it over the glow.") + '</p><div class="btnrow"></div>';
      const moodEl = host.querySelector(".mood"), hand = host.querySelector(".hand"), bar = host.querySelector(".calm i"), score = host.querySelector(".score");
      const down = () => { holding = true; cue("hold"); }, up = () => { holding = false; cue("rest"); };
      host.querySelector(".btnrow").appendChild(pressButton(t.verb || "Hold", down, up));
      onAct(down, up);
      return loop((s) => {
        const dt = Math.min(0.05, s - last); last = s;
        // The horse's mood wanders, faster when it is frightened.
        moodV += (K.rng() - 0.5) * dt * 4.2 - (mood - 0.5) * dt * 0.8;
        moodV = clamp(moodV, -0.45, 0.45);
        mood = clamp(mood + moodV * dt, band / 2, 1 - band / 2);
        if (mood <= band / 2 || mood >= 1 - band / 2) moodV *= -0.6;
        vel += (holding ? 1.6 : -1.3) * dt;
        vel *= 0.92;
        pos = clamp(pos + vel * dt * 2.2, 0, 1);
        if (pos === 0 || pos === 1) vel = 0;
        const inside = Math.abs(pos - mood) <= band / 2;
        calm = clamp(calm + (inside ? dt / 7 : -dt / 9), 0, 1);
        moodEl.style.left = (mood - band / 2) * 100 + "%";
        hand.style.left = pos * 100 + "%";
        moodEl.classList.toggle("on", inside);
        bar.style.width = calm * 100 + "%";
        score.textContent = K.tr(t.tally || "Calm: {c}% · {s} seconds left", { c: Math.round(calm * 100), s: Math.max(0, Math.ceil(LIMIT - s)) });
        if (calm >= 1) finish("win", t.wonLine || "The horse stands still, trembling, and lets you lay a hand on its neck.");
        else if (s >= LIMIT) finish(calm >= 0.7 ? "close" : "lose", calm >= 0.7 ? t.nearLine || "Nearly. The horse is quieter, but not yet still." : t.lostLine || "The horse pulls free and bolts across the yard.");
      }, host);
    });
  };

  // ---------- Retort: answer before the lamp burns down ----------
  // trial.rounds: [{ line, replies: [right, wrong, wrong] }]; two right answers of three win.
  U.games.retort = function (box, done, c) {
    return frame(box, done, c, "retort", ({ host, power, t, finish, cue }) => {
      const rounds = K.val(t.rounds) || [], base = clamp(3.5 + power * 0.4, 3.5, 6.5);
      let i = 0, right = 0, timer = null, t0 = 0, raf = null;
      function round() {
        const r = rounds[i];
        const order = r.replies.map((x, j) => j).sort(() => K.rng() - 0.5);
        host.innerHTML = '<p class="score">' + U.tr("Round {n} of {m} · Right: {r}", { n: i + 1, m: rounds.length, r: right }) + '</p><blockquote class="taunt">' + U.t(r.line) + '</blockquote><div class="timer"><i></i></div><div class="btnrow replies"></div>';
        const row = host.querySelector(".replies"), bar = host.querySelector(".timer i");
        const keys = [];
        order.forEach((j) => { const f = () => answer(j === 0); row.appendChild(U.button("cta secondary", U.t(r.replies[j]), f)); keys.push(f); });
        U.keys(keys);
        // Longer replies get a little longer to read.
        const secs = base + r.replies.reduce((n, x) => n + K.tr(x).length, 0) / 70;
        t0 = U.clock();
        const tick = () => { if (!host.isConnected) return; const left = 1 - (U.clock() - t0) / 1000 / secs; bar.style.width = Math.max(0, left) * 100 + "%"; if (left <= 0) return answer(false, true); raf = requestAnimationFrame(tick); };
        raf = requestAnimationFrame(tick);
      }
      function answer(ok, late) {
        cancelAnimationFrame(raf);
        U.keys([]);
        if (ok) right++;
        cue(ok ? "good" : "bad");
        host.querySelectorAll(".replies button").forEach((b) => { b.disabled = true; });
        host.insertAdjacentHTML("beforeend", '<p class="game-note">' + U.tr(late ? "Too slow. The moment passes." : ok ? "That lands." : "That was the wrong thing to say.") + "</p>");
        i++;
        if (right >= 2 || i - right >= 2 || i >= rounds.length) return setTimeout(() => finish(right >= 2 ? "win" : "lose", ["You found the right words {r} times of {n}.", { r: right, n: i }]), 600);
        timer = setTimeout(round, 900);
      }
      round();
      return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
    });
  };
  // ---------- Draw: hold to bend the bow, let go inside the band ----------
  // trial.shots (3), trial.need (2). Hold too long and the string slips.
  U.games.draw = function (box, done, c) {
    return frame(box, done, c, "draw", ({ host, power, t, finish, onAct, cue }) => {
      const shots = t.shots || 3, need = t.need || 2, width = clamp(0.05 + power * 0.008, 0.05, 0.11) * (t.small ? 0.75 : 1);
      let shot = 0, wins = 0, ten = 0, holding = false, busy = false, lo = 0.72, drift = 0, wob = 0, last = 0;
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="drawpit"><svg viewBox="0 0 300 220" class="bow" aria-hidden="true"><path class="limb" d=""/><path class="string" d=""/></svg>' +
        '<div class="meter"><div class="band"></div><div class="fill"></div></div></div><p class="game-note" aria-live="polite">' + U.tr(t.help || "Hold to draw. Let go while the bar is in the bright band.") + '</p><div class="btnrow"></div>';
      const limb = host.querySelector(".limb"), str = host.querySelector(".string"), band = host.querySelector(".band"), fill = host.querySelector(".fill"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const marks = () => { score.textContent = K.tr(t.tally || "Try {n} of {m} · Strung: {w}", { n: Math.min(shot + 1, shots), m: shots, w: wins }); };
      marks();
      const settle = (ok, msg) => {
        busy = true; holding = false;
        if (ok) wins++;
        cue("act"); setTimeout(() => cue(ok ? "good" : "bad"), 240);
        shot++;
        note.textContent = K.tr(msg);
        host.querySelector(".drawpit").classList.remove("good", "bad"); void host.offsetWidth; host.querySelector(".drawpit").classList.add(ok ? "good" : "bad");
        if (K.Sound) K.Sound.play(ok ? "choose" : "quill");
        marks();
        const left = shots - shot;
        if (wins >= need || wins + left < need || left === 0) return setTimeout(() => finish(wins >= need ? "win" : need > 1 && wins === need - 1 ? "close" : "lose", ["{w} of {n}.", { w: wins, n: shot }]), 600);
        setTimeout(() => { busy = false; ten = 0; lo = 0.62 + K.rng() * 0.22; note.textContent = ""; host.querySelector(".drawpit").classList.remove("good", "bad"); }, 800);
      };
      const down = () => { if (!busy) holding = true; };
      const up = () => {
        if (busy || !holding) return;
        holding = false;
        if (ten < 0.08) return;
        const v = ten + wob;
        settle(v >= lo && v <= lo + width, v < lo ? t.weak || "Not far enough. The bow springs back." : t.over || "Too far. The string slips.");
      };
      host.querySelector(".btnrow").appendChild(pressButton(t.verb || "Draw", down, up));
      onAct(down, up);
      return loop((s) => {
        const dt = Math.min(0.05, s - last); last = s;
        if (!busy) {
          ten = holding ? Math.min(1.05, ten + dt * (0.32 + ten * 0.55)) : Math.max(0, ten - dt * 1.6);
          drift += dt; wob = holding ? Math.sin(drift * 7) * 0.014 * (1 + ten) : 0;
          if (ten >= 1.05) settle(false, t.over || "Too far. The string slips.");
        }
        const v = clamp(ten + wob, 0, 1);
        band.style.left = lo * 100 + "%"; band.style.width = width * 100 + "%";
        fill.style.width = v * 100 + "%";
        fill.classList.toggle("in", v >= lo && v <= lo + width);
        // The limbs curve away from you; the string comes back toward you as you draw.
        const tip = 150 + v * 45, nock = tip - 8 - v * 115;
        limb.setAttribute("d", "M" + tip + ",20 Q275,110 " + tip + ",200");
        str.setAttribute("d", "M" + tip + ",20 L" + nock + ",110 L" + tip + ",200");
      }, host);
    });
  };

  // ---------- Sneak: move while the torchlight is elsewhere ----------
  // Hold to move. Moving in the light, or standing in it too long, gets you seen.
  U.games.sneak = function (box, done, c) {
    return frame(box, done, c, "sneak", ({ host, power, t, finish, onAct, cue }) => {
      const need = t.trips || 2, lives = t.spots || 2, light = clamp(0.26 - power * 0.012, 0.15, 0.26), LIMIT = t.secs || 45;
      let pos = 0, trips = 0, seen = 0, sus = 0, holding = false, freeze = 0, lp = 0.5, lv = 0.22, last = 0;
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="sneakway"><div class="torch"></div><div class="goal"></div><div class="me"></div></div><div class="sus"><i></i></div>' +
        '<p class="game-note" aria-live="polite">' + U.tr(t.help || "Hold to move. Stop before the light reaches you.") + '</p><div class="btnrow"></div>';
      const torch = host.querySelector(".torch"), me = host.querySelector(".me"), susBar = host.querySelector(".sus i"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const down = () => { holding = true; cue("hold"); }, up = () => { holding = false; cue("rest"); };
      host.querySelector(".btnrow").appendChild(pressButton(t.verb || "Move", down, up));
      onAct(down, up);
      return loop((s) => {
        const dt = Math.min(0.05, s - last); last = s;
        // The guard's torch wanders, turns back, sometimes lingers.
        if (K.rng() < dt * 0.5) lv = (K.rng() < 0.5 ? -1 : 1) * (0.12 + K.rng() * 0.3);
        lp += lv * dt; if (lp < 0.05 || lp > 0.95) { lv = -lv; lp = clamp(lp, 0.05, 0.95); }
        const lit = Math.abs(pos - lp) < light / 2;
        if (freeze > 0) freeze -= dt;
        else {
          if (holding) pos = Math.min(1, pos + dt * 0.11);
          sus = clamp(sus + (lit ? (holding ? dt * 2.4 : dt * 0.22) : -dt * 0.35), 0, 1);
          if (sus >= 1) { seen++; sus = 0; pos = Math.max(0, pos - 0.35); freeze = 1.1; note.textContent = K.tr(t.spotted || "A shout. You drop the basket and run back into the dark."); if (K.Sound) K.Sound.play("hit"); cue("bad"); }
          if (pos >= 1) { trips++; cue("good"); pos = 0; note.textContent = K.tr(t.made || "Out, and back for another load."); if (K.Sound) K.Sound.play("choose"); }
        }
        torch.style.left = (lp - light / 2) * 100 + "%"; torch.style.width = light * 100 + "%";
        me.style.left = pos * 100 + "%"; me.classList.toggle("lit", lit);
        susBar.style.width = sus * 100 + "%";
        score.textContent = K.tr(t.tally || "Loads: {d} of {n} · Seen: {s} of {m} · {t} seconds", { d: trips, n: need, s: seen, m: lives, t: Math.max(0, Math.ceil(LIMIT - s)) });
        if (trips >= need) finish("win", ["{d} loads carried, seen {s} times.", { d: trips, s: seen }]);
        else if (seen >= lives || s >= LIMIT) finish("lose", ["{d} loads carried, seen {s} times.", { d: trips, s: seen }]);
      }, host);
    });
  };

  // ---------- Notice: look at the table, then say what was on it ----------
  const THINGS = K.NOTICE_THINGS = ["A brass lamp", "A broken arrow", "A red thread", "A clay cup", "A peacock feather", "A seal ring", "A folded letter", "A coil of rope",
    "A copper coin", "A conch shell", "A long die", "A sandal", "A bowl of rice", "A small bell", "An iron key", "A string of beads"];
  U.games.notice = function (box, done, c) {
    return frame(box, done, c, "notice", ({ host, power, t, finish, cue }) => {
      const look = clamp(3 + power * 0.3, 3, 5.5), secs = clamp(3.5 + power * 0.3, 3.5, 6), count = t.count || 7;
      const pool = (t.things || THINGS).slice().sort(() => K.rng() - 0.5), seen = pool.slice(0, count), unseen = pool.slice(count);
      let i = 0, right = 0, raf = null, timer = null;
      host.innerHTML = '<p class="score">' + U.tr(t.lookLine || "Look. You have {n} seconds.", { n: Math.round(look) }) + '</p><ul class="table">' + seen.map((x) => "<li>" + U.tr(x) + "</li>").join("") + '</ul><div class="timer"><i></i></div>';
      const bar = host.querySelector(".timer i"), t0 = U.clock();
      const tickLook = () => { if (!host.isConnected) return; const left = 1 - (U.clock() - t0) / 1000 / look; bar.style.width = Math.max(0, left) * 100 + "%"; if (left <= 0) return ask(); raf = requestAnimationFrame(tickLook); };
      raf = requestAnimationFrame(tickLook);
      function ask() {
        const yes = seen[(i * 3 + 1) % seen.length], no = unseen.slice(i * 2, i * 2 + 2);
        const opts = [yes].concat(no).sort(() => K.rng() - 0.5);
        host.innerHTML = '<p class="score">' + U.tr("Question {n} of 3 · Right: {r}", { n: i + 1, r: right }) + '</p><p class="taunt">' + U.tr(t.ask || "Which of these was on the table?") + '</p><div class="timer"><i></i></div><div class="btnrow replies"></div>';
        const row = host.querySelector(".replies"), b2 = host.querySelector(".timer i"), keys = [];
        opts.forEach((x) => { const f = () => answer(x === yes); row.appendChild(U.button("cta secondary", U.tr(x), f)); keys.push(f); });
        U.keys(keys);
        const t1 = U.clock();
        const tick = () => { if (!host.isConnected) return; const left = 1 - (U.clock() - t1) / 1000 / secs; b2.style.width = Math.max(0, left) * 100 + "%"; if (left <= 0) return answer(false, true); raf = requestAnimationFrame(tick); };
        raf = requestAnimationFrame(tick);
      }
      function answer(ok, late) {
        cancelAnimationFrame(raf); U.keys([]);
        if (ok) right++;
        cue(ok ? "good" : "bad");
        host.querySelectorAll(".replies button").forEach((b) => { b.disabled = true; });
        host.insertAdjacentHTML("beforeend", '<p class="game-note">' + U.tr(late ? "Too slow." : ok ? "Yes. It was there." : "No. That was not there.") + "</p>");
        i++;
        if (right >= 2 || i - right >= 2 || i >= 3) return setTimeout(() => finish(right >= 2 ? "win" : "lose", ["You remembered {r} of {n}.", { r: right, n: i }]), 600);
        timer = setTimeout(ask, 900);
      }
      return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
    });
  };
})(window.K = window.K || {});
