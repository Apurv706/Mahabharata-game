# UI style — Kurukshetra: A Life

The game's interface follows the design-taste-frontend (tasteskill v2) rules for app screens, adapted to a story game. Check new UI against this page, and run the skill's lint on `game/css`, `game/index.html` and `game/js/ui` before committing (it should report 0 FAIL, 0 WARN).

## Direction

The screen is a lamp-lit manuscript leaf. The paintings carry the colour; the interface stays quiet around them.

| Token | Value | Use |
|---|---|---|
| `--ground` | #13110e | Soot-black page, taken from the paintings' night scenes |
| `--surface` | #1c1915 | The leaf and the ledger |
| `--raised` / `--hover` | #26221c / #312b23 | Choices, cards, controls; one tone step up on hover |
| `--ink` / `--muted` / `--faint` | #f2e8d5 / #c4b69d / #a1937b | Text in three tiers, all above 4.5:1 |
| `--accent` | #e8893a saffron | Only what you can do: the main button, the selection, focus |
| `--data` | #d4a84b gold | Only the duty meters and canon markers |
| `--positive` / `--negative` | #67b38f / #e46a4f | Rises and falls in choices, health bars, curses |

Type: Cormorant Garamond for names and titles, Alegreya Sans for everything else. No third face, no monospace.

Shape: cards 8px, controls 6px, everywhere.

## Rules

- Separate surfaces with a tone step, never a 1px outline or a shadow. Only the dialog casts a shadow.
- No gradients. The one exception is the dark scrim under a caption on a painting.
- A scene with no painting yet shows a flat field in its own colour with its caption set large, never a gradient.
- Labels are sentence case at 14px or more. No tiny uppercase labels, no pill badges above headings.
- Whether a scene is canon, your life or the war is said in words in the picture's caption.
- Key numbers on choices are quiet and hidden on touch screens.
- Every motion uses transform and opacity, and has a reduced-motion fallback.

## Not yet checked

The skill's real-browser inspector could not run in the build environment (no Chrome). Run `node <skill>/scripts/inspect.mjs game/index.html --app` on a machine with Chrome and fix anything it reports.
