# UI style — Kurukshetra: A Life

The game's interface follows the design-taste-frontend (tasteskill v2) rules for app screens, adapted to a story game. Check new UI against this page, and run the skill's lint on `game/css`, `game/index.html` and `game/js/ui` before committing (it should report 0 FAIL, 0 WARN).

## Direction

The screen is an old Indian manuscript folio. The paintings carry the colour; the interface frames them the way a manuscript or a Kalamkari cloth frames its pictures.

| Token | Value | Use |
|---|---|---|
| `--ground` | #2a120f madder red | The page, printed with a faint gold lotus buti (`css/buti.svg`, block-print style) |
| `--surface` | #371a15 | The folio (the scene) and the side panel |
| `--raised` / `--hover` | #47241d / #562e25 | Choices, cards, controls; one tone step up on hover |
| `--ink` / `--muted` / `--faint` | #f7ead3 / #e0c7a6 / #c3a585 | Text in three tiers, all above 4.5:1 on every panel |
| `--fresh-ink` | #ff6a3d | Letters the quill has just written sparkle red-gold, then settle to ivory |
| `--accent` | #f0943f saffron | Only what you can do: the main button, the selection, focus |
| `--data` | #e2b55a gold | The duty meters, canon markers and the ornaments |
| `--positive` / `--negative` | #7fcfa6 / #ff8a6e | Rises and falls in choices, health bars, curses |

Ornaments, all in gold line:
- A torana fringe (`css/torana.svg`, a rule with hanging scallops and beads) where a painting meets its text, and along the top of the side panel, the act strip and dialogs.
- A double gold rule framing the canon panel ("What happens, whatever you do"), like a manuscript page border.
- The app icon (chariot wheel and lamp) beside the wordmark.
- The title is the ivory logo (`brand/logo_en_dark.svg` or `brand/logo_hi_dark.svg`, by language) over the key art.
- Round gold-ringed portraits, free-standing emblems and small painted teacher cards on their choices.

## Rules

- Every string the player sees goes through `K.tr` (interface) or `K.text` / `U.t` (story). Write whole sentences, never glue fragments together, so each one translates as a unit.

- Separate surfaces with a tone step and the gold ornaments, never a plain grey outline or a shadow. Only the dialog casts a shadow.
- No decorative gradients. The one exception is the scrim under a caption on a painting, in the ground or surface colour.
- A scene with no painting yet shows a flat field in its own colour with its caption set large, never a gradient.
- Labels are sentence case at 14px or more. No tiny uppercase labels, no pill badges above headings.
- Whether a scene is canon, your life or the war is said in words in the picture's caption.
- Key numbers on choices are quiet and hidden on touch screens.
- Every motion uses transform, opacity or clip-path, and has a reduced-motion fallback.
- Story screens reveal in order (`U.stage`): painting, title, each line, then the choices. Never show choices before the scene is set. A tap, Space, Enter or a number key shows everything; the menu can turn it off.

- Timed moments use the lamp, never a numeric countdown. It pauses while a window is open or the tab is hidden.
- An enemy's next move sits under its name in small muted text; a heavy blow aimed at you turns red. Field events in the battle log are gold italic with a gold rule.
- Dice are ivory long dice with dark pips, not numerals. The class is `.dicegame` (`.game` is the page container).
- Secrets in the ledger are each marked with a red wax dot.

## Not yet checked

The skill's real-browser inspector could not run in the build environment (no Chrome). Run `node <skill>/scripts/inspect.mjs game/index.html --app` on a machine with Chrome and fix anything it reports.
