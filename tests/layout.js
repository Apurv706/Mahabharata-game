/* Screen-fit checks: does every kind of screen fit, and play, on real device sizes?
   Runs the game in a real browser at phone, tablet and desktop sizes, upright and on their side,
   with stand-in safe areas for the notch and the home bar, and checks each screen:
     - nothing spills sideways (no horizontal scroll);
     - the top bar sits below the notch, in one row on phones, with tap targets of 40px or more;
     - the story page is no taller than what it holds (no blank brown band), stays on screen, and
       leaves some of the painting showing on an upright phone;
     - the choices are on screen without scrolling the page; text is phone-sized on phones;
     - on a phone on its side, the page sits beside the painting;
     - tests, fights, the journey, the homeland map and the menus fit the screen;
     - the act card and title card appear, fade by themselves and give way to a tap;
     - no script errors.
   Usage: node tests/layout.js [--browser chromium|webkit|firefox|all] [--only phone|tablet|desktop]
          [--shots DIR]   (saves a screenshot of every check)
   Exits 1 if any check fails. Needs Playwright (npm i -D playwright; npx playwright install). */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BROWSERS = (arg("--browser", "chromium") === "all" ? "chromium,webkit,firefox" : arg("--browser", "chromium")).split(",");
const ONLY = arg("--only", "");
const DEVICE = arg("--device", "");
const SHOTS = arg("--shots", "");
// Where the network cannot reach Google Fonts, --fonts DIR serves the same faces from Fontsource
// packages (fontsource-<family>-<version>/ folders), so text measures as it does for players.
const FONTS = arg("--fonts", "");
const ROOT = path.join(__dirname, "..", "game");

// Device sizes in CSS pixels, with the insets the real devices have (top notch, home bar, sides).
const DEVICES = [
  { name: "iPhone SE", kind: "phone", w: 375, h: 667, sat: 20, sab: 0, mobile: true },
  { name: "iPhone 15", kind: "phone", w: 393, h: 852, sat: 59, sab: 34, mobile: true },
  { name: "iPhone 15 Pro Max", kind: "phone", w: 430, h: 932, sat: 59, sab: 34, mobile: true },
  { name: "Pixel 7", kind: "phone", w: 412, h: 915, sat: 24, sab: 16, mobile: true },
  { name: "iPad", kind: "tablet", w: 820, h: 1180, sat: 24, sab: 20, mobile: true },
  { name: "Laptop", kind: "desktop", w: 1280, h: 720, sat: 0, sab: 0, mobile: false },
  { name: "Desktop", kind: "desktop", w: 1440, h: 900, sat: 0, sab: 0, mobile: false },
];
const shapes = (d) => {
  const up = { ...d, orient: "portrait" };
  if (d.kind === "desktop") return [up];
  // On its side the notch moves to the left or right, and the home bar stays at the foot.
  const side = { ...d, orient: "landscape", w: d.h, h: d.w, sal: d.sat > 30 ? d.sat : 0, sar: d.sat > 30 ? d.sat : 0, sat: 0, sab: d.sab ? 21 : 0 };
  return [up, side];
};

// A tiny static server for the game folder.
function serve() {
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".woff2": "font/woff2" };
  const srv = http.createServer((req, res) => {
    if (FONTS && req.url.startsWith("/__fonts/")) {
      const f = path.join(FONTS, decodeURIComponent(req.url.slice(9).split("?")[0]));
      return fs.readFile(f, (err, buf) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { "Content-Type": "font/woff2" }); res.end(buf); });
    }
    const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
    if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.readFile(p, (err, buf) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "Content-Type": types[path.extname(p)] || "application/octet-stream" });
      res.end(buf);
    });
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

