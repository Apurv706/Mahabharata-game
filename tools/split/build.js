/* Writes the two parts of the game for a host that holds at most 512 files (see part.js).
   Usage: node tools/split/build.js <out dir> <use.json> <lives.json> [part1 url] [part2 url] [--war=<war lives.json>]
   use.json: { artKey: [acts it was shown in] }, recorded from playthroughs; lives.json: ready-made
   Act V lives [{ name, origin, path, code }]; war lives: ready-made lives on the eve of the war
   [{ name, origin, path, side, code }] from tools/split/gen_war.js (default tools/split/war_lives.json,
   if it is there). Writes <out>/part1/, <out>/part2/ (index.html and
   part.js) and <out>/partN.files.json (published path -> source path) for each. */
const fs = require("fs"), path = require("path"), cp = require("child_process");
const args = process.argv.slice(2), flag = (k) => (args.find((a) => a.startsWith("--" + k + "=")) || "").split("=").slice(1).join("=");
const [out, useFile, livesFile, url1, url2] = args.filter((a) => !a.startsWith("--"));
const warFile = flag("war") || path.join(__dirname, "war_lives.json");
const war = fs.existsSync(warFile) ? JSON.parse(fs.readFileSync(warFile, "utf8")) : [];
const ROOT = path.join(__dirname, "..", ".."), G = path.join(ROOT, "game");
const use = JSON.parse(fs.readFileSync(useFile, "utf8")), lives = JSON.parse(fs.readFileSync(livesFile, "utf8"));
const all = cp.execSync("git ls-files game", { cwd: ROOT }).toString().trim().split("\n").map((f) => f.slice(5)).filter((f) => fs.existsSync(path.join(G, f)));
const isAsset = (f) => /^(art|video|music)\//.test(f);
const keyOf = (f) => path.basename(f).replace(/(_wide|_tall)?\.\w+$/, "");
const read = (f) => fs.readFileSync(path.join(G, f), "utf8");
const P1 = /^(act1|roots|act2|act3|act4)$/, P2 = /^(act5|act6a|act6b|command|act7|war_\w+)$/;
const content = fs.readdirSync(path.join(G, "js/content")).map((f) => [f.replace(/\.js$/, ""), read("js/content/" + f)]);
// Shown on the title screen, the character sheet or anywhere in a life: both parts.
const title = read("js/ui/screens.js");
// A moment (ui/moments.js) can play in any act: a vow taken in Act VII is shown over scene_vow, a divine weapon given
// in Act III over moment_astra, a friendship ended in the war over its friend's painting.
const moments = read("js/ui/moments.js");
const always = (k) => /^(p_|path_|vow_|temper_|heir_|teacher_|diya|home_|moment_)/.test(k) || title.includes('"' + k + '"') || moments.includes('"' + k + '"') || /^end_(death|cut_short)$/.test(k);
function parts(f) {
  if (!isAsset(f)) return [1, 2];
  if (f.startsWith("music/")) return [1, 2];
  const k = keyOf(f);
  if (always(k)) return [1, 2];
  const acts = use[k] || use[k + "_wide"] || use[k + "_tall"];
  const p = new Set();
  if (acts) { if (acts.some((a) => a <= 4)) p.add(1); if (acts.some((a) => a >= 5)) p.add(2); }
  const re = new RegExp("[\"'/]" + k + "[\"'.]");
  // Content used across acts (episodes, events, tests, vows, divine weapons): both, to be safe.
  for (const [n, t] of content) if (re.test(t)) { if (P1.test(n)) p.add(1); else if (P2.test(n)) p.add(2); else { p.add(1); p.add(2); } }
  if (!p.size) { p.add(1); p.add(2); }
  return [...p];
}
const LIMIT = 512;
for (const n of [1, 2]) {
  const dir = path.join(out, "part" + n); fs.mkdirSync(dir, { recursive: true });
  const cfg = { n, other: n === 1 ? url2 || "" : url1 || "", lives: n === 2 ? lives : [], war: n === 2 ? war : [] };
  const html = read("index.html").replace('<script src="js/main.js"></script>',
    "<script>window.K_PART = " + JSON.stringify(cfg) + ';</script>\n<script src="part.js"></script>\n<script src="js/main.js"></script>');
  fs.writeFileSync(path.join(dir, "index.html"), html.replace("<title>Kurukshetra: A Life</title>", "<title>Kurukshetra: Part " + (n === 1 ? "One" : "Two") + "</title>"));
  fs.copyFileSync(path.join(__dirname, "part.js"), path.join(dir, "part.js"));
  let files = all.filter((f) => f !== "index.html" && parts(f).includes(n));
  // Clips are the first to go if a part is over the limit (the painting stays without one).
  const room = LIMIT - 2;
  if (files.length > room) { const vids = files.filter((f) => f.startsWith("video/")); const drop = new Set(vids.slice(0, files.length - room)); files = files.filter((f) => !drop.has(f)); }
  const map = { "part.js": path.join(dir, "part.js") };
  for (const f of files) map[f] = path.join(G, f);
  fs.writeFileSync(path.join(out, "part" + n + ".files.json"), JSON.stringify(map, null, 1));
  const c = (re) => files.filter((f) => re.test(f)).length;
  console.log("part " + n + ": " + (files.length + 2) + " files (art " + c(/^art\//) + ", video " + c(/^video\//) + ", music " + c(/^music\//) + ")");
}
