/* Real-time fights (PRD §18.15), the screen: a minimal dev screen behind the developer switch
   (K.prefs().rtDev or ?rt=1; engine/realtime.js RT.dev). With the switch off every fight is the
   turn-based screen of ui/battle.js, exactly as before. Laid out after the layout test page
   (owner, 3 November): the painting fills the stage, status bars top left, the fight's name and the
   running count top right with Orders and Pause, and under them one drop-down for Herbs, Divine weapon
   and Call for help (opening it pauses the fight); at the bottom ◀ ▶ on the left and Skill, Roll,
   Strike (the biggest) on the right. Withdraw sits top right on a laptop and in the Pause sheet on a
   phone. Keys: A/D or arrows move, J strike, K or Space roll, L skill, H herbs, C call, U divine
   weapon, O orders, P or Esc pause, E spare.
   Under the tests (K.headless, jsdom) a real-time fight is played to its end by the bot at once. */
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
  const PAUSE = '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><rect x="3" y="2" width="3.6" height="12" rx="1" fill="currentColor"/><rect x="9.4" y="2" width="3.6" height="12" rx="1" fill="currentColor"/></svg>';
  const SKILL_NAME = { aimed: "Aimed shot", quake: "Ground-shaker", ridedown: "Ride them down", command: "Command", salve: "Herbal salve", vanish: "Vanish into the dust", song: "Battle song" };
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
  U.rtScreen = () => V; // for the screenshot checks

  U.startRealtime = function (encId, onEnd) {
    if (V) stop();
    if (K.Sound) { K.Sound.play(K.ENCOUNTERS[encId].lethal && K.S.act === 6 ? "callToArms" : "drumCall"); if (K.Sound.mood) K.Sound.mood("battle"); }
    const B = C.start(encId, onEnd);
    const R = RT.begin(B, { assist: U.assist && U.assist() });
    V = { encId, onEnd, R, actors: new Map(), held: { l: false, r: false }, queue: {}, acc: 0, last: 0, raf: 0, paused: false, sheet: null, toastT: 0, logAt: B.log.length };
    build();
    V.raf = requestAnimationFrame(loop);
  };

  // ---------- Building the screen ----------
  function build() {
    const R = V.R, B = R.B, enc = B.enc;
    const old = document.getElementById("rt"); if (old) old.remove();
    const kb = (k) => "<kbd>" + k + "</kbd>";
    const el = U.el('<div id="rt" class="rt-screen" role="application" aria-label="' + T("Real-time fight") + '">' +
      '<div class="rt-stage" id="rt-stage"><div class="rt-world" id="rt-world"></div><div class="rt-edge l"></div><div class="rt-edge r"></div><div class="rt-slow"></div><div class="rt-scorch"></div>' +
        '<div class="rt-hud"><div class="rt-bars">' +
          '<div class="rt-bar hp"><span>' + T("You") + '</span><i><b id="rt-hp"></b></i></div>' +
          '<div class="rt-bar br"><span>' + T("Breath") + '</span><i><b id="rt-br"></b></i></div>' +
          '<div class="rt-bar fr" id="rt-frb" hidden><span id="rt-frn"></span><i><b id="rt-fr"></b></i></div></div>' +
        '<div class="rt-hr"><div class="rt-name"><b>' + U.t(K.val(enc.title) || "") + '</b><small id="rt-count"></small></div>' +
          '<div class="rt-btns"><button type="button" class="rt-hb orders" data-act="orders" aria-haspopup="dialog">' + T("Orders") + " ▾" + kb("O") + "</button>" +
          '<button type="button" class="rt-hb withdraw" data-act="withdraw">' + T("Withdraw") + "</button>" +
          '<button type="button" class="rt-hb pause" data-act="pause" aria-label="' + T("Pause") + '" title="' + T("Pause") + '">' + PAUSE + "</button></div>" +
          '<button type="button" class="rt-hb more" data-act="more" aria-haspopup="menu">' + T("Herbs, weapon, help") + " ▾</button></div></div>" +
        '<div class="rt-toast off" role="status" id="rt-toast"></div></div>' +
      '<div class="rt-ctl"><div class="rt-pad"><button type="button" class="mv" data-hold="l" aria-label="' + T("Move left") + '">◀' + kb("A") + '</button><button type="button" class="mv" data-hold="r" aria-label="' + T("Move right") + '">▶' + kb("D") + "</button></div>" +
        '<div class="rt-acts">' +
          '<button type="button" class="skill" data-act="skill"' + (R.skill ? "" : " disabled") + '><svg class="ring" viewBox="0 0 40 40" aria-hidden="true"><circle class="bg" cx="20" cy="20" r="18"/><circle class="fg" cx="20" cy="20" r="18" stroke-dasharray="113.1" stroke-dashoffset="0"/></svg><span>' + T(R.skill ? SKILL_NAME[R.skill] : "No skill") + "</span>" + kb("L") + "</button>" +
          '<button type="button" class="roll" data-act="roll">' + T("Roll") + kb("K") + "</button>" +
          '<button type="button" class="strike" data-act="strike">' + T("Strike") + "<small>" + T("×3 combo") + "</small>" + kb("J") + "</button>" +
        "</div></div>" +
      '<div class="rt-sheet" id="rt-sheet" hidden></div></div>');
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
    window.addEventListener("keydown", onKey, true); window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("resize", onResize); document.addEventListener("visibilitychange", onHidden);
    layout();
  }
  function layout() {
    if (!V) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const wide = vw >= 820 && vw / vh >= 1.15;
    V.el.classList.toggle("wide", wide); V.el.classList.toggle("upright", !wide);
    V.el.style.setProperty("--bh", (wide ? 44 : 44) + "px"); // compact (owner, 3 November): 44 px buttons, Strike 56
    const W = V.stage.clientWidth, H = V.stage.clientHeight;
    V.stage.style.backgroundImage = "url(" + (H > W * 1.25 && V.art[1] ? V.art[1] : V.art[0]) + ")";
    // The field is the same in game units everywhere (about nine bodies across); a phone draws the
    // figures smaller instead of showing less of it, with clear ground between them.
    const fh = Math.min(H * 0.3, W * RT.BODY * (wide ? 1.6 : 2.2));
    V.G = { W, H, fh, bw: W * RT.BODY, gl: H * (wide ? 0.07 : 0.12), dstep: Math.min(H * 0.035, fh * 0.12) };
    V.actors.forEach((a) => size(a));
  }
  function onResize() { if (!V) return; const o = V.G && V.G.W > V.G.H; layout(); if (V.G && (V.G.W > V.G.H) !== o) pause(true); } // turning the phone pauses
  function onHidden() { if (V && document.hidden) pause(true); }

  // ---------- Figures ----------
  function actorFor(u) {
    let a = V.actors.get(u.uid);
    if (a) return a;
    const foe = u.side === "enemy", spec = specFor(u);
    const el = U.el('<div class="rt-actor ' + (u.side === "player" ? "me" : foe ? "foe" : "ally") + (u.plural ? " band" : "") + '" data-uid="' + u.uid + '"><span class="shadow"></span><div class="fl">' +
      U.puppet(spec, { pose: U.motion() ? "live" : u.side === "player" ? "brace" : "stand", h: 200 }) + (u.plural ? U.puppet(spec, { pose: "stand", h: 200, cls: "extra e1" }) + U.puppet(spec, { pose: "stand", h: 200, cls: "extra e2" }) : "") +
      "</div>" + (u.side === "player" ? "" : '<span class="mini"><b></b></span>') + "</div>");
    V.world.appendChild(el);
    const svg = el.querySelector("svg.pp");
    const vb = (svg.getAttribute("viewBox") || "0 0 120 200").split(/[\s,]+/).map(Number);
    const bow = !!svg.querySelector('.it:not(.it-w) path[d="M50 86 L50 166"]');
    a = { u, el, svg, fl: el.querySelector(".fl"), vb, base: bow ? "bowready" : svg.dataset.stance && foe ? svg.dataset.stance : "ready" };
    a.rig = U.motion() && U.rig ? U.rig(svg, el, a.base) : null;
    if (foe) el.addEventListener("click", () => { if (RT.spareable(V.R).some((e) => e.uid === u.uid)) { V.queue.spare = u.uid; } });
    V.actors.set(u.uid, a);
    size(a);
    return a;
  }
  function size(a) {
    const G = V.G; if (!G) return;
    const k = 1 - 0.08 * (a.u.rt ? a.u.rt.lane : 0);
    a.fh = G.fh * k * (a.u.side === "player" ? 1.04 : 1);
    const svgH = a.fh * 210 / 164, svgW = svgH * a.vb[2] / a.vb[3];
    a.el.querySelectorAll("svg.pp").forEach((s) => { s.style.height = svgH.toFixed(1) + "px"; s.style.width = svgW.toFixed(1) + "px"; });
    a.el.style.setProperty("--fh", a.fh.toFixed(1) + "px");
  }
  function pose(a, p, k, z) { if (!a) return; if (a.rig) a.rig.set(p, k || 900, z == null ? 0.5 : z); else a.svg.setAttribute("class", a.svg.getAttribute("class").replace(/\bpose-\S+/, "pose-" + ({ windup: "strike", ready: "brace", bowready: "brace", draw: "aim", duck: "duck", kneel: "kneel", loose: "loose" }[p] || p))); }
  function home(a, ms) { setTimeout(() => { if (a.rig && a.u.hp > 0 && V) a.rig.home(); else if (!a.rig && a.u.hp > 0) pose(a, a.u.side === "player" ? "brace" : "stand"); }, ms || 0); }
  function pop(a, text, cls) {
    const el = U.el('<span class="rt-pop ' + (cls || "") + '">' + U.esc(text) + "</span>");
    el.style.left = a.x + "px"; el.style.bottom = (a.gy + a.fh * 1.06) + "px";
    V.world.appendChild(el); setTimeout(() => el.remove(), 900);
  }
  function toast(s) { const el = V.el.querySelector("#rt-toast"); el.textContent = s; el.classList.remove("off"); clearTimeout(V.toastT); V.toastT = setTimeout(() => el.classList.add("off"), 1600); }
  function shake(big) { if (U.calm()) return; V.stage.classList.remove("shake", "quake"); void V.stage.offsetWidth; V.stage.classList.add(big ? "quake" : "shake"); }

  // ---------- Input ----------
  const KEY = { KeyJ: "strike", KeyK: "roll", Space: "roll", KeyL: "skill", KeyH: "herbs", KeyC: "call", KeyU: "astra", KeyO: "orders", KeyP: "pause", Escape: "pause", KeyE: "spare" };
  function onKey(e) {
    if (!V) return;
    if (e.code === "KeyA" || e.code === "ArrowLeft") { V.held.l = true; e.preventDefault(); e.stopPropagation(); return; }
    if (e.code === "KeyD" || e.code === "ArrowRight") { V.held.r = true; e.preventDefault(); e.stopPropagation(); return; }
    const a = KEY[e.code];
    if (!a) return;
    e.preventDefault(); e.stopPropagation();
    if (e.repeat && a !== "strike") return;
    if (V.sheet && a === "pause" || V.sheet && a === "orders") return closeSheet();
    act(a);
  }
  function onKeyUp(e) { if (!V) return; if (e.code === "KeyA" || e.code === "ArrowLeft") V.held.l = false; if (e.code === "KeyD" || e.code === "ArrowRight") V.held.r = false; }
  function act(a) {
    if (!V) return;
    const R = V.R;
    switch (a) {
      case "orders": return V.sheet === "orders" ? closeSheet() : sheet("orders");
      case "pause": return V.sheet === "pause" ? closeSheet() : sheet("pause");
      case "more": return V.sheet === "more" ? closeSheet() : sheet("more");
      case "withdraw": return withdraw();
    }
    if (V.sheet && V.sheet !== "more") return;
    if (V.sheet === "more") closeSheet();
    if (a === "astra") { const ready = RT.astras().filter((x) => !x.why); if (!ready.length) return toast(K.tr(RT.astras()[0] ? RT.astras()[0].why || "Not ready yet" : "You were never given a divine weapon")); V.queue.astra = ready[0].id; return; }
    if (a === "spare") { const t = RT.spareable(R)[0]; if (t) V.queue.spare = t.uid; return; }
    if (a === "roll" && !RT.can(R, "roll") && R.roll <= 0) toast(K.tr("Winded"));
    if (a === "skill" && R.skill && !RT.can(R, "skill")) toast(K.tr("Not ready yet"));
    if (a === "herbs" && !RT.can(R, "herbs")) toast(K.tr((K.S.items.herbs || 0) > 0 ? "Not now" : "No herbs left"));
    if (a === "call" && !RT.can(R, "call")) toast(K.tr("Used this battle"));
    V.queue[a] = true;
  }
  function withdraw() {
    if (!C.canFlee()) return;
    const breaks = C.fleeBreaks();
    // "Are you sure?" only when it would break a vow.
    if (breaks.length && V.sheet !== "confirm") return sheet("confirm");
    closeSheet(); V.queue.withdraw = true; V.paused = false;
  }
  function pause(on) { if (!V) return; if (on && !V.sheet) sheet("pause"); }
  function sheet(kind) {
    const R = V.R, sh = V.el.querySelector("#rt-sheet"), p = C.player();
    V.sheet = kind; V.paused = true;
    const btn = (attr, v, label, on) => '<button type="button" data-' + attr + '="' + v + '" aria-pressed="' + !!on + '">' + T(label) + "</button>";
    let h = "";
    if (kind === "orders") {
      const friend = R.B.units.find((u) => u.side === "ally" && u.hp > 0 && (u.called || u.person) && !u.still);
      const soldiers = R.B.units.some((u) => u.side === "ally" && u.hp > 0 && u.plural && !u.person && !u.called);
      h += "<h2>" + T("Orders") + "</h2>";
      if (soldiers) h += '<div class="sec"><h3>' + T("Your soldiers") + '</h3><div class="opts three">' + btn("so", "defend", "Defend", R.orders.soldiers === "defend") + btn("so", "allout", "All-out", R.orders.soldiers === "allout") + btn("so", "stay", "Stay out", R.orders.soldiers === "stay") + "</div></div>";
      if (friend) h += '<div class="sec"><h3>' + T("{who}, while beside you", { who: K.text(friend.src || friend.name) }) + '</h3><div class="opts two">' + btn("fr", "balanced", "Balanced", R.orders.friend === "balanced") + btn("fr", "guard", "Guard me", R.orders.friend === "guard") + btn("fr", "allout", "All-out", R.orders.friend === "allout") + btn("fr", "hold", "Hold back", R.orders.friend === "hold") + "</div></div>";
      if (!soldiers && !friend) h += '<p class="note">' + T("No one is fighting beside you to take an order.") + "</p>";
      h += '<p class="note">' + T("The fight waits while this is open.") + '</p><button type="button" class="go" data-close>' + T("Back to the fight") + "</button>";
    } else if (kind === "pause") {
      h += "<h2>" + T("Paused") + '</h2><div class="opts one"><button type="button" class="go" data-close>' + T("Resume") + "</button>" +
        (C.canFlee() ? '<button type="button" class="danger" data-w>' + T("Withdraw from the fight") + "</button>" : "") + "</div>";
    } else if (kind === "confirm") {
      const names = C.fleeBreaks().map((v) => K.tr((K.VOWS && K.VOWS[v] && K.VOWS[v].name) || v)).join(", ");
      h += "<h2>" + T("Are you sure?") + '</h2><p class="note">' + T("Withdrawing breaks your vow: {v}.", { v: names }) + '</p><div class="opts one"><button type="button" class="danger" data-w>' + T("Withdraw") + '</button><button type="button" class="go" data-close>' + T("Back to the fight") + "</button></div>";
    } else if (kind === "more") {
      const ast = RT.astras(), aReady = ast.find((x) => !x.why);
      h += '<div class="opts one menu">' +
        '<button type="button" data-a="herbs"' + (RT.can(R, "herbs") ? "" : ' class="off"') + ">" + T("Herbs") + " <small>" + T("{n} left", { n: K.S.items.herbs || 0 }) + "</small><kbd>H</kbd></button>" +
        '<button type="button" data-a="astra" class="astra' + (aReady ? "" : " off") + '">' + T(aReady ? aReady.name : "Divine weapon") + (aReady ? "" : " <small>" + U.esc(ast[0] ? ast[0].why || "" : K.tr("You were never given a divine weapon")) + "</small>") + "<kbd>U</kbd></button>" +
        (p.abilities.includes("call") ? '<button type="button" data-a="call"' + (RT.can(R, "call") ? "" : ' class="off"') + ">" + T("Call for help") + " <small>" + T("once a fight") + "</small><kbd>C</kbd></button>" : "") +
        "</div>";
    } else if (kind === "retry") {
      h += "<h2>" + T("You are beaten") + '</h2><p class="note">' + T("One more try: you start a little hurt, and what you used stays used.") + '</p><div class="opts one"><button type="button" class="go" data-retry>' + T("Try again") + '</button><button type="button" data-accept>' + T("Accept the loss") + "</button></div>";
    }
    sh.className = "rt-sheet " + kind; sh.innerHTML = h; sh.hidden = false;
    sh.style.top = "";
    if (kind === "more") { const mb = V.el.querySelector(".rt-hb.more").getBoundingClientRect(), er = V.el.getBoundingClientRect(); sh.style.top = (mb.bottom - er.top + 6) + "px"; } // just under its button
    sh.querySelectorAll("[data-so]").forEach((b) => b.addEventListener("click", () => { V.queue.orders = Object.assign(V.queue.orders || {}, { soldiers: b.dataset.so }); R.orders.soldiers = b.dataset.so; sheet("orders"); }));
    sh.querySelectorAll("[data-fr]").forEach((b) => b.addEventListener("click", () => { V.queue.orders = Object.assign(V.queue.orders || {}, { friend: b.dataset.fr }); R.orders.friend = b.dataset.fr; sheet("orders"); }));
    sh.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeSheet));
    sh.querySelectorAll("[data-w]").forEach((b) => b.addEventListener("click", () => { if (C.fleeBreaks().length && kind !== "confirm") return sheet("confirm"); closeSheet(); V.queue.withdraw = true; }));
    sh.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => { closeSheet(); act(b.dataset.a); }));
    const rb = sh.querySelector("[data-retry]"); if (rb) rb.addEventListener("click", () => { closeSheet(); retry(); });
    const ab = sh.querySelector("[data-accept]"); if (ab) ab.addEventListener("click", () => { closeSheet(); RT.accept(V.R); finishSoon(); });
    const f = sh.querySelector("button"); if (f && !U.calm()) f.focus({ preventScroll: true });
    V.el.querySelectorAll(".rt-hb").forEach((b) => b.classList.toggle("on", b.dataset.act === kind));
  }
  function closeSheet() { if (!V) return; const sh = V.el.querySelector("#rt-sheet"); sh.hidden = true; sh.innerHTML = ""; V.sheet = null; V.paused = false; V.last = 0; V.el.querySelectorAll(".rt-hb").forEach((b) => b.classList.remove("on")); }

  // ---------- The loop: fixed steps against real time ----------
  function input() {
    const q = V.queue; V.queue = {};
    return Object.assign({ move: (V.held.r ? 1 : 0) - (V.held.l ? 1 : 0) }, q);
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
    document.body.classList.remove("in-rt");
    V = null;
  }

  // ---------- Drawing ----------
  function draw() {
    const R = V.R, B = R.B, G = V.G; if (!G) return;
    const p = C.player();
    for (const u of B.units) {
      if (!u.rt) continue;
      const a = actorFor(u);
      a.x = u.rt.x * G.W; a.gy = G.gl + u.rt.lane * G.dstep;
      a.el.style.left = a.x.toFixed(1) + "px"; a.el.style.bottom = a.gy.toFixed(1) + "px";
      a.el.style.zIndex = String(u.side === "player" ? 30 : 20 - u.rt.lane * 4);
      a.el.classList.toggle("face-l", u.rt.face < 0);
      a.el.classList.toggle("windup", !!u.rt.atk && u.side === "enemy");
      if (u.rt.atk !== a.atk) { // a blow begins (wind up or draw the bow), or lands (strike)
        if (u.rt.atk) pose(a, u.rt.atk.ranged ? "draw" : "windup", 700, 0.5);
        else if (a.atk && !a.atk.ranged && u.hp > 0) { pose(a, "strike", 1600, 0.55); home(a, 380); }
        a.atk = u.rt.atk;
      }
      a.el.classList.toggle("unseen", u.side === "player" && (R.unseen > 0 || R.roll > 0));
      a.el.classList.toggle("downed", u.hp > 0 && u.rt.down > 0);
      a.el.classList.toggle("flung", u.rt.flung != null && R.t - u.rt.flung < 0.6);
      a.el.classList.toggle("spareable", u.side === "enemy" && RT.spareable(R).some((e) => e.uid === u.uid));
      const m = a.el.querySelector(".mini b"); if (m) m.style.width = Math.max(0, u.hp / u.maxHp * 100) + "%";
      if (u.plural) { const n = Math.max(0, Math.ceil(u.rt.bodies * u.hp / u.maxHp)); a.el.dataset.bodies = String(n); }
    }
    // Friends who left the field.
    V.actors.forEach((a, uid) => { if (!B.units.includes(a.u)) { a.el.classList.add("gone"); setTimeout(() => a.el.remove(), 600); V.actors.delete(uid); } });
    for (const f of R.fx) fx(f);
    R.fx.length = 0;
    marks();
    // The bars, the count, the buttons.
    const w = (id, v) => { const e = V.el.querySelector("#" + id); if (e) e.style.width = Math.max(0, Math.min(100, v)) + "%"; };
    w("rt-hp", p.hp / p.maxHp * 100); w("rt-br", R.breath / RT.P.breathMax * 100);
    V.el.querySelector(".rt-bar.br").classList.toggle("low", R.breath < RT.P.rollMin);
    const fr = B.units.find((u) => u.side === "ally" && u.hp > 0 && !u.still && (u.called || u.person)) || B.units.find((u) => u.side === "ally" && u.hp > 0 && !u.still);
    V.el.querySelector("#rt-frb").hidden = !fr;
    if (fr) { V.el.querySelector("#rt-frn").textContent = K.text(fr.src || fr.name).split(",")[0]; w("rt-fr", fr.hp / fr.maxHp * 100); }
    const pk = RT.packs(R);
    V.el.querySelector("#rt-count").textContent = K.tr("Foes left: {n}", { n: RT.count(R) }) + (pk.of > 1 ? " · " + K.tr("Pack {a} of {b}", { a: pk.now, b: pk.of }) : "");
    const sk = V.el.querySelector(".rt-acts .skill");
    if (R.skill) { const f = 1 - Math.max(0, R.skillCd) / (RT.RECHARGE[R.skill] || 10); sk.querySelector(".ring .fg").style.strokeDashoffset = (113.1 * (1 - f)).toFixed(1); sk.classList.toggle("ready", R.skillCd <= 0); }
    V.el.querySelector(".rt-acts .roll").classList.toggle("off", R.breath < RT.P.rollMin);
    V.el.querySelector(".withdraw").hidden = !C.canFlee();
    V.el.querySelector(".rt-edge.l").classList.toggle("on", !!R.pushing && p.rt.face < 0);
    V.el.querySelector(".rt-edge.r").classList.toggle("on", !!R.pushing && p.rt.face > 0);
    V.stage.querySelector(".rt-slow").classList.toggle("on", R.slow > 0);
    // The latest line of the fight's story, as a toast (field events, a friend's arrival).
    while (V.logAt < B.log.length) { const e = B.log[V.logAt++]; if (e && (e.raw || e.ev)) toast(C.line(e)); }
  }
  function marks() {
    const R = V.R, G = V.G, p = C.player();
    V.world.querySelectorAll(".rt-mark").forEach((m) => (m.dataset.keep = ""));
    for (const e of R.B.units) {
      if (e.side !== "enemy" || e.hp <= 0 || !e.rt.atk) continue;
      const m = RT.markOf(R, e); if (!m) continue;
      const key = e.uid + "@" + e.rt.atk.t0;
      let el = V.world.querySelector('.rt-mark[data-k="' + key + '"]');
      if (!el) { el = U.el('<div class="rt-mark' + (m.lane ? " lane" : "") + '" data-k="' + key + '"><div class="rim"></div><div class="fill"></div><span class="tag"></span></div>'); V.world.appendChild(el); }
      el.dataset.keep = "1";
      const t = R.B.units.find((u) => u.uid === m.on), ta = t && V.actors.get(t.uid);
      // A lane runs from its mark to the bow; the band that is struck is the end at the mark.
      const lx0 = m.lane ? Math.min(m.x0, m.from) : m.x0, lx1 = m.lane ? Math.max(m.x1, m.from) : m.x1;
      const L = lx0 * G.W, Wd = Math.max(10, (lx1 - lx0) * G.W);
      const hh = m.lane ? Math.max(6, G.fh * 0.05) : Math.max(10, G.fh * 0.1);
      const bottom = m.lane ? (ta ? ta.gy + ta.fh * 0.56 : G.gl + G.fh * 0.5) : (ta ? ta.gy : G.gl) - hh / 2;
      Object.assign(el.style, { left: L + "px", width: Wd + "px", height: hh + "px", bottom: bottom + "px" });
      const fill = el.querySelector(".fill"); fill.style.width = (Wd * m.fill) + "px";
      if ((m.lane ? m.from : e.rt.x) > (lx0 + lx1) / 2) { fill.style.left = "auto"; fill.style.right = "0"; } else { fill.style.left = "0"; fill.style.right = "auto"; } // filling from the attacker
      el.classList.toggle("locked", !!m.locked);
      const mine = m.on === p.uid || (p.rt.x >= m.x0 && p.rt.x <= m.x1);
      el.classList.toggle("me", mine);
      el.querySelector(".tag").textContent = mine ? K.tr("On you") : t ? K.text(t.src || t.name).split(",")[0] : "";
    }
    V.world.querySelectorAll(".rt-mark").forEach((m) => { if (!m.dataset.keep) m.remove(); });
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
        if (K.Sound) K.Sound.play("hit");
        break; }
      case "heal": { const a = A(f.uid); if (a) pop(a, "+", "heal"); break; }
      case "miss": { const a = A(f.uid); if (a) pop(a, K.tr("Missed"), "miss"); break; }
      case "perfect": toast(K.tr("Perfect roll")); break;
      case "fall": { const a = A(f.uid); if (!a) break; a.el.classList.add("dead"); a.el.classList.remove("windup");
        if (a.rig) a.rig.fallDown(null, 1); else pose(a, "dead");
        a.el.insertAdjacentHTML("beforeend", '<span class="dropped"></span>'); break; }
      case "shot": { // the arrow leaves the bow (measured from the live figure) and flies down its lane
        const a = A(f.uid), s = f.shot; if (!a) break;
        const wr = V.world.getBoundingClientRect(), hand = a.svg.querySelector(".foreF") || a.svg, hr = hand.getBoundingClientRect();
        const from = { x: hr.left - wr.left + hr.width / 2, y: hr.top - wr.top + hr.height * 0.45 };
        const tgt = s.on && A(s.on), G = V.G;
        const to = { x: s.lane * G.W, y: G.H - ((tgt ? tgt.gy : G.gl) + (tgt ? tgt.fh : G.fh) * 0.55) };
        const go = () => U.flyArrow && U.flyArrow(V.world, from, to, Math.abs(to.x - from.x) * 0.05, Math.max(90, (s.arrive - s.t0) * 1000), false, Math.max(26, G.fh * 0.36));
        if (a.u.side === "player") { pose(a, "draw", 900, 0.6); setTimeout(() => { pose(a, "loose", 1200, 0.5); home(a, 450); go(); }, Math.max(0, (s.t0 - V.R.t) * 1000)); }
        else { pose(a, "loose", 1200, 0.5); home(a, 450); go(); }
        break; }
      case "join": toast(K.tr("Help comes.")); break;
      case "call": break;
      case "astra": {
        const o = f.out || {}, to = o.uid && A(o.uid);
        if (U.astraFx) U.astraFx({ kind: o.kind || "generic", clash: !!o.clash, from: me && me.svg, to: to && to.svg });
        V.stage.classList.add("ax-flash"); setTimeout(() => V && V.stage.classList.remove("ax-flash"), 700);
        shake(true);
        if (!o.clash) { const sc = V.stage.querySelector(".rt-scorch"); sc.className = "rt-scorch on k-" + (o.kind || "generic"); setTimeout(() => { if (V) sc.className = "rt-scorch"; }, 6000); }
        (f.struck || []).forEach((uid) => { const a = A(uid); if (a && a.rig) a.rig.kick({ rot: 600, tx: 40, head: 300 }); });
        break; }
    }
  }
})(window.K = window.K || {});
