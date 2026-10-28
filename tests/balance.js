/* Combat balance: plays many lives with a careful player (guards against heavy blows, heals when
   hurt, uses specials, meets blows as an attentive player would) and reports how often each fight is
   won. Target (Rebuild decisions §6): about 60-70% in an even fight, about 40% in a hard one.
   Usage: node tests/balance.js [lives] */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");
const N = parseInt(process.argv[2] || "120", 10);
const GAME = path.join(__dirname, "..", "game");
const html = fs.readFileSync(path.join(GAME, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const stats = {};
function life(seed) {
  const dom = new JSDOM(html.replace(/<script src="[^"]+"><\/script>/g, ""), { runScripts: "outside-only", pretendToBeVisual: true, url: "https://localhost/", virtualConsole: new VirtualConsole() });
  const w = dom.window, d = w.document;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  let s = seed >>> 0; w.Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (const src of scripts) w.eval(fs.readFileSync(path.join(GAME, src), "utf8"));
  const K = w.K; K.headless = true; K.seed(seed);
  K.Combat.humanDefense = { counter: 0.12, block: 0.5 };
  if (process.env.TOUGH) { const [h, a] = process.env.TOUGH.split(","); K.Combat.TOUGH = { hp: +h, atk: +a }; }
  if (process.env.HARD) { const [h, a] = process.env.HARD.split(","); K.Combat.HARD = { hp: +h, atk: +a }; }
  const pick = (a) => a[Math.floor(w.Math.random() * a.length)];
  d.getElementById("btn-new").click();
  pick([...d.querySelectorAll("#origins .origin")]).click(); d.getElementById("land-ok").click();
  pick([...d.querySelectorAll("#pron .opt")]).click(); pick([...d.querySelectorAll("#temps .pick")]).click(); pick([...d.querySelectorAll("#heirs .pick")]).click();
  d.getElementById("begin").click();
  K.on("combat", (B) => { if (B.over && !B._c) { B._c = true; const k = B.enc.id + (B.enc.hard ? " (hard)" : ""); const r = (stats[k] = stats[k] || { win: 0, lose: 0, other: 0, hard: !!B.enc.hard, lethal: !!B.enc.lethal }); r[B.over === "win" ? "win" : B.over === "lose" ? "lose" : "other"]++; } });
  for (let step = 0; step < 4000; step++) {
    if (d.getElementById("again")) return;
    const acts = [...d.querySelectorAll("#battle-actions .act:not([disabled])")];
    if (acts.length) {
      const C = K.Combat, B = C.state(), p = C.player();
      const label = (a) => a.textContent;
      const threat = B.units.filter((u) => u.side === "enemy" && u.hp > 0).map(C.threat).filter(Boolean);
      const heavy = threat.some((t) => t.heavy);
      const herbs = acts.find((a) => label(a).includes("Healing herbs"));
      const guard = acts.find((a) => label(a).includes("Guard"));
      const special = acts.filter((a) => a.classList.contains("special"));
      const last = B.habit[B.habit.length - 1];
      let c;
      if (p.hp < p.maxHp * 0.35 && herbs) c = herbs;
      else if (heavy && guard && !(last && last.id === "guard") && p.hp < p.maxHp * 0.7) c = guard;
      else if (special.length) c = special[0];
      else c = acts[0];
      c.click(); continue;
    }
    const choices = [...d.querySelectorAll("#choices .choice:not([disabled])")].filter((b) => !b.classList.contains("picked"));
    const cta = [...d.querySelectorAll("#leaf .cta")].filter((b) => !b.disabled);
    if (choices.length) pick(choices).click(); else if (cta.length) cta[0].click(); else return;
  }
}
for (let i = 1; i <= N; i++) life(i * 104729);
const rows = Object.entries(stats).sort((a, b) => (b[1].win + b[1].lose) - (a[1].win + a[1].lose));
let ev = [0, 0], hd = [0, 0];
for (const [k, r] of rows) { const n = r.win + r.lose; (r.hard ? hd : ev)[0] += r.win; (r.hard ? hd : ev)[1] += n; console.log(k.padEnd(26) + String(r.win).padStart(4) + " /" + String(n).padStart(4) + "  " + (n ? Math.round((r.win / n) * 100) : 0) + "%" + (r.lethal ? "  deadly" : "")); }
console.log("Even fights: " + Math.round((ev[0] / ev[1]) * 100) + "% won · hard fights: " + (hd[1] ? Math.round((hd[0] / hd[1]) * 100) + "%" : "none") + " won");
