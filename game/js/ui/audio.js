/* Sound and music, made in the browser with Web Audio: no sound files to download.

   Music is a small Hindustani ensemble that plays itself: a tanpura drone on Sa (C#), a bansuri
   (bamboo flute) improvising phrases in a raga, and a tabla keeping the tala. It has three moods:
     calm    — the story: raga Yaman as a slow alap. Tanpura and flute only, no rhythm.
     tense   — high-stakes scenes (the dice hall, the war, the lamp): raga Marwa in jhaptal
               (10 beats) at a walking tempo; the tabla comes in.
     battle  — fights: Marwa in drut teental (16 beats), fast, with quick taans on the flute.
   K.Sound.mood(name) changes mood; the tabla switches at its next beat and the flute's phrase
   fades out, so a battle starts at once. Menu: music on or off, music volume, sound effects. */
(function (K) {
  "use strict";
  let ctx = null, master = null, sfxBus = null, musicBus = null, noise = null;
  const pref = (key) => K.prefs()[key];
  const on = (key) => pref(key) !== false;
  const musicOn = () => on("sound") && on("music") && on("drone"); // "drone" is the older name of the switch
  const musicLevel = () => { const v = pref("musicVol"); return typeof v === "number" ? Math.max(0, Math.min(1, v)) : 0.7; };
  const available = () => typeof window.AudioContext === "function" || typeof window.webkitAudioContext === "function";

  function init() {
    if (ctx || !available()) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0;
      // Cut the sub-bass under the music: the low tanpura string booms on small speakers otherwise.
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 75; hp.Q.value = 0.7;
      musicBus.connect(hp); hp.connect(master);
    } catch (e) { ctx = null; }
    return ctx;
  }
  const now = () => ctx.currentTime;
  function env(g, t, a, peak, d) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function noiseBuffer(sec) {
    const b = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * sec)), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // ---------- Pitch: Sa is C#, just intonation ----------
  const SA = 138.59;
  const RAGAS = {
    // Yaman: S R G M# P D N, sung in the evening. Vadi G, samvadi N.
    yaman: { notes: [1, 9 / 8, 5 / 4, 45 / 32, 3 / 2, 5 / 3, 15 / 8], rest: [0, 2, 4], home: 2 },
    // Marwa: S r G M# D N, no Pa. The flat Re and sharp Ma give a restless, dusky tension.
    marwa: { notes: [1, 16 / 15, 5 / 4, 45 / 32, 5 / 3, 15 / 8], rest: [0, 1, 4], home: 1 }
  };
  const MOODS = {
    calm: { raga: "yaman", tala: null, bpm: 0, pluck: 1.25, flute: 0.9, phrase: [3, 6], note: [0.7, 1.7], gap: [2.2, 4.5], octave: 2 },
    tense: { raga: "marwa", tala: "jhaptal", bpm: 76, pluck: 1.0, flute: 0.8, phrase: [4, 7], note: [1, 2], gap: [2, 4], octave: 2 },
    battle: { raga: "marwa", tala: "teental", bpm: 168, pluck: 0.75, flute: 0.75, phrase: [6, 12], note: [0.5, 1], gap: [2, 4], octave: 2 }
  };
  const TALAS = {
    // Theka: the bols the tabla plays for one cycle. Sam (the first beat) is accented.
    teental: ["dha", "dhin", "dhin", "dha", "dha", "dhin", "dhin", "dha", "dha", "tin", "tin", "ta", "ta", "dhin", "dhin", "dha"],
    jhaptal: ["dhi", "na", "dhi", "dhi", "na", "ti", "na", "dhi", "dhi", "na"]
  };

  // ---------- Tanpura: Pa Sa Sa Sa, plucked in turn ----------
  const STRINGS = [SA * 0.75, SA, SA, SA * 0.5];
  function pluck(freq, t, level) {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o1.type = "sawtooth"; o2.type = "sawtooth";
    o1.frequency.value = freq; o2.frequency.value = freq * 1.003; // the jawari shimmer: two strings slightly apart
    f.type = "lowpass"; f.frequency.setValueAtTime(2200, t); f.frequency.exponentialRampToValueAtTime(420, t + 3.4); f.Q.value = 7;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(musicBus);
    env(g, t, 0.02, 0.055 * level * (freq < 100 ? 0.55 : 1), 4.4); // the low Sa string sits back
    o1.start(t); o2.start(t); o1.stop(t + 4.6); o2.stop(t + 4.6);
  }

  // ---------- Tabla ----------
  function bayan(t, acc) { // the left drum: a deep boom with a little upward glide
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(78, t); o.frequency.exponentialRampToValueAtTime(102, t + 0.12); o.frequency.exponentialRampToValueAtTime(92, t + 0.5);
    o.connect(g); g.connect(musicBus); env(g, t, 0.004, 0.32 * acc, 0.5); o.start(t); o.stop(t + 0.6);
  }
  function dayan(t, acc, ring, click) { // the right drum, tuned to upper Sa: harmonic partials from the black syahi
    const f0 = SA * 2;
    [[1, 1], [2, 0.45], [3, 0.25], [4.2, 0.12]].forEach(([m, a], i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f0 * m; o.connect(g); g.connect(musicBus);
      env(g, t, 0.002, 0.13 * a * acc, ring / (1 + i * 0.7)); o.start(t); o.stop(t + ring + 0.1);
    });
    if (click) {
      const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noise; bp.type = "bandpass"; bp.frequency.value = 3200; bp.Q.value = 1.2;
      s.connect(bp); bp.connect(g); g.connect(musicBus); env(g, t, 0.001, 0.12 * acc * click, 0.03); s.start(t, Math.random() * 0.5, 0.05);
    }
  }
  function ka(t, acc) { // a flat slap on the left drum
    const s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; lp.type = "lowpass"; lp.frequency.value = 900;
    s.connect(lp); lp.connect(g); g.connect(musicBus); env(g, t, 0.001, 0.22 * acc, 0.05); s.start(t, Math.random() * 0.5, 0.08);
  }
  const BOLS = {
    dha: (t, a) => { bayan(t, a); dayan(t, a, 0.32, 0.8); },
    dhin: (t, a) => { bayan(t, a * 0.9); dayan(t, a * 0.8, 0.55, 0.3); },
    dhi: (t, a) => { bayan(t, a * 0.9); dayan(t, a * 0.8, 0.5, 0.3); },
    ta: (t, a) => dayan(t, a, 0.28, 1),
    na: (t, a) => dayan(t, a, 0.3, 0.9),
    tin: (t, a) => dayan(t, a * 0.75, 0.5, 0.2),
    ti: (t, a) => dayan(t, a * 0.8, 0.12, 0.8),
    ka: (t, a) => ka(t, a)
  };

  // ---------- Bansuri: one breath per phrase, gliding (meend) from note to note ----------
  let phraseOut = null; // the phrase now sounding, so a change of mood can fade it
  function phrase(t0, notes, level) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lfo = ctx.createOscillator(), vib = ctx.createGain();
    const lp = ctx.createBiquadFilter(), g = ctx.createGain(), out = ctx.createGain();
    const br = ctx.createBufferSource(), bbp = ctx.createBiquadFilter(), bg = ctx.createGain();
    o.type = "sine"; o2.type = "triangle";
    lfo.frequency.value = 5.2; vib.gain.value = 0;
    lfo.connect(vib); vib.connect(o.frequency); vib.connect(o2.frequency);
    lp.type = "lowpass"; lp.frequency.value = 2600;
    const o2g = ctx.createGain(); o2g.gain.value = 0.18;
    o.connect(lp); o2.connect(o2g); o2g.connect(lp); lp.connect(g);
    br.buffer = noise; br.loop = true; bbp.type = "bandpass"; bbp.Q.value = 2.5; bg.gain.value = 0.012 * level;
    br.connect(bbp); bbp.connect(bg); bg.connect(g);
    g.connect(out); out.connect(musicBus); out.gain.value = 1;
    let t = t0;
    const peak = 0.11 * level; // the flute leads; the tanpura sits under it
    g.gain.setValueAtTime(0.0001, t0);
    notes.forEach((n, i) => {
      const glide = i === 0 ? 0 : Math.min(0.12, n.d * 0.3);
      if (i === 0) { o.frequency.setValueAtTime(n.f, t); o2.frequency.setValueAtTime(n.f * 2, t); bbp.frequency.setValueAtTime(n.f * 3, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.09); }
      else {
        o.frequency.setValueAtTime(notes[i - 1].f, t); o.frequency.exponentialRampToValueAtTime(n.f, t + glide);
        o2.frequency.setValueAtTime(notes[i - 1].f * 2, t); o2.frequency.exponentialRampToValueAtTime(n.f * 2, t + glide);
        g.gain.setValueAtTime(peak * 0.8, t); g.gain.linearRampToValueAtTime(peak * (n.accent ? 1.15 : 1), t + 0.05); // a soft tongue on each note
      }
      // Long notes bloom into vibrato.
      vib.gain.setValueAtTime(0, t + glide);
      if (n.d > 0.9) vib.gain.linearRampToValueAtTime(n.f * 0.006, t + n.d * 0.8);
      t += n.d;
    });
    g.gain.setValueAtTime(peak, t - 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    [o, o2, lfo, br].forEach((x) => { x.start(t0); x.stop(t + 0.4); });
    phraseOut = { out, end: t + 0.4 };
    return t;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pickOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
  // A phrase is a short walk through the raga's notes, mostly by step, that comes to rest on
  // Sa, the vadi or a resting note. Battle phrases are fast runs (taans).
  function makePhrase(M, beat) {
    const R = RAGAS[M.raga];
    const n = R.notes.length;
    const len = Math.round(rnd(M.phrase[0], M.phrase[1]));
    let idx = n + pickOf([0, R.home, 4 % n]); // start in the middle octave
    const out = [];
    const step = beat ? beat : 0;
    for (let i = 0; i < len; i++) {
      const deg = ((idx % n) + n) % n, oct = Math.floor(idx / n);
      const f = SA * R.notes[deg] * Math.pow(2, oct - 1 + M.octave - 1);
      const d = step ? step * pickOf(M === MOODS.battle ? [0.5, 0.5, 1] : [1, 1, 2]) : rnd(M.note[0], M.note[1]);
      out.push({ f, d, accent: i === 0 });
      idx += pickOf(M === MOODS.battle ? [1, 1, -1, 2] : [1, -1, -1, 1, 2, -2, 0]);
      idx = Math.max(n - 2, Math.min(2 * n + 3, idx));
    }
    // Land on a resting note, held.
    const restDeg = pickOf(R.rest);
    const lastOct = Math.floor(idx / n);
    out.push({ f: SA * R.notes[restDeg] * Math.pow(2, lastOct - 1 + M.octave - 1), d: step ? step * 2 : rnd(1.6, 2.6) });
    return out;
  }

  // ---------- The scheduler ----------
  let timer = null, mood = "calm", S0 = null;
  // ---------- The three composed pieces ----------
  // Each stage of the game has its own piece, played from a file once when the stage begins, then
  // silence until the next stage (no looping):
  //   calm   → Vijaya (raga Bhairavi, heroic): the title, childhood, training, young adulthood, aftermath
  //   tense  → Chakravyuha (Purvi, fusion): the dice game, the exile years, high-stakes moments
  //   battle → Dharmayuddha (Bhairavi, battle anthem): the war and every fight
  // Files load only when their stage is reached. If they cannot load (the game opened from a file on
  // disk, say), the improvised ensemble above plays instead.
  const TRACKS = { calm: "music/vijaya.mp3", tense: "music/chakravyuha.mp3", battle: "music/dharmayuddha.mp3" };
  const TRACK_GAIN = { calm: 0.52, tense: 0.58, battle: 0.72 }; // under the story, a little louder in battle
  const buffers = {}, loading = {};
  let useTracks = typeof fetch === "function" && location.protocol !== "file:";
  let track = null; // { mood, src, gain }
  // A won test plays a short theme of its own kind.
  const FLOURISH = { archery: "music/win_archery.mp3", strength: "music/win_strength.mp3", stealth: "music/win_stealth.mp3", wits: "music/win_wits.mp3", war: "music/win_war.mp3" };
  function loadTrack(m) {
    if (!loading[m]) loading[m] = fetch(new URL(TRACKS[m] || FLOURISH[m.replace("win_", "")], document.baseURI).href)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((ab) => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
      .then((b) => (buffers[m] = b))
      .catch(() => { if (!TRACKS[m]) return null; useTracks = false; if (timer === "tracks") { timer = null; fadeTrack(); startMusic(); } return null; });
    return loading[m];
  }
  function fadeTrack() {
    if (!track) return;
    const { src, gain } = track, t = now();
    gain.gain.cancelScheduledValues(t); gain.gain.setTargetAtTime(0.0001, t, 0.45);
    try { src.stop(t + 2.5); } catch (e) { /* already stopped */ }
    track = null;
  }
  // Each piece plays once per stage (an act; the opening and childhood count as one), never again
  // until the next act, however often the mood swings back to it.
  const played = new Set();
  let playedFor = null; // a new life hears its music again
  function playTrack(m) {
    if (K.S !== playedFor) { if (playedFor) played.clear(); playedFor = K.S; } // the opening and the first scenes share one piece
    if (track && track.mood === m) return;
    fadeTrack();
    const stage = m + ":" + Math.max(1, (K.S && K.S.act) || 1);
    if (played.has(stage)) return;
    played.add(stage);
    const want = m;
    loadTrack(m).then((b) => {
      if (!b || timer !== "tracks" || mood !== want || (track && track.mood === want)) return;
      const src = ctx.createBufferSource(), gain = ctx.createGain();
      src.buffer = b; src.loop = false;
      src.onended = () => { if (track && track.src === src) track = null; }; // the piece ends; silence until the next stage
      gain.gain.value = 0.0001; src.connect(gain); gain.connect(musicBus);
      src.start(now() + 0.05);
      gain.gain.setTargetAtTime(TRACK_GAIN[want], now() + 0.05, 0.5);
      track = { mood: want, src, gain };
      // Fetch the other pieces quietly once one is playing, so later stages start at once.
      setTimeout(() => Object.keys(TRACKS).forEach((k) => { if (useTracks) loadTrack(k); }), 4000);
    });
  }

  function startMusic() {
    if (!init() || timer || !musicOn()) return;
    if (useTracks) {
      timer = "tracks";
      musicBus.gain.cancelScheduledValues(now());
      musicBus.gain.setTargetAtTime(musicLevel() * 1.8, now(), 0.3);
      playTrack(mood);
      return;
    }
    const t = now() + 0.05;
    S0 = { pluckAt: t, pluckIdx: 0, beatAt: t + 0.2, beatIdx: 0, tala: MOODS[mood].tala, phraseAt: t + 1.5, until: t + 80 };
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setTargetAtTime(musicLevel() * 1.8, t, 1.2);
    timer = setInterval(tick, 60);
    tick();
  }
  function stopMusic() {
    if (timer) { if (timer !== "tracks") clearInterval(timer); timer = null; }
    fadeTrack();
    if (ctx) musicBus.gain.setTargetAtTime(0, now(), 0.4);
  }
  function tick() {
    if (!ctx || ctx.state !== "running") return;
    const M = MOODS[mood], t = now(), horizon = t + 0.3;
    if (t > S0.until) return; // like the recorded pieces, the improvised ensemble plays once per stage
    // Tanpura, never stopping.
    while (S0.pluckAt < horizon) { pluck(STRINGS[S0.pluckIdx % 4], S0.pluckAt, mood === "battle" ? 0.8 : 1); S0.pluckAt += M.pluck; S0.pluckIdx++; }
    // Tabla. A new tala starts from its sam.
    if (S0.tala !== M.tala) { S0.tala = M.tala; S0.beatIdx = 0; S0.beatAt = Math.max(S0.beatAt, t + 0.05); }
    if (M.tala) {
      const theka = TALAS[M.tala], beat = 60 / M.bpm;
      while (S0.beatAt < horizon) {
        const pos = S0.beatIdx % theka.length, sam = pos === 0;
        const acc = sam ? 1.25 : 0.9;
        BOLS[theka[pos]](S0.beatAt, acc);
        // In battle, the drummer fills every fourth cycle's last beats with tirakita.
        if (mood === "battle" && Math.floor(S0.beatIdx / theka.length) % 4 === 3 && pos >= 12) { BOLS.ti(S0.beatAt + beat / 2, 0.7); BOLS.ka(S0.beatAt + beat * 0.75, 0.6); }
        S0.beatAt += beat; S0.beatIdx++;
      }
    } else S0.beatAt = Math.max(S0.beatAt, t);
    // Flute.
    if (S0.phraseAt < horizon) {
      let start = Math.max(S0.phraseAt, t + 0.05);
      const beat = M.tala ? 60 / M.bpm : 0;
      if (beat) { const k = Math.ceil((start - S0.beatAt) / beat); start = S0.beatAt + k * beat; } // begin on a beat
      const end = phrase(start, makePhrase(M, beat), M.flute);
      S0.phraseAt = end + rnd(M.gap[0], M.gap[1]);
    }
  }
  function setMood(name) {
    if (!MOODS[name] || name === mood) return;
    mood = name;
    if (timer === "tracks") return playTrack(name);
    if (!ctx || !S0) return;
    const t = now();
    S0.until = t + 80;
    // Let the flute's phrase fall away, and come back in the new raga soon after.
    if (phraseOut && phraseOut.end > t) { phraseOut.out.gain.setTargetAtTime(0.0001, t, 0.15); }
    S0.phraseAt = t + (name === "battle" ? 0.6 : 1.4);
    if (name !== "calm") S0.pluckAt = Math.min(S0.pluckAt, t + 0.05);
  }

  // ---------- Effects ----------
  const FX = {
    quill() { // a short, dry scratch of the nib
      const t = now(), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noise; f.type = "bandpass"; f.frequency.value = 3200 + Math.random() * 2200; f.Q.value = 1.4;
      s.connect(f); f.connect(g); g.connect(sfxBus);
      env(g, t, 0.004, 0.05 + Math.random() * 0.03, 0.05);
      s.start(t, Math.random() * 0.5, 0.08);
    },
    conch() { // a long horn call that rises and wavers
      const t = now(), o = ctx.createOscillator(), o2 = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o2.type = "triangle";
      o.frequency.setValueAtTime(205, t); o.frequency.linearRampToValueAtTime(233, t + 0.5); o.frequency.linearRampToValueAtTime(228, t + 2.2);
      o2.frequency.setValueAtTime(410, t); o2.frequency.linearRampToValueAtTime(466, t + 0.5);
      lfo.frequency.value = 5.2; lg.gain.value = 3; lfo.connect(lg); lg.connect(o.frequency);
      f.type = "bandpass"; f.frequency.value = 820; f.Q.value = 1.6;
      o.connect(f); o2.connect(f); f.connect(g); g.connect(sfxBus);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.35); g.gain.setValueAtTime(0.32, t + 1.7); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      [o, o2, lfo].forEach((x) => { x.start(t); x.stop(t + 2.7); });
    },
    gong() { // a bronze bell: inharmonic partials with a long decay
      const t = now();
      [[110, 0.22], [176.5, 0.12], [262, 0.09], [389, 0.05], [553, 0.03]].forEach(([fr, a], i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = fr; o.connect(g); g.connect(sfxBus);
        env(g, t, 0.006, a, 3.6 - i * 0.4); o.start(t); o.stop(t + 4);
      });
    },
    hit() { // a thud
      const t = now(), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), o = ctx.createOscillator(), og = ctx.createGain();
      s.buffer = noise; f.type = "lowpass"; f.frequency.value = 900; s.connect(f); f.connect(g); g.connect(sfxBus);
      env(g, t, 0.003, 0.35, 0.16); s.start(t, Math.random() * 0.5, 0.2);
      o.type = "sine"; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.18); o.connect(og); og.connect(sfxBus);
      env(og, t, 0.003, 0.3, 0.2); o.start(t); o.stop(t + 0.25);
    },
    drum() { // a dhol stroke: a low skin with a slap on top
      const t = now(), o = ctx.createOscillator(), g = ctx.createGain(), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), sg = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(62, t + 0.22); o.connect(g); g.connect(sfxBus);
      env(g, t, 0.002, 0.34, 0.26); o.start(t); o.stop(t + 0.3);
      s.buffer = noise; f.type = "bandpass"; f.frequency.value = 2100; f.Q.value = 0.9; s.connect(f); f.connect(sg); sg.connect(sfxBus);
      env(sg, t, 0.001, 0.12, 0.05); s.start(t, Math.random() * 0.5, 0.06);
    },
    tap() { // a light hand on the drum's other head
      const t = now(), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.06); o.connect(g); g.connect(sfxBus);
      env(g, t, 0.001, 0.12, 0.08); o.start(t); o.stop(t + 0.12);
    },
    clang() { // hammer on hot iron
      const t = now();
      [[1230, 0.09], [1870, 0.05], [2640, 0.03]].forEach(([fr, a]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "square"; o.frequency.value = fr; o.connect(g); g.connect(sfxBus);
        env(g, t, 0.001, a, 0.32); o.start(t); o.stop(t + 0.4);
      });
    },
    step() { // a soft footfall on a dusty road
      const t = now(), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noise; f.type = "lowpass"; f.frequency.value = 520; s.connect(f); f.connect(g); g.connect(sfxBus);
      env(g, t, 0.004, 0.16, 0.09); s.start(t, Math.random() * 0.5, 0.1);
    },
    heal() { // two soft bells
      const t = now();
      [[880, 0], [1318, 0.09]].forEach(([fr, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = fr; o.connect(g); g.connect(sfxBus);
        env(g, t + d, 0.01, 0.07, 0.9); o.start(t + d); o.stop(t + d + 1);
      });
    },
    dice() { // wooden dice on a board
      const t = now();
      for (let i = 0; i < 5; i++) {
        const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), d = i * 0.07 + Math.random() * 0.03;
        s.buffer = noise; f.type = "bandpass"; f.frequency.value = 1500 + Math.random() * 900; f.Q.value = 5;
        s.connect(f); f.connect(g); g.connect(sfxBus); env(g, t + d, 0.002, 0.18 / (i + 1), 0.06); s.start(t + d, Math.random(), 0.08);
      }
    },
    lamp() { // a low tone as the lamp gutters
      const t = now(), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 69.3; o.connect(g); g.connect(sfxBus);
      env(g, t, 0.05, 0.14, 0.9); o.start(t); o.stop(t + 1);
    },
    choose() { // a single low pluck when a choice is made
      const t = now(), o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = SA * 2; f.type = "lowpass"; f.frequency.value = 1400;
      o.connect(f); f.connect(g); g.connect(sfxBus); env(g, t, 0.005, 0.12, 0.7); o.start(t); o.stop(t + 0.8);
    }
  };

  let lastQuill = 0;
  K.Sound = {
    play(name) {
      if (!on("sound") || !init() || ctx.state !== "running" || !FX[name]) return;
      if (!noise) noise = noiseBuffer(1);
      if (name === "quill") { const t = performance.now(); if (t - lastQuill < 55) return; lastQuill = t; }
      try { FX[name](); } catch (e) { /* sound is never allowed to break the game */ }
    },
    mood(name) { try { setMood(name); } catch (e) { /* never break the game */ } },
    // A won test: its theme plays over everything, the stage's piece ducking underneath.
    flourish(kind) {
      try {
        if (!musicOn() || !init() || ctx.state !== "running") return;
        if (!useTracks || !FLOURISH[kind]) { FX.gong(); return; }
        loadTrack("win_" + kind).then((b) => {
          if (!b) { FX.gong(); return; }
          const t = now(), src = ctx.createBufferSource(), g = ctx.createGain();
          src.buffer = b; g.gain.value = 0.95; src.connect(g); g.connect(musicBus);
          musicBus.gain.cancelScheduledValues(t); musicBus.gain.setTargetAtTime(musicLevel() * 1.8, t, 0.05);
          if (track) { track.gain.gain.cancelScheduledValues(t); track.gain.gain.setTargetAtTime(0.08, t, 0.15); const tr = track; setTimeout(() => { if (track === tr) tr.gain.gain.setTargetAtTime(TRACK_GAIN[tr.mood], now(), 0.8); }, b.duration * 1000 - 800); }
          src.start(t + 0.02);
        });
      } catch (e) { /* never break the game */ }
    },
    // Called from the Menu switches and the volume slider.
    refresh() {
      if (!ctx) return;
      if (musicOn()) { if (timer) musicBus.gain.setTargetAtTime(musicLevel() * 1.8, now(), 0.2); else startMusic(); }
      else stopMusic();
    },
    supported: available,
    get currentMood() { return mood; },
    _debug: () => ({ ctx, master, musicBus }) // for the automated sound check

  };

  // Unlock on the first gesture, then start the music. Browsers let sound start only during a real
  // user action: a mouse press or key, but on touch screens only the finger lifting (touchend /
  // click), not the touch going down. So listen to all of them and keep listening until the audio
  // is really running. On iPhone, "playback" makes the music play even with the ringer switch on silent.
  const GESTURES = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
  const unlock = () => {
    if (!init()) return;
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { /* older browsers */ }
    if (!noise) noise = noiseBuffer(1);
    try { // a silent blip inside the gesture, which old iOS needs before it will play anything
      const b = ctx.createBuffer(1, 1, ctx.sampleRate), s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start(0);
    } catch (e) { /* ignore */ }
    const done = () => {
      if (ctx.state !== "running") return;
      GESTURES.forEach((g) => document.removeEventListener(g, unlock, true));
      K.Sound.refresh();
    };
    if (ctx.state !== "running") { const r = ctx.resume(); if (r && r.then) r.then(done, () => {}); }
    done();
  };
  GESTURES.forEach((g) => document.addEventListener(g, unlock, true));
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) { stopMusic(); ctx.suspend(); }
    else { ctx.resume(); K.Sound.refresh(); }
  });
})(window.K = window.K || {});
