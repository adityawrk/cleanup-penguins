# Art guide

How the harbor is drawn. The reference room is `src/art/quay.svg`. Match that file. A 61-second reference recording (a kids' MMO used as an agent harness) may be at `~/Downloads/a3Q9FF9PLI7XS3b3.mp4`, outside the repo. Use it for craft only: line weight, flat color, object density. Never trace it or copy its rooms, creatures or UI.

## The look

Crisp flat vector in the style of a late-2000s kids' MMO: a room full of objects you recognize before you read a label, small characters in a big place, and chunky glossy UI. The harbor is its own place. Don't copy another game's characters, rooms, logos or map.

- **Ink.** Every outline uses one color, `#1a2332`. Never black, never gray.
- **Line hierarchy.** Silhouettes are 4.4 to 5px. Inner structure (windows, planks, folds) is 1.6 to 2.4px. Every prop also gets 2 to 4 open "ink ticks" (grain flicks, cracks, snow flecks): short open strokes, not closed shapes. Monoline outlines read as a stock icon set; this contrast is what makes it read as illustration. A thin object drawn as a single ink stroke (a mast, a rail) can be 5px. Painted stripes drawn as wide strokes use their paint color, not ink. Use round joins and round caps everywhere (`stroke-linejoin="round" stroke-linecap="round"`).
- **Fill.** Flat colors only. In the art there is no `<linearGradient>`, no `<radialGradient>`, no blur, no filter, no glow and no drop shadow. Use opacity only for the lighthouse beam, highlights and soft floor shade. The hover brighten is CSS on `.hot`, not part of the drawing.
- **Cel shade.** Each object gets one darker shadow shape on its right or lower side. Draw it with `stroke="none"` after the fill and before the outline. Then redraw the silhouette with `fill="none"` so the ink sits on top. Add one highlight, a short white or pale stroke, where the light hits.
- **Snow.** Roofs, posts and crates get a lumpy white cap (`#fff`, with 2.6 to 3.4px ink) and a pale-blue inner line (`#d6ecf9`). The caps are what make the harbor feel cold and cozy.
- **Floor shade.** Objects standing on a floor get a flat contact-shadow ellipse under them: `#1a2332` at about 13% opacity, no ink. Light comes from the upper left, so the one darker cel-shade tone goes on right and bottom faces.
- **Depth.** Rooms have a vanishing point and things at different depths: the quay's back edge is an arch, its boats moor at three scales (each boat's scale lives on a wrapper `<g>` because CSS owns the `.q-boat` transform), and buildings show a receding side wall.
- **Density.** Every room needs a back layer (sky, wall or shelves) and a middle layer of named, clickable things. Small props fill the gaps: crates, rope coils, lanterns, buoys, a gull, a fish crate. Leave the walkable floor open.
- **Characters.** They live in the `index.html` templates, not in the art files. Each has flat fills, one heavy ink outline (bodies 5px), and three-toed feet, drawn in three-quarter view facing right (the code mirrors them to face left). The player is a classic cartoon penguin of the genre, but our own: a tall egg body, big eyes set high on the navy head, a chunky beak that pokes out past the silhouette, and one white belly front. Scouts are small, saturated round birds (no fur balls), each with a signature color and head feature, eyes on the colored head, a pale belly in `<g class="belly">`. Never trace or replicate another game's avatar or pets. The player stands on a blue floor ring (`.ring`). The face parts are in `<g class="face">` so the back view can hide them.
- **Text in art.** Painted words use Fredoka through CSS classes in `src/style.css`. `.sign-word` is 19px, 700, tracked. `.hull-name` is 16px, 700. `.hull-size` is 14px, 700. `.tag-word` is 14px, 600. `.tag-word.strong` is 12.5px, 700, tracked. Live values are `<text id="...">` elements that `main.ts` fills.

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

- **Rooms.** Each room is `src/art/<room>.svg` with `viewBox="0 0 1280 708"` and `aria-hidden="true"` on the root. `main.ts` injects it into `.paint[data-art]` through its `ART` map. A new file needs an entry in that map and a `data-art` host in `index.html`.
- **Foregrounds.** `<room>-fore.svg` is drawn above the characters, for things they walk behind. The quay, the Locker and the Glasshouse have one. The hold does not. Keep foregrounds to the edges.
- **ids.** Every `id` in a file starts with its prefix: `q-` quay, `h-` hold, `l-` locker, `g-` glasshouse, `t-` title (`hello.svg`). The exceptions are the live text ids `label-caches`, `label-apps`, `label-stuff` and `locker-count`, all in `quay.svg`.
- **Clicks.** The painting ignores the mouse (`.paint { pointer-events: none }`). A group that should be clickable gets `class="hot"`, a `<title>`, and the `data-act` the game expects. The actions are `board` + `data-hold`, `enter` + `data-room`, `rope`, `who`, `toy` + `data-toy`, `hole` + `data-hole`, `gang`, `empty`, `buoy` and `fda`. Hover brightens it.
- **Animation.** It is CSS in `src/style.css`, keyed off classes in the art. Prefix those classes too. Gentle loops only: bob, sway, puff, blink. All of it stops under `prefers-reduced-motion`.

## Anchors the code depends on

Moving or renaming any of these breaks the game, not just the picture.

- **Positions in `src/sim.ts`.** `SPOTS` holds the sea stand (1040, 560), the bin stand (300, 548), the chute (1180, 392), the bin (248, 404), the bell (290, 600), the boarding points, the doors, the roll door (160, 520) and the hopper (1070, 596). `NEST` is at (990, 640). `BANDS` sets the walkable floor per room, and the Glasshouse wall is at y 560. `lockerSlot()` sets the bays and `shedSlot()` the sheds. The emptying arc ends at (1160, 300).
- **Positions in `src/main.ts`.** The guide arrows point at (424, 300) on the quay, and at (1181, 300) and (248, 316) in the hold.
- **Classes and attributes.** `playToy` toggles `.flown` on `.q-gull` and `.flash` on `.q-beam`. CSS animates `.q-boat[data-hold]`, `.q-smoke` and `.q-bell-swing`, whose `transform-origin` is fixed at 290px 514px. Glasshouse exhibits are told apart by their `<title>` text ("docker", "photo", or anything else for macOS).
- **Comments.** `scripts/hello/gen.mjs` lifts the trawler out of `quay.svg` by its `<!-- BOAT 1` comment. It also reads the `tpl-you` and `tpl-claude` templates and their clip ids.

## Scale

The stage is 1280 by 708. The player sprite box is 176×204, shown at 0.56 times a depth factor of 0.88 to 1.04. That makes it about 100px tall at the back of the floor and about 119px at the front. A scout's box is 128×144, shown at 0.46 times depth times effort (0.72 to 1.58). That makes it about 42 to 109px tall. Doors should be about 1.5 times the player's height. An item is drawn in a 120×100 box, shown at `sizeScale()` (0.78 to 1.2, by size) times depth.

## Checking your work

Render the SVG on its own and look at it at full size before calling it done:

```sh
node scripts/svgview.mjs src/art/<room>.svg /tmp/room.png
```

`svgview.mjs` sets its own text sizes, about 1px larger than the game's (for example `.hull-name` is 17px there and 16px in the game). Check final text fit in the running game: `npm run dev` at 1280 by 800, or `scripts/shot.mjs`. For a blind test, hide all text and ask a fresh agent to name every object (see "Run, test, look" in [AGENTS.md](../AGENTS.md)).
