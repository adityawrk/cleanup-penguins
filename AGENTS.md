# AGENTS.md

Guide for coding agents working in cleanup-penguins. It describes the working tree as of 2026-11-23.
Where an issue's text disagrees with the source, trust the source and update this file.

## Resume here

This file is the handoff. A new Claude Code session should read it before editing. The playable tree is on `main`. There is no Mac app yet.

```sh
cd cleanup-penguins
npm install
npm test
npm run dev
```

Open `http://localhost:5173/`. Dismiss the opening card. The pole and the cache sacks are live only while `npm run dev` is running.

Do this next, in this order:

1. **Rooms and objects (issues 1 and 2).** The penguins, the blue floor ring, the flat sky and sea, and the chat dock are in. Boats, doors, ice, the hold, the Locker, and the Glasshouse are still thin shapes. Fill them with original drawn objects a player can recognize before reading the label. Flat fills, one heavy ink outline. Do not trace the reference video.
2. **One live scout (issue 6).** On open, detect a single signed-in CLI (`claude`, `codex`, or Cursor). The chat bar talks to that local session with harbor tools only: list, inspect, judge, speak. No shell. No delete. The throw still happens in the harbor, from the player's confirm. The queue in `world.steering` is already the "message after the current tool call" behavior. Wire the real session to it.
3. **Stop the pole from lying (issue 7).** `finishToss` and `finishEmpty` add `freeTenths` even though no bytes came back. The first sim test expects 43.8 to 45.9 on the fixture. Fix the rule and that test together. Do not ship a real delete until this is honest.

Leave the Mac installer (issue 5) until those three are true.

A 61 second reference recording may still be at `/Users/adityabikanermini/Downloads/a3Q9FF9PLI7XS3b3.mp4`. It is not in the repo. It shows a Club Penguin client used as an agent harness. Use it for craft only: line weight, flat color, object density, the blue ring, the dock, the card. Do not copy its rooms, creatures, or UI.

The person asked to continue in Claude Code and to leave this Cursor session. Do not wait for that session. Update this file when the next pass changes a rule.

## What this is

A Mac disk cleanup tool that plays like a game. The player is a penguin on a harbor.

- One scout (a smaller bird) follows the player, finds junk, and gives advice in speech bubbles.
- Only the player throws something away. They walk up, lift it, carry it to a hole, and confirm.
- The **sea** (the chute) is permanent. Only caches and build output go there, and only after two confirms.
- Everything else goes to the **Locker** (the bin), which keeps it and lets the player carry it back.
- The **pole** (the flap board) shows the free space on the disk. It must move only when bytes actually come back.
- The default scope is the whole Mac. The player can walk into a repo (a "shed") first instead.
- A typed brief such as "leave the chrome cache alone" changes the scout's advice for the item that sentence names, and for nothing else.
- There is one scout at a time. The plaque lists Claude, Codex, Cursor, OpenCode, Antigravity, and a name the player types. Most people pay for one agent. Don't design for three agents at once.
- The charm on the nest is the model. Each scout offers only its three largest models, biggest first: Claude is Fable, Opus, Sonnet. Codex is Astra, Sol, Terra. Cursor is Grok 4.7, Grok 4.6, Grok 4.5. Antigravity, named on the custom bird, is Neon, Carbon, Argon. OpenCode has no family of its own, so its charm stays Default. The harbor still wakes on Opus, which is Claude Code's own default.
- The fish stack is effort. It starts at high for every fresh harbor. Low, medium, high, and extra high change the scout's size (0.72, 1, 1.28, 1.58). High and extra high also pin the sheet when the player lifts something. Switching scouts keeps the effort where the player left it.
- While a look is in progress (`world.tool`), a new line is queued in `world.steering` and shown above the chat as "After {look} · {line}". It is not on the brief yet, and the scout does not turn around. `finishTool` writes the lines onto the brief and then follows the newest one: "come back" brings the scout home, "look in …" starts that look, "the big one" sends it to the rope, "throw it" still gets "You'll have to throw it.", and anything else is "Got it. I'll use that on the next one." A walk-look ends when the scout arrives. The opening count is `beginTool(world, 'This Mac', false)` and ends when `/api/scan` returns, even if the scout is still walking.
- The player can waddle during a look. The scout in `mode: 'go'` is not pulled along. Standing still, the penguin waves, hops, then wiggles, and sits after about eight seconds. A click stands it up.