// ---------- Checks run inside the page ----------
// Each returns a list of problems (strings). `o` carries the device's insets and kind.
const PAGE = {
  common(o) {
    const out = [];
    const W = innerWidth, H = innerHeight;
    if (document.documentElement.scrollWidth > W + 1) out.push("page scrolls sideways (" + document.documentElement.scrollWidth + " > " + W + ")");
    // Under the full-screen "turn upright" card nothing else can be seen or touched, so only the card is checked there.
    const wide = o.underCard ? [] : [...document.querySelectorAll(".leaf, .modal, .trial, .arena, .bmap, .choice")].filter((e) => e.offsetParent && e.getBoundingClientRect().right > W + 1);
    if (wide.length) out.push(wide.length + " element(s) run past the right edge: " + wide.slice(0, 3).map((e) => (e.className.baseVal ?? e.className) + " (right " + Math.round(e.getBoundingClientRect().right) + " of " + W + ", width " + Math.round(e.getBoundingClientRect().width) + ", transform " + getComputedStyle(e).transform + ")").join(", "));
    return out;
  },
  topbar(o) {
    const out = [];
    const top = document.querySelector("header.top");
    if (!top || !document.body.classList.contains("inscene")) return out;
    const r = top.getBoundingClientRect();
    const btns = [...document.querySelectorAll("#nav button, #nav-standing")].filter((b) => b.offsetParent);
    for (const b of btns) {
      const br = b.getBoundingClientRect();
      if (br.top < o.sat - 1) out.push("top bar button under the notch (" + Math.round(br.top) + "px < " + o.sat + "px)");
      if (br.left < (o.sal || 0) - 1 || br.right > innerWidth - (o.sar || 0) + 1) out.push("top bar button off the side: " + (b.id || b.textContent));
      if (o.small && (br.width < 39.5 || br.height < 39.5)) out.push("tap target too small: " + b.id + " " + Math.round(br.width) + "×" + Math.round(br.height));
    }
    if (o.small) {
      const tops = new Set(btns.map((b) => Math.round(b.getBoundingClientRect().top / 8)));
      if (tops.size > 1) out.push("top bar wraps onto two rows");
      if (r.height > 64) out.push("top bar too tall (" + Math.round(r.height) + "px)");
    }
    for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) {
      const a = btns[i].getBoundingClientRect(), b = btns[j].getBoundingClientRect();
      if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) out.push("top bar buttons overlap: " + btns[i].id + " / " + btns[j].id);
    }
    const where = document.getElementById("where");
    if (where && where.offsetParent && btns[0] && where.getBoundingClientRect().right > btns[0].getBoundingClientRect().left + 1) out.push("place text runs under the buttons");
    return out;
  },
  scene(o) {
    const out = [];
    const leaf = document.getElementById("leaf");
    if (!leaf || !leaf.classList.contains("split")) return ["the story page did not open"];
    const H = innerHeight, W = innerWidth;
    const lr = leaf.getBoundingClientRect();
    const head = document.querySelector("header.top").getBoundingClientRect();
    if (lr.bottom > H + 1) out.push("story page runs off the bottom (" + Math.round(lr.bottom) + " > " + H + ")");
    if (lr.top < head.bottom - 1) out.push("story page runs under the top bar");
    // Blank band: the story area taller than its own lines.
    const story = document.getElementById("story");
    if (story && story.lastElementChild) {
      const pad = parseFloat(getComputedStyle(story).paddingBottom) || 0;
      const scrolls = story.scrollHeight > story.clientHeight + 2;
      const gap = story.getBoundingClientRect().bottom - story.lastElementChild.getBoundingClientRect().bottom - pad;
      if (!scrolls && gap > 24) out.push("blank band of " + Math.round(gap) + "px in the story page");
      if (scrolls && story.clientHeight < 90) out.push("story squeezed to " + story.clientHeight + "px");
    }
    const acts = document.querySelector(".split .actions");
    if (acts && acts.scrollHeight > 0) {
      const gapA = acts.clientHeight - acts.scrollHeight;
      if (gapA > 24) out.push("blank band of " + gapA + "px under the choices");
    }
    // The page's heading stays one compact band (title beside the puppet, not under it).
    const ph = document.querySelector(".leaf.split > .pagehead");
    if (o.small && ph && ph.offsetHeight > 120) out.push("page heading too tall (" + ph.offsetHeight + "px)");
    // The choices: on screen, and the first one whole, without scrolling the page.
    const choices = [...document.querySelectorAll("#choices .choice")];
    if (!choices.length) out.push("no choices shown");
    const first = choices[0];
    if (first) {
      const cr = first.getBoundingClientRect();
      if (cr.top < head.bottom || cr.bottom > H - (o.sab || 0) + 1) out.push("first choice not fully on screen (" + Math.round(cr.top) + "–" + Math.round(cr.bottom) + " of " + H + ")");
      if (cr.height < 40) out.push("choice shorter than a tap target (" + Math.round(cr.height) + "px)");
    }
    const hiddenChoices = choices.filter((c) => { const r = c.getBoundingClientRect(), a = acts.getBoundingClientRect(); return r.bottom > a.bottom + 1; });
    if (hiddenChoices.length && acts.scrollHeight <= acts.clientHeight + 1) out.push(hiddenChoices.length + " choice(s) cut off and not scrollable");
    if (o.small) {
      const fs = parseFloat(getComputedStyle(story).fontSize);
      const big = document.body.classList.contains("big-text");
      if (!big && fs > 16.5) out.push("story text " + fs + "px on a phone (want ≤16)");
      const ct = first && first.querySelector(".t");
      if (ct && parseFloat(getComputedStyle(ct).fontSize) > 16.5) out.push("choice text " + getComputedStyle(ct).fontSize + " on a phone");
    }
    if (o.kind === "phone" && o.orient === "portrait" && o.short && lr.top < H * 0.18) out.push("short scene leaves almost none of the painting (page starts at " + Math.round(lr.top / H * 100) + "%)");
    if (o.orient === "landscape" && o.kind === "phone" && lr.width > W * 0.66) out.push("on its side, the page is not beside the painting (" + Math.round(lr.width / W * 100) + "% wide)");
    return out;
  },
  trial(o) {
    const out = [];
    const leaf = document.getElementById("leaf");
    const t = document.querySelector(".trial");
    if (!t) return ["the test did not open"];
    // A test on its painting fills the screen: no top bar, every control on screen and clear of
    // the notch and the home bar, the test's name below the notch.
    if (t.classList.contains("immersive")) {
      const W = innerWidth, H = innerHeight, r = t.getBoundingClientRect();
      if (r.width < W - 1 || r.height < H - 1) out.push("test does not fill the screen (" + Math.round(r.width) + "×" + Math.round(r.height) + ")");
      if (document.querySelector("header.top").offsetParent) out.push("top bar still showing during the test");
      const ctrls = [...t.querySelectorAll("button:not([disabled])")].filter((e) => e.offsetParent && getComputedStyle(e).visibility !== "hidden");
      const off = ctrls.filter((e) => { const b = e.getBoundingClientRect(); return b.bottom > H - (o.sab || 0) + 1 || b.top < (o.sat || 0) - 1 || b.left < -1 || b.right > W + 1; });
      if (off.length) out.push(off.length + " control(s) off screen or under the notch / home bar: " + off.slice(0, 3).map((e) => (e.textContent || e.className).trim().slice(0, 20)).join(", "));
      const name = t.querySelector(".t-name, .score");
      if (name && name.getBoundingClientRect().top < (o.sat || 0) - 1) out.push("test name under the notch");
      const tall = [...t.querySelectorAll(".trial-body > *")].filter((e) => e.offsetParent && e.getBoundingClientRect().bottom > H + 1);
      if (tall.length) out.push("part of the test runs off the bottom: " + tall.map((e) => e.className).join(", "));
      return out;
    }
    const H = innerHeight;
    const lr = leaf.getBoundingClientRect();
    if (lr.bottom > H + 1) out.push("test page runs off the bottom");
    // The page itself or the box inside it that holds the test: neither may need scrolling.
    const box = leaf.querySelector(".actions");
    const over = Math.max(leaf.scrollHeight - leaf.clientHeight, box ? box.scrollHeight - box.clientHeight : 0, Math.round(t.getBoundingClientRect().bottom - H));
    if (over > 4) out.push("test needs scrolling (" + over + "px more than the screen)");
    // Every control the player needs must be on screen.
    const ctrls = [...t.querySelectorAll("button:not([disabled]), .pt, .tile, [role=button]")].filter((e) => e.offsetParent);
    const off = ctrls.filter((e) => { const r = e.getBoundingClientRect(); return r.bottom > H + 1 || r.top < 0; });
    if (off.length && over > 4) out.push(off.length + " control(s) off screen");
    return out;
  },
  battle(o) {
    const out = [];
    const leaf = document.getElementById("leaf");
    if (!document.querySelector(".arena")) return ["the fight did not open"];
    if (leaf.classList.contains("immersive")) {
      const W = innerWidth, H = innerHeight, r = leaf.getBoundingClientRect();
      if (r.width < W - 1 || r.height < H - 1) out.push("fight does not fill the screen");
      if (document.querySelector("header.top").offsetParent) out.push("top bar still showing during the fight");
      const acts = [...document.querySelectorAll("#battle-actions button")].filter((e) => e.offsetParent);
      if (!acts.length) out.push("no fight actions");
      const off = acts.filter((e) => { const b = e.getBoundingClientRect(); return b.bottom > H - (o.sab || 0) + 1 || b.right > W + 1 || b.left < -1; });
      if (off.length) out.push(off.length + " fight action(s) off screen or under the home bar");
      const figs = [...document.querySelectorAll("#arena .actor")].map((e) => e.getBoundingClientRect());
      if (figs.some((b) => b.right > W + 24 || b.left < -24)) out.push("a figure stands off the edge of the screen");
      if (figs.some((b) => b.height < 60)) out.push("figures too small to see");
      // On an upright screen the painting's ground meets the fighters' feet (dom.js U.groundFit).
      const L = document.querySelector("#backdrop .bdl.on"), pic = L && L.querySelector(".pic"), key = L && L.dataset.key;
      const gr = key && K.UI.upright() && K.UI.tallOf(key) ? K.UI.groundOf(key) : null, feet = K.UI.feetY();
      if (gr && feet && pic) { const pr = pic.getBoundingClientRect(), gy = pr.top + gr * pr.height; if (Math.abs(gy - feet) > H * 0.06) out.push("figures float above the painting's ground (" + Math.round(feet) + " vs " + Math.round(gy) + ")"); }
      const head = leaf.querySelector(".pagehead");
      if (head && head.getBoundingClientRect().top < (o.sat || 0) - 1) out.push("fight name under the notch");
      return out;
    }
    const H = innerHeight;
    const btn = document.querySelector("#battle-actions button, #battle-actions .act");
    if (!btn) out.push("no fight actions");
    else { const r = btn.getBoundingClientRect(); if (r.bottom > H + 1) out.push("fight actions off screen (" + Math.round(r.bottom) + " > " + H + ")"); }
    if (leaf.getBoundingClientRect().bottom > H + 1) out.push("fight page runs off the bottom");
    return out;
  },
  painting(o) {
    const out = [];
    const bd = document.getElementById("backdrop");
    const L = bd.querySelector(".bdl.on"), pic = L && L.querySelector(".pic");
    if (!pic) return ["no painting behind the page"];
    const r = pic.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    const leaf = document.getElementById("leaf").getBoundingClientRect();
    const upright = H > W * 1.15;
    if (upright && o.short) {
      if (bd.dataset.mode !== "fit") out.push("painting not shown whole above the page (mode " + bd.dataset.mode + ")");
      else {
        // It may trim the sides (at most two fifths of its width) to fill more of the height.
        if (r.top < -1) out.push("painting cut at the top");
        if (r.width > 1 && W / r.width < 0.59) out.push("painting trimmed by more than two fifths (" + Math.round(100 - W / r.width * 100) + "%)");
        if (r.bottom > leaf.top + 2) out.push("page covers the painting by " + Math.round(r.bottom - leaf.top) + "px");
        if (r.width < W - 2 && r.height < leaf.top - 2 - Math.max(0, r.top)) out.push("painting smaller than the space allows");
        if (r.bottom < leaf.top - 4) out.push("gap of " + Math.round(leaf.top - r.bottom) + "px between the painting and the page");
      }
    } else if (!upright && bd.dataset.mode !== "cover") out.push("painting not filling the screen on a wide screen");
    const btn = document.getElementById("view-full");
    const br = btn.getBoundingClientRect();
    if (o.short && (btn.hidden || (br.bottom > leaf.top + 1 && br.right > leaf.left - 1))) out.push("See-the-painting-whole button missing or under the page");
    return out;
  },
  viewing(o) {
    const out = [];
    if (!document.body.classList.contains("viewing")) return ["view-whole did not open"];
    const leaf = document.getElementById("leaf").getBoundingClientRect();
    if (leaf.top < innerHeight - 2) out.push("page still on screen while viewing the painting");
    const pic = document.querySelector("#backdrop .bdl.on .pic").getBoundingClientRect();
    if (pic.left < -1 || pic.right > innerWidth + 1 || pic.top < -1 || pic.bottom > innerHeight + 1) out.push("painting not whole while viewing");
    const back = document.getElementById("view-back");
    if (back.hidden || back.getBoundingClientRect().bottom > innerHeight - (o.sab || 0) + 1) out.push("Back to the story button missing or under the home bar");
    return out;
  },
  turned(o) {
    const out = [];
    const t = document.getElementById("turn");
    if (!t || t.hidden) return ["no turn-upright card on a phone held sideways"];
    const r = t.getBoundingClientRect();
    if (r.width < innerWidth - 1 || r.height < innerHeight - 1) out.push("turn-upright card does not cover the screen");
    if (!K.UI.paused()) out.push("game not paused while the phone is sideways");
    return out;
  },
  growing(o) {
    // Mid-reveal: the page holds only what has been written so far; no band waits for the rest.
    const out = [];
    const leaf = document.getElementById("leaf");
    if (!leaf.classList.contains("split")) return ["the story page did not open"];
    const lr = leaf.getBoundingClientRect();
    const seen = [...leaf.querySelectorAll(".pagehead, .story > *, .actions, .choices > *, .hint")].filter((e) => e.offsetParent && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().height > 0);
    const bottom = Math.max(...seen.map((e) => e.getBoundingClientRect().bottom));
    const blank = lr.bottom - bottom - (o.sab || 0);
    if (blank > 48) out.push("empty band of " + Math.round(blank) + "px in the page while the story is written");
    return out;
  },
  practice(o) {
    // The practice ground: its page on screen, every kind of test listed (the ones met open, the
    // rest locked), sparring, the blow drill and the way out reachable without scrolling the page.
    const out = [];
    const leaf = document.getElementById("leaf");
    if (!leaf || !leaf.classList.contains("pr-page")) return ["the practice ground did not open"];
    const H = innerHeight, lr = leaf.getBoundingClientRect(), head = document.querySelector("header.top").getBoundingClientRect();
    if (lr.bottom > H + 1) out.push("practice page runs off the bottom (" + Math.round(lr.bottom) + " > " + H + ")");
    if (lr.top < head.bottom - 1) out.push("practice page runs under the top bar");
    const tiles = [...leaf.querySelectorAll(".pr-tile")];
    if (tiles.length < 10) out.push("only " + tiles.length + " kinds of test listed");
    if (!tiles.some((t) => !t.disabled)) out.push("no kind of test open, though some were met");
    if (!tiles.some((t) => t.disabled)) out.push("no kind of test locked");
    if (tiles.some((t) => t.getBoundingClientRect().height < 40)) out.push("test tiles shorter than a tap target");
    const acts = [...leaf.querySelectorAll("#pr-acts .choice, #pr-acts .cta")];
    if (acts.length < 3) out.push("sparring, the blow drill or the way out is missing");
    const off = acts.filter((b) => { const r = b.getBoundingClientRect(); return r.bottom > H - (o.sab || 0) + 1 || r.top < head.bottom - 1 || r.height < 40; });
    if (off.length) out.push(off.length + " practice action(s) off screen or too small");
    const story = document.getElementById("pr-story");
    if (story && story.scrollHeight > story.clientHeight + 2 && story.clientHeight < 90) out.push("practice page's list squeezed to " + story.clientHeight + "px");
    if (o.small && parseFloat(getComputedStyle(story).fontSize) > 16.5 && !document.body.classList.contains("big-text")) out.push("practice text " + getComputedStyle(story).fontSize + " on a phone");
    return out;
  },
  modal(o) {
    const out = [];
    const m = document.querySelector(".scrim .modal");
    if (!m) return ["the window did not open"];
    const r = m.getBoundingClientRect();
    if (r.right > innerWidth + 1 || r.left < -1) out.push("window wider than the screen");
    const close = document.getElementById("modal-close").getBoundingClientRect();
    if (close.top < (o.sat || 0) - 1 || close.bottom > innerHeight) out.push("Close button off screen or under the notch");
    return out;
  },
  journey(o) {
    const out = [];
    const map = document.querySelector(".leaf.journeying .bmap");
    if (!map) return ["the journey page did not open"];
    const r = map.getBoundingClientRect();
    if (r.height < 120) out.push("journey map too small (" + Math.round(r.height) + "px)");
    const leaf = document.getElementById("leaf").getBoundingClientRect();
    if (leaf.bottom > innerHeight + 1) out.push("journey page runs off the bottom");
    const go = document.getElementById("journey-go");
    if (!go || go.getBoundingClientRect().bottom > innerHeight + 1) out.push("Continue off screen on the journey page");
    return out;
  },
  homeland(o) {
    const out = [];
    const map = document.querySelector(".homes-wrap .bmap");
    if (!map || !map.getBoundingClientRect().height) out.push("homeland map not shown");
    else if (map.getBoundingClientRect().width < Math.min(innerWidth - 60, 300)) out.push("homeland map too narrow (" + Math.round(map.getBoundingClientRect().width) + "px)");
    const pins = [...document.querySelectorAll(".bmap.homes .m-home")];
    if (pins.length < 6) out.push("only " + pins.length + " homeland pins");
    const list = document.querySelector(".lands.under-map");
    if (o.kind === "phone" && o.orient === "portrait" && (!list || !list.offsetParent)) out.push("lands list missing under the map on a phone");
    return out;
  },
};

