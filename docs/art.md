# Art guide

How the harbor is drawn. The reference room is `src/art/quay.svg`. Match that file. A 61-second reference recording (a kids' MMO used as an agent harness) may be at `~/Downloads/a3Q9FF9PLI7XS3b3.mp4`, outside the repo. Use it for craft only: line weight, flat color, object density. Never trace it or copy its rooms, creatures or UI.

## The look

Crisp flat vector in the style of a late-2000s kids' MMO: a room full of objects you recognize before you read a label, small characters in a big place, and chunky glossy UI. The harbor is its own place. Never trace or replicate another game's avatars, pets, rooms, logos or maps.

- **Ink.** Every outline is one color, `#1a2332`. Never black, never gray.
- **Line hierarchy.** This contrast is what makes the art read as illustration; monoline outlines read as a stock icon set.
  - Silhouettes are 4.4 to 5px.
  - Inner structure (windows, planks, folds) is 1.6 to 2.4px.
  - Every prop gets 2 to 4 open "ink ticks" (grain flicks, cracks, snow flecks): short open strokes, not closed shapes.
  - A thin object drawn as one ink stroke (a mast, a rail) can be 5px.
  - Painted stripes drawn as wide strokes use their paint color, not ink.
  - Use round joins and caps everywhere (`stroke-linejoin="round" stroke-linecap="round"`).
- **Fill.** Flat colors only. The art has no `<linearGradient>`, no `<radialGradient>`, no blur, no filter, no glow and no drop shadow. Use opacity only for the lighthouse beam, highlights, cel shade and floor shade. The hover brighten is CSS on `.hot`, not part of the drawing.
- **Cel shade.** Light comes from the upper left. Each object gets one darker shadow shape on its right or lower faces, drawn with `stroke="none"` after the fill and before the outline. Then redraw the silhouette with `fill="none"` so the ink sits on top. Add one highlight, a short white or pale stroke, where the light hits.
- **Snow.** Roofs, posts and crates get a lumpy white cap (`#fff`, with 2.6 to 3.4px ink) and a pale-blue inner line (`#d6ecf9`).
- **Contact shadow.** Anything standing on a floor gets a flat ellipse under it: `#1a2332` at about 13% opacity, no ink.
- **Depth.** Rooms have a vanishing point and things at different depths. The quay's back edge is an arch and its planks converge. Its boats moor at three scales. Each boat's scale lives on a wrapper `<g transform>`, because CSS owns the `.q-boat` group's own transform. Buildings show a receding side wall.
- **Density.** Every room needs a back layer (sky, wall or shelves) and a middle layer of named, clickable things. Small props fill the gaps: crates, rope coils, lanterns, buoys, a gull, a fish crate. Leave the walkable floor open.
- **Text in art.** Painted words use Fredoka through classes in `src/style.css`:
  - `.sign-word`: 19px, 700, tracked.
  - `.hull-name`: 16px, 700.
  - `.hull-size`: 14px, 700.
  - `.tag-word`: 14px, 600.
  - `.tag-word.strong`: 12.5px, 700, tracked.
  - Live values are `<text id="...">` elements that `main.ts` fills.

## Characters

Characters live in the `index.html` templates, not in the art files.

- **Shared rules.** Flat fills, one heavy ink outline (bodies are 5px), three-toed feet, and a three-quarter view facing right. The code mirrors them to face left.
  - Face parts sit in `<g class="face">` and the belly in `<g class="belly">`, and each template ends with its own drawn back view, `<g class="back" display="none">` (parts `back-flipper l/r`, `back-foot l/r`); walking away (`.is-back`) hides every front part and shows the back. Keep the back's navy to the same three values so recolored harbor folk work.
  - Eyes are in `<g class="eyes">`, which blinks.
  - Flippers and feet are `.flipper` and `.foot` (`l` or `r`), which the walk animates.
- **The player** is an original classic cartoon penguin of the genre:
  - a tall navy egg body (`#1d4e89`, shade `#153a66`) with big eyes set high on the head and no face disc;
  - a chunky orange beak that pokes out past the silhouette;
  - one white belly front.
  - It stands on a blue floor ring (`.ring`).
- **The scouts** are original, small, saturated round birds (not fur balls). Each has a pale belly, eyes on the colored head, and its own color and head feature:
  - Claude: clay (`#d9774f`), with a feather crest.
  - Codex: teal (`#14a37f`), with a curl and glasses.
  - Cursor: slate (`#3d4a66`), with a cyan pointer-arrow crest.
  - The custom scout: purple (`#8d62d6`), with a green sprout.
- **Harbor folk** (`src/npcs.ts`) are the player's drawing with its three navy colors swapped and a hat added (captain's cap, beanie or sou'wester). Draw a new one the same way, not as a new character.
- **Never** trace or replicate another game's avatar or pets.

## Palette

| Use | Colors |
|---|---|
| Ink | `#1a2332` |
| Sky bands | `#4fb2ee`, `#6cc2f2`, `#8fd2f6` |
| Sea | `#2a87d6`, `#3f9be0`, horizon `#62b8ee`, foam `#c9ecff` |
| Snow and ice | `#fff`, `#f4faff`, shade `#c7e4f6`, `#d6ecf9` |
| Wood | deck `#e8b878` / `#e0ac6b`, seams `#a8713c`, posts `#9a6236`, dark `#7a4a27`, crates `#e0b56a` / `#b07a3c`, deck shade `#b98447` |
| Steel | `#8fa6ba`, `#7690a6`, `#5c7388`, roof `#4e6b86` / `#3d5670` |
| Paint red | `#d9493e`, `#e24b3f`, shade `#b03329` |
| Paint blue | `#2f6fb8`, `#3aa0f2`, shade `#225a99` |
| Paint green | `#3f9f63`, `#5bb04b`, `#4bae5b`, shade `#2c7a4a` |
| Yellow and brass | `#ffd23f`, `#f4c534`, `#f2c14e`, shade `#d39a2b` |
| Orange | `#f08a2c`, `#f27d32` |
| Paper and signs | cream `#fff6e4`, sign `#f3d7a1`, sign shade `#e3bd80` |
| Glass | `#bfe8f7`, `#d6f2fb`, frame `#f4f8fb` |

## Files and layers

- **Rooms.** Each room is `src/art/<room>.svg`, with `viewBox="0 0 1280 708"` and `aria-hidden="true"` on the root. `main.ts` injects it into `.paint[data-art]` through its `ART` map. A new file needs an entry in that map and a `data-art` host in `index.html`.
- **Foregrounds.** `<room>-fore.svg` is drawn above the characters, for things they walk behind. All four rooms have one. Keep foregrounds to the edges.
- **Map.** `map.svg` (640×400) is not in `ART`. `main.ts` imports it into the map panel. Each place is a `.map-place` with `data-go` set to a room or a hold (`quay`, `locker`, `glasshouse`, `caches`, `apps`, `stuff`). Its `<title>` becomes the text of the matching button.
- **ids.** Every `id` in a file starts with its prefix: `q-` quay, `h-` hold, `l-` locker, `g-` glasshouse, `t-` title (`hello.svg`). The exceptions are the live text ids `label-caches`, `label-apps`, `label-stuff` and `locker-count`, all in `quay.svg`.
- **Clicks.** The painting ignores the mouse (`.paint { pointer-events: none }`). A clickable group gets `class="hot"`, a `<title>` and the `data-act` the game expects:
  - `board` + `data-hold`, `enter` + `data-room`, `rope`, `who`, `toy` + `data-toy`, `hole` + `data-hole`, `gang`, `empty`, `buoy` and `fda`.
  - Hover brightens it.
  - `main.ts` lays a real `.hotspot` button over each one, labelled by its `<title>`.
- **Animation.** It is CSS in `src/style.css`, keyed off classes in the art. Prefix those classes too. Use gentle loops only: bob, sway, puff, blink, swim. All of it stops under `prefers-reduced-motion`, and it pauses under "Still harbor" (`#fit.is-still`).

## Anchors the code depends on

Moving or renaming any of these breaks the game, not just the picture.

- **Positions in `src/sim.ts`.**
  - `SPOTS`: the sea stand (1040, 560), the bin stand (300, 548), where the scout advises beside them (`seaPost` 948, 596 and `binPost` 396, 590), the chute (1180, 392), the bell (`bead`, 290, 600), the boarding points (424 / 616 / 804, 496), the Locker and Glasshouse doors (150 / 1150, 496), the roll door (`gang`, 160, 520) and the hopper (`tip`, 1070, 596).
  - `NEST` is at (990, 640).
  - `BANDS` sets the walkable floor per room. The Glasshouse wall is at y 560.
  - `lockerSlot()` sets the bays, `shedSlot()` the sheds, and `LIVE_SPOTS` where live cargo lands on the hold floor.
  - A Locker empty's arc ends at (1160, 300).
- **Positions in `src/main.ts`.** The guide arrows point at (424, 300) on the quay, and at (1181, 300) and (248, 316) in the hold. Each harbor folk's `home` and `range` in `src/npcs.ts` must stay on open floor.
- **Player colors.** `npcs.ts` recolors `tpl-you` by swapping exactly `#1d4e89`, `#153a66` and `#4f8ad0`, and renames `youClip`. Change those hexes in the template and the folk come out navy.
- **Classes and attributes.**
  - `playToy` toggles `.flown` on `.q-gull` and `.flash` on `.q-beam`.
  - CSS animates `.q-boat[data-hold]`, `.q-smoke`, `.q-bob`, `.q-waves`, `.q-gull`, `.h-fish`, `.h-swell`, `.h-mouse`, `.l-ripple` and the `.g-*` life.
  - Some origins are fixed in view-box px: `.q-bell-swing` at 290px 514px, `.q-beam` at 1010px 132px, `.l-lamp-1` / `-2` at 492 / 788px 58px, and `.h-lantern-a` / `-b` at 330px 48px and 960px 50px.
  - Glasshouse exhibits are told apart by their `<title>` text: "docker", "photo", or anything else for macOS.
- **Comments.** `scripts/hello/gen.mjs` lifts the trawler group that follows `<!-- BOAT 1` in `quay.svg`. It also reads `<!-- BOAT 3` (unused today). It reads the `tpl-you` and `tpl-claude` templates and their clip ids too.

## Scale

The stage is 1280 by 708. All the factors live in `main.ts`.

| Sprite | Drawn box | Shown at | Box height on stage |
|---|---|---|---|
| Player and harbor folk | 176×204 | `YOU_SIZE` 0.48 × depth 0.88 to 1.04 | about 86px at the back of the floor to 102px at the front |
| Scout | 128×144 | `SCOUT_SIZE` 0.38 × depth × effort (0.72 to 1.58) | about 35 to 90px |
| Item | 120×100 | `ITEM_SIZE` 0.8 × `sizeScale()` (0.78 to 1.2, by size) × depth 0.9 to 1.06 | about 56 to 102px |

Doors should be about 1.5 times the player's height. A 9 GB sack is about as tall as the penguin.

## Checking your work

Render the SVG on its own and look at it at full size before calling it done:

```sh
node scripts/svgview.mjs src/art/<room>.svg /tmp/room.png
```

`svgview.mjs` sets its own text sizes, about 1px larger than the game's (for example `.hull-name` is 17px there and 16px in the game). Check final text fit in the running game: `npm run dev` at 1280 by 800, or `scripts/shot.mjs`. For a blind test, hide all text and ask a fresh agent to name every object (see "Run, test, look" in [AGENTS.md](../AGENTS.md)).
