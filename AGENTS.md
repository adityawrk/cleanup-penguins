# AGENTS.md

Guide for coding agents working in cleanup-penguins. It describes the tree as of 2026-11-23.
Where an issue or an older note disagrees with the source, trust the source and fix this file.

## Resume here

```sh
npm install
npm test           # vitest, tests/**/*.test.ts
npm run dev        # http://localhost:5173 (the only mode with the live disk, scan and scout)
```

Dismiss the title card (click, Enter or Escape). The pole, the cache sacks and the live scout exist only under `npm run dev`.

**Where things stand.** All four rooms are painted scenes (`src/art/*.svg`). Items are drawn objects. The scout talks through a real, tool-less Claude Code call when `claude` is on the PATH. Throws are an honest practice run: nothing is deleted, the pole does not move, and the game says so.

**Next, in order:**

1. **A real delete, safely (issue 7).** Only from the player's final sea confirm, only for `sea: true` items, only inside the scanned cache roots. After the delete finishes, re-read `/api/disk` and let the pole move from that. Turn `world.rehearsal` off only for items that were really removed. Never from the scout or chat path.
2. **More live scouts (issue 6).** Claude is wired (`src/engine/scout.ts`). Cursor (`cursor-agent`) and Codex need the same no-tools, one-line, JSON-reply contract. Until then the scout card says "Scripted". Never let a scripted scout claim to be connected.
3. **Live sheds and apps.** `look in <path>` makes a shed but scans nothing. Apps and "Your stuff" are fixtures.
4. **The Mac app (issue 5).** Leave it until 1 is true.

## What this is

A Mac disk cleanup tool that plays like a late-2000s kids' MMO. You are a penguin on a snowy harbor, a scout bird follows you, and you carry junk to the sea or the Locker.

- **Quay** (`quay.svg`): three moored boats are the holds: Caches (red trawler), Applications (blue tug) and Your stuff (green sailboat). The Locker warehouse is on the left and the Glasshouse greenhouse on the right. The tide board shows free space. The bell maps the whole Mac. The nest is the scout's home, and the sheds are repos.
- **Hold** (`hold.svg`): a ship's belly with the cargo on the floor. The steel footlocker on the left is the Locker bin ("comes back"). The cargo door on the right opens to the sea ("gone for good"). The ladder goes up to the quay.
- **Locker** (`locker.svg`): the inside of the warehouse. Kept things stand in numbered bays. The red hopper tips everything into the sea, after two confirms. The roll door goes back out.
- **Glasshouse** (`glasshouse.svg`): look but don't touch. macOS, the Docker disk and Photos are exhibits behind a rope.
- **Scout**: one at a time. The scout card (dock button or the nest) picks the scout, the model and the effort. Claude offers Fable, Opus and Sonnet. Codex offers Astra, Sol and Terra. Cursor offers Grok 4.7, 4.6 and 4.5. Antigravity (typed as a custom name) offers Neon, Carbon and Argon. OpenCode uses Default. Effort is shown as fish: Low, Medium, High (the default) and Extra high scale the scout 0.72, 1, 1.28 and 1.58. High and above pin the info sheet when you lift something.
- **Steering**: while the scout is on a look (`world.tool`), new lines queue in `world.steering` and show as "After {look} · {line}". `finishTool` writes them to the brief and acts on the newest one.
- **Flourish**: the dock has emotes, and D dances (the scout joins in when close). Clicking your penguin opens your card. Idle, the penguin waves, hops, wiggles, then sits. Walking away from the camera shows its back.

## Rules that must not be broken

1. **The agent never deletes.** The scout only advises. The live scout runs with `--tools ""`: it can't list, run, move or delete. Its reply is checked in `clean()`: unknown item ids are dropped, a sea pointer for a `sea: false` item becomes the Locker, and a claim of having thrown something is replaced. A future delete route must accept only the player's final sea confirm.
2. **The sea takes two confirms.** Face 1 asks. Face 2 gets focus on No, stays locked for 800ms (`lockedUntil`), and reverses its buttons (`#card.face-2 .card-actions`). Emptying the Locker uses the same two faces.
3. **Only sea-safe things reach the sea.** `sea: false` items (apps, your stuff, `node_modules`) are redirected to a Locker card that says "The chute won't take this."
4. **The Locker gives things back.** Carrying a Locker item out through the roll door asks "Put X back?". Locker moves never move the pole.
5. **The pole is honest.** It shows real free space (`statfs`). While `world.rehearsal` is true (always, today), throws add to `world.rehearsedTenths` and never to `freeTenths`. The second card, the scout and the player card all say it's practice.
6. **The scout's words are true.** It never claims to be connected, to have scanned or to have deleted unless that happened. The scout card shows "Live · Claude Code on this Mac" only when `/api/agents` found `claude`.
7. **Original art and sound.** Use no other game's assets, names, characters, rooms or sounds, and don't trace them. Match the craft (see `docs/art.md`). Every visual is inline SVG (room files injected by `main.ts`, plus templates in `index.html`) or CSS. Every sound is synthesized in `src/audio.ts`. Fonts are Fredoka and IBM Plex Mono, self-hosted from `@fontsource` (latin only). No raster images.

