# Art guide

How the harbor is drawn. The reference room is `src/art/quay.svg`. Match it, not the reference video.

## The look

Crisp flat vector in the style of a late-2000s kids' MMO: a room full of objects you recognize before you read a label, small characters in a big place, and chunky glossy UI. The harbor is its own place. Don't copy another game's characters, rooms, logos or map.

- **Ink.** One color for every outline: `#1a2332`. Never black, never gray.
- **Line hierarchy.** Silhouettes 4 to 4.6px. Inner structure (windows, planks, folds) 2.4 to 3.6px. Tiny details 1.6 to 2.4px. Round joins and round caps everywhere (`stroke-linejoin="round" stroke-linecap="round"`).
- **Fill.** Flat colors only. No `<linearGradient>`, no `<radialGradient>`, no blur, no filters, no glow, no drop shadows. Use opacity only for the lighthouse beam, highlights and soft floor shade.
- **Cel shade.** Each object gets one darker shadow shape on its right or lower side, drawn with `stroke="none"` after the fill and before the outline. Then redraw the silhouette with `fill="none"` so the ink sits on top. Add one highlight (a short white or pale stroke) where light hits.
- **Snow.** Roofs, posts and crates get a lumpy white cap (`#fff`, 2.6 to 3.4px ink) with a pale-blue inner line (`#d6ecf9`). It is what makes the harbor feel cold and cozy.
- **Floor shade.** Objects standing on a floor get a flat ellipse under them, no ink, a shade darker than the floor (`#b98447` on the deck).
- **Density.** Every room needs a back layer (sky, wall or shelves), a middle layer of named, clickable things, and small props that fill the gaps (crates, rope coils, lanterns, buoys, a gull, a fish crate). Leave the walkable floor open.
- **Text in art.** Painted words use Fredoka through CSS classes: `.sign-word` (19px, 700, tracked), `.hull-name` (16px, 700), `.hull-size` (14px), `.tag-word` (14px, 600), `.tag-word.strong`. Live values are `<text id="...">` that `main.ts` fills.

## Palette

| Use | Colors |
|---|---|
| Sky bands | `#4fb2ee`, `#6cc2f2`, `#8fd2f6` |
| Sea | `#2a87d6`, `#3f9be0`, horizon `#62b8ee`, foam `#c9ecff` |
| Snow and ice | `#fff`, `#f4faff`, shade `#c7e4f6`, `#d6ecf9` |
| Wood | deck `#e8b878` / `#e0ac6b`, seams `#a8713c`, posts `#9a6236`, dark `#7a4a27`, crates `#e0b56a` / `#b07a3c` |
| Steel | `#8fa6ba`, `#7690a6`, `#5c7388`, roof `#4e6b86` / `#3d5670` |
| Paint red | `#d9493e`, `#e24b3f`, shade `#b03329` |
| Paint blue | `#2f6fb8`, `#3aa0f2`, shade `#225a99` |
| Paint green | `#3f9f63`, `#5bb04b`, `#4bae5b`, shade `#2c7a4a` |
| Yellow and brass | `#ffd23f`, `#f4c534`, `#f2c14e`, shade `#d39a2b` |
| Orange | `#f08a2c`, `#f27d32` |
| Paper and signs | cream `#fff6e4`, sign `#f3d7a1`, sign shade `#e3bd80` |
| Glass | `#bfe8f7`, `#d6f2fb`, frame `#f4f8fb` |

## Files and layers

- Each room is `src/art/<room>.svg` with `viewBox="0 0 1280 708"`, injected into `.paint[data-art]` by `main.ts`. A second file, `<room>-fore.svg`, is drawn above the characters for things they walk behind. Keep the foreground to the edges.
- **ids.** Every `id` in a file starts with the room's prefix (`q-` quay, `h-` hold, `l-` locker, `g-` glasshouse). Live text ids listed in each room's brief are the exception.
- **Clicks.** The painting ignores the mouse. A group that should be clickable gets `class="hot"` and the `data-act` (plus `data-room` / `data-hold`) the game expects, and a `<title>`. Hover brightens it.
- **Animation.** CSS in `src/style.css`, keyed off classes in the art (prefix them too). Gentle loops only: bob, sway, puff, blink. All of it stops under `prefers-reduced-motion`.

## Scale

The stage is 1280 by 708. The player penguin stands about 105 to 120px tall at the front of the floor and about 100px at the back. A scout is 50 to 105px depending on effort. Doors should be about 1.5 times the player's height. Items in the hold are 50 to 90px.

## Checking your work

Render the SVG on its own and look at it at full size before calling it done:

```sh
node scripts/svgview.mjs src/art/<room>.svg /tmp/room.png
```

Then check it in the running game with `npm run dev` at 1280 by 800.
