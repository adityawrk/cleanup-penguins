# AGENTS.md

Guide for coding agents working in cleanup-penguins. It describes the tree as of 2026-11-23 (branch `harbor-craft`, ahead of `main`).
Where an issue or an older note disagrees with the source, trust the source and fix this file. The art guide is [docs/art.md](docs/art.md). Read it before drawing anything.

## Resume here

```sh
npm install
npm test           # vitest: 29 tests in tests/*.test.ts
npm run dev        # http://localhost:5173, the only mode with the live disk, scans and scout
```

Dismiss the title card (`#hello`) with a click, Enter or Escape.

**Where things stand.** All four rooms are painted (`src/art/*.svg`), and the cargo is drawn objects. Under `npm run dev`, the pole, the caches, the Applications boat and folder looks are real, read-only measurements. The scout is live only when it is Claude and `claude` is on the PATH: one tool-less Claude Code call per line. Every throw is a practice throw. Nothing is deleted, the pole doesn't move, and the game says so.

**Next:**

1. **A real delete is NOT built, and it waits on the user's decision.** Don't start it unasked. The safe design:
   - It is off by default.
   - It runs only from the player's final sea confirm (face 2), and never from the scout, the chat bar or the model path.
   - It deletes only a cache: a `sea: true` item whose exact path `/api/scan` returned this session. Folder-look rows don't qualify (they come from a different scan and their kinds are inferred).
   - Afterwards it re-reads `/api/disk` and moves the pole from that reading, never from `item.tenths`.
   - `world.rehearsal` is one flag for the whole harbor. A throw needs its own result before it can stop saying "practice".
   - Open questions for the user: the Locker empty sends everything in it to the sea, apps and your own files included (see Known traps). And should build output from a folder look ever be deletable?
2. **More live scouts (issue 6).** Only Claude is wired (`src/engine/scout.ts`). `/api/agents` detects `cursor-agent` and `codex` but nothing calls them. They need the same contract: no tools, one line in, a JSON reply. Until then their card says "Scripted · not connected yet".
3. **Your stuff stays the player's to open.** It is empty under the live API, and nothing lists it on its own (see Privacy). "look in ~/Downloads" (or Desktop, Documents, Movies, Music, Pictures) fills the green boat via `lookInOwnFolder` and `useRealHold(..., under)`, so several looks add up. macOS may show its own permission prompt first; the scout says so.
4. **The Mac app (issue 5).** Leave it until the delete question is settled.

## What this is

A Mac disk cleanup tool that plays like a late-2000s kids' MMO. You are a penguin on a snowy harbor. A scout bird follows you and gives advice, and you carry junk to the sea (permanent) or the Locker (it gives things back).

- **Quay** (`quay.svg`). Three boats are the holds: Caches (red trawler), Applications (blue tug) and Your stuff (green sailboat). They moor at three depths along the arched deck edge. The Locker warehouse stands on the left and the Glasshouse on the right. The tide board (`.pole`, HTML flap cells over the painted board) shows free space. The nest (`data-act="who"`) opens the scout card.
- **The bell** (`data-act="rope"`, `takeRope`, F on the quay) sets the scope to This Mac and requests a rescan (`lookRequest` for `mac`), unless a look is already running. The scout calls out the biggest cache, and you walk to the Caches hold.
- **Sheds** are repos and looked-in folders, drawn as HTML buttons by `syncSheds` (`main.ts`) at `shedSlot(i)`. The first two stand on the back edge. The rest stand on the deck in front, at 0.82 scale. The starter sheds are `cleanup-penguins` and `lighthouse`.
  Under the live API the made-up starter sheds are replaced by your two most recent real repos (`GET /api/repos`, `scanRepos`: git folders one level inside `~/projects`, `~/code`, `~/dev`, `~/src`, `~/Developer`, `~/repos`, `~/workspace`, `~/GitHub`, `~/git`, `~/Sites`; never the macOS-protected folders), via `useRealRepos`, which keeps sheds the player asked about. Walking into an unmeasured shed starts a real look. Extra sheds (index 2+) stand smaller in front with their sign shown on hover (`.shed.is-extra`).