// ---------- Setting up each screen ----------
const LIFE = { origin: "panchala", pronoun: "she", heirloom: "amulet", temperament: "bold", age: 15, teacher: "drona", path: "archer", act: 2 };
function fontCss() {
  const want = { "cormorant-garamond": ["500", "600", "700", "500-italic"], "alegreya-sans": ["400", "500", "700"], "tiro-devanagari-hindi": ["400", "400-italic"], mukta: ["400", "500", "700"] };
  let css = "";
  for (const dir of fs.readdirSync(FONTS)) {
    const fam = Object.keys(want).find((f) => dir.startsWith("fontsource-" + f + "-") && fs.statSync(path.join(FONTS, dir)).isDirectory());
    if (!fam) continue;
    for (const w of want[fam]) {
      const f = path.join(FONTS, dir, w + ".css");
      if (fs.existsSync(f)) css += fs.readFileSync(f, "utf8").replace(/url\(\.\/files\//g, "url(/__fonts/" + dir + "/files/");
    }
  }
  return css;
}
async function fresh(page, url, o, prefs = {}) {
  await page.goto(url);
  await page.waitForFunction(() => window.K && K.UI && K.UI.renderScene);
  await page.evaluate(() => document.fonts && document.fonts.ready.then(() => true));
  await page.addStyleTag({ content: `:root{--sat:${o.sat}px!important;--sab:${o.sab}px!important;--sal:${o.sal || 0}px!important;--sar:${o.sar || 0}px!important}` });
  await page.evaluate((p) => { localStorage.clear(); K.prefs(Object.assign({ gradual: false, beats: false, sound: false, timed: false, living: false }, p)); }, prefs);
}
async function goScene(page, id, extra) {
  await page.evaluate(([id, life, extra]) => {
    K.S = K.newLife({ name: "Asha" }); Object.assign(K.S, life, extra || {}); K.S.at = K.S.at || "hastinapura"; K.go(id);
  }, [id, LIFE, extra]);
  await page.waitForTimeout(600);
  // A new place: the journey page comes first; a tap on it moves on to the scene.
  if (await page.$("#journey-go")) { await page.click("#journey-go"); await page.waitForTimeout(400); }
  // Let the page finish rising into place.
  await page.waitForFunction(() => !document.getAnimations || document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getComputedTiming().iterations === Infinity), null, { timeout: 3000 }).catch(() => {});
}
// A made-up scene holding one test of the given kind.
async function goTest(page, game, trial) {
  await page.evaluate(([game, trial, life]) => {
    K.S = K.newLife({ name: "Asha" }); Object.assign(K.S, life, { age: 22 });
    const id = "zz_" + game;
    K.scene({ id, act: 3, age: 22, art: "scene_teacher", place: "Test", title: "Test " + game, body: ["Before the test."],
      choices: [{ id: "g", t: "Play " + game, game, trial: Object.assign({ rules: "The rules of the test, in one line.", stakes: ["You win something.", "You lose something."], attr: "grace", skill: "stealth" }, trial), win: { text: "won" }, close: { text: "close" }, lose: { text: "lost" } }], next: "a3_lac" });
    K.go(id);
  }, [game, trial, LIFE]);
  await page.waitForTimeout(500);
  await page.click("#choices .choice");
  await page.waitForTimeout(500);
  const start = await page.$(".trial .cta");
  if (start) { await start.click(); await page.waitForTimeout(900); }
}
const TESTS = [
  ["aim", { stage: "stage_training_ground", cast: ["drona"] }], ["push", {}], ["steady", {}], ["sneak", {}], ["notice", {}],
  ["drill", { set: "mudra", stage: "stage_training_ground", cast: ["balarama"] }], ["rhythm", { stage: "stage_smithy", cast: ["charu"], sound: "clang" }],
  ["race", { stage: "stage_racetrack", cast: ["karna"], rival: "Karna" }], ["herd", { stage: "stage_khandava_top", theme: "fire" }],
  ["rings", { stage: "stage_chakravyuha_top", mode: "open" }], ["chaupar", { stage: "stage_board_table", cast: ["shakuni"], opponent: "Shakuni" }],
  ["baghchal", { stage: "stage_board_table", cast: ["shakuni"], opponent: "Shakuni" }], ["moksha", { stage: "stage_board_table", cast: ["boy"], opponent: "Vikarna" }],
  ["retort", { stage: "stage_lotus_garden", cast: ["duryodhana"], rounds: [{ line: "They say your family sweeps the stables.", replies: ["And yours sweeps the floor before the king.", "That is not true.", "Leave me alone."] }, { line: "Is that a bow or a broom?", replies: ["Come closer and find out.", "A bow.", "Go away."] }, { line: "Who taught you?", replies: ["Someone who could.", "Nobody.", "My mother."] }] }],
  ["draw", { stage: "stage_bow_courtyard", cast: ["guard"] }], ["formation", { stage: "stage_chakravyuha_top", array: "eagle" }], ["hands", { stage: "stage_dice_board_top", cast: ["shakuni"] }], ["pasha", null],
  ["array", { stage: "stage_vyuha_top", array: "crane", rounds: 5 }], // the army battle (ui/army.js)
  ["breath", { stage: "stage_forest_lake" }], ["race", { stage: "stage_forest_edge", vehicle: "foot", rival: "the mountain" }],
];

async function runDevice(browser, base, o, report) {
  const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, deviceScaleFactor: o.mobile ? 2 : 1, isMobile: o.mobile && browser._name !== "firefox", hasTouch: o.mobile });
  const page = await ctx.newPage();
  if (FONTS) {
    const css = fontCss();
    await page.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: css }));
  }
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  o.small = o.w <= 720 || o.h <= 520;
  const label = o.name + " " + o.orient + " (" + o.w + "×" + o.h + ")";
  const check = async (name, kinds, extra = {}) => {
    const oo = Object.assign({}, o, extra);
    let probs = [];
    for (const k of ["common", ...kinds]) probs = probs.concat(await page.evaluate(([fn, oo]) => { try { return (0, eval)("(function " + fn + ")")(oo); } catch (e) { return ["check crashed: " + e.message]; } }, [PAGE[k].toString(), oo]));
    report.push({ browser: browser._name, device: label, screen: name, problems: probs });
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, [browser._name, o.name.replace(/\s+/g, ""), o.orient[0], name.replace(/[^\w]+/g, "_")].join("-") + ".png") });
  };
  const url = base + "/index.html";

  // Phones held sideways: the game asks to be turned upright and waits; turned back, it goes on.
  if (o.kind === "phone" && o.orient === "landscape") {
    await fresh(page, url, o);
    const coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
    if (!coarse) { report.push({ browser: browser._name, device: label, screen: "turn upright", problems: [] }); await ctx.close(); return; }
    await goScene(page, "a2_trial");
    await check("turn upright", ["turned"], { underCard: true });
    await page.setViewportSize({ width: o.h, height: o.w });
    await page.waitForTimeout(700);
    const back = await page.evaluate(() => ({ hidden: document.getElementById("turn").hidden, paused: K.UI.paused(), choice: !!document.querySelector("#choices .choice") }));
    report.push({ browser: browser._name, device: label, screen: "turned back upright", problems: [back.hidden ? null : "turn card stayed", back.paused ? "game still paused" : null, back.choice ? null : "scene lost"].filter(Boolean) });
    report.push({ browser: browser._name, device: label, screen: "script errors", problems: errors.map((e) => "error: " + e) });
    await ctx.close();
    return;
  }

  // Title, and the homeland on the map.
  await fresh(page, url, o);
  await page.waitForTimeout(400);
  await check("title", []);
  await page.evaluate(() => K.UI.renderCreate());
  await page.waitForTimeout(500);
  await check("homeland map", ["homeland"]);

  // Scenes: a short one, the longest canon scene, the scene with the most choices, a war scene.
  await fresh(page, url, o);
  await goScene(page, "a2_trial");
  await check("short scene", ["topbar", "scene", "painting"], { short: true });
  // The story written line by line: midway, the page holds only what is written.
  await page.evaluate((life) => { K.prefs({ gradual: true }); K.S = K.newLife({ name: "Asha" }); Object.assign(K.S, life, { origin: "matsya", age: 9, act: 1 }); K.S.at = "matsya"; K.go("a1_sage"); }, LIFE);
  await page.waitForTimeout(1600);
  await check("story being written", ["growing"]);
  {
    // The painting holds still while the lines appear (it moves up only once the scene is there).
    const at = () => page.evaluate(() => { const r = document.querySelector("#backdrop .bdl.on .pic").getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height), document.getElementById("backdrop").dataset.mode]; });
    const a = await at(); await page.waitForTimeout(900); const b = await at();
    const upright = o.h > o.w * 1.15;
    report.push({ browser: browser._name, device: label, screen: "painting still while writing", problems: (a[0] !== b[0] || a[1] !== b[1]) ? ["painting moved while the story was written (" + a + " → " + b + ")"] : upright && a[2] !== "whole" ? ["painting not shown whole while the scene opens (" + a[2] + ")"] : [] });
  }
  await page.evaluate(() => { K.UI.stageFinish(true); K.prefs({ gradual: false }); });
  await goScene(page, "a2_trial");
  // See the painting whole, and back.
  await page.click("#view-full");
  await page.waitForTimeout(1400);
  await check("painting whole", ["viewing"]);
  await page.mouse.click(o.w / 2, o.h / 2);
  await page.waitForTimeout(900);
  {
    const back = await page.evaluate(() => !document.body.classList.contains("viewing") && document.getElementById("leaf").getBoundingClientRect().top < innerHeight - 50);
    report.push({ browser: browser._name, device: label, screen: "back from the painting", problems: back ? [] : ["a tap did not bring the page back"] });
  }
  // A living painting: the training ground has a clip; it plays and shows over the painting.
  await page.evaluate(() => K.prefs({ living: true }));
  await page.evaluate(() => { K.UI.setBackdrop(null); });
  await goScene(page, "a2_trial");
  await page.waitForTimeout(2200);
  {
    const v = await page.evaluate(() => { const v = document.querySelector("#backdrop .bdl.on video"); const t = document.createElement("video"); return { can: !!(t.canPlayType("video/mp4; codecs=avc1.42E01E") || t.canPlayType("video/webm; codecs=vp9")), el: v ? { t: v.currentTime, on: v.classList.contains("on") } : null }; });
    // A test browser built without either codec cannot play clips; players' browsers can. The painting stays.
    if (v.can) report.push({ browser: browser._name, device: label, screen: "living painting", problems: !v.el ? ["no clip on a painting that has one"] : v.el.on && v.el.t > 0.3 ? [] : ["clip did not play (" + JSON.stringify(v.el) + ")"] });
  }
  const picks = await page.evaluate(() => {
    const len = (b) => JSON.stringify(b || "").length;
    let longest = null, most = null, n = 0, L = 0;
    for (const sc of Object.values(K.SCENES)) {
      if (sc.ending || typeof sc.choices === "function" || typeof sc.body === "function") continue;
      const l = len(sc.body) + len(sc.witness);
      if (sc.canon && l > L) { L = l; longest = sc.id; }
      const c = (sc.choices || []).length;
      if (c > n) { n = c; most = sc.id; }
    }
    return { longest, most };
  });
  for (const [name, id, extra] of [["longest canon scene", picks.longest], ["most choices", picks.most], ["war scene", "a6_day1", { act: 6, age: 40, side: "pandava" }]]) {
    if (!id) continue;
    await goScene(page, id, extra);
    await check(name + " (" + id + ")", ["topbar", "scene"]);
  }
  // Hindi, larger letters, and the same long scene.
  await page.evaluate(() => K.UI.loadLang("hi").then(() => K.UI.setLang("hi")));
  await goScene(page, picks.longest);
  await check("Hindi long scene", ["topbar", "scene"]);
  await page.evaluate(() => K.UI.setLang("en"));

  // The windows from the top bar.
  for (const [name, id] of [["Character", "nav-char"], ["Journal", "nav-journal"], ["Map", "nav-map"], ["Menu", "nav-menu"]]) {
    await page.click("#" + id);
    await page.waitForTimeout(350);
    await check(name + " window", ["modal"]);
    await page.click("#modal-close");
    await page.waitForTimeout(200);
  }

  // A journey to a new place.
  await page.evaluate((life) => { K.S = K.newLife({ name: "Asha" }); Object.assign(K.S, life, { age: 19, act: 3 }); K.S.at = "hastinapura"; K.S.flags.push("moved_capital"); }, LIFE);
  await page.evaluate(() => K.go("a3_lac"));
  await page.waitForTimeout(700);
  await check("journey", ["journey"]);

  // Tests of every kind.
  for (const [game, trial] of TESTS) {
    await goTest(page, game, trial);
    await check("test: " + game, ["trial"]);
  }

  // A fight.
  await page.evaluate((life) => { K.S = K.newLife({ name: "Asha" }); Object.assign(K.S, life, { age: 44, act: 6, side: "pandava" }); K.go("a6_capture"); K.UI.startBattle("e_guard", () => {}); }, LIFE);
  await page.waitForTimeout(900);
  await check("fight", ["battle"]);
  // A fight holding two divine weapons: one "Invoke astra" card, and the chooser behind it.
  await page.evaluate((life) => { K.S = K.newLife({ name: "Asha" }); Object.assign(K.S, life, { age: 44, act: 6, side: "pandava", astras: [{ id: "agneya", from: "fire_altar" }, { id: "varuna", from: "lake_sage" }], tapas: 9 }); K.go("a6_capture"); K.UI.startBattle("e_guard", () => {}); }, LIFE);
  await page.waitForTimeout(900);
  await check("fight: two astras", ["battle"]);
  {
    const cards = await page.$$eval("#battle .bmove, #battle button", (b) => b.map((x) => x.textContent));
    const pick = await page.$("[data-move='astra-pick']");
    if (pick) { await pick.click(); await page.waitForTimeout(400); await check("fight: astra chooser", ["battle"]); }
    else report.push({ browser: browser._name, device: label, screen: "fight: astra chooser", problems: ["no Invoke astra card (" + cards.length + " buttons)"] });
  }
  // The character sheet holding tapas, weapons and charges.
  await page.evaluate(() => K.UI.endBattle && K.UI.endBattle());
  await goScene(page, "a2_trial", { tapas: 12, astras: [{ id: "agneya", from: "fire_altar" }, { id: "sammohana", from: "gandharva" }], charges: { sanjivani: 1, kavacha: 1 }, boons: ["kavacha"] });
  await page.click("#nav-standing");
  await page.waitForTimeout(500);
  await check("Standing: weapons and tapas", []);
  await page.click("#nav-standing");
  await page.waitForTimeout(300);
  // A fight on a borrowed test-stage painting (the sparring trial): the fighters stand on its ground.
  await page.evaluate((life) => { K.S = K.newLife({ name: "Asha" }); Object.assign(K.S, life, { age: 17, act: 2 }); K.go("a2_spar"); K.UI.startBattle("e_spar", () => {}); }, LIFE);
  await page.waitForTimeout(900);
  await check("fight: sparring", ["battle"]);
  // A holding fight (content/command.js): the champion's own painting, the countdown in the log.
  await page.evaluate((life) => { K.S = K.newLife({ name: "Asha" }); Object.assign(K.S, life, { age: 44, act: 6, side: "pandava" }); K.S.flags.push("role_command", "role_division"); K.go("a6_day16"); K.UI.startBattle("hold_karna", () => {}); }, LIFE);
  await page.waitForTimeout(900);
  await check("fight: holding", ["battle"]);

  // The practice ground (ui/practice.js). Beside a second chance, the offer; from the menu between
  // scenes, the ground; there a test played to its end, a blow read and the drill stopped, a bout
  // withdrawn from; and on leaving, the life exactly as it was (nothing done there counts).
  await fresh(page, url, o);
  await goScene(page, "a2_trial_again", { flags: ["a2_trial_drona_again"] });
  {
    const offer = await page.evaluate(() => { const b = document.querySelector("#choices .practice-offer"); return b ? b.getBoundingClientRect().height : 0; });
    report.push({ browser: browser._name, device: label, screen: "practice offer beside a second chance", problems: offer >= 40 ? [] : [offer ? "practice offer shorter than a tap target" : "no practice offer beside the second chance"] });
  }
  await goScene(page, "a2_trial", { log: ["a1_friend:arjuna", "a1_friend:bhima"] });
  const lifeBefore = await page.evaluate(() => JSON.stringify(K.S));
  await page.click("#nav-menu");
  await page.waitForTimeout(300);
  await page.click("#m-practice");
  await page.waitForTimeout(700);
  await check("practice ground", ["practice"]);
  await page.click('.pr-tile[data-kind="aim"]');
  await page.waitForTimeout(700);
  await check("practice: a test", ["trial"]);
  await page.click(".trial .trial-body .btnrow .cta:not(.pr-show)");
  await page.waitForTimeout(600);
  for (let i = 0; i < 4 && !(await page.$(".trial.done")); i++) { await page.keyboard.press(" "); await page.waitForTimeout(900); }
  const testBack = await page.waitForSelector(".pr-result", { timeout: 9000 }).then(() => true, () => false);
  await page.click("#pr-acts .choice:nth-child(2)");
  await page.waitForTimeout(700);
  await check("practice: reading the blow", ["battle"]);
  await page.click(".pr-card .cta:not(.pr-show)");
  await page.waitForTimeout(700);
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(500);
  await page.click(".pr-stop");
  await page.waitForTimeout(500);
  await page.click("#pr-acts .choice:nth-child(1)");
  await page.waitForTimeout(500);
  await page.click("#pr-acts .choice");
  await page.waitForTimeout(900);
  await check("practice: a bout", ["battle"]);
  await page.click(".pr-bout-stop");
  await page.waitForTimeout(400);
  await page.click("#battle-actions .cta");
  await page.waitForTimeout(600);
  await page.click(".pr-leave");
  await page.waitForTimeout(700);
  {
    const after = await page.evaluate((b) => ({ same: JSON.stringify(K.S) === b, scene: !!document.querySelector("#choices .choice"), slow: document.body.classList.contains("pr-slow"), page: !!document.querySelector(".pr-page") }), lifeBefore);
    report.push({ browser: browser._name, device: label, screen: "practice leaves the life as it was", problems: [testBack ? null : "the test did not return to the practice ground", after.same ? null : "the life changed after practice",
      after.scene && !after.page ? null : "the scene did not come back", after.slow ? "the game clock stayed slowed" : null].filter(Boolean) });
  }

  // The act card and the title card: shown, gone by themselves, and gone at a tap.
  await fresh(page, url, o, { beats: true });
  await page.evaluate((life) => { K.S = K.newLife({ name: "Asha" }); Object.assign(K.S, life); K.S.at = "hastinapura"; K.go("a2_trial"); }, LIFE);
  const probs = [];
  const seen = async (sel, ms) => page.waitForSelector(sel, { timeout: ms, state: "attached" }).then(() => true, () => false);
  if (!(await seen(".beat-act", 1500))) probs.push("no act card at the start of an act");
  else if (SHOTS) await page.screenshot({ path: path.join(SHOTS, [browser._name, o.name.replace(/\s+/g, ""), o.orient[0], "act_card"].join("-") + ".png") });
  // The act card gives way to the title card by itself, after about three seconds.
  if (!(await seen(".beat-title, .beat-short", 5000))) probs.push("no title card after the act card");
  // A tap moves on; the cards are gone and the choices are there.
  for (let i = 0; i < 3 && (await page.$("#beat")); i++) { await page.mouse.click(o.w / 2, o.h / 2).catch(() => {}); await page.waitForTimeout(350); }
  await page.waitForTimeout(600);
  if (await page.$("#beat")) probs.push("cards did not give way to taps");
  if (!(await page.$("#choices .choice"))) probs.push("no choices after the cards");
  // An ordinary scene gets the short title, and fades by itself.
  await page.evaluate(() => K.prefs({ titles: "short", beats: false }));
  await goScene(page, "a2_path");
  await page.evaluate((life) => { K.prefs({ beats: true }); K.S = K.newLife({ name: "Asha" }); Object.assign(K.S, life); K.S.at = "hastinapura"; K.go("a2_trial"); }, LIFE);
  await page.waitForTimeout(350);
  if (!(await page.evaluate(() => !!document.querySelector(".beat-short")))) probs.push("short title missing with Scene titles: short");
  await page.waitForTimeout(3200); // short title (about 1 s), then the painting alone (about 1.3 s)
  if (await page.evaluate(() => !!document.getElementById("beat"))) probs.push("short title did not fade by itself");
  report.push({ browser: browser._name, device: label, screen: "act and title cards", problems: probs });

  report.push({ browser: browser._name, device: label, screen: "script errors", problems: errors.map((e) => "error: " + e) });
  await ctx.close();
}

