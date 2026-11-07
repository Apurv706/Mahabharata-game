# Art brief: the homeland map, painted (7 November)

*Kurukshetra: A Life.* A new life begins on a map: "where were you born?" The map fills the screen, and the player taps one of eight homelands. Today the map is drawn in code: a parchment subcontinent, rivers, and (since 7 November) mountains with snow, forests, dunes, waves, a small drawing at each homeland, boats, birds, a compass rose and a title panel. The owner asked whether a painted background would work. It would. This brief asks for **one painting of the land and seas**, laid under the game's own pins and names.

## What is painted, and what stays in the game's code

| Painted (this brief) | Drawn by the game on top (unchanged) |
|---|---|
| The land and the seas of the subcontinent, in the guide's exact shape | The eight homeland pins and their names, in English and Hindi |
| Relief: the Himalaya and the Hindu Kush with snow, the Aravalli and Vindhya hills, the Deccan, the Western Ghats | The chosen land's highlight |
| The Thar desert and its dunes | The compass rose and the title panel with its words ("Bharatavarsha, the lands of the epic") |
| Forests: the Nishadas' forest south of the Yamuna, the Terai under the Himalaya, the east toward Anga, the Ghats | The moving pieces: boats on the Ganga, birds, the light running along the rivers |
| Rivers in blue ink: the Indus and its five tributaries, the dried Sarasvati as a pale bed, the Yamuna, the Ganga to its delta, the Chambal, the Son, the Narmada | The double rule round the map |
| Waves on the Western and Eastern seas | |
| Optional: small painted vignettes near (not on) the homelands: a palace for Hastinapura, a fire altar for Panchala, horses for Matsya, cattle for Mathura, an elephant for Anga, a chariot for the charioteers' Champa, huts for the Nishada village, a camel for Gandhara | (When the painting has them, the game's drawn mountains, forests, dunes and vignettes are switched off.) |

## Style

- **An old Indian hand-painted map, not a satellite view.** Think of 18th-century Rajasthani and Pahari topographic and pilgrim maps: gouache on aged paper, seen from above, with mountains as rows of rounded peaks with snow caps and a shaded side, forests as clusters of single trees, water in fine wave lines, rivers as winding ink ribbons.
- **Palette** matching the code drawn on top: parchment land (around #ead9b0), a soft blue-green sea (around #a9c0bb), dark brown ink lines (around #3b2414 and #7a5634), small touches of the game's madder red and gold. A faint paper grain; an even light, no strong shadows.
- **Calm, so names read on it:** fine detail, low contrast, nothing busy near the homelands.
- Same warmth as the game's other paintings, but this one is an object (a map), not a scene.

## Must

1. **The guide's shape.** Coasts and rivers follow `homeland_map_lines.png` to within about 1% of the width (about 25 px). The painting covers the canvas edge to edge.
2. **The homelands in the right places** (red on `homeland_map_guide.png`):
   - Hastinapura on the upper Ganga's west bank.
   - Panchala between the Ganga and the Yamuna.
   - Mathura on the Yamuna's west bank.
   - Matsya west of the Yamuna.
   - Gandhara beyond the Indus, in the northwest hills.
   - Anga on the Ganga in the east, with the charioteers' Champa just south of it.
   - The Nishada village south of the Yamuna, at the forest's edge.
3. **Quiet rings.** Inside each red ring on the guide (about 90 px across the radius), only plain land, water or a river: no peaks, trees or vignettes. The pin and its name sit there.
4. **Nothing written.** No text, letters or numbers, no compass, no frame or border, no pins, no modern borders.
5. **Where the eye goes.** Most screens show the north: the band from Gandhara to the Ganga's mouth (rows 100 to 450 on the guide's grid). Spend the most care there. The south is only seen when the map slides up on a phone; paint it, more simply.

## Needed

| File | Format | Notes |
|---|---|---|
| `art/map_bharat.webp` | 2574 × 3016 px (upright), covering the guide edge to edge | Up to about 1.2 MB (we compress) |
| `assets/art_src/map_bharat.png` (or .psd) | The master, same size | Separate layers are welcome (sea, land, relief, forests, rivers, vignettes) |

The canvas is the game's map units −60 to 930 across and −60 to 1100 down, at 2.6 px a unit. The game shows a window of it to fit each screen (upright on a phone, wide on a laptop) and slides it up when a land's card rises.

## Files for the artist (this folder)

- `homeland_map_lines.png`: the coasts and rivers only, black on white, at full size. Use it as the control image for an image tool.
- `homeland_map_guide.png`: the same at full size, with a 100-unit grid. The homelands' pins and names are in red, inside the rings to keep quiet. Today's drawn mountains, forests and dunes show faintly, as suggestions.
- `homeland_map_today.png`: today's drawn map at full size, which the painting replaces.
- `pins.json`: each homeland's spot, in map units and in pixels on the canvas.

## A prompt for an image tool (to adapt)

> A hand-painted antique map of ancient India (Bharatavarsha), in the style of an 18th-century Rajasthani gouache map on aged paper, seen from directly above. Warm parchment land, soft blue-green seas with fine wave lines, the Himalaya as rows of stylised rounded peaks with snow caps and a shaded side, the Thar desert with small dunes, forests drawn as clusters of small round trees, the Indus, Yamuna and Ganga winding to the sea in blue ink, low hills of the Vindhya. Delicate dark-brown ink outlines, even light, highly detailed but calm, no text.

Use `homeland_map_lines.png` as the control (line art or edges), so the coasts and rivers land in place. Negative prompt: text, letters, numbers, labels, compass rose, frame, border, modern borders, roads, satellite photo, 3D render, people.

## Not for the artist

- **Wiring:** the painting goes in as an image under the pins in `U.homeMap` (ui/map.js), in map units −60…930 × −60…1100. When it is there, the drawn relief, forests, dunes, waves and vignettes switch off. The boats, birds, river light, compass and title panel stay. Calm motion is unchanged.
- **Files:** Part One's file list gains one file (about 1 MB). Part Two is unchanged, because the map is only at the start.
- **Checks:**
  - Overlay the guide on the painting at 50%: coasts and rivers within about 25 px.
  - Screenshots on an iPhone SE, an iPhone 15 and a laptop, in English and Hindi.
  - The layout check keeps every pin on screen and its name readable.
