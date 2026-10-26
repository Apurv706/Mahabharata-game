/* A small Web Audio instrument rack and sequencer for rendering the three music options offline.
   Everything is synthesized: drums (dhol, nagara, tabla, manjira, kick, clap), strings, brass, choir,
   shehnai, bansuri, sitar-like pluck, tanpura drone, sub bass, risers and a conch. */
(function () {
  "use strict";
  const R = { S: 1, r: 16 / 15, R: 9 / 8, g: 6 / 5, G: 5 / 4, m: 4 / 3, M: 45 / 32, P: 3 / 2, d: 8 / 5, D: 5 / 3, n: 9 / 5, N: 15 / 8 };

  function makeRack(ctx, opts) {
    const SA = opts.sa;
    const master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3.5; comp.attack.value = 0.01; comp.release.value = 0.25;
    // Tone: tame the sub-bass, add air on top.
    const lowCut = ctx.createBiquadFilter(); lowCut.type = "highpass"; lowCut.frequency.value = 32; lowCut.Q.value = 0.7;
    const lowShelf = ctx.createBiquadFilter(); lowShelf.type = "lowshelf"; lowShelf.frequency.value = 90; lowShelf.gain.value = -4;
    const air = ctx.createBiquadFilter(); air.type = "highshelf"; air.frequency.value = 4500; air.gain.value = 4;
    master.connect(lowCut); lowCut.connect(lowShelf); lowShelf.connect(air); air.connect(comp); comp.connect(ctx.destination);
    // Reverb: a synthetic hall.
    const rev = ctx.createConvolver();
    const len = ctx.sampleRate * 2.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    rev.buffer = ir;
    const revIn = ctx.createGain(); revIn.gain.value = 0.32; revIn.connect(rev); rev.connect(master);
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    { const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }

    // A channel: gain + pan, with a reverb send.
    function chan(level, pan = 0, send = 0.3) {
      const g = ctx.createGain(); g.gain.value = level;
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      g.connect(p); p.connect(master);
      const s = ctx.createGain(); s.gain.value = send; p.connect(s); s.connect(revIn);
      return g;
    }
    const env = (g, t, a, peak, hold, rel) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
      if (hold > 0) g.gain.setValueAtTime(Math.max(0.0002, peak), t + a + hold);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
    };
    const osc = (type, f, t, stop) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(stop); return o; };
    const noise = (t, dur) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.start(t, Math.random() * 1.5, dur); return s; };
    const freq = (note, base = SA) => {
      // "S", "r'", ".P", "n''" : degree, with ' for each octave up and . for each down.
      let oct = 0, s = note;
      while (s[0] === ".") { oct--; s = s.slice(1); }
      while (s.endsWith("'")) { oct++; s = s.slice(0, -1); }
      return base * R[s] * Math.pow(2, oct);
    };

    const C = {
      drone: chan(0.45, 0, 0.35), str: chan(0.6, -0.15, 0.4), ost: chan(0.5, 0.2, 0.25), brass: chan(0.5, 0.1, 0.35),
      choir: chan(0.6, 0, 0.6), lead: chan(0.68, 0.05, 0.4), flute: chan(0.68, -0.1, 0.45), pluck: chan(0.55, 0.25, 0.3),
      dhol: chan(0.6, -0.05, 0.12), nagara: chan(0.45, 0, 0.3), tabla: chan(0.75, 0.15, 0.15), metal: chan(0.42, 0.3, 0.2),
      kick: chan(0.5, 0, 0.05), clap: chan(0.5, -0.2, 0.3), bass: chan(0.38, 0, 0.05), fx: chan(0.35, 0, 0.5)
    };

    const I = {};
    // Tanpura: Pa Sa Sa Sa (low), long plucks with jawari shimmer.
    I.tanpura = (t, dur, base = SA) => {
      const notes = [base * 0.75, base, base, base * 0.5];
      for (let x = t, i = 0; x < t + dur; x += 1.1, i++) {
        const f = notes[i % 4];
        [1, 1.003].forEach((m) => {
          const o = osc("sawtooth", f * m, x, x + 4.6), lp = ctx.createBiquadFilter(), g = ctx.createGain();
          lp.type = "lowpass"; lp.frequency.setValueAtTime(2000, x); lp.frequency.exponentialRampToValueAtTime(400, x + 3.5); lp.Q.value = 6;
          o.connect(lp); lp.connect(g); g.connect(C.drone); env(g, x, 0.02, 0.05 * (f < 100 ? 0.5 : 1), 0, 4.4);
        });
      }
    };
    // String ensemble note: 3 detuned saws. style "pad" (legato swell) or "spic" (short).
    I.strings = (t, note, dur, vel = 1, style = "pad", ch = C.str) => {
      const f = typeof note === "number" ? note : freq(note);
      const out = ctx.createGain(), lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = style === "spic" ? 3200 : 2400; lp.Q.value = 0.7;
      lp.connect(out); out.connect(ch);
      [-8, 0, 7].forEach((c) => { const o = osc("sawtooth", f * Math.pow(2, c / 1200), t, t + dur + 1); o.connect(lp); });
      if (style === "spic") env(out, t, 0.006, 0.09 * vel, 0, Math.min(0.18, dur));
      else {
        out.gain.setValueAtTime(0.0001, t); out.gain.linearRampToValueAtTime(0.07 * vel, t + Math.min(0.35, dur * 0.4));
        out.gain.setValueAtTime(0.07 * vel, t + dur); out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);
      }
    };
    I.chord = (t, notes, dur, vel = 1, style = "pad") => notes.forEach((n) => I.strings(t, n, dur, vel / Math.sqrt(notes.length) * 1.4, style));
    // Brass stab / swell: saws with an opening filter.
    I.brass = (t, notes, dur, vel = 1) => notes.forEach((n) => {
      const f = freq(n), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      lp.type = "lowpass"; lp.Q.value = 2; lp.frequency.setValueAtTime(350, t); lp.frequency.exponentialRampToValueAtTime(2800, t + 0.08); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
      [osc("sawtooth", f, t, t + dur + 0.4), osc("sawtooth", f * 1.004, t, t + dur + 0.4), osc("square", f / 2, t, t + dur + 0.4)].forEach((o) => o.connect(lp));
      lp.connect(g); g.connect(C.brass); env(g, t, 0.03, 0.06 * vel / Math.sqrt(notes.length) * 1.3, Math.max(0, dur - 0.1), 0.3);
    });
    // Choir "aah": saw chord through vowel formants, slow swell with vibrato.
    I.choir = (t, notes, dur, vel = 1, vowel = "a") => {
      const F = vowel === "o" ? [[500, 1], [800, 0.6], [2800, 0.15]] : [[780, 1], [1180, 0.7], [2900, 0.25]];
      const sum = ctx.createGain(); sum.connect(C.choir);
      const bands = F.map(([fc, a]) => { const b = ctx.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = fc; b.Q.value = 6; const g = ctx.createGain(); g.gain.value = a; b.connect(g); g.connect(sum); return b; });
      const lfo = osc("sine", 5.1, t, t + dur + 1.2), lg = ctx.createGain(); lg.gain.value = 3; lfo.connect(lg);
      notes.forEach((n) => [-6, 5].forEach((c) => {
        const o = osc("sawtooth", freq(n) * Math.pow(2, c / 1200), t, t + dur + 1.2); lg.connect(o.frequency); bands.forEach((b) => o.connect(b));
      }));
      sum.gain.setValueAtTime(0.0001, t); sum.gain.linearRampToValueAtTime(0.32 * vel / Math.sqrt(notes.length), t + Math.min(0.8, dur * 0.5));
      sum.gain.setValueAtTime(0.32 * vel / Math.sqrt(notes.length), t + dur); sum.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.1);
    };
    // A melodic line: [{n, d}] in beats. kind: shehnai | bansuri | strings-lead. Glides between notes.
    I.line = (t, beat, notes, kind = "shehnai", vel = 1, octaveBase = SA * 2) => {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), out = ctx.createGain();
      const lfo = ctx.createOscillator(), vib = ctx.createGain(); lfo.frequency.value = kind === "shehnai" ? 6.2 : 5.3; vib.gain.value = 0;
      lfo.connect(vib); vib.connect(o.frequency); vib.connect(o2.frequency);
      let chain;
      if (kind === "shehnai") {
        o.type = "sawtooth"; o2.type = "square";
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 450;
        const pk = ctx.createBiquadFilter(); pk.type = "peaking"; pk.frequency.value = 1400; pk.Q.value = 2; pk.gain.value = 9;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4200;
        const g2 = ctx.createGain(); g2.gain.value = 0.25; o.connect(hp); o2.connect(g2); g2.connect(hp); hp.connect(pk); pk.connect(lp); chain = lp;
      } else {
        o.type = "sine"; o2.type = "triangle";
        const g2 = ctx.createGain(); g2.gain.value = 0.2; const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3000;
        o.connect(lp); o2.connect(g2); g2.connect(lp); chain = lp;
        const br = noise(t, 10), bp = ctx.createBiquadFilter(), bg = ctx.createGain(); bp.type = "bandpass"; bp.frequency.value = 2200; bp.Q.value = 1.5; bg.gain.value = 0.05;
        br.loop = true; br.connect(bp); bp.connect(bg); bg.connect(out);
      }
      chain.connect(out); out.connect(kind === "shehnai" ? C.lead : C.flute);
      const peak = (kind === "shehnai" ? 0.11 : 0.16) * vel;
      let x = t;
      out.gain.setValueAtTime(0.0001, t);
      let first = true, end = t, prevF = 0;
      notes.forEach((nt, i) => {
        const d = nt.d * beat;
        if (nt.n === "-") { out.gain.setTargetAtTime(0.0001, x, 0.03); x += d; first = true; return; }
        const f = freq(nt.n, octaveBase), mult = kind === "shehnai" ? 1 : 2;
        if (first) { o.frequency.setValueAtTime(f, x); o2.frequency.setValueAtTime(f * mult, x); out.gain.setTargetAtTime(peak, x, 0.02); first = false; }
        else {
          const gl = Math.min(0.07, d * 0.3);
          o.frequency.setValueAtTime(prevF || f, x); o.frequency.exponentialRampToValueAtTime(f, x + gl);
          o2.frequency.setValueAtTime((prevF || f) * mult, x); o2.frequency.exponentialRampToValueAtTime(f * mult, x + gl);
          out.gain.setTargetAtTime(peak * 0.7, x, 0.008); out.gain.setTargetAtTime(peak * (nt.acc ? 1.2 : 1), x + 0.02, 0.02);
        }
        prevF = f;
        vib.gain.setValueAtTime(0, x);
        if (d > 0.45) vib.gain.linearRampToValueAtTime(f * 0.012, x + d * 0.85);
        x += d; end = x;
      });
      out.gain.setTargetAtTime(0.0001, end, 0.08);
      [o, o2, lfo].forEach((n) => { n.start(t); n.stop(end + 0.6); });
      return end;
    };
    // Sitar-like pluck: bright saw with a fast filter decay and a buzzy waveshaper, slight bend up.
    const shaper = ctx.createWaveShaper(); { const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; c[i] = Math.tanh(3 * x) + 0.15 * Math.sin(9 * x); } shaper.curve = c; }
    shaper.connect(C.pluck);
    I.pluck = (t, note, dur = 0.5, vel = 1, bend = 0) => {
      const f = freq(note, SA * 2), o = osc("sawtooth", f, t, t + dur + 0.6), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      if (bend) o.frequency.exponentialRampToValueAtTime(f * Math.pow(2, bend / 12), t + Math.min(0.25, dur));
      lp.type = "lowpass"; lp.Q.value = 4; lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(700, t + dur);
      o.connect(lp); lp.connect(g); g.connect(shaper); env(g, t, 0.002, 0.16 * vel, 0, dur + 0.4);
    };
    // Drums.
    I.dhol = (t, side, vel = 1) => { // "dha" (bass) "ta" (treble stick) "both"
      if (side !== "ta") {
        const o = osc("sine", 95, t, t + 0.5), g = ctx.createGain(); o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
        o.connect(g); g.connect(C.dhol); env(g, t, 0.003, 0.55 * vel, 0, 0.32);
        const n = noise(t, 0.12), lp = ctx.createBiquadFilter(), ng = ctx.createGain(); lp.type = "lowpass"; lp.frequency.value = 600; n.connect(lp); lp.connect(ng); ng.connect(C.dhol); env(ng, t, 0.002, 0.3 * vel, 0, 0.08);
      }
      if (side !== "dha") {
        const n = noise(t, 0.08), bp = ctx.createBiquadFilter(), ng = ctx.createGain(); bp.type = "bandpass"; bp.frequency.value = 2300; bp.Q.value = 1.3; n.connect(bp); bp.connect(ng); ng.connect(C.dhol); env(ng, t, 0.001, 0.4 * vel, 0, 0.06);
        const o = osc("triangle", 420, t, t + 0.15), g = ctx.createGain(); o.frequency.exponentialRampToValueAtTime(330, t + 0.08); o.connect(g); g.connect(C.dhol); env(g, t, 0.001, 0.15 * vel, 0, 0.09);
      }
    };
    I.nagara = (t, vel = 1) => {
      const o = osc("sine", 70, t, t + 1.6), g = ctx.createGain(); o.frequency.exponentialRampToValueAtTime(36, t + 0.9);
      o.connect(g); g.connect(C.nagara); env(g, t, 0.004, 0.75 * vel, 0, 1.3);
      const n = noise(t, 0.4), lp = ctx.createBiquadFilter(), ng = ctx.createGain(); lp.type = "lowpass"; lp.frequency.value = 300; n.connect(lp); lp.connect(ng); ng.connect(C.nagara); env(ng, t, 0.003, 0.5 * vel, 0, 0.35);
    };
    I.tabla = (t, bol, vel = 1) => {
      const bay = () => { const o = osc("sine", 80, t, t + 0.6), g = ctx.createGain(); o.frequency.exponentialRampToValueAtTime(104, t + 0.12); o.connect(g); g.connect(C.tabla); env(g, t, 0.003, 0.35 * vel, 0, 0.45); };
      const day = (ring, click) => {
        [[1, 1], [2, 0.45], [3, 0.25]].forEach(([m, a], i) => { const o = osc("sine", SA * 2 * m, t, t + ring + 0.1), g = ctx.createGain(); o.connect(g); g.connect(C.tabla); env(g, t, 0.002, 0.14 * a * vel, 0, ring / (1 + i * 0.7)); });
        const n = noise(t, 0.05), bp = ctx.createBiquadFilter(), g = ctx.createGain(); bp.type = "bandpass"; bp.frequency.value = 3300; bp.Q.value = 1.2; n.connect(bp); bp.connect(g); g.connect(C.tabla); env(g, t, 0.001, 0.13 * click * vel, 0, 0.03);
      };
      if (bol === "dha") { bay(); day(0.3, 0.8); } else if (bol === "dhin") { bay(); day(0.5, 0.3); }
      else if (bol === "na" || bol === "ta") day(0.25, 1); else if (bol === "tin") day(0.45, 0.2);
      else if (bol === "ti" || bol === "ra" || bol === "ki" || bol === "te") day(0.08, 0.9);
      else if (bol === "ge") bay();
      else if (bol === "ka") { const n = noise(t, 0.06), lp = ctx.createBiquadFilter(), g = ctx.createGain(); lp.type = "lowpass"; lp.frequency.value = 900; n.connect(lp); lp.connect(g); g.connect(C.tabla); env(g, t, 0.001, 0.25 * vel, 0, 0.05); }
    };
    I.manjira = (t, vel = 1, open = true) => {
      [3150, 4730, 6300, 7900].forEach((f, i) => { const o = osc("sine", f * (1 + Math.random() * 0.01), t, t + 1), g = ctx.createGain(); o.connect(g); g.connect(C.metal); env(g, t, 0.001, 0.05 * vel / (i + 1), 0, open ? 0.6 : 0.08); });
      const n = noise(t, 0.2), hp = ctx.createBiquadFilter(), g = ctx.createGain(); hp.type = "highpass"; hp.frequency.value = 6000; n.connect(hp); hp.connect(g); g.connect(C.metal); env(g, t, 0.001, 0.12 * vel, 0, open ? 0.15 : 0.04);
    };
    I.kick = (t, vel = 1) => { const o = osc("sine", 140, t, t + 0.5), g = ctx.createGain(); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); o.connect(g); g.connect(C.kick); env(g, t, 0.002, 0.7 * vel, 0, 0.35); };
    I.clap = (t, vel = 1) => { for (let k = 0; k < 3; k++) { const n = noise(t + k * 0.011, 0.12), bp = ctx.createBiquadFilter(), g = ctx.createGain(); bp.type = "bandpass"; bp.frequency.value = 1300; bp.Q.value = 0.9; n.connect(bp); bp.connect(g); g.connect(C.clap); env(g, t + k * 0.011, 0.001, 0.35 * vel, 0, k === 2 ? 0.14 : 0.02); } };
    I.bass = (t, note, dur, vel = 1) => {
      const f = freq(note, SA / 2), o = osc("sawtooth", f, t, t + dur + 0.2), o2 = osc("sine", f / 2, t, t + dur + 0.2), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      lp.type = "lowpass"; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(220, t + dur); lp.Q.value = 3;
      o.connect(lp); o2.connect(g); lp.connect(g); g.connect(C.bass); env(g, t, 0.005, 0.22 * vel, Math.max(0, dur - 0.08), 0.06);
    };
    I.riser = (t, dur, vel = 1) => {
      const n = noise(t, dur + 0.1), bp = ctx.createBiquadFilter(), g = ctx.createGain(); n.loop = true;
      bp.type = "bandpass"; bp.Q.value = 3; bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(6000, t + dur);
      n.connect(bp); bp.connect(g); g.connect(C.fx); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35 * vel, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    };
    I.conch = (t, vel = 1) => {
      const o = osc("sawtooth", 205, t, t + 3.2), o2 = osc("triangle", 410, t, t + 3.2), lfo = osc("sine", 5.2, t, t + 3.2), lg = ctx.createGain(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.frequency.linearRampToValueAtTime(233, t + 0.5); o.frequency.linearRampToValueAtTime(228, t + 2.4); o2.frequency.linearRampToValueAtTime(466, t + 0.5);
      lg.gain.value = 3; lfo.connect(lg); lg.connect(o.frequency); bp.type = "bandpass"; bp.frequency.value = 820; bp.Q.value = 1.6;
      o.connect(bp); o2.connect(bp); bp.connect(g); g.connect(C.fx);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9 * vel, t + 0.4); g.gain.setValueAtTime(0.9 * vel, t + 2); g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    };
    I.bell = (t, note, vel = 1) => { const f = freq(note, SA * 4); [[1, 1], [2.76, 0.4], [5.4, 0.2]].forEach(([m, a]) => { const o = osc("sine", f * m, t, t + 2.5), g = ctx.createGain(); o.connect(g); g.connect(C.metal); env(g, t, 0.002, 0.12 * a * vel, 0, 2.2); }); };
    return { I, C, freq, master };
  }

  // Parse "S:1 r:0.5 - :1 g'" → [{n, d, acc}]
  function seq(str, defD = 1) {
    return str.trim().split(/\s+/).map((tok) => {
      const acc = tok.startsWith("!"); if (acc) tok = tok.slice(1);
      const [n, d] = tok.split(":");
      return { n, d: d ? parseFloat(d) : defD, acc };
    });
  }
  window.FUSION = { makeRack, seq };
})();
