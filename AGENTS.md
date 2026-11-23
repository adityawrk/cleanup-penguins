# AGENTS.md

Guide for coding agents working in cleanup-penguins. It describes the tree as of 2026-11-23 (branch `harbor-craft`, ahead of `main`).
Where an issue or an older note disagrees with the source, trust the source and fix this file. The art guide is [docs/art.md](docs/art.md). Read it before drawing anything.

## Resume here

```sh
npm install
npm test           # vitest, tests/**/*.test.ts
npm run dev        # http://localhost:5173 (the only mode with the live disk, scan and scout)
```

Dismiss the title card (`#hello`) with a click, Enter or Escape. The live pole, the live cache sacks and the live scout exist only under `npm run dev`.

**Where things stand.** All four rooms are painted scenes (`src/art/*.svg`). Items are drawn objects. When the scout is Claude and `claude` is on the PATH, a free-text line goes to a real Claude Code call with no tools. Throws are an honest practice run: nothing is deleted, the pole does not move, and the game says so.

**Next, in order:**

1. **A real delete, safely (issue 7).** Only from the player's final sea confirm, only for `sea: true` items, only inside the scanned cache roots. After the delete finishes, re-read `/api/disk` and move the pole from that reading, never from `item.tenths`. `world.rehearsal` is one flag for the whole harbor, so a real delete needs a per-throw result before any throw stops saying "practice". Never delete from the scout or chat path.
2. **More live scouts (issue 6).** Claude is wired (`src/engine/scout.ts`). Cursor (`cursor-agent`) and Codex are detected but never called. They need the same contract: no tools, one line in, a JSON reply. Until then the scout card says "Scripted · not connected yet". A scripted scout must never claim to be connected.
3. **Live sheds and apps.** `look in <path>` adds a shed and the scout says "I'll look in X.", but nothing scans it. Apps and "Your stuff" are fixtures.
4. **The Mac app (issue 5).** Leave it until step 1 is done.

## What this is

A Mac disk cleanup tool that plays like a late-2000s kids' MMO. You are a penguin on a snowy harbor. A scout bird follows you and gives advice, and you carry junk to the sea or the Locker.

