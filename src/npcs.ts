/**
 * Harbor folk: a few penguins who live in the rooms, potter about, and give a tip when clicked.
 * Pure presentation. They change no rule, carry nothing, and never speak for the scout.
 * Each is a recolored copy of the player's template with a hat and a held prop, so the cast stays one drawing
 * but no two read the same from across the room.
 */
import type { Room } from './sim'

export type Hat = 'captain' | 'beanie' | 'souwester'
export type Prop = 'coil' | 'basket' | 'clipboard' | 'can'

interface NpcDef {
  id: string
  name: string
  room: Room
  home: { x: number; y: number }
  /** How far they wander from home, in stage px. */
  range: { x: number; y: number }
  body: [string, string, string]
  hat: Hat
  /** What they carry. Drawn just behind the near flipper, so the flipper reads as holding it. */
  prop: Prop
  /** Body size against the player, within about ±6%, so the folk aren't one stamp. */
  size: number
  lines: string[]
}

export const NAVY: [string, string, string] = ['#1d4e89', '#153a66', '#4f8ad0']

export const NPCS: NpcDef[] = [
  {
    id: 'gil',
    name: 'Captain Gil',
    room: 'quay',
    home: { x: 196, y: 566 },
    range: { x: 40, y: 26 },
    body: ['#d8463b', '#a8302a', '#f08a80'],
    hat: 'captain',
    prop: 'coil',
    size: 1.05,
    lines: [
      'Caches ride the red boat. Apps, the blue tug. Your own things, the little sailboat.',
      'Ring the bell and your scout counts this Mac again.',
      'Press M for the map. Saves your flippers.',
      'The sea is for good. The Locker gives things back. Choose kindly.',
    ],
  },
  {
    id: 'mo',
    name: 'Mo',
    room: 'quay',
    home: { x: 1090, y: 652 },
    range: { x: 34, y: 18 },
    body: ['#f4c534', '#c9981f', '#ffe7a0'],
    hat: 'beanie',
    prop: 'basket',
    size: 0.95,
    lines: [
      'Your scout gives advice, but only you can throw.',
      'Press D to dance. Nobody minds.',
      'Fish? Help yourself. That crate never runs out.',
      'Ask your scout a question in the chat bar. It answers in a bubble.',
    ],
  },
  {
    id: 'fern',
    name: 'Fern',
    room: 'glasshouse',
    home: { x: 520, y: 636 },
    range: { x: 120, y: 26 },
    body: ['#3f9f63', '#2c7a4a', '#7fd09a'],
    hat: 'souwester',
    prop: 'can',
    size: 0.97,
    lines: [
      'That old tree is macOS. Lovely, and not ours to prune.',
      'The tank is the Docker disk. Shrink it from a terminal with a prune.',
      'Photos is your library. It stays.',
      'Nothing in here goes to the sea. We just look.',
    ],
  },
  {
    id: 'bolt',
    name: 'Bolt',
    room: 'locker',
    home: { x: 620, y: 540 },
    range: { x: 120, y: 14 },
    body: ['#8d62d6', '#6a46ad', '#b99af0'],
    hat: 'beanie',
    prop: 'clipboard',
    size: 1.03,
    lines: [
      'Everything in here can go back. Carry it out the roll door.',
      'The red hopper tips caches into the sea. Apps and your own files stay put. Two cards first.',
      'Five bays, then we stack them behind. Plenty of room.',
    ],
  },
]