## Rules that must not be broken

1. **The agent never deletes.** The scout only advises. The chat bar can't throw anything. `say()` answers "throw it" with "You'll have to throw it." Any future delete route must accept only a delete that comes from the player's final confirm, never one from the scout or model path.
2. **Sea means two confirms.** Face 1 asks. Face 2 says "It's gone if you do this.", gets focus on No, stays locked for 800ms (`lockedUntil`), and puts its buttons in reverse order so Throw it is not under the first Yes (`#card.face-2 .card-actions`). Emptying the Locker into the sea uses the same two faces.
3. **Only sea-safe things reach the sea.** Items with `sea: false` (apps, your stuff, `node_modules`) get redirected to a Locker card that says "The chute won't take this."
4. **The Locker can give things back.** Carrying an item out through the Locker's gang plank opens "Put X back?". Saying yes puts it back on its skiff. Locker moves never move the pole.
5. **The pole is honest.** It shows real free space and moves only when bytes come back. (This is broken right now; see "Known traps".)
6. **The scout's words must be true.** Don't let it claim to be connected, to have scanned something, or to have deleted something unless that really happened.
7. **Original art and sound only.** Never use Disney or Club Penguin assets, names, characters, maps, or sounds, and don't trace them. Match the craft: flat fills, one heavy ink outline, a white face disc, eyes on that disc, three-toed feet, a blue ring under the player, and props that read as objects. No blur, no gradient bodies, no glow. Every visual is inline SVG in `index.html` or CSS in `src/style.css`. Every sound is synthesized in `src/audio.ts`. UI type is Fredoka and paths are IBM Plex Mono, self-hosted from `@fontsource` (latin subsets only). Do not load fonts from Google. Do not add raster images to chase sharpness. Vectors are the lossless path.

## The quality bar

The target is the craft of that late-2000s kids' MMO used as an agent harness: crisp flat vector, a room of recognizable objects, a glossy blue dock, and a card with a thick light rim, paired with a world-class cleanup. The real disk, a real explanation of each item, a safe throw, and undo. What we aim to match is the craft, not the source material. A reference video's frames are a spec for line, flat color, and density. They are not a sprite sheet. A change is not done just because it works. The quay penguins and dock were redrawn this way on 2026-11-23. The rooms are still thin: boats, doors, and ice are cleaner, and they are not yet a room full of things you recognize before you read the label.

## Run and test

```sh
npm install
npm run dev        # http://localhost:5173, the only mode with the live disk API
npm test           # vitest run, tests/**/*.test.ts
npm run build      # tsc --noEmit && vite build -> dist/ (gitignored)
npm run preview    # serves dist/ with no /api; the page falls back to fixtures
```

The repo has no Mac app, no README, and no installer. A stranger can't get or open the harbor yet (#5).
`puppeteer-core` is a devDependency. Nothing in `tests/` imports it. Ad-hoc Chrome checks launch `/Applications/Google Chrome.app` against `http://localhost:5173/`.

What the tests cover:
- `tests/sim.test.ts` drives `World` directly with fixture items and explicit time (the `settle()` helper calls `step()` every 16ms). It covers the rope and bead, the two sea faces and the pole bump, the app being redirected to the Locker, refusing a card, the Glasshouse rope, one scout, no throwing from chat, switching scouts, brief matching, `lookIn` and repo scope, walking up to an item before lifting it, the three-model lists and high default effort, handing notes to the next scout, queueing a line until the current look finishes, and waddling plus a wave while the scout is still out.
- `tests/scan.test.ts` covers only `parseDu`.
- Nothing tests `readDisk`, `scanCaches`, `useRealCaches`, `main.ts`, or the DOM. Check anything visual in Chrome (see below).

Keep `src/sim.ts` free of the DOM and pass time in as an argument (`now`). Never read a clock inside it. That design is what makes the rules testable.

## Code map