- **Quay** (`quay.svg`). Three moored boats are the holds: Caches (red trawler), Applications (blue tug) and Your stuff (green sailboat). The Locker warehouse is on the left and the Glasshouse on the right. The tide board (`.pole`, HTML flap cells over the painted board) shows free space. The bell (`data-act="rope"`, `takeRope`) sets the scope to This Mac. The scout calls out the biggest cache and you walk to the Caches hold. It does not rescan. The nest opens the scout card. Sheds are repos, drawn by `syncSheds` in `main.ts` at `shedSlot()`.
- **Hold** (`hold.svg`). A ship's belly with the cargo on the floor. The steel footlocker on the left is the Locker bin ("It comes back."). The cargo door on the right is the sea ("Gone for good."). The ladder goes up to the quay. The hold has no foreground file.
- **Locker** (`locker.svg`). The inside of the warehouse. Kept things stand in five numbered bays, then a staggered second row (`lockerSlot`). The tip hopper (`data-act="empty"`) empties everything into the sea after two confirms. The roll door goes back out.
- **Glasshouse** (`glasshouse.svg`). Look but don't touch. macOS, the Docker disk and Photos are exhibits behind a rope. The floor stops at y 560 ("Oof."). Each exhibit says one fixed line (`bumpBuoy`).
- **Scout.** One at a time. Most people pay for one agent, so don't design for several at once. The scout card (`#who`, from the dock button or the nest) picks the scout, the model and the effort. Each scout offers its three largest models, biggest first. Claude offers Fable, Opus and Sonnet. Codex offers Astra, Sol and Terra. Cursor offers Grok 4.7, 4.6 and 4.5. Antigravity (a custom scout named "Antigravity", from its button or typed under "Someone else") offers Neon, Carbon and Argon. OpenCode and other custom names offer Default. A fresh harbor starts on Claude · Opus · High. Switching scouts keeps the effort. It keeps the model only if the new scout offers it, and otherwise picks the first. The new scout repeats your last note.
- **Effort.** Shown as fish. Low, Medium, High and Extra high scale the scout 0.72, 1, 1.28 and 1.58 (`effortScale`). High and Extra high pin the info sheet (`#sheet`) when you lift something.
- **Steering.** While the scout is on a look (`world.tool`), every new line queues in `world.steering` (at most 6). It shows as "After {look} · {line}". `finishTool` writes the non-question lines to the brief and acts on the newest line. "stop", "wait", "come back" or "come home" bring the scout back. "look in …" starts that look. "caches" or "the big one" sends the scout to the bell. "throw it" gets "You'll have to throw it.". Anything else gets "Got it. I'll use that on the next one." A walk-look ends when the scout arrives. The opening count, `beginTool(world, 'This Mac', false)`, ends when `/api/scan` returns. Lines typed before then wait for it.
- **Brief.** It holds the last 6 lines you typed. Typed normally, questions, commands and places stay off it. From the steering queue, every non-question line goes on, "throw it" and "look in …" included. `advice()` checks it newest first. It matches words from an item's name (`distinctive()`) and then looks for keep/leave words or throw/clear words. A note changes advice only for the item it names, and for nothing else.
- **Idle.** You can waddle during a look. A scout in `mode: 'go'` isn't pulled along. Standing still, the penguin waves, hops and wiggles, then sits after about 8 seconds. After 45 seconds idle on the quay, the scout goes home to sleep in the nest. Click it to wake it.
- **Flourish.** The dock has emotes, and D dances (the scout joins in when it is within 220px). Clicking your penguin, when you're not carrying anything, opens your card (`#me`). Walking away from the camera shows the penguin's back (`.is-back` hides `.face` and `.belly`). On the quay, the gull, the lighthouse and the fish crate are toys (`data-act="toy"`, `playToy`). They change no rule. Snow falls on the quay.
- **First run.** The scout guides one loop with bouncing arrows: board the red boat, pick something up, then the sea or the Locker. The guide remembers that it finished in `localStorage` under `harbor-guide-v1`. Clear that key to see it again.
- **Sound.** Each room has an original synthesized music loop (`TUNES` in `src/audio.ts`). The dock's note button toggles it and remembers the choice (`harbor-music`). The speaker button mutes everything. Audio unlocks on the first click and pauses while the tab is hidden.

## Rules that must not be broken

1. **The agent never deletes.** The scout only advises. The live scout runs with `--tools ""`, so it can't list, run, move or delete anything. `clean()` checks its reply. Unknown item ids are dropped. A sea pointer for a `sea: false` item becomes the Locker. A first-person claim of having deleted, thrown or moved something is replaced with "I can't throw things. You'll have to carry it." (a narrow check, see "Known traps"). The chat bar can't throw: "throw it" always gets "You'll have to throw it.". A future delete route must accept only the player's final sea confirm.
2. **The sea takes two confirms.** Face 1 asks. Face 2 is titled "This would be for good." in practice, or "It's gone if you do this." once deletes are real. Face 2 gets focus on No, stays locked for 800ms (`lockedUntil`), and reverses its buttons (`#card.face-2 .card-actions`), so "Throw it" is not under the first Yes. Y and Enter ignore held-key repeats. Emptying the Locker uses the same two faces.
3. **Only sea-safe things reach the sea.** `sea: false` items (apps, your stuff, `node_modules`) are redirected to a Locker card that says "The chute won't take this."
4. **The Locker gives things back.** Carrying a Locker item out through the roll door (or pressing Q) asks "Put X back?". Yes puts it back on its boat. Locker moves never move the pole.
5. **The pole is honest.** It shows real free space (`statfs`). While `world.rehearsal` is true (it always is today), throws add to `world.rehearsedTenths` and never to `freeTenths`. Face 2, the scout's splash line and the player card all say it's practice.
6. **The scout's words are true.** It never claims to be connected, to have scanned or to have deleted unless that happened. The scout card shows "Live · Claude Code on this Mac" only when the scout is Claude and `/api/agents` found `claude`. For the live scout, a "scanned" claim is blocked only by its prompt. `clean()` catches delete, throw and move claims only.
7. **Original art and sound.** Use no other game's assets, names, characters, rooms, maps or sounds, and don't trace them, or the reference video. Match the craft (see [docs/art.md](docs/art.md)): flat fills, one heavy ink outline, a white face disc with the eyes on it, three-toed feet, a blue ring under the player, and props that read as objects. Every visual is vector. That means the SVG in `src/art/`, the templates in `index.html`, the SVG strings in `items.ts`, `emotes.ts` and `main.ts`, or CSS. Every sound is synthesized in `src/audio.ts`. Fonts are Fredoka and IBM Plex Mono, self-hosted from `@fontsource` (latin only). Never load them from Google. No raster images.