export const HATS: Record<Hat, string> = {
  captain: `<g class="hat" stroke="#1a2332" stroke-linejoin="round" stroke-linecap="round">
    <path d="M64 30C62 12 84 2 104 4C124 6 140 16 136 32Z" fill="#f4f8fb" stroke-width="4.4"/>
    <path d="M112 8C126 12 136 20 136 32H118C120 24 118 16 112 8Z" fill="#d6e2ec" stroke="none"/>
    <path d="M64 30C62 12 84 2 104 4C124 6 140 16 136 32Z" fill="none" stroke-width="4.4"/>
    <path d="M62 28h76v10h-76z" fill="#1a2f52" stroke-width="3.6"/>
    <path d="M120 36c14 0 28 2 36 8c-12 4-28 4-38 0z" fill="#1a2332" stroke-width="2.6"/>
    <circle cx="98" cy="33" r="4.4" fill="#f2c14e" stroke-width="2"/>
  </g>`,
  beanie: `<g class="hat" stroke="#1a2332" stroke-linejoin="round" stroke-linecap="round">
    <path d="M66 34C64 14 82 2 100 2C120 2 138 14 136 34Z" fill="#e24b3f" stroke-width="4.4"/>
    <path d="M114 6C128 12 136 22 136 34H120C122 24 120 14 114 6Z" fill="#b5342b" stroke="none"/>
    <path d="M80 10v20M92 6v26M104 5v27M116 8v24" stroke="#b5342b" stroke-width="2.4"/>
    <path d="M66 34C64 14 82 2 100 2C120 2 138 14 136 34Z" fill="none" stroke-width="4.4"/>
    <rect x="62" y="28" width="78" height="12" rx="6" fill="#f4f8fb" stroke-width="3.6"/>
    <circle cx="100" cy="0" r="9" fill="#f4f8fb" stroke-width="3.6"/>
  </g>`,
  souwester: `<g class="hat" stroke="#1a2332" stroke-linejoin="round" stroke-linecap="round">
    <path d="M70 30C68 12 84 2 100 2C118 2 134 12 132 30Z" fill="#f4c534" stroke-width="4.4"/>
    <path d="M114 6C126 12 132 20 132 30H118C120 22 118 12 114 6Z" fill="#d6a521" stroke="none"/>
    <path d="M70 30C68 12 84 2 100 2C118 2 134 12 132 30Z" fill="none" stroke-width="4.4"/>
    <path d="M52 36C66 26 136 24 156 34C140 42 70 44 52 36Z" fill="#f4c534" stroke-width="4"/>
    <path d="M84 8c6-4 14-5 20-4" fill="none" stroke="#fff3c4" stroke-width="3"/>
  </g>`,
}

/**
 * Held props, in the 176x204 sprite space. Each sits around the near flipper (its tip rests near 56,150) and is
 * inserted just before `<g class="flipper r">`, so the flipper draws over it. They are top-level siblings, never
 * inside the flipper group (its walk and wave pivot on its own fill box). No lettering: the sprite is mirrored.
 */
