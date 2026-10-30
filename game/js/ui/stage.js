/* Test stages: every action test is played inside a painted stage.
   - The painting (art/stage_*.webp) becomes the full-screen backdrop while the test runs.
   - A strip of the same painting sits at the top of the test, with shadow puppets of the people
     involved standing on its ground: you on the left, the others facing you. They react: you draw,
     push or duck as you act; they stagger when you score and you stagger when you slip.
   - Effects drawn in code over the backdrop: fireflies, dust, rain, embers, sparks, mist, falling
     leaves, torchlight. They stop on phones and with reduced motion, and pause when the tab is hidden.
   Top-down stages (a table, a forest seen from above) have no ground to stand on: the painting goes
   under the play area instead, and the figures stand small beside it. */
(function (K) {
  "use strict";
  const U = K.UI;

  // What moves on each stage, and where its torches burn (as shares of the screen).
  const STAGES = {
    stage_mango_yard: { fx: "leaves" },
    stage_palace_garden_night: { fx: "fireflies" },
    stage_river_shallows: { fx: "dust" },
    stage_stable_yard: { fx: "dust" },
    stage_lotus_garden: { fx: "fireflies" },
    stage_training_ground: { fx: "dust" },
    stage_forest_clearing_night: { fx: "fireflies" },
    stage_vidura_table: { fx: "torch", torches: [[0.18, 0.2]], top: true },
    stage_racetrack: { fx: "dust", side: true },
    stage_board_table: { fx: "torch", torches: [[0.85, 0.18]], top: true },
    stage_healers_hall: { fx: "dust" },
    stage_palace_corridor: { fx: "torch", torches: [[0.2, 0.32], [0.5, 0.32], [0.8, 0.32]], side: true },
    stage_lac_wall: { fx: "fireflies", side: true },
    stage_bow_courtyard: { fx: "torch", torches: [[0.12, 0.38], [0.88, 0.38]] },
    stage_forest_edge: { fx: "mist" },
    stage_drupada_hall: { fx: "torch", torches: [[0.15, 0.35], [0.85, 0.35]] },
    stage_khandava_top: { fx: "embers", top: true },
    stage_storm_sea: { fx: "rain", side: true },
    stage_elephant_grounds: { fx: "dust" },
    stage_forest_maze_top: { fx: "mist", top: true },
    stage_dice_board_top: { fx: "torch", torches: [[0.12, 0.15], [0.88, 0.85]], top: true },
    stage_city_night: { fx: "torch", torches: [[0.25, 0.4], [0.7, 0.36]], side: true },
    stage_forest_lake: { fx: "mist" },
    stage_smithy: { fx: "sparks" },
    stage_matsya_ford: { fx: "dust", side: true },
    stage_prison_yard: { fx: "torch", torches: [[0.78, 0.3]], side: true },
    stage_border_village: { fx: "embers" },
    stage_chakravyuha_top: { fx: "dust", top: true },
    stage_battlefield_night: { fx: "embers", side: true },
    scene_fair: { fx: "dust" },
    fight_fair_ring: { fx: "dust" },
    scene_teaching: { fx: "mist" }
  };
  U.STAGES = STAGES;
  U.stageInfo = (key) => STAGES[key] || {};

  // ---------- The cast ----------
  // trial.stage: the painting; trial.cast: puppet ids (K.PUPPETS) for the others in the scene.
  U.castBand = function (t) {
    if (!t || !t.stage || !K.puppetSpec) return "";
    const info = U.stageInfo(t.stage);
    const me = U.puppet(K.puppetSpec(K.S), { h: 150, label: K.tr("You"), cls: "actor-me" });
    // Elders (a teacher, a sage) are marked: some tests stand them apart, further back.
    const others = (K.val(t.cast) || []).slice(0, 3).map((id, i) => { const sp = U.puppetFor(id) || {};
      return '<span class="actor foe f' + i + (sp.stage === "elder" ? " elder" : "") + '" data-id="' + id + '">' + U.puppet(sp, { h: 150, flip: true }) + "</span>"; }).join("");
    return '<div class="cast' + (info.top ? " top" : "") + (info.side ? " side" : "") + '" style="--stage:url(\'' + U.artUrl(U.stripOf(t.stage)) + '\')" aria-hidden="true">' +
      '<span class="actor me">' + me + "</span>" + others + "</div>";
  };
  // Set a pose for a while, then return to the stance for this test.
  const timers = new WeakMap();
  U.castPose = function (host, who, pose, ms) {
    if (!host) return;
    const els = who === "me" ? host.querySelectorAll(".cast .actor.me .pp") : who === "all" ? host.querySelectorAll(".cast .pp") : host.querySelectorAll(".cast .actor.foe .pp");
    els.forEach((el) => {
      if (!el.dataset.base) el.dataset.base = (el.getAttribute("class").match(/pose-(\S+)/) || [])[1] || "stand";
      el.setAttribute("class", el.getAttribute("class").replace(/pose-\S+/, "pose-" + pose));
      clearTimeout(timers.get(el));
      if (ms) timers.set(el, setTimeout(() => { if (el.isConnected) el.setAttribute("class", el.getAttribute("class").replace(/pose-\S+/, "pose-" + el.dataset.base)); }, ms));
    });
  };
  U.castStance = function (host, mine, theirs) {
    if (!host) return;
    const set = (sel, pose) => host.querySelectorAll(sel).forEach((el) => { el.dataset.base = pose; el.setAttribute("class", el.getAttribute("class").replace(/pose-\S+/, "pose-" + pose)); });
    if (mine) set(".cast .actor.me .pp", mine);
    if (theirs) set(".cast .actor.foe .pp", theirs);
  };

  // ---------- Effects ----------
  let run = null;
  const calm = () => !U.motion() || window.innerWidth < 720 || /jsdom/i.test(navigator.userAgent || "");
  U.stageFx = {
    start(stageKey, kindOverride) {
      this.stop();
      const info = U.stageInfo(stageKey), kind = kindOverride || info.fx;
      const cv = U.$("stagefx");
      if (!cv || !kind || calm()) return;
      const ctx = cv.getContext && cv.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
      size();
      const W = () => cv.width, H = () => cv.height;
      const R = Math.random;
      const ps = [];
      const N = { fireflies: 46, dust: 60, rain: 160, embers: 70, sparks: 0, mist: 7, leaves: 22, torch: 0 }[kind] || 30;
      for (let i = 0; i < N; i++) ps.push(spawn(kind, true));
      function spawn(k, anywhere) {
        const w = W(), h = H();
        switch (k) {
          case "fireflies": return { x: R() * w, y: h * (0.35 + R() * 0.6), vx: (R() - 0.5) * 18, vy: (R() - 0.5) * 12, ph: R() * 6.3, r: (1.4 + R() * 1.8) * dpr };
          case "dust": return { x: R() * w, y: R() * h, vx: (6 + R() * 14) * dpr, vy: (R() - 0.6) * 6 * dpr, r: (0.8 + R() * 1.8) * dpr, a: 0.15 + R() * 0.3, ph: R() * 6.3 };
          case "rain": return { x: R() * w * 1.2, y: anywhere ? R() * h : -20, v: (900 + R() * 600) * dpr, l: (14 + R() * 18) * dpr };
          case "embers": return { x: R() * w, y: anywhere ? R() * h : h + 10, vx: (R() - 0.5) * 20 * dpr, vy: -(30 + R() * 60) * dpr, r: (1 + R() * 2.2) * dpr, life: 1, ph: R() * 6.3 };
          case "mist": return { x: R() * w, y: h * (0.45 + R() * 0.45), vx: (8 + R() * 12) * dpr * (R() < 0.5 ? -1 : 1), r: (180 + R() * 220) * dpr, a: 0.05 + R() * 0.06 };
          case "leaves": return { x: R() * w, y: anywhere ? R() * h : -20, vx: (10 + R() * 25) * dpr, vy: (25 + R() * 30) * dpr, rot: R() * 6.3, vr: (R() - 0.5) * 3, s: (4 + R() * 4) * dpr, ph: R() * 6.3 };
          case "spark": return { x: w * (0.3 + R() * 0.08), y: h * 0.62, vx: (R() - 0.3) * 260 * dpr, vy: -(120 + R() * 260) * dpr, life: 0.6 + R() * 0.6 };
          default: return {};
        }
      }
      let last = performance.now(), on = true, id = 0, burst = 0, t = 0;
      const torches = info.torches || [];
      const frame = (now) => {
        if (!on) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (document.hidden) { id = requestAnimationFrame(frame); return; }
        t += dt;
        const w = W(), h = H();
        ctx.clearRect(0, 0, w, h);
        if (kind === "torch" || torches.length) {
          // Warm light breathing around each torch.
          for (const [tx, ty] of torches) {
            const f = 0.75 + 0.15 * Math.sin(t * 9 + tx * 10) + 0.1 * Math.sin(t * 23 + ty * 7);
            const g = ctx.createRadialGradient(tx * w, ty * h, 0, tx * w, ty * h, 260 * dpr * f);
            g.addColorStop(0, "rgba(255,190,110," + 0.32 * f + ")"); g.addColorStop(1, "rgba(255,150,60,0)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          }
        }
        if (kind === "sparks") {
          burst -= dt;
          if (burst <= 0) { burst = 0.9 + R() * 1.4; for (let i = 0; i < 18; i++) ps.push(spawn("spark")); }
        }
        for (let i = ps.length - 1; i >= 0; i--) {
          const p = ps[i];
          switch (kind) {
            case "fireflies": {
              p.vx += (R() - 0.5) * 30 * dt; p.vy += (R() - 0.5) * 30 * dt; p.vx *= 0.98; p.vy *= 0.98;
              p.x += p.vx * dt * dpr; p.y += p.vy * dt * dpr; p.ph += dt * 2.2;
              if (p.x < 0 || p.x > w || p.y < h * 0.25 || p.y > h) Object.assign(p, spawn(kind, true));
              const a = Math.max(0, Math.sin(p.ph)) ** 2;
              const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
              g.addColorStop(0, "rgba(230,255,150," + 0.9 * a + ")"); g.addColorStop(1, "rgba(200,255,120,0)");
              ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 6, 0, 6.3); ctx.fill();
              break;
            }
            case "dust": {
              p.x += p.vx * dt; p.y += p.vy * dt + Math.sin(t + p.ph) * 0.2; if (p.x > w + 10) { p.x = -10; p.y = R() * h; }
              ctx.fillStyle = "rgba(255,236,200," + p.a + ")"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill();
              break;
            }
            case "rain": {
              p.y += p.v * dt; p.x -= p.v * 0.25 * dt; if (p.y > h) Object.assign(p, spawn(kind));
              ctx.strokeStyle = "rgba(200,220,235,0.35)"; ctx.lineWidth = dpr; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.l * 0.25, p.y - p.l); ctx.stroke();
              break;
            }
            case "embers": {
              p.x += (p.vx + Math.sin(t * 2 + p.ph) * 12 * dpr) * dt; p.y += p.vy * dt; p.life -= dt * 0.18;
              if (p.y < -10 || p.life <= 0) Object.assign(p, spawn(kind));
              ctx.fillStyle = "rgba(255," + (120 + Math.round(80 * p.life)) + ",60," + 0.8 * p.life + ")"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill();
              break;
            }
            case "mist": {
              p.x += p.vx * dt; if (p.x < -p.r) p.x = w + p.r; if (p.x > w + p.r) p.x = -p.r;
              const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
              g.addColorStop(0, "rgba(235,235,225," + p.a + ")"); g.addColorStop(1, "rgba(235,235,225,0)");
              ctx.fillStyle = g; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
              break;
            }
            case "leaves": {
              p.x += (p.vx + Math.sin(t * 1.5 + p.ph) * 20 * dpr) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
              if (p.y > h + 20) Object.assign(p, spawn(kind));
              ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = "rgba(96,124,48,0.75)";
              ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, 6.3); ctx.fill(); ctx.restore();
              break;
            }
            case "sparks": {
              p.vy += 520 * dpr * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
              if (p.life <= 0) { ps.splice(i, 1); break; }
              ctx.strokeStyle = "rgba(255,200,90," + Math.min(1, p.life * 1.5) + ")"; ctx.lineWidth = 1.6 * dpr;
              ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02); ctx.stroke();
              break;
            }
          }
        }
        id = requestAnimationFrame(frame);
      };
      id = requestAnimationFrame(frame);
      addEventListener("resize", size);
      cv.classList.add("on");
      run = { stop() { on = false; cancelAnimationFrame(id); removeEventListener("resize", size); ctx.clearRect(0, 0, cv.width, cv.height); cv.classList.remove("on"); } };
    },
    stop() { if (run) { run.stop(); run = null; } }
  };
})(window.K = window.K || {});
