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
      const later = (ms, f) => timers.push(setTimeout(f, ms / (K.practiceSpeed ? K.practiceSpeed() : 1))); // slower at the practice ground
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
        '<p class="game-note" aria-live="polite">' + U.trSpan(t.help || "Strike as each beat reaches the ring.") + '</p><div class="btnrow"></div>';
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
  // ("chariot" | "boat" | "foot"); trial.obstacles: kinds drawn in code ("rock", "wreck", "wave", "fire").
  // A chariot race against a rival has a whip (twice the speed for a moment, then it recharges) and
  // contact: the rival drifts between lanes, the wheels clash if you steer into them while level,
  // and now and then the rival cuts across you after a warning.
  const OBST = {
    rock: '<svg viewBox="0 0 60 40"><path d="M4 38 Q2 22 14 14 Q24 4 38 8 Q54 12 56 28 Q58 38 50 38 Z" fill="#6f6355" stroke="#2b2219" stroke-width="2"/><path d="M18 20 Q26 14 34 18" stroke="#9c8f7e" stroke-width="2" fill="none"/></svg>',
    wreck: '<svg viewBox="0 0 60 40"><circle cx="20" cy="24" r="14" fill="none" stroke="#3a2416" stroke-width="4"/><path d="M20 10 V38 M6 24 H34 M10 14 L30 34 M30 14 L10 34" stroke="#3a2416" stroke-width="2.5"/><path d="M34 30 L58 22" stroke="#5a3418" stroke-width="5"/></svg>',
    ice: '<svg viewBox="0 0 60 40"><path d="M6 36 L14 10 L24 30 L32 6 L40 28 L50 12 L56 36 Z" fill="#cfe6f2" stroke="#4a6f84" stroke-width="2"/><path d="M14 10 L18 26 M32 6 L34 20" stroke="#ffffff" stroke-width="1.5"/></svg>',
    wave: '<svg viewBox="0 0 60 40"><path d="M2 38 Q10 14 26 12 Q40 10 44 22 Q36 18 32 26 Q46 26 58 38 Z" fill="#3f6f86" stroke="#173544" stroke-width="2"/><path d="M28 16 Q36 14 40 20" stroke="#e8f2f5" stroke-width="2.5" fill="none"/></svg>',
    arrow: '<svg viewBox="0 0 60 40"><path d="M6 20 L56 20" stroke="#3a2412" stroke-width="3"/><path d="M4 20 L16 13 L14 20 L16 27 Z" fill="#9aa3a8" stroke="#2b1609" stroke-width="1.5"/><path d="M48 20 L58 12 M48 20 L58 28 M42 20 L52 12 M42 20 L52 28" stroke="#a3302a" stroke-width="2.5"/></svg>',
    fire: '<svg viewBox="0 0 60 40"><path d="M10 38 Q4 24 16 16 Q14 26 22 26 Q18 12 30 2 Q32 16 40 18 Q40 10 46 8 Q56 22 50 38 Z" fill="#e5762a" stroke="#7a2a10" stroke-width="2"/><path d="M22 38 Q20 30 28 26 Q30 32 36 32 Q38 36 36 38 Z" fill="#ffd36b"/></svg>'
  };
  function vehicleSvg(kind, spec) {
    const fig = U.puppet(spec, { h: 70, pose: "hold" }).replace("<svg ", '<svg x="22" y="-22" width="40" height="70" ');
    // On foot (the climb): only your figure, walking, a bundle on its back.
    if (kind === "foot") return '<svg viewBox="0 0 110 70" class="veh" aria-hidden="true">' + U.puppet(spec, { h: 70, pose: "walk" }).replace("<svg ", '<svg x="30" y="-22" width="52" height="92" ') + '</svg>';
    if (kind === "boat") return '<svg viewBox="0 0 110 70" class="veh" aria-hidden="true">' + fig + '<path d="M4 44 L106 44 Q98 66 70 66 L30 66 Q10 66 4 44 Z" fill="#7a4a24" stroke="#2b1609" stroke-width="2"/><path d="M14 50 H96" stroke="#c8954f" stroke-width="2"/></svg>';
    return '<svg viewBox="0 0 110 70" class="veh" aria-hidden="true"><path d="M78 40 Q86 22 100 20 L106 24 L98 30 Q102 40 96 50 L84 50 Z" fill="#c9a679" stroke="#2b1609" stroke-width="2"/><path d="M80 48 L76 62 M94 48 L98 62" stroke="#2b1609" stroke-width="3"/>' + fig +
      '<path d="M18 44 H70 L66 30 H22 Z" fill="#a3302a" stroke="#2b1609" stroke-width="2"/><path d="M70 40 L84 42" stroke="#2b1609" stroke-width="3"/><g class="wheel"><circle cx="36" cy="52" r="14" fill="none" stroke="#2b1609" stroke-width="4"/><path d="M36 38 V66 M22 52 H50 M26 42 L46 62 M46 42 L26 62" stroke="#2b1609" stroke-width="2"/></g></svg>';
  }
  // Seen from above, for the upright course: the horses ahead, the car, you in it.
  function vehicleTop(kind, rival) {
    // On foot (the climb to the hermitage): your own figure from above, a bundle on its back.
    if (kind === "foot") return '<svg viewBox="0 0 70 120" class="veh" aria-hidden="true"><ellipse cx="35" cy="70" rx="14" ry="22" fill="' + (rival ? "#3d5a8a" : "#a3302a") + '" stroke="#2b1609" stroke-width="2"/><circle cx="35" cy="42" r="11" fill="#2b1609"/><path d="M22 60 L12 84 M48 60 L58 84" stroke="#c9905a" stroke-width="6" stroke-linecap="round"/><rect x="26" y="60" width="18" height="24" rx="4" fill="#6b4a24" stroke="#2b1609" stroke-width="1.5"/></svg>';
    const car = rival ? "#3d5a8a" : "#a3302a", skin = rival ? "#b98656" : "#c9905a";
    if (kind === "boat") return '<svg viewBox="0 0 60 110" class="veh" aria-hidden="true"><path d="M30 2 Q52 30 50 80 Q48 104 30 108 Q12 104 10 80 Q8 30 30 2Z" fill="#7a4a24" stroke="#2b1609" stroke-width="2.5"/><path d="M30 14 Q44 36 42 80 Q40 96 30 98 Q20 96 18 80 Q16 36 30 14Z" fill="#a8703f"/><path d="M8 58 L-6 66 M52 58 L66 66" stroke="#2b1609" stroke-width="3"/><circle cx="30" cy="66" r="8" fill="' + skin + '" stroke="#2b1609" stroke-width="2"/><circle cx="30" cy="62" r="4" fill="#1d120b"/></svg>';
    return '<svg viewBox="0 0 70 120" class="veh" aria-hidden="true"><g fill="#c9a679" stroke="#2b1609" stroke-width="2"><ellipse cx="22" cy="26" rx="8" ry="18"/><ellipse cx="48" cy="26" rx="8" ry="18"/><ellipse cx="22" cy="7" rx="5" ry="7"/><ellipse cx="48" cy="7" rx="5" ry="7"/></g><path d="M35 40 V62 M22 42 L35 62 M48 42 L35 62" stroke="#2b1609" stroke-width="2.5"/><rect x="4" y="74" width="8" height="30" rx="3" fill="#2b1609"/><rect x="58" y="74" width="8" height="30" rx="3" fill="#2b1609"/><rect x="12" y="62" width="46" height="46" rx="8" fill="' + car + '" stroke="#2b1609" stroke-width="2.5"/><circle cx="35" cy="88" r="10" fill="' + skin + '" stroke="#2b1609" stroke-width="2"/><circle cx="35" cy="83" r="5" fill="#1d120b"/></svg>';
  }
  // A leather chariot from above (quality review 23), in its own units (80 × 150), facing up the
  // course: two horses on a yoke, the pole back to a railed car in the driver's colours, the driver
  // at the reins, wheels whose spoke ends run past, a pennant at the back. Everything that moves has
  // a class the race's clock drives (see chariotParts and drawChariot).
  const OUT = 'stroke="#24120a" stroke-width="1.3" stroke-linejoin="round"';
  function horse(cx, coat, mane) {
    return '<g class="horse" transform="translate(' + cx + ' 0)">' +
      // legs, under the body: front pair and hind pair, moved by the gallop
      '<path class="lf1" d="M-7 22 l-4 6" stroke="' + coat + '" stroke-width="3.4" stroke-linecap="round"/><path class="lf2" d="M7 22 l4 6" stroke="' + coat + '" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path class="lh1" d="M-7 46 l-4 6" stroke="' + coat + '" stroke-width="3.6" stroke-linecap="round"/><path class="lh2" d="M7 46 l4 6" stroke="' + coat + '" stroke-width="3.6" stroke-linecap="round"/>' +
      '<path class="tail" d="M0 54 Q-3 62 0 70 Q3 62 0 54 Z" fill="' + mane + '" ' + OUT + "/>" +
      '<path d="M0 14 C9 14 10 24 9.5 34 C9 46 7 56 0 57 C-7 56 -9 46 -9.5 34 C-10 24 -9 14 0 14 Z" fill="' + coat + '" ' + OUT + "/>" +
      '<path d="M0 14 C9 14 10 24 9.5 34 C9 46 7 56 0 57 C-7 56 -9 46 -9.5 34 C-10 24 -9 14 0 14 Z" fill="url(#rc-dots)"/>' +
      '<path d="M-4 3 Q0 -6 4 3 L4 16 Q0 18 -4 16 Z" fill="' + coat + '" ' + OUT + "/>" + // neck and head
      '<path d="M-3.4 -1 l-1.6 -4 l2.6 2.4 M3.4 -1 l1.6 -4 l-2.6 2.4" fill="' + coat + '" ' + OUT + "/>" + // ears
      '<path d="M0 1 Q-2.6 8 0 16 Q2.6 8 0 1 Z" fill="' + mane + '"/>' +
      '<path d="M-9.4 26 Q0 22 9.4 26" fill="none" stroke="#d9a53a" stroke-width="2.6"/><path d="M-9.4 26 Q0 22 9.4 26" fill="none" stroke="#24120a" stroke-width=".6" stroke-dasharray="1 2.2"/>' + // breast band
      '<path d="M-8 38 Q0 41 8 38" fill="none" stroke="#b2432a" stroke-width="2.4"/>' + // saddle cloth band
      "</g>";
  }
  // palette: [skin, cloth, trim] as a puppet's; horses: [coat, mane]; crown: a gold crown on the driver.
  function chariotSvg(palette, horses, crown) {
    const [skin, cloth, trim] = palette, [coat, mane] = horses;
    return '<svg viewBox="0 0 80 150" aria-hidden="true"><defs><pattern id="rc-dots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".7" fill="#fff3d0" opacity=".55"/></pattern></defs>' +
      '<g class="front">' + horse(24, coat, mane) + horse(56, coat, mane) +
        '<path d="M12 31 Q40 25 68 31" fill="none" stroke="#5a3418" stroke-width="3.2" stroke-linecap="round"/><path d="M14 30.4 Q40 24.6 66 30.4" fill="none" stroke="#d9a53a" stroke-width="1.2" stroke-dasharray="2 2"/>' + // the yoke
      "</g>" +
      '<path class="pole" d="M40 29 L40 80" stroke="#5a3418" stroke-width="3" stroke-linecap="round"/>' +
      '<g class="body">' +
        // wheels, seen edge on: dark tyres with spoke ends that run past as they turn
        '<rect x="3" y="80" width="9" height="40" rx="4.5" fill="#3a2412" ' + OUT + '/><path class="spokes" data-x="3" stroke="#c9a66b" stroke-width="1.4"/>' +
        '<rect x="68" y="80" width="9" height="40" rx="4.5" fill="#3a2412" ' + OUT + '/><path class="spokes" data-x="68" stroke="#c9a66b" stroke-width="1.4"/>' +
        '<path d="M12 100 H68" stroke="#3a2412" stroke-width="3"/>' + // axle
        '<path d="M16 82 Q40 72 64 82 L64 114 Q40 120 16 114 Z" fill="#8a5a2c" ' + OUT + "/>" + // the car's floor and rail
        '<path d="M20 86 Q40 78 60 86 L60 111 Q40 116 20 111 Z" fill="' + cloth + '" ' + OUT + '/><path d="M20 86 Q40 78 60 86 L60 111 Q40 116 20 111 Z" fill="url(#rc-dots)"/>' +
        '<path d="M20 86 Q40 78 60 86" fill="none" stroke="' + trim + '" stroke-width="2"/><path d="M22 108 Q40 113 58 108" fill="none" stroke="' + trim + '" stroke-width="1.6"/>' +
        // the driver from above: shoulders, arms forward to the reins, head with its knot; the whip arm
        '<path d="M27 98 Q40 90 53 98 Q40 104 27 98 Z" fill="' + skin + '" ' + OUT + "/>" +
        '<path d="M29 97 L34 86" stroke="' + skin + '" stroke-width="3.6" stroke-linecap="round"/><path class="armR" d="M51 97 L46 86" stroke="' + skin + '" stroke-width="3.6" stroke-linecap="round"/>' +
        '<g class="lash" opacity="0"><path d="M51 97 L60 84" stroke="' + skin + '" stroke-width="3.6" stroke-linecap="round"/><path class="cord" d="M60 84 Q72 60 58 30" fill="none" stroke="#3d2412" stroke-width="1.2" stroke-linecap="round"/></g>' +
        '<circle cx="40" cy="96" r="6.2" fill="#1d1410" ' + OUT + '/><circle cx="40" cy="94.5" r="2.8" fill="#1d1410" stroke="' + trim + '" stroke-width="1"/>' +
        (crown ? '<path d="M37 92 l1.4 -4 l1.6 3 l1.6 -3 l1.4 4 Z" fill="#d9a53a" ' + OUT + "/>" : "") +
        // the pennant on its staff at the back
        '<path d="M60 116 L60 132" stroke="#5a3418" stroke-width="1.8"/><path class="pennant" d="M60 132 Q66 136 72 133 Q68 138 74 142 Q66 141 60 138 Z" fill="' + trim + '" ' + OUT + "/>" +
      "</g>" +
      // the reins, drawn last so they ride over everything, from the hands to the horses' heads
      '<path class="rein1" d="M34 86 Q30 60 24 8" fill="none" stroke="#efe2c0" stroke-width=".9"/><path class="rein2" d="M46 86 Q50 60 56 8" fill="none" stroke="#efe2c0" stroke-width=".9"/>' +
      "</svg>";
  }
  // Handles for the moving parts, and the springs that move them: x across the course (in the
  // upright course's percent), the turn (from the sideways speed), rearing and a sideways jolt.
  function chariotParts(el, x) {
    const s = el.querySelector("svg"), q = (c) => s.querySelector("." + c);
    return { front: q("front"), body: q("body"), pole: q("pole"), r1: q("rein1"), r2: q("rein2"), pennant: q("pennant"), lash: q("lash"), cord: q("cord"), armR: q("armR"),
      legs: [...s.querySelectorAll(".horse")].map((h) => ({ lf1: h.querySelector(".lf1"), lf2: h.querySelector(".lf2"), lh1: h.querySelector(".lh1"), lh2: h.querySelector(".lh2"), tail: h.querySelector(".tail") })),
      spokes: [...s.querySelectorAll(".spokes")], crack: 0, x, vx: 0, turn: 0, turnV: 0, rear: 0, rearV: 0, jolt: 0, joltV: 0, ph: K.rng() * 6 };
  }
  function chariotSprings(p, target, dt) {
    const k = 140, c = 2 * 0.78 * Math.sqrt(k);
    p.vx += (-k * (p.x - target) - c * p.vx) * dt; p.x += p.vx * dt;
    const want = clamp(p.vx / 60, -1.2, 1.2);
    p.turnV += (-260 * (p.turn - want) - 2 * 0.6 * Math.sqrt(260) * p.turnV) * dt; p.turn += p.turnV * dt;
    p.rearV += (-300 * p.rear - 2 * 0.35 * Math.sqrt(300) * p.rearV) * dt; p.rear += p.rearV * dt;
    p.joltV += (-320 * p.jolt - 2 * 0.3 * Math.sqrt(320) * p.joltV) * dt; p.jolt += p.joltV * dt;
  }
  function drawChariot(p, dt, speed, time) {
    p.ph += dt * speed * 3.4;
    const g = p.ph;
    // The horses gallop, their tails stream (and swing out of a turn).
    p.legs.forEach((L, i) => {
      const o = i * 0.9, a = Math.sin(g + o) * 5, b = Math.sin(g + o + Math.PI) * 5;
      L.lf1.setAttribute("d", "M-7 22 l-4 " + (6 + a).toFixed(2)); L.lf2.setAttribute("d", "M7 22 l4 " + (6 + b).toFixed(2));
      L.lh1.setAttribute("d", "M-7 46 l-4 " + (6 + b).toFixed(2)); L.lh2.setAttribute("d", "M7 46 l4 " + (6 + a).toFixed(2));
      const tw = Math.sin(time * 9 + i) * 4 - p.turn * 1.5;
      L.tail.setAttribute("d", "M0 54 Q" + (-3 + tw * 0.5).toFixed(2) + " 62 " + tw.toFixed(2) + " 72 Q" + (3 + tw * 0.5).toFixed(2) + " 62 0 54 Z");
    });
    // Spoke ends running past along each tyre.
    const off = (p.ph * 6) % 8;
    for (const sp of p.spokes) {
      const x = +sp.dataset.x; let d = "";
      for (let y = 82 + off; y < 119; y += 8) d += "M" + (x + 1.5) + " " + y.toFixed(1) + " h6 ";
      sp.setAttribute("d", d);
    }
    // The whip: the right hand leaves the reins, the lash curls out over the horses and cracks.
    if (p.crack > 0) {
      p.crack -= dt; const k = 1 - Math.max(0, p.crack) / 0.32, curl = Math.sin(k * Math.PI);
      p.lash.setAttribute("opacity", 1); p.armR.setAttribute("opacity", 0);
      p.cord.setAttribute("d", "M60 84 Q" + (74 - curl * 10).toFixed(1) + " " + (62 - k * 14).toFixed(1) + " " + (58 - curl * 16).toFixed(1) + " " + (34 - k * 22).toFixed(1));
    } else { p.lash.setAttribute("opacity", 0); p.armR.setAttribute("opacity", 1); }
    const fl = Math.sin(time * 14) * 2.2 - p.turn * 0.6;
    p.pennant.setAttribute("d", "M60 132 Q" + (66 + fl * 0.3).toFixed(2) + " " + (136 + fl).toFixed(2) + " " + (72 + fl * 0.4).toFixed(2) + " " + (133 + fl * 0.6).toFixed(2) + " Q68 138 " + (74 + fl * 0.3).toFixed(2) + " " + (142 + fl * 0.5).toFixed(2) + " Q66 141 60 138 Z");
    // The horses lead into the turn; the car swings after them about the hitch on the pole.
    const lead = p.turn, lag = p.turn * 0.45 + p.jolt;
    p.front.setAttribute("transform", "translate(0 " + (-p.rear).toFixed(2) + ") rotate(" + (lead * 11).toFixed(2) + " 40 34)");
    p.pole.setAttribute("transform", "rotate(" + (lead * 6).toFixed(2) + " 40 80)");
    p.body.setAttribute("transform", "rotate(" + (lag * 9).toFixed(2) + " 40 80)");
    const hx = Math.sin(lead * 11 * Math.PI / 180) * 66;
    p.r1.setAttribute("d", "M34 86 Q30 60 " + (24 + hx * 0.4).toFixed(1) + " " + (8 - p.rear).toFixed(1)); p.r2.setAttribute("d", "M46 86 Q50 60 " + (56 + hx * 0.4).toFixed(1) + " " + (8 - p.rear).toFixed(1));
  }

  // The race's rules, apart from how it is drawn: the race on screen and the balance check
  // (tests/race_balance.js) both run on these. Distances are in percent of the course.
  const RACE = {
    LEN: 100,
    HIT_SLOW: 1.1,                 // a hit: half speed for this long (s)
    WHIP: 1.5, WHIP_COOL: 6,       // the whip: twice the speed for 1.5 s, then 6 s to recharge
    LEVEL: 2.6, TOUCH: 1.8,        // how close counts as level (the rival may cut across), and as touching
    WARN: 0.7, CUT_GAP: 4.5,       // a cut across you: its warning, and the least time between tries (s)
    CUT_RATE: 0.7,                 // how often a cut comes when one could (per second)
    RAM: 0.45,                     // contact this soon after a cut is a ram (s)
    CLASH_SLOW: 0.8, RAIL_SLOW: 1.1, CLASH_GAP: 1, BOUNCE: 0.14,
    WANDER: 2.5, WANDER_MORE: 3,   // the rival changes lane every 2.5 to 5.5 s
    // The rival's speed before the stats. With the whip (twice the speed for a fifth of the time) a
    // chariot rival must be faster for the race to stay as hard as it was: see tests/race_balance.js.
    RIVAL: 3.25, RIVAL_CONTACT: 3.5,
    // A chariot duel (content/war_fights.js): a bow shot when level with the rival (twice the reach of
    // level), which slows him and knocks him back; contact you steer into knocks him back too.
    BOW_COOL: 2.2, BOW_REACH: 2.2, BOW_SLOW: 1.2, BOW_BACK: 3, KNOCK: 4
  };
  U.RACE = RACE;
  U.raceSetup = function (t, power) {
    const chariot = !t.vehicle || t.vehicle === "chariot", rival = !!t.rival, contact = chariot && rival;
    const r0 = t.rivalSpeed || (contact ? RACE.RIVAL_CONTACT : RACE.RIVAL);
    return {
      base: t.speed || 3.3, gap: clamp(1.25 - power * 0.04, 0.8, 1.25), // seconds between obstacles
      rivalV: rival ? clamp(r0 - power * 0.03, r0 - 0.5, r0 + 0.15) : 0,
      rival, lives: t.hull || 3, kinds: t.obstacles || ["rock", "wreck"], chariot, whip: contact, contact,
      bow: contact && !!t.bow, knock: contact && !!t.knock, turn: t.turn || 3, shield: !!t.shield // a chariot duel's bow and knocks; arrows to catch
    };
  };
  // step(dt) moves the race on and returns what happened: spawn, hit, gone, warn, cut, wander,
  // bounce, clash (how: "clash", "ram" or "rails") and end (outcome, line).
  U.raceRules = function (o, rng) {
    const C = RACE, pick = (a) => a[Math.floor(rng() * a.length)];
    const R = { lane: 1, dist: 0, rival: 0, slow: 0, hits: 0, spawnIn: 1.2, t: 0, obs: [], boost: 0, cool: 0, over: false,
      rLane: 0, rSlow: 0, rWander: 3, cut: 0, cutTo: 0, cutFrom: 0, cutT: -9, cutCool: 3, clashCool: 0, prevLane: 1, bounceIn: 0, bounceTo: 1,
      turned: 0, bowCool: 0, caught: 0, miss: 0 };
    R.speed = () => (R.over ? 0 : o.base * (R.slow > 0 ? 0.5 : 1) * (R.boost > 0 ? 2 : 1));
    R.move = (d) => { if (R.over) return false; R.prevLane = R.lane; R.lane = clamp(R.lane + d, 0, 2); return true; };
    // The bow (a chariot duel): "hit" when level with the rival, "far" when not; null while it recharges.
    R.inReach = () => o.bow && Math.abs(R.rival - R.dist) < C.LEVEL * C.BOW_REACH;
    R.shoot = () => {
      if (!o.bow || R.over || R.bowCool > 0) return null;
      R.bowCool = C.BOW_COOL;
      if (!R.inReach()) return "far";
      R.rSlow = C.BOW_SLOW; R.rival -= C.BOW_BACK; R.turned++;
      return "hit";
    };
    R.whip = () => { if (!o.whip || R.over || R.boost > 0 || R.cool > 0) return false; R.boost = C.WHIP; R.cool = C.WHIP + C.WHIP_COOL; return true; };
    R.step = (dt) => {
      const ev = [], at = (type, x) => ev.push(Object.assign({ type }, x));
      if (R.over) return ev;
      R.t += dt;
      const v = R.speed();
      if (R.boost > 0) R.boost -= dt;
      if (R.cool > 0) R.cool -= dt;
      if (R.slow > 0) R.slow -= dt;
      if (R.rSlow > 0) R.rSlow -= dt;
      if (R.bowCool > 0) R.bowCool -= dt;
      R.dist += v * dt;
      if (o.rival) R.rival += o.rivalV * (R.rSlow > 0 ? 0.5 : 1) * dt * (0.94 + 0.12 * Math.sin(R.t * 0.7));
      if (o.contact) {
        // The rival drifts between lanes, and now and then cuts across you when you are level.
        const diff = R.rival - R.dist, level = Math.abs(diff) < C.LEVEL;
        if (R.cutCool > 0) R.cutCool -= dt;
        if (R.clashCool > 0) R.clashCool -= dt;
        if (R.bounceIn > 0) { R.bounceIn -= dt; if (R.bounceIn <= 0) { R.prevLane = R.lane; R.lane = R.bounceTo; at("bounce"); } }
        if (R.cut > 0) {
          R.cut -= dt;
          if (R.cut <= 0) { R.cutFrom = R.rLane; R.rLane = R.cutTo; R.cutT = R.t; at("cut"); }
        } else if (level && Math.abs(R.rLane - R.lane) === 1 && R.cutCool <= 0 && rng() < dt * C.CUT_RATE) {
          R.cut = C.WARN; R.cutTo = R.lane; R.cutCool = C.CUT_GAP; at("warn", { side: Math.sign(R.lane - R.rLane) });
        } else if ((R.rWander -= dt) <= 0) {
          R.rWander = C.WANDER + rng() * C.WANDER_MORE;
          const opts = [R.rLane - 1, R.rLane + 1].filter((l) => l >= 0 && l <= 2 && !(level && l === R.lane));
          if (opts.length) { R.rLane = pick(opts); at("wander"); }
        }
        // Contact: the same lane, level with each other. Both lose ground; you bounce back, or if he
        // has just cut across you, you are shoved a lane aside, or into the rails at the edge.
        if (R.clashCool <= 0 && R.rLane === R.lane && Math.abs(diff) < C.TOUCH) {
          let how = "clash";
          if (R.t - R.cutT < C.RAM) {
            const to = R.lane + (Math.sign(R.lane - R.cutFrom) || 1);
            if (to >= 0 && to <= 2) { R.prevLane = R.lane; R.lane = to; how = "ram"; } else { R.slow = Math.max(R.slow, C.RAIL_SLOW); how = "rails"; }
          } else { R.bounceTo = R.prevLane !== R.lane ? R.prevLane : R.lane < 2 ? R.lane + 1 : R.lane - 1; R.bounceIn = C.BOUNCE; }
          R.slow = Math.max(R.slow, C.CLASH_SLOW); R.rSlow = C.CLASH_SLOW; R.boost = 0; R.clashCool = C.CLASH_GAP; R.cut = 0;
          // In a duel, steering into him is a blow: he is knocked back off the line, and you keep most of your pace.
          if (o.knock && how === "clash") { R.rival -= C.KNOCK; R.rSlow = C.CLASH_SLOW * 2; R.slow = Math.min(R.slow, 0.3); R.turned++; how = "knock"; }
          at("clash", { how });
        }
      }
      // What is in the road comes toward you, twice as fast under the whip; never all three lanes at once.
      R.spawnIn -= R.boost > 0 ? dt * 2 : dt;
      if (R.spawnIn <= 0 && R.dist < C.LEN - 6) {
        R.spawnIn = o.gap * (0.75 + rng() * 0.6);
        const taken = R.obs.filter((ob) => ob.x > 80).map((ob) => ob.lane), free = [0, 1, 2].filter((l) => !taken.includes(l));
        if (o.shield && R.obs.some((ob) => !ob.hit)) R.spawnIn = 0.3; // arrows to catch come one at a time
        else if (free.length > 1 || !taken.length) { const ob = { lane: pick(free.length ? free : [0, 1, 2]), kind: pick(o.kinds), x: 104 }; R.obs.push(ob); at("spawn", { o: ob }); }
      }
      for (let i = R.obs.length - 1; i >= 0; i--) {
        const ob = R.obs[i];
        ob.x -= v * dt * 13;
        // Arrows to catch (trial.shield): in your lane you take one on your shield; in another, it gets past you.
        if (o.shield) { if (!ob.hit && ob.x < 26 && ob.x > 8) { ob.hit = true; if (ob.lane === R.lane) { R.caught++; at("catch", { o: ob }); } else { R.miss++; at("miss", { o: ob }); } } }
        else if (!ob.hit && ob.lane === R.lane && ob.x < 26 && ob.x > 8) { ob.hit = true; R.hits++; R.slow = C.HIT_SLOW; R.boost = 0; at("hit", { o: ob }); }
        if (ob.x < -12) { R.obs.splice(i, 1); at("gone", { o: ob }); }
      }
      const end = (outcome, line) => { R.over = true; R.outcome = outcome; at("end", { outcome, line }); };
      if (o.shield) {
        if (R.miss >= o.lives) end("lose", ["{m} arrows got past you.", { m: R.miss }]);
        else if (R.dist >= C.LEN) end(R.miss <= o.lives - 2 ? "win" : "close", ["You caught {c} arrows; {m} got past.", { c: R.caught, m: R.miss }]);
        return ev;
      }
      if (o.bow && R.turned >= o.turn) end("win", ["You turned {who} away.", { who: o.who }]);
      else if (!o.rival && R.hits >= o.lives) end("lose", ["You took {h} hits.", { h: R.hits }]);
      else if (R.dist >= C.LEN) {
        if (!o.rival) end(R.hits <= o.lives - 2 ? "win" : "close", ["Through, with {h} hits.", { h: R.hits }]);
        else end(R.rival < C.LEN ? "win" : "close", ["You finished {gap} lengths {where}.", { gap: Math.abs(Math.round(R.dist - R.rival)), where: R.rival < C.LEN ? "ahead" : "behind" }]);
      } else if (o.rival && R.rival >= C.LEN && R.dist < C.LEN - 6) end("lose", ["{who} finished first.", { who: o.who }]);
      return ev;
    };
    return R;
  };

  U.games.race = function (box, done, c) {
    return U.trialFrame(box, done, c, "race", ({ host, power, t, finish, cue, onAct }) => {
      const o = Object.assign(U.raceSetup(t, power), { who: t.rival }), R = U.raceRules(o, K.rng), hullMode = !o.rival, base = o.base;
      const chariot = o.chariot, still = U.calm();
      let last = 0, scroll = 0;
      const stage = K.val(t.stage);
      host.innerHTML = '<p class="score" aria-live="polite"></p>' +
        '<div class="track"><div class="bgstrip">' + (stage ? [0, 1, 2, 3].map((i) => '<i style="background-image:url(\'' + U.artUrl(stage) + '\')"' + (i % 2 ? ' class="flip"' : "") + "></i>").join("") : "") + '</div><div class="lanes"><i></i><i></i><i></i></div><div class="obs"></div>' +
        '<div class="me' + (chariot ? " chariot" : " lane1") + '">' + (chariot ? "" : vehicleSvg(t.vehicle, K.puppetSpec(K.S))) + "</div>" + (o.whip ? '<span class="speedx" hidden>×2</span>' : "") + "</div>" +
        '<div class="progress"><span class="pm" style="left:0"></span>' + (t.rival ? '<span class="pr" style="left:0" title="' + U.esc(K.tr(t.rival)) + '"></span>' : "") + "</div>" +
        '<p class="game-note" aria-live="polite">' + U.trSpan(t.help || (o.whip ? "Change lanes to miss what is in the road: up and down, or the buttons. Space cracks the whip." : "Change lanes to miss what is in the road: up and down, or the buttons.")) + '</p><div class="btnrow race-btns"></div>';
      const track = host.querySelector(".track"), me = host.querySelector(".me"), obsBox = host.querySelector(".obs"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const pm = host.querySelector(".pm"), pr = host.querySelector(".pr"), speedTag = host.querySelector(".speedx");
      // A line under the course; a passing one (a hit, his warning, a clash) goes again after a moment.
      let sayT = 0;
      const say = (key, p, ms) => { U.trLabel(note, key, p); clearTimeout(sayT); if (ms) sayT = setTimeout(() => { if (!R.over && note.dataset.tr === key) { note.textContent = ""; delete note.dataset.tr; delete note.dataset.trp; } }, ms); };
      // On an upright screen, inside the painting: the course runs up the tall painting, which
      // scrolls down past you; you steer left and right between three lanes, seen from above.
      const tallKey = (t.stageTall && U.tallOf && U.tallOf(t.stageTall)) || (U.tallOf && U.tallOf(stage)); // a war painting is seen side on; upright, the course runs over one seen from above
      const vertical = !!(host.closest(".trial.immersive") && U.upright() && tallKey);
      let rivalEl = null, ME = null, RV = null;
      // Upright, the rival runs ahead of you up the course or drops behind you down it, but always stays
      // on it, at its top or foot when far ahead or far behind (his lead is on the bar below).
      const rivalTop = (diff) => "clamp(4px, " + clamp(70 - diff * 6, -30, 130).toFixed(2) + "%, calc(100% - 104px))";
      if (vertical) {
        track.classList.add("vertical");
        track.style.backgroundImage = "url('" + U.artUrl(tallKey) + "')";
        if (!chariot) me.innerHTML = vehicleTop(t.vehicle);
        if (t.rival && !chariot) { rivalEl = U.el('<div class="rivalcar lane0">' + vehicleTop(t.vehicle, true) + "</div>"); track.appendChild(rivalEl); }
      }
      // The chariots: yours in your own colours with dun horses; the rival's in theirs, Karna's in gold
      // with white horses. On the course seen from the side they are turned to face along it.
      const LANEX = [32, 50, 68]; // lane centres across the course, in the upright course's percent
      if (chariot) {
        const mine = K.puppetSpec(K.S), spec = (K.PUPPETS && t.cast && K.PUPPETS[t.cast[0]]) || null;
        const karna = /karna/i.test(String(K.val(t.rival) || "")) || (t.cast || [])[0] === "karna";
        const pal = o.contact ? (karna ? K.PUPPETS.karna.palette : (spec && spec.palette) || ["#b9733f", "#3f6b3a", "#d9c27a"]) : null;
        // If your colours are close to your rival's, your car takes your trim colour and his stays his.
        let myPal = (mine && mine.palette) || ["#c98a52", "#2d5aa0", "#e2b55a"];
        const rgb = (h) => [1, 3, 5].map((i) => parseInt(String(h).slice(i, i + 2), 16) || 0);
        if (pal && Math.hypot(...rgb(myPal[1]).map((v, i) => v - rgb(pal[1])[i])) < 90) myPal = [myPal[0], myPal[2], myPal[1]];
        me.innerHTML = '<span class="rc">' + chariotSvg(myPal, ["#c9a679", "#3a2412"], false) + "</span>";
        ME = chariotParts(me, LANEX[R.lane]);
        if (o.contact) {
          rivalEl = U.el('<div class="rivalcar chariot"><span class="warnmark" aria-hidden="true">!</span><span class="rc">' + chariotSvg(pal, karna ? ["#e9dcc0", "#8a6a3a"] : ["#8e5a34", "#2a1a0c"], karna || !!(spec && spec.headgear === "kirita")) + "</span></div>");
          track.appendChild(rivalEl);
          RV = chariotParts(rivalEl, LANEX[R.rLane]);
        }
      }
      // The painting scrolls past, each copy mirrored against the last so the joins never show.
      const strip = host.querySelector(".bgstrip"), aspect = U.stageInfo(stage).side ? 2560 / 720 : 16 / 9;
      let tileW = 0, geo = null;
      const size = () => {
        tileW = track.clientHeight * aspect; strip.querySelectorAll("i").forEach((el) => { el.style.width = tileW + "px"; });
        track.style.setProperty("--H", track.clientHeight + "px");
        geo = { w: track.clientWidth, meLeft: me.offsetLeft, len: me.offsetWidth, rlen: rivalEl ? rivalEl.offsetWidth : 0 };
      };
      size();
      window.addEventListener("resize", size);
      // Across the course: the upright course's percent of its width; on the course seen from the side,
      // the same lanes as a percent of its height.
      const across = (x) => (vertical ? x : 50 + (x - 50) * (100 / 3) / 18);
      // A point on a chariot in its own frame (u across, -1 left to 1 right; v along, 0 front to 1
      // back), in pixels on the track.
      const onCar = (el, u, v) => vertical
        ? { x: el.offsetLeft + el.offsetWidth * (0.5 + u / 2), y: el.offsetTop + el.offsetHeight * v }
        : { x: el.offsetLeft + el.offsetWidth * (1 - v), y: el.offsetTop + el.offsetHeight * (0.5 + u / 2) };
      // Dust thrown back from the wheels, and sparks where wheels clash.
      const dust = (at, n, spread) => {
        if (still || !track.animate) return;
        for (let i = 0; i < n; i++) {
          const d = document.createElement("i"); d.className = "rdust"; d.style.left = at.x + "px"; d.style.top = at.y + "px";
          track.insertBefore(d, obsBox);
          const s = 1 + K.rng() * spread, side = (K.rng() - 0.5) * 30 * spread, back = 40 + K.rng() * 50;
          const dx = vertical ? side : -back, dy = vertical ? back : side;
          d.animate([{ transform: "translate(0,0) scale(.6)", opacity: 0.9 }, { transform: "translate(" + dx + "px," + dy + "px) scale(" + (2 + s) + ")", opacity: 0 }], { duration: 650 + K.rng() * 350, easing: "ease-out" }).onfinish = () => d.remove();
        }
      };
      const sparks = (at, n) => {
        if (still || !track.animate) return;
        for (let i = 0; i < n; i++) {
          const s = document.createElement("i"); s.className = "rspark"; s.style.left = at.x + "px"; s.style.top = at.y + "px"; track.appendChild(s);
          const a = K.rng() * 6.28, d = 20 + K.rng() * 45;
          s.animate([{ transform: "translate(0,0)", opacity: 1 }, { transform: "translate(" + Math.cos(a) * d + "px," + (Math.sin(a) * d - 10) + "px)", opacity: 0 }], { duration: 380 + K.rng() * 260, easing: "ease-out" }).onfinish = () => s.remove();
        }
      };
      const bump = () => { track.classList.remove("bump"); void track.offsetWidth; track.classList.add("bump"); };
      // Steering. A chariot's horses lead into the turn on springs; the boat and the walker lean
      // into it, then right themselves.
      let leanT = 0;
      const move = (d) => {
        if (!R.move(d)) return;
        if (!chariot) { me.className = "me lane" + R.lane + (d < 0 ? " lean-u" : " lean-d"); clearTimeout(leanT); leanT = setTimeout(() => { me.className = "me lane" + R.lane; }, 320); }
        cue("act");
      };
      // The whip: you crack it over the horses, they stretch into a full gallop and the dust thickens.
      const whip = () => {
        if (!R.whip()) return;
        cue("act"); sfx("quill");
        if (!still) { ME.crack = 0.32; ME.rearV += 26; dust(onCar(me, 0, 0.8), 6, 2); }
      };
      const row = host.querySelector(".btnrow");
      row.appendChild(U.pressButton(vertical ? "Left" : t.upVerb || "Up", () => move(-1)));
      let whipBtn = null;
      if (o.whip) {
        whipBtn = U.pressButton("Whip ×2", whip);
        whipBtn.classList.add("whip", "ready");
        whipBtn.insertAdjacentHTML("beforeend", '<kbd aria-hidden="true">' + U.trSpan("Space") + "</kbd>");
        row.appendChild(whipBtn);
        onAct(whip);
      }
      row.appendChild(U.pressButton(vertical ? "Right" : t.downVerb || "Down", () => move(1)));
      // The bow (a chariot duel): it answers only when you are level with him, and then needs a moment.
      let bowBtn = null;
      const shoot = () => {
        const r = R.shoot();
        if (!r) return;
        cue("act"); sfx("quill");
        if (r === "far") return say("Out of reach. Draw level with {who} first.", { who: K.tr(t.rival) }, 1400);
        sfx("hit"); cue("good"); say("Your arrow strikes {who}'s car. He falls back.", { who: K.tr(t.rival) }, 1400);
        if (!still) { const b = onCar(rivalEl, 0, 0.6); sparks(b, 10); RV.joltV += 12; RV.rearV += 30; }
      };
      if (o.bow) { bowBtn = U.pressButton("Shoot", shoot); bowBtn.classList.add("bow"); bowBtn.insertAdjacentHTML("beforeend", '<kbd aria-hidden="true">F</kbd>'); row.appendChild(bowBtn); }
      const whipKeys = Object.assign(o.whip && vertical ? { ArrowUp: whip, w: whip, W: whip } : {}, o.bow ? { f: shoot, F: shoot } : {});
      const off = vertical
        ? keyset(Object.assign({ ArrowLeft: () => move(-1), ArrowRight: () => move(1), a: () => move(-1), d: () => move(1), A: () => move(-1), D: () => move(1) }, whipKeys))
        : keyset(Object.assign({ ArrowUp: () => move(-1), ArrowDown: () => move(1), w: () => move(-1), s: () => move(1), W: () => move(-1), S: () => move(1) }, o.bow ? { f: shoot, F: shoot } : {}));
      if (vertical) say(t.helpSide || "Steer left and right to miss what is in the road.");
      // Swipe (up and down, or left and right on the upright course), or tap the side to move to.
      let y0 = null, x0 = null;
      track.addEventListener("pointerdown", (e) => { y0 = e.clientY; x0 = e.clientX; });
      track.addEventListener("pointerup", (e) => {
        if (y0 == null) return;
        const r = track.getBoundingClientRect();
        if (vertical) { if (Math.abs(e.clientX - x0) > 18) move(e.clientX < x0 ? -1 : 1); else move(e.clientX < r.left + r.width / 2 ? -1 : 1); }
        else if (Math.abs(e.clientY - y0) > 18) move(e.clientY < y0 ? -1 : 1); else move(e.clientY < r.top + r.height / 2 ? -1 : 1);
        y0 = x0 = null;
      });
      const tally = () => { const p = { d: Math.floor(R.dist), h: R.hits, l: o.lives, r: Math.floor(R.rival), who: K.tr(t.rival), c: R.caught, m: R.miss, n: R.turned, k: o.turn }; score.textContent = K.tr(t.tally || (hullMode ? "Distance: {d}% · Hits: {h} of {l}" : "You: {d}% · {who}: {r}%"), p); };
      const els = new Map();
      let dustT = 0;
      const stop = U.loop((s) => {
        const dt = Math.min(0.05, s - last); last = s;
        if (R.over) return;
        const v = R.speed();
        for (const e of R.step(dt)) {
          if (e.type === "spawn") { const el = U.el('<div class="ob lane' + e.o.lane + " ob-" + e.o.kind + '">' + OBST[e.o.kind] + "</div>"); obsBox.appendChild(el); els.set(e.o, el); }
          else if (e.type === "catch") { const el = els.get(e.o); if (el) el.classList.add("hit"); sfx("clang"); cue("good"); say(t.caught || "You take the arrow on your shield.", null, 1200); if (ME && !still) { ME.joltV += 6; sparks(onCar(me, 0, 0.3), 8); } }
          else if (e.type === "miss") { bump(); sfx("hit"); cue("bad"); say(t.missed || "An arrow gets past you.", null, 1400); }
          else if (e.type === "gone") { const el = els.get(e.o); if (el) el.remove(); els.delete(e.o); }
          else if (e.type === "hit") {
            const el = els.get(e.o); if (el) el.classList.add("hit");
            bump(); sfx("hit"); cue("bad"); say(t.bump || "You hit it, and lose ground.", null, 1600);
            // The horses rear, the car jolts sideways and dust bursts out.
            if (ME && !still) { ME.rearV += 70; ME.joltV += (K.rng() < 0.5 ? -1 : 1) * 9; dust(onCar(me, 0, 0.5), 12, 3); }
          } else if (e.type === "warn") {
            // He warns you first: a pulsing "!" over his car; he cracks his whip and his horses toss their heads.
            rivalEl.classList.add("warn"); sfx("drum"); say("{who} swings toward you!", { who: K.tr(t.rival) }, 1200);
            if (!still) { RV.crack = 0.32; RV.rearV += 22; RV.turnV += e.side * 3; }
          } else if (e.type === "cut") rivalEl.classList.remove("warn");
          else if (e.type === "clash") {
            rivalEl.classList.remove("warn"); bump(); sfx("clang"); cue("bad");
            say(e.how === "knock" ? "You drive into {who} and knock him off the line!" : e.how === "ram" ? "{who} rams you aside!" : e.how === "rails" ? "{who} drives you into the rails!" : "Wheels clash! You both lose ground.", { who: K.tr(t.rival) }, 1600);
            if (!still) {
              const a = onCar(me, 0, 0.65), b = onCar(rivalEl, 0, 0.65), side = ME.x < RV.x ? -1 : 1;
              sparks({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, 18);
              ME.joltV += side * 10; RV.joltV -= side * 10; ME.rearV += 30; RV.rearV += 30;
            }
          } else if (e.type === "end") { tally(); return finish(e.outcome, e.line); }
        }
        scroll += v * dt * 60;
        if (vertical) track.style.backgroundPositionY = (scroll * 1.6).toFixed(1) + "px";
        else if (tileW) strip.style.transform = "translateX(" + (-(scroll % (tileW * 2))).toFixed(1) + "px)";
        for (const ob of R.obs) { const el = els.get(ob); if (el) { if (vertical) el.style.top = (96 - ob.x) + "%"; else el.style.left = ob.x + "%"; } }
        // The chariots: lane springs, the gallop, the dust; with calm motion they simply change lane.
        const diff = R.rival - R.dist;
        if (chariot) {
          if (still) { ME.x = LANEX[R.lane]; if (RV) RV.x = LANEX[R.rLane]; } else { chariotSprings(ME, LANEX[R.lane], dt); if (RV) chariotSprings(RV, LANEX[R.rLane], dt); }
          if (vertical) me.style.left = ME.x + "%"; else me.style.top = across(ME.x) + "%";
          const sp = still ? 0 : (v / base) * 3;
          drawChariot(ME, still ? 0 : dt, sp, s);
          if (RV) {
            if (vertical) { rivalEl.style.left = RV.x + "%"; rivalEl.style.top = rivalTop(diff); }
            else { rivalEl.style.top = across(RV.x) + "%"; rivalEl.style.left = clamp(geo.meLeft + (geo.len - geo.rlen) / 2 + diff * 0.47 * geo.len, -2 * geo.len, geo.w + geo.len).toFixed(1) + "px"; }
            drawChariot(RV, still ? 0 : dt, still ? 0 : (o.rivalV * (R.rSlow > 0 ? 0.5 : 1) / base) * 3, s);
          }
          dustT -= dt;
          if (dustT <= 0 && !still) {
            const on = R.boost > 0; dustT = on ? 0.035 : 0.07;
            dust(onCar(me, -0.68, 1), on ? 2 : 1, on ? 2.2 : 1.5); dust(onCar(me, 0.68, 1), on ? 2 : 1, on ? 2.2 : 1.5);
          }
          // The whip button fills as it recharges and drains while the whip lasts; ×2 shows meanwhile.
          if (whipBtn) {
            whipBtn.style.setProperty("--c", (R.boost > 0 ? R.boost / RACE.WHIP : R.cool > 0 ? 1 - R.cool / RACE.WHIP_COOL : 1).toFixed(3));
            whipBtn.classList.toggle("ready", R.cool <= 0); whipBtn.classList.toggle("on", R.boost > 0);
            whipBtn.setAttribute("aria-disabled", String(R.cool > 0));
            speedTag.hidden = !(R.boost > 0);
          }
          if (bowBtn) { bowBtn.classList.toggle("ready", R.bowCool <= 0 && R.inReach()); bowBtn.setAttribute("aria-disabled", String(R.bowCool > 0)); }
        } else if (rivalEl) rivalEl.style.top = rivalTop(diff);
        pm.style.left = clamp(R.dist, 0, 100) + "%"; if (pr) pr.style.left = clamp(R.rival, 0, 100) + "%";
        tally();
        if (t.report) t.report(R); // a fight played as a race follows it (ui/fightmodes.js)
      }, host);
      return () => { stop(); off(); clearTimeout(sayT); window.removeEventListener("resize", size); };
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
        '<div class="dpad"><button type="button" class="cta secondary" data-d="up" aria-label="' + U.esc(K.tr("Up")) + '">↑</button><button type="button" class="cta secondary" data-d="left" aria-label="' + U.esc(K.tr("Left")) + '">←</button><button type="button" class="cta secondary" data-d="down" aria-label="' + U.esc(K.tr("Down")) + '">↓</button><button type="button" class="cta secondary" data-d="right" aria-label="' + U.esc(K.tr("Right")) + '">→</button></div>' +
        '<p class="game-note" aria-live="polite">' + U.trSpan(t.help || "Steer with the arrow keys, the buttons or a swipe. Reach everyone you can, then bring them out through the gap on the right.") + '</p>';
      const cv = host.querySelector("canvas"), ctx = cv.getContext && cv.getContext("2d"), score = host.querySelector(".score"), note = host.querySelector(".game-note");
      const D = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
      // On an upright screen, inside the painting, the field stands on end: the way out is at the
      // top, and the controls follow the screen (up on the screen is toward the way out).
      const rot = !!(host.closest(".trial.immersive") && U.upright());
      if (rot) { cv.width = 400; cv.height = 640; note.textContent = K.tr(t.helpUp || "Steer with the arrows or a swipe. Reach everyone you can, then bring them out through the gap at the top."); }
      const SCREEN = { up: "right", down: "left", left: "up", right: "down" };
      const turn = (d) => { const n = D[rot ? SCREEN[d] : d]; if (n.x === -dir.x && n.y === -dir.y && snake.length > 1) return; want = n; };
      host.querySelectorAll(".dpad button").forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); turn(b.dataset.d); }));
      const off = keyset({ ArrowUp: () => turn("up"), ArrowDown: () => turn("down"), ArrowLeft: () => turn("left"), ArrowRight: () => turn("right"), w: () => turn("up"), s: () => turn("down"), a: () => turn("left"), d: () => turn("right") });
      let sx = null, sy = null;
      cv.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
      cv.addEventListener("pointerup", (e) => { if (sx == null) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) > 14) turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up")); sx = null; });
      const followers = () => snake.length - 1;
      const tally = (s) => { score.textContent = K.tr(t.tally || "With you: {f} of {n} · Lost: {d} of {l}", { f: followers(), n: need, d: dead, l: lives, s: Math.max(0, Math.ceil(LIMIT - s)) }); };
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
        // A cell's top-left corner on the canvas (the field stood on end when rot).
        const cols = rot ? H : W, rows = rot ? W : H, cw = cv.width / cols, ch = cv.height / rows;
        const at = (x, y) => (rot ? [y * cw, (W - 1 - x) * ch] : [x * cw, y * ch]);
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.fillStyle = theme === "river" ? "rgba(236,220,182,0.18)" : "rgba(20,12,6,0.32)"; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.strokeStyle = "rgba(255,240,210,0.08)"; ctx.lineWidth = 1;
        for (let x = 1; x < cols; x++) { ctx.beginPath(); ctx.moveTo(x * cw, 0); ctx.lineTo(x * cw, cv.height); ctx.stroke(); }
        for (let y = 1; y < rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * ch); ctx.lineTo(cv.width, y * ch); ctx.stroke(); }
        goal.forEach((k) => { const [x, y] = k.split(",").map(Number), [px, py] = at(x, y); ctx.fillStyle = "rgba(120,200,120,0.45)"; ctx.fillRect(px, py, cw, ch); });
        hazard.forEach((k) => {
          const [x, y] = k.split(",").map(Number), [px, py] = at(x, y), cx = px + cw / 2, cy = py + ch / 2;
          if (theme === "river") { ctx.fillStyle = "rgba(40,90,120,0.75)"; ctx.fillRect(px, py, cw, ch); return; }
          const f = 0.8 + 0.2 * Math.sin(s * 9 + x * 3 + y);
          ctx.fillStyle = "rgba(229,118,42," + 0.85 * f + ")"; ctx.beginPath(); ctx.moveTo(cx - cw * 0.38, cy + ch * 0.4); ctx.quadraticCurveTo(cx - cw * 0.3, cy - ch * 0.1, cx, cy - ch * 0.48 * f); ctx.quadraticCurveTo(cx + cw * 0.3, cy - ch * 0.1, cx + cw * 0.38, cy + ch * 0.4); ctx.fill();
          ctx.fillStyle = "rgba(255,211,107,0.9)"; ctx.beginPath(); ctx.ellipse(cx, cy + ch * 0.18, cw * 0.14, ch * 0.2 * f, 0, 0, 6.3); ctx.fill();
        });
        const body = (p, lead, i) => {
          const [px, py] = at(p.x, p.y), cx = px + cw / 2, cy = py + ch / 2;
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
      const clock = U.countdown(host);
      const stop = U.loop((s) => {
        const dt = Math.min(0.05, s - last); last = s;
        if (over) return;
        clock.set(LIMIT - s, LIMIT);
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
      const N = 12, R = [128, 100, 72, 44], mode = t.mode || "open", LIMIT = t.secs || (mode === "open" ? 50 : mode === "last" ? 120 : 32);
      // "last": the rings start in line and are pushed out of line ever faster. It cannot be won;
      // it counts how long you hold (in heartbeats).
      let lastEvery = clamp(2.2 + power * 0.06, 2.2, 2.8);
      const inLine = () => Math.max(...gaps.map((g) => gaps.filter((h) => h === g).length));
      let driftEvery = clamp((mode === "open" ? 6.5 : 2.3) + power * (mode === "open" ? 0.25 : 0.08), mode === "open" ? 6 : 2.1, mode === "open" ? 9 : 3);
      const mod = (n) => ((n % N) + N) % N;
      let gaps, sel = 0, moves = 0, last = 0, drift = 0, over = false;
      if (mode === "open") { gaps = [0, 0, 0, 0].map(() => Math.floor(K.rng() * N)); if (gaps.every((g) => g === gaps[0])) gaps[2] = mod(gaps[2] + 4); }
      else if (mode === "last") { const g = Math.floor(K.rng() * N); gaps = [g, g, g, g]; driftEvery = lastEvery; }
      else { const g = Math.floor(K.rng() * N); gaps = [g, g, mod(g + 2), mod(g - 2)]; }
      const theme = t.theme || "wheel";
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="ringfield ' + theme + '"><svg viewBox="-150 -150 300 300" role="img" aria-label="' + U.esc(K.tr(theme === "maze" ? "The rings of the forest" : "The rings of the wheel")) + '"></svg></div>' +
        '<p class="game-note" aria-live="polite">' + U.trSpan(t.help || (mode === "open" ? "Line up every opening with the outer one. Turning a ring drags the ring inside it the other way." : "The wheel keeps turning toward a straight way in. Keep at least one ring out of line.")) + "</p>" +
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
      const beats = (s) => Math.round((s || 0) * 1.2);
      const tally = (s) => { if (mode === "last") { score.textContent = K.tr("Rings in line: {a} of 4 · Held for {n} heartbeats", { a: inLine(), n: beats(s) }); return; } score.textContent = K.tr(mode === "open" ? t.tally || "Rings in line: {a} of 4 · Turns: {m}" : t.tally || "Rings in line: {a} of 4 · Hold for {s} more seconds", { a: gaps.filter((g) => g === gaps[0]).length, m: moves, s: Math.max(0, Math.ceil(LIMIT - s)) }); };
      const pick = (i) => { sel = clamp(i, 0, 3); draw(); };
      const turn = (d) => {
        if (over) return;
        gaps[sel] = mod(gaps[sel] + d);
        if (sel < 3) gaps[sel + 1] = mod(gaps[sel + 1] - d); // the gearing
        moves++; sfx("tap"); cue("act");
        draw(); check();
      };
      function check(s) {
        if (mode === "last") return;
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
      const clock = mode === "last" ? null : U.countdown(host); // the last stand is held as long as you can: no time to beat
      const stop = U.loop((s) => {
        const dt = Math.min(0.05, s - last); last = s;
        if (over) return;
        if (clock) clock.set(LIMIT - s, LIMIT);
        drift += dt;
        if (drift >= driftEvery) {
          drift = 0;
          if (mode === "last") {
            const i = Math.floor(K.rng() * 4); gaps[i] = mod(gaps[i] + (K.rng() < 0.5 ? 1 : -1));
            driftEvery = Math.max(0.3, driftEvery * 0.86);
            note.textContent = K.tr(t.push || "They push, and a ring gives.");
            sfx("drum"); draw();
            if (inLine() < 2) { over = true; cue("bad"); if (K.Sound && K.Sound.cut) K.Sound.cut(8); K.S.heldRing = beats(s); finish("lose", ["You held the ring open for {n} heartbeats.", { n: beats(s) }]); }
            tally(s); return;
          }
          if (mode === "open") { const i = Math.floor(K.rng() * 4); gaps[i] = mod(gaps[i] + (K.rng() < 0.5 ? 1 : -1)); note.textContent = K.tr(t.turns || "The wheel turns."); }
          else {
            // The attackers lean on the ring that is furthest out of line.
            const off = gaps.map((g, i) => ({ i, d: mod(g - gaps[0]) })).filter((x) => x.i && x.d);
            if (off.length) { const x = K.pick(off); gaps[x.i] = mod(gaps[x.i] + (x.d <= N / 2 ? -1 : 1)); note.textContent = K.tr(t.push || "They push, and a ring gives."); }
          }
          sfx("drum"); draw(); check(s);
        }
        tally(s);
        if (!over && s >= LIMIT && mode === "last") { over = true; K.S.heldRing = beats(s); finish("close", ["You held the ring open for {n} heartbeats.", { n: beats(s) }]); return; }
        if (!over && s >= LIMIT) { over = true; if (mode === "open") finish(gaps.filter((g) => g === gaps[0]).length >= 3 ? "close" : "lose", "Time ran out before the way opened."); else { cue("good"); finish("win", "The wheel held."); } }
      }, host);
      return () => { stop(); off(); };
    });
  };

  // ---------- Formation: set your company in the array the commander names ----------
  // The commander shows the array once (crane, eagle, crescent). Then the company comes onto the
  // field unit by unit, and each must go on its mark before the drum stops. Then the enemy tests a
  // flank, and you send the reserve to it. The field is the painting seen from above.
  const UNIT_ART = {
    archers: '<path d="M-7 -9 Q5 0 -7 9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M-7 -9 L-7 9 M-9 0 H9 M5 -3 L9 0 L5 3" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    chariots: '<circle r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M0 -8 V8 M-8 0 H8 M-5.6 -5.6 L5.6 5.6 M-5.6 5.6 L5.6 -5.6" stroke="currentColor" stroke-width="1.4"/>',
    spearmen: '<path d="M0 10 V-6" stroke="currentColor" stroke-width="2.2"/><path d="M0 -11 L3.5 -4 H-3.5 Z" fill="currentColor"/><path d="M-6 6 H6" stroke="currentColor" stroke-width="1.6"/>',
    elephants: '<path d="M-9 5 Q-10 -7 0 -8 Q9 -8 9 1 L9 9 M5 2 Q4 9 7 10 M-5 5 V10 M2 5 V10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="4" cy="-3" r="1.2" fill="currentColor"/>'
  };
  const UNIT_NAME = { archers: "Archers", chariots: "Chariots", spearmen: "Spearmen", elephants: "Elephants" };
  // Each array: its name, and six marks [x, y, unit] (the enemy is at the top).
  const ARRAYS = {
    crane: ["The crane", [[0, -72, "chariots"], [0, -36, "chariots"], [-64, -12, "archers"], [64, -12, "archers"], [0, 12, "spearmen"], [0, 60, "elephants"]]],
    eagle: ["The eagle", [[0, -70, "elephants"], [-40, -30, "chariots"], [40, -30, "chariots"], [-76, 12, "archers"], [76, 12, "archers"], [0, 34, "spearmen"]]],
    crescent: ["The crescent", [[-78, -52, "archers"], [-46, -8, "chariots"], [0, 12, "elephants"], [46, -8, "chariots"], [78, -52, "archers"], [0, 62, "spearmen"]]]
  };
  U.games.formation = function (box, done, c) {
    return U.trialFrame(box, done, c, "formation", ({ host, power, t, finish, cue }) => {
      const key = t.array || K.pick(Object.keys(ARRAYS)), [aname, marks] = ARRAYS[key];
      const look = clamp(2.6 + power * 0.25, 2.6, 5), per = clamp(2.6 + power * 0.15, 2.6, 4.2), react = clamp(1.3 + power * 0.08, 1.3, 2);
      const order = marks.map((m) => m[2]).sort(() => K.rng() - 0.5);
      const filled = marks.map(() => null);
      let phase = "look", unit = 0, wrong = 0, probe = 0, probesHit = 0, t0 = 0, flank = null, over = false;
      host.innerHTML = '<p class="score" aria-live="polite"></p><div class="formfield"><svg viewBox="-100 -100 200 200" role="img" aria-label="' + U.esc(K.tr("The field, seen from above")) + '"></svg></div>' +
        '<p class="game-note" aria-live="polite"></p><div class="btnrow form-btns"></div>';
      const svg = host.querySelector("svg"), score = host.querySelector(".score"), note = host.querySelector(".game-note"), clock = U.countdown(host), row = host.querySelector(".btnrow");
      const icon = (u, x, y, cls) => '<g class="unit ' + u + (cls ? " " + cls : "") + '" transform="translate(' + x + " " + y + ')">' + UNIT_ART[u] + "</g>";
      function draw() {
        let s = '<path class="enemy-line" d="M-90 -92 H90"/>';
        if (flank) s += '<g transform="translate(' + flank.x + ' -60)"><g class="probe ' + flank.state + '"><path d="M-10 -20 L0 0 L10 -20 M-10 -32 L0 -12 L10 -32"/></g></g>';
        marks.forEach(([x, y, u], i) => {
          const f = filled[i];
          s += '<g class="mark' + (f ? " full" : "") + (f && f.bad ? " bad" : "") + '" data-i="' + i + '"><circle cx="' + x + '" cy="' + y + '" r="15"/><text x="' + (x + 12) + '" y="' + (y - 11) + '">' + (i + 1) + "</text></g>";
          if (phase === "look") s += icon(u, x, y, "shown");
          else if (f) s += icon(f.u, x, y, f.bad ? "bad" : "placed");
        });
        svg.innerHTML = s;
        svg.querySelectorAll(".mark").forEach((el) => el.addEventListener("pointerdown", (e) => { e.preventDefault(); place(+el.dataset.i); }));
      }
      const tally = () => { score.textContent = phase === "reserve" ? K.tr("The reserve · Flanks held: {h} of {n}", { h: probesHit, n: 2 }) : K.tr("{array} · Placed: {p} of {n} · Mistakes: {w}", { array: K.tr(aname), p: unit, n: marks.length, w: wrong }); };
      const say = (txt, vars) => { note.textContent = K.tr(txt, vars); };
      function nextUnit() {
        if (unit >= order.length) return startReserve();
        t0 = U.clock();
        say("Next: {unit}. Put them on their mark.", { unit: K.tr(UNIT_NAME[order[unit]]) });
        tally(); draw();
      }
      function settle(i, bad) {
        const u = order[unit];
        // A wrong mark or a slow hand: the unit goes where it belongs, but the commander saw it.
        const right = bad ? marks.findIndex((m, k) => m[2] === u && !filled[k]) : i;
        filled[right] = { u, bad };
        if (bad) { wrong++; cue("bad"); sfx("hit"); } else { cue("good"); sfx("tap"); }
        unit++;
        nextUnit();
      }
      function place(i) {
        if (phase !== "place" || over || filled[i]) return;
        settle(i, marks[i][2] !== order[unit]);
      }
      function startReserve() {
        phase = "reserve"; probe = 0; flank = null; tally(); draw();
        say("Now the enemy tests a flank. Send the reserve where they strike.");
        ["Left", "Centre", "Right"].forEach((lbl, k) => row.appendChild(U.pressButton(lbl, () => send(k))));
        setTimeout(startProbe, 1200);
      }
      function startProbe() {
        if (over) return;
        const k = Math.floor(K.rng() * 3);
        flank = { k, x: [-62, 0, 62][k], state: "coming" }; t0 = U.clock(); draw();
        say("They are coming!");
      }
      function send(k) {
        if (phase !== "reserve" || !flank || flank.state !== "coming" || over) return;
        endProbe(k === flank.k);
      }
      function endProbe(ok) {
        flank.state = ok ? "held" : "broke";
        if (ok) { probesHit++; cue("good"); sfx("choose"); say("The reserve meets them, and the line holds."); } else { cue("bad"); sfx("hit"); say("The reserve goes the wrong way. The line bends."); }
        probe++; tally(); draw();
        if (probe >= 2) return end();
        setTimeout(startProbe, 1300);
      }
      function end() {
        over = true;
        const out = wrong <= 1 && probesHit >= 1 ? "win" : wrong <= 2 && probesHit >= 1 || wrong <= 1 ? "close" : "lose";
        setTimeout(() => finish(out, ["Mistakes in the array: {w}. Flanks held: {h} of 2.", { w: wrong, h: probesHit }]), 700);
      }
      const off = keyset({ 1: () => place(0), 2: () => place(1), 3: () => place(2), 4: () => place(3), 5: () => place(4), 6: () => place(5), ArrowLeft: () => send(0), ArrowDown: () => send(1), ArrowUp: () => send(1), ArrowRight: () => send(2) });
      say(t.shows || "\"{array}. Look well; I will not show you twice.\"", { array: K.tr(aname) });
      tally(); draw(); t0 = U.clock();
      const stop = U.loop(() => {
        if (over) return;
        const el = (U.clock() - t0) / 1000;
        if (phase === "look") { clock.set(look - el, look); if (el >= look) { phase = "place"; nextUnit(); } }
        else if (phase === "place") { clock.set(per - el, per); if (el >= per) { say("Too slow."); settle(-1, true); } }
        else if (flank && flank.state === "coming") { clock.set(react - el, react); if (el >= react) endProbe(false); }
        else clock.hide();
      }, host);
      return () => { stop(); off(); };
    });
  };
})(window.K = window.K || {});
