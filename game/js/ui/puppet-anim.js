/* Puppets with weight (quality review 13-15, as tried on the motion test page).
   A figure drawn with { pose: "live" } is driven joint by joint from a small spring per joint,
   stepped every frame against real time (so it moves the same at 60 Hz and 120 Hz): limbs
   overshoot a little and settle like a rod puppet, a dangling arm sways, and a figure can be
   kicked (knocked back), frozen for a beat on contact (hit-stop), made to tremble, pinned by the
   foot, or let fall limb by limb, pivoting on its feet.

   U.rig(svg, actorEl, base) → a Rig (or null when motion is reduced: the CSS poses are used then).
   rig.set(pose, stiffness, damping, snap)  aim every joint at a pose from POSES
   rig.home()                               back to its own resting pose
   rig.kick({ joint: velocity })            a push on some joints (an impact)
   rig.fallDown()                           the joints go slack and it topples about its feet
   U.rigFreeze(ms)                          hold every live figure still for a moment (hit-stop)
   U.rigs.clear()                           forget every figure (a new screen)

   A bow is held upright in the fist whatever the arm does, its string draws back to the face with
   an arrow nocked (key "draw", 0..1) and snaps back on release; "tilt" leans it up or down. */
(function (K) {
  "use strict";
  const U = K.UI;

  // Joint angles in degrees; rot/tx/ty move the body (figure units). Built from the CSS poses
  // (screens.css) so a live figure takes the same shapes, plus the fighting poses of the test page.
  const POSES = {
    stand: { armF: 8, foreF: -16, armB: -6 },
    ready: { rot: -3, armF: -52, foreF: -46, armB: -18, foreB: -28, legF: -12, legB: 12, shinB: 8, item: 180 },
    bowready: { rot: -2, armF: -40, foreF: -30, armB: -10, foreB: -20, legF: -12, legB: 12, shinB: 8 },
    brace: { rot: -8, armF: -96, foreF: -60, legF: -16, legB: 16, item: 180 },
    windup: { rot: -11, tx: -5, head: -6, armF: -172, foreF: -24, armB: -26, foreB: -20, legF: -20, legB: 18, shinB: 12, item: 180 },
    strike: { rot: 13, tx: 9, head: 5, armF: -38, foreF: -4, armB: 12, foreB: -10, legF: -30, shinF: 12, legB: 24, shinB: 6, item: 180 },
    draw: { rot: -3, head: -2, armF: -84, foreF: -6, armB: -86, foreB: 150, legF: -14, legB: 14, shinB: 6, draw: 1 },
    loose: { rot: 1, armF: -84, foreF: -6, armB: -60, foreB: -10, legF: -14, legB: 14, shinB: 6 },
    drawUp: { rot: -12, head: -14, armF: -118, foreF: -6, armB: -120, foreB: 150, legF: -18, legB: 16, shinB: 8, draw: 1, tilt: -30 },
    looseUp: { rot: -9, head: -12, armF: -118, foreF: -6, armB: -92, foreB: -10, legF: -18, legB: 16, shinB: 8, tilt: -30 },
    drawLow: { rot: 4, head: 6, armF: -62, foreF: -6, armB: -64, foreB: 150, legF: -16, legB: 16, shinB: 8, draw: 1, tilt: 18 },
    looseLow: { rot: 6, head: 6, armF: -62, foreF: -6, armB: -40, foreB: -10, legF: -16, legB: 16, shinB: 8, tilt: 18 },
    guard: { rot: -8, ty: 6, head: 4, armF: -112, foreF: -70, armB: -60, foreB: -50, legF: -24, shinF: 14, legB: 22, shinB: 14, item: 180 },
    block: { rot: -6, armF: -112, foreF: -70, item: 180 },
    kneel: { ty: 26, head: 14, legF: -84, shinF: 96, legB: 8, shinB: 98, armF: -36, foreF: -84, armB: -30, foreB: -70 },
    strain: { rot: -14, head: -10, armF: -30, foreF: -40, armB: 30, foreB: -20, legB: 28, shinB: 10 },
    slack: { armF: 70, foreF: 30, armB: 40, foreB: 20, head: 22, legF: -14, shinF: 18, legB: 8, shinB: 10, item: 120 },
    duck: { ty: 34, rot: 16, head: 10, legF: -96, shinF: 112, legB: 8, shinB: 104, armF: -44, foreF: -70, armB: -20, foreB: -30, item: 180 },
    jump: { ty: -6, legF: -78, shinF: 104, legB: -48, shinB: 96, armF: -150, armB: -130, item: 180 },
    side: { rot: -16, head: -10, legF: 26, legB: -30, armF: 40 },
    aim: { rot: -2, armF: -84, foreF: -6, armB: -86, foreB: 150 },
    hold: { rot: 6, armF: -66, foreF: -24, armB: -58, foreB: -30, item: 180 },
    push: { rot: 14, armF: -72, foreF: -18, armB: -66, foreB: -22, legF: -26, shinF: 18, legB: 20, shinB: 6, item: 180 },
    sneak: { ty: 12, rot: 20, legF: -42, shinF: 52, legB: 26, shinB: 44, armF: -40, foreF: -40, item: 180 },
    think: { head: 10, armF: -28, foreF: -140, item: 180 },
    speak: { head: -4, armF: -58, foreF: -30, item: 180 },
    cheer: { rot: -4, armF: -166, foreF: -10, armB: -150, item: 180 },
    slump: { rot: 11, ty: 3, head: 26, armF: 4, armB: 2 },
    fold: { armF: -38, foreF: -118, armB: -30, foreB: -120, item: 180 },
    walk: { armF: 8, foreF: -16, armB: -6 }
  };
  const KEYS = ["rot", "tx", "ty", "head", "armF", "foreF", "armB", "foreB", "legF", "shinF", "legB", "shinB", "item", "draw", "tilt", "dx"];
  const JOINTS = ["head", "armF", "foreF", "armB", "foreB", "legF", "shinF", "legB", "shinB"];
  // How each kind of figure stands at rest (spec.stance in puppet.js, as data-stance on the figure):
  // the same shapes as the .sx-* rules in screens.css. A live figure whose base pose is "stand"
  // stands in its own stance instead.
  Object.assign(POSES, {
    stoop: { ty: 4, rot: 12, head: -14, armF: -30, foreF: -62, armB: 10, foreB: -30, legF: -12, shinF: 10, legB: 10, shinB: 10, item: 180 },
    square: { rot: -2, armF: -4, foreF: -22, armB: -44, foreB: -50, legF: -12, legB: 12 },
    archer: { rot: -2, armF: -14, foreF: -10, armB: -8, foreB: -24, legF: -10, legB: 10 },
    raised: { rot: -4, armF: -150, foreF: -20, armB: -40, foreB: -56, legF: -16, shinF: 4, legB: 16, shinB: 8, item: 180 },
    proud: { rot: -4, head: -6, armF: -62, foreF: -48, armB: -10, foreB: -30, legF: -14, legB: 14 },
    hero: { rot: -3, head: -4, armF: -16, foreF: -14, armB: -10, foreB: -28, legF: -14, legB: 14 },
    haughty: { rot: -7, head: -12, armF: -58, foreF: -46, armB: -60, foreB: -120, legF: -18, legB: 16 },
    broad: { rot: -2, head: -4, armF: -6, foreF: -4, armB: -36, foreB: -40, legF: -22, legB: 22, shinB: 4, item: 180 },
    sage: { rot: 3, head: 4, armF: -14, foreF: -12, armB: -8, foreB: -30, legF: -8, legB: 8 }
  });
  const reduced = () => !U.motion || !U.motion();

  const live = new Set();
  let frozen = 0, last = 0, raf = 0;
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016); last = now;
    if (frozen > 0) frozen -= dt * 1000;
    else for (const r of live) { if (!r.svg.isConnected) { live.delete(r); continue; } r.step(dt, now / 1000); }
    if (live.size) raf = requestAnimationFrame(frame); else last = 0;
  }
  const wake = () => { if (!raf && live.size && typeof requestAnimationFrame === "function") raf = requestAnimationFrame(frame); };

  function Rig(svg, el, base) {
    this.svg = svg; this.el = el || svg.parentNode; this.baseName = POSES[base] ? base : "stand";
    this.g = {}; for (const k of JOINTS) this.g[k] = svg.querySelector("." + k);
    this.body = svg.querySelector(".pp-body"); this.itemEl = svg.querySelector(".it-w");
    this.bow = null;
    const b = svg.querySelector(".it:not(.it-w)"), str = b && b.querySelector('path[d="M50 86 L50 166"]');
    if (str) {
      this.bow = b; this.string = str;
      str.setAttribute("stroke-width", "1.1"); str.setAttribute("fill", "none");
      b.style.transformBox = "view-box"; b.style.transformOrigin = "60.5px 126px";
      b.insertAdjacentHTML("beforeend", '<g class="nock" opacity="0"><path d="M50 126 L80 126" stroke="#e6c98c" stroke-width="2.2"/><path d="M50 126 L80 126" stroke="#24120a" stroke-width=".5" opacity=".6"/><path d="M80 122.6 L87 126 L80 129.4 Z" fill="#dcd7c8" stroke="#24120a" stroke-width=".6"/><path d="M50 126 l-4 -3 M50 126 l-4 3" stroke="#c8402c" stroke-width="1.6"/></g>');
      this.nock = b.querySelector(".nock");
    }
    this.x = {}; this.v = {}; this.t = {};
    for (const k of KEYS) { this.x[k] = 0; this.v[k] = 0; this.t[k] = 0; }
    this.k = 480; this.z = 0.5; this.fall = 0; this.fallV = 0; this.falling = false; this.tremble = 0; this.pinned = 0;
    this.phase = Math.random() * 6;
    this.set(this.baseName, 480, 0.5, true);
    live.add(this); wake();
  }
  Rig.prototype.set = function (name, k, z, snap) {
    const p = POSES[name] || POSES.stand;
    for (const key of KEYS) if (key !== "dx") this.t[key] = p[key] || 0;
    if (k) this.k = k; if (z != null) this.z = z;
    if (snap) { for (const key of KEYS) { this.x[key] = this.t[key]; this.v[key] = 0; } this.apply(); }
    this.pose = name; wake();
    return this;
  };
  Rig.prototype.home = function (k) { return this.set(this.baseName, k || 520, 0.42); };
  Rig.prototype.base = function (name) { if (POSES[name]) this.baseName = name; return this; };
  Rig.prototype.kick = function (o) { for (const k in o) this.v[k] += o[k]; wake(); return this; };
  Rig.prototype.fallDown = function () { this.set("slack"); this.falling = true; this.fallV = 140; wake(); return this; };
  Rig.prototype.stop = function () { live.delete(this); };
  Rig.prototype.step = function (dt, time) {
    const c = 2 * this.z * Math.sqrt(this.k);
    // Breathing and dangling: a slow sway added to the target, so the figure is never frozen.
    const sway = this.falling ? 0 : Math.sin(time * 1.6 + this.phase);
    const shiver = this.tremble ? Math.sin(time * 70) * this.tremble : 0;
    const tug = this.pinned ? Math.sin(time * 9) * 5 * this.pinned : 0;
    for (const k of KEYS) {
      let tgt = this.t[k];
      if (k === "rot") tgt += sway * 1.1 + tug; else if (k === "foreB") tgt += sway * 4; else if (k === "head") tgt += sway * 1.5;
      if (k === "armF" || k === "armB") tgt += shiver;
      let kk, cc;
      if (k === "draw") { kk = this.t.draw ? 260 : 2600; cc = this.t.draw ? 2 * 0.9 * Math.sqrt(260) : 2 * 0.12 * Math.sqrt(2600); } // the string snaps back
      else if (k === "dx") { kk = 750; cc = 2 * 0.72 * Math.sqrt(750); }
      else if (this.falling) { kk = 140; cc = 2 * 0.28 * Math.sqrt(140); }
      else { kk = this.k; cc = c; }
      this.v[k] += (-kk * (this.x[k] - tgt) - cc * this.v[k]) * dt; this.x[k] += this.v[k] * dt;
    }
    if (this.pinned) { this.x.legF = -18; this.x.shinF = 6; } // the pinned foot stays where the arrow holds it
    if (this.falling) { // toppling about the feet, faster as it goes, a small bounce on the ground
      this.fallV += 2800 * Math.sin((Math.abs(this.fall) + 9) * Math.PI / 180) * dt; this.fall -= this.fallV * dt;
      if (this.fall < -86) { this.fall = -86; this.fallV = -this.fallV * 0.22; if (Math.abs(this.fallV) < 8) this.fallV = 0; }
    }
    this.apply();
  };
  Rig.prototype.apply = function () {
    const x = this.x, th = (x.rot + this.fall) * Math.PI / 180;
    const ptx = this.fall ? 74 * Math.sin(th) : 0, pty = this.fall ? 74 - 74 * Math.cos(th) : 0;
    if (this.body) this.body.style.transform = "translate(" + (x.tx + ptx).toFixed(2) + "px," + (x.ty + pty).toFixed(2) + "px) rotate(" + (x.rot + this.fall).toFixed(2) + "deg)";
    for (const k in this.g) if (this.g[k]) this.g[k].style.transform = "rotate(" + x[k].toFixed(2) + "deg)";
    if (this.itemEl) this.itemEl.style.transform = "rotate(" + x.item.toFixed(2) + "deg)";
    if (this.bow) {
      const up = -(x.rot + this.fall + x.armF + x.foreF) + x.tilt; // undo the arm's turn: the bow stays upright
      this.bow.style.transform = "rotate(" + up.toFixed(2) + "deg)";
      const d = Math.max(-4, x.draw * 30); // the string's nocking point, pulled back
      this.string.setAttribute("d", "M50 86 L" + (50 - d).toFixed(2) + " 126 L50 166");
      this.nock.setAttribute("transform", "translate(" + (-Math.max(0, d)).toFixed(2) + " 0)");
      this.nock.setAttribute("opacity", this.t.draw > 0.5 ? 1 : 0);
    }
    if (this.el && this.el.style) this.el.style.translate = Math.abs(x.dx) < 0.05 ? "" : x.dx.toFixed(1) + "px 0";
  };

  // Make a live figure of an SVG drawn with { pose: "live" }. With reduced motion, the figure is
  // given back its plain CSS pose instead, and null is returned.
  U.rig = function (svg, el, base) {
    if (!svg) return null;
    if (reduced() || typeof requestAnimationFrame !== "function") {
      svg.setAttribute("class", svg.getAttribute("class").replace(/pose-live\b/, "pose-" + ({ ready: "brace", bowready: "brace" }[base] || base || "stand")));
      return null;
    }
    const own = svg.getAttribute("data-stance"); // with reduced motion the CSS stand pose shows the stance
    if ((!base || base === "stand") && own && POSES[own]) base = own;
    if (!/\bpose-live\b/.test(svg.getAttribute("class"))) svg.setAttribute("class", svg.getAttribute("class").replace(/\bpose-\S+/, "pose-live"));
    return new Rig(svg, el, base);
  };
  U.rigFreeze = function (ms) { if (!reduced()) frozen = Math.max(frozen, ms); };
  U.rigs = { clear() { live.clear(); }, size: () => live.size };
  U.RIG_POSES = POSES;
  U.wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // A leather arrow flying from a to b (points inside host) along an arc; resolves on arrival with
  // the arrow element (kept when stay is set, e.g. pinned in the ground).
  const ARROW = '<svg viewBox="0 0 100 14" preserveAspectRatio="none"><path d="M0 1 L16 7 L0 13 L5 7 Z M7 1 L21 7 L7 13 L11 7 Z" fill="#c8402c" stroke="#24120a" stroke-width="1"/><rect x="9" y="5.2" width="77" height="3.6" rx="1" fill="#e6c98c" stroke="#24120a" stroke-width="1"/><path d="M84 3 L99 7 L84 11 L87 7 Z" fill="#dcd7c8" stroke="#24120a" stroke-width="1"/></svg>';
  U.flyArrow = function (host, a, b, arc, ms, stay, len) {
    return new Promise((res) => {
      const el = document.createElement("div"); el.className = "fly-arrow"; el.innerHTML = ARROW;
      if (len) { el.style.width = len + "px"; el.style.height = Math.max(5, len * 0.17) + "px"; }
      host.appendChild(el);
      const w = el.offsetWidth, h = el.offsetHeight, t0 = performance.now();
      const at = (t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - arc * 4 * t * (1 - t) });
      const f = (now) => {
        const t = reduced() ? 1 : Math.min(1, (now - t0) / ms), p = at(t), q = at(Math.min(1, t + 0.02)), p0 = at(Math.max(0, t - 0.02));
        const ang = Math.atan2(q.y - p0.y, q.x - p0.x);
        el.style.transform = "translate(" + (p.x - w) + "px," + (p.y - h / 2) + "px) rotate(" + ang + "rad)";
        if (t < 1 && el.isConnected) requestAnimationFrame(f);
        else { if (!stay) el.remove(); res(el); }
      };
      requestAnimationFrame(f);
    });
  };
  // Small pieces thrown from a point inside host: leather flakes, sparks, green motes.
  U.flingBits = function (host, cls, at, n, spread, colour, up) {
    if (reduced() || !host) return;
    for (let i = 0; i < n; i++) {
      const f = document.createElement("i"); f.className = "bit " + cls; if (colour) f.style.background = i % 3 ? colour : "#e2b55a";
      f.style.left = (at.x + (Math.random() - 0.5) * spread) + "px"; f.style.top = (at.y + (Math.random() - 0.5) * spread * 0.6) + "px"; host.appendChild(f);
      const dx = (Math.random() - 0.5) * 90, dy = up ? -(50 + Math.random() * 70) : 30 + Math.random() * 70;
      const an = f.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: "translate(" + dx + "px," + dy + "px) rotate(" + (Math.random() * 540 - 270) + "deg)", opacity: 0 }], { duration: (up ? 1000 : 650) + Math.random() * 400, easing: "cubic-bezier(.2,.6,.4,1)" });
      an.onfinish = () => f.remove();
    }
  };
})(window.K = window.K || {});
