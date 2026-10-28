/* More kinds of test, built on the same frame as ui/trials.js (stakes first, then the action, the
   painted stage and its figures above):
   drill   a sequence shown, then repeated: hand signs (mudras), lines of a verse, a coded message
   rhythm  strike on the beat as it reaches the mark: a mace drill, an elephant drill, a smith's hammer
   race    switch lanes to miss what is in the road: a chariot race, a boat in a storm, a night battle
   herd    lead a growing line (snake-style) to safety: families out of a burning forest, cattle to a ford
   rings   turn the rings of a wheel: open a way to the centre, or keep it shut
   Every one reads the player's stats for its difficulty, plays with keys, mouse or touch, and under
   the test harness is rolled instead of played (see frame in ui/trials.js). */
(function (K) {
  "use strict";
  const U = K.UI;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sfx = (n) => { if (K.Sound) K.Sound.play(n); };
  // Keys beyond the one action key (arrows, letters, numbers), removed when the test ends.
  function keyset(map) {
    const on = (e) => { const f = map[e.key]; if (f) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) f(); } };
    document.addEventListener("keydown", on, true);
    return () => document.removeEventListener("keydown", on, true);
  }

  // ---------- Drill: watch the sequence, then repeat it ----------
  // trial.set: "mudra" | "verse" | "code"; trial.lengths ([3, 4, 5]); two rounds of three win.
  const MUDRA = {
    pataka: '<path d="M30 92 L30 40 Q30 32 36 32 L38 32 L38 14 Q38 8 43 8 Q48 8 48 14 L48 30 L50 30 L50 10 Q50 4 55 4 Q60 4 60 10 L60 30 L62 30 L62 14 Q62 8 67 8 Q72 8 72 14 L72 36 L72 60 Q72 80 62 92 Z"/>',
    mushti: '<path d="M28 92 L28 52 Q28 34 44 32 L64 32 Q76 34 76 48 L76 62 Q76 76 66 80 L64 92 Z"/><path class="ln" d="M36 44 H70 M36 54 H72 M38 64 H70"/>',
    shikhara: '<path d="M28 92 L28 54 Q28 38 44 38 L64 38 Q76 40 76 52 L76 64 Q76 76 66 80 L64 92 Z M42 38 L42 12 Q42 5 48 5 Q54 5 54 12 L54 38 Z"/><path class="ln" d="M36 52 H70 M36 62 H72"/>',
    ardha: '<path d="M30 92 L30 40 L38 40 L38 14 Q38 8 43 8 Q48 8 48 14 L48 32 L50 32 L50 10 Q50 4 55 4 Q60 4 60 10 L60 32 L62 32 L62 14 Q62 8 67 8 Q72 8 72 14 L72 60 Q72 80 62 92 Z M30 56 L10 40 Q4 36 8 30 Q12 26 18 30 L32 42 Z"/>'
  };
  const SETS = {
    mudra: { items: ["pataka", "mushti", "shikhara", "ardha"], names: { pataka: "Pataka, the flag", mushti: "Mushti, the fist", shikhara: "Shikhara, the peak", ardha: "Ardhachandra, the half moon" } },
    verse: { items: ["v1", "v2", "v3", "v4"], names: { v1: "Hear, O king,", v2: "of the Bharata line,", v3: "how the earth was shaken,", v4: "and who stood firm." } },
    code: { items: ["lamp", "knot", "river", "key"], names: { lamp: "A lamp", knot: "A knot", river: "A river", key: "A key" } }
  };
  const SIGN = {
    lamp: '<path d="M22 66 Q50 86 78 66 Z"/><path d="M50 60 Q40 44 50 26 Q60 44 50 60 Z" class="fl"/>',
    knot: '<path class="ln w" d="M20 50 Q35 20 50 50 Q65 80 80 50 M20 50 Q35 80 50 50 Q65 20 80 50"/>',
    river: '<path class="ln w" d="M12 38 Q25 28 38 38 T64 38 T90 38 M12 56 Q25 46 38 56 T64 56 T90 56 M12 74 Q25 64 38 74 T64 74 T90 74"/>',
    key: '<circle cx="34" cy="50" r="14" class="ln w"/><path class="ln w" d="M48 50 H86 M74 50 V62 M82 50 V60"/>'
  };
  function tileFace(set, id) {
    if (set === "verse") return '<span class="verse">' + U.tr(SETS.verse.names[id]) + "</span>";
    const body = set === "mudra" ? MUDRA[id] : SIGN[id];
    return '<svg viewBox="0 0 100 100" aria-hidden="true" class="sign ' + set + '">' + body + "</svg>";
  }
  U.games.drill = function (box, done, c) {
    return U.trialFrame(box, done, c, "drill", ({ host, power, t, finish, cue }) => {
      const set = SETS[t.set] ? t.set : "mudra", items = SETS[set].items;
      const lengths = t.lengths || [3, 4, 5];
      const show = clamp(0.78 - power * 0.03, 0.42, 0.78); // seconds each sign is lit
      let round = 0, right = 0, wrong = 0, seq = [], pos = 0, phase = "show", timers = [];
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="drill ' + set + '" role="group" aria-label="' + U.esc(K.tr("Signs")) + '">' +
        items.map((id, i) => '<button type="button" class="tile" data-id="' + id + '" aria-label="' + U.esc(K.tr(SETS[set].names[id])) + '"><span class="n">' + (i + 1) + "</span>" + tileFace(set, id) + (set !== "verse" ? '<span class="nm">' + U.tr(SETS[set].names[id]) + "</span>" : "") + "</button>").join("") +
        '</div><p class="game-note" aria-live="polite"></p>';
      const tiles = [...host.querySelectorAll(".tile")], score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const later = (ms, f) => timers.push(setTimeout(f, ms));
      const tally = () => { score.textContent = K.tr(t.tally || "Round {n} of {m} · Right: {r}", { n: Math.min(round + 1, lengths.length), m: lengths.length, r: right }); };
      const light = (i, cls, ms) => { const el = tiles[i]; el.classList.add(cls); later(ms, () => el.classList.remove(cls)); };
      function start() {
        tally();
        phase = "show"; pos = 0;
        seq = []; for (let i = 0; i < lengths[round]; i++) { let n; do n = Math.floor(K.rng() * items.length); while (i && n === seq[i - 1] && K.rng() < 0.6); seq.push(n); }
        note.textContent = K.tr(t.watch || "Watch.");
        tiles.forEach((b) => { b.disabled = true; });
        seq.forEach((n, i) => later(500 + i * show * 1000, () => { light(n, "lit", show * 780); sfx("tap"); }));
        later(500 + seq.length * show * 1000 + 200, () => { phase = "input"; note.textContent = K.tr(t.repeat || "Now you."); tiles.forEach((b) => { b.disabled = false; }); });
      }
      function press(i) {
        if (phase !== "input") return;
        cue("act");
        if (i === seq[pos]) {
          light(i, "ok", 220); sfx("tap"); pos++;
          if (pos === seq.length) { right++; cue("good"); note.textContent = K.tr(t.good || "Every one, in order."); return next(); }
        } else {
          light(i, "bad", 400); light(seq[pos], "lit", 600); sfx("hit"); wrong++; cue("bad");
          note.textContent = K.tr(t.bad || "Wrong. It was this one.");
          return next();
        }
      }
      function next() {
        phase = "wait"; tiles.forEach((b) => { b.disabled = true; });
        round++;
        tally();
        if (right >= 2 || wrong >= 2 || round >= lengths.length) return later(800, () => finish(right >= 2 ? "win" : right === 1 && round >= lengths.length ? "close" : "lose", ["{r} of {n} sequences right.", { r: right, n: round }]));
        later(1100, start);
      }
      tiles.forEach((b, i) => b.addEventListener("click", () => press(i)));
      const off = keyset({ 1: () => press(0), 2: () => press(1), 3: () => press(2), 4: () => press(3) });
      start();
      return () => { off(); timers.forEach(clearTimeout); };
    });
  };

  // ---------- Rhythm: strike as each beat reaches the mark ----------
  // trial.bpm (88), trial.notes (16), trial.sound ("drum" | "clang"); 80% of beats win, 60% is close.
  U.games.rhythm = function (box, done, c) {
    return U.trialFrame(box, done, c, "rhythm", ({ host, power, t, finish, cue, onAct }) => {
      const bpm = t.bpm || 88, beat = 60 / bpm, travel = 1.7, win = clamp(0.085 + power * 0.006, 0.085, 0.14);
      const total = t.notes || 16;
      // A pattern in groups, like a drummer's bols: mostly on the beat, some off it, a few rests.
      const GROUPS = [[0, 1, 2, 3], [0, 1, 1.5, 2, 3], [0, 0.5, 1, 2, 3], [0, 1, 2, 2.5, 3], [0, 1.5, 2, 3], [0, 1, 2, 3.5]];
      const notes = [];
      let bar = 0;
      while (notes.length < total) { for (const g of K.pick(GROUPS)) if (notes.length < total) notes.push({ at: 2.2 + (bar * 4 + g) * beat, done: false }); bar++; }
      const end = notes[notes.length - 1].at + 1.2;
      let hits = 0, misses = 0, strays = 0, now = 0, ticked = -1;
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="beatlane"><div class="mark"></div><div class="notes"></div><div class="flash"></div></div>' +
        '<p class="game-note" aria-live="polite">' + U.tr(t.help || "Strike as each beat reaches the ring.") + '</p><div class="btnrow"></div>';
      const lane = host.querySelector(".beatlane"), wrapN = host.querySelector(".notes"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      notes.forEach((n) => { n.el = U.el('<i class="beat' + (n.at % beat > 0.01 && Math.abs((n.at % beat) - beat) > 0.01 ? " off" : "") + '"></i>'); wrapN.appendChild(n.el); });
      const tally = () => { score.textContent = K.tr(t.tally || "On the beat: {h} · Missed: {m} · {left} to go", { h: hits, m: misses, left: notes.filter((n) => !n.done).length }); };
      tally();
      const flash = (cls) => { lane.classList.remove("good", "bad"); void lane.offsetWidth; lane.classList.add(cls); };
      const strike = () => {
        cue("act");
        // The nearest beat not yet played.
        let best = null, d = 9;
        for (const n of notes) if (!n.done) { const x = Math.abs(n.at - now); if (x < d) { d = x; best = n; } }
        if (best && d <= win) {
          best.done = true; best.el.classList.add("hit"); hits++;
          sfx(t.sound || "drum"); flash("good"); cue("good");
          note.textContent = K.tr(d <= win / 2 ? t.clean || "Clean!" : t.okLine || "On the beat.");
        } else if (!best || d > 0.32) {
          strays++; flash("bad"); note.textContent = K.tr("Nothing there."); // a stroke on empty air costs a little
          if (strays % 2 === 0) misses++;
        } else { flash("bad"); note.textContent = K.tr(best.at > now ? t.soon || "Too soon." : t.late || "Too late."); }
        tally();
      };
      host.querySelector(".btnrow").appendChild(U.pressButton(t.verb || "Strike", strike));
      onAct(strike);
      return U.loop((s) => {
        now = s;
        // A quiet guide on every beat, so the rhythm can be heard as well as seen.
        const b = Math.floor((s - 2.2) / beat);
        if (b > ticked && s < end - 1) { ticked = b; if (b >= -2) sfx("tap"); }
        for (const n of notes) {
          const x = (n.at - s) / travel; // 1 → just entered on the right, 0 → at the ring
          n.el.style.left = (14 + x * 84) + "%";
          n.el.style.opacity = x > 1.05 || x < -0.15 ? "0" : "1";
          if (!n.done && s - n.at > win) { n.done = true; misses++; n.el.classList.add("miss"); flash("bad"); cue("bad"); note.textContent = K.tr(t.late || "Too late."); tally(); }
        }
        if (s >= end) {
          const acc = hits / total;
          finish(acc >= 0.8 ? "win" : acc >= 0.6 ? "close" : "lose", ["{h} of {n} beats.", { h: hits, n: total }]);
        }
      }, host);
    });
  };

  // ---------- Race: change lanes to miss what is in the road ----------
  // trial.rival (a name: race against them) or trial.hull (3: hits you can take); trial.vehicle
  // ("chariot" | "boat"); trial.obstacles: kinds drawn in code ("rock", "wreck", "wave", "fire").
  const OBST = {
    rock: '<svg viewBox="0 0 60 40"><path d="M4 38 Q2 22 14 14 Q24 4 38 8 Q54 12 56 28 Q58 38 50 38 Z" fill="#6f6355" stroke="#2b2219" stroke-width="2"/><path d="M18 20 Q26 14 34 18" stroke="#9c8f7e" stroke-width="2" fill="none"/></svg>',
    wreck: '<svg viewBox="0 0 60 40"><circle cx="20" cy="24" r="14" fill="none" stroke="#3a2416" stroke-width="4"/><path d="M20 10 V38 M6 24 H34 M10 14 L30 34 M30 14 L10 34" stroke="#3a2416" stroke-width="2.5"/><path d="M34 30 L58 22" stroke="#5a3418" stroke-width="5"/></svg>',
    wave: '<svg viewBox="0 0 60 40"><path d="M2 38 Q10 14 26 12 Q40 10 44 22 Q36 18 32 26 Q46 26 58 38 Z" fill="#3f6f86" stroke="#173544" stroke-width="2"/><path d="M28 16 Q36 14 40 20" stroke="#e8f2f5" stroke-width="2.5" fill="none"/></svg>',
    fire: '<svg viewBox="0 0 60 40"><path d="M10 38 Q4 24 16 16 Q14 26 22 26 Q18 12 30 2 Q32 16 40 18 Q40 10 46 8 Q56 22 50 38 Z" fill="#e5762a" stroke="#7a2a10" stroke-width="2"/><path d="M22 38 Q20 30 28 26 Q30 32 36 32 Q38 36 36 38 Z" fill="#ffd36b"/></svg>'
  };
  function vehicleSvg(kind, spec) {
    const fig = U.puppet(spec, { h: 70, pose: "hold" }).replace("<svg ", '<svg x="22" y="-22" width="40" height="70" ');
    if (kind === "boat") return '<svg viewBox="0 0 110 70" class="veh" aria-hidden="true">' + fig + '<path d="M4 44 L106 44 Q98 66 70 66 L30 66 Q10 66 4 44 Z" fill="#7a4a24" stroke="#2b1609" stroke-width="2"/><path d="M14 50 H96" stroke="#c8954f" stroke-width="2"/></svg>';
    return '<svg viewBox="0 0 110 70" class="veh" aria-hidden="true"><path d="M78 40 Q86 22 100 20 L106 24 L98 30 Q102 40 96 50 L84 50 Z" fill="#c9a679" stroke="#2b1609" stroke-width="2"/><path d="M80 48 L76 62 M94 48 L98 62" stroke="#2b1609" stroke-width="3"/>' + fig +
      '<path d="M18 44 H70 L66 30 H22 Z" fill="#a3302a" stroke="#2b1609" stroke-width="2"/><path d="M70 40 L84 42" stroke="#2b1609" stroke-width="3"/><g class="wheel"><circle cx="36" cy="52" r="14" fill="none" stroke="#2b1609" stroke-width="4"/><path d="M36 38 V66 M22 52 H50 M26 42 L46 62 M46 42 L26 62" stroke="#2b1609" stroke-width="2"/></g></svg>';
  }
  U.games.race = function (box, done, c) {
    return U.trialFrame(box, done, c, "race", ({ host, power, t, finish, cue }) => {
      const kinds = t.obstacles || ["rock", "wreck"], hullMode = !t.rival, LEN = 100;
      const base = t.speed || 3.3, gap = clamp(1.25 - power * 0.04, 0.8, 1.25); // seconds between obstacles
      const rivalV = t.rival ? clamp((t.rivalSpeed || 3.25) - power * 0.03, 2.75, 3.4) : 0;
      let lane = 1, dist = 0, rival = 0, slow = 0, hits = 0, last = 0, spawnIn = 1.2, over = false, scroll = 0;
      const lives = t.hull || 3;
      const obs = [];
      const stage = K.val(t.stage);
      host.innerHTML = '<p class="score" aria-live="polite"></p>' +
        '<div class="track"><div class="bgstrip">' + (stage ? [0, 1, 2, 3].map((i) => '<i style="background-image:url(\'' + U.artUrl(stage) + '\')"' + (i % 2 ? ' class="flip"' : "") + "></i>").join("") : "") + '</div><div class="lanes"><i></i><i></i><i></i></div><div class="obs"></div><div class="me lane1">' + vehicleSvg(t.vehicle, K.puppetSpec(K.S)) + "</div></div>" +
        '<div class="progress"><span class="pm" style="left:0"></span>' + (t.rival ? '<span class="pr" style="left:0" title="' + U.esc(K.tr(t.rival)) + '"></span>' : "") + "</div>" +
        '<p class="game-note" aria-live="polite">' + U.tr(t.help || "Change lanes to miss what is in the road: up and down, or the buttons.") + '</p><div class="btnrow race-btns"></div>';
      const track = host.querySelector(".track"), me = host.querySelector(".me"), obsBox = host.querySelector(".obs"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const pm = host.querySelector(".pm"), pr = host.querySelector(".pr");
      // The painting scrolls past, each copy mirrored against the last so the joins never show.
      const strip = host.querySelector(".bgstrip"), aspect = U.stageInfo(stage).side ? 2560 / 720 : 16 / 9;
      let tileW = 0;
      const sizeStrip = () => { tileW = track.clientHeight * aspect; strip.querySelectorAll("i").forEach((el) => { el.style.width = tileW + "px"; }); };
      sizeStrip();
      const move = (d) => { if (over) return; lane = clamp(lane + d, 0, 2); me.className = "me lane" + lane; cue("act"); };
      const row = host.querySelector(".btnrow");
      row.appendChild(U.pressButton(t.upVerb || "Up", () => move(-1)));
      row.appendChild(U.pressButton(t.downVerb || "Down", () => move(1)));
      const off = keyset({ ArrowUp: () => move(-1), ArrowDown: () => move(1), w: () => move(-1), s: () => move(1), W: () => move(-1), S: () => move(1) });
      // Swipe up or down on the track.
      let y0 = null;
      track.addEventListener("pointerdown", (e) => { y0 = e.clientY; });
      track.addEventListener("pointerup", (e) => { if (y0 != null && Math.abs(e.clientY - y0) > 18) move(e.clientY < y0 ? -1 : 1); else if (y0 != null) { const r = track.getBoundingClientRect(); move(e.clientY < r.top + r.height / 2 ? -1 : 1); } y0 = null; });
      const tally = () => { score.textContent = hullMode ? K.tr(t.tally || "Distance: {d}% · Hits: {h} of {l}", { d: Math.floor(dist), h: hits, l: lives }) : K.tr(t.tally || "You: {d}% · {who}: {r}%", { d: Math.floor(dist), r: Math.floor(rival), who: K.tr(t.rival) }); };
      const stop = U.loop((s) => {
        const dt = Math.min(0.05, s - last); last = s;
        if (over) return;
        const v = base * (slow > 0 ? 0.5 : 1);
        if (slow > 0) slow -= dt;
        dist += v * dt; rival += rivalV * dt * (0.94 + 0.12 * Math.sin(s * 0.7));
        scroll += v * dt * 60;
        if (tileW) strip.style.transform = "translateX(" + (-(scroll % (tileW * 2))).toFixed(1) + "px)";
        // What is in the road comes toward you; never all three lanes at once.
        spawnIn -= dt;
        if (spawnIn <= 0 && dist < LEN - 6) {
          spawnIn = gap * (0.75 + K.rng() * 0.6);
          const taken = obs.filter((o) => o.x > 80).map((o) => o.lane);
          const free = [0, 1, 2].filter((l) => !taken.includes(l));
          if (free.length > 1 || !taken.length) {
            const l = K.pick(free.length ? free : [0, 1, 2]), k = K.pick(kinds);
            const el = U.el('<div class="ob lane' + l + '">' + OBST[k] + "</div>");
            obsBox.appendChild(el); obs.push({ lane: l, x: 104, el });
          }
        }
        for (let i = obs.length - 1; i >= 0; i--) {
          const o = obs[i];
          o.x -= v * dt * 13;
          o.el.style.left = o.x + "%";
          if (!o.hit && o.lane === lane && o.x < 26 && o.x > 8) {
            o.hit = true; hits++; slow = 1.1; o.el.classList.add("hit");
            track.classList.remove("bump"); void track.offsetWidth; track.classList.add("bump");
            sfx("hit"); cue("bad"); note.textContent = K.tr(t.bump || "You hit it, and lose ground.");
          }
          if (o.x < -12) { o.el.remove(); obs.splice(i, 1); }
        }
        pm.style.left = clamp(dist, 0, 100) + "%"; if (pr) pr.style.left = clamp(rival, 0, 100) + "%";
        tally();
        const out = (o, line) => { over = true; finish(o, line); };
        if (hullMode && hits >= lives) return out("lose", ["You took {h} hits.", { h: hits }]);
        if (dist >= LEN) {
          if (hullMode) return out(hits <= lives - 2 ? "win" : "close", ["Through, with {h} hits.", { h: hits }]);
          return out(rival < LEN ? "win" : "close", ["You finished {gap} lengths {where}.", { gap: Math.abs(Math.round(dist - rival)), where: rival < LEN ? "ahead" : "behind" }]);
        }
        if (!hullMode && rival >= LEN && dist < LEN - 6) return out("lose", ["{who} finished first.", { who: t.rival }]);
      }, host);
      return () => { stop(); off(); };
    });
  };

  // ---------- Herd: lead a growing line to safety ----------
  // A grid over the stage. You lead; everyone you reach falls in behind you. Hazards: fire that
  // spreads (trial.spread), deep water, your own line. trial.need (6) followers through the goal win.
  U.games.herd = function (box, done, c) {
    return U.trialFrame(box, done, c, "herd", ({ host, power, t, finish, cue }) => {
      const W = 16, H = 10, need = t.need || 6, LIMIT = t.secs || 75, lives = 3;
      const step = clamp(0.25 - power * 0.005, 0.17, 0.25);
      const theme = t.theme || "fire"; // "fire" (families out of a burning forest) or "river" (cattle at a ford)
      const key = (x, y) => x + "," + y;
      const goal = new Set(); for (let y = 3; y <= 6; y++) goal.add(key(W - 1, y));
      const hazard = new Set();
      const start = { x: 1, y: 5 };
      // Hazards: patches of fire, or a band of deep water with a ford through it.
      if (theme === "river") { for (let y = 0; y < H; y++) for (const x of [9, 10]) if (y < 3 || y > 6) hazard.add(key(x, y)); }
      else for (let i = 0; i < 9; i++) { const x = 3 + Math.floor(K.rng() * 11), y = Math.floor(K.rng() * H); if (Math.abs(x - start.x) + Math.abs(y - start.y) > 3) hazard.add(key(x, y)); }
      let snake = [{ ...start }], dir = { x: 1, y: 0 }, want = dir, strays = [], dead = 0, timer = 0, last = 0, spreadT = 0, over = false, flashT = 0;
      const free = () => { for (let g = 0; g < 200; g++) { const x = 1 + Math.floor(K.rng() * (W - 3)), y = Math.floor(K.rng() * H), k = key(x, y); if (!hazard.has(k) && !goal.has(k) && !snake.some((p) => p.x === x && p.y === y) && !strays.some((p) => p.x === x && p.y === y)) return { x, y }; } return null; };
      for (let i = 0; i < need + 2; i++) { const p = free(); if (p) strays.push(p); }
      const stage = K.val(t.stage);
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="herdfield" style="' + (stage ? "--stage:url('" + U.artUrl(stage) + "')" : "") + '"><canvas width="640" height="400" aria-label="' + U.esc(K.tr(t.fieldLabel || "The field")) + '" role="img"></canvas></div>' +
        '<p class="game-note" aria-live="polite">' + U.tr(t.help || "Steer with the arrow keys, the buttons or a swipe. Reach everyone you can, then bring them out through the gap on the right.") + '</p>' +
        '<div class="dpad"><button type="button" class="cta secondary" data-d="up" aria-label="' + U.esc(K.tr("Up")) + '">↑</button><button type="button" class="cta secondary" data-d="left" aria-label="' + U.esc(K.tr("Left")) + '">←</button><button type="button" class="cta secondary" data-d="down" aria-label="' + U.esc(K.tr("Down")) + '">↓</button><button type="button" class="cta secondary" data-d="right" aria-label="' + U.esc(K.tr("Right")) + '">→</button></div>';
      const cv = host.querySelector("canvas"), ctx = cv.getContext && cv.getContext("2d"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const D = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
      const turn = (d) => { const n = D[d]; if (n.x === -dir.x && n.y === -dir.y && snake.length > 1) return; want = n; };
      host.querySelectorAll(".dpad button").forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); turn(b.dataset.d); }));
      const off = keyset({ ArrowUp: () => turn("up"), ArrowDown: () => turn("down"), ArrowLeft: () => turn("left"), ArrowRight: () => turn("right"), w: () => turn("up"), s: () => turn("down"), a: () => turn("left"), d: () => turn("right") });
      let sx = null, sy = null;
      cv.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
      cv.addEventListener("pointerup", (e) => { if (sx == null) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) > 14) turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up")); sx = null; });
      const followers = () => snake.length - 1;
      const tally = (s) => { score.textContent = K.tr(t.tally || "With you: {f} of {n} · Lost: {d} of {l} · {s} seconds", { f: followers(), n: need, d: dead, l: lives, s: Math.max(0, Math.ceil(LIMIT - s)) }); };
      function crash(why) {
        dead++; flashT = 0.5; sfx("hit"); cue("bad");
        // The line breaks: two who were following scatter back into the field.
        const lost = snake.splice(Math.max(1, snake.length - 2));
        lost.forEach(() => { const p = free(); if (p) strays.push(p); });
        snake = [{ ...start }].concat(snake.slice(1).map((p, i) => ({ x: Math.max(0, start.x - 1 - i), y: start.y })));
        dir = { x: 1, y: 0 }; want = dir;
        note.textContent = K.tr(why);
      }
      function tick() {
        dir = want;
        const h = snake[0], n = { x: h.x + dir.x, y: h.y + dir.y }, k = key(n.x, n.y);
        if (goal.has(k)) {
          over = true;
          const f = followers();
          return finish(f >= need ? "win" : f >= Math.ceil(need / 2) ? "close" : "lose", ["You brought {f} out.", { f }]);
        }
        if (n.x < 0 || n.y < 0 || n.x >= W || n.y >= H) return crash(t.edge || "That way is blocked.");
        if (hazard.has(k)) return crash(theme === "river" ? t.water || "The water is too deep there." : t.burn || "Fire. You pull back, and the line breaks.");
        if (snake.slice(0, -1).some((p) => p.x === n.x && p.y === n.y)) return crash(t.tangle || "You run into your own line.");
        const si = strays.findIndex((p) => p.x === n.x && p.y === n.y);
        snake.unshift(n);
        if (si >= 0) { strays.splice(si, 1); sfx("tap"); cue("good"); note.textContent = K.tr(t.gather || "One more falls in behind you."); }
        else snake.pop();
      }
      function spread() {
        if (theme !== "fire") return;
        const list = [...hazard];
        for (let g = 0; g < 10; g++) {
          const [x, y] = K.pick(list).split(",").map(Number), d = K.pick(Object.values(D)), nx = x + d.x, ny = y + d.y, k = key(nx, ny);
          if (nx < 1 || ny < 0 || nx >= W - 1 || ny >= H || goal.has(k) || snake.some((p) => p.x === nx && p.y === ny) || strays.some((p) => p.x === nx && p.y === ny) || Math.abs(nx - start.x) + Math.abs(ny - start.y) < 3) continue;
          hazard.add(k); return;
        }
      }
      function draw(s) {
        if (!ctx) return;
        const cw = cv.width / W, ch = cv.height / H;
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.fillStyle = theme === "river" ? "rgba(236,220,182,0.18)" : "rgba(20,12,6,0.32)"; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.strokeStyle = "rgba(255,240,210,0.08)"; ctx.lineWidth = 1;
        for (let x = 1; x < W; x++) { ctx.beginPath(); ctx.moveTo(x * cw, 0); ctx.lineTo(x * cw, cv.height); ctx.stroke(); }
        for (let y = 1; y < H; y++) { ctx.beginPath(); ctx.moveTo(0, y * ch); ctx.lineTo(cv.width, y * ch); ctx.stroke(); }
        goal.forEach((k) => { const [x, y] = k.split(",").map(Number); ctx.fillStyle = "rgba(120,200,120,0.45)"; ctx.fillRect(x * cw, y * ch, cw, ch); });
        hazard.forEach((k) => {
          const [x, y] = k.split(",").map(Number), cx = x * cw + cw / 2, cy = y * ch + ch / 2;
          if (theme === "river") { ctx.fillStyle = "rgba(40,90,120,0.75)"; ctx.fillRect(x * cw, y * ch, cw, ch); return; }
          const f = 0.8 + 0.2 * Math.sin(s * 9 + x * 3 + y);
          ctx.fillStyle = "rgba(229,118,42," + 0.85 * f + ")"; ctx.beginPath(); ctx.moveTo(cx - cw * 0.38, cy + ch * 0.4); ctx.quadraticCurveTo(cx - cw * 0.3, cy - ch * 0.1, cx, cy - ch * 0.48 * f); ctx.quadraticCurveTo(cx + cw * 0.3, cy - ch * 0.1, cx + cw * 0.38, cy + ch * 0.4); ctx.fill();
          ctx.fillStyle = "rgba(255,211,107,0.9)"; ctx.beginPath(); ctx.ellipse(cx, cy + ch * 0.18, cw * 0.14, ch * 0.2 * f, 0, 0, 6.3); ctx.fill();
        });
        const body = (p, lead, i) => {
          const cx = p.x * cw + cw / 2, cy = p.y * ch + ch / 2;
          if (theme === "river" && !lead) { ctx.fillStyle = "#8a5a36"; ctx.strokeStyle = "#2b1609"; ctx.beginPath(); ctx.ellipse(cx, cy, cw * 0.36, ch * 0.26, 0, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#efe2c0"; ctx.beginPath(); ctx.arc(cx + cw * 0.3, cy - ch * 0.12, cw * 0.1, 0, 6.3); ctx.fill(); return; }
          ctx.fillStyle = lead ? "#c8471f" : i % 2 ? "#e9d6ae" : "#d9bf8c"; ctx.strokeStyle = "#2b1609"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, cy - ch * 0.16, Math.min(cw, ch) * (lead ? 0.2 : 0.16), 0, 6.3); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - cw * 0.22, cy + ch * 0.38); ctx.lineTo(cx, cy - ch * 0.02); ctx.lineTo(cx + cw * 0.22, cy + ch * 0.38); ctx.closePath(); ctx.fill(); ctx.stroke();
        };
        strays.forEach((p, i) => { ctx.globalAlpha = 0.75 + 0.25 * Math.sin(s * 4 + i); body(p, false, i); ctx.globalAlpha = 1; });
        for (let i = snake.length - 1; i >= 0; i--) body(snake[i], i === 0, i);
        if (flashT > 0) { ctx.fillStyle = "rgba(200,40,20," + flashT * 0.5 + ")"; ctx.fillRect(0, 0, cv.width, cv.height); }
      }
      draw(0); tally(0);
      const stop = U.loop((s) => {
        const dt = Math.min(0.05, s - last); last = s;
        if (over) return;
        timer += dt; spreadT += dt; flashT = Math.max(0, flashT - dt);
        if (timer >= step) { timer = 0; tick(); }
        if (spreadT >= (t.spread || 3.2)) { spreadT = 0; spread(); }
        draw(s); tally(s);
        if (over) return;
        if (dead >= lives) { over = true; return finish("lose", ["The line broke {d} times.", { d: dead }]); }
        if (s >= LIMIT) { over = true; return finish(followers() >= need ? "close" : "lose", ["Time ran out with {f} still to bring out.", { f: followers() }]); }
      }, host);
      return () => { stop(); off(); };
    });
  };

  // ---------- Rings: turn the rings of a wheel ----------
  // Four rings, each with one opening; turning a ring drags the ring inside it one step the other
  // way. mode "open": line every opening up with the outer one before the wheel turns too often.
  // mode "close": the wheel keeps drifting toward a straight way in; keep at least one ring off it.
  U.games.rings = function (box, done, c) {
    return U.trialFrame(box, done, c, "rings", ({ host, power, t, finish, cue }) => {
      const N = 12, R = [128, 100, 72, 44], mode = t.mode || "open", LIMIT = t.secs || (mode === "open" ? 50 : 32);
      const driftEvery = clamp((mode === "open" ? 6.5 : 2.3) + power * (mode === "open" ? 0.25 : 0.08), mode === "open" ? 6 : 2.1, mode === "open" ? 9 : 3);
      const mod = (n) => ((n % N) + N) % N;
      let gaps, sel = 0, moves = 0, last = 0, drift = 0, over = false;
      if (mode === "open") { gaps = [0, 0, 0, 0].map(() => Math.floor(K.rng() * N)); if (gaps.every((g) => g === gaps[0])) gaps[2] = mod(gaps[2] + 4); }
      else { const g = Math.floor(K.rng() * N); gaps = [g, g, mod(g + 2), mod(g - 2)]; }
      const theme = t.theme || "wheel";
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="ringfield ' + theme + '"><svg viewBox="-150 -150 300 300" role="img" aria-label="' + U.esc(K.tr(theme === "maze" ? "The rings of the forest" : "The rings of the wheel")) + '"></svg></div>' +
        '<p class="game-note" aria-live="polite">' + U.tr(t.help || (mode === "open" ? "Line up every opening with the outer one. Turning a ring drags the ring inside it the other way." : "The wheel keeps turning toward a straight way in. Keep at least one ring out of line.")) + "</p>" +
        '<div class="btnrow ring-btns"></div>';
      const svg = host.querySelector("svg"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const arc = (r, a0, a1) => { const p = (a) => [Math.cos(a) * r, Math.sin(a) * r].map((v) => v.toFixed(1)).join(","); return "M" + p(a0) + " A" + r + "," + r + " 0 0 1 " + p(a1); };
      const aligned = () => gaps.every((g) => g === gaps[0]);
      function draw() {
        let s = "";
        R.forEach((r, i) => {
          for (let k = 0; k < N; k++) {
            if (k === gaps[i]) continue;
            const a0 = (k / N) * Math.PI * 2 - Math.PI / 2 + 0.05, a1 = ((k + 1) / N) * Math.PI * 2 - Math.PI / 2 - 0.05;
            s += '<path class="seg r' + i + (i === sel ? " sel" : "") + '" d="' + arc(r, a0, a1) + '"/>';
          }
          const ga = ((gaps[i] + 0.5) / N) * Math.PI * 2 - Math.PI / 2;
          s += '<circle class="gapdot' + (i === sel ? " sel" : "") + '" cx="' + (Math.cos(ga) * r).toFixed(1) + '" cy="' + (Math.sin(ga) * r).toFixed(1) + '" r="4"/>';
          s += '<circle class="hitring" data-i="' + i + '" r="' + r + '"/>';
        });
        s += '<circle class="core' + (aligned() ? " open" : "") + '" r="20"/>';
        svg.innerHTML = s;
        svg.querySelectorAll(".hitring").forEach((el) => el.addEventListener("pointerdown", (e) => { e.preventDefault(); pick(+el.dataset.i); }));
      }
      const tally = (s) => { score.textContent = K.tr(mode === "open" ? t.tally || "Rings in line: {a} of 4 · Turns: {m} · {s} seconds" : t.tally || "Rings in line: {a} of 4 · Hold for {s} more seconds", { a: gaps.filter((g) => g === gaps[0]).length, m: moves, s: Math.max(0, Math.ceil(LIMIT - s)) }); };
      const pick = (i) => { sel = clamp(i, 0, 3); draw(); };
      const turn = (d) => {
        if (over) return;
        gaps[sel] = mod(gaps[sel] + d);
        if (sel < 3) gaps[sel + 1] = mod(gaps[sel + 1] - d); // the gearing
        moves++; sfx("tap"); cue("act");
        draw(); check();
      };
      function check(s) {
        if (mode === "open" && aligned()) { over = true; cue("good"); sfx("gong"); finish("win", ["The way to the centre opened after {m} turns.", { m: moves }]); }
        if (mode === "close" && aligned()) { over = true; cue("bad"); const frac = (s || 0) / LIMIT; finish(frac >= 0.7 ? "close" : "lose", ["The wheel opened after {s} seconds.", { s: Math.round(s || 0) }]); }
      }
      const row = host.querySelector(".btnrow");
      row.appendChild(U.pressButton(t.outVerb || "Outer ring", () => pick(sel - 1)));
      row.appendChild(U.pressButton(t.inVerb || "Inner ring", () => pick(sel + 1)));
      row.appendChild(U.pressButton("⟲", () => turn(-1)));
      row.appendChild(U.pressButton("⟳", () => turn(1)));
      const off = keyset({ ArrowUp: () => pick(sel - 1), ArrowDown: () => pick(sel + 1), ArrowLeft: () => turn(-1), ArrowRight: () => turn(1), a: () => turn(-1), d: () => turn(1), " ": () => turn(1) });
      draw(); tally(0);
      const stop = U.loop((s) => {
        const dt = Math.min(0.05, s - last); last = s;
        if (over) return;
        drift += dt;
        if (drift >= driftEvery) {
          drift = 0;
          if (mode === "open") { const i = Math.floor(K.rng() * 4); gaps[i] = mod(gaps[i] + (K.rng() < 0.5 ? 1 : -1)); note.textContent = K.tr(t.turns || "The wheel turns."); }
          else {
            // The attackers lean on the ring that is furthest out of line.
            const off = gaps.map((g, i) => ({ i, d: mod(g - gaps[0]) })).filter((x) => x.i && x.d);
            if (off.length) { const x = K.pick(off); gaps[x.i] = mod(gaps[x.i] + (x.d <= N / 2 ? -1 : 1)); note.textContent = K.tr(t.push || "They push, and a ring gives."); }
          }
          sfx("drum"); draw(); check(s);
        }
        tally(s);
        if (!over && s >= LIMIT) { over = true; if (mode === "open") finish(gaps.filter((g) => g === gaps[0]).length >= 3 ? "close" : "lose", "Time ran out before the way opened."); else { cue("good"); finish("win", "The wheel held."); } }
      }, host);
      return () => { stop(); off(); };
    });
  };
})(window.K = window.K || {});
