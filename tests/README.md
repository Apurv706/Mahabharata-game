# Tests

Everything runs through one runner, `tests/run.js`, in two tiers. Each check is a script in this folder that can also
be run alone (its header comment says what it checks and how to run it).

```
npm test                          # quick tier (node tests/run.js quick), 1-2 minutes (under a minute on CI)
npm run test:full                 # full tier (node tests/run.js full), under 40 minutes on a 4-core runner
node tests/run.js full --only layout,battlefit --browser all
node tests/run.js quick --list    # what each tier runs
```

Options: `--only a,b` / `--skip a,b` (a check's name, or the part before `#`: `playthrough` is all six parts),
`--browser chromium|webkit|firefox|all` (for layout and battlefit, which run in several engines; the rest use
Chromium), `--jobs N` (checks at a time), `--browser-jobs N` (of those, how many in a browser, default 1; a browser
check never runs beside a memory-heavy one: the jsdom playthroughs, the lives batches, content, bands),
`--out DIR` (logs, JSON and images; default `tests/out/`, or `$REGRESS_OUT`), `--report FILE`.

At the end the runner prints a table: each check, **PASS**, **FAIL**, **FLAKY** (a browser check that failed, was run
again on just its failing cases, and passed), **KNOWN** (it failed only on failures listed in
`tests/known_failures.json`) or **SKIP** (Playwright missing), with its time. The JSON report
(`<out>/report-<tier>.json`) has the same, plus the command, the re-run and the last lines of any failure; each check's
whole output is in `<out>/logs/`. The exit code is 1 only when something FAILs.

## What each tier runs

| Check | Quick | Full | What it is |
|---|---|---|---|
| rules | ✓ | ✓ | `rules.js`: the rules of vows, weapons, friendships, fights, real time |
| lives | 200 | 600 | `lives.js`: random lives through the engine (saves, Continue, unfilled text, both sides, real-time bot) |
| lives-turns | 300 | 1500 | the same with every fight on the turns |
| crossing | 200 | 400 | `crossing.js`: lives that cross the field at Yuyutsu's call |
| content | small | 2000 lives, 24 page lives | `content.js`: targets, reachability, pictures/clips/music on disk and in both split parts, unfilled tokens (English and Hindi), the Hindi build |
| golden | ✓ | twice | `golden.js`: 16 seeded lives against `baselines/golden.json`; full also checks two runs are identical |
| bands | 400 lives | 2400 lives | `bands.js`: per-fight win rates, real time and turns, against `baselines/bands.json` |
| bugs | engine cases | all | `bugs.js`: one check per fixed bug (engine, and the browser in full) |
| weapons | ✓ | ✓ | `weapons.js`: the right weapon in every hand (jsdom) |
| facefit | ✓ | ✓ | `facefit.js`: nothing held covers a face (the quick tier's one browser check) |
| saves | engine | + browser | `saves.js`: old save codes and stored lives (main, older commits, now) load and play on |
| command | | 100 lives | `command.js`: the war as a commander |
| playthrough#1-6 | | 6 × 50 lives | `playthrough.js` through the real interface (jsdom), 300 lives in parts (`--from`) |
| playthrough-story#1-3 | | 3 × 50 | the same in story mode |
| strings-hi | | 40 lives | `strings.js check hi`: Hindi coverage during play |
| balance, race-balance, rtsim | | report | balance reports (always pass; `bands` is the check) |
| rtfit, warfit, blowfit | | ✓ | the real-time and war-day screens in the browser |
| layout#phone/tablet/desktop | | ✓ | `layout.js`: every screen on real device sizes |
| battlefit | | ✓ | `battlefit.js`: every fight's figures stay on stage (three fights at a time) |
| visual | | ✓ | `visual.js`: screenshots against `baselines/shots/` |
| smoke | | ✓ | `smoke.js`: the built play pages (both parts) played with real taps |

CI (`.github/workflows/regression.yml`) runs the quick tier on pushes to `main` and on every pull request (not on
pushes to work branches, whose baselines move while they are worked on), and the full tier nightly
(scheduled runs only fire from the default branch, so the nightly run starts once the workflow is on `main`) and by
hand (Actions → Regression → Run workflow, with a choice of tier and browser). Reports, logs and visual diffs are
uploaded as artifacts. The older workflows (`engine.yml`, `screen-fit.yml`) still run as before.

## Baselines, and accepting a change

Three checks compare against stored results. After a deliberate change, look at what moved, then accept it:

- **Golden lives** (`baselines/golden.json`): a failure prints, for each changed life, where it first went another way
  (the scene, the choice, the fight and the final stats). `node tests/golden.js --accept` (or `--accept --only name`).
- **Balance bands** (`baselines/bands.json`): a failure names the fight, its rate and its band.
  `node tests/bands.js --tier quick --accept` and `node tests/bands.js --tier full --accept` (the full one takes a few
  minutes). Bands are the recorded rate ± 8 points (or 3 standard errors if wider), overall ± 4 points.
- **Visual** (`baselines/shots/`): a failure writes the baseline, the new shot and a map of the changed pixels (red)
  to `<out>/visual/<screen>-<device>-<lang>.diff.jpg`. `node tests/visual.js --accept` (all) or
  `--accept --case story-15-hi,map-laptop-en`. Shots are taken with the fonts in `fixtures/fonts/`, Calm motion and a
  seeded game, so they only change when the game does; the tolerance is `--tolerance` (share of pixels, default 1.5%).
  Baselines made on one machine may differ slightly on another (font rasterising): accept them from the CI artifact
  if CI disagrees with local runs.

Other fixtures: `fixtures/split/` (the split build's inputs: which acts each painting is shown in, the ready-made Act V
and war lives; the smoke test reads `SPLIT_USE`, `SPLIT_LIVES`, `SPLIT_WAR` to use others), `fixtures/saves/`
(`node tests/saves.js --make main a14bb21 current` writes them again from those versions, in a temporary worktree),
`content_allow.json` (scenes left unreachable on purpose, each with why).

## Known failures

`known_failures.json` lists real bugs the suite has found that are not fixed yet (and the odd test that fails for a
reason that is not a bug, said so). Each entry names the check, the text it matches, the bug, the file and how to see
it. A check that fails only on listed failures is KNOWN, not FAIL; when a listed failure stops happening, the check
says so, and the entry should be taken off. The suite never changes the game to make a check pass.

## Adding a bug test

When a bug is fixed, add a case to `tests/bugs.js` next to the others:

```js
engine("short-id", "<commit>", "what was wrong, in one line", () => {
  const K = E();               // the engine and content in this process (life(), rtFight() help set one up)
  const bad = [];
  if (/* the bug is back */) bad.push("what is wrong now");
  return bad;                  // [] is a pass
});
browser("short-id", "<commit>", "what was wrong", async () => {
  const { pg, errs, close } = await open({ device: "iPhone 15", lang: "en" });   // a page on the game
  await fight(pg, "e_bandits", { path: "mace" });                                  // a fight on its screen
  const bad = [];
  // ... look at the page with pg.evaluate(...)
  await close(); return bad.concat(errs);
});
```

Run it alone with `node tests/bugs.js --case short-id`, and check it fails on the code before the fix:
`git archive <commit>^ game | tar -x -C /tmp/old && node tests/bugs.js --case short-id --game /tmp/old/game`.
