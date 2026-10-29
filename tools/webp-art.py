"""Paintings for the web: game/art/*.jpg become WebP (about half the size, same look).
The JPG originals are kept as sources in assets/art_src/. Run again after adding new JPGs to
game/art/: each new JPG is converted and moved to the sources.
Usage: python3 tools/webp-art.py"""
import os, shutil
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ART, SRC = os.path.join(ROOT, "game", "art"), os.path.join(ROOT, "assets", "art_src")
os.makedirs(SRC, exist_ok=True)
before = after = n = 0
for f in sorted(os.listdir(ART)):
    if not f.lower().endswith(".jpg"):
        continue
    src = os.path.join(ART, f)
    out = os.path.join(ART, f[:-4] + ".webp")
    im = Image.open(src).convert("RGB")
    im.save(out, "WEBP", quality=80, method=6)
    before += os.path.getsize(src); after += os.path.getsize(out); n += 1
    shutil.move(src, os.path.join(SRC, f))
print(f"{n} paintings: {before // 1048576} MB of JPG -> {after // 1048576} MB of WebP")
