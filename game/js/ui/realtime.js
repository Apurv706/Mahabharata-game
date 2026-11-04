/* Real-time fights (PRD §18.15), the screen, behind the developer switch (K.prefs().rtDev or ?rt=1;
   engine/realtime.js RT.dev). With the switch off every fight is the turn-based screen of ui/battle.js.
   A copy of the approved layout page (scratchpad rtlayout/page.js + page.css, 3 November): the same DOM
   (.screen.rt > .stage with .hud, .kstrip, .toast; .ctl with ◀ ▶ | Skill, Roll, Strike; compact sheets),
   the same geometry (the field the stage's width on a phone, a band of 9.5 bodies on a laptop; the front
   row's figures about 30% of the stage high, rows 11% higher and 12% smaller each), the same CSS
   (css/realtime.css is page.css scoped to #rt). Orders and Aid open over the controls at exactly their
   height, with a burning diya that closes them after 6 s; a tap outside closes them; the fight waits.
   Keys: A/D or ←/→ move, W/S or ↑/↓ change row, J strike, K or Space roll, L skill, H herbs, C call, U
   divine weapon, O orders, P or Esc pause, E spare. Mouse (laptops): click the ground to walk, a foe to
   strike; right- or Shift-click rolls. Under the tests (K.headless, jsdom) the bot plays it at once. */
