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
  function frame(box, done, c, kind, play) {
    const t = c.trial || {};
    const host = U.el('<div class="trial trial-' + kind + '"></div>');
    box.appendChild(host);
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
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("keyup", onKeyUp, true);
      if (K.Sound) K.Sound.play(outcome === "win" ? "gong" : "hit");
      if (K.headless) done(outcome, summary); else setTimeout(() => done(outcome, summary), 700);
    }
    // One action key: Space or Enter (the scene's own keys are paused while a test runs).
    let act = null, actUp = null;
    const onKey = (e) => { if ((e.key === " " || e.key === "Enter") && act) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) act(); } };
    const onKeyUp = (e) => { if ((e.key === " " || e.key === "Enter") && actUp) { e.preventDefault(); e.stopPropagation(); actUp(); } };
    function begin() {
      phase = "play";
      U.keys([]);
      if (K.headless) return auto();
      document.addEventListener("keydown", onKey, true);
      document.addEventListener("keyup", onKeyUp, true);
      stop = play({ host, power, t, finish, onAct: (f, up) => { act = f; actUp = up || null; } });
    }
    // The harness rolls instead of playing: the better your stats, the likelier the win.
    function auto() {
      const p = clamp(0.3 + power * 0.08, 0.15, 0.9), r = K.rng();
      finish(r < p ? "win" : r < p + 0.15 && kind === "aim" ? "close" : "lose", null);
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
  const loop = (fn, el) => { let id, on = true; const t0 = performance.now(); const f = (now) => { if (!on) return; if (el && !el.isConnected) { on = false; return; } fn((now - t0) / 1000); id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); return () => { on = false; cancelAnimationFrame(id); }; };

  // ---------- Aim: a target swings; release when it crosses your line ----------
  // trial.shots (3), trial.need (2): hits needed to win; one fewer is "close".
  U.games.aim = function (box, done, c) {
    return frame(box, done, c, "aim", ({ host, power, t, finish, onAct }) => {
      const shots = t.shots || 3, need = t.need || 2;
      const win = clamp(0.07 + power * 0.022 + (t.easy || 0), 0.07, 0.3); // half-width of the hit zone, as a share of the swing
      let shot = 0, hits = 0, speed = t.speed || 1.5, phase = 0, x = 0, busy = false;
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="range' + (t.dark ? " dark" : "") + '"><div class="zone" style="width:' + win * 90 + '%"></div><div class="line"></div>' +
        '<div class="target"><i class="t-' + (t.icon || "lamp") + '"></i></div><div class="arrow"></div></div><p class="game-note" aria-live="polite"></p><div class="btnrow"></div>';
      const range = host.querySelector(".range"), tgt = host.querySelector(".target"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const marks = () => { score.textContent = K.tr("Shot {n} of {m}", { n: Math.min(shot + 1, shots), m: shots }) + " · " + K.tr("Hits: {h}", { h: hits }); };
      marks();
      const release = () => {
        if (busy) return;
        busy = true;
        const hit = Math.abs(x) <= win;
        if (hit) hits++;
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
        setTimeout(() => { busy = false; speed *= 1.18; note.textContent = ""; range.classList.remove("hit", "miss"); }, 700);
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
      }, host);
    });
  };

  // ---------- Push: a ring closes on your opponent; push as it meets him ----------
  // Three good pushes win; three bad ones lose.
  U.games.push = function (box, done, c) {
    return frame(box, done, c, "push", ({ host, power, t, finish, onAct }) => {
      const tol = clamp(0.055 + power * 0.012, 0.055, 0.14); // how close to the mark counts, as a share of the ring's travel
      let good = 0, bad = 0, cycle = 0, period = t.period || 1.25, start = 0, now = 0, wait = false;
      const foe = K.tr(t.foe || "your opponent");
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="pushpit"><div class="balance"><i></i></div><div class="ringbox"><div class="mark"></div><div class="ring"></div><span class="who">' + U.esc(foe) + '</span></div></div><p class="game-note" aria-live="polite"></p><div class="btnrow"></div>';
      const ring = host.querySelector(".ring"), bal = host.querySelector(".balance i"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const show = () => { score.textContent = K.tr("Good pushes: {g} of 3 · Slips: {b} of 3", { g: good, b: bad }); bal.style.left = (50 + (good - bad) * 15) + "%"; };
      show();
      const MARK = 0.3; // the ring meets the mark at 30% of its starting size
      const push = () => {
        if (wait) return;
        const p = clamp((now - start) / period, 0, 1), size = 1 - p * (1 - MARK) / 0.85;
        const ok = Math.abs(size - MARK) <= tol;
        resolve(ok, ok ? "He gives ground!" : size > MARK ? "Too soon. He braces." : "Too late. He shoves back.");
      };
      function resolve(ok, msg) {
        wait = true;
        ok ? good++ : bad++;
        note.textContent = K.tr(msg);
        host.querySelector(".pushpit").classList.remove("good", "bad"); void host.offsetWidth; host.querySelector(".pushpit").classList.add(ok ? "good" : "bad");
        if (K.Sound) K.Sound.play(ok ? "hit" : "quill");
        show();
        if (good >= 3 || bad >= 3) return setTimeout(() => finish(good >= 3 ? "win" : "lose", ["Good pushes {g}, slips {b}.", { g: good, b: bad }]), 450);
        setTimeout(() => { wait = false; cycle++; period = Math.max(0.75, period * 0.92); start = now; note.textContent = ""; }, 650);
      }
      host.querySelector(".btnrow").appendChild(pressButton(t.verb || "Push", push));
      onAct(push);
      return loop((s) => {
        now = s;
        if (wait) return;
        const p = (now - start) / period;
        if (p > 1) return resolve(false, "Too late. He shoves back.");
        const size = Math.max(0.12, 1 - p * (1 - MARK) / 0.85);
        ring.style.transform = "translate(-50%, -50%) scale(" + size + ")";
      }, host);
    });
  };

  // ---------- Steady: keep your hand over the horse's mood, by holding and letting go ----------
  U.games.steady = function (box, done, c) {
    return frame(box, done, c, "steady", ({ host, power, t, finish, onAct }) => {
      const band = clamp(0.14 + power * 0.025, 0.14, 0.3), LIMIT = t.secs || 14;
      let pos = 0.5, vel = 0, holding = false, mood = 0.5, moodV = 0, calm = 0, last = 0;
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="steady"><div class="mood" style="width:' + band * 100 + '%"></div><div class="hand"></div></div><div class="calm"><i></i></div><p class="game-note">' + U.tr("Hold to move your hand right; let go and it drifts back. Keep it over the glow.") + '</p><div class="btnrow"></div>';
      const moodEl = host.querySelector(".mood"), hand = host.querySelector(".hand"), bar = host.querySelector(".calm i"), score = host.querySelector(".score");
      const down = () => { holding = true; }, up = () => { holding = false; };
      host.querySelector(".btnrow").appendChild(pressButton(t.verb || "Hold", down, up));
      onAct(down, up);
      return loop((s) => {
        const dt = Math.min(0.05, s - last); last = s;
        // The horse's mood wanders, faster when it is frightened.
        moodV += (K.rng() - 0.5) * dt * 3.2 - (mood - 0.5) * dt * 0.8;
        moodV = clamp(moodV, -0.45, 0.45);
        mood = clamp(mood + moodV * dt, band / 2, 1 - band / 2);
        if (mood <= band / 2 || mood >= 1 - band / 2) moodV *= -0.6;
        vel += (holding ? 1.6 : -1.3) * dt;
        vel *= 0.92;
        pos = clamp(pos + vel * dt * 2.2, 0, 1);
        if (pos === 0 || pos === 1) vel = 0;
        const inside = Math.abs(pos - mood) <= band / 2;
        calm = clamp(calm + (inside ? dt / 6 : -dt / 14), 0, 1);
        moodEl.style.left = (mood - band / 2) * 100 + "%";
        hand.style.left = pos * 100 + "%";
        moodEl.classList.toggle("on", inside);
        bar.style.width = calm * 100 + "%";
        score.textContent = K.tr("Calm: {c}% · {s} seconds left", { c: Math.round(calm * 100), s: Math.max(0, Math.ceil(LIMIT - s)) });
        if (calm >= 1) finish("win", "The horse stands still, trembling, and lets you lay a hand on its neck.");
        else if (s >= LIMIT) finish(calm >= 0.7 ? "close" : "lose", calm >= 0.7 ? "Nearly. The horse is quieter, but not yet still." : "The horse pulls free and bolts across the yard.");
      }, host);
    });
  };

  // ---------- Retort: answer before the lamp burns down ----------
  // trial.rounds: [{ line, replies: [right, wrong, wrong] }]; two right answers of three win.
  U.games.retort = function (box, done, c) {
    return frame(box, done, c, "retort", ({ host, power, t, finish }) => {
      const rounds = K.val(t.rounds) || [], secs = clamp(4 + power * 0.7, 4, 9);
      let i = 0, right = 0, timer = null, t0 = 0, raf = null;
      function round() {
        const r = rounds[i];
        const order = r.replies.map((x, j) => j).sort(() => K.rng() - 0.5);
        host.innerHTML = '<p class="score">' + U.tr("Round {n} of {m} · Right: {r}", { n: i + 1, m: rounds.length, r: right }) + '</p><blockquote class="taunt">' + U.t(r.line) + '</blockquote><div class="timer"><i></i></div><div class="btnrow replies"></div>';
        const row = host.querySelector(".replies"), bar = host.querySelector(".timer i");
        const keys = [];
        order.forEach((j) => { const f = () => answer(j === 0); row.appendChild(U.button("cta secondary", U.t(r.replies[j]), f)); keys.push(f); });
        U.keys(keys);
        t0 = performance.now();
        const tick = () => { if (!host.isConnected) return; const left = 1 - (performance.now() - t0) / 1000 / secs; bar.style.width = Math.max(0, left) * 100 + "%"; if (left <= 0) return answer(false, true); raf = requestAnimationFrame(tick); };
        raf = requestAnimationFrame(tick);
      }
      function answer(ok, late) {
        cancelAnimationFrame(raf);
        U.keys([]);
        if (ok) right++;
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
})(window.K = window.K || {});