## Quality bar

The bar is a polished kids' MMO: dense rooms of recognizable objects, small characters in a big place, glossy chunky UI, and constant small life (bobbing boats, puffing smoke, a swinging bell, gulls, a fish swimming past a porthole). A change isn't done just because it works. Screenshot it and compare it with `quay.svg`.

## Run, test, look

```sh
npm run build                                          # tsc --noEmit && vite build -> dist/
node scripts/svgview.mjs src/art/hold.svg /tmp/h.png   # render one art file with the game fonts
node scripts/shot.mjs http://localhost:5173/ /tmp/run steps.json   # drive the game headless, writes /tmp/run-<shot>.png
node scripts/sheet.mjs out.png 6 a.png b.png …         # tile frames into one contact sheet
node scripts/peak.mjs                                  # master-bus peak level (expects dev on :5174, edit the URL)
```

- **`shot.mjs` steps.** The steps are `{wait: ms}`, `{key}`, `{click: [x, y]}`, `{type}`, `{eval}` (its result is logged), `{shot: name}` and `{burst: name, n, every, clip}`, at 1280 by 800. Without a steps file, it shoots the title card and then the quay. Every browser script (`svgview`, `shot`, `sheet`, `peak` and `hello/measure`) uses `puppeteer-core` against `/Applications/Google Chrome.app`. The page exposes `window.harborAudio` for `peak.mjs`.
- **Blind art test.** Before a shot, `eval` this: `document.querySelectorAll('svg text, .tag, .name, .bubble, .shed-sign, .bell-tag, .pole, #mini, .path-sign, #console, .item-art .stamp').forEach(e => e.style.visibility = 'hidden')`. Then ask a fresh agent to name every object.
- **Title art.** `scripts/hello/gen.mjs` rebuilds `src/art/hello.svg` from `tpl-you`, `tpl-claude`, `rest.svgpart` and the quay trawler. It finds the trawler by the `<!-- BOAT 1` comment in `quay.svg`, so keep that comment. Rerunning it overwrites hand edits to `hello.svg`. `measure.mjs` prints glyph positions in the wordmark.

The tests:
- `tests/sim.test.ts` drives `World` with explicit time (`settle()` steps every 16ms). It covers the bell and repo scope, both sea faces, practice throws leaving the pole alone, apps redirected to the Locker, refusing a card, the Glasshouse rope, one scout, no throwing from chat, switching scouts, brief matching, walking up before lifting, model lists and default effort, notes handed to the next scout, the steering queue, and waddling while the scout is out. It also covers the live path: `'ask'` only when Claude is found, questions never noted, `liveReply` with queued lines, `liveFailed`, and a practice Locker empty.
- `tests/scout.test.ts` covers `clean()`: unknown ids dropped, sea pointers for `sea: false` items turned into the Locker, claimed deletes replaced, and the 90-character cap.
- `tests/scan.test.ts` covers `parseDu`.
- Nothing tests putting a Locker item back (rule 4), `readDisk`, `scanCaches`, spawning `claude`, the `/api` middleware, `main.ts` or the DOM. Check those in the browser.

Keep `src/sim.ts` free of the DOM and of clocks. Time comes in as `now`.

## Code map

