/* Divine weapons, seen and heard. Invoking an astra is a short full-screen moment drawn in code over
   the battle painting (no art file, no video): the painting darkens, the mantra runs as a line of
   light, then the weapon's own effect, from your figure to the one it is loosed at:
     agneya    fire raining down, orange light and embers
     varuna    sheets of rain, a blue cast, steam
     vayavya   wind and dust streaking across, the enemy pushed back
     sammohana a violet haze; the foes slump
     nagapasha a serpent coil drawn around one foe
     generic   a white bolt and a shockwave (the one astra the game has today)
   Against one of the epic's heroes the counter-weapon answers: two streaks meet in the air in a white
   flash and a ring of force, the screen shakes once, and both are gone.
   With reduced motion: one soft flash. Nothing flashes more than once. */
(function (K) {
  "use strict";
  const U = K.UI;
  const KINDS = {
    agneya: { tint: "rgba(255, 110, 30, 0.28)", col: ["#ffd27a", "#ff8a2a", "#ff5a1a"] },
    varuna: { tint: "rgba(40, 110, 200, 0.3)", col: ["#cfe6ff", "#8ab8f0", "#5a8ad8"] },
    vayavya: { tint: "rgba(210, 190, 150, 0.22)", col: ["#f3e6c8", "#d8c49a", "#b8a070"] },
    sammohana: { tint: "rgba(120, 60, 170, 0.32)", col: ["#e2c8ff", "#b48ae8", "#8a5ad0"] },
    nagapasha: { tint: "rgba(40, 120, 70, 0.26)", col: ["#c8f0b8", "#6ac07a", "#3a8a4a"] },
    generic: { tint: "rgba(255, 240, 200, 0.18)", col: ["#ffffff", "#fff1c4", "#ffd680"] }
  };
  const center = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.4, w: r.width, h: r.height }; };

  U.astraFx = function (o) {
    if (K.headless || !document.body) return;
    const kind = KINDS[o.kind] ? o.kind : "generic", K2 = KINDS[kind];
    const W = window.innerWidth, H = window.innerHeight;
    const from = center(o.from) || { x: W * 0.25, y: H * 0.45 }, to = center(o.to) || { x: W * 0.75, y: H * 0.45 };
    if (K.Sound) { K.Sound.play("gong"); setTimeout(() => K.Sound.play(o.clash ? "hit" : "choose"), 650); }
    const layer = U.el('<div class="astra-fx" aria-hidden="true"><i class="ax-dark"></i><i class="ax-tint" style="background:' + K2.tint + '"></i><i class="ax-mantra"></i><canvas></canvas></div>');
    document.body.appendChild(layer);
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { layer.classList.add("still"); setTimeout(() => layer.remove(), 700); return; }
    const cv = layer.querySelector("canvas"), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    const g = cv.getContext("2d"); g.scale(dpr, dpr);
    const parts = [];
    const rnd = (a, b) => a + Math.random() * (b - a);
    // The weapon's own weather, around the target.
    const seed = () => {
      for (let i = 0; i < 90; i++) {
        if (kind === "agneya") parts.push({ x: to.x + rnd(-W * 0.3, W * 0.3), y: rnd(-H * 0.4, 0), vx: rnd(-30, 30), vy: rnd(380, 620), r: rnd(1.5, 4), c: K2.col[i % 3] });
        else if (kind === "varuna") parts.push({ x: rnd(0, W), y: rnd(-H, 0), vx: -60, vy: rnd(900, 1300), r: rnd(0.8, 1.6), len: rnd(14, 26), c: K2.col[i % 3] });
        else if (kind === "vayavya") parts.push({ x: rnd(-W * 0.5, 0), y: rnd(H * 0.2, H * 0.85), vx: rnd(900, 1500), vy: rnd(-30, 30), r: rnd(0.8, 2), len: rnd(30, 80), c: K2.col[i % 3] });
        else if (kind === "sammohana") parts.push({ x: to.x + rnd(-W * 0.25, W * 0.25), y: to.y + rnd(-H * 0.15, H * 0.2), vx: rnd(-12, 12), vy: rnd(-20, -6), r: rnd(18, 46), c: K2.col[i % 3], a: rnd(0.05, 0.14) });
      }
    };
    const t0 = performance.now(), BOLT = 520, DUR = 1700;
    let flashed = false, shook = false;
    const meet = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - H * 0.08 };
    function frame(now) {
      const t = now - t0, f = Math.min(1, t / DUR);
      g.clearRect(0, 0, W, H);
      // The bolt: from your hand to the target, or (a clash) from both sides to the middle.
      if (t < BOLT + 120) {
        const p = Math.min(1, t / BOLT);
        const line = (a, b, col) => {
          const x = a.x + (b.x - a.x) * p, y = a.y + (b.y - a.y) * p - Math.sin(p * Math.PI) * H * 0.06;
          g.strokeStyle = col; g.lineWidth = 5; g.shadowColor = col; g.shadowBlur = 24; g.lineCap = "round";
          g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo((a.x + x) / 2, Math.min(a.y, y) - H * 0.05, x, y); g.stroke();
          g.shadowBlur = 0;
        };
        if (o.clash) { line(from, meet, K2.col[0]); line(to, meet, "#f6f2ff"); } else line(from, to, K2.col[0]);
      }
      const at = o.clash ? meet : to;
      if (t >= BOLT && !flashed) {
        flashed = true;
        layer.classList.add("flash");
        if (o.clash && !shook) { shook = true; document.body.classList.add("ax-shake"); setTimeout(() => document.body.classList.remove("ax-shake"), 380); }
        if (!o.clash) seed();
      }
      if (t >= BOLT) {
        const q = Math.min(1, (t - BOLT) / 700);
        // The ring of force where it lands (or where the two weapons meet).
        if (o.clash || kind === "generic") {
          g.strokeStyle = "rgba(255, 250, 235," + (1 - q).toFixed(2) + ")"; g.lineWidth = 6 * (1 - q) + 1;
          g.beginPath(); g.arc(at.x, at.y, 20 + q * Math.max(W, H) * 0.35, 0, Math.PI * 2); g.stroke();
        }
        if (!o.clash && kind === "nagapasha") {
          // A serpent coil drawn around the foe.
          g.strokeStyle = K2.col[1]; g.lineWidth = 6; g.shadowColor = K2.col[0]; g.shadowBlur = 12; g.lineCap = "round";
          g.beginPath();
          const turns = 3.2 * Math.min(1, q * 1.4);
          for (let a = 0; a <= turns * Math.PI * 2; a += 0.15) { const yy = at.y + to.h * 0.35 - (a / (turns * Math.PI * 2 || 1)) * to.h * 0.6; const xx = at.x + Math.cos(a) * to.w * 0.36; a === 0 ? g.moveTo(xx, yy) : g.lineTo(xx, yy); }
          g.stroke(); g.shadowBlur = 0;
        }
        const dt = 1 / 60;
        for (const p of parts) {
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (kind === "varuna" || kind === "vayavya") {
            g.strokeStyle = p.c; g.globalAlpha = 0.7 * (1 - f); g.lineWidth = p.r;
            g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - (kind === "vayavya" ? p.len : p.vx * 0.02), p.y - (kind === "varuna" ? p.len : 0)); g.stroke();
          } else if (kind === "sammohana") {
            g.globalAlpha = p.a * (1 - f * 0.6); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r * (1 + q), 0, Math.PI * 2); g.fill();
          } else {
            g.globalAlpha = 1 - f; g.fillStyle = p.c; g.shadowColor = p.c; g.shadowBlur = 10; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
          }
          g.globalAlpha = 1;
        }
      }
      if (t < DUR) requestAnimationFrame(frame);
      else { layer.classList.add("out"); setTimeout(() => layer.remove(), 400); }
    }
    requestAnimationFrame(frame);
    // The enemy reels from wind; the foes slump under the haze.
    if (!o.clash && o.to && (kind === "vayavya" || kind === "sammohana")) setTimeout(() => o.to.classList.add(kind === "vayavya" ? "ax-pushed" : "ax-slump"), BOLT);
  };
})(window.K = window.K || {});