## Quality bar

The bar is a polished kids' MMO: dense rooms of recognizable objects, small characters in a big place, glossy chunky UI, and constant small life (bobbing boats, puffing smoke, a swinging bell, gulls, a fish swimming past a porthole). Read `docs/art.md` before drawing anything. A change isn't done because it works. Screenshot it and compare it with `quay.svg`.

## Run, test, look

```sh
npm run build                                       # tsc --noEmit && vite build -> dist/
node scripts/svgview.mjs src/art/hold.svg /tmp/h.png # render one art file with the game fonts
node scripts/shot.mjs http://localhost:5173/ /tmp/run steps.json   # drive the game headless and screenshot
```

`scripts/shot.mjs` steps are `{wait}`, `{key}`, `{click:[x,y]}`, `{type}`, `{eval}` and `{shot}`, at 1280 by 800. Both scripts use `puppeteer-core` against `/Applications/Google Chrome.app`. For a blind art test, `eval` this before a shot: `document.querySelectorAll('svg text, .tag, .name, .bubble, .shed-sign, .bell-tag, .pole, #mini, .path-sign, #console, .item-art .stamp').forEach(e => e.style.visibility = 'hidden')`, then ask a fresh agent to name every object. `scripts/hello/gen.mjs` rebuilds the title art from the character templates and the quay boat. Rerunning it overwrites hand edits to `hello.svg`.

The tests:
- `tests/sim.test.ts` drives `World` with explicit time (`settle()` steps every 16ms). It covers the bell and repo scope, both sea faces, practice throws leaving the pole alone, apps redirected to the Locker, refusing a card, the Glasshouse rope, one scout, no throwing from chat, switching scouts, brief matching, walking up before lifting, model lists and default effort, notes handed to the next scout, the steering queue, and waddling while the scout is out.
- `tests/scout.test.ts` covers the live reply check (`clean`): unknown ids dropped, sea pointers for `sea: false` items turned into the Locker, claimed deletes replaced, and the length cap.
- `tests/scan.test.ts` covers `parseDu`.
- The sim tests also cover the live path: `'ask'` only when Claude is found, questions never noted, `liveReply` with queued lines, `liveFailed`, and a practice Locker empty.
- Nothing tests `readDisk`, `scanCaches`, spawning `claude`, `main.ts` or the DOM. Check those in the browser.

Keep `src/sim.ts` free of the DOM and of clocks. Time comes in as `now`.

## Code map