- **Hold** (`hold.svg`). A ship's belly with the cargo on the floor. The steel footlocker on the left is the Locker bin ("It comes back."). The cargo door on the right is the sea ("Gone for good."). The ladder goes up to the quay.
- **Locker** (`locker.svg`). Kept things stand in five numbered bays, then a staggered second row (`lockerSlot`). The tip hopper (`data-act="empty"`) empties everything into the sea after two confirms. The roll door goes back out.
- **Glasshouse** (`glasshouse.svg`). Look but don't touch. macOS, the Docker disk and Photos are exhibits behind a rope. The floor stops at y 560 ("Oof."). Each exhibit says one fixed line (`bumpBuoy`).
- **Map** (dock button or M). It shows `src/art/map.svg`, built into the page by `main.ts` with one button per `.map-place[data-go]`. `travel()` jumps straight to a room or a boat's hold. It refuses while you carry something ("Put it down first.").
- **Scout.** One at a time. Most people pay for one agent, so don't design for several.
  - The scout card (`#who`, from the dock or the nest) picks the scout, the model and the effort.
  - Each scout offers its three largest models, biggest first. Claude: Fable, Opus, Sonnet. Codex: Astra, Sol, Terra. Cursor: Grok 4.7, 4.6, 4.5. Antigravity (the custom scout named "Antigravity"): Neon, Carbon, Argon. OpenCode and other custom names: Default.
  - A fresh harbor starts on Claude · Opus · High.
  - Switching scouts keeps the effort. It keeps the model only if the new scout offers it, and otherwise takes the first. The new scout repeats your last note.
