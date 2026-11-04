/* Real-time fights (PRD §18.15), the screen: the fights of engine/realtime.js RT.IDS, unless the menu's "Fights"
   is turn-based (RT.wanted). Every other fight goes on to ui/warday.js and ui/battle.js.
   A copy of the approved layout page (scratchpad rtlayout/page.js + page.css, 3 November): the same DOM
   (.screen.rt > .stage with .hud, .kstrip, .toast; .ctl with ◀ ▶ | Skill, Roll, Strike; compact sheets),
   the same geometry (the field the stage's width on a phone, a band of 9.5 bodies on a laptop; the front
   row's figures about 30% of the stage high, rows 11% higher and 12% smaller each), the same CSS
   (css/realtime.css is page.css scoped to #rt). Orders and Aid open over the controls at exactly their
   height, with a burning diya that closes them after 6 s; a tap outside closes them; the fight waits.
   Keys: A/D or ←/→ move, W/S or ↑/↓ change row, J strike, K or Space roll, L skill, H herbs, C call, U
   divine weapon, O orders, P or Esc pause, E spare. Mouse (laptops): click the ground to walk, a foe to
   strike; right- or Shift-click rolls (a shield-carrier holds K, Space or the right button to Block). Under the tests (K.headless, jsdom) the bot plays it at once. */
