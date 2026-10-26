/* Three original pieces in an epic Indian classical / fusion style. Melodies are new, written in ragas. */
(function () {
  "use strict";
  const { makeRack, seq } = window.FUSION;
  const clock = (bpm, start = 0.3) => { const b = 60 / bpm; return { beat: b, bar: 4 * b, T: (bar, beat = 0) => start + (bar * 4 + beat) * b }; };
  const melody = (I, T, bar, beat, s, kind, vel, base) => I.line(T(bar), beat, seq(s), kind, vel, base);

  // Repeating drum and ostinato patterns over a range of bars.
  function dholGroove(I, T, b8, from, to, vel = 1, dense = false) {
    const pat = ["both", "ta", "ta", "dha", "both", "ta", "dha", "ta"];
    for (let bar = from; bar < to; bar++) pat.forEach((s, i) => {
      I.dhol(T(bar, i * 0.5), s, vel * (i === 0 ? 1.15 : 0.9));
      if (dense && (i % 2 === 1)) I.dhol(T(bar, i * 0.5 + 0.25), "ta", vel * 0.45);
    });
  }
  function ostinato(I, T, from, to, roots, pattern, vel = 1) {
    for (let bar = from; bar < to; bar++) {
      const root = roots[(bar - from) % roots.length];
      pattern.forEach((n, i) => I.strings(T(bar, i * 0.5), n === "R" || n === "R'" ? root + n.slice(1) : n, 0.25, vel, "spic", undefined));
    }
  }
  function manjira(I, T, from, to, every = 1, vel = 1) { for (let bar = from; bar < to; bar++) for (let b = 0; b < 4; b += every) I.manjira(T(bar, b), vel * (b === 0 ? 1 : 0.6), b % 2 === 0); }
  function tihai(I, T, bar, beat, phrase, gapBeats) { // a phrase played three times, the last landing on sam
    let x = beat;
    for (let k = 0; k < 3; k++) { phrase.forEach(([off, fn]) => fn(T(bar, x + off))); x += gapBeats; }
  }

  // 1. DHARMAYUDDHA — battle anthem. D, 138 bpm, raga Bhairavi (S r g m P d n).
  function dharmayuddha(ctx) {
    const { I } = makeRack(ctx, { sa: 146.83 });
    const { beat, T } = clock(138);
    const BARS = 40;
    I.tanpura(T(0), T(BARS) + 2);
    I.conch(T(0) - 0.2, 0.9);
    for (let b = 0; b < 4; b++) I.nagara(T(b), 0.6 + b * 0.12);
    I.chord(T(0), [".S", ".P", "S"], 4 * 4 * beat, 0.8);
    I.choir(T(2), ["S", "P", "S'"], 8 * beat, 0.8, "o");
    I.riser(T(3), 4 * beat);
    // Verse A: dhol, ostinato, theme on shehnai.
    dholGroove(I, T, 0, 4, 12, 0.9);
    ostinato(I, T, 4, 12, [".S", ".d", ".m", ".S"], ["R", "R", "r", "R", "g", "R", "r", "R"], 0.9);
    const chordsA = [["S", "g", "P"], [".d", "S", "g"], ["m", "d", "S'"], ["S", "m", "P"]];
    for (let k = 0; k < 4; k++) I.chord(T(4 + k * 2), chordsA[k], 8 * beat, 0.7);
    for (let b = 4; b < 12; b++) { I.nagara(T(b), 0.7); I.bass(T(b), ["S", "S", "d", "d", "m", "m", "S", "S"][b - 4], 2 * beat, 0.8); }
    const themeA = "P:1.5 m:0.5 g:1 r:1 S:3 -:1 g:1 m:1 P:1 d:1 P:3 -:1 n:1 d:1 P:1 m:1 g:1 m:0.5 g:0.5 r:2 S:1 r:1 g:1 m:1 !S:3 -:1";
    melody(I, T, 4, beat, themeA, "shehnai", 1);
    // Chorus B: choir, brass, theme B high, dhol denser, manjira.
    dholGroove(I, T, 0, 12, 20, 1, true);
    manjira(I, T, 12, 20, 0.5, 0.8);
    ostinato(I, T, 12, 20, [".S", ".d", ".m", ".P"], ["R", "R", "R", "R'", "R", "R", "R'", "R"].map((x) => x), 0.8);
    const chordsB = [["S", "g", "P"], [".d", "S", "g"], ["m", "d", "S'"], ["P", "n", "r'"]];
    for (let k = 0; k < 4; k++) { I.choir(T(12 + k * 2), chordsB[k], 8 * beat, 1); I.brass(T(12 + k * 2), chordsB[k], 0.4, 1); I.brass(T(12 + k * 2, 1.5), chordsB[k], 0.3, 0.8); I.brass(T(13 + k * 2, 3), chordsB[k], 0.3, 0.9); }
    for (let b = 12; b < 20; b++) { I.nagara(T(b), 0.8); I.nagara(T(b, 2), 0.5); I.bass(T(b), ["S", "S", "d", "d", "m", "m", "P", "P"][b - 12], 2 * beat, 0.9); }
    const themeB = "S':2 n:1 d:1 P:2 d:1 n:1 S':1.5 r':0.5 S':1 n:1 d:3 -:1 P:1 d:1 n:1 S':1 r':2 S':1 n:1 d:1 n:1 d:1 P:1 !P:3 -:1";
    melody(I, T, 12, beat, themeB, "shehnai", 1.05);
    melody(I, T, 12, beat, themeB, "bansuri", 0.5);
    // Break: tabla tirakita and a fast flute taan over the drone; riser.
    const tir = ["ti", "ra", "ki", "ta", "ta", "ki", "te", "dha"];
    for (let b = 20; b < 24; b++) for (let i = 0; i < 16; i++) I.tabla(T(b, i * 0.25), (b === 23 && i >= 8) ? ["dha", "ti", "dha", "ti", "dha", "-", "dha", "-"][i - 8] || "ka" : tir[i % 8], i % 4 === 0 ? 1 : 0.7);
    const up = ["S", "r", "g", "m", "P", "d", "n", "S'"], taan = [];
    for (let k = 0; k < 6; k++) { const run = k % 2 === 0 ? up : up.slice().reverse(); run.forEach((n) => taan.push(n + ":0.25")); }
    taan.push("r':0.5", "S':0.5", "n:0.5", "d:0.5", "P:2", "-:2");
    melody(I, T, 20, beat, taan.join(" "), "bansuri", 0.9);
    I.chord(T(20), [".S", ".P"], 16 * beat, 0.6);
    I.riser(T(22), 8 * beat, 1.1);
    for (let i = 0; i < 8; i++) I.nagara(T(23, i * 0.5), 0.4 + i * 0.07);
    // Climax: theme A in octaves, everything in.
    dholGroove(I, T, 0, 24, 36, 1.05, true);
    manjira(I, T, 24, 36, 0.5, 0.9);
    ostinato(I, T, 24, 36, [".S", ".d", ".m", ".S"], ["R", "R'", "r", "R", "g", "R", "r", "R'"], 0.85);
    for (let b = 24; b < 36; b++) { I.kick(T(b), 0.8); I.kick(T(b, 2), 0.7); I.nagara(T(b), 0.85); I.bass(T(b), ["S", "S", "d", "d", "m", "m", "S", "S", "S", "S", "d", "d"][b - 24], 2 * beat, 1); }
    for (let k = 0; k < 6; k++) { const ch = chordsB[k % 4]; I.choir(T(24 + k * 2), ch, 8 * beat, 1.1); I.brass(T(24 + k * 2), ch, 0.5, 1.1); I.brass(T(25 + k * 2, 2.5), ch, 0.3, 0.9); }
    melody(I, T, 24, beat, themeA, "shehnai", 1.1, 146.83 * 4);
    melody(I, T, 24, beat, themeA, "bansuri", 0.7);
    melody(I, T, 32, beat, "S':2 n:1 d:1 P:2 d:1 n:1 S':1.5 r':0.5 S':1 n:1 !d:4", "shehnai", 1.1);
    // Ending tihai: dha-tirakita x3 landing on bar 39.
    const hit = (t, v = 1) => { I.nagara(t, v); I.dhol(t, "both", v); };
    tihai(I, T, 36, 0, [[0, (t) => hit(t)], [0.5, (t) => I.dhol(t, "ta", 0.8)], [0.75, (t) => I.dhol(t, "ta", 0.7)], [1, (t) => hit(t, 0.9)], [1.5, (t) => I.brass(t, [".S", "S", "P"], 0.25, 0.9)]], 4);
    I.riser(T(38), 4 * beat);
    const end = T(39);
    I.nagara(end, 1.2); I.kick(end, 1); I.brass(end, [".S", "S", "P", "S'"], 2.5, 1.2); I.choir(end, ["S", "P", "S'"], 3, 1.2); I.chord(end, [".S", "S", "P"], 3, 1); I.conch(end + 0.1, 0.8); I.manjira(end, 1.2);
    return end + 5;
  }

  // 2. CHAKRAVYUHA — fusion. C, 150 bpm, raga Purvi-like (S r G M P d N). Electronic pulse with tabla and sitar.
  function chakravyuha(ctx) {
    const { I } = makeRack(ctx, { sa: 130.81 });
    const { beat, T } = clock(150);
    const BARS = 40;
    I.tanpura(T(0), T(BARS) + 2);
    const riffA = ["S", "r", "G", "r", "S", ".N", "S", "r"], riffB = ["G", "M", "P", "M", "G", "r", "S", "-"];
    const riff = (from, to, vel) => { for (let b = from; b < to; b++) (b % 2 === 0 ? riffA : riffB).forEach((n, i) => { if (n !== "-") I.pluck(T(b, i * 0.5), n, 0.45, vel * (i === 0 ? 1.15 : 1), i === 2 ? 1 : 0); }); };
    const theka = ["dha", "dhin", "dhin", "dha", "dha", "dhin", "dhin", "dha", "dha", "tin", "tin", "ta", "ta", "dhin", "dhin", "dha"];
    const tabla = (from, to, vel, fills) => { for (let b = from; b < to; b++) for (let i = 0; i < 8; i++) { const pos = ((b - from) * 8 + i) % 16; I.tabla(T(b, i * 0.5), theka[pos], vel * (pos === 0 ? 1.2 : 0.85)); if (fills && i % 2 === 1) I.tabla(T(b, i * 0.5 + 0.25), "ti", vel * 0.5); } };
    const beatEl = (from, to, vel) => { for (let b = from; b < to; b++) { I.kick(T(b), vel); I.kick(T(b, 1.5), vel * 0.7); I.kick(T(b, 2.5), vel * 0.8); I.clap(T(b, 1), vel * 0.8); I.clap(T(b, 3), vel * 0.8); } };
    const pulse = (from, to, roots, vel) => { for (let b = from; b < to; b++) { const r = roots[(b - from) % roots.length]; for (let i = 0; i < 8; i++) I.bass(T(b, i * 0.5), i === 3 || i === 7 ? r + "'" : r, 0.42, vel * (i % 2 ? 0.75 : 1)); } };
    // Intro.
    riff(0, 4, 0.7);
    tabla(2, 4, 0.6, false);
    I.choir(T(0), ["S", "G", "P"], 16 * beat, 0.6, "o");
    I.riser(T(3), 4 * beat);
    // Verse.
    riff(4, 12, 0.8); tabla(4, 12, 0.8, false); beatEl(4, 12, 0.8); pulse(4, 12, ["S", "S", "d", "r"], 0.8);
    for (let b = 4; b < 12; b += 2) I.chord(T(b), [["S", "G", "P"], ["d", "S'", "G'"]][(b / 2) % 2], 8 * beat, 0.5);
    const hook = "G:1 M:1 P:2 d:1 P:1 M:1 G:1 r:1 G:1 M:0.5 G:0.5 r:1 S:3 -:1 N:1 S':1 r':2 S':1 N:1 d:1 P:1 M:1 d:1 P:0.5 M:0.5 G:1 !r:2 S:2";
    melody(I, T, 8, beat, hook.split(" ").slice(0, 14).join(" "), "bansuri", 0.8);
    // Drop 1.
    for (let b = 12; b < 20; b++) { I.nagara(T(b), 0.9); }
    riff(12, 20, 0.85); tabla(12, 20, 0.9, true); beatEl(12, 20, 1); pulse(12, 20, ["S", "S", "d", "r"], 1);
    const dropCh = [["S", "G", "P"], ["d", "S'", "G'"], ["r", "M", "d"], ["N", "r'", "M'"]];
    for (let k = 0; k < 4; k++) { const ch = dropCh[k]; I.brass(T(12 + k * 2), ch, 0.35, 1); I.brass(T(12 + k * 2, 2.5), ch, 0.25, 0.8); I.brass(T(13 + k * 2, 1), ch, 0.25, 0.8); I.choir(T(12 + k * 2), ch, 8 * beat, 0.8); }
    melody(I, T, 12, beat, hook, "shehnai", 1.05);
    manjira(I, T, 12, 20, 1, 0.7);
    // Breakdown: tabla solo with sitar, riser.
    const solo = ["dha", "ti", "ra", "ki", "ta", "ka", "dhin", "na", "ti", "ra", "ki", "ta", "dha", "ge", "na", "ka"];
    for (let b = 20; b < 24; b++) for (let i = 0; i < 16; i++) I.tabla(T(b, i * 0.25), solo[(i + b * 3) % 16], i % 4 === 0 ? 1 : 0.65);
    for (let b = 20; b < 24; b++) [0, 1.5, 3].forEach((x, i) => I.pluck(T(b, x), ["S", "G", "M", "P"][(b + i) % 4], 1.2, 0.8, 1));
    I.choir(T(20), ["S", "M", "d"], 16 * beat, 0.7);
    I.riser(T(22), 8 * beat, 1.2);
    // Drop 2.
    for (let b = 24; b < 36; b++) { I.nagara(T(b), 1); I.nagara(T(b, 2), 0.5); }
    riff(24, 36, 0.8); tabla(24, 36, 0.95, true); beatEl(24, 36, 1.05); pulse(24, 36, ["S", "S", "d", "r"], 1.05);
    ostinato(I, T, 24, 36, ["S", "d", "r", ".N"], ["R", "R'", "R", "G", "R", "R'", "M", "R"], 0.75);
    for (let k = 0; k < 6; k++) { const ch = dropCh[k % 4]; I.choir(T(24 + k * 2), ch, 8 * beat, 1); I.brass(T(24 + k * 2), ch, 0.35, 1.1); I.brass(T(25 + k * 2, 2.5), ch, 0.25, 0.9); }
    melody(I, T, 24, beat, hook, "shehnai", 1.1);
    melody(I, T, 24, beat, "S':2 N:1 d:1 P:2 M:1 G:1 r:2 G:1 M:1 P:4 d:1 N:1 S':2 r':1 S':1 N:1 d:1 P:2 M:2 !G:4", "bansuri", 0.65, 130.81 * 4);
    melody(I, T, 32, beat, "G':1 r':1 S':1 N:1 d:1 P:1 M:1 G:1 r:1 G:1 M:1 P:1 !S':4", "shehnai", 1.1);
    manjira(I, T, 24, 36, 0.5, 0.8);
    // Outro: tihai on the riff and stop.
    const hit = (t, v = 1) => { I.nagara(t, v); I.kick(t, v); I.brass(t, ["S", "G", "P"], 0.2, v); };
    tihai(I, T, 36, 0, [[0, (t) => hit(t)], [0.5, (t) => I.pluck(t, "r", 0.3)], [1, (t) => I.pluck(t, "G", 0.3)], [1.5, (t) => hit(t, 0.8)]], 4);
    const end = T(39);
    I.nagara(end, 1.2); I.kick(end, 1.1); I.brass(end, [".S", "S", "G", "P"], 2, 1.2); I.choir(end, ["S", "G", "P"], 3, 1); I.pluck(end, "S", 2, 1, 0); I.manjira(end, 1.1);
    return end + 4.5;
  }

  // 3. VIJAYA — heroic, uplifting. C#, 126 bpm, raga Yaman (S R G M# P D N); lifts a whole tone for the last chorus.
  function vijaya(ctx) {
    const SA = 138.59;
    const rack = makeRack(ctx, { sa: SA });
    const { I } = rack;
    const { beat, T } = clock(126);
    const BARS = 36;
    I.tanpura(T(0), T(BARS) + 2);
    // Intro: bells and choir, a free flute call.
    [0, 1, 2, 3].forEach((b) => I.bell(T(b), ["S", "P", "G", "S"][b], 0.8));
    I.choir(T(0), ["S", "G", "P"], 8 * beat, 0.8, "a");
    I.choir(T(2), ["R", "M", "D"], 8 * beat, 0.8, "a");
    melody(I, T, 0, beat, "-:1 P:2 M:0.5 G:0.5 R:1 G:3 -:1 N:1 D:1 P:2 M:1 !G:3 -:1", "bansuri", 0.85);
    I.riser(T(3), 4 * beat);
    const chords = [["S", "G", "P"], ["R", "M", "D"], ["D", "S'", "G'"], ["P", "N", "R'"]];
    // Verse: dhol, manjira, legato strings, flute theme.
    dholGroove(I, T, 0, 4, 12, 0.85);
    manjira(I, T, 4, 12, 1, 0.7);
    for (let k = 0; k < 4; k++) I.chord(T(4 + k * 2), chords[k], 8 * beat, 0.8);
    for (let b = 4; b < 12; b++) { I.bass(T(b), ["S", "S", "R", "R", "D", "D", "P", "P"][b - 4], 2 * beat, 0.7); I.bass(T(b, 2), ["S", "S", "R", "R", "D", "D", "P", "P"][b - 4], 2 * beat, 0.6); }
    const theme = "G:1 M:1 D:1.5 N:0.5 D:2 P:2 G:1 R:1 G:1 M:1 P:3 -:1 D:1 N:1 S':1 R':1 G':1.5 R':0.5 S':2 N:1 D:1 P:1 M:1 !G:3 -:1";
    melody(I, T, 4, beat, theme, "bansuri", 1);
    // Chorus: choir and brass carry the anthem, strings in octaves.
    const anthem = "S':2 N:1 D:1 P:2 M:1 G:1 M:1 D:1 N:1 S':1 R':3 -:1 G':2 R':1 S':1 N:1 D:1 P:1 D:1 N:1 S':1 R':1 N:1 !S':3 -:1";
    const chorus = (from, lift) => {
      const sa = SA * lift;
      const r2 = makeRack(ctx, { sa }); const J = r2.I; // a rack in the lifted key
      dholGroove(J, T, 0, from, from + 8, 1, true);
      manjira(J, T, from, from + 8, 0.5, 0.85);
      for (let k = 0; k < 4; k++) { const ch = chords[k]; J.choir(T(from + k * 2), ch, 8 * beat, 1.1); J.chord(T(from + k * 2), ch, 8 * beat, 0.8); J.brass(T(from + k * 2), ch, 0.5, 1); J.brass(T(from + k * 2 + 1, 2.5), ch, 0.3, 0.8); }
      for (let b = from; b < from + 8; b++) { J.nagara(T(b), 0.75); J.bass(T(b), ["S", "S", "R", "R", "D", "D", "P", "P"][b - from], 4 * beat, 0.9); }
      J.line(T(from), beat, seq(anthem), "shehnai", 1.05, sa);
      J.line(T(from), beat, seq(anthem), "bansuri", 0.7, sa);
      return J;
    };
    chorus(12, 1);
    // Bridge: tabla and flute answer each other.
    const qa = ["dha", "ge", "na", "ti", "na", "ka", "dhin", "-"];
    for (let b = 20; b < 24; b++) {
      if (b % 2 === 1) for (let i = 0; i < 8; i++) { if (qa[i] !== "-") I.tabla(T(b, i * 0.5), qa[i], 1); I.tabla(T(b, i * 0.5 + 0.25), "ti", 0.5); }
    }
    melody(I, T, 20, beat, "P:0.5 D:0.5 N:0.5 S':0.5 R':1 S':1 -:4 G':0.5 R':0.5 S':0.5 N:0.5 D:1 P:1 -:4", "bansuri", 0.9);
    I.chord(T(20), ["S", "P"], 16 * beat, 0.6);
    I.riser(T(22), 8 * beat, 1.1);
    for (let i = 0; i < 8; i++) I.dhol(T(23, i * 0.5), "both", 0.5 + i * 0.07);
    // Last chorus, a whole tone up.
    const J = chorus(24, 9 / 8);
    for (let b = 24; b < 32; b++) J.kick(T(b), 0.7);
    // Ending.
    dholGroove(J, T, 0, 32, 34, 1);
    J.line(T(32), beat, seq("N:1 S':1 R':1 G':1 !S':4"), "shehnai", 1.1, SA * 9 / 8);
    const end = T(34);
    J.nagara(end, 1.2); J.brass(end, [".S", "S", "G", "P", "S'"], 3, 1.2); J.choir(end, ["S", "G", "P", "S'"], 3.5, 1.2); J.chord(end, [".S", "S", "G", "P"], 3.5, 1); J.bell(end, "S", 1); J.manjira(end, 1.2);
    return end + 5;
  }

  window.SONGS = { dharmayuddha, chakravyuha, vijaya };
})();