export const PROPS: Record<Prop, string> = {
  // Gil: a coil of rope hung on the near shoulder, bulging out past the silhouette.
  coil: `<g class="kit kit-coil" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-10 40 128)">
    <path d="M40 150C38 162 40 172 46 180" stroke="#1a2332" stroke-width="15"/>
    <path d="M40 150C38 162 40 172 46 180" stroke="#e0b56a" stroke-width="6"/>
    <ellipse cx="34" cy="130" rx="20" ry="28" stroke="#1a2332" stroke-width="15"/>
    <ellipse cx="34" cy="130" rx="20" ry="28" stroke="#c99550" stroke-width="6"/>
    <ellipse cx="40" cy="128" rx="20" ry="29" stroke="#1a2332" stroke-width="15"/>
    <ellipse cx="40" cy="128" rx="20" ry="29" stroke="#e0b56a" stroke-width="6"/>
    <ellipse cx="46" cy="126" rx="20" ry="30" stroke="#1a2332" stroke-width="15"/>
    <ellipse cx="46" cy="126" rx="20" ry="30" stroke="#e8b878" stroke-width="6"/>
    <ellipse cx="46" cy="126" rx="20" ry="30" stroke="#b07a3c" stroke-width="6" stroke-dasharray="2.2 5.5"/>
    <path d="M30 108C32 102 36 98 41 97" stroke="#fff6e4" stroke-width="2.4"/>
  </g>`,
  // Mo: a wicker fish basket on the near flipper, two fish poking out.
  basket: `<g class="kit kit-basket" stroke="#1a2332" stroke-linejoin="round" stroke-linecap="round" transform="translate(-31.5 -42.5) scale(1.25)">
    <path d="M44 156C44 134 78 134 78 156" fill="none" stroke-width="7.2"/>
    <path d="M44 156C44 134 78 134 78 156" fill="none" stroke="#e0b56a" stroke-width="3.2"/>
    <path d="M42 156L36 140L46 146L50 138L52 156Z" fill="#8fa6ba" stroke-width="2.72"/>
    <path d="M58 158C58 144 68 140 78 144C82 148 82 154 80 158Z" fill="#6cc2f2" stroke-width="2.72"/>
    <circle cx="74" cy="148" r="1.8" fill="#1a2332" stroke="none"/>
    <path d="M36 158H88L82 188C81 192 78 194 74 194H48C44 194 41 192 40 188Z" fill="#e0b56a" stroke="none"/>
    <path d="M72 158H88L82 188C81 192 78 194 74 194H68Z" fill="#b07a3c" stroke="none"/>
    <path d="M40 170H85M42 181H83M52 160V193M62 160V194M72 160V193" fill="none" stroke="#a8713c" stroke-width="1.6"/>
    <path d="M36 158H88L82 188C81 192 78 194 74 194H48C44 194 41 192 40 188Z" fill="none" stroke-width="3.52"/>
    <rect x="32" y="152" width="60" height="9" rx="4" fill="#e8b878" stroke-width="2.88"/>
    <path d="M40 155H52" fill="none" stroke="#fff6e4" stroke-width="1.6"/>
  </g>`,
  // Bolt: a clipboard hugged to the chest under the near flipper.
  clipboard: `<g class="kit kit-clipboard" stroke="#1a2332" stroke-linejoin="round" stroke-linecap="round" transform="rotate(10 104 134)">
    <rect x="82" y="106" width="44" height="56" rx="5" fill="#b07a3c" stroke="none"/>
    <path d="M118 108H121C124 108 126 110 126 113V157C126 160 124 162 121 162H118Z" fill="#7a4a27" stroke="none"/>
    <rect x="82" y="106" width="44" height="56" rx="5" fill="none" stroke-width="4.4"/>
    <rect x="88" y="115" width="31" height="41" rx="1.5" fill="#fff6e4" stroke-width="2"/>
    <path d="M93 125H114M93 132H114M93 139H108" fill="none" stroke="#8fa6ba" stroke-width="2.2"/>
    <path d="M93 146H112" fill="none" stroke="#8fa6ba" stroke-width="2.2"/>
    <circle cx="111" cy="150" r="2.6" fill="#d9493e" stroke="none"/>
    <rect x="95" y="101" width="18" height="10" rx="3" fill="#8fa6ba" stroke-width="3"/>
    <path d="M99 104H106" fill="none" stroke="#f4f8fb" stroke-width="1.8"/>
  </g>`,
  // Fern: a steel watering can, spout forward, rose up.
  can: `<g class="kit kit-can" stroke="#1a2332" stroke-linejoin="round" stroke-linecap="round" transform="translate(-30.25 -43.75) scale(1.25)">
    <path d="M48 160C48 142 74 142 74 160" fill="none" stroke-width="7.2"/>
    <path d="M48 160C48 142 74 142 74 160" fill="none" stroke="#8fa6ba" stroke-width="3.2"/>
    <path d="M76 184L102 160" fill="none" stroke-width="8.0"/>
    <path d="M76 184L102 160" fill="none" stroke="#8fa6ba" stroke-width="3.68"/>
    <path d="M98 156L108 150C111 152 112 157 110 161L101 164Z" fill="#7690a6" stroke-width="2.72"/>
    <path d="M40 160H82L80 190C80 193 78 195 75 195H47C44 195 42 193 42 190Z" fill="#8fa6ba" stroke="none"/>
    <path d="M70 160H82L80 190C80 193 78 195 75 195H68Z" fill="#7690a6" stroke="none"/>
    <path d="M41 168H81" fill="none" stroke="#5c7388" stroke-width="1.6"/>
    <path d="M48 174V186" fill="none" stroke="#f4f8fb" stroke-width="2.08"/>
    <path d="M40 160H82L80 190C80 193 78 195 75 195H47C44 195 42 193 42 190Z" fill="none" stroke-width="3.52"/>
    <path d="M113 156l4 1M112 162l4 3" fill="none" stroke="#3aa0f2" stroke-width="1.76"/>
  </g>`,
}

interface NpcState {
  def: NpcDef
  el: HTMLElement
  x: number
  y: number
  tx: number
  ty: number
  facing: 1 | -1
  nextMove: number
  line: number
  bubbleUntil: number
  fidgetUntil: number
}

const npcs: NpcState[] = []

function rand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

