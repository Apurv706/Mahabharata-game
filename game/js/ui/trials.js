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
  const STANCE = { aim: "aim", push: "brace", draw: "aim", steady: "hold", sneak: "sneak", retort: "speak", notice: "think", rhythm: "brace", race: "hold", herd: "hold", board: "think", drill: "stand", rings: "think", formation: "think" };
  const ACT = { aim: "loose", push: "push", draw: "loose", steady: "hold", sneak: "walk", retort: "speak", notice: "think", rhythm: "strike", race: "hold", herd: "walk", board: "think", drill: "speak", rings: "think" };
  const FOE = { push: "brace", rhythm: "block" };
  K.TRIAL_STANCE = STANCE;

  const IMMERSIVE = new Set(["aim", "board", "push", "steady", "retort", "draw", "sneak", "notice", "drill", "rhythm", "race", "herd", "rings", "formation"]);
  // What hangs and swings in the archery test, drawn centred on its middle (about 64 units across).
  const RUNNERS = new Set(["deer", "tiger", "elephant"]);
  function AIM_ART(icon) {
    const loop = '<path d="M0 -40 L0 -30" stroke="#5a3a22" stroke-width="2"/>';
    if (icon === "lamp") return loop + '<path d="M-18 -6 Q0 18 18 -6 Z" fill="#b5793a" stroke="#4a2a12" stroke-width="2"/><path d="M0 -8 Q-7 -20 0 -32 Q7 -20 0 -8Z" fill="#ffd27a"/><circle cx="0" cy="-16" r="16" fill="#ffb648" opacity=".25"/>';
    if (icon === "fruit") return loop + '<path d="M0 -30 Q22 -22 18 4 Q12 26 -4 26 Q-20 22 -18 0 Q-16 -24 0 -30Z" fill="#f0a030" stroke="#8a4a14" stroke-width="2"/><path d="M0 -30 Q8 -40 16 -36" stroke="#3f6b3a" stroke-width="3" fill="none"/>';
    if (icon === "bell") return loop + '<path d="M-20 18 Q-18 -24 0 -28 Q18 -24 20 18 Z" fill="#b8862e" stroke="#5a3a12" stroke-width="2"/><circle cx="0" cy="22" r="5" fill="#5a3a12"/>';
    if (icon === "deer") return '<g stroke="#2b1609" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><path d="M-20 2 L-24 24 M-12 2 L-10 24 M10 2 L8 24 M17 0 L21 24" fill="none" stroke-width="3.2"/><path d="M-28 -6 Q-30 -18 -14 -19 L10 -19 Q17 -19 21 -25 L27 -37 Q31 -42 35 -37 L34 -30 Q38 -24 35 -18 Q31 -9 22 -6 L20 4 Q0 6 -20 4 Z" fill="#c9843e" fill-opacity=".92"/><path d="M-28 -9 l-7 -4" fill="none"/><path d="M29 -39 l-3 -10 l-6 -3 M27 -47 l4 -5 M33 -39 l5 -9 l6 -2" fill="none" stroke-width="2"/><path d="M-22 -11 Q0 -15 18 -11" fill="none" stroke="#a3302a" stroke-width="2.6"/><path d="M-22 -3 Q0 -6 16 -3" fill="none" stroke="#3f6b3a" stroke-width="2"/><g fill="#f4e4c1" stroke="none"><circle cx="-16" cy="-7" r="1.7"/><circle cx="-8" cy="-7.5" r="1.7"/><circle cx="0" cy="-8" r="1.7"/><circle cx="8" cy="-7.5" r="1.7"/></g><circle cx="31" cy="-31" r="1.7" fill="#2b1609" stroke="none"/><circle cx="-18" cy="1" r="2.4" fill="#d9a53a" stroke="#2b1609" stroke-width="1"/><circle cx="14" cy="0" r="2.4" fill="#d9a53a" stroke="#2b1609" stroke-width="1"/><circle cx="22" cy="-14" r="2.4" fill="#d9a53a" stroke="#2b1609" stroke-width="1"/></g>';
    if (icon === "tiger") return '<g stroke="#2b1609" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><path d="M-30 -8 Q-44 -14 -46 -28 Q-40 -18 -30 -14" fill="none" stroke="#e08a2a" stroke-width="5"/><path d="M-30 -8 Q-44 -14 -46 -28" fill="none" stroke-width="1.2"/><path d="M-22 4 L-26 24 L-19 24 L-16 6 M16 4 L14 24 L21 24 L24 4" fill="#e08a2a" fill-opacity=".92"/><path d="M-32 -8 Q-30 -21 -12 -21 L14 -21 Q26 -21 29 -13 L30 4 Q28 8 22 7 L-24 7 Q-33 6 -32 -8Z" fill="#e08a2a" fill-opacity=".92"/><path d="M24 -16 Q26 -30 36 -28 Q46 -26 46 -16 Q46 -6 36 -5 Q28 -5 24 -10Z" fill="#e08a2a" fill-opacity=".95"/><path d="M28 -27 l2 -7 l5 4 M38 -28 l4 -6 l3 6" fill="#e08a2a"/><g fill="none" stroke="#7a2a10" stroke-width="2.6"><path d="M-20 -21 q3 9 -1 15 M-10 -21 q3 9 -1 15 M0 -21 q3 9 -1 15 M10 -21 q3 9 -1 15"/></g><path d="M-26 1 H22" fill="none" stroke="#3f6b3a" stroke-width="2"/><g fill="#f4e4c1" stroke="none"><circle cx="-14" cy="3" r="1.5"/><circle cx="-4" cy="3" r="1.5"/><circle cx="6" cy="3" r="1.5"/></g><circle cx="40" cy="-18" r="1.8" fill="#2b1609" stroke="none"/><path d="M42 -10 h4" fill="none"/><circle cx="-20" cy="2" r="2.4" fill="#d9a53a" stroke="#2b1609" stroke-width="1"/><circle cx="19" cy="2" r="2.4" fill="#d9a53a" stroke="#2b1609" stroke-width="1"/><circle cx="26" cy="-12" r="2.4" fill="#d9a53a" stroke="#2b1609" stroke-width="1"/></g>';
    if (icon === "elephant") return '<g stroke="#2b1609" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><path d="M-24 8 L-24 26 L-15 26 L-15 10 M12 10 L12 26 L21 26 L21 8" fill="#8d8a86" fill-opacity=".95"/><path d="M-34 6 Q-36 -24 -6 -27 Q20 -28 26 -12 Q34 -6 34 8 Q34 24 27 27 Q24 18 22 10 Q14 12 -24 12 Q-33 12 -34 6Z" fill="#8d8a86" fill-opacity=".95"/><path d="M8 -20 Q4 -8 10 2 Q18 6 22 -4" fill="none" stroke-width="1.8"/><path d="M-20 -24 Q-6 -28 6 -24 L8 2 Q-6 6 -20 2 Z" fill="#a3302a" fill-opacity=".95"/><path d="M-20 2 l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4" fill="none" stroke="#d9a53a" stroke-width="2"/><g fill="#d9a53a" stroke="none"><circle cx="-14" cy="-14" r="1.8"/><circle cx="-6" cy="-15" r="1.8"/><circle cx="2" cy="-14" r="1.8"/><circle cx="-10" cy="-7" r="1.8"/><circle cx="-2" cy="-7" r="1.8"/></g><path d="M30 0 Q38 6 36 16" fill="none" stroke="#f4e4c1" stroke-width="3"/><circle cx="22" cy="-12" r="1.8" fill="#2b1609" stroke="none"/><circle cx="-19" cy="9" r="2.4" fill="#d9a53a" stroke="#2b1609" stroke-width="1"/><circle cx="16" cy="9" r="2.4" fill="#d9a53a" stroke="#2b1609" stroke-width="1"/></g>';
    if (icon === "bird") return '<g stroke="#2b1609" stroke-width="2" stroke-linejoin="round"><path d="M-28 0 Q-12 -20 0 -5 Q12 -20 28 0 Q12 -9 0 7 Q-12 -9 -28 0Z" fill="#3f6b3a" fill-opacity=".92"/><path d="M-20 -5 Q-10 -11 -3 -4 M20 -5 Q10 -11 3 -4" fill="none" stroke="#a3302a" stroke-width="2.2"/><circle cx="0" cy="0" r="3" fill="#d9a53a" stroke-width="1"/></g>';
    if (icon === "leaf") return loop + '<path d="M0 -30 Q20 -6 0 28 Q-20 -6 0 -30Z" fill="#6f8f3a" stroke="#3a4f1c" stroke-width="2"/><path d="M0 -26 V24" stroke="#3a4f1c" stroke-width="1.5"/>';
    // A plain straw target, rope-bound, as on the training ground.
    return loop + '<circle r="30" fill="#d9b26a" stroke="#6b4a24" stroke-width="3"/><circle r="22" fill="none" stroke="#a87a3a" stroke-width="3"/><circle r="13" fill="none" stroke="#a87a3a" stroke-width="3"/><circle r="5" fill="#b2432a"/><path d="M-30 0 H30 M0 -30 V30" stroke="#8a6230" stroke-width="1.2" opacity=".55"/>';
  }
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
      // On the painting (immersive): the target hangs by a rope from the branch above and swings;
      // a faint dotted line runs up from your bow to where the arrow will fly; the arrow flies up
      // the painting and sticks, or whips past.
      const painted = !!host.closest(".trial.immersive");
      let P = null;
      if (painted) {
        range.classList.add("painted");
        range.insertAdjacentHTML("beforeend", '<svg class="aimsvg" aria-hidden="true"><line class="rope"/><line class="path"/><circle class="aimpt" r="5"/><g class="tgt"><g class="tgt-art">' + AIM_ART(t.icon) + '</g><g class="stuck"></g></g><g class="flying"><line class="shaft"/><path class="fletch"/></g></svg>');
        const q = (sel) => range.querySelector(sel);
        P = { rope: q(".rope"), path: q(".path"), pt: q(".aimpt"), tgt: q(".tgt"), stuck: q(".stuck"), fly: q(".flying"), shaft: q(".shaft"), fletch: q(".fletch"), W: 0, H: 0, L: 0, tx: 0, ty: 0, th: 0.6, cx: 0, sw: 0 };
      }
      // You stand in the lower left, facing right; the target hangs up and to the right of you. The
      // aim runs from your bow hand to the target, and your bow arm turns about the shoulder to follow.
      const meSvg = painted ? host.closest(".trial").querySelector(".cast .actor.me svg") : null;
      const ARM = 52.5; // shoulder to bow hand, in the puppet's own units
      const shoulder = () => {
        if (!meSvg || !meSvg.isConnected) return null;
        const r = meSvg.getBoundingClientRect(), rr = range.getBoundingClientRect(), vb = meSvg.viewBox.baseVal;
        if (!r.height || !vb || !vb.height) return null;
        const k = r.height / vb.height;
        return { x: r.left - rr.left + (58 - vb.x) * k, y: r.top - rr.top + (73 - vb.y) * k, k };
      };
      const handAt = (sh, th) => ({ x: sh.x + ARM * sh.k * Math.cos(th), y: sh.y - ARM * sh.k * Math.sin(th) });
      const shoot = (hit, aimOff) => {
        if (!P) return;
        const sh = shoulder(), h0 = sh ? handAt(sh, P.th) : { x: P.cx, y: P.H };
        const xAim = P.cx + (aimOff || 0) * P.sw;
        // A miss flies on past the target's height and off the painting.
        let xB = P.tx, yB = P.ty;
        if (!hit) { const dx = xAim - h0.x, dy = P.ty - h0.y, m = (h0.y + 60) / Math.max(1, -dy); xB = h0.x + dx * m; yB = -60; }
        const dist = Math.hypot(xB - h0.x, yB - h0.y), lift = dist * 0.12;
        const at = (f) => ({ x: h0.x + (xB - h0.x) * f, y: h0.y + (yB - h0.y) * f - lift * 4 * f * (1 - f) });
        const t0 = performance.now(), dur = U.motion() ? 300 : 1;
        P.fly.style.opacity = "1";
        let dir = [xB - h0.x, yB - h0.y];
        const step = () => {
          const f = Math.min(1, (performance.now() - t0) / dur), p = at(f), q = at(Math.max(0, f - 0.04));
          if (f > 0) { const dl = Math.hypot(p.x - q.x, p.y - q.y) || 1; dir = [(p.x - q.x) / dl, (p.y - q.y) / dl]; }
          // The arrow shrinks as it flies away from you.
          const len = 46 - 24 * f, tx = p.x - dir[0] * len, ty = p.y - dir[1] * len;
          P.shaft.setAttribute("x1", p.x); P.shaft.setAttribute("y1", p.y); P.shaft.setAttribute("x2", tx); P.shaft.setAttribute("y2", ty);
          const nx = -dir[1] * 5, ny = dir[0] * 5;
          P.fletch.setAttribute("d", "M" + (tx + nx) + " " + (ty + ny) + "L" + (tx + dir[0] * 8) + " " + (ty + dir[1] * 8) + "L" + (tx - nx) + " " + (ty - ny) + "z");
          if (f < 1) requestAnimationFrame(step);
          else {
            P.fly.style.opacity = "0";
            // Stuck in the target at the angle it came in, allowing for the target's own swing.
            const rot = Math.atan2(dir[0], -dir[1]) * 180 / Math.PI + (P.ang || 0);
            if (hit) P.stuck.innerHTML = '<g transform="rotate(' + rot.toFixed(1) + ')"><line x1="0" y1="2" x2="0" y2="30" stroke="#efe0bc" stroke-width="3"/><path d="M-5 30l5 -8l5 8z" fill="#b2432a"/></g>';
          }
        };
        requestAnimationFrame(step);
      };
      // Chance in every shot: the aim wavers (an unsteady hand), and each arrow drifts a little in
      // flight (wind, a slipped release). A better archer wavers and drifts less.
      const sway = clamp(0.05 - power * 0.004, 0.02, 0.05), drift = clamp(0.06 - power * 0.004, 0.03, 0.06);
      let wob = 0;
      const gauss = () => { let u = 0; for (let i = 0; i < 3; i++) u += K.rng(); return (u - 1.5) / 0.5; };
      const release = () => {
        if (busy) return;
        busy = true;
        const err = gauss() * drift;
        const off = x - wob - err;
        const hit = Math.abs(off) <= win;
        if (hit) hits++;
        shoot(hit, wob + err);
        if (!hit && Math.abs(x - wob) <= win) note.dataset.gust = "1"; else delete note.dataset.gust;
        cue("act"); setTimeout(() => cue(hit ? "good" : "bad"), 260);
        range.classList.remove("hit", "miss"); void range.offsetWidth; range.classList.add(hit ? "hit" : "miss");
        if (K.Sound) K.Sound.play(hit ? "choose" : "quill");
        note.textContent = K.tr(hit ? "A hit!" : note.dataset.gust ? "The wind took it." : Math.abs(off) <= win * 1.8 ? "So close." : "A miss.");
        shot++;
        marks();
        const left = shots - shot;
        if (hits >= need || hits + left < need - 1 || left === 0) {
          const out = hits >= need ? "win" : need > 1 && hits === need - 1 ? "close" : "lose";
          return setTimeout(() => finish(out, ["You hit {h} of {n}.", { h: hits, n: shot }]), 500);
        }
        setTimeout(() => { busy = false; speed *= 1.15; note.textContent = ""; range.classList.remove("hit", "miss"); if (P) P.stuck.innerHTML = ""; }, 700);
      };
      host.querySelector(".btnrow").appendChild(pressButton(t.verb || "Release", release));
      onAct(release);
      let last = 0;
      return loop((s) => {
        const dt = s - last; last = s;
        if (!busy) phase += dt * speed;
        // A pendulum with a little wind in it: never quite the same swing twice.
        x = Math.sin(phase * 2.2) * (0.86 + 0.1 * Math.sin(phase * 0.7));
        if (!busy && P) wob = sway * (Math.sin(s * 3.1) * 0.7 + Math.sin(s * 5.7 + 1) * 0.3);
        tgt.style.left = (50 + x * 45) + "%";
        // Blindfolded: the target shows itself only at the ends of its swing, where the bell rings.
        if (t.blind) tgt.style.opacity = String(clamp((Math.abs(x) - 0.62) / 0.22, 0, 1));
        if (P) {
          const W = range.clientWidth, H = range.clientHeight;
          P.W = W; P.H = H; P.L = Math.max(80, H * 0.6);
          // The rope hangs from a branch to the right of you; the target swings about it.
          const narrow = W < 600, cx = W * (narrow ? 0.72 : 0.64), sw = Math.min(W * (narrow ? 0.22 : 0.3), P.L * 0.85), tx = cx + x * sw, dx = tx - cx;
          P.cx = cx; P.sw = sw;
          // Animals run across the ground; everything else swings on its rope.
          const runs = RUNNERS.has(t.icon);
          const ty = runs ? P.L : Math.sqrt(Math.max(P.L * P.L - dx * dx, P.L * P.L * 0.25)), ang = runs ? 0 : Math.atan2(dx, ty) * 180 / Math.PI;
          P.tx = tx; P.ty = ty; P.ang = runs ? 0 : ang;
          if (runs) { P.rope.style.display = "none"; P.dir = Math.cos(phase * 2.2) >= 0 ? 1 : -1; }
          else { P.rope.setAttribute("x1", cx); P.rope.setAttribute("y1", -10); P.rope.setAttribute("x2", tx); P.rope.setAttribute("y2", ty - 30); }
          P.tgt.setAttribute("transform", "translate(" + tx.toFixed(1) + " " + ty.toFixed(1) + ") rotate(" + (-ang).toFixed(1) + ")" + (runs ? " scale(" + (P.dir * 1.5) + " 1.5)" : ""));
          const ax = cx + wob * sw, ay = P.L;
          const sh = shoulder();
          if (sh) {
            // The bow arm points along the aim: up and to the right, between a low and a steep shot.
            const th = clamp(Math.atan2(sh.y - ay, ax - sh.x), 0.12, 1.35);
            P.th = th;
            meSvg.style.setProperty("--aim", (th * 180 / Math.PI).toFixed(1) + "deg");
            const hd = handAt(sh, th);
            P.path.setAttribute("x1", hd.x); P.path.setAttribute("y1", hd.y);
          } else { P.path.setAttribute("x1", cx); P.path.setAttribute("y1", H); }
          P.path.setAttribute("x2", ax); P.path.setAttribute("y2", ay + 8);
          P.pt.setAttribute("cx", ax); P.pt.setAttribute("cy", ay);
          if (t.blind) P.tgt.style.opacity = tgt.style.opacity;
        }
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
      // On the painting, the pushes move the two wrestlers across the ground.
      const wrapEl = host.closest(".trial");
      const show = () => { score.textContent = K.tr(t.tally || "Good pushes: {g} of 3 · Slips: {b} of 3", { g: good, b: bad }); bal.style.left = (50 + (good - bad) * 15) + "%"; if (wrapEl) wrapEl.style.setProperty("--shove", (good - bad) * 7 + "vw"); };
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
  // The horse, cut from leather like the puppets: body, neck and head (the head is the target, at the
  // horse's front, so the figure is drawn with its head over x = 0), four legs, mane and tail.
  const HORSE = '<svg viewBox="-34 -78 150 98"><g class="h-all">' +
    '<path class="h-tail" d="M96 -36 Q114 -30 110 -6 Q104 -20 94 -26 Z" fill="#3a2214" stroke="#1d0f08" stroke-width="1.2"/>' +
    '<g class="h-legB"><path d="M84 -18 L88 14 L82 15 L76 -14 Z M28 -16 L26 14 L20 15 L20 -14 Z" fill="#7a4626" stroke="#1d0f08" stroke-width="1.2"/></g>' +
    '<path class="h-body" d="M18 -40 Q50 -50 92 -40 Q100 -26 90 -14 Q54 -8 24 -14 Q12 -24 18 -40 Z" fill="#a8622f" stroke="#1d0f08" stroke-width="1.4"/>' +
    '<path d="M30 -32 h4 M42 -34 h4 M54 -35 h4 M66 -34 h4 M78 -32 h4 M36 -24 h4 M50 -24 h4 M64 -24 h4" stroke="#1d0f08" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/>' +
    '<path d="M24 -38 Q60 -30 92 -38" fill="none" stroke="#e2b55a" stroke-width="2.2"/>' +
    '<g class="h-legF"><path d="M88 -18 L94 14 L88 15 L82 -16 Z M24 -18 L18 14 L12 15 L14 -16 Z" fill="#a8622f" stroke="#1d0f08" stroke-width="1.2"/></g>' +
    '<g class="h-neck"><path d="M24 -36 Q10 -58 -2 -68 L-16 -62 Q-6 -46 10 -26 Z" fill="#a8622f" stroke="#1d0f08" stroke-width="1.4"/>' +
    '<path d="M22 -40 Q10 -58 0 -70 Q8 -56 18 -36 Z" fill="#3a2214"/>' +
    '<path class="h-head" d="M-2 -70 Q-14 -76 -28 -58 Q-32 -50 -26 -48 L-16 -52 Q-8 -54 -4 -60 Z" fill="#a8622f" stroke="#1d0f08" stroke-width="1.4"/>' +
    '<circle cx="-12" cy="-63" r="1.8" fill="#1d0f08"/><path d="M-4 -72 L0 -80 L2 -70 Z" fill="#a8622f" stroke="#1d0f08" stroke-width="1"/>' +
    '<path d="M-26 -52 Q-14 -58 -4 -64" fill="none" stroke="#b2432a" stroke-width="1.6"/></g>' +
    '<path class="h-rod" d="M56 -12 L56 30" stroke="#1d0f08" stroke-width="1" opacity="0.5"/></g></svg>';
  U.games.steady = function (box, done, c) {
    return frame(box, done, c, "steady", ({ host, power, t, finish, onAct, cue }) => {
      const band = clamp(0.11 + power * 0.015, 0.1, 0.2), LIMIT = t.secs || 15;
      let pos = 0.5, vel = 0, holding = false, mood = 0.5, moodV = 0, calm = 0, last = 0;
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="steady"><div class="mood" style="width:' + band * 100 + '%"></div><div class="hand"></div></div><div class="calm"><i></i></div><p class="game-note">' + U.tr(t.help || "Hold to move your hand right; let go and it drifts back. Keep it over the glow.") + '</p><div class="btnrow"></div>';
      const moodEl = host.querySelector(".mood"), hand = host.querySelector(".hand"), bar = host.querySelector(".calm i"), score = host.querySelector(".score");
      // A frightened horse (trial.horse): a leather puppet horse instead of the glow. Its head is
      // where your hand must be; it tosses its head and rears when frightened, lowers it as it calms.
      let horse = null;
      if (t.horse) {
        host.querySelector(".steady").classList.add("with-horse");
        horse = U.el('<div class="horse" aria-hidden="true">' + HORSE + "</div>");
        host.querySelector(".steady").insertBefore(horse, hand);
      }
      // On the painting: an open hand reaching toward the glow.
      if (host.closest(".trial.immersive")) hand.innerHTML = '<svg viewBox="0 0 60 80" aria-hidden="true"><path d="M18 78 L16 46 Q8 40 6 30 Q6 24 12 26 L18 36 L16 10 Q16 4 21 4 Q26 4 26 10 L27 30 L28 6 Q28 1 33 1 Q38 1 38 7 L38 30 L40 10 Q40 5 45 5 Q50 5 49 11 L48 34 L51 18 Q52 13 56 14 Q60 15 59 21 L56 48 Q54 62 44 70 L44 78 Z" fill="#d6a274" stroke="#4a2a14" stroke-width="2.4" stroke-linejoin="round"/><path d="M27 30 L27 40 M38 30 L38 40" stroke="#8a5a34" stroke-width="1.5"/></svg>';
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
        if (horse) {
          horse.style.left = mood * 100 + "%";
          horse.classList.toggle("touched", inside);
          horse.classList.toggle("rear", Math.abs(moodV) > 0.3 && calm < 0.8);
          horse.classList.toggle("calm", calm > 0.6);
          horse.classList.toggle("toss", !inside && calm <= 0.6);
          horse.classList.toggle("left", moodV < -0.05); // it faces the way it shies
          if (moodV > 0.05) horse.classList.remove("left");
        }
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
      let pos = 0, trips = 0, seen = 0, sus = 0, holding = false, freeze = 0, last = 0;
      // The guard walks the far side carrying the torch; its light falls on the ground just ahead of
      // him. He starts on the right and paces the back wall. Before he turns he stops and lifts the
      // torch (the tell); now and then he stops to look. When he sees you he comes at you and the
      // light stays on you.
      let gp = 0.9, gdir = -1, gpause = 0, turning = false, glock = 0, spot = 0.9;
      const gspeed = clamp(0.1 + (0.26 - light) * 0.25, 0.1, 0.13), REACH = 0.07;
      const painted = !!host.closest(".trial.immersive");
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="sneakway' + (painted ? " painted" : "") + '">' +
        '<svg class="beam" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sneak-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd890" stop-opacity="0.85"/><stop offset="1" stop-color="#ffaa50" stop-opacity="0.32"/></linearGradient></defs><polygon fill="url(#sneak-beam)"/><ellipse class="pool" rx="1" ry="4"/></svg>' +
        '<div class="goal"></div><div class="guard">' + (painted ? U.puppet(U.puppetFor(t.watch || "guard"), { h: 150, pose: "walk", flip: true }) : "") + '<i class="flame"></i></div><div class="me"></div></div><div class="sus"><i></i></div>' +
        '<p class="game-note" aria-live="polite">' + U.tr(t.help || "Hold to move. Stop before the light reaches you.") + '</p><div class="btnrow"></div>';
      const way = host.querySelector(".sneakway"), me = host.querySelector(".me"), susBar = host.querySelector(".sus i"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const guard = host.querySelector(".guard"), flame = guard.querySelector(".flame"), poly = host.querySelector(".beam polygon"), pool = host.querySelector(".beam .pool");
      // On the painting your own puppet creeps along the ground through the shadows.
      if (painted) me.innerHTML = U.puppet(K.puppetSpec(K.S), { h: 150, pose: "sneak" });
      const fig = painted ? me.querySelector(".pp") : null, gfig = painted ? guard.querySelector(".pp") : null;
      const setPose = (el, p) => { if (el) el.setAttribute("class", el.getAttribute("class").replace(/pose-\S+/, "pose-" + p)); };
      let posed = "", gposed = "", gface = 0;
      const down = () => { holding = true; cue("hold"); }, up = () => { holding = false; cue("rest"); };
      host.querySelector(".btnrow").appendChild(pressButton(t.verb || "Move", down, up));
      onAct(down, up);
      return loop((s) => {
        const dt = Math.min(0.05, s - last); last = s;
        let gpose = "walk";
        if (glock > 0) {
          glock -= dt;
          gp += clamp(pos - gp, -1, 1) * dt * 0.7; gdir = pos >= gp ? 1 : -1; spot = pos; gpose = "push";
        } else if (gpause > 0) {
          gpause -= dt; gpose = turning ? "cheer" : "stand";
          if (gpause <= 0 && turning) { gdir = -gdir; turning = false; }
        } else {
          gp += gdir * gspeed * dt;
          if ((gp <= 0.08 && gdir < 0) || (gp >= 0.92 && gdir > 0)) { gp = clamp(gp, 0.08, 0.92); gpause = 0.9; turning = true; }
          else if (K.rng() < dt * 0.12) { gpause = 0.6 + K.rng() * 0.6; turning = K.rng() < 0.45; }
        }
        if (glock <= 0) spot = clamp(gp + gdir * REACH * (gpause > 0 && turning ? 0.4 : 1), 0, 1);
        const lit = Math.abs(pos - spot) < light / 2;
        if (freeze > 0) freeze -= dt;
        else {
          if (holding) pos = Math.min(1, pos + dt * 0.11);
          sus = clamp(sus + (lit ? (holding ? dt * 2.4 : dt * 0.22) : -dt * 0.35), 0, 1);
          if (sus >= 1) { seen++; sus = 0; glock = 1.1; freeze = 1.1; note.textContent = K.tr(t.spotted || "A shout. You drop the basket and run back into the dark."); if (K.Sound) K.Sound.play("hit"); cue("bad");
            setTimeout(() => { pos = Math.max(0, pos - 0.35); }, 650); }
          if (pos >= 1) { trips++; cue("good"); pos = 0; note.textContent = K.tr(t.made || "Out, and back for another load."); if (K.Sound) K.Sound.play("choose"); }
        }
        // Draw: the guard, his torch, the cone of light from it to the ground.
        guard.style.left = gp * 100 + "%";
        guard.classList.toggle("left", gdir < 0); guard.classList.toggle("tell", gpause > 0 && turning); guard.classList.toggle("locked", glock > 0);
        if (gfig && gface !== gdir) { gface = gdir; gfig.classList.toggle("flip", gdir < 0); }
        if (gpose !== gposed) { gposed = gpose; setPose(gfig, gpose); }
        const wr = way.getBoundingClientRect(), fr = flame.getBoundingClientRect();
        if (wr.width && wr.height) {
          const fx = ((fr.left + fr.width / 2 - wr.left) / wr.width) * 100, fy = ((fr.top + fr.height / 2 - wr.top) / wr.height) * 100;
          const a = (spot - light / 2) * 100, b = (spot + light / 2) * 100;
          poly.setAttribute("points", fx.toFixed(1) + "," + fy.toFixed(1) + " " + b.toFixed(1) + ",100 " + a.toFixed(1) + ",100");
          pool.setAttribute("cx", (spot * 100).toFixed(1)); pool.setAttribute("cy", "98"); pool.setAttribute("rx", (light * 50).toFixed(1));
        }
        way.classList.toggle("caught", glock > 0);
        me.style.left = pos * 100 + "%"; me.classList.toggle("lit", lit);
        if (fig) { const want = freeze > 0 ? "fall" : holding ? "walk" : "sneak"; if (want !== posed) { posed = want; setPose(fig, want); } }
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