(function (K) {
  "use strict";
  const U = K.UI, C = K.Combat, RT = K.RT;
  const turnBased = U.startBattle;
  U.startBattle = function (encId, onEnd) {
    if (!RT || !RT.wanted(encId)) return turnBased(encId, onEnd);
    if (K.headless || /jsdom/i.test(navigator.userAgent || "")) return onEnd(RT.autoplay(encId, U.rtBotOptions || {}));
    return U.startRealtime(encId, onEnd);
  };
  const T = (s, p) => U.tr(s, p);
  const $ = (sel, root) => (root || (V && V.el) || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || (V && V.el) || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const PAUSE = '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><rect x="3" y="2" width="3.6" height="12" rx="1" fill="currentColor"/><rect x="9.4" y="2" width="3.6" height="12" rx="1" fill="currentColor"/></svg>';
  const FLAME = '<span class="flame" aria-hidden="true"><svg viewBox="0 0 24 24"><circle class="fr-bg" cx="12" cy="12" r="10.5"/><circle class="fr" cx="12" cy="12" r="10.5" pathLength="100"/><path class="fl" d="M12 4.5 C15 8.5 16.2 11 15.2 14 C14.6 16.2 13.2 17.2 12 17.2 C10.8 17.2 9.4 16.2 8.8 14 C7.8 11 9 8.5 12 4.5 Z"/><path class="lamp" d="M6.5 17 Q12 21.5 17.5 17 Z"/></svg></span>';
  const SKILL_NAME = { aimed: "Aimed shot", quake: "Ground-shaker", ridedown: "Ride them down", command: "Command", salve: "Herbal salve", vanish: "Vanish into the dust", song: "Battle song" };
  const KEYS_ALL = "A / D move · W / S change row · J strike · K or Space roll · L skill · H herbs · C call · U divine weapon · O orders · P pause · E spare";
  const WEAPON = {
    spear: '<svg viewBox="0 0 100 12" aria-hidden="true"><path d="M3 6 H80" stroke="#5a3418" stroke-width="3" stroke-linecap="round"/><path d="M79 2 L98 6 L79 10 Z" fill="#dcd7c8" stroke="#1d0f08" stroke-width="1"/></svg>',
    bow: '<svg viewBox="0 0 100 24" aria-hidden="true"><path d="M4 20 Q50 -10 96 20" fill="none" stroke="#5a3418" stroke-width="3.4" stroke-linecap="round"/><path d="M4 20 L96 20" stroke="#efe2c0" stroke-width="1"/></svg>',
    mace: '<svg viewBox="0 0 100 24" aria-hidden="true"><path d="M4 12 H70" stroke="#6b4422" stroke-width="4" stroke-linecap="round"/><ellipse cx="82" cy="12" rx="15" ry="10" fill="#d9a53a" stroke="#1d0f08" stroke-width="1.2"/></svg>',
    sword: '<svg viewBox="0 0 100 12" aria-hidden="true"><path d="M4 6 H20" stroke="#5a3418" stroke-width="4" stroke-linecap="round"/><path d="M20 3 L92 5 L98 6 L92 7 L20 9 Z" fill="#dcd7c8" stroke="#1d0f08" stroke-width="1"/></svg>'
  };
  // Each unit as a puppet (a short form of ui/battle.js's specFor, which is private to that screen).
  function specFor(u) {
    if (u.side === "player") return K.puppetSpec(K.S);
    if (u.person && K.PUPPETS && K.PUPPETS[u.person]) return U.puppetFor(u.person);
    const n = String(u.src || u.name);
    if (/archer|chariot/i.test(n)) return { pronoun: "he", palette: ["#9e6a40", "#5d3b2a", "#9f8250"], headgear: "capfeather", hat: "#5d3b2a", gear: ["bracer"], item: "bow", stance: "archer", stage: "adult" };
    if (/Gandharva/.test(n)) return { pronoun: "he", palette: ["#9fb07a", "#2f5a3a", "#d9c27a"], headgear: "feather", item: "spear", stage: "adult" };
    if (/Ashwatthama/.test(n)) return { pronoun: "he", palette: ["#c9905a", "#3a2a3a", "#c9a24e"], headgear: "crown", crown: { gem: "#8a5aa0", tall: 0.95, trim: "#3a2a3a" }, gear: ["browgem"], item: "bow", stance: "hero", stage: "adult", size: 1.1 };
    if (/Ugra/.test(n)) return U.puppetFor("ugra");
    if (/club|raider|bandit/i.test(n)) return { pronoun: "he", palette: ["#9c6a42", "#6b5a3a", "#a8875a"], headgear: "scarf", hat: "#7a4a2a", gear: ["torn"], item: "club", stance: "stoop", stage: "adult", size: 0.9 };
    if (/guard|bodyguard|captain|sentry/i.test(n)) return U.puppetFor("guard");
    return U.puppetFor("soldier");
  }


  let V = null; // the screen's state while a fight is on
  U.rtScreen = () => V; // for the fit checks and screenshots

  U.startRealtime = function (encId, onEnd) {
    if (V) stop();
    if (K.Sound) { K.Sound.play(K.ENCOUNTERS[encId].lethal && K.S.act === 6 ? "callToArms" : "drumCall"); if (K.Sound.mood) K.Sound.mood("battle"); }
    const B = C.start(encId, onEnd);
    const R = RT.begin(B, { assist: U.assist && U.assist() });
    V = { encId, onEnd, R, actors: new Map(), held: { l: false, r: false }, queue: {}, acc: 0, last: 0, raf: 0, paused: false, sheet: null, toastT: 0, logAt: B.log.length };
    build();
    V.raf = requestAnimationFrame(loop);
  };

  // ---------- The screen (the layout page's DOM) ----------
  function build() {
    const R = V.R, B = R.B, enc = B.enc;
    const old = document.getElementById("rt"); if (old) old.remove();
    const kb = (k) => "<kbd>" + k + "</kbd>", title = U.t(K.val(enc.title) || "");
    const skill = T(R.skill ? SKILL_NAME[R.skill] : "No skill");
    const el = U.el('<div id="rt" class="screen rt v-A" role="application" aria-label="' + T("Real-time fight") + '">' +
      '<div class="titleband"><b>' + title + '</b><small class="packn"></small></div>' +
      '<div class="stage" id="rt-stage"><div class="world" id="rt-world"></div><div class="edgefx l"></div><div class="edgefx r"></div><div class="slowtint"></div><div class="rt-scorch"></div>' +
        '<div class="hud"><div class="bars">' +
          '<div class="bar hp"><span>' + T("You") + '</span><i><b id="b-hp"></b></i></div>' +
          '<div class="bar br"><span>' + T("Breath") + '</span><i><b id="b-br"></b></i></div>' +
          '<div class="bar fr" hidden><span id="b-frn"></span><i><b id="b-fr"></b></i></div></div>' +
        '<div class="hud-r"><div class="fname"><b>' + title + '</b><small class="packn"></small></div>' +
          '<div class="hud-btns"><button type="button" class="hb orders" data-act="orders" aria-haspopup="dialog">' + T("Orders") + " ▾" + kb("O") + "</button>" +
          '<button type="button" class="hb withdraw" data-act="withdraw">' + T("Withdraw") + "</button>" +
          '<button type="button" class="hb pause" data-act="pause" aria-label="' + T("Pause") + '" title="' + T("Pause") + '">' + PAUSE + "</button>" +
          '</div><button type="button" class="hb aid" data-act="aid" aria-haspopup="dialog">' + T("Aid") + " ▾</button></div></div>" +
        '<div class="kstrip" aria-hidden="true"><span class="ks-skill"><svg class="ring" viewBox="0 0 40 40"><circle class="bg" cx="20" cy="20" r="16"/><circle class="fg" cx="20" cy="20" r="16" stroke-dasharray="100.5" stroke-dashoffset="0"/></svg>' + skill + ' <kbd>L</kbd></span><span class="ks-herbs">' + T("Herbs") + ' <b id="ksherbs"></b> <kbd>H</kbd></span><span class="ks-keys">' + T("J strike · K roll · L skill · H herbs · W/S row · P pause") + "</span></div>" +
        '<div class="banner off" role="status"></div><div class="toast off" role="status"></div></div>' +
      '<div class="ctl" id="rt-ctl"><div class="pad"><button type="button" class="mv" data-hold="l" aria-label="' + T("Move left") + '">◀' + kb("A") + '</button><button type="button" class="mv" data-hold="r" aria-label="' + T("Move right") + '">▶' + kb("D") + "</button></div>" +
        '<ul class="keys">' + T(KEYS_ALL).split(" · ").map((x) => "<li>" + U.esc(x) + "</li>").join("") + "</ul>" +
        '<div class="acts"><button type="button" class="skill" data-act="skill"' + (R.skill ? "" : " disabled") + '><svg class="ring" viewBox="0 0 40 40" aria-hidden="true"><circle class="bg" cx="20" cy="20" r="18"/><circle class="fg" cx="20" cy="20" r="18" stroke-dasharray="113.1" stroke-dashoffset="0"/></svg><span>' + skill + "</span>" + kb("L") + "</button>" +
          '<button type="button" class="roll" data-act="roll">' + T("Roll") + kb("K") + "</button>" +
          '<button type="button" class="strike" data-act="strike">' + T("Strike") + "<small>" + T("×3 combo") + "</small>" + kb("J") + "</button></div></div>" +
      '<div class="sheet orders-sheet" role="dialog" aria-label="' + T("Orders") + '" hidden></div>' +
      '<div class="sheet aid-sheet dropdown" role="dialog" aria-label="' + T("Aid") + '" hidden></div>' +
      '<div class="sheet pause-sheet" role="dialog" aria-label="' + T("Paused") + '" hidden></div></div>');
    document.body.appendChild(el);
    document.body.classList.add("in-rt");
    V.el = el; V.stage = el.querySelector("#rt-stage"); V.world = el.querySelector("#rt-world");
    const bg = U.FIGHT_BG && U.FIGHT_BG[enc.id];
    V.art = [U.artUrl(K.val(enc.stage) || K.val(enc.art)), bg ? U.artUrl(bg + "_tall") : null];
    el.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); act(b.dataset.act); }));
    el.querySelectorAll("[data-hold]").forEach((b) => {
      const k = b.dataset.hold;
      const on = (e) => { e.preventDefault(); V.held[k] = true; b.classList.add("held"); };
      const off = () => { if (!V) return; V.held[k] = false; b.classList.remove("held"); };
      b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
      b.addEventListener("contextmenu", (e) => e.preventDefault());
    });
    // Mouse on a laptop: click the ground to walk, a foe to strike; right- or Shift-click rolls. Touch: a swipe changes row.
    V.stage.addEventListener("contextmenu", (e) => e.preventDefault());
    V.stage.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, .sheet, .hud")) return;
      const r = V.stage.getBoundingClientRect(), x = (e.clientX - r.left - V.G.fx0) / V.G.FW;
      if (e.pointerType !== "mouse") { V.swipe = { x: e.clientX, y: e.clientY, t: performance.now() }; return; }
      const p = C.player();
      if (e.button === 2 || e.shiftKey) { V.queue.roll = true; V.queue.rollDir = x >= p.rt.x ? 1 : -1; return; }
      if (e.button !== 0) return;
      const foe = e.target.closest(".actor.foe");
      if (foe && RT.spareable(V.R).some((u) => u.uid === foe.dataset.uid)) { V.queue.spare = foe.dataset.uid; return; }
      V.walk = { x, foe: foe ? foe.dataset.uid : null };
    });
    V.stage.addEventListener("pointerup", (e) => {
      const sw = V.swipe; V.swipe = null;
      if (!sw || performance.now() - sw.t > 600) return;
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      if (Math.abs(dy) > 28 && Math.abs(dy) > Math.abs(dx) * 1.2) { V.queue.row = dy < 0 ? 1 : -1; return; }
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { const foe = e.target.closest(".actor.foe"); if (foe && RT.spareable(V.R).some((u) => u.uid === foe.dataset.uid)) V.queue.spare = foe.dataset.uid; } // spare: a tap on the beaten foe
    });
    window.addEventListener("keydown", onKey, true); window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("resize", onResize); document.addEventListener("visibilitychange", onHidden);
    document.addEventListener("pointerdown", dropOutside, true);
    layout();
    nameTagsAll(2);
  }
  // The layout page's layout(): upright or wide by the screen's shape; the stage takes what the controls leave.
  function layout() {
    if (!V) return;
    const vw = window.innerWidth, vh = window.innerHeight, scr = V.el;
    const wide = vw >= 820 && vw / vh >= 1.15;
    const touch = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches) || V.touched;
    scr.classList.toggle("wide", wide); scr.classList.toggle("upright", !wide); scr.classList.toggle("touch", wide && touch);
    scr.style.setProperty("--bh", (wide ? 40 : 44) + "px"); scr.style.setProperty("--hb", "0px");
    const W = V.stage.clientWidth, H = V.stage.clientHeight;
    V.stage.style.backgroundImage = "url(" + (H > W * 1.25 && V.art[1] ? V.art[1] : V.art[0]) + ")";
    const FIELD = 1 / RT.BODY;
    const ph = wide ? Math.min(H * 0.3, W / (FIELD * 0.36)) : Math.min(H * 0.3, W * 0.48);
    const FW = wide ? Math.min(W, ph * 0.36 * FIELD) : W;
    V.G = { W, H, ph, FW, fx0: (W - FW) / 2, dk: 0.12, gl: wide && !scr.classList.contains("touch") ? Math.max(H * 0.06, 46) : H * (wide ? 0.06 : 0.05), dstep: H * (wide ? 0.1 : 0.11), wide };
    V.actors.forEach((a) => size(a));
    const eL = $(".edgefx.l"), eR = $(".edgefx.r"); if (eL) { eL.style.width = eR.style.width = (V.G.fx0 + FW * 0.12) + "px"; }
    if (V.sheet === "orders" || V.sheet === "aid") placeDrop($("." + V.sheet + "-sheet"), $(".hb." + V.sheet));
  }
  function onResize() { if (!V) return; const o = V.G && V.G.W > V.G.H; layout(); if (V.G && (V.G.W > V.G.H) !== o) pause(true); } // turning the phone pauses
  function onHidden() { if (V && document.hidden) pause(true); }

  // ---------- Figures (the layout page's Actor) ----------
  function actorFor(u) {
    let a = V.actors.get(u.uid);
    if (a) return a;
    const foe = u.side === "enemy", spec = specFor(u);
    const el = U.el('<div class="actor ' + (u.side === "player" ? "me" : foe ? "foe" : "ally") + '" data-uid="' + u.uid + '" data-id="' + u.uid + '"><span class="shadow"></span><div class="fl">' +
      U.puppet(spec, { pose: U.motion() ? "live" : u.side === "player" ? "brace" : "stand", h: 200 }) + "</div>" + (u.side === "player" ? "" : '<span class="mini"><b></b></span>') + "</div>");
    V.world.appendChild(el);
    const svg = el.querySelector("svg.pp");
    const vb = (svg.getAttribute("viewBox") || "0 0 120 200").split(/[\s,]+/).map(Number);
    const bow = !!svg.querySelector('.it:not(.it-w) path[d="M50 86 L50 166"]');
    a = { u, el, svg, fl: el.querySelector(".fl"), vbW: vb[2], vbH: vb[3], sc: 210 / vb[3], spec, d: u.rt.lane, base: bow ? "bowready" : svg.dataset.stance && foe ? svg.dataset.stance : "ready",
      name: u.side === "player" ? K.tr("You") : (u.side === "ally" && (u.person || u.called)) || (foe && (u.person || u.hero)) ? K.text(u.src || u.name).split(",")[0] : null };
    a.rig = U.motion() && U.rig ? U.rig(svg, el, a.base) : null;
    V.actors.set(u.uid, a);
    size(a);
    return a;
  }
  function size(a) {
    const G = V.G; if (!G) return;
    a.d = a.u.rt ? a.u.rt.lane : 0;
    const k = 1 - G.dk * Math.max(0, a.d);
    a.fh = G.ph * k; a.bw = a.fh * 0.36;
    const svgH = a.fh * 210 / 164, svgW = svgH * a.vbW / a.vbH;
    a.svg.style.height = svgH.toFixed(1) + "px"; a.svg.style.width = svgW.toFixed(1) + "px";
    a.fl.style.bottom = (-(200 + 10 / a.sc - 193) / (210 / a.sc) * svgH).toFixed(1) + "px";
    a.el.style.setProperty("--fh", a.fh.toFixed(1) + "px");
  }
  function pose(a, p, k, z) { if (!a) return; if (a.rig) a.rig.set(p, k || 900, z == null ? 0.5 : z); else a.svg.setAttribute("class", a.svg.getAttribute("class").replace(/\bpose-\S+/, "pose-" + ({ windup: "strike", ready: "brace", bowready: "brace", draw: "aim", duck: "duck", kneel: "kneel", loose: "loose" }[p] || p))); }
  function home(a, ms) { setTimeout(() => { if (!V || !a.u) return; if (a.u.rt && a.u.rt.beaten && a.u.hp > 0) pose(a, "kneel", 600, 0.6); else if (a.rig && a.u.hp > 0) a.rig.set(a.base, 520, 0.42); else if (!a.rig && a.u.hp > 0) pose(a, a.u.side === "player" ? "brace" : "stand"); }, ms || 0); }
  // Name tags: a small pill at the waist, nudged off the shield; for 2 s at a time.
  function nameTag(a, s) {
    if (!a || !a.name || a.u.hp <= 0) return;
    let t = a.el.querySelector(".nametag");
    if (!t) { t = document.createElement("span"); t.className = "nametag"; t.textContent = a.name; a.el.appendChild(t); }
    t.style.bottom = (a.fh * (a.u.rt && a.u.rt.beaten ? 0.3 : 0.4)) + "px"; t.style.left = (-(a.u.rt ? a.u.rt.face : 1) * a.fh * 0.05) + "px";
    t.classList.add("on"); clearTimeout(t.off); t.off = setTimeout(() => t.classList.remove("on"), (s || 2) * 1000);
  }
  function nameTagsAll(s) { V.actors.forEach((a) => nameTag(a, s)); }
  function pop(a, text, cls) {
    const el = document.createElement("span"); el.className = "pop " + (cls || ""); el.textContent = text;
    el.style.left = a.x + "px"; el.style.bottom = (a.gy + a.fh * 1.08) + "px"; V.world.appendChild(el);
    if (U.calm()) { setTimeout(() => el.remove(), 700); return; }
    el.animate([{ transform: "translate(-50%,4px)", opacity: 0 }, { transform: "translate(-50%,-4px)", opacity: 1, offset: 0.15 }, { transform: "translate(-50%,-38px)", opacity: 0 }], { duration: 900, easing: "ease-out" }).onfinish = () => el.remove();
  }
  function toast(s) { const el = $(".toast", V.stage); el.textContent = s; el.classList.remove("off"); clearTimeout(V.toastT); V.toastT = setTimeout(() => el.classList.add("off"), 1600); }
  function shake(big) { if (U.calm()) return; V.stage.classList.remove("shake", "bigshake"); void V.stage.offsetWidth; V.stage.classList.add(big ? "bigshake" : "shake"); }
  function fell(a) {
    a.el.classList.add("dead"); a.el.classList.remove("windup"); a.el.style.zIndex = "4";
    if (a.rig) a.rig.fallDown(-86, 1); else pose(a, "fall");
    const item = a.svg.querySelector(".it"), kind = a.spec && a.spec.item, svgW = WEAPON[kind] || (kind ? WEAPON.sword : null);
    if (item && svgW && !a.dropped) {
      item.style.visibility = "hidden"; a.dropped = true;
      const w = document.createElement("div"); w.className = "dropped"; w.innerHTML = svgW;
      const len = a.fh * (kind === "spear" ? 0.62 : 0.42), side = a.x < V.G.W / 2 ? 1 : -1;
      Object.assign(w.style, { left: (a.x - side * a.bw * 0.15 - len / 2) + "px", bottom: (a.gy - 2) + "px", width: len + "px" });
      V.world.appendChild(w); a.weaponEl = w;
      const rot = side * 7;
      if (!U.calm()) w.animate([{ transform: "translateY(" + (-a.fh * 0.5) + "px) rotate(" + (-side * 70) + "deg)" }, { transform: "translateY(0) rotate(" + rot + "deg)" }], { duration: 520, easing: "ease-in", fill: "forwards" });
      else w.style.transform = "rotate(" + rot + "deg)";
    }
  }

  // ---------- Input ----------
  const KEY = { KeyJ: "strike", KeyK: "roll", Space: "roll", KeyL: "skill", KeyH: "herbs", KeyC: "call", KeyU: "astra", KeyO: "orders", KeyP: "pause", Escape: "pause", KeyE: "spare" };
  function onKey(e) {
    if (!V) return;
    if (e.code === "KeyA" || e.code === "ArrowLeft") { V.held.l = true; e.preventDefault(); e.stopPropagation(); return; }
    if (e.code === "KeyD" || e.code === "ArrowRight") { V.held.r = true; e.preventDefault(); e.stopPropagation(); return; }
    if (e.code === "KeyW" || e.code === "ArrowUp" || e.code === "KeyS" || e.code === "ArrowDown") { e.preventDefault(); e.stopPropagation(); if (!e.repeat && !V.sheet) V.queue.row = e.code === "KeyW" || e.code === "ArrowUp" ? 1 : -1; return; }
    const a = KEY[e.code];
    if (!a) return;
    e.preventDefault(); e.stopPropagation();
    if (e.repeat && a !== "strike") return;
    if (V.sheet && (a === "pause" || a === "orders")) return closeSheet();
    act(a);
  }
  function onKeyUp(e) { if (!V) return; if (e.code === "KeyA" || e.code === "ArrowLeft") V.held.l = false; if (e.code === "KeyD" || e.code === "ArrowRight") V.held.r = false; }
  function act(a) {
    if (!V) return;
    const R = V.R;
    switch (a) {
      case "orders": return V.sheet === "orders" ? closeSheet() : sheet("orders");
      case "aid": return V.sheet === "aid" ? closeSheet() : sheet("aid");
      case "pause": return V.sheet === "pause" ? closeSheet() : sheet("pause");
      case "withdraw": return withdraw();
    }
    if (V.sheet) closeSheet();
    if (a === "astra") { const ready = RT.astras().filter((x) => !x.why); if (!ready.length) return toast(K.tr(RT.astras()[0] ? RT.astras()[0].why || "Not ready yet" : "You were never given a divine weapon")); V.queue.astra = ready[0].id; return; }
    if (a === "spare") { const t = RT.spareable(R)[0]; if (t) V.queue.spare = t.uid; else if (C.spareable().length) toast(K.tr("Step closer to spare him")); return; }
    if (a === "roll" && !RT.can(R, "roll") && R.roll <= 0) toast(K.tr("Winded"));
    if (a === "skill" && R.skill && !RT.can(R, "skill")) toast(K.tr("Not ready yet"));
    if (a === "herbs" && !RT.can(R, "herbs")) toast(K.tr((K.S.items.herbs || 0) > 0 ? "Not now" : "No herbs left"));
    if (a === "call" && !RT.can(R, "call")) toast(K.tr("Used this battle"));
    V.queue[a] = true;
  }
  // Withdraw asks "Are you sure?" only when it would break a vow.
  function withdraw() {
    if (!C.canFlee()) return;
    if (C.fleeBreaks().length && V.sheet !== "confirm") return sheet("confirm");
    closeSheet(); V.queue.withdraw = true;
  }
  function pause(on) { if (V && on && !V.sheet) sheet("pause"); }

  // ---------- Sheets: Orders and Aid as compact panels over the controls; Pause, the second try ----------
  function sheet(kind) {
    const R = V.R, p = C.player();
    closeSheet(true);
    V.sheet = kind; V.paused = true;
    const btn = (attr, v, label, short, on) => '<button type="button" data-' + attr + '="' + v + '" aria-pressed="' + !!on + '" title="' + T(short) + '">' + T(label) + "</button>";
    if (kind === "orders") {
      const el = $(".orders-sheet");
      const friend = R.B.units.find((u) => u.side === "ally" && u.hp > 0 && (u.called || u.person) && !u.still);
      const soldiers = R.B.units.some((u) => u.side === "ally" && u.hp > 0 && u.plural && !u.person && !u.called);
      const SO = { defend: ["Defend", "They hold near you and take your blows."], allout: ["All-out", "They charge the nearest foe."], stay: ["Stay out", "They keep out of the fight."] };
      const FR = { balanced: ["Balanced", "Fights the foe nearest you."], guard: ["Guard me", "Stays by you, strikes what comes."], allout: ["All-out", "Charges, never falls back."], hold: ["Hold back", "Keeps behind you, out of it."] };
      const fname = friend ? K.text(friend.src || friend.name).split(",")[0] : "";
      el.innerHTML = '<button type="button" class="grp" data-grp></button>' +
        (soldiers ? '<div class="sec so"><div class="crow"><h3>' + T("Soldiers") + '</h3><div class="chips three">' + Object.entries(SO).map(([k, v]) => btn("so", k, v[0], v[1], R.orders.soldiers === k)).join("") + '</div></div><p class="desc1">' + T(SO[R.orders.soldiers][1]) + "</p></div>" : "") +
        (friend ? '<div class="sec fr"><div class="crow"><h3>' + U.esc(fname) + '</h3><div class="chips four">' + Object.entries(FR).map(([k, v]) => btn("fr", k, v[0], v[1], R.orders.friend === k)).join("") + '</div></div><p class="desc1">' + T(FR[R.orders.friend][1]) + "</p></div>" : "") +
        (!soldiers && !friend ? '<p class="desc1">' + T("No one is fighting beside you to take an order.") + "</p>" : "");
      const so = el.querySelector(".sec.so"), fr = el.querySelector(".sec.fr"), g = el.querySelector(".grp"), both = !!(so && fr);
      // Only the groups that apply; with both, one at a time and a "Soldiers ⇄" swap.
      const show = (k) => { if (so) so.classList.toggle("on", k === "so" || !fr); if (fr) fr.classList.toggle("on", k === "fr" || !so); g.textContent = (k === "so" ? T("Soldiers") : fname) + (both ? " ⇄" : ""); g.dataset.k = k; };
      show(so ? "so" : "fr"); g.onclick = () => { if (both) show(g.dataset.k === "so" ? "fr" : "so"); };
      el.querySelectorAll("[data-so]").forEach((b) => (b.onclick = () => { R.orders.soldiers = b.dataset.so; V.queue.orders = Object.assign(V.queue.orders || {}, { soldiers: b.dataset.so }); el.querySelectorAll("[data-so]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); so.querySelector(".desc1").textContent = K.tr(SO[b.dataset.so][1]); }));
      el.querySelectorAll("[data-fr]").forEach((b) => (b.onclick = () => { R.orders.friend = b.dataset.fr; V.queue.orders = Object.assign(V.queue.orders || {}, { friend: b.dataset.fr }); el.querySelectorAll("[data-fr]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); fr.querySelector(".desc1").textContent = K.tr(FR[b.dataset.fr][1]); }));
      el.classList.add("compact"); placeDrop(el, $(".hb.orders")); dropTimer(el);
    } else if (kind === "aid") {
      const el = $(".aid-sheet"), ast = RT.astras(), aReady = ast.find((x) => !x.why);
      const it = (k, label, note, off, key) => '<button type="button" data-aid="' + k + '"' + (off ? ' disabled aria-disabled="true"' : "") + "><b>" + U.esc(label) + "</b><small>" + U.esc(note) + "</small><kbd>" + key + "</kbd></button>";
      el.innerHTML = it("herbs", K.tr("Herbs"), K.tr("{n} left", { n: K.S.items.herbs || 0 }), !RT.can(R, "herbs"), "H") +
        it("astra", K.tr(aReady ? aReady.name : "Divine weapon"), aReady ? K.tr("Divine weapon") : ast[0] ? (B_used(ast) ? K.tr("used") : ast[0].why || "") : K.tr("not given"), !aReady, "U") +
        (p.abilities.includes("call") ? it("call", K.tr("Call for help"), RT.can(R, "call") ? K.tr("once a fight") : K.tr("called"), !RT.can(R, "call"), "C") : "");
      el.querySelectorAll("[data-aid]").forEach((b) => (b.onclick = () => { closeSheet(); act(b.dataset.aid); }));
      el.classList.add("compact"); placeDrop(el, $(".hb.aid")); dropTimer(el);
    } else {
      const el = $(".pause-sheet");
      if (kind === "pause") el.innerHTML = "<h2>" + T("Paused") + '</h2><div class="p-main opts one"><button type="button" class="go" data-close>' + T("Resume") + "</button>" +
        (C.canFlee() ? '<button type="button" class="danger" data-w>' + T("Withdraw from the fight") + "</button>" + (C.fleeBreaks().length ? '<p class="note">' + T("It breaks your vow never to retreat.") + "</p>" : "") : "") +
        '<ul class="keys pkeys">' + T(KEYS_ALL).split(" · ").map((x) => "<li>" + U.esc(x) + "</li>").join("") + "</ul></div>";
      else if (kind === "confirm") el.innerHTML = '<div class="p-confirm opts one"><h3 class="sure">' + T("Are you sure?") + '</h3><p class="desc">' + T("Withdrawing breaks your vow never to retreat.") + '</p><button type="button" class="go" data-close>' + T("Stay and fight") + '</button><button type="button" class="danger" data-yes>' + T("Yes, withdraw") + "</button></div>";
      else if (kind === "retry") el.innerHTML = "<h2>" + T("You are beaten") + '</h2><p class="note">' + T("One more try: you start a little hurt, and what you used stays used.") + '</p><div class="opts one"><button type="button" class="go" data-retry>' + T("Try again") + '</button><button type="button" data-accept>' + T("Accept the loss") + "</button></div>";
      el.hidden = false;
      el.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => closeSheet()));
      el.querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => { if (C.fleeBreaks().length) return sheet("confirm"); closeSheet(); V.queue.withdraw = true; }));
      el.querySelectorAll("[data-yes]").forEach((b) => (b.onclick = () => { closeSheet(); V.queue.withdraw = true; }));
      const rb = el.querySelector("[data-retry]"); if (rb) rb.onclick = () => { closeSheet(); retry(); };
      const ab = el.querySelector("[data-accept]"); if (ab) ab.onclick = () => { closeSheet(); RT.accept(V.R); finishSoon(); };
      const f = el.querySelector("button"); if (f && !U.calm()) f.focus({ preventScroll: true });
    }
  }
  const B_used = (ast) => ast.some((x) => x.why === K.tr("Used this battle"));
  // The panel takes exactly the controls' place (phones, touch screens); on a laptop, a corner under its button.
  function placeDrop(panel, btn) {
    panel.hidden = false;
    const ctl = $(".ctl"), ar = ctl && ctl.getBoundingClientRect(), wide = V.el.classList.contains("wide");
    panel.classList.remove("matched", "m-rt"); panel.classList.toggle("wide", wide);
    if (ar && ar.height > 20 && (!wide || V.el.classList.contains("touch"))) {
      panel.classList.add("matched", "m-rt");
      Object.assign(panel.style, { position: "fixed", left: ar.left + "px", width: ar.width + "px", top: ar.top + "px", height: ar.height + "px", right: "auto", bottom: "auto", maxHeight: "none" });
    } else {
      const sr = V.stage.getBoundingClientRect(), w = Math.min(360, sr.width * 0.32), br = btn.getBoundingClientRect();
      const hud = Math.max(br.bottom, ...$$(".hud-btns, .hb.aid").map((e) => e.getBoundingClientRect().bottom));
      Object.assign(panel.style, { position: "fixed", width: w + "px", left: (br.right - w) + "px", right: "auto", top: (hud + 6) + "px", height: "auto", bottom: "auto", maxHeight: (sr.bottom - hud - 12) + "px" });
    }
  }
  // A small diya burns down over 6 s; a tap in the panel lights it again; out, the panel closes.
  function dropTimer(panel) {
    clearTimeout(V.dropT);
    let f = panel.querySelector(".flame");
    if (!f) { panel.insertAdjacentHTML("afterbegin", FLAME); f = panel.querySelector(".flame"); }
    f.classList.remove("burn"); void f.offsetWidth; f.classList.add("burn");
    panel.onpointerdown = () => { if (!panel.hidden) dropTimer(panel); };
    V.dropT = setTimeout(() => { if (V && !panel.hidden) closeSheet(); }, 6000);
  }
  function dropOutside(e) {
    if (!V || (V.sheet !== "orders" && V.sheet !== "aid")) return;
    const panel = $("." + V.sheet + "-sheet"), btn = $(".hb." + V.sheet);
    if (panel.contains(e.target) || (btn && btn.contains(e.target))) return;
    closeSheet();
  }
  function closeSheet(keep) {
    if (!V) return;
    clearTimeout(V.dropT);
    $$(".sheet").forEach((s) => { s.hidden = true; });
    V.sheet = null; if (!keep) { V.paused = false; V.last = 0; }
  }

  function input() {
    const q = V.queue; V.queue = {};
    let move = (V.held.r ? 1 : 0) - (V.held.l ? 1 : 0);
    const w = V.walk, p = C.player();
    if (move) V.walk = null;
    else if (w && p) { // walking to a click; at a clicked foe, strike
      const f = w.foe && V.R.B.units.find((u) => u.uid === w.foe && u.hp > 0);
      const goal = f ? f.rt.x : w.x, d = goal - p.rt.x;
      if (f && Math.abs(d) <= p.rt.reach * 0.9) { q.strike = true; V.walk = null; }
      else if (Math.abs(d) > 0.01 && !(p.rt.x <= RT.EDGE + 1e-6 && d < 0) && !(p.rt.x >= 1 - RT.EDGE - 1e-6 && d > 0)) move = d > 0 ? 1 : -1;
      else V.walk = null;
    }
    return Object.assign({ move }, q);
  }
  function loop(now) {
    if (!V) return;
    const R = V.R;
    const dt = Math.min(0.1, V.last ? (now - V.last) / 1000 : 0); V.last = now;
    if (!V.paused && !R.over) {
      V.acc += dt;
      while (V.acc >= RT.STEP && !R.over) { RT.step(R, input()); V.acc -= RT.STEP; }
    }
    draw();
    if (R.over && !V.ending) {
      if (R.over === "retry") { if (V.sheet !== "retry") sheet("retry"); }
      else finishSoon();
    }
    V.raf = requestAnimationFrame(loop);
  }
  function retry() { V.R = RT.retry(V.R); V.actors.forEach((a) => a.el.remove()); V.actors.clear(); if (U.rigs) U.rigs.clear(); V.logAt = V.R.B.log.length; toast(K.tr("One more time.")); }
  function finishSoon() {
    if (V.ending) return; V.ending = true;
    setTimeout(() => {
      if (!V) return;
      const cb = V.onEnd, done = C.end();
      stop();
      if (cb) cb(done ? done.over : "lose");
    }, U.calm() ? 300 : 1100);
  }
  function stop() {
    if (!V) return;
    cancelAnimationFrame(V.raf);
    window.removeEventListener("keydown", onKey, true); window.removeEventListener("keyup", onKeyUp, true);
    window.removeEventListener("resize", onResize); document.removeEventListener("visibilitychange", onHidden);
    if (U.rigs) U.rigs.clear();
    if (V.el) V.el.remove();
    document.body.classList.remove("in-rt"); document.removeEventListener("pointerdown", dropOutside, true);
    V = null;
  }

  // ---------- Drawing ----------
  function draw() {
    const R = V.R, B = R.B, G = V.G; if (!G) return;
    const p = C.player();
    if (R.t > 0 && Math.floor(R.t / 10) !== V.tagTick) { V.tagTick = Math.floor(R.t / 10); if (V.tagTick) nameTagsAll(2); } // every 10 s, for 2 s
    for (const u of B.units) {
      if (!u.rt) continue;
      const a = actorFor(u);
      if (Math.abs(a.d - u.rt.lane) > 0.01) size(a); // smaller up the ground
      a.x = G.fx0 + u.rt.x * G.FW; a.gy = G.gl + u.rt.lane * G.dstep;
      a.el.style.left = a.x.toFixed(1) + "px"; a.el.style.bottom = a.gy.toFixed(1) + "px";
      if (u.hp > 0) a.el.style.zIndex = String(u.side === "player" ? Math.round(30 - u.rt.lane * 8) : Math.round(10 - u.rt.lane * 6 + 10));
      a.el.classList.toggle("face-l", u.rt.face < 0);
      // A foe glows only the first time it winds up; after that only its pose and its mark.
      if (u.rt.atk && u.side === "enemy" && !a.warned) a.warned = u.rt.atk;
      a.el.classList.toggle("windup", !!u.rt.atk && u.side === "enemy" && a.warned === u.rt.atk);
      if (u.rt.atk !== a.atk) {
        if (u.rt.atk) { pose(a, u.rt.atk.ranged ? "draw" : "windup", 700, 0.5); const t = V.actors.get(u.rt.atk.on); if (t) nameTag(t, 1.5); }
        else if (a.atk && !a.atk.ranged && u.hp > 0) { pose(a, "strike", 1600, 0.55); home(a, 380); }
        a.atk = u.rt.atk;
      }
      a.el.classList.toggle("unseen", u.side === "player" && (R.unseen > 0 || R.roll > 0));
      a.el.classList.toggle("beaten", !!u.rt.beaten);
      const m = a.el.querySelector(".mini b"); if (m) m.style.width = Math.max(0, u.hp / u.maxHp * 100) + "%";
    }
    V.actors.forEach((a, uid) => { if (!B.units.includes(a.u)) { a.el.style.transition = "opacity .6s"; a.el.style.opacity = "0"; setTimeout(() => a.el.remove(), 600); V.actors.delete(uid); } });
    for (const f of R.fx) fx(f);
    R.fx.length = 0;
    marks();
    const w = (id, v) => { const e = V.el.querySelector("#" + id); if (e) e.style.width = clamp(v, 0, 100) + "%"; };
    w("b-hp", p.hp / p.maxHp * 100); w("b-br", R.breath / RT.P.breathMax * 100);
    const fr = B.units.find((u) => u.side === "ally" && u.hp > 0 && !u.still && (u.called || u.person)) || B.units.find((u) => u.side === "ally" && u.hp > 0 && !u.still);
    $(".bar.fr").hidden = !fr;
    if (fr) { $("#b-frn").textContent = K.text(fr.src || fr.name).split(",")[0]; w("b-fr", fr.hp / fr.maxHp * 100); }
    const pk = RT.packs(R), cnt = K.tr("Foes left: {n}", { n: RT.count(R) }) + (pk.of > 1 ? " · " + K.tr("Pack {a} of {b}", { a: pk.now, b: pk.of }) : "");
    $$(".packn").forEach((e) => { if (e.textContent !== cnt) e.textContent = cnt; });
    if (R.skill) { const f = 1 - Math.max(0, R.skillCd) / (RT.RECHARGE[R.skill] || 10), sk = $(".acts .skill"), ks = $(".ks-skill");
      sk.querySelector(".ring .fg").style.strokeDashoffset = (113.1 * (1 - f)).toFixed(1); sk.classList.toggle("ready", R.skillCd <= 0);
      ks.querySelector(".fg").style.strokeDashoffset = (100.5 * (1 - f)).toFixed(1); ks.classList.toggle("ready", R.skillCd <= 0); }
    $("#ksherbs").textContent = String(K.S.items.herbs || 0);
    $(".acts .roll").classList.toggle("off", R.breath < RT.P.rollMin);
    $(".hb.withdraw").hidden = !C.canFlee();
    $(".edgefx.l").classList.toggle("on", !!R.pushing && p.rt.face < 0);
    $(".edgefx.r").classList.toggle("on", !!R.pushing && p.rt.face > 0);
    $(".slowtint").classList.toggle("on", R.slow > 0);
    V.el.classList.toggle("frozen", R.frozen > 0);
    while (V.logAt < B.log.length) { const e = B.log[V.logAt++]; if (e && (e.raw || e.ev)) toast(C.line(e)); }
  }
  // Marks: a ground mark under the one a blow is coming at, filling as it comes; an arrow's lane a thin dashed line.
  function marks() {
    const R = V.R, G = V.G, p = C.player();
    $$(".mark, .mark-tag", V.world).forEach((m) => (m.dataset.keep = ""));
    for (const e of R.B.units) {
      if (e.side !== "enemy" || e.hp <= 0 || !e.rt.atk) continue;
      const m = RT.markOf(R, e); if (!m) continue;
      const key = e.uid + "@" + e.rt.atk.t0;
      let el = V.world.querySelector('.mark[data-k="' + key + '"]'), tag = V.world.querySelector('.mark-tag[data-k="' + key + '"]');
      if (!el) { el = U.el('<div class="mark' + (m.lane ? " lane" : "") + '" data-k="' + key + '"><div class="rim"></div><div class="fill"></div></div>'); V.world.appendChild(el); if (!m.lane) { tag = U.el('<span class="mark-tag" data-k="' + key + '"></span>'); V.world.appendChild(tag); } }
      el.dataset.keep = "1"; if (tag) tag.dataset.keep = "1";
      const t = R.B.units.find((u) => u.uid === m.on), ta = t && V.actors.get(t.uid), ea = V.actors.get(e.uid);
      if (m.lane) {
        const sr = V.stage.getBoundingClientRect(), bow = ea && (ea.svg.querySelector(".it:not(.it-w)") || ea.svg.querySelector(".foreF"));
        const br = bow ? bow.getBoundingClientRect() : null;
        const A = br ? { x: br.left + br.width / 2 - sr.left, y: br.top + br.height / 2 - sr.top } : { x: G.fx0 + e.rt.x * G.FW, y: G.H - G.gl - G.ph * 0.6 };
        const Bp = { x: G.fx0 + ((m.x0 + m.x1) / 2) * G.FW, y: G.H - (ta ? ta.gy + ta.fh * 0.58 : G.gl + G.ph * 0.58) };
        const dx = Bp.x - A.x, dy = Bp.y - A.y, len = Math.max(8, Math.hypot(dx, dy) - (ta ? ta.bw * 0.4 : 10));
        Object.assign(el.style, { left: A.x + "px", top: A.y + "px", bottom: "auto", width: len + "px", transform: "rotate(" + Math.atan2(dy, dx) + "rad)" });
        el.classList.toggle("locked", !!m.locked);
        continue;
      }
      const L = G.fx0 + m.x0 * G.FW, Wd = Math.max(10, (m.x1 - m.x0) * G.FW), hgt = Math.max(10, (ea ? ea.fh : G.ph) * 0.11), gy = ta ? ta.gy : G.gl;
      Object.assign(el.style, { left: L + "px", width: Wd + "px", height: hgt + "px", bottom: (gy - hgt / 2) + "px" });
      const fill = el.querySelector(".fill"); fill.style.width = (Wd * m.fill) + "px";
      if (e.rt.x > (m.x0 + m.x1) / 2) { fill.style.left = "auto"; fill.style.right = "0"; } else { fill.style.left = "0"; fill.style.right = "auto"; }
      const mine = m.on === p.uid || (p.rt.x >= m.x0 && p.rt.x <= m.x1);
      tag.textContent = mine ? K.tr("On you") : t ? K.text(t.src || t.name).split(",")[0] : "";
      tag.classList.toggle("me", mine); tag.style.left = L + "px"; tag.style.top = (G.H - gy + hgt / 2 + 4) + "px";
    }
    $$(".mark, .mark-tag", V.world).forEach((m) => { if (!m.dataset.keep) m.remove(); });
  }
  function fx(f) {
    const R = V.R, p = C.player(), me = V.actors.get(p.uid);
    const A = (uid) => V.actors.get(uid);
    switch (f.k) {
      case "blow": pose(me, f.n === 2 ? "windup" : "strike", 1700, 0.55); setTimeout(() => pose(me, "strike", 1700, 0.55), f.n === 2 ? 120 : 0); home(me, f.n === 2 ? 520 : 300); if (K.Sound) K.Sound.play("tap"); break;
      case "roll": pose(me, "duck", 1400, 0.6); home(me, 400); break;
      case "kneel": pose(me, "kneel", 600, 0.6); home(me, 1100); break;
      case "skill": pose(me, R.skill === "aimed" ? "loose" : R.skill === "salve" ? "kneel" : R.skill === "song" || R.skill === "command" ? "cheer" : "strike", 900, 0.55); home(me, 500);
        if (R.skill === "quake") shake(true); toast(K.tr(SKILL_NAME[R.skill])); break;
      case "hit": { const a = A(f.uid); if (!a) break; a.el.classList.add("hit"); setTimeout(() => a.el.classList.remove("hit"), 90);
        if (a.rig) a.rig.kick(a.u.side === "enemy" ? { rot: 220, head: 180 } : { rot: -260, head: -200, armF: 160 });
        if (f.n) pop(a, String(f.n), a.u.side === "player" ? "me" : a.u.side === "ally" ? "ally" : "");
        if (U.rigFreeze) U.rigFreeze(f.heavy ? 80 : 50);
        if (f.heavy || a.u.side === "player") shake(false);
        if (f.heavy) nameTag(a, 1.2);
        if (K.Sound) K.Sound.play("hit");
        break; }
      case "heal": { const a = A(f.uid); if (a) pop(a, "+", "heal"); break; }
      case "miss": { const a = A(f.uid); if (a) pop(a, K.tr("Missed"), "miss"); break; }
      case "perfect": toast(K.tr("Perfect roll")); break;
      case "fall": { const a = A(f.uid); if (a) fell(a); break; }
      case "shot": { // the arrow leaves the bow (measured from the live figure) and flies down its lane
        const a = A(f.uid), s = f.shot; if (!a) break;
        const wr = V.world.getBoundingClientRect(), hand = a.svg.querySelector(".foreF") || a.svg, hr = hand.getBoundingClientRect();
        const from = { x: hr.left - wr.left + hr.width / 2, y: hr.top - wr.top + hr.height * 0.45 };
        const tgt = s.on && A(s.on), G = V.G;
        const to = { x: G.fx0 + s.lane * G.FW, y: G.H - ((tgt ? tgt.gy : G.gl) + (tgt ? tgt.fh : G.fh) * 0.55) };
        const go = () => U.flyArrow && U.flyArrow(V.world, from, to, Math.abs(to.x - from.x) * 0.05, Math.max(90, (s.arrive - s.t0) * 1000), false, Math.max(26, G.fh * 0.36));
        if (a.u.side === "player") { pose(a, "draw", 900, 0.6); setTimeout(() => { pose(a, "loose", 1200, 0.5); home(a, 450); go(); }, Math.max(0, (s.t0 - V.R.t) * 1000)); }
        else { pose(a, "loose", 1200, 0.5); home(a, 450); go(); }
        break; }
      case "blocked": toast(K.tr("A foe stands in your way")); break;
      case "beaten": { const a = A(f.uid); if (a) { pose(a, "kneel", 600, 0.6); a.el.classList.add("beaten"); } break; }
      case "join": { toast(K.tr("Help comes.")); const a = A(f.uid); if (a) setTimeout(() => nameTag(a, 2), 50); break; }
      case "call": break;
      case "astra": {
        const o = f.out || {}, to = o.uid && A(o.uid);
        if (U.astraFx) U.astraFx({ kind: o.kind || "generic", clash: !!o.clash, from: me && me.svg, to: to && to.svg });
        V.stage.classList.add("ax-flash"); setTimeout(() => V && V.stage.classList.remove("ax-flash"), 700);
        shake(true);
        if (!o.clash) { const sc = $(".rt-scorch", V.stage); sc.className = "rt-scorch on k-" + (o.kind || "generic"); setTimeout(() => { if (V) sc.className = "rt-scorch"; }, 6000); }
        (f.struck || []).forEach((uid) => { const a = A(uid); if (a && a.rig) a.rig.kick({ rot: 600, tx: 40, head: 300 }); });
        break; }
    }
  }
})(window.K = window.K || {});