- **Effort** (fish). Low, Medium, High and Extra high scale the scout by 0.72, 1, 1.28 and 1.58 (`effortScale`). High and Extra high pin the info sheet (`#sheet`) when you lift something.
- **Looks.** The sim never reads the disk. `takeRope`, `lookIn` and "look in mac" set `world.lookRequest`, and `serveLook()` in `main.ts` runs it.
  - `mac` runs `loadThisMac(false)`: the disk, then `/api/scan`, then `/api/apps`.
  - Any other look runs `lookInFolder` → `/api/look` → `useFolder`.
  - Build output (`dist`, `.next`, `target`, `build`…, see `folderKind`) becomes sea-safe sacks, but only when the looked-at folder is a project (it holds `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, an `.xcodeproj`…); otherwise it is just a trunk. Dependencies (`node_modules`, `.venv`, `Pods`…) become Locker-only crates. Anything else becomes a trunk the chute refuses.
  - A rescan replaces only what is still lying in the hold. Thrown, kept and carried items stay.
- **Steering.** While a look runs (`world.tool`), each new line queues in `world.steering` (at most 6) and shows as "After {look} · {line}".
  - `finishTool` puts every queued non-question on the brief, then acts on the newest line.
  - "stop", "wait", "come back" or "come home" brings the scout back. "look in …" starts that look. "caches" or "the big one" sends it to the bell. "throw it" gets "You'll have to throw it.". A question gets "Ask me that again now that I am back.". Anything else gets "Got it. I'll use that on the next one."
  - Scan looks (This Mac, a folder, "Thinking") end when their answer returns. The walk to the bell after "the big one" ends when the scout arrives.
- **Brief.** It keeps the last 6 lines. Typed directly, questions, commands and places stay off it. `advice()` checks it newest first. It matches words from the item's name (`distinctive()`), then looks for keep/leave words or throw/clear words. A note changes advice only for the item it names.
- **Idle.** You can waddle during a look. A scout in `mode: 'go'` isn't pulled along. Standing still, the penguin waves, hops and wiggles, then sits after about 8 seconds. After 45 seconds idle on the quay, the scout goes home to the nest. Click it to wake it.
- **Flourish.** These change no rule.
  - Dock emotes, and D to dance (the scout joins within 220px).
  - Clicking your penguin, while not carrying, opens the player card (`#me`). It has a "Still harbor" toggle (`harbor-still`), on by default under reduced motion.
  - Walking away from the camera shows the back (`.is-back` hides `.face` and `.belly`).
  - Quay toys (`data-act="toy"`, `playToy`): the gull, the lighthouse and the fish crate. Snow falls on the quay.
- **Harbor folk** (`src/npcs.ts`). Four penguins potter about: Captain Gil and Mo on the quay, Bolt in the Locker, Fern in the Glasshouse. Each is a recolored copy of `tpl-you` with a hat. Click one (`data-act="npc"`, `talkTo`) and it says its next tip. They live outside the sim. They are presentation only: they carry nothing, change no rule, and never speak for the scout. Their tips must stay true.
  Each also carries a prop (`PROPS` in `npcs.ts`: Gil a rope coil, Mo a fish basket, Fern a watering can, Bolt a clipboard), drawn just before the near flipper so the flipper holds it, and has a small size variation (`size`). They wear a small speech badge (`.npc-badge`) until the player has talked to them once, so they read as NPCs with tips rather than other players.
- **Following and motion.** The scout keeps to the player's trailing side (`follow()` in `sim.ts`): about 78px behind, and when the player turns it loops behind them (a lower y) rather than walking through. Its name slides sideways away from the player's when they stand close (`--nx`). Everyone breathes at rest (`breathe`), blinks are out of sync, the walk is a squash-and-stretch waddle (`waddle2`, `footstep2`, `swing`), lifting crouches (`heave2`), throwing winds up (`.is-throw`, pulsed when a toss starts). Speech bubbles hide while a card is open (`#fit.has-card`).
- **Ambient life.** Harbor folk bob and do a small task with their prop on a loop (`folk-bob`, `kit-lift`, `kit-sway`, `kit-tap`, `kit-tip`; each prop sits in a `.kit-anim` wrapper so CSS never fights its placement transform). The dance is a full rock-and-hop with both flippers up (`dance2`). A gull crosses the quay sky (`.q-flyer`), Glasshouse butterflies drift (`.g-drift`), the Locker lamps sway. Amplitudes are large on purpose: sprites render at about half size.
- **Celebration.** When a practice throw or a Locker keep finishes, `celebrate()` in `main.ts` floats the size up from where it landed with a burst of confetti and a scout hop (confetti is skipped under Still harbor). Guide arrows hide while anyone is speaking.
- **Personal space.** After movement each frame, a scout inside a 76px ellipse round the player is pushed out sideways (following) or steps behind the player (on an errand), so it never stands inside the penguin. When the scout's name would meet the player's, it drops a line (`--ny`) instead of sliding off the bird.
- **Back views.** Every character template ends with a drawn back (`<g class="back" display="none">`, parts `back-flipper l/r`, `back-foot l/r`); `.being.is-back` swaps the whole front for it, with its own walk animation (`back-step`, `back-swing-*`). Portraits clone the template, which is why the back stays `display="none"` by default. Harbor-folk hats have no back position yet (folk never turn their backs today).
- **Dress-up.** The player card has a wardrobe: eight penguin colors (`COLORS` in `main.ts`, applied by swapping the three navy values) and the harbor-folk hats (`HATS` from `npcs.ts`). `dressPlayer()` rebuilds the player's sprite and portrait, remembered in `localStorage` under `harbor-look`. The title art stays navy.
- **Standing decor** (`src/decor.ts`): drawn objects placed among the characters and sorted by their base y, so the penguin walks behind or in front of them. Today: the quay's snowman. Painted-background life also includes the hold's ship's cat (`.h-cat`) and mouse (`.h-mouse`).
- **First run.** The scout guides one loop with arrows: board the red boat, lift something, then the sea or the Locker. It is done once a practice throw or a Locker keep happens, and it is remembered in `localStorage` (`harbor-guide-v1`).
- **Sound.** Each room has an original synthesized loop (`TUNES` in `src/audio.ts`). The dock's note button toggles music (`harbor-music`). The speaker button mutes everything. Audio unlocks on the first click and pauses while the tab is hidden.
- **Privacy.**
  - Never list Downloads, Desktop or Documents on your own. macOS guards them, and a Node process that reads them pops a permission prompt.
  - Under the live API, Your stuff starts empty, with a note telling the player to ask.
  - Only a look the player typed may read those folders.

## Rules that must not be broken

1. **The agent never deletes.** The scout only advises.
   - The live scout runs with `--tools ""`, so it can't list, run, move or delete anything.
   - `clean()` checks every reply. Unknown item ids are dropped. A sea pointer for a `sea: false` item becomes the Locker. A claim of having deleted, thrown or moved something becomes "I can't throw things. You'll have to carry it." (a net, not a guarantee; see Known traps).
   - The chat bar can't throw: "throw it" always gets "You'll have to throw it.".
   - A future delete route must accept only the player's final sea confirm.
2. **The sea takes two confirms.** Face 1 asks. Face 2 is titled "This would be for good." in practice, and "It's gone if you do this." once deletes are real.
   - Face 2 puts focus on No and stays locked for 800ms (`lockedUntil`).
   - Face 2 reverses its buttons (`#card.face-2 .card-actions`), so "Throw it" never sits under the first Yes.
   - Y and Enter ignore held-key repeats.
   - Emptying the Locker uses the same two faces.
3. **Only sea-safe things reach the sea.** Carrying a `sea: false` item (an app, your stuff, dependencies) to the sea opens a Locker card that says "The chute won't take this." Tipping the Locker into the sea takes only `sea: true` items; the rest stay, and the card says how many.
4. **The Locker gives things back.** Carrying a Locker item out through the roll door (or pressing Q) asks "Put X back?". Yes puts it back in its hold. Locker moves never move the pole.
5. **The pole is honest.** It shows real free space (`statfs`). While `world.rehearsal` is true (it always is today), throws add to `world.rehearsedTenths` and never to `freeTenths`. Face 2, the splash line, the player card and the title card all say it's practice.
6. **The scout's words are true.** It never claims to be connected, to have scanned or to have deleted unless that happened.
   - The card shows "Live · Claude Code on this Mac" only when the scout is Claude and `/api/agents` found `claude`.
   - For the live scout, only its prompt blocks a false "scanned" claim. `clean()` catches delete, throw and move claims only.
7. **Original art and sound.**
   - The player is an original classic cartoon penguin of the genre, and the scouts are original birds. Never trace or replicate another game's avatars, pets, rooms or maps, and never use another game's assets, names or sounds. Don't trace the reference video either.
   - Match the craft in [docs/art.md](docs/art.md): flat fills, one heavy ink outline, three-quarter view, three-toed feet, a blue ring under the player, and props that read as objects.
   - Every visual is vector: `src/art/*.svg`, the `index.html` templates, the SVG strings in `items.ts`, `emotes.ts`, `npcs.ts` and `main.ts`, or CSS. No raster images.
   - Every sound is synthesized in `src/audio.ts`.
   - Fonts are Fredoka and IBM Plex Mono, self-hosted from `@fontsource` (latin only). Never load them from Google.

## Quality bar

The bar is a polished kids' MMO: dense rooms of recognizable objects, small characters in a big place, glossy chunky UI, and constant small life (harbor folk, bobbing boats and buoys, puffing smoke, a swinging bell, a pecking gull, lanterns, a fish past the hold's porthole, a mouse on the hold's baseboard). A change isn't done just because it works. Screenshot it and compare it with `quay.svg`.

## Run, test, look

```sh
npm run build                                          # tsc --noEmit && vite build -> dist/
node scripts/svgview.mjs src/art/hold.svg /tmp/h.png   # render one art file with the game fonts
node scripts/shot.mjs http://localhost:5173/ /tmp/run steps.json   # drive the game headless; writes /tmp/run-<shot>.png
node scripts/sheet.mjs out.png 6 a.png b.png …         # tile frames into one contact sheet
node scripts/peak.mjs                                  # master-bus peak (hard-coded to :5174; edit the URL)
```

- **`shot.mjs` steps.** The steps are `{wait: ms}`, `{key}`, `{click: [x, y]}`, `{type}`, `{eval}` (its result is logged), `{shot: name}` and `{burst: name, n, every, clip}`, at 1280 by 800. With no steps file, it shoots the title card and the quay. Every browser script uses `puppeteer-core` with `/Applications/Google Chrome.app`. `peak.mjs` reads `window.harborAudio`.
- **Blind art test.** Before a shot, `eval` this: `document.querySelectorAll('svg text, .tag, .name, .bubble, .shed-sign, .bell-tag, .pole, #mini, .path-sign, #console, .item-art .stamp').forEach(e => e.style.visibility = 'hidden')`. Then ask a fresh agent to name every object. Re-run it after art changes.
- **Title art.** `scripts/hello/gen.mjs` rebuilds `src/art/hello.svg` from `tpl-you`, `tpl-claude`, `rest.svgpart` and the trawler that follows `<!-- BOAT 1` in `quay.svg`. Rerunning it overwrites hand edits. `measure.mjs` prints glyph positions in the wordmark.

What the tests cover:
- `tests/sim.test.ts` (21 tests) drives `World` with explicit time (`settle()` steps every 16ms).
  - The bell and repo scope, both sea faces, practice throws leaving the pole alone, apps redirected to the Locker, refusing a card, and the Glasshouse rope.
  - One scout, no throwing from chat, switching scouts, brief matching, walking up before lifting, model lists and effort, notes handed to the next scout, the steering queue, and waddling during a look.
  - The live path: `'ask'` only when Claude is found, questions never noted, `liveReply`, `liveFailed`.
  - A practice Locker empty that takes only sea-safe things (and refuses when there are none), own-folder looks filling Your stuff, an empty shed really looking, `useFolder` kinds, a rescan keeping thrown, kept or carried items, `travel`, and `useRealHold` for apps and an empty Your stuff.
- `tests/scout.test.ts` (7 tests) covers `clean()` and `claimsAnAction()`.
- `tests/scan.test.ts` (1 test) covers `parseDu`.
- Nothing tests putting a Locker item back (rule 4), `readDisk`, `scanCaches`, `scanFolder`, `scanApps`, spawning `claude`, the `/api` middleware, `main.ts` or the DOM. Check those in the browser.

Keep `src/sim.ts` free of the DOM and of clocks. Time comes in as `now`.

## Code map

| File | What it holds |
|---|---|
| `index.html` | The stage, and the four rooms on one 5120px `#track` (`#room-quay`, `#room-hold`, `#room-locker`, `#room-glasshouse`). Each room has a `.paint`, a `.ground`, `.objects` and a `.paint.fore`. Also the dock (`#console`), `#card`, the scout card `#who`, the player card `#me`, the title card `#hello`, and the templates (`tpl-you`, `tpl-claude`, `tpl-codex`, `tpl-cursor`, `tpl-custom`, `tpl-prop`). |
| `src/art/*.svg` | The rooms (1280×708), a foreground for each (`quay-fore`, `hold-fore`, `locker-fore`, `glasshouse-fore`), the map (`map.svg`, 640×400) and the title art (`hello.svg`, 760×470). |
| `src/sim.ts` | Game state and rules: `World`, fixtures, `SPOTS`, `NEST`, `BANDS`, `shedSlot`, `advice`, `say` (returns a `SayKind`), `lookIn`, `takeRope`, `travel`, `finishTool`, `liveReply`, `liveFailed`, `scoutIsLive`, `cardModel` and `answer`, `step`, `useRealDisk`, `useRealCaches`, `useRealHold`, `useFolder`. |
| `src/main.ts` | Injects the art (the `ART` map). Adds one real `.hotspot` button over each painted `.hot` group. Builds the map. Copies `World` to the DOM each frame. Handles input, sounds, emotes, toys, the room iris (`#wipe`), the guide, and the scout and player cards. Holds `loadThisMac`, `serveLook`, `lookInFolder`, `syncPropNodes`, `syncSheds`, `findAgents` and `askScout`. |
| `src/items.ts` | Drawn cargo (`itemSvg`: sack, packed, crate, trunk, disk in a 120×100 box), the size stamp (`stampText`), `sizeScale()` and `jitter()`. |
| `src/emotes.ts` | Emote icons (`EMOTES`, `emoteSvg`). |
| `src/npcs.ts` | The harbor folk: `createNpcs`, `stepNpcs` (called each frame, frozen by Still harbor), `talkTo`, and the hats. |
| `src/audio.ts` | `HarborAudio`: the master bus (compressor, limiter, meter), per-room ambience and music (`TUNES`), footsteps by floor, and effects. |
| `src/style.css` | All layout, UI and animation. `[hidden]` is forced to `display: none !important`. Honors `prefers-reduced-motion`. `#fit.is-still` pauses the painted animation. |
| `src/engine/scan.ts` | Node only: `readDisk`, `scanCaches`, `scanFolder`, `folderKind`, `scanApps`, `parseDu`. |
| `src/engine/scout.ts` | Node only: `detectAgents`, `askClaude`, the system prompt, `claimsAnAction`, `clean`. |
| `vite.config.ts` | The dev-only `harbor-api` middleware (below) and `__USERNAME__` (the macOS username, used as the penguin's name). |
| `scripts/` | `svgview.mjs`, `shot.mjs`, `sheet.mjs`, `peak.mjs`, and `hello/` (the title-art generator). |

**Units.** Sizes are tenths of a decimal GB (1 tenth = 1e8 bytes), formatted by `gb()` and `gbWord()`. The stage is 1280×708. `#fit` is 1280×800 and uses CSS `zoom` to fit the window.

**Scale (in `main.ts`).** Sprites are drawn large and shown small:
- The player and the harbor folk are shown at `YOU_SIZE` 0.48, and the scout at `SCOUT_SIZE` 0.38 times its effort. All are multiplied by a depth factor of 0.88 to 1.04 (from y 480).
- Items are shown at `ITEM_SIZE` 0.8 × `sizeScale()` × a depth of 0.9 to 1.06 (from y 470).
- Names, bubbles and tags are counter-scaled with `--inv`, so text stays one size.

**Keys.**
- E lifts the nearest item in the hold or the Locker, walking to it first. F does the same off the quay. On the quay, F rings the bell.
- X goes to the sea and B to the Locker bin, both from the hold only. With nothing carried they say "Pick something up first.", and outside the hold "Not from here.".
- Y or N answers a card. Enter presses the highlighted button.
- Esc says No to a card, closes the scout card, the player card or the map, or drops what you carry.
- M opens and closes the map.
- On the quay, 1 to 3 board a boat and G opens the Glasshouse. 4 opens the Locker from any other room. Q goes back to the quay (through the roll door in the Locker). In the Locker, T walks to the hopper.
- D dances.
- Painted hotspots also have real focusable buttons (`.hotspot`), and rooms off screen are `inert`.

## Live API (dev only)

Everything here is the `harbor-api` middleware (`configureServer` in `vite.config.ts`), so it exists only under `npm run dev`. Every `/api/*` request needs a local `Host` header (localhost, 127.0.0.1, [::1] or `*.localhost`). Anything else gets a 403, which guards against DNS rebinding. Every route reads only. There is no write or delete route anywhere.

- `GET /api/disk`. `statfs('/')` returns `{ freeTenths, capacityTenths }` (`bavail` and `blocks` × `bsize`).
- `GET /api/scan`. Runs `du -k -d 1` over `~/Library/Caches`, `~/.npm`, `~/.bun/install/cache`, `~/.cache` and `~/Library/Developer/Xcode/DerivedData`, one root after another, with a 20s timeout each.
  - Missing roots and `du` errors are skipped. Hidden names and folders under 50,000 KB are dropped.
  - Returns the top 8 as `{ name, path, bytes, days }`, where `days` is the folder's mtime age.
  - `useRealCaches` swaps the Mac caches still in the hold (including "14 small caches") for `live-*` sacks: `sea: true`, phrase "last changed N ago" (or "measured on this Mac" with no `days`), and one shared line. An empty scan keeps the fixtures.
- `GET /api/apps`. `scanApps` runs `du -d 1 /Applications` (40s timeout) and takes the six largest `.app` bundles of at least 200,000 KB. It reads `kMDItemLastUsedDate` with `mdls`. `useRealHold` turns them into Locker-only crates that say "last opened N ago" or "no last-opened date on record". It is fetched after the caches and isn't part of the look.
- `GET /api/look?path=`. `scanFolder` resolves the `realpath`, refuses anything outside home or home itself, then runs `du -k -d 1` (hidden folders included) and also lists loose files of 50 MB and up, which `du -d 1` would miss. It returns folders of at least 1,000 KB, top 8, each with a `folderKind`. Errors return a 404, and the scout says "I couldn't look in {path}. Is it a folder in your home?".
- `GET /api/agents`. Runs `command -v` in a login shell for `claude`, `cursor-agent` and `codex`, and caches the result for 60s. That proves the binary is on the PATH, not that anyone is signed in.
- `POST /api/scout`.
  - It takes same-origin `application/json` only (403 otherwise), one call at a time (429), and a body of up to 200 KB. Bad JSON gets a 400, and a failed call a 502.
  - It runs `claude -p --tools "" --strict-mcp-config --no-session-persistence --output-format json --model <id> --effort <level> --system-prompt …` in the OS temp dir. The facts go in on stdin, with a 90s timeout. Closing the page kills the call.
  - Model ids: `fable` → `claude-fable-5-2`, `opus` → `claude-opus-5-5`, `sonnet` → `claude-sonnet-5-5`. Anything unknown falls back to Opus.
  - `askScout` sends the room, what's carried, the brief, and at most 14 items in reach. The reply is `{say, item, hole}`.
- **When a line goes live.** `say()` handles places, "throw it", "the big one" and naming another scout itself. Everything else returns `'ask'` when `scoutIsLive()`. The scout shows "…" (a `Thinking` look), and lines typed meanwhile queue as steering.
- **Questions.** A line ending in "?" is asked, never noted. The scripted scout answers "Pick it up and I'll tell you what I know."
- **Failure.** The scout says "I couldn't reach Claude Code just now." The page then treats Claude as not found (the card says Scripted) and calls `findAgents()` again after 2 minutes.

## What is still fixture

- Without the API (under `vite preview` or `dist/`), the page stays on fixture data and a scripted scout:
  - World of Warcraft (49 GB), Your stuff (a screen recording and an installer disk), and the caches.
  - The pole, 43.8 GB free of 512. It shows until `/api/disk` answers, and stays if that fails.
- Without the dev API, the starter sheds (`cleanup-penguins`, `lighthouse`) and their cargo are demo fixtures. Under the live API they are replaced by real repos.
- Folder looks have no ages.
- The Glasshouse exhibits and "The panes are clear." are fixed. `world.fda` is always true and nothing reads it.
- Codex, Cursor and custom scouts are scripted. Every scripted line is a hardcoded string in `sim.ts` or `main.ts`.
- `Item.seaBird`, `Item.binBird` and `waterPx()` are leftovers that nothing reads.

## Known traps

- **Brief matching uses words from item names.** Live caches are named after their top folder, so Chrome's cache is `Google`. "leave the chrome cache alone" matches the fixture "Chrome cache" but not the live row (#10).
- **Places.** `say()` treats input as a place only for `look in|scan|repo <x>`, where `<x>` is `~`, a path starting with `~` or `/`, mac/home/this mac/everything, or a known shed. Everything else goes on the brief. A `/` path outside home still makes a shed, and then the look fails.
- **Lines queued during a live answer** go on the brief (questions excepted). They are not sent to Claude and get no spoken reply: `liveReply` calls `finishTool(world, now, true)` and then speaks Claude's answer. The reply's `hole` is unused.
- **The pole sound.** `sound()` plays `flap()` and `splash()` whenever `freeTenths` changes. Every disk reading (first count and rescans) resets `prevFree` first, so only bytes coming back would ever make that sound. When a real delete lands, that sound will stack with the throw's own splash.
- **`claimsAnAction()` is a net, not a guarantee.** A model can phrase around a regex. The no-tools flag is the real guarantee.
- **Removing items.** Code that removes items from `world.items` must call `syncPropNodes()`, or their DOM nodes linger as ghosts.
- **Duplicate ids.** Templates are cloned (the scout card, the dock face), so their clip-path ids (`youClip`, `clClip`, …) repeat. That's harmless only because the shapes are identical. In art files, prefix every id (see [docs/art.md](docs/art.md)).

## Open issues

https://github.com/adityawrk/cleanup-penguins/issues. All ten are open. "Addressed" means fixed in the tree and waiting for a browser check before anyone proposes closing it. Run `gh issue view <n>` first.

1. Rooms are flat boxes. **Addressed:** all four rooms are painted, and the quay and hold were repainted with depth.
2. Objects are labels. **Addressed:** cargo and holes are drawn objects with stamped sizes. Re-run the blind test.
3. Penguins barely move. **Mostly addressed:** a waddle, steps, flipper flaps, three-quarter drawings, idle fidgets, sitting, the back view, dancing and emotes.
4. Clicks feel like a web page. **Addressed:** the click ring lands at the clamped point. Hover brightens painted objects, lifts sheds and wobbles items. Rooms open with an ink iris.
5. A stranger can't install the harbor. There is no Mac app, README or installer.
6. Choosing a scout doesn't connect an agent. **Partly addressed:** Claude is live. The others are not.
7. No real delete, and no enforcement beyond the sim. **Partly addressed:** throws are honest practice. A real delete waits on the user (see Next).
8. Two clicks can finish both sea confirms. **Partly addressed:** the 800ms lock, reversed buttons, focus on No, and no key repeats.
9. Locker items carried out. **Partly addressed:** a carried item draws in the current room, X outside the hold says "Not from here.", and the roll door asks to put the item back.
10. Brief matching against live names. Open.

## How agents work here

- **Fable** writes prompts and advises. **Opus** builds and reviews at extra-high effort. Findings a player would notice become GitHub issues.
- **Issue attribution.** The first line of every issue says who wrote it, with the agent and the model. If you file someone else's findings, name both. Example: `Written by Claude Opus 5.5 (claude-opus-5-5), extra-high effort.`
- **Honesty about access.** If you can't open a path, for example one outside the repo, say so. Never claim you saw a file you couldn't read.
- **Art agents** each get one file, the anchors in [docs/art.md](docs/art.md), and a required render-and-look loop. They touch no other file.
- **Chrome.** The harbor is a web page, so look at it in Chrome (or with the headless scripts) against `npm run dev`. If two Chromes are connected, never guess which one. Ask, or let the person pick.
- **Keep this file current.** When a rule, control, model list or trap changes, update `AGENTS.md` (and `docs/art.md` for art) in the same change. `AGENTS.md` is the only top-level markdown. Don't add a README unless asked.
- **Privacy.** Screenshots show the macOS username and real cache folder names. Crop or describe them in public issues. Never commit scan output.
- **Commits.** Commit on a branch, push when a milestone lands, and never commit secrets.
