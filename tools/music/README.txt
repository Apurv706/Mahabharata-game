Renders the three music pieces offline in headless Chromium.

  node tools/music/render.js vijaya   (or chakravyuha, dharmayuddha) -> tools/music/<name>.wav
  ffmpeg -i tools/music/<name>.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -b:a 128k game/music/<name>.mp3

Needs playwright. Melodies are original, written in ragas Bhairavi (Vijaya and Dharmayuddha) and Purvi (Chakravyuha).