| File | What it holds |
|---|---|
| `index.html` | The stage, four room sections (each `.paint` + `.ground` + `.objects` + optional `.paint.fore`), the dock, the cards (`#card`, `#who` scout card, `#me` player card), the title card, and the character templates (`tpl-you`, `tpl-claude`, `tpl-codex`, `tpl-cursor`, `tpl-custom`). Each template's face parts are in `<g class="face">` so the back view can hide them. |
| `src/art/*.svg` | The painted rooms (1280×708) and the title art (760×470). Clickable groups are `.hot` with `data-act`. Live text has ids (`label-caches`, `label-apps`, `label-stuff`, `locker-count`). |
| `src/sim.ts` | Game state and rules: `World`, fixtures, `SPOTS`, `BANDS`, `shedSlot`, `advice`, `say` (returns a `SayKind`), `liveReply`, `liveFailed`, cards and `answer`, `step`, `useRealDisk`, `useRealCaches`. |
| `src/main.ts` | Injects the art, copies `World` to the DOM each frame, handles input, sounds, emotes, the room iris, the scout and player cards, `loadThisMac()`, `findAgents()` and `askScout()`. |
| `src/items.ts` | The drawn item objects (sack, packed bundle, crate, trunk, disc), `sizeScale()` and the stamp text. |
| `src/emotes.ts` | The emote icons. |
| `src/audio.ts` | `HarborAudio`: a master bus, per-room ambience, footsteps by floor, bell, splash, flap clatter, chirps. Unlocked on the first click. |
| `src/style.css` | All layout, UI and animation. Honors `prefers-reduced-motion`. |
| `src/engine/scan.ts` | Node only: `readDisk`, `scanCaches`, `parseDu`. |
| `src/engine/scout.ts` | Node only: `detectAgents`, `askClaude` (the tool-less live scout) and the reply check. |
| `vite.config.ts` | Dev middleware: `GET /api/disk`, `GET /api/scan`, `GET /api/agents`, `POST /api/scout`. Also `__USERNAME__` (the macOS username, used as the penguin's name). |
| `docs/art.md` | The art guide: ink, line weights, cel shading, palette, layers, ids, scale. |
| `scripts/` | `svgview.mjs` and `shot.mjs`, the look-at-it tools. |

Units: sizes are tenths of a decimal GB (1 tenth = 1e8 bytes). The stage is 1280×708. `#fit` is 1280×800 and zooms to fit the window. Sprites are drawn large and shown at `YOU_SIZE` 0.56 and `SCOUT_SIZE` 0.46, times a depth factor. Names, bubbles and tags are counter-scaled with `--inv` so text stays a constant size.

Keys: E or F walks to and lifts the nearest item in the room, X goes to the sea, B goes to the Locker bin, Y or N answers a card, Enter presses the highlighted button, and Esc drops, says No or closes a card. On the quay, 1 to 3 board a boat, 4 opens the Locker, G opens the Glasshouse, and F rings the bell. Q goes back to the quay from any room, T tips the Locker into the sea, and D dances. The painted rooms sit in `aria-hidden` SVG, so these keys are the keyboard path to every exit and machine.

## Live disk and live scout

- `GET /api/disk`: `statfs('/')` returns `{ freeTenths, capacityTenths }`.
- `GET /api/scan`: `du -k -d 1` over `~/Library/Caches`, `~/.npm`, `~/.bun/install/cache`, `~/.cache` and Xcode DerivedData (20s timeout each). It returns the top 8 folders over 50 MB. `useRealCaches` swaps out the fixture caches for `live-0`..`live-7` sacks.
- `GET /api/agents`: `command -v` for `claude`, `cursor-agent` and `codex`, cached for 60s.
- `POST /api/scout`: same origin and `application/json` only, and one call at a time (403 or 429 otherwise). It runs `claude -p --tools "" --strict-mcp-config --no-session-persistence --output-format json --model <id> --effort <level> --system-prompt …`. The prompt carries only the items in reach (at most 14), the room, what's carried and the brief. It replies `{say, item, hole}`. Opus at high effort answers in about 5 seconds. While it thinks, the scout shows "…", and lines typed meanwhile queue as steering.
- A line ending in "?" is asked, not noted: it doesn't go on the brief (not even from the steering queue), and the scripted scout answers it without claiming to keep it.
- The scout card tells the player each live line asks Claude once on their own plan.

## What is still fixture

- Apps (World of Warcraft, 49 GB), Your stuff (a screen recording and an installer disk), and the starter sheds (`cleanup-penguins`, `lighthouse`).
- Ages like "not touched in 6 months" exist only on fixtures.
- The Glasshouse exhibits and "The panes are clear." are fixed. `world.fda` is always true.
- Codex, Cursor and custom scouts are scripted.
- `Item.seaBird`, `Item.binBird` and `waterPx` are leftovers that nothing reads.

## Known traps

- **Brief matching uses words from item names.** Live caches are named after their folder, so Chrome's cache is `Google`, and "leave the chrome cache alone" doesn't match it (#10).
- **Places.** `say()` treats input as a place only for `look in|scan|repo <x>`, where `<x>` is `~`, a path, mac/home/everything, or a known shed.
- **Duplicate ids.** Templates are cloned (scout card, dock face), so their clip-path ids repeat. That's harmless only because the shapes are identical. In art files, prefix every id with the room's prefix.
- **The API exists only in dev.** Under `vite preview` or `dist/`, the page stays on fixtures and the scout stays scripted.
- **`[hidden]`** is forced to `display: none !important` globally, because several components set `display`.

## Open issues

https://github.com/adityawrk/cleanup-penguins/issues. Run `gh issue view <n>` first.

1. Rooms are flat boxes. **Addressed:** all four rooms are painted.
2. Objects are labels. **Addressed:** items and holes are drawn objects with stamped sizes. A blind test (screenshots with all text hidden, shown to a fresh agent) named nearly every object and rated the rooms about 7/10 against the bar. Weak spots it found: the hold's sacks still read a little like a grid, floors are open, the tip machine reads half shredder and half chute without its sign, and the Docker tank mixes a barge and sunken bricks. Re-run that test after art changes (see "Run, test, look").
3. Penguins barely move. **Mostly addressed:** waddle, steps, flipper flaps, idle fidgets, sitting, the back view, dancing and emotes.
4. Clicks feel like a web page. **Addressed:** the click ring lands at the clamped point, hover brightens painted objects (and lifts sheds and wobbles items), and rooms open with an ink iris.
5. A stranger can't install the harbor.
6. Choosing a scout doesn't connect an agent. **Partly addressed:** Claude is live. The others are not.
7. No real delete, and no enforcement beyond the sim. **Partly addressed:** throws are honest practice.
8. Two clicks can finish both sea confirms. **Partly addressed:** the 800ms lock, reversed buttons and focus on No.
9. Locker items carried out. **Partly addressed.**
10. Brief matching against live names.

## How agents work here

- **Fable** writes prompts and advises. **Opus** builds and reviews at extra-high effort. Findings a player would notice become GitHub issues.
- **Issue attribution.** The first line of every issue says who wrote it, with agent and model. Example: `Written by Claude Opus 5.5 (claude-opus-5-5), extra-high effort.`
- **Art agents** get one file each, the anchors they must respect, `docs/art.md`, and a required render-and-look loop. They touch no other file.
- **Keep this file current.** When a rule, control, model list or trap changes, update `AGENTS.md` (and `docs/art.md` for art) in the same change. Don't add a README unless asked.
- **Privacy.** Screenshots show the macOS username and real cache folder names. Crop or describe them in public issues. Never commit scan output.
- **Commits.** Commit on a branch, push when a milestone lands, and don't commit secrets.