/** Build the harbor folk from the player's template. Call once after the templates exist. */
export function createNpcs(template: HTMLTemplateElement, objectsFor: (room: Room) => HTMLElement) {
  for (const def of NPCS) {
    const node = template.content.firstElementChild!.cloneNode(true) as HTMLElement
    node.classList.remove('you')
    node.classList.add('npc')
    node.classList.add(`npc-${def.id}`)
    node.dataset.act = 'npc'
    node.dataset.npc = def.id
    delete node.dataset.bird
    node.querySelector('.ring')?.remove()
    node.querySelector('.emote')?.remove()
    const svg = node.querySelector('svg')!
    let markup = svg.innerHTML
    NAVY.forEach((from, i) => (markup = markup.split(from).join(def.body[i])))
    // Template clip ids must stay unique per copy.
    markup = markup.replace(/youClip/g, `npc-${def.id}-clip`)
    // The prop goes just behind the near flipper, so the flipper draws over it and reads as holding it.
    const at = markup.indexOf('<g class="flipper r">')
    // Wrapped so CSS can animate the prop (a little task loop) without touching its own placement transform.
    const prop = `<g class="kit-anim kit-anim-${def.prop}">${PROPS[def.prop]}</g>`
    markup = at < 0 ? markup + prop : markup.slice(0, at) + prop + markup.slice(at)
    svg.innerHTML = markup + HATS[def.hat]
    svg.style.overflow = 'visible'
    node.querySelector('.name')!.textContent = def.name
    node.querySelector<SVGElement>('.eyes')?.style.setProperty('animation-delay', `-${(def.id.length * 1.3) % 5}s`)
    // A little speech badge until you've talked to them once: it marks harbor folk as people with tips.
    const badge = document.createElement('div')
    badge.className = 'npc-badge'
    badge.innerHTML = '<i></i><i></i><i></i>'
    node.appendChild(badge)
    node.setAttribute('role', 'button')
    node.setAttribute('aria-label', `${def.name}. Click for a tip.`)
    objectsFor(def.room).appendChild(node)
    npcs.push({ def, el: node, x: def.home.x, y: def.home.y, tx: def.home.x, ty: def.home.y, facing: -1, nextMove: 2000 + rand(def.id.length) * 4000, line: 0, bubbleUntil: 0, fidgetUntil: 0 })
  }
}

/** A click on one of them: they turn to you and say the next tip. Returns true if it was an NPC. */
export function talkTo(id: string, now: number, playerX: number): boolean {
  const npc = npcs.find((entry) => entry.def.id === id)
  if (!npc) return false
  const bubble = npc.el.querySelector<HTMLElement>('.bubble')!
  bubble.textContent = npc.def.lines[npc.line % npc.def.lines.length]
  bubble.hidden = false
  bubble.classList.remove('pop')
  void bubble.offsetWidth
  bubble.classList.add('pop')
  npc.line += 1
  npc.el.classList.add('is-met')
  npc.bubbleUntil = now + 5200
  npc.facing = playerX >= npc.x ? 1 : -1
  npc.tx = npc.x
  npc.ty = npc.y
  npc.nextMove = now + 6500
  return true
}

/** Move and draw them. `scale` is the cast's base size; `still` freezes wandering for the Still harbor setting. */
export function stepNpcs(now: number, dt: number, room: Room, scale: number, still: boolean) {
  npcs.forEach((npc, index) => {
    if (npc.def.room !== room) return
    if (!still && now > npc.nextMove) {
      const r1 = rand(now * 0.001 + index * 7.1)
      const r2 = rand(now * 0.0013 + index * 3.3)
      npc.tx = npc.def.home.x + (r1 * 2 - 1) * npc.def.range.x
      npc.ty = npc.def.home.y + (r2 * 2 - 1) * npc.def.range.y
      npc.nextMove = now + 4000 + rand(now + index) * 6000
      if (rand(now * 0.7 + index) < 0.35) npc.fidgetUntil = now + 700
    }
    const dx = npc.tx - npc.x
    const dy = npc.ty - npc.y
    const dist = Math.hypot(dx, dy)
    const walking = dist > 2
    if (walking) {
      const stepLen = Math.min(dist, 70 * dt)
      npc.x += (dx / dist) * stepLen
      npc.y += (dy / dist) * stepLen
      if (Math.abs(dx) > 1) npc.facing = dx > 0 ? 1 : -1
    }
    const depth = (0.88 + Math.min(1, Math.max(0, (npc.y - 480) / 220)) * 0.16) * scale * npc.def.size
    npc.el.style.transform = `translate(${npc.x}px, ${npc.y}px) scale(${depth})`
    npc.el.style.setProperty('--inv', String(1 / depth))
    npc.el.style.zIndex = String(Math.round(npc.y))
    npc.el.querySelector<HTMLElement>('.turn')!.style.setProperty('--face', String(npc.facing))
    npc.el.classList.toggle('is-walking', walking)
    npc.el.classList.toggle('is-wave', !walking && npc.fidgetUntil > now && index % 2 === 0)
    npc.el.classList.toggle('is-hop', !walking && npc.fidgetUntil > now && index % 2 === 1)
    const bubble = npc.el.querySelector<HTMLElement>('.bubble')!
    if (npc.bubbleUntil && now > npc.bubbleUntil) {
      bubble.hidden = true
      npc.bubbleUntil = 0
    }
  })
}
