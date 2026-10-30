/* Lists every string in tests/strings.json that has no translation yet, as JSON lines {id, en, ctx},
   for the translator. Usage: node tools/missing-i18n.js hi > missing.jsonl */
const fs = require("fs");
const path = require("path");
const lang = process.argv[2] || "hi";
const ROOT = path.join(__dirname, "..");
const strings = JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "strings.json"), "utf8"));
const dir = path.join(ROOT, "i18n", lang);
const byId = {};
for (const f of fs.readdirSync(dir).filter((f) => /^part\d+\.json$/.test(f)).sort()) Object.assign(byId, JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
let manual = {};
// manual.json and any manual_*.json (one per workstream), keyed by the English text.
for (const f of fs.readdirSync(dir).filter((f) => /^manual(_[\w-]+)?\.json$/.test(f)).sort()) { try { Object.assign(manual, JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))); } catch (e) { /* skip a bad file */ } }
for (const s of strings) if (byId[s.id] == null && manual[s.en] == null) console.log(JSON.stringify(s));