(async () => {
  let pw;
  try { pw = require("playwright"); } catch (e) { console.error("Playwright is not installed: npm i -D playwright && npx playwright install"); process.exit(2); }
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const srv = await serve();
  const base = "http://127.0.0.1:" + srv.address().port;
  const report = [];
  const ran = [];
  for (const name of BROWSERS) {
    let browser;
    try { browser = await pw[name].launch(); } catch (e) { console.log("· " + name + ": not installed here, skipped (" + e.message.split("\n")[0] + ")"); continue; }
    browser._name = name;
    ran.push(name);
    for (const d of DEVICES) {
      if (ONLY && d.kind !== ONLY) continue;
      if (DEVICE && !d.name.toLowerCase().includes(DEVICE.toLowerCase())) continue;
      for (const o of shapes(d)) {
        const mark = report.length;
        try { await runDevice(browser, base, o, report); }
        catch (e1) {
          // A test browser that falls over (it happens to WebKit on small CI machines) gets one more go.
          report.length = mark;
          if (!browser.isConnected()) { browser = await pw[name].launch(); browser._name = name; }
          try { await runDevice(browser, base, o, report); continue; } catch (e) { var e2 = e; }
          const e = e2; report.push({ browser: name, device: o.name + " " + o.orient, screen: "run", problems: ["run crashed: " + e.message.split("\n").slice(0, 8).join(" / ")] }); }
      }
    }
    await browser.close();
  }
  srv.close();
  const bad = report.filter((r) => r.problems.length);
  for (const r of bad) console.log("✗ " + r.browser + " · " + r.device + " · " + r.screen + "\n    " + r.problems.join("\n    "));
  console.log("\n" + (report.length - bad.length) + "/" + report.length + " checks passed in " + (ran.join(", ") || "no browser"));
  // On GitHub, the failures also go up as annotations (readable through the API), grouped by
  // screen and problem with the devices listed, since a step may carry only 10 of each level.
  if (process.env.GITHUB_ACTIONS && bad.length) {
    const groups = new Map();
    for (const r of bad) for (const pr of r.problems) {
      const key = r.screen.replace(/ \(.*\)$/, "") + ": " + pr.replace(/\d+(\.\d+)?/g, "#");
      if (!groups.has(key)) groups.set(key, { n: 0, ex: pr, where: [] });
      const g = groups.get(key); g.n++; g.where.push(r.device.replace(/ \(.*\)$/, ""));
    }
    const list = [...groups.entries()].sort((a, b) => b[1].n - a[1].n);
    const esc = (t) => t.replace(/%/g, "%25").replace(/\r/g, "").replace(/\n/g, "%0A");
    list.slice(0, 30).forEach(([key, g], i) => {
      const level = i < 10 ? "error" : i < 20 ? "warning" : "notice";
      console.log("::" + level + " title=" + esc(ran.join(",") + " " + key.split(":")[0]) + "::" + esc(g.n + "× " + key.split(": ").slice(1).join(": ") + " | e.g. " + g.ex + " | on: " + [...new Set(g.where)].join(", ")));
    });
  }
  process.exit(bad.length || !ran.length ? 1 : 0);
})();