| File | What it holds |
|---|---|
| `index.html` | The stage and the four rooms on one 5120px `#track` (`#room-quay`, `#room-hold`, `#room-locker`, `#room-glasshouse`). Each room has a `.paint`, a `.ground`, `.objects`, and an optional `.paint.fore`. The quay also holds `.pole`, `.bell-tag`, `#brief` and `#sheds`. The hold holds `#path-sign`, `#sheet` and `#empty-note`. Also here: the dock (`#console`), `#card`, the scout card `#who`, the player card `#me`, the title card `#hello`, and the templates (`tpl-you`, `tpl-claude`, `tpl-codex`, `tpl-cursor`, `tpl-custom`, `tpl-prop`). |
| `src/art/*.svg` | The painted rooms (1280×708), three foregrounds (`quay-fore`, `locker-fore`, `glasshouse-fore`) and the title art (`hello.svg`, 760×470). Clickable groups are `.hot` with `data-act`. |
| `src/sim.ts` | Game state and rules: `World`, fixtures, `SPOTS`, `BANDS`, `shedSlot`, `advice`, `say` (returns a `SayKind`), `liveReply`, `liveFailed`, `scoutIsLive`, cards (`cardModel`) and `answer`, `step`, `useRealDisk` and `useRealCaches`. |
| `src/main.ts` | Injects the art (the `ART` map), copies `World` to the DOM each frame, and handles input, sounds, emotes, toys, the room iris (`#wipe`), the guide, the scout and player cards, `loadThisMac()`, `findAgents()` and `askScout()`. |
| `src/items.ts` | The drawn item objects (`itemSvg` for sack, packed, crate, trunk and disk), the size stamp (`stampText`), `sizeScale()` and `jitter()`. |
| `src/emotes.ts` | The emote icons (`EMOTES`, `emoteSvg`). |
| `src/audio.ts` | `HarborAudio`: the master bus and meter, per-room ambience and music (`TUNES`), footsteps by floor, and effects (bell, splash, flap, tide, heave, chirp, gull, horn and more). |
| `src/style.css` | All layout, UI and animation. `[hidden]` is forced to `display: none !important`, because several components set `display`. Honors `prefers-reduced-motion`. |
| `src/engine/scan.ts` | Node only: `readDisk`, `scanCaches`, `parseDu`. |
| `src/engine/scout.ts` | Node only: `detectAgents`, `askClaude` (the tool-less live scout), the system prompt and `clean()`. |
| `vite.config.ts` | The dev-only `harbor-api` middleware (below) and `__USERNAME__` (the macOS username, used as the penguin's name). |
| `docs/art.md` | The art guide: ink, line weights, cel shading, palette, layers, ids, the anchors the code depends on, and scale. |
| `scripts/` | `svgview.mjs`, `shot.mjs`, `sheet.mjs`, `peak.mjs`, and `hello/` (the title art generator). |

**Units.** Sizes are tenths of a decimal GB (1 tenth = 1e8 bytes). `gb()` and `gbWord()` format them. The stage is 1280×708. `#fit` is 1280×800 and uses CSS `zoom` to fit the window. Sprites are drawn large and shown at `YOU_SIZE` 0.56 and `SCOUT_SIZE` 0.46. That is multiplied by a depth factor of 0.88 to 1.04 and, for the scout, by effort. Names, bubbles and tags are counter-scaled with `--inv`, so text stays one size.

**Keys.** E lifts the nearest item in the hold or the Locker, walking to it first. F does the same outside the quay. On the quay, F rings the bell. X goes to the sea and B goes to the Locker bin, both from the hold only. With nothing carried they say "Pick something up first.", and outside the hold "Not from here.". Y or N answers a card. Enter presses the highlighted button. Esc closes a card (it means No), closes the scout or player card, or drops what you carry. On the quay, 1 to 3 board a boat and G opens the Glasshouse. 4 opens the Locker from any other room. Q goes back to the quay (through the roll door in the Locker). In the Locker, T walks to the hopper, and the two empty confirms follow. D dances. The painted rooms sit in `aria-hidden` SVG, so these keys are the keyboard path to every exit and machine.

## Live disk and live scout

All of this lives in the `harbor-api` middleware (`configureServer` in `vite.config.ts`). It exists only under `npm run dev`. Every `/api/*` request must carry a local `Host` header (localhost, 127.0.0.1, [::1] or `*.localhost`). Anything else gets a 403, which guards against DNS rebinding.

- `GET /api/disk`. `statfs('/')` returns `{ freeTenths, capacityTenths }` from `bavail` and `blocks` times `bsize`.
- `GET /api/scan`. Runs `du -k -d 1` over `~/Library/Caches`, `~/.npm`, `~/.bun/install/cache`, `~/.cache` and `~/Library/Developer/Xcode/DerivedData`, one root after another, with a 20s timeout each. Missing roots and `du` errors are skipped. It drops hidden names and folders under 50,000 KB, and returns the top 8 as `{ name, path, bytes }` with `~` paths. `useRealCaches` removes every Mac-scope caches item, including "14 small caches". In their place it adds `live-0`..`live-7` sacks that are `sea: true`, carry the phrase "measured on this Mac", and share one generic line. If the scan is empty, the fixtures stay.
- `GET /api/agents`. Runs `command -v` in a login shell for `claude`, `cursor-agent` and `codex`, and caches the result for 60s. That proves the binary is on the PATH, not that you are signed in.
- `POST /api/scout`. It accepts same-origin `application/json` only (403 otherwise) and one call at a time (429). Bad JSON gets a 400 and a failed call a 502. It runs `claude -p --tools "" --strict-mcp-config --no-session-persistence --output-format json --model <id> --effort <level> --system-prompt …` in the OS temp dir. The facts go in on stdin, with a 90s timeout. Model ids are `fable` → `claude-fable-5-2`, `opus` → `claude-opus-5-5`, and `sonnet` → `claude-sonnet-5-5` (an unknown id falls back to Opus). `askScout` sends the items in reach (at most 14, capped by the client), the room, what's carried and the brief. The reply is `{say, item, hole}`. An earlier note put Opus at high effort at about 5 seconds per answer. This audit did not re-measure it.
- **When a line goes live.** `say()` handles places, "throw it", "the big one" and naming another scout itself. Everything else returns `'ask'` when `scoutIsLive()`. The scout shows "…" (a `Thinking` tool), and lines typed meanwhile queue as steering.
- **Questions.** A line ending in "?" is asked, not noted. It doesn't go on the brief, not even from the steering queue. Typed normally, the scripted scout answers it without claiming to keep it. A queued question still gets "Got it. I'll use that on the next one." from `finishTool` (a known gap).
- **Failure.** On a failed call, the scout says "I couldn't reach Claude Code just now." The page then treats Claude as not found, so the card says Scripted, and it calls `findAgents()` again after 2 minutes.
- The scout card tells the player that each live line asks Claude once, on their own plan.

## What is still fixture

- Apps (World of Warcraft, 49 GB), Your stuff (a screen recording, 8.4 GB, and an installer disk, 2.6 GB), and the starter sheds (`cleanup-penguins` with `node_modules` and `dist`, and `lighthouse` with `.next`).
- The fixture pole, 43.8 GB free of 512, shows until `/api/disk` answers. If that fails, it stays for good.
- Ages like "not touched in 6 months" exist only on fixtures. Live rows have none.
- The Glasshouse exhibits and "The panes are clear." are fixed. `world.fda` is always true and nothing reads it.
- Codex, Cursor and custom scouts are scripted. Every scripted line is a hardcoded string in `sim.ts` or `main.ts`.
- `Item.seaBird`, `Item.binBird` and `waterPx()` are leftovers that nothing reads.

## Known traps

- **Brief matching uses words from item names.** Live caches are named after their top folder, so Chrome's cache is `Google`. "leave the chrome cache alone" matches the fixture "Chrome cache" but not the live row (#10).
- **Places.** `say()` treats input as a place only for `look in|scan|repo <x>`, where `<x>` is `~`, a path starting with `~` or `/`, mac/home/everything, or a known shed. Everything else goes on the brief.
- **A queued line skips the live scout.** If lines were typed while Claude was thinking, `liveReply` drops Claude's answer. It also ignores the reply's `hole` everywhere. `finishTool` then answers the newest queued line with a scripted line. That line is never sent to Claude.
- **The scan failure line barely shows.** `loadThisMac()`'s catch sets `scout.bubble` directly, without `sayLine`. The line lives only until the 4s timer set for "Counting the quay." runs out.
- **The pole sound fires on load.** `sound()` plays `flap()` and `splash()` whenever `freeTenths` changes. That includes the first `/api/disk` reading. It is usually silent only because audio is still locked at that point. When a real delete moves the pole, that sound will stack with the throw's own splash.
- **`clean()` is a narrow net.** Its regex catches only "I", "I've", "I have" or "I just" directly followed by a verb such as deleted or threw. "I've just deleted it" and "Deleted it for you" get through. The no-tools flag is the real guarantee. Don't treat `clean()` as one.
- **E in the Locker.** `nearestLiftable` measures from `item.x`/`item.y`, the item's old hold spot, not its Locker bay. It can pick a far item.
- **Ghost props.** `main.ts` caches one DOM node per item id and only updates nodes for items still in `world.items`. When `useRealCaches` drops the fixture caches, their nodes stay as they were. So if the player is in the Caches hold before `/api/scan` returns, the fixture sacks probably linger there and do nothing when clicked (read from the code, not yet seen in the browser). Any code that removes items must also remove their nodes.
- **Duplicate ids.** Templates are cloned (the scout card, the dock face), so their clip-path ids (`youClip`, `clClip`, …) repeat. That's harmless only because the shapes are identical. In art files, prefix every id (see [docs/art.md](docs/art.md)).
- **The API exists only in dev.** Under `vite preview` or `dist/`, the page stays on fixtures and the scout stays scripted.

## Open issues

https://github.com/adityawrk/cleanup-penguins/issues. All ten are still open on GitHub. "Addressed" below means fixed in the tree and waiting for a check in the browser before anyone proposes closing it. Run `gh issue view <n>` first.

1. Rooms are flat boxes. **Addressed:** all four rooms are painted.
2. Objects are labels. **Addressed:** items and holes are drawn objects with stamped sizes. A blind test named nearly every object and rated the rooms about 7/10 against the bar. It found these weak spots: the hold's sacks still read a little like a grid, the floors are open, the tip machine reads half shredder and half chute without its sign, and the Docker tank mixes a barge with sunken bricks. Re-run that test after art changes.
3. Penguins barely move. **Mostly addressed:** a waddle, steps, flipper flaps, a three-quarter turn while walking, idle fidgets, sitting, the back view, dancing and emotes.
4. Clicks feel like a web page. **Addressed:** the click ring lands at the clamped point. Hover brightens painted objects, lifts sheds and wobbles items. Rooms open with an ink iris.
5. A stranger can't install the harbor. There is no Mac app, README or installer.
6. Choosing a scout doesn't connect an agent. **Partly addressed:** Claude is live. The others are not.
7. No real delete, and no enforcement beyond the sim. **Partly addressed:** throws are honest practice.
8. Two clicks can finish both sea confirms. **Partly addressed:** the 800ms lock, the reversed buttons, focus on No, and no key repeats.
9. Locker items carried out. **Partly addressed:** a carried item draws in the current room, X outside the hold says "Not from here.", and the roll door asks to put the item back.
10. Brief matching against live names. Open.

## How agents work here

- **Fable** writes prompts and advises. **Opus** builds and reviews at extra-high effort. Findings a player would notice become GitHub issues.
- **Issue attribution.** The first line of every issue says who wrote it, with the agent and the model. If you file someone else's findings, name both. Example: `Written by Claude Opus 5.5 (claude-opus-5-5), extra-high effort.`
- **Honesty about access.** If you can't open a path, for example one outside the repo, say so. Never claim you saw a file you couldn't read.
- **Art agents** get one file each, the anchors they must respect, [docs/art.md](docs/art.md), and a required render-and-look loop. They touch no other file.
- **Chrome.** The harbor is a web page, so look at it in Chrome (or the headless scripts above) against `npm run dev`, even from a session that can't drive desktop apps. If two Chromes are connected, never guess which one. Ask, or let the person pick.
- **Keep this file current.** When a rule, control, model list or trap changes, update `AGENTS.md` (and `docs/art.md` for art) in the same change. `AGENTS.md` is the only top-level markdown. Don't add a README unless asked.
- **Privacy.** Screenshots show the macOS username and real cache folder names. Crop or describe them in public issues. Never commit scan output.
- **Commits.** Commit on a branch, push when a milestone lands, and don't commit secrets.