| File | What it holds |
|---|---|
| `index.html` | All markup. Four rooms (`quay`, `hold`, `locker`, `glasshouse`) sit side by side on one 5120px `#track`. Templates for the penguin, the four scouts, and items. |
| `src/sim.ts` | The game state and rules: `World`, the fixture items in `createWorld`, `advice`, `say`, `lookIn`, cards and `answer`, `step`, `useRealDisk`, `useRealCaches`. |
| `src/main.ts` | Copies `World` to the DOM every frame, handles input (`data-act` clicks, keys), triggers sounds, and runs `loadThisMac()`. |
| `src/style.css` | All look and animation (waddle, scout hop, settle, heave, wave, blink, tide fill, ripple). Honors `prefers-reduced-motion`. |
| `src/audio.ts` | `HarborAudio`: synthesized WebAudio. Footsteps differ by room. `tide`, `heave`, `setDown`, and `chirp` mark the second confirm, a lift, a drop, and a scout arriving at a hole. Unlocked on the first click or submit. |
| `src/engine/scan.ts` | Node only: `readDisk`, `scanCaches`, `parseDu`. Imported by `vite.config.ts`, never by the page. |
| `vite.config.ts` | The `harbor-api` dev middleware, and `__USERNAME__` (the macOS username, used as the penguin's name). |

Units: sizes are tenths of a decimal GB (1 tenth = 1e8 bytes; `gb()`/`gbWord()` format them). Stage coordinates are 1280×708. `#fit` is 1280×800 and scales to fit the window.
Keys: E/F lift the nearest item, X goes to the sea, B goes to the Locker bin, Y/N answer a card, Enter presses the highlighted card button (or dismisses the opening card), Esc drops, says No, or dismisses the opening card, 1/2/3 board a skiff on the quay, 4 opens the Locker, and F on the quay takes the rope. The opening card is `#hello`. A click, Enter, or Escape dismisses it. The ground click ring is placed at `clampPoint`, the spot the penguin will actually stop. A click on a sack rings that sack.

## Where the real disk scan lives

Everything live is in `src/engine/scan.ts`, served by the `harbor-api` plugin in `vite.config.ts` (`configureServer`, so it exists only under `npm run dev`).

- `GET /api/disk` calls `readDisk()`, which runs `statfs('/')`. It returns `{ freeTenths, capacityTenths }`, computed from `bavail` and `blocks` times `bsize`.
- `GET /api/scan` calls `scanCaches()`, which runs `du -k -d 1` with a 20s timeout over each existing root: `~/Library/Caches`, `~/.npm`, `~/.bun/install/cache`, `~/.cache`, `~/Library/Developer/Xcode/DerivedData`. It drops hidden names and folders under 50,000 KB, sorts by size, and returns the top 8 as `{ name, path, bytes }`, with paths shown as `~`. The roots are scanned one after another, and `du` errors are swallowed.
- `main.ts` `loadThisMac()` starts the "This Mac" look, sends the scout toward the rope, and says "Counting the quay." It fetches the disk, then the scan, then `finishTool`. `useRealDisk` replaces the pole. `useRealCaches` removes every Mac-scope `caches` item (including "14 small caches") and adds `live-0`..`live-7` sacks: `sea: true`, phrase "measured on this Mac", and one generic line for all of them. Lines typed during that count wait until the scan returns.
- The scan only reads. There is no write route and no delete code anywhere.

## What is still fixture

- **Scout.** It is a costume plus a model name and an effort size. `createWorld(name, scout = 'claude')` starts awake on Claude, model Opus, effort high. The picker changes the sprite and, when the new scout does not offer the current model, the model. Nothing checks for a CLI or a login. Every scout line is a hardcoded string in `sim.ts`, and none come from a live model (#6).
- **Throws.** `answer()`, `finishToss()`, and `finishEmpty()` set the item's in-memory `disposed` to `'sea'` or `'locker'`. No file is moved or deleted (#7).
- **Applications skiff:** World of Warcraft, 49 GB. **Your stuff skiff:** Screen recording 8.4 GB, Installer disk 2.6 GB.
- **Starter sheds** (`starterRepos()`): `cleanup-penguins` (`node_modules` 4.2 GB, `dist` 0.8 GB) and `lighthouse` (`.next` 1.6 GB).
- **`look in <path>`** adds an empty shed, and the scout says it will look. Nothing scans it.
- **Ages.** Phrases like "not touched in 6 months" exist only on fixtures. Live rows have no age data.
- **Glasshouse.** The buoys (macOS 168 GB, Docker disk, Photos) and "The panes are clear." are hardcoded. `world.fda` is always `true` and nothing reads it.
- **Fixture pole.** 43.8 GB free of 512 is shown until `/api/disk` answers, or for good if it fails.
- `Item.seaBird` and `Item.binBird` are left over from a design with several birds. Nothing reads them, because advice always comes from `world.scout`.

## Known traps

- **The pole lies after a throw.** `finishToss` and `finishEmpty` add the item's size to `freeTenths` even though nothing was deleted, so with the live disk the pole shows space that never came back. The first sim test asserts this bump (438 → 459). When a real delete lands, re-read `/api/disk` after it finishes and change that test.
- **The scan failure message never shows.** On a failed load, `loadThisMac()` sets `scout.bubble` directly without `sayLine`. `bubbleUntil` stays 0, so the next `step()` clears it.
- **Brief matching uses words from the item's name** (`distinctive()`: longer than 2 characters, minus stop words), checks the newest brief line first, and keeps 6 lines. Live caches are named after their top-level folder. Chrome's cache shows up as `Google`, so "leave the chrome cache alone" matches the fixture "Chrome cache" but not the live row (#10).
- **What counts as a place.** `say()` treats input as a place only for `look in|scan|repo <x>`, where `<x>` is `~`, a path starting with `/`, a word like mac/home/everything, or a known shed. Anything else goes into the brief.
- **The API exists only in dev.** Under `vite preview` or a built `dist/`, both fetches fail and the page stays on fixtures.

## Open issues

https://github.com/adityawrk/cleanup-penguins/issues. Check the current state with `gh issue view <n>` before you start. Items marked partly addressed have fixes in the tree but are not closed. Verify in Chrome before you propose closing one.

1. Rooms are flat boxes instead of painted scenes.
2. Objects are labels, not things you can recognize.
3. Penguins barely move when they walk. *In the tree:* a waddle, feet that step (`footstep`, the right foot 180ms behind), flippers that flap, scouts that hop, and both flippers swung inward while carrying, including while walking. Idle, the player waves, hops, and wiggles, then sits. Not closed. The drawing is sharper. The motion is still a short loop.
4. Clicks feel like a web page. *In the tree:* the ring lands on the clamped walk point, or on a sack that was clicked. Not closed. Room changes still slide the strip.
5. A stranger cannot get the harbor or open it.
6. Choosing a scout does not connect an agent.
7. The pole and sheds are a demo disk, and nothing enforces that the agent cannot delete. **Partly addressed:** the pole and caches are live. Apps, sheds, throws, and the enforcement are not, and the pole still bumps on a fake throw.
8. Two clicks on the same spot can finish both sea confirms. **Partly addressed:** face 2 is locked for 800ms, its buttons are reversed, focus is on No, and Y/Enter ignore held-key repeats. Not closed.
9. Carrying something out of the Locker loses it, and X can throw it at the wall. **Partly addressed:** a carried item draws in the current room, X outside the hold says "Not from here.", and tossing a Locker item subtracts its size from the Locker count. Not closed.
10. A sentence to the scout can become a fake folder or hit the wrong item. **Partly addressed:** the brief is matched newest line first, and "check …" is no longer read as a path. Name-based matching against live folder names is still open.

Enter presses the highlighted card button. The bead title stays "This Mac". The biggest cache is in `#bead-detail` under it.

## How agents work here

- **Fable** writes the prompts for Opus.
- **Opus** reviews at extra-high effort. Findings a player would notice become GitHub issues. Opus may also build, including when the person asks it to. A build that cannot read a path outside the repo must say so. Do not claim it saw a file it could not open.
- **Issue attribution.** The first line of every GitHub issue is who wrote it. Name the agent and the model. If you file someone else's findings, name both. Example: `Written by Grok 4.7 (Cursor). Findings from Claude Opus 5.5 (claude-opus-5-5), extra-high effort.`
- **Keep this file current.** When you change a rule, a control, a model list, or a known trap, update `AGENTS.md` in the same change. It is the only project markdown file. Don't add a README unless the person asks.
- **Chrome.** When a review or test needs to see the page, Claude Code runs with `--chrome` against `npm run dev`. Two Chromes are connected. Never guess which one. Ask, or let the person pick in the extension.
- **Cursor.** The Cursor session can't drive desktop apps. The harbor is a web page, so Chrome is the right way to look at it.
- **Privacy.** Screenshots show the macOS username (the penguin's name) and real cache folder names. Describe or crop them in public issues.
- **Commits and secrets.** Don't commit unless the person asks. Don't put secrets, tokens, or scan output from someone's Mac in the repo.
