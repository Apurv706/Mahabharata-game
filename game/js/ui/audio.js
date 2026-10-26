/* Sound, made in the browser with Web Audio: no sound files to download.
   A tanpura-like drone under the story, the scratch of the quill as it writes, a conch for each day
   of the war, a gong when a vow is sworn, blows and healing in battle, and a low tone as the lamp
   gutters. Browsers allow sound only after the player taps or presses a key, so nothing plays until
   then. Menu has switches for sound effects and for the drone. */
(function (K) {
  "use strict";
  const U = K.UI;
  let ctx = null, master = null, sfxBus = null, droneBus = null, droneTimer = null, droneStep = 0;
  const on = (key) => K.prefs()[key] !== false;
  const available = () => typeof window.AudioContext === "function" || typeof window.webkitAudioContext === "function";

  function init() {
    if (ctx || !available()) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
      droneBus = ctx.createGain(); droneBus.gain.value = 0; droneBus.connect(master);
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
  let noise = null;

  // ---------- Drone: four strings plucked in turn, Pa Sa Sa Sa, around C# ----------
  const SA = 138.59;
  const STRINGS = [SA * 0.75, SA, SA, SA * 0.5]; // Pa (low), Sa, Sa, Sa (low)
  function pluck(freq, t) {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o1.type = "sawtooth"; o2.type = "sawtooth";
    o1.frequency.value = freq; o2.frequency.value = freq * 1.003; // the jawari shimmer: two strings slightly apart
    f.type = "lowpass"; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(500, t + 3.2); f.Q.value = 6;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(droneBus);
    env(g, t, 0.02, 0.09, 4.2);
    o1.start(t); o2.start(t); o1.stop(t + 4.4); o2.stop(t + 4.4);
  }
  function droneTick() {
    if (!ctx || !on("drone") || !on("sound")) return;
    pluck(STRINGS[droneStep % 4], now() + 0.02);
    droneStep++;
  }
  function startDrone() {
    if (!init() || droneTimer || !on("drone") || !on("sound")) return;
    droneBus.gain.cancelScheduledValues(now());
    droneBus.gain.setTargetAtTime(0.55, now(), 1.5);
    droneTick();
    droneTimer = setInterval(droneTick, 1150);
  }
  function stopDrone() {
    if (droneTimer) { clearInterval(droneTimer); droneTimer = null; }
    if (ctx) droneBus.gain.setTargetAtTime(0, now(), 0.6);
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
    // Called from the Menu switches.
    refresh() { if (on("sound") && on("drone")) startDrone(); else stopDrone(); },
    supported: available
  };

  // Unlock on the first gesture, then start the drone.
  const unlock = () => {
    if (!init()) return;
    if (ctx.state === "suspended") ctx.resume();
    if (!noise) noise = noiseBuffer(1);
    K.Sound.refresh();
    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("keydown", unlock, true);
  };
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) { stopDrone(); ctx.suspend(); }
    else { ctx.resume(); K.Sound.refresh(); }
  });
})(window.K = window.K || {});
