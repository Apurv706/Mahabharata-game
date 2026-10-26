const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const DIR = __dirname, name = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.setContent("<!doctype html><body></body>");
  await p.addScriptTag({ content: fs.readFileSync(path.join(DIR, "synth.js"), "utf8") });
  await p.addScriptTag({ content: fs.readFileSync(path.join(DIR, "songs.js"), "utf8") });
  const out = await p.evaluate(async (name) => {
    const sr = 44100, ctx = new OfflineAudioContext(2, sr * 90, sr);
    const end = window.SONGS[name](ctx);
    const buf = await ctx.startRendering();
    const n = Math.min(buf.length, Math.ceil(end * sr)), L = buf.getChannelData(0), Rc = buf.getChannelData(1);
    let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(Rc[i]));
    const norm = peak > 0 ? 0.89 / peak : 1; // normalise to about -1 dBFS
    const pcm = new Int16Array(n * 2); for (let i = 0; i < n; i++) { pcm[2 * i] = Math.max(-32767, Math.min(32767, L[i] * norm * 32767)); pcm[2 * i + 1] = Math.max(-32767, Math.min(32767, Rc[i] * norm * 32767)); }
    const u = new Uint8Array(pcm.buffer); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return { b64: btoa(s), end, peak, n };
  }, name);
  const raw = Buffer.from(out.b64, "base64");
  const hdr = Buffer.alloc(44); hdr.write("RIFF", 0); hdr.writeUInt32LE(36 + raw.length, 4); hdr.write("WAVEfmt ", 8); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(44100, 24); hdr.writeUInt32LE(44100 * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write("data", 36); hdr.writeUInt32LE(raw.length, 40);
  fs.writeFileSync(path.join(DIR, name + ".wav"), Buffer.concat([hdr, raw]));
  console.log(name, "length", out.end.toFixed(1) + "s", "raw peak", out.peak.toFixed(2), errs.join("; ") || "ok");
  await b.close();
})();