(function (K) {
  "use strict";
  const U = K.UI, C = K.Combat, RT = K.RT;
  const turnBased = U.startBattle;
  U.startBattle = function (encId, onEnd) {
    if (V) stop(); // a fight still on screen gives way to the new one
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
  // A shield-carrier (C.hasShield: the mace, the sword paths) blocks where the others roll (owner, 4 November).
  const KEYS_BLOCK = "A / D move · W / S change row · J strike · hold K or Space to block · L skill · H herbs · C call · U divine weapon · O orders · P pause · E spare";
  const blocker = () => !!(V && V.R && V.R.blocker);
  const mace = () => !!(V && V.R && RT.comboOf(V.R).length === 2);
  const WEAPON = {
    spear: '<svg viewBox="0 0 100 12" aria-hidden="true"><path d="M3 6 H80" stroke="#5a3418" stroke-width="3" stroke-linecap="round"/><path d="M79 2 L98 6 L79 10 Z" fill="#dcd7c8" stroke="#1d0f08" stroke-width="1"/></svg>',
    bow: '<svg viewBox="0 0 100 24" aria-hidden="true"><path d="M4 20 Q50 -10 96 20" fill="none" stroke="#5a3418" stroke-width="3.4" stroke-linecap="round"/><path d="M4 20 L96 20" stroke="#efe2c0" stroke-width="1"/></svg>',
    mace: '<svg viewBox="0 0 100 24" aria-hidden="true"><path d="M4 12 H70" stroke="#6b4422" stroke-width="4" stroke-linecap="round"/><ellipse cx="82" cy="12" rx="15" ry="10" fill="#d9a53a" stroke="#1d0f08" stroke-width="1.2"/></svg>',
    sword: '<svg viewBox="0 0 100 12" aria-hidden="true"><path d="M4 6 H20" stroke="#5a3418" stroke-width="4" stroke-linecap="round"/><path d="M20 3 L92 5 L98 6 L92 7 L20 9 Z" fill="#dcd7c8" stroke="#1d0f08" stroke-width="1"/></svg>'
  };
  // Each unit as a puppet: you with the weapon you fight with (K.fightItem: a sword for the driver and the commander, the bow
  // for the archer, no swap mid-fight) and your small shield on the mace and sword paths; everyone else as ui/battle.js draws
  // him (one rule for every screen: tests/weapons.js holds RT.weaponOf to it).
  function specFor(u) {
    if (u.side === "player") {
      const sp = Object.assign({}, K.puppetSpec(K.S), { item: K.fightItem(K.S) });
      if (C.hasShield && C.hasShield()) sp.gear = (sp.gear || []).filter((g) => g !== "shield").concat("buckler");
      return sp;
    }
    if (U.battleSpecFor) return U.battleSpecFor(u);
    if (u.person && K.PUPPETS && K.PUPPETS[u.person]) return U.puppetFor(u.person);
    return U.puppetFor("soldier");
  }


  let V = null; // the screen's state while a fight is on
  U.rtScreen = () => V; // for the fit checks and screenshots
  U.rtStop = () => stop(); // close the screen without an outcome (the layout checks)
  // A foe kneeling and asking for mercy (C.spareable): "Mercy!" over him, an open hand, and the "Spare" hint when
  // he can be spared now (in reach, or on the turns); "Spared" once he is (the fight goes on). Shared with ui/warday.js.
  // state: "ask" (tap to spare), "far" (step closer), "spared", or "" (none).
  U.pleaTag = function (el, state, onSpare) {
    let t = el.querySelector(":scope > .plea");
    if ((t ? t.dataset.s : "") === state) return;
    if (!state) { if (t) t.remove(); return; }
    if (!t) { t = document.createElement("span"); t.className = "plea"; el.appendChild(t); t.addEventListener("pointerdown", (e) => { e.stopPropagation(); }); t.addEventListener("click", (e) => { e.stopPropagation(); if (t.dataset.s === "ask" && t._spare) t._spare(); }); }
    t._spare = onSpare; t.dataset.s = state;
    t.innerHTML = state === "spared" ? "<b>" + U.esc(U.tr("Spared")) + "</b>" : '<b>' + U.esc(U.tr("Mercy!")) + "</b>" + (state === "ask" ? '<i role="button">' + U.esc(U.tr("Spare")) + "</i>" : "");
    t.setAttribute("aria-label", state === "spared" ? U.tr("Spared") : U.tr("Mercy!") + (state === "ask" ? " " + U.tr("Spare") : ""));
  };

  U.startRealtime = function (encId, onEnd) {
    if (V) stop();
    if (K.Sound) { K.Sound.play(K.ENCOUNTERS[encId].lethal && K.S.act === 6 ? "callToArms" : "drumCall"); if (K.Sound.mood) K.Sound.mood("battle"); }
    const B = C.start(encId, onEnd);
    const R = RT.begin(B, { assist: U.assist && U.assist() });
    V = { encId, onEnd, R, actors: new Map(), held: { l: false, r: false }, queue: {}, acc: 0, last: 0, raf: 0, paused: false, sheet: null, toastT: 0, logAt: B.log.length };
    build();
    // Before the first blow: the rules card (or one line), then on a life's first fight the walkthrough. Not
    // for the dream, a bout or the practice ground, nor under the tests (U.fightBriefWanted). The fight waits.
    if (U.fightBriefWanted && U.fightBriefWanted(encId)) brief();
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
      '<div class="stage" id="rt-stage"><div class="world" id="rt-world"></div><div class="tags"></div><div class="edgefx l"></div><div class="edgefx r"></div><div class="slowtint"></div><div class="rt-scorch"></div>' +
        '<div class="hud"><div class="bars">' +
          '<div class="bar hp"><span>' + T("You") + '</span><i><b id="b-hp"></b></i></div>' +
          '<div class="bar br"><span>' + T("Breath") + '</span><i><b id="b-br"></b></i></div>' +
          '<div class="bar fr" hidden><span id="b-frn"></span><i><b id="b-fr"></b></i></div></div>' +
        '<div class="hud-r"><div class="fname"><b>' + title + '</b><small class="packn"></small></div>' +
          '<div class="hud-btns"><button type="button" class="hb orders" data-act="orders" aria-haspopup="dialog">' + T("Orders") + " ▾" + kb("O") + "</button>" +
          '<button type="button" class="hb withdraw" data-act="withdraw">' + T("Withdraw") + "</button>" +
          '<button type="button" class="hb pause" data-act="pause" aria-label="' + T("Pause") + '" title="' + T("Pause") + '">' + PAUSE + "</button>" +
          '</div><button type="button" class="hb aid" data-act="aid" aria-haspopup="dialog">' + T("Aid") + " ▾</button></div></div>" +
        '<div class="kstrip" aria-hidden="true"><span class="ks-skill"><svg class="ring" viewBox="0 0 40 40"><circle class="bg" cx="20" cy="20" r="16"/><circle class="fg" cx="20" cy="20" r="16" stroke-dasharray="100.5" stroke-dashoffset="0"/></svg>' + skill + ' <kbd>L</kbd></span><span class="ks-herbs">' + T("Herbs") + ' <b id="ksherbs"></b> <kbd>H</kbd></span><span class="ks-keys">' + T(R.blocker ? "J strike · K block · L skill · H herbs · W/S row · P pause" : "J strike · K roll · L skill · H herbs · W/S row · P pause") + "</span></div>" +
        '<div class="banner off" role="status"></div><div class="toast off" role="status"></div></div>' +
      '<div class="ctl" id="rt-ctl"><div class="pad"><button type="button" class="mv" data-hold="l" aria-label="' + T("Move left") + '">◀' + kb("A") + '</button><button type="button" class="mv" data-hold="r" aria-label="' + T("Move right") + '">▶' + kb("D") + "</button></div>" +
        '<ul class="keys">' + T(R.blocker ? KEYS_BLOCK : KEYS_ALL).split(" · ").map((x) => "<li>" + U.esc(x) + "</li>").join("") + "</ul>" +
        '<div class="acts"><button type="button" class="skill" data-act="skill"' + (R.skill ? "" : " disabled") + '><svg class="ring" viewBox="0 0 40 40" aria-hidden="true"><circle class="bg" cx="20" cy="20" r="18"/><circle class="fg" cx="20" cy="20" r="18" stroke-dasharray="113.1" stroke-dashoffset="0"/></svg><span>' + skill + "</span>" + kb("L") + "</button>" +
          (R.blocker ? '<button type="button" class="roll block" data-hold="block" aria-label="' + T("Block") + '">' + T("Block") + kb("K") + "</button>"
            : '<button type="button" class="roll" data-act="roll">' + T("Roll") + kb("K") + "</button>") +
          '<button type="button" class="strike" data-act="strike">' + T("Strike") + "<small>" + T(RT.comboOf(R).length === 2 ? "×2 combo" : "×3 combo") + "</small>" + kb("J") + "</button></div></div>" +
      '<div class="sheet orders-sheet" role="dialog" aria-label="' + T("Orders") + '" hidden></div>' +
      '<div class="sheet aid-sheet dropdown" role="dialog" aria-label="' + T("Aid") + '" hidden></div>' +
      '<div class="sheet pause-sheet" role="dialog" aria-label="' + T("Paused") + '" hidden></div></div>');
    document.body.appendChild(el);
    document.body.classList.add("in-rt");
    V.el = el; V.stage = el.querySelector("#rt-stage"); V.world = el.querySelector("#rt-world"); V.tags = el.querySelector(".tags");
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
      if (e.pointerType === "touch" && !V.touched) { V.touched = true; layout(); } // a touch on a laptop's screen: the corner controls
      if (e.pointerType !== "mouse") { V.swipe = { x: e.clientX, y: e.clientY, t: performance.now() }; return; }
      const p = C.player();
      if ((e.button === 2 || e.shiftKey) && V.R.blocker) { V.held.block = true; V.mouseBlock = true; return; } // held while the button is
      if (e.button === 2 || e.shiftKey) { V.queue.roll = true; V.queue.rollDir = x >= p.rt.x ? 1 : -1; return; }
      if (e.button !== 0) return;
      const foe = foeAt(e.clientX - r.left, e.clientY - r.top);
      if (foe && RT.spareable(V.R).some((u) => u.uid === foe)) { V.queue.spare = foe; return; }
      V.walk = { x, foe };
    });
    V.stage.addEventListener("pointerup", (e) => {
      if (V.mouseBlock) { V.mouseBlock = false; V.held.block = false; }
      const sw = V.swipe; V.swipe = null;
      if (!sw || performance.now() - sw.t > 600) return;
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      if (Math.abs(dy) > 28 && Math.abs(dy) > Math.abs(dx) * 1.2) { V.queue.row = dy < 0 ? 1 : -1; return; }
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { const r = V.stage.getBoundingClientRect(), foe = foeAt(e.clientX - r.left, e.clientY - r.top); if (foe && RT.spareable(V.R).some((u) => u.uid === foe)) V.queue.spare = foe; } // spare: a tap on the beaten foe
    });
    window.addEventListener("keydown", onKey, true); window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("resize", onResize); document.addEventListener("visibilitychange", onHidden);
    document.addEventListener("pointerdown", dropOutside, true);
    layout();
  }
  // The living foe drawn under a point of the stage (figures let clicks through): its body's box, the nearest first.
  function foeAt(px, py) {
    const G = V.G; if (!G) return null;
    let best = null, bd = 1e9;
    V.actors.forEach((a) => {
      const u = a.u; if (u.side !== "enemy" || u.hp <= 0 || u.spared || !u.rt || !u.rt.entered || a.x == null) return;
      const hw = Math.max(a.bw * 0.7, 22), foot = G.H - a.gy, d = Math.abs(px - a.x);
      if (d <= hw && py >= foot - a.fh * 1.05 && py <= foot + 10 && d < bd) { bd = d; best = u.uid; }
    });
    return best;
  }
  // The layout page's layout(): upright or wide by the screen's shape; the stage takes what the controls leave.
  function layout() {
    if (!V) return;
    const vw = window.innerWidth, vh = window.innerHeight, scr = V.el;
    const wide = vw >= 820 && vw / vh >= 1.15;
    const touch = !!((window.matchMedia && matchMedia("(pointer: coarse)").matches) || V.touched); // a boolean: undefined would toggle the class on
    scr.classList.toggle("wide", wide); scr.classList.toggle("upright", !wide); scr.classList.toggle("touch", wide && touch);
    scr.style.setProperty("--bh", (wide ? 40 : 44) + "px"); scr.style.setProperty("--hb", "0px");
    const W = V.stage.clientWidth, H = V.stage.clientHeight;
    V.stage.style.backgroundImage = "url(" + (H > W * 1.25 && V.art[1] ? V.art[1] : V.art[0]) + ")";
    const FIELD = 1 / RT.BODY;
    const ph = wide ? Math.min(H * 0.3, W / (FIELD * 0.36)) : Math.min(H * 0.3, W * 0.52); // a tall phone: the front row's figure about 29% of the stage
    const FW = wide ? Math.min(W, ph * 0.36 * FIELD) : W;
    V.G = { W, H, ph, FW, fx0: (W - FW) / 2, dk: 0.12, gl: wide && !scr.classList.contains("touch") ? Math.max(H * 0.06, 46) : H * (wide ? 0.06 : 0.05), dstep: H * (wide ? 0.1 : 0.11), wide };
    // The fight's scale: a front-row figure's width in the field's body widths (about 1.8 on a phone, 1 on a laptop), so
    // that two who fight stand where their weapons reach, as drawn (engine RT.setScale).
    if (RT.setScale && V.R) RT.setScale(V.R, ph * 0.36 / (FW / FIELD));
    V.actors.forEach((a) => size(a));
    fitSkill();
    const eL = $(".edgefx.l"), eR = $(".edgefx.r"); if (eL) { eL.style.width = eR.style.width = (V.G.fx0 + FW * 0.12) + "px"; }
    if (V.sheet === "orders" || V.sheet === "aid") placeDrop($("." + V.sheet + "-sheet"), $(".hb." + V.sheet));
  }
  // A long skill name (Ground-shaker, Hindi) fits its ring: smaller, on two lines if it must.
  function fitSkill() {
    const b = $(".acts .skill"), sp = b && b.querySelector("span");
    if (!sp || !b.offsetWidth) return;
    sp.style.fontSize = ""; sp.style.maxWidth = (b.clientWidth - 8) + "px";
    let fs = parseFloat(getComputedStyle(sp).fontSize) || 14;
    const kb = b.querySelector("kbd"), room = () => b.clientHeight - 6 - (kb && kb.offsetHeight ? kb.offsetHeight + 2 : 0);
    while (fs > 9.5 && (sp.scrollWidth > b.clientWidth - 6 || sp.offsetHeight > room())) { fs -= 0.5; sp.style.fontSize = fs + "px"; }
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
    a.rig = U.motion() && U.rig ? U.rig(svg, el, a.base, { fight: true }) : null;
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
  function home(a, ms) { setTimeout(() => { if (!V || !a.u) return; if (a.swing && performance.now() - a.swing.t0 < 300) return; // a new blow begun meanwhile keeps its swing
    if (a.rig) { a.rig.t.dx = 0; a.rig.t.dy = 0; if (a.armed) { a.rig.unwield(); a.armed = false; } }
    if (a.u.side === "player" && V.R.block && a.u.hp > 0) { pose(a, "shieldUp", 1500, 0.6); return; } // the shield stays up while held
    if (a.u.rt && a.u.rt.beaten && a.u.hp > 0) pose(a, "kneel", 600, 0.6); else if (a.rig && a.u.hp > 0) a.rig.set(a.base, 520, 0.42); else if (!a.rig && a.u.hp > 0) pose(a, a.u.side === "player" ? "brace" : "stand"); }, ms || 0); }
  // ---------- Blows that land (owner, 4 November: room for the weapons; the blow falls on the body or the weapon) ----------
  // A swing ends with the weapon's tip on the one struck: U.aimBlow (puppet-anim.js) turns the arm about the shoulder
  // and sets the lunge, measured on the live figures; at the moment of contact U.blowImpact puts the figure at the end
  // of the swing and gives the point where the weapon meets the body (or the shield, or the blade that parries it),
  // and the hit-stop, the flash, the flakes and the sparks are all there.
  const IMPACT = 95; // ms from the start of a swing to contact
  const MELEE_KIND = new Set(["mace", "sword", "woodsword", "spear", "dagger", "club", "hammer"]);
  function armFor(a) { // a bowman (or one with a whip, a scroll, a bowl) strikes with the blade he draws for it
    const w = a.u.rt && a.u.rt.weapon, own = a.spec && a.spec.item;
    if (!a.rig || !w || w === "fist" || w === own || MELEE_KIND.has(own)) return;
    a.rig.wield(w); a.armed = true;
  }
  function guardOf(t) {
    if (!t || !t.svg) return null;
    const up = t.sparkAt && performance.now() - t.sparkAt < 250 || t.shieldUp || (t.rig && (t.rig.pose === "guard" || t.rig.pose === "block"));
    if (!up) return null;
    return t.svg.querySelector(".pp-body .it-s") ? "shield" : t.svg.querySelector(".pp-body .foreF .it-w") ? "weapon" : null;
  }
  // arc: a mace's smash or sweep (U.MACE_ARCS): the blow ends in its own pose and falls where it falls (shoulders, ribs).
  function swing(a, t, guard, arc) {
    if (!a || a.u.hp <= 0) return;
    const now = performance.now(), again = a.swing && now - a.swing.t0 < IMPACT + 60; // the blow already in the air, re-aimed at whom it strikes
    const A = arc && U.MACE_ARCS ? U.MACE_ARCS[arc] : null;
    armFor(a);
    a.swing = { t0: again ? a.swing.t0 : now, on: t ? t.u.uid : null, aim: null, arc };
    if (a.rig && t && t.u.hp > 0 && t !== a) a.swing.aim = U.aimBlow(a.rig, t.svg, { guard, k: A ? 1500 : 1700, z: 0.55, pose: A ? A.end : undefined, at: A ? A.at : undefined });
    if (!a.swing.aim) pose(a, A ? A.end : "strike", 1600, 0.55);
    home(a, A ? 560 : 460);
  }
  function landHit(f) { // a melee blow: the struck one reacts when the weapon reaches it
    const a = V.actors.get(f.uid), by = f.by != null && V.actors.get(f.by);
    if (!a) return;
    if (!f.melee || !by || by === a) return struck(a, f, null);
    by.swingOn = null;
    const guard = guardOf(a);
    swing(by, a, guard, f.arc);
    const sw = by.swing, wait = Math.max(0, sw.t0 + IMPACT - performance.now());
    setTimeout(() => {
      if (!V || !a.el.isConnected) return;
      const res = sw.aim && by.swing === sw ? U.blowImpact(sw.aim) : null, wr = V.world.getBoundingClientRect();
      let pt;
      if (res) pt = { x: res.x - wr.left, y: res.y - wr.top, on: res.on };
      else { const r = (a.svg.querySelector(".pp-torso") || a.svg).getBoundingClientRect(); pt = { x: r.left + r.width / 2 - wr.left, y: r.top + r.height * 0.3 - wr.top, on: guard || "body" }; }
      const bu = by.u, au = a.u; // for the fit checks (tests/blowfit.js): where the tip fell, and how far apart the two stood
      (V.impacts = V.impacts || []).push({ by: bu.uid, on: au.uid, res, guard, apart: bu.rt && au.rt ? Math.abs(bu.rt.x - au.rt.x) : null, reach: bu.rt && bu.rt.reach, rows: bu.rt && au.rt ? Math.abs(bu.rt.lane - au.rt.lane) : 0, t: V.R.t });
      if (V.impacts.length > 60) V.impacts.shift();
      struck(a, f, pt);
      home(by, (f.heavy ? 80 : 50) + (f.arc ? 300 : 170)); // a mace's follow-through is held a little longer
    }, wait);
  }
  function struck(a, f, pt) {
    a.el.classList.add("hit"); setTimeout(() => a.el.classList.remove("hit"), 90);
    if (a.rig) a.rig.kick(a.u.side === "enemy" ? { rot: 220, head: 180 } : { rot: -260, head: -200, armF: 160 });
    if (f.n) pop(a, String(f.n), a.u.side === "player" ? "me" : a.u.side === "ally" ? "ally" : "");
    if (U.rigFreeze) U.rigFreeze(f.heavy ? 80 : 50);
    if (f.heavy || a.u.side === "player") shake(false);
    if (f.heavy) nameTag(a, 1.2);
    const clash = pt && pt.on !== "body";
    if (pt) {
      const fl = document.createElement("i"); fl.className = "impact" + (clash ? " clash" : ""); fl.style.left = pt.x + "px"; fl.style.top = pt.y + "px";
      V.world.appendChild(fl); setTimeout(() => fl.remove(), 320);
      if (U.flingBits) { if (clash) U.flingBits(V.world, "spark", pt, 10, 12, null, true); else U.flingBits(V.world, "flake", pt, 6, Math.max(8, a.bw * 0.2), "#8a3a2a"); }
    } else if (a.sparkAt && performance.now() - a.sparkAt < 250) sparkAt(a);
    a.sparkAt = 0;
    if (K.Sound) K.Sound.play(clash ? "clang" : "hit");
  }
  function sparkAt(a) { // sparks from the middle of the shield (an arrow on it)
    const wr = V.world.getBoundingClientRect(), sh = a.svg.querySelector(".it-s") || a.svg.querySelector(".pp-body"), r = sh.getBoundingClientRect();
    if (U.flingBits) U.flingBits(V.world, "spark", { x: r.left + r.width / 2 - wr.left, y: r.top + r.height / 2 - wr.top }, 9, 16, null, true);
  }
  // The foe a blow of yours is likely to fall on (the engine's own choice comes with the hit).
  function inFront(p) { let best = null, bd = 9; for (const e of V.R.B.units) { if (e.side !== "enemy" || e.hp <= 0 || !e.rt || !e.rt.entered) continue; const d = (e.rt.x - p.rt.x) * p.rt.face; if (d > -0.03 && d < bd) { bd = d; best = e; } } return best && V.actors.get(best.uid); }
  // Name tags: a small pill at the waist, nudged off the shield; for 2 s at a time.
  // On a layer over every figure (.tags), so no figure in front hides it; placed each frame while it shows.
  function nameTag(a, s) {
    if (!a || !a.name || a.u.hp <= 0) return;
    let t = a.tag;
    if (!t) { t = a.tag = document.createElement("span"); t.className = "nametag"; t.textContent = a.name; V.tags.appendChild(t); }
    placeTag(a);
    t.classList.add("on"); clearTimeout(t.off); t.off = setTimeout(() => t.classList.remove("on"), (s || 2) * 1000);
  }
  function placeTag(a) {
    const t = a.tag; if (!t || a.x == null) return;
    t.style.bottom = (a.gy + a.fh * (a.u.rt && a.u.rt.beaten ? 0.3 : 0.4)) + "px"; t.style.left = (a.x - (a.u.rt ? a.u.rt.face : 1) * a.fh * 0.05) + "px";
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
    if (a.tag) a.tag.classList.remove("on");
    // Toward the middle of the stage (RT.fallDir): forward when it faces the middle, else backward.
    const toward = RT.fallDir(a.u), fwd = toward === (a.u.rt ? a.u.rt.face : 1) ? 1 : -1;
    if (a.rig) a.rig.fallDown(-86, fwd); else pose(a, "fall");
    const flung = a.u.rt && a.u.rt.flung != null && V.R.t - a.u.rt.flung < 3; // thrown by a divine weapon: the weapon flies
    const item = a.svg.querySelector(".it"), kind = a.spec && a.spec.item, svgW = WEAPON[kind] || (kind ? WEAPON.sword : null);
    if (item && svgW && !a.dropped) {
      item.style.visibility = "hidden"; a.dropped = true;
      const w = document.createElement("div"); w.className = "dropped"; w.innerHTML = svgW;
      const len = a.fh * (kind === "spear" ? 0.62 : 0.42), side = -toward;
      Object.assign(w.style, { left: (a.x - side * a.bw * 0.15 - len / 2) + "px", bottom: (a.gy - 2) + "px", width: len + "px" });
      V.world.appendChild(w); a.weaponEl = w;
      const rot = side * 7;
      if (!U.calm() && flung) w.animate([{ transform: "translate(" + (side * a.bw) + "px," + (-a.fh * 0.6) + "px) rotate(0deg)" }, { transform: "translate(" + (-side * a.bw * 0.4) + "px," + (-a.fh * 1.25) + "px) rotate(" + (-side * 380) + "deg)", offset: 0.45 }, { transform: "translate(0,0) rotate(" + (rot - side * 720) + "deg)" }], { duration: 900, easing: "cubic-bezier(.3,.5,.6,1)", fill: "forwards" });
      else if (!U.calm()) w.animate([{ transform: "translateY(" + (-a.fh * 0.5) + "px) rotate(" + (-side * 70) + "deg)" }, { transform: "translateY(0) rotate(" + rot + "deg)" }], { duration: 520, easing: "ease-in", fill: "forwards" });
      else w.style.transform = "rotate(" + rot + "deg)";
    }
  }

  // ---------- Input ----------
  const KEY = { KeyJ: "strike", KeyK: "roll", Space: "roll", KeyL: "skill", KeyH: "herbs", KeyC: "call", KeyU: "astra", KeyO: "orders", KeyP: "pause", Escape: "pause", KeyE: "spare" };
  function onKey(e) {
    if (!V) return;
    if (V.briefing) { // the rules card or the walkthrough is up: its own keys, nothing reaches the fight
      e.preventDefault(); e.stopPropagation();
      if (e.repeat) return;
      if (V.tourNext) { if (e.code === "Escape") V.tourEnd(true); else if (["Space", "Enter", "ArrowRight", "NumpadEnter"].includes(e.code)) V.tourNext(); }
      else if (V.briefGo && ["Space", "Enter", "NumpadEnter", "KeyJ"].includes(e.code)) V.briefGo();
      return;
    }
    if (e.code === "KeyA" || e.code === "ArrowLeft") { V.held.l = true; e.preventDefault(); e.stopPropagation(); return; }
    if (e.code === "KeyD" || e.code === "ArrowRight") { V.held.r = true; e.preventDefault(); e.stopPropagation(); return; }
    if ((e.code === "KeyK" || e.code === "Space") && blocker()) { V.held.block = true; e.preventDefault(); e.stopPropagation(); if (V.sheet) closeSheet(); return; } // held up while held
    if (e.code === "KeyW" || e.code === "ArrowUp" || e.code === "KeyS" || e.code === "ArrowDown") { e.preventDefault(); e.stopPropagation(); if (!e.repeat && !V.sheet) V.queue.row = e.code === "KeyW" || e.code === "ArrowUp" ? 1 : -1; return; }
    const a = KEY[e.code];
    if (!a) return;
    e.preventDefault(); e.stopPropagation();
    if (e.repeat && a !== "strike") return;
    if (V.sheet && (a === "pause" || a === "orders")) return closeSheet();
    act(a);
  }
  function onKeyUp(e) { if (!V) return; if (e.code === "KeyA" || e.code === "ArrowLeft") V.held.l = false; if (e.code === "KeyD" || e.code === "ArrowRight") V.held.r = false; if (e.code === "KeyK" || e.code === "Space") V.held.block = false; }
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
      resumeBtn(el); el.classList.add("compact"); placeDrop(el, $(".hb.orders")); dropTimer(el);
    } else if (kind === "aid") {
      const el = $(".aid-sheet"), ast = RT.astras(), aReady = ast.find((x) => !x.why);
      const it = (k, label, note, off, key) => '<button type="button" data-aid="' + k + '"' + (off ? ' disabled aria-disabled="true"' : "") + "><b>" + U.esc(label) + "</b><small>" + U.esc(note) + "</small><kbd>" + key + "</kbd></button>";
      el.innerHTML = it("herbs", K.tr("Herbs"), K.tr("{n} left", { n: K.S.items.herbs || 0 }), !RT.can(R, "herbs"), "H") +
        it("astra", K.tr(aReady ? aReady.name : "Divine weapon"), aReady ? K.tr("Divine weapon") : ast[0] ? (B_used(ast) ? K.tr("used") : ast[0].why || "") : K.tr("not given"), !aReady, "U") +
        (p.abilities.includes("call") ? it("call", K.tr("Call for help"), RT.can(R, "call") ? K.tr("once a fight") : K.tr("called"), !RT.can(R, "call"), "C") : "");
      el.querySelectorAll("[data-aid]").forEach((b) => (b.onclick = () => { closeSheet(); act(b.dataset.aid); }));
      resumeBtn(el); el.classList.add("compact"); placeDrop(el, $(".hb.aid")); dropTimer(el);
    } else {
      const el = $(".pause-sheet");
      if (kind === "pause") el.innerHTML = "<h2>" + T("Paused") + '</h2><div class="p-main opts one"><button type="button" class="go" data-close>' + T("Resume ▶") + "</button>" +
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
  // Orders and Aid end in a compact "Resume ▶": it closes the panel and the fight goes on (tap outside and the diya still do too).
  function resumeBtn(el) {
    el.insertAdjacentHTML("beforeend", '<button type="button" class="resume" data-resume>' + T("Resume ▶") + "</button>");
    el.querySelector("[data-resume]").onclick = () => closeSheet();
  }
  const B_used = (ast) => ast.some((x) => x.why === K.tr("Used this battle"));
  // The panel takes exactly the controls' place (phones, touch screens); on a laptop, a corner under its button.
  function placeDrop(panel, btn) {
    panel.hidden = false;
    const ctl = $(".ctl"), ar = ctl && ctl.getBoundingClientRect(), wide = V.el.classList.contains("wide");
    panel.classList.remove("matched", "m-rt"); panel.classList.toggle("wide", wide);
    if (ar && ar.height > 20 && !wide) { // a wide screen (touch or not) has no controls row under the stage: a corner
      panel.classList.add("matched", "m-rt");
      Object.assign(panel.style, { position: "fixed", minHeight: "", left: ar.left + "px", width: ar.width + "px", top: ar.top + "px", height: ar.height + "px", right: "auto", bottom: "auto", maxHeight: "none" });
    } else {
      const sr = V.stage.getBoundingClientRect(), w = Math.min(360, sr.width * 0.32), br = btn.getBoundingClientRect();
      const hud = Math.max(br.bottom, ...$$(".hud-btns, .hb.aid").map((e) => e.getBoundingClientRect().bottom));
      Object.assign(panel.style, { position: "fixed", width: w + "px", left: (br.right - w) + "px", right: "auto", top: (hud + 6) + "px", height: "auto", minHeight: "34px", bottom: "auto", maxHeight: (sr.bottom - hud - 12) + "px" });
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
    if (V.held.block && V.R.blocker && !RT.can(V.R, "block") && V.R.winded && !V.windTold) { V.windTold = true; toast(K.tr("Winded")); }
    if (!V.held.block) V.windTold = false;
    return Object.assign({ move, block: !!V.held.block }, q);
  }
  function loop(now) {
    if (!V) return;
    const R = V.R;
    if (C.state() && C.state() !== R.B && !R.over) return stop(); // another fight has begun (never in play; a guard)
    const dt = Math.min(0.1, V.last ? (now - V.last) / 1000 : 0); V.last = now;
    if (!V.paused && !V.briefing && !R.over) {
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
  function retry() { V.R = RT.retry(V.R); V.actors.forEach((a) => { a.el.remove(); if (a.tag) a.tag.remove(); if (a.weaponEl) a.weaponEl.remove(); }); $$(".scorch, .ax", V.el).forEach((e) => e.remove()); V.ax = null; V.actors.clear(); if (U.rigs) U.rigs.clear(); V.logAt = V.R.B.log.length; toast(K.tr("One more time.")); }
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
    if (Math.floor(R.t / 10) !== V.tagTick && V.actors.size) { V.tagTick = Math.floor(R.t / 10); nameTagsAll(2); } // at the start and every 10 s, for 2 s
    const pleading = C.spareable(), inReach = RT.spareable(R); // a kneeling foe asks for mercy (C.spare)
    for (const u of B.units) {
      if (!u.rt) continue;
      const a = actorFor(u);
      if (Math.abs(a.d - u.rt.lane) > 0.01) size(a); // smaller up the ground
      a.x = G.fx0 + u.rt.x * G.FW; a.gy = G.gl + u.rt.lane * G.dstep;
      a.el.style.left = a.x.toFixed(1) + "px"; a.el.style.bottom = a.gy.toFixed(1) + "px";
      if (u.hp > 0) a.el.style.zIndex = String(u.side === "player" ? Math.round(30 - u.rt.lane * 8) : Math.round(10 - u.rt.lane * 6 + 10));
      a.el.classList.toggle("face-l", u.rt.face < 0);
      if (a.tag && a.tag.classList.contains("on")) placeTag(a);
      // A foe glows only the first time it winds up; after that only its pose and its mark.
      if (u.rt.atk && u.side === "enemy" && !a.warned) a.warned = u.rt.atk;
      a.el.classList.toggle("windup", !!u.rt.atk && u.side === "enemy" && a.warned === u.rt.atk);
      if (u.rt.atk !== a.atk) {
        if (u.rt.atk) { pose(a, u.rt.atk.ranged ? "draw" : u.rt.atk.arc && U.MACE_ARCS ? U.MACE_ARCS[u.rt.atk.arc].up : "windup", u.rt.atk.arc ? 500 : 700, 0.5); const t = V.actors.get(u.rt.atk.on); if (t) nameTag(t, 1.5); }
        else if (a.atk && !a.atk.ranged && u.hp > 0) { if (a.atk.area || a.atk.id === "salve") { pose(a, "strike", 1600, 0.55); home(a, 380); } else { a.swingOn = a.atk.on; a.swingArc = a.atk.arc || null; } }
        a.atk = u.rt.atk;
      }
      a.el.classList.toggle("unseen", u.side === "player" && (R.unseen > 0 || R.roll > 0));
      // Your shield, up while you hold Block.
      if (u.side === "player" && R.blocker && u.hp > 0 && !!R.block !== !!a.shieldUp) {
        a.shieldUp = !!R.block; a.el.classList.toggle("shield-up", a.shieldUp);
        if (a.shieldUp) { if (a.rig) { a.rig.t.dx = 0; a.rig.t.dy = 0; } pose(a, "shieldUp", 1500, 0.6); } else home(a, 0);
      }
      // Your soldiers on Defend raise their shields while a blow is marked on them (PRD §18.15).
      if (u.side === "ally" && u.plural && !u.person && !u.called && u.hp > 0) {
        const up = R.orders.soldiers === "defend" && B.units.some((e) => e.side === "enemy" && e.hp > 0 && e.rt && e.rt.atk && e.rt.atk.on === u.uid);
        if (up !== !!a.shieldUp) { a.shieldUp = up; if (up) pose(a, "guard", 900, 0.55); else home(a, 250); a.el.classList.toggle("shield-up", up); }
      }
      a.el.classList.toggle("beaten", !!u.rt.beaten);
      if (u.side === "enemy") U.pleaTag(a.el, u.spared ? "spared" : u.hp > 0 && pleading.includes(u) ? (inReach.includes(u) ? "ask" : "far") : "", () => { V.queue.spare = u.uid; });
      const m = a.el.querySelector(".mini b"); if (m) m.style.width = Math.max(0, u.hp / u.maxHp * 100) + "%";
    }
    V.actors.forEach((a, uid) => { if (!B.units.includes(a.u)) { if (a.tag) a.tag.remove(); a.el.style.transition = "opacity .6s"; a.el.style.opacity = "0"; setTimeout(() => a.el.remove(), 600); V.actors.delete(uid); } });
    for (const f of R.fx) fx(f);
    R.fx.length = 0;
    // A blow that struck no one (dodged, a whiff) still swings at whom it was meant for.
    V.actors.forEach((a) => { if (a.swingOn !== undefined && a.swingOn !== null) { const t = V.actors.get(a.swingOn); a.swingOn = null; swing(a, t, guardOf(t), a.swingArc); a.swingArc = null; } });
    if (V.ax) axTick();
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
    $(".acts .roll").classList.toggle("off", R.blocker ? !R.block && !RT.can(R, "block") : R.breath < RT.P.rollMin);
    if (R.blocker) $(".acts .roll").classList.toggle("held", !!R.block);
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
      case "blow": if (f.arc && U.MACE_ARCS) { // a mace: the long wind-up, then the swing so the weapon arrives as the blow lands
          pose(me, U.MACE_ARCS[f.arc].up, 1300, 0.55);
          setTimeout(() => { if (V && me && !V.R.block) swing(me, inFront(p), null, f.arc); }, Math.max(0, f.land * 1000 - IMPACT));
          if (K.Sound) K.Sound.play("tap"); break; }
        if (f.n === 2) { pose(me, "windup", 1700, 0.55); setTimeout(() => { if (V && me) swing(me, inFront(p), null); }, 120); } else swing(me, inFront(p), null); if (K.Sound) K.Sound.play("tap"); break;
      case "roll": pose(me, "duck", 1400, 0.6); home(me, 400); break;
      case "kneel": pose(me, "kneel", 600, 0.6); home(me, 1100); break;
      case "skill": pose(me, R.skill === "aimed" ? "loose" : R.skill === "salve" ? "kneel" : R.skill === "song" || R.skill === "command" ? "cheer" : "strike", 900, 0.55); home(me, 500);
        if (R.skill === "quake") shake(true); toast(K.tr(SKILL_NAME[R.skill])); break;
      case "hit": landHit(f); break;
      case "spared": { const a = A(f.uid); if (a) { pose(a, "kneel", 600, 0.6); a.el.classList.add("beaten", "spared"); } toast(K.tr("Spared. The fight goes on.")); break; }
      case "brace": { const a = A(f.uid); if (a && a.u.hp > 0) { pose(a, "guard", 900, 0.55); U.guardFlash(a.svg, 1300); if (!a.shieldUp) home(a, 1200); } break; } // braces for your next blow
      case "heal": { const a = A(f.uid); if (a) pop(a, "+", "heal"); break; }
      case "spark": { // a blow taken on a shield: it is raised to meet it, and the sparks fly where the blow lands on it
        const a = A(f.uid); if (!a) break;
        a.sparkAt = performance.now();
        if (a.u.side === "player" && R.block) break; // already behind the raised shield
        if (a.u.side !== "player" || !f.glance) { pose(a, "guard", 1400, 0.55); if (!a.shieldUp) home(a, 500); }
        break; }
      case "miss": { const a = A(f.uid); if (a) pop(a, K.tr("Missed"), "miss"); break; }
      case "perfect": toast(K.tr("Perfect roll")); break;
      case "perfectblock": { toast(K.tr("Perfect block")); const a = A(f.uid); if (a && a.u.hp > 0) { setTimeout(() => { if (V && a.u.hp > 0) { pose(a, "strain", 700, 0.45); if (a.rig) a.rig.kick({ rot: 160 * (a.u.rt ? -a.u.rt.face : 1), tx: 20 }); home(a, 900); } }, 120); } break; } // the one who struck staggers back off the shield
      case "winded": if (blocker()) toast(K.tr("Winded")); break;
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
      case "astra": axStart(f); break;
      case "thrown": { // the divine weapon's struck foe, thrown away from you as the moment ends (the engine has moved it)
        const a = A(f.uid); if (!a || U.calm()) break;
        const dx = f.dx * V.G.FW, up = a.fh * 0.45;
        a.el.animate([{ transform: "translate(" + (-dx) + "px,0)" }, { transform: "translate(" + (-dx * 0.4) + "px," + (-up) + "px)", offset: 0.4 }, { transform: "translate(0,0)" }], { duration: 700, easing: "cubic-bezier(.3,.6,.5,1)" });
        if (a.rig) a.rig.kick({ rot: 600 * Math.sign(dx || 1), tx: 40, head: 300 });
        break; }
    }
  }

  // ---------- Before the fight: the rules card and the walkthrough (as ui/warday.js brief() and tour()) ----------
  const RT_ICONS = { block: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z", move: "M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4", strike: "M4 20l5-5M7 13l4 4M9 15L20 4v3L11 16", roll: "M12 4a8 8 0 108 8M20 4v5h-5", skill: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z",
    orders: "M6 21V4M6 4h11l-2 4 2 4H6", aid: "M5 19c0-8 6-13 14-14-1 8-6 14-14 14zM5 19l7-7", spare: "M7 11V5.5a1.5 1.5 0 013 0V11", flee: "M10 6l-6 6 6 6M4 12h11", pause: "M8 5v14M16 5v14" };
  const keysOnly = () => V.el.classList.contains("wide") && !V.el.classList.contains("touch");
  function brief() {
    const R = V.R, B = R.B, S = K.S, mode = U.fightBriefMode(B), full = !(S.briefed || []).includes(mode), goal = U.fightBriefGoal(B);
    if (full) S.briefed = (S.briefed || []).concat(mode);
    const MODE = { duel: "A duel", melee: "Against several", hold: "A hold", rounds: "Last the rounds" };
    if (!full) {
      const line = U.el('<p class="fb-line wd-fbline" aria-live="polite"><b>' + (T(MODE[mode] || "Against several")) + "</b>" + (goal ? " · " + U.esc(goal) : "") + "</p>");
      V.stage.appendChild(line); setTimeout(() => line.remove(), 4200);
      if (!S.fightTour) { S.fightTour = 1; tour(); }
      return;
    }
    const k = keysOnly(), list = [];
    const add = (ic, name, words) => list.push([ic, name, words]);
    add("move", T("Move"), T(k ? "A / D to walk; W / S to change row" : "Hold ◀ ▶ to walk; swipe up or down to change row"));
    if (mace()) add("strike", T("Strike"), T(k ? "J, or click a foe: an overhead smash, then a side sweep" : "An overhead smash, then a side sweep"));
    else add("strike", T("Strike"), T(k ? "J, or click a foe; three in a row for a combo" : "Three in a row for a combo"));
    if (R.blocker) add("block", T("Block"), T(k ? "Hold K or Space to raise your shield; it costs breath" : "Hold to raise your shield; it costs breath"));
    else add("roll", T("Roll"), T(k ? "K or Space, through a marked blow; it costs breath" : "Through a marked blow; it costs breath"));
    if (R.skill) add("skill", T(SKILL_NAME[R.skill]), T("Your path's skill; its ring fills as it gets ready"));
    if (B.units.some((u) => u.side === "ally" && u.hp > 0 && !u.still)) add("orders", T("Orders"), T("How those beside you fight"));
    add("aid", T("Aid"), T("Herbs, a divine weapon, a call for help"));
    if (B.enc.spare) add("spare", T("Spare"), T("Let a beaten foe live"));
    if (C.canFlee()) add("flee", T("Withdraw"), T(C.fleeBreaks().length ? "Leave the fight; it breaks a vow" : "Leave the fight, at a cost"));
    add("pause", T("Pause"), T(k ? "P or Esc: the fight waits" : "The fight waits"));
    const card = U.el('<div class="fbrief-wrap" role="dialog" aria-modal="true" aria-labelledby="fb-title"><div class="fbrief">' +
      '<p class="fb-tag">' + (T(B.enc.lethal ? "Battle · you can die here" : "A fight")) + "</p>" +
      '<h2 id="fb-title">' + U.t(K.val(B.enc.title)) + '</h2><p class="fb-mode">' + (T(MODE[mode] || "Against several")) + "</p>" + (goal ? '<p class="fb-goal">' + U.esc(goal) + "</p>" : "") +
      '<p class="fb-lbl">' + (T("What you can do")) + '</p><ul class="fb-acts">' + list.map(([ic, n, w]) => '<li><span class="fb-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + RT_ICONS[ic] + '"/></svg></span><b>' + n + "</b><small>" + w + "</small></li>").join("") + "</ul>" +
      '<div class="btnrow"><button type="button" class="cta fb-go">' + (T("Fight")) + "</button></div></div></div>");
    V.briefing = true;
    const go = V.briefGo = () => { if (!V || !card.isConnected) return; card.remove(); V.briefGo = null; if (!S.fightTour) { S.fightTour = 1; tour(); } else { V.briefing = false; V.last = 0; } };
    card.querySelector(".fb-go").addEventListener("click", go);
    V.el.appendChild(card);
    setTimeout(() => { const b = card.querySelector(".fb-go"); if (b && b.isConnected) b.focus({ preventScroll: true }); }, 300);
  }
  // The walkthrough (the layout page's tour): each control lit in turn, a caption at the top of the stage (over the
  // controls for the buttons at the top right), Skip in the caption; a tap or a key goes on. The fight waits.
  function tour() {
    if (!V) return;
    const R = V.R, k = keysOnly(), has = (sel) => !!V.el.querySelector(sel);
    const steps = [
      [k ? ".kstrip .ks-keys" : ".pad", k ? "Press A or D, or click the ground, to walk. You can pass your own people, never a foe." : "Hold ◀ ▶ to walk. You can pass your own people, never a foe."],
      mace() ? [k ? ".kstrip .ks-keys" : ".acts .strike", k ? "Press J, or click a foe, to strike: an overhead smash, then a side sweep that knocks him back." : "Strike: an overhead smash, then a side sweep that knocks a foe back."]
        : [k ? ".kstrip .ks-keys" : ".acts .strike", k ? "Press J, or click a foe, to strike. The third in a row knocks him back." : "Strike three times for a combo. The third blow knocks a foe back."],
      R.blocker ? [k ? ".kstrip .ks-keys" : ".acts .roll", k ? "A blow is marked on the ground. Hold K or Space (or the right mouse button) to raise your shield before the mark fills. Raised just in time, it staggers him. Holding it costs breath." : "A blow is marked on the ground. Hold Block to raise your shield before the mark fills to its rim. Raised just in time, it staggers him. Holding it costs breath."]
        : [k ? ".kstrip .ks-keys" : ".acts .roll", k ? "A blow is marked on the ground. Press K or Space (or right-click) to roll through it before the mark fills. Each roll costs breath." : "A blow is marked on the ground. Roll through it before the mark fills to its rim. Each roll costs breath."],
      R.skill ? [k ? ".kstrip .ks-skill" : ".acts .skill", k ? "L is your path's skill. The ring in the strip fills as it gets ready." : "Your path's skill. The ring fills as it gets ready again."] : null,
      [null, k ? "W or S (or ↑ ↓) steps to another row." : "Swipe up or down on the stage to step to another row."],
      has(".hb.orders") ? [".hb.orders", "Orders tell those beside you how to fight."] : null,
      [".hb.aid", "Herbs, your divine weapon and a call for help are in Aid."],
      [".hb.pause", k ? "Pause stops the fight. So do P and Esc." : "Pause stops the fight."]
    ].filter(Boolean);
    V.briefing = true; V.el.classList.add("touring");
    let i = -1;
    const clear = () => { $$(".lit", V.el).forEach((e) => e.classList.remove("lit")); $$(".tour-cap", V.el).forEach((e) => e.remove()); };
    const end = V.tourEnd = (skipped) => {
      if (!V) return; clear(); V.el.classList.remove("touring"); V.el.removeEventListener("pointerdown", block, true); V.el.removeEventListener("click", onClick, true);
      V.tourNext = V.tourEnd = null; V.briefing = false; V.last = 0;
      if (skipped === true) toast(K.tr("Walkthrough skipped. Every control is yours."));
    };
    const show = () => {
      clear();
      const [sel, text] = steps[i];
      if (sel) $$(sel, V.el).forEach((e) => e.classList.add("lit"));
      const cap = document.createElement("div"); cap.className = "tour-cap top"; cap.setAttribute("role", "status");
      cap.innerHTML = '<div class="tc-text"><span class="tc-step">' + U.esc(K.tr("{n} of {m}", { n: i + 1, m: steps.length }) + " · " + K.tr("Tap to go on")) + '</span><span class="tc-say">' + U.esc(K.tr(text)) + '</span></div><button type="button" class="tc-skip">' + U.esc(K.tr("Skip")) + "</button>";
      if (sel && sel.startsWith(".hb")) { cap.classList.remove("top"); Object.assign(cap.style, { position: "fixed", bottom: "calc(var(--pad) + 4px)", left: "var(--pad)", right: "var(--pad)" }); V.el.appendChild(cap); }
      else V.stage.appendChild(cap);
    };
    const next = V.tourNext = () => { i++; if (i >= steps.length) return end(); show(); };
    const block = (e) => { e.stopPropagation(); if (!e.target.closest(".tc-skip")) e.preventDefault(); };
    const onClick = (e) => { e.stopPropagation(); e.preventDefault(); if (e.target.closest(".tc-skip")) end(true); else next(); };
    V.el.addEventListener("pointerdown", block, true); V.el.addEventListener("click", onClick, true);
    next();
  }

  // ---------- The divine weapon (PRD §18.15; the layout page's astra() and impact()) ----------
  // The fight stands still (R.frozen) while the weapon's name holds over the field, about 2.4 s; as it ends
  // its element sweeps the field, a white-hot flash, a heavy shake and a ring; every foe it struck is thrown
  // (the engine's "thrown"), its damage in big numbers, weapons flying as they fall; scorches stay on the
  // ground with embers rising. Calm motion: one soft flash, no shake, nothing thrown.
  const AX_SUB = { agneya: "The fire weapon", varuna: "The water weapon", vayavya: "The wind weapon", sammohana: "The weapon of sleep" };
  function axStart(f) {
    const o = f.out || {}, me = V.actors.get(C.player().uid), to = o.uid && V.actors.get(o.uid), ab = K.ABILITIES[f.id] || {};
    const kind = o.kind || { agneya: "agneya", varuna: "varuna", vayavya: "vayavya", sammohana: "sammohana" }[f.id] || "generic";
    if (U.astraFx) U.astraFx({ kind, clash: !!o.clash, from: me && me.svg, to: to && to.svg, into: V.el, noFlash: true }); // the weapon's weather, over the stage
    const old = $(".ax", V.stage); if (old) old.remove();
    const title = f.id === "astra" ? K.tr("Divine weapon") : K.tr(ab.name || "Divine weapon"), sub = f.id === "astra" ? "" : K.tr(AX_SUB[kind] || "Divine weapon");
    const line = !o.clash && ab.target === "enemies" ? K.tr("Every foe before you takes the blow.") : "";
    const ax = document.createElement("div"); ax.className = "ax k-" + kind;
    ax.innerHTML = '<i class="ax-fire"></i><i class="ax-edges"></i><i class="ax-blink"></i><div class="ax-title" aria-live="assertive"><b>' + U.esc(title) + "</b>" + (sub ? "<small>" + U.esc(sub) + "</small>" : "") + (line ? "<p>" + U.esc(line) + "</p>" : "") + "</div>";
    V.stage.appendChild(ax); void ax.offsetWidth; ax.classList.add("play");
    if (me) pose(me, "draw", 500, 0.7);
    if (U.rigFreeze && !U.calm()) U.rigFreeze(400);
    V.ax = { el: ax, kind, struck: f.struck || [], dealt: f.dealt || {}, clash: !!o.clash };
  }
  function axTick() {
    const R = V.R, X = V.ax, G = V.G, me = V.actors.get(C.player().uid);
    const struck = X.struck.map((uid) => V.actors.get(uid)).filter(Boolean);
    const dir = struck.length ? Math.sign(struck.reduce((n, a) => n + a.x, 0) / struck.length - (me ? me.x : 0)) || 1 : (C.player().rt.face || 1);
    if (!X.waved && R.frozen < 0.45) { // the element sweeps the field from your hand
      X.waved = true; X.el.classList.add("struck");
      if (me) pose(me, "loose", 1200, 0.5);
      if (!U.calm() && !X.clash) {
        X.el.insertAdjacentHTML("beforeend", '<i class="ax-wave"></i>');
        const wave = X.el.querySelector(".ax-wave"), mx = me ? me.x : G.W / 2, ww = G.W * 0.75;
        wave.style.bottom = (G.gl - G.ph * 0.2) + "px"; wave.style.height = (G.ph * 2.1) + "px";
        const from = dir > 0 ? mx - G.W * 0.35 : mx + G.W * 0.35 - ww, to = dir > 0 ? G.W * 1.05 : -ww - G.W * 0.05;
        wave.animate([{ transform: "translateX(" + from + "px) scaleX(0.4)", opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: "translateX(" + to + "px) scaleX(1)", opacity: 0.85 }], { duration: 620, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards" });
      }
    }
    if (X.hit || R.frozen > 0) return;
    X.hit = true;
    const calm = U.calm();
    X.el.insertAdjacentHTML("beforeend", '<i class="ax-white"></i><i class="ax-ring"></i>');
    if (!calm) X.el.querySelector(".ax-white").animate([{ opacity: 0 }, { opacity: 0.95, offset: 0.15 }, { opacity: 0 }], { duration: 420, easing: "ease-out" }); // calm: astraFx's one soft flash is all
    if (!calm) {
      const cx = struck.length ? struck.reduce((n, a) => n + a.x, 0) / struck.length : G.W * 0.7, cy = G.H - G.gl - G.ph * 0.3, ring = X.el.querySelector(".ax-ring");
      Object.assign(ring.style, { left: cx + "px", top: cy + "px", width: G.ph * 0.6 + "px", height: G.ph * 0.6 + "px" });
      ring.animate([{ transform: "translate(-50%,-50%) scale(0.2)", opacity: 0.95 }, { transform: "translate(-50%,-50%) scale(4.2)", opacity: 0 }], { duration: 760, easing: "ease-out" });
      shake(true); if (U.rigFreeze) U.rigFreeze(90);
      if (K.Sound) K.Sound.play("hit");
    }
    for (const a of struck) {
      const d = X.dealt[a.u.uid];
      if (d) {
        const big = document.createElement("span"); big.className = "pop big"; big.textContent = String(d);
        big.style.left = a.x + "px"; big.style.bottom = (a.gy + a.fh * 1.1) + "px"; V.world.appendChild(big);
        if (calm) setTimeout(() => big.remove(), 1200);
        else big.animate([{ transform: "translate(-50%,10px) scale(.5)", opacity: 0 }, { transform: "translate(-50%,-6px) scale(1.25)", opacity: 1, offset: 0.2 }, { transform: "translate(-50%,-50px) scale(1)", opacity: 0 }], { duration: 1300, easing: "ease-out" }).onfinish = () => big.remove();
      }
      if (X.clash) continue;
      // A scorch on the ground that stays, embers rising from it.
      const sc = document.createElement("i"); sc.className = "scorch k-" + X.kind; Object.assign(sc.style, { left: a.x + "px", bottom: (a.gy - a.fh * 0.05) + "px", width: (a.fh * 0.8) + "px", height: (a.fh * 0.14) + "px" }); V.world.appendChild(sc);
      if (U.flingBits) U.flingBits(V.world, "flake", { x: a.x, y: G.H - a.gy - a.fh * 0.5 }, 10, a.bw, "#8a3a2a");
    }
    if (!X.clash && struck.length) {
      const mx = me ? me.x : 0, strip = document.createElement("i"); strip.className = "scorch strip k-" + X.kind;
      Object.assign(strip.style, dir > 0 ? { left: (mx + G.W * 0.05) + "px", right: "0" } : { left: "0", width: Math.max(0, mx - G.W * 0.05) + "px" }, { bottom: (G.gl - G.ph * 0.05) + "px", height: (G.ph * 0.12) + "px" });
      V.world.appendChild(strip);
      const sc = $(".rt-scorch", V.stage); sc.className = "rt-scorch on k-" + X.kind; setTimeout(() => { if (V) sc.className = "rt-scorch"; }, 6000);
      if (!calm && X.kind !== "varuna" && X.kind !== "sammohana") {
        let n = 0; const host = V.world, emb = setInterval(() => { if (!V || !host.isConnected || ++n > 14) return clearInterval(emb); for (const a of struck) U.flingBits(host, "spark", { x: a.x + (Math.random() - 0.5) * a.bw, y: V.G.H - a.gy }, 2, a.bw, "#ff9a3c", true); }, 120);
      }
    }
    const el = X.el; setTimeout(() => el.remove(), 900); V.ax = null;
  }
})(window.K = window.K || {});
