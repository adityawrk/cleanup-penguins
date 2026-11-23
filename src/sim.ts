export type Room = 'quay' | 'hold' | 'locker' | 'glasshouse'
export type Hold = 'caches' | 'apps' | 'stuff'
export type BirdId = 'claude' | 'codex' | 'cursor' | 'custom'
export type EffortId = 'low' | 'medium' | 'high' | 'xhigh'

export interface ModelChoice {
  id: string
  label: string
  line: string
}

export interface EffortChoice {
  id: EffortId
  label: string
  line: string
}

export const EFFORTS: EffortChoice[] = [
  { id: 'low', label: 'Low', line: 'Smaller. A quick glance.' },
  { id: 'medium', label: 'Medium', line: 'A proper look.' },
  { id: 'high', label: 'High', line: 'Bigger. It will look harder.' },
  { id: 'xhigh', label: 'Extra high', line: 'Biggest. It will look very hard.' },
]

export function effortScale(id: EffortId): number {
  if (id === 'low') return 0.72
  if (id === 'high') return 1.28
  if (id === 'xhigh') return 1.58
  return 1
}

export const MODELS: Record<BirdId, ModelChoice[]> = {
  claude: [
    { id: 'fable', label: 'Fable', line: 'Fable. The top of this satchel.' },
    { id: 'opus', label: 'Opus', line: 'Opus. The middle of the three.' },
    { id: 'sonnet', label: 'Sonnet', line: 'Sonnet. The lightest of the three.' },
  ],
  codex: [
    { id: 'astra', label: 'Astra', line: 'Astra. The top of this satchel.' },
    { id: 'sol', label: 'Sol', line: 'Sol. The middle of the three.' },
    { id: 'terra', label: 'Terra', line: 'Terra. The lightest of the three.' },
  ],
  cursor: [
    { id: 'grok-4.7', label: 'Grok 4.7', line: 'Grok 4.7. The latest one.' },
    { id: 'grok-4.6', label: 'Grok 4.6', line: 'Grok 4.6. The one before.' },
    { id: 'grok-4.5', label: 'Grok 4.5', line: 'Grok 4.5. The oldest of these three.' },
  ],
  custom: [{ id: 'default', label: 'Default', line: 'The model that agent is signed into.' }],
}

const ANTIGRAVITY_MODELS: ModelChoice[] = [
  { id: 'neon', label: 'Neon', line: 'Neon. The top of this satchel.' },
  { id: 'carbon', label: 'Carbon', line: 'Carbon. The middle of the three.' },
  { id: 'argon', label: 'Argon', line: 'Argon. The lightest of the three.' },
]

export function modelsFor(world: World): ModelChoice[] {
  if (world.scout === 'custom' && world.customName.trim().toLowerCase() === 'antigravity') return ANTIGRAVITY_MODELS
  return MODELS[world.scout ?? 'claude']
}
export type BeingId = 'you' | BirdId
export type Hole = 'sea' | 'bin'

export interface Point {
  x: number
  y: number
}

export const SPOTS = {
  seaStand: { x: 980, y: 630 },
  binStand: { x: 280, y: 630 },
  chute: { x: 1136, y: 455 },
  bin: { x: 150, y: 500 },
  bead: { x: 290, y: 600 },
  entrance: {
    quay: { x: 640, y: 600 },
    hold: { x: 230, y: 640 },
    locker: { x: 280, y: 640 },
    glasshouse: { x: 320, y: 640 },
  } satisfies Record<Room, Point>,
  board: {
    caches: { x: 424, y: 496 },
    apps: { x: 616, y: 496 },
    stuff: { x: 804, y: 496 },
  } satisfies Record<Hold, Point>,
  door: {
    locker: { x: 150, y: 496 },
    glasshouse: { x: 1150, y: 496 },
  },
  gang: { x: 230, y: 650 },
  tip: { x: 980, y: 630 },
  plank: { x: 190, y: 640 },
}

export const NEST = { x: 990, y: 640 }

export const HOMES: Record<BirdId, Point> = {
  cursor: NEST,
  claude: NEST,
  codex: NEST,
  custom: NEST,
}

export interface Scope {
  id: string
  kind: 'mac' | 'repo'
  label: string
  path: string
  x: number
  y: number
}

export const MAC_SCOPE: Scope = { id: 'mac', kind: 'mac', label: 'This Mac', path: '~', x: 290, y: 600 }

/** Where the nth shed stands on the quay's back edge. Sheds sit between the third boat and the Glasshouse. */
export function shedSlot(index: number): Point {
  return { x: 934 + (index % 3) * 62, y: 448 }
}

export function starterRepos(): Scope[] {
  return [
    { id: 'penguins', kind: 'repo', label: 'cleanup-penguins', path: '~/projects/cleanup-penguins', ...shedSlot(0) },
    { id: 'lighthouse', kind: 'repo', label: 'lighthouse', path: '~/projects/lighthouse', ...shedSlot(1) },
  ]
}

interface Band {
  x0: number
  x1: number
  y0: number
  y1: number
  wall?: number
}

const BANDS: Record<Room, Band> = {
  quay: { x0: 140, x1: 1150, y0: 490, y1: 690 },
  hold: { x0: 130, x1: 1150, y0: 530, y1: 670 },
  locker: { x0: 150, x1: 1130, y0: 545, y1: 675 },
  glasshouse: { x0: 170, x1: 1110, y0: 560, y1: 675, wall: 560 },
}

export interface Being {
  id: BeingId
  name: string
  x: number
  y: number
  tx: number
  ty: number
  facing: 1 | -1
  awake: boolean
  mode: 'sleep' | 'follow' | 'post' | 'go'
  home: Point
  bubble: string | null
  sticky: boolean
  bubbleUntil: number
}

export interface Item {
  id: string
  hold: Hold
  form: 'sack' | 'crate' | 'trunk' | 'packed' | 'disk'
  name: string
  path: string
  tenths: number
  phrase: string
  sea: boolean
  stale: boolean
  x: number
  y: number
  disposed: 'none' | 'sea' | 'locker'
  seaBird: BirdId | null
  binBird: BirdId | null
  seaLine: string | null
  binLine: string | null
  rebuild: string
  sheet: string
  scopeId: string
}

export type Card =
  | {
      kind: 'sea' | 'bin' | 'restore'
      itemId: string
      face: 1 | 2
      lockedUntil: number
      redirected: boolean
    }
  | { kind: 'wake' | 'nest'; birdId: BirdId; face: 1; lockedUntil: number }
  | { kind: 'empty'; face: 1 | 2; lockedUntil: number }

export type Pending =
  | { type: 'board'; hold: Hold }
  | { type: 'enter'; room: Room }
  | { type: 'lift'; id: string }
  | { type: 'hole'; hole: Hole }
  | { type: 'pin'; birdId: BirdId }
  | { type: 'restore'; id: string }
  | { type: 'empty' }
  | { type: 'scope'; id: string }

export interface Toss {
  itemId: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  started: number
  until: number
  facing: 1 | -1
}

export interface World {
  room: Room
  hold: Hold
  beings: Being[]
  items: Item[]
  carrying: string | null
  card: Card | null
  pending: Pending | null
  toss: Toss | null
  emptying: { until: number; tenths: number; ids: string[] } | null
  splash: { until: number; x: number; y: number } | null
  sheetItemId: string | null
  freeTenths: number
  capacityTenths: number
  lockerTenths: number
  arguedAt: number | null
  now: number
  lastInput: number
  snoreUntil: number
  fda: boolean
  trail: Point[]
  scout: BirdId | null
  scope: Scope
  repos: Scope[]
  brief: string[]
  steering: string[]
  tool: { label: string; walk: boolean } | null
  fidget: { kind: 'wave' | 'hop' | 'wiggle'; until: number } | null
  fidgetAt: number
  fidgets: number
  customName: string
  model: string
  effort: EffortId
}

export interface CardView {
  title: string
  meta: string
  path: string
  note: string
  yes: string
  no: string
  focus: 'yes' | 'no'
  locked: boolean
  icon: Item['form'] | null
}

export interface Draw {
  x: number
  y: number
  rot: number
  scale: number
  hide: boolean
}

const FREE = 438
const CAP = 5120

export function gb(tenths: number): string {
  const n = tenths / 10
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export function gbWord(tenths: number): string {
  return `${gb(tenths)} GB`
}

export function poleFree(world: World): string {
  return (world.freeTenths / 10).toFixed(1)
}

export function poleUsed(world: World): string {
  return ((world.capacityTenths - world.freeTenths) / 10).toFixed(1)
}

export function poleCap(world: World): string {
  return (world.capacityTenths / 10).toFixed(0)
}

export function waterPx(world: World): number {
  const used = 1 - world.freeTenths / world.capacityTenths
  return Math.round(268 + used * 28)
}

export function clampPoint(room: Room, x: number, y: number): { x: number; y: number; oof: boolean } {
  const band = BANDS[room]
  const cx = Math.min(band.x1, Math.max(band.x0, x))
  let cy = Math.min(band.y1, Math.max(band.y0, y))
  let oof = false
  if (band.wall !== undefined && y < band.wall) {
    cy = band.wall
    oof = true
  }
  return { x: cx, y: cy, oof }
}

function bird(id: BirdId, name: string): Being {
  const home = HOMES[id]
  return {
    id,
    name,
    x: home.x,
    y: home.y,
    tx: home.x,
    ty: home.y,
    facing: 1,
    awake: false,
    mode: 'sleep',
    home,
    bubble: null,
    sticky: false,
    bubbleUntil: 0,
  }
}

function cache(
  partial: Omit<Item, 'disposed' | 'sea' | 'form' | 'seaBird' | 'binBird' | 'stale' | 'scopeId' | 'seaLine' | 'binLine'> & {
    form?: Item['form']
    seaLine?: string
    binLine?: string
    stale?: boolean
    scopeId?: string
  },
): Item {
  const { seaLine, binLine, form, stale, scopeId, ...rest } = partial
  return {
    form: form ?? 'sack',
    sea: true,
    stale: stale ?? true,
    disposed: 'none',
    scopeId: scopeId ?? 'mac',
    seaBird: 'codex',
    binBird: 'claude',
    seaLine: seaLine ?? 'Cache. It rebuilds.',
    binLine: binLine ?? 'The Locker can still give it back.',
    ...rest,
  }
}

export function createWorld(name: string, scout: BirdId | null = 'claude'): World {
  const you: Being = {
    id: 'you',
    name,
    x: SPOTS.entrance.quay.x,
    y: SPOTS.entrance.quay.y,
    tx: SPOTS.entrance.quay.x,
    ty: SPOTS.entrance.quay.y,
    facing: 1,
    awake: true,
    mode: 'follow',
    home: SPOTS.entrance.quay,
    bubble: null,
    sticky: false,
    bubbleUntil: 0,
  }

  const items: Item[] = [
    cache({
      id: 'codex',
      hold: 'caches',
      name: 'Codex cache',
      path: '~/Library/Caches/com.openai.codex',
      tenths: 21,
      phrase: 'not touched in 6 months',
      x: 680,
      y: 655,
      seaLine: 'Cache. I rebuild it.',
      binLine: 'The index is in the sack. Rebuilding costs the 2.1.',
      rebuild: 'Codex rebuilds it next run.',
      sheet:
        'Almost all of it is the index. The sea is permanent. Codex rebuilds it next time it runs. The Locker cannot give it back.',
    }),
    cache({
      id: 'chrome',
      hold: 'caches',
      name: 'Chrome cache',
      path: '~/Library/Caches/Google/Chrome',
      tenths: 14,
      phrase: 'not touched in 2 weeks',
      x: 400,
      y: 650,
      rebuild: 'Chrome rebuilds it as you browse.',
      sheet: 'Browser cache. The sea is permanent. Chrome fills it again as you browse.',
    }),
    cache({
      id: 'bun',
      hold: 'caches',
      name: 'Bun cache',
      path: '~/.bun/install/cache',
      tenths: 11,
      phrase: 'not touched in 9 days',
      x: 1080,
      y: 640,
      rebuild: 'Bun downloads it again when it needs it.',
      sheet: 'Package cache. The sea is permanent. The next install fetches what it needs.',
    }),
    cache({
      id: 'npm',
      hold: 'caches',
      name: 'npm cache',
      path: '~/.npm',
      tenths: 8,
      phrase: 'not touched in 3 weeks',
      x: 470,
      y: 560,
      rebuild: 'npm fills it again on the next install.',
      sheet: 'Package cache. The sea is permanent. npm rebuilds it.',
    }),
    cache({
      id: 'playwright',
      hold: 'caches',
      name: 'Playwright browsers',
      path: '~/Library/Caches/ms-playwright',
      tenths: 5,
      phrase: 'not touched in 5 weeks',
      x: 900,
      y: 560,
      rebuild: 'Playwright downloads browsers again when tests run.',
      sheet: 'Browser binaries for tests. The sea is permanent. The next run can download them.',
    }),
    cache({
      id: 'packed',
      hold: 'caches',
      form: 'packed',
      name: '14 small caches',
      path: '~/Library/Caches',
      tenths: 11,
      phrase: 'safe to clear',
      x: 680,
      y: 490,
      seaLine: 'All of these rebuild.',
      binLine: 'Or keep them in the Locker.',
      rebuild: 'These caches rebuild themselves.',
      sheet: 'Fourteen caches under 200 MB. The sea is permanent. Each one is rebuilt by the app that owns it.',
    }),
    {
      id: 'wow',
      hold: 'apps',
      form: 'crate',
      name: 'World of Warcraft',
      path: '/Applications/World of Warcraft',
      tenths: 490,
      phrase: 'last opened 11 months ago',
      sea: false,
      stale: true,
      x: 660,
      y: 630,
      disposed: 'none',
      scopeId: 'mac',
      seaBird: null,
      binBird: 'claude',
      seaLine: null,
      binLine: "You haven't opened this since last December.",
      rebuild: '',
      sheet: 'An application you have not opened in 11 months. The bin keeps it in the Locker, where you can carry it back. The pole will not move.',
    },
    {
      id: 'recording',
      hold: 'stuff',
      form: 'trunk',
      name: 'Screen recording',
      path: '~/Documents/Screen Recording.mov',
      tenths: 84,
      phrase: 'last opened 3 weeks ago',
      sea: false,
      stale: false,
      x: 560,
      y: 620,
      disposed: 'none',
      scopeId: 'mac',
      seaBird: null,
      binBird: 'claude',
      seaLine: null,
      binLine: 'You opened this 3 weeks ago.',
      rebuild: '',
      sheet: 'Your recording. The chute will not take it. The Locker can, and you can carry it back.',
    },
    {
      id: 'installer',
      hold: 'stuff',
      form: 'disk',
      name: 'Installer disk',
      path: '~/Downloads/App.dmg',
      tenths: 26,
      phrase: 'downloaded 4 months ago',
      sea: false,
      stale: true,
      x: 800,
      y: 590,
      disposed: 'none',
      scopeId: 'mac',
      seaBird: null,
      binBird: 'codex',
      seaLine: null,
      binLine: 'Installer. Done once it is installed.',
      rebuild: '',
      sheet: 'A disk image in Downloads. The Locker can hold it. The pole will not move until you empty the Locker into the sea.',
    },
    {
      id: 'nm',
      hold: 'caches',
      form: 'crate',
      name: 'node_modules',
      path: '~/projects/cleanup-penguins/node_modules',
      tenths: 42,
      phrase: 'rebuilt by npm install',
      sea: false,
      stale: true,
      x: 620,
      y: 630,
      disposed: 'none',
      scopeId: 'penguins',
      seaBird: null,
      binBird: 'claude',
      seaLine: null,
      binLine: 'It comes back with npm install.',
      rebuild: '',
      sheet: 'Dependencies for this repo. The Locker can hold them. npm install brings them back. The pole will not move.',
    },
    {
      id: 'dist',
      hold: 'caches',
      form: 'sack',
      name: 'dist',
      path: '~/projects/cleanup-penguins/dist',
      tenths: 8,
      phrase: 'build output',
      sea: true,
      stale: true,
      x: 860,
      y: 590,
      disposed: 'none',
      scopeId: 'penguins',
      seaBird: 'claude',
      binBird: 'claude',
      seaLine: 'Build output. The next build writes it again.',
      binLine: 'The Locker can still give it back.',
      rebuild: 'The next build writes it again.',
      sheet: 'Compiled output. The sea is permanent. Building the repo creates it again.',
    },
    {
      id: 'next',
      hold: 'caches',
      form: 'sack',
      name: '.next',
      path: '~/projects/lighthouse/.next',
      tenths: 16,
      phrase: 'not touched in 8 days',
      sea: true,
      stale: true,
      x: 640,
      y: 620,
      disposed: 'none',
      scopeId: 'lighthouse',
      seaBird: 'claude',
      binBird: 'claude',
      seaLine: 'Next.js build cache. It rebuilds.',
      binLine: 'The Locker can still give it back.',
      rebuild: 'Next.js rebuilds it.',
      sheet: 'Framework build cache inside the repo. The sea is permanent. The next dev server creates it again.',
    },
  ]

  const beings = [
    you,
    bird('claude', 'Claude'),
    bird('codex', 'Codex'),
    bird('cursor', 'Cursor'),
    bird('custom', 'Scout'),
  ]
  if (scout) {
    const active = beings.find((b) => b.id === scout)
    if (active) {
      active.awake = true
      active.mode = 'follow'
    }
  }

  return {
    room: 'quay',
    hold: 'caches',
    beings,
    items,
    carrying: null,
    card: null,
    pending: null,
    toss: null,
    emptying: null,
    splash: null,
    sheetItemId: null,
    freeTenths: FREE,
    capacityTenths: CAP,
    lockerTenths: 0,
    arguedAt: null,
    now: 0,
    lastInput: 0,
    snoreUntil: 0,
    fda: true,
    trail: [],
    scout,
    scope: MAC_SCOPE,
    repos: starterRepos(),
    brief: [],
    steering: [],
    tool: null,
    fidget: null,
    fidgetAt: 0,
    fidgets: 0,
    customName: 'Scout',
    model: 'opus',
    effort: 'high',
  }
}

export function being(world: World, id: BeingId): Being {
  const found = world.beings.find((b) => b.id === id)
  if (!found) throw new Error(`missing being ${id}`)
  return found
}

export function itemById(world: World, id: string): Item | undefined {
  return world.items.find((item) => item.id === id)
}

function birds(world: World): Being[] {
  return world.beings.filter((b) => b.id !== 'you')
}

function touch(world: World, now: number) {
  world.lastInput = now
  world.now = now
}

function sayLine(b: Being, text: string, now: number, ms: number, sticky = false) {
  b.bubble = text.slice(0, 90)
  b.sticky = sticky
  b.bubbleUntil = sticky ? Number.POSITIVE_INFINITY : now + ms
}

function macItems(world: World, hold?: Hold): Item[] {
  return world.items.filter((item) => item.scopeId === 'mac' && (hold === undefined || item.hold === hold))
}

export function itemsHere(world: World): Item[] {
  if (world.scope.kind === 'repo') {
    return world.items.filter((item) => item.scopeId === world.scope.id)
  }
  return macItems(world, world.hold)
}

export function skiffTenths(world: World, hold: Hold): number {
  return macItems(world, hold)
    .filter((item) => item.disposed === 'none')
    .reduce((sum, item) => sum + item.tenths, 0)
}

export function scopeTenths(world: World, scopeId: string): number {
  return world.items
    .filter((item) => item.scopeId === scopeId && item.disposed === 'none')
    .reduce((sum, item) => sum + item.tenths, 0)
}

export function beadText(world: World): string | null {
  const top = macItems(world, 'caches')
    .filter((item) => item.disposed === 'none' && item.form !== 'packed')
    .sort((a, b) => b.tenths - a.tenths)[0]
  if (!top) return null
  return `mostly ${top.name} · ${gbWord(top.tenths)}`
}

export function signPath(world: World): string {
  if (world.room !== 'hold') return ''
  if (world.scope.kind === 'repo') {
    const top = itemsHere(world)
      .filter((item) => item.disposed === 'none')
      .sort((a, b) => b.tenths - a.tenths)[0]
    return top?.path ?? world.scope.path
  }
  const top = itemsHere(world)
    .filter((item) => item.disposed === 'none' && item.form !== 'packed')
    .sort((a, b) => b.tenths - a.tenths)[0]
  if (top) return top.path
  if (world.hold === 'caches') return '~/Library/Caches'
  if (world.hold === 'apps') return '/Applications'
  return '~/Documents'
}

export function holdTitle(hold: Hold): string {
  if (hold === 'caches') return 'Caches'
  if (hold === 'apps') return 'Applications'
  return 'Your stuff'
}

function moving(b: Being): boolean {
  return Math.hypot(b.tx - b.x, b.ty - b.y) > 4
}

export function poseOf(world: World, b: Being): 'sleep' | 'walk' | 'idle' | 'carry' {
  if (b.id === 'you' && world.carrying) return moving(b) ? 'walk' : 'carry'
  if (b.id !== 'you' && !b.awake && !moving(b)) return 'sleep'
  if (moving(b)) return 'walk'
  return 'idle'
}

export function sitting(world: World, b: Being): boolean {
  return b.awake && b.mode === 'follow' && !moving(b) && world.now - world.lastInput > 8000
}

function belongsHere(world: World, item: Item): boolean {
  if (item.disposed !== 'none' || world.room !== 'hold') return false
  if (world.scope.kind === 'repo') return item.scopeId === world.scope.id
  return item.scopeId === 'mac' && item.hold === world.hold
}

export function propVisible(world: World, item: Item): boolean {
  if (item.disposed === 'sea') return false
  if (world.toss?.itemId === item.id) return true
  if (world.carrying === item.id) return world.room === 'hold' || world.room === 'locker'
  if (item.disposed === 'locker') return world.room === 'locker'
  if (world.room !== 'hold' || item.disposed !== 'none') return false
  if (world.scope.kind === 'repo') return item.scopeId === world.scope.id
  return item.scopeId === 'mac' && item.hold === world.hold
}

function lockerIndex(world: World, id: string): number {
  return world.items.filter((item) => item.disposed === 'locker').findIndex((item) => item.id === id)
}

export function propDraw(world: World, item: Item, now: number): Draw {
  if (item.disposed === 'sea' && world.toss?.itemId !== item.id) {
    return { x: item.x, y: item.y, rot: 0, scale: 1, hide: true }
  }
  if (world.toss?.itemId === item.id) {
    const toss = world.toss
    const span = Math.max(1, toss.until - toss.started)
    const u = Math.min(1, Math.max(0, (now - toss.started) / span))
    return {
      x: toss.fromX + (toss.toX - toss.fromX) * u,
      y: toss.fromY + (toss.toY - toss.fromY) * u - Math.sin(u * Math.PI) * 120,
      rot: u * 180 * toss.facing,
      scale: 1,
      hide: false,
    }
  }
  if (world.carrying === item.id) {
    const you = being(world, 'you')
    return {
      x: you.x + 18 * you.facing,
      y: you.y - 34,
      rot: -8 * you.facing,
      scale: 1.02,
      hide: false,
    }
  }
  if (item.disposed === 'locker') {
    const index = Math.max(0, lockerIndex(world, item.id))
    return { x: 280 + (index % 5) * 170, y: 630, rot: 0, scale: 1, hide: false }
  }
  return { x: item.x, y: item.y, rot: item.form === 'packed' ? -2 : 0, scale: 1, hide: false }
}

function releasePosts(world: World) {
  for (const b of birds(world)) {
    if (!b.awake) continue
    if (b.mode === 'post' || b.mode === 'go') b.mode = 'follow'
    if (b.sticky) {
      b.sticky = false
      b.bubble = null
    }
  }
  world.arguedAt = null
  world.sheetItemId = null
}

export function drop(world: World) {
  if (!world.carrying || world.card || world.toss) return
  world.carrying = null
  releasePosts(world)
}

function arriveParty(world: World, room: Room) {
  if (world.carrying) {
    const carried = itemById(world, world.carrying)
    if (carried && carried.disposed === 'none') world.carrying = null
  }
  releasePosts(world)
  world.room = room
  const door = SPOTS.entrance[room]
  const you = being(world, 'you')
  you.x = you.tx = door.x
  you.y = you.ty = door.y
  let slot = 0
  for (const b of birds(world)) {
    if (!b.awake) continue
    slot += 1
    b.mode = 'follow'
    b.x = b.tx = door.x - 70 * slot
    b.y = b.ty = door.y
  }
  world.trail = [{ x: door.x, y: door.y }]
  world.pending = null
}

function tryPending(world: World, now: number) {
  const pending = world.pending
  if (!pending) return
  if (pending.type === 'board') {
    world.scope = MAC_SCOPE
    world.hold = pending.hold
    arriveParty(world, 'hold')
    return
  }
  if (pending.type === 'scope') {
    const scope = pending.id === 'mac' ? MAC_SCOPE : world.repos.find((repo) => repo.id === pending.id)
    if (!scope) {
      world.pending = null
      return
    }
    world.scope = scope
    arriveParty(world, 'hold')
    if (scope.kind === 'repo' && world.scout && !world.items.some((item) => item.scopeId === scope.id && item.disposed === 'none')) {
      sayLine(being(world, world.scout), "Nothing mapped yet. I'll look through this folder.", now, 5000)
    }
    return
  }
  if (pending.type === 'enter') {
    arriveParty(world, pending.room)
    return
  }
  if (pending.type === 'lift') {
    world.pending = null
    lift(world, pending.id, now)
    return
  }
  if (pending.type === 'hole') {
    const scout = world.scout ? being(world, world.scout) : null
    const needsABeat = Boolean(scout?.awake && scout.sticky && scout.bubble)
    const readyAt = needsABeat ? (world.arguedAt ?? now) + 600 : now
    if (now < readyAt) return
    openHole(world, pending.hole, now)
    return
  }
  if (pending.type === 'pin') {
    world.pending = null
    pinSheet(world, pending.birdId, now)
    return
  }
  if (pending.type === 'restore') {
    const item = itemById(world, pending.id)
    world.pending = null
    if (!item) return
    world.card = { kind: 'restore', itemId: item.id, face: 1, lockedUntil: 0, redirected: false }
    return
  }
  if (pending.type === 'empty') {
    world.pending = null
    if (world.lockerTenths <= 0) {
      sayLine(being(world, 'you'), 'The Locker is empty.', now, 2200)
      return
    }
    world.card = { kind: 'empty', face: 1, lockedUntil: 0 }
  }
}

export function walkTo(world: World, x: number, y: number, pending: Pending | null, now: number) {
  if (world.card || world.toss || world.emptying) return
  const spot = clampPoint(world.room, x, y)
  const you = being(world, 'you')
  you.tx = spot.x
  you.ty = spot.y
  world.pending = pending
  touch(world, now)
  world.sheetItemId = null
  if (spot.oof) sayLine(you, 'Oof.', now, 1200)
  if (Math.hypot(you.x - spot.x, you.y - spot.y) < 5) {
    you.x = spot.x
    you.y = spot.y
    tryPending(world, now)
  }
}

export function takeRope(world: World, now: number) {
  if (world.room !== 'quay' || world.card || world.toss) return
  world.scope = MAC_SCOPE
  if (world.scout) {
    const scout = being(world, world.scout)
    scout.awake = true
    scout.mode = 'go'
    scout.tx = SPOTS.bead.x
    scout.ty = 630
    const text = beadText(world)
    sayLine(scout, text ? text.replace('mostly ', '') : 'This way.', now, 4000)
  }
  walkTo(world, SPOTS.bead.x, 640, { type: 'board', hold: 'caches' }, now)
}

export function requestBoard(world: World, hold: Hold, now: number) {
  if (world.room !== 'quay') return
  const spot = SPOTS.board[hold]
  walkTo(world, spot.x, spot.y, { type: 'board', hold }, now)
}

export function requestEnter(world: World, room: Room, now: number) {
  if (world.card || world.toss || room === world.room) return
  let spot = SPOTS.plank
  if (world.room === 'quay' && room === 'locker') spot = SPOTS.door.locker
  if (world.room === 'quay' && room === 'glasshouse') spot = SPOTS.door.glasshouse
  walkTo(world, spot.x, spot.y, { type: 'enter', room }, now)
}

export function requestGang(world: World, now: number) {
  if (world.room !== 'locker' || world.card || world.toss) return
  if (world.carrying) {
    const item = itemById(world, world.carrying)
    if (item && item.disposed === 'locker') {
      walkTo(world, SPOTS.gang.x, SPOTS.gang.y, { type: 'restore', id: item.id }, now)
      return
    }
  }
  walkTo(world, SPOTS.gang.x, SPOTS.gang.y, { type: 'enter', room: 'quay' }, now)
}

export function requestEmpty(world: World, now: number) {
  if (world.room !== 'locker') return
  walkTo(world, SPOTS.tip.x, SPOTS.tip.y, { type: 'empty' }, now)
}

export function requestLift(world: World, id: string, now: number) {
  if (world.card || world.toss) return
  const item = itemById(world, id)
  if (!item || item.disposed === 'sea') return
  if (item.disposed === 'locker' && world.room !== 'locker') return
  if (item.disposed === 'none' && !belongsHere(world, item)) return
  if (world.carrying && world.carrying !== id) drop(world)
  const draw = propDraw(world, item, now)
  const you = being(world, 'you')
  const dest = clampPoint(world.room, draw.x, draw.y)
  if (Math.hypot(you.x - dest.x, you.y - dest.y) < 48) {
    lift(world, id, now)
    return
  }
  walkTo(world, draw.x, draw.y, { type: 'lift', id }, now)
}

function distinctive(item: Item): string[] {
  const stop = new Set(['cache', 'caches', 'the', 'app', 'file', 'files', 'small', 'disk'])
  return item.name
    .toLowerCase()
    .split(/[^a-z0-9._]+/)
    .filter((word) => word.length > 2 && !stop.has(word))
}

function aboutItem(text: string, item: Item): boolean {
  return distinctive(item).some((word) => text.includes(word))
}

export function advice(world: World, item: Item): { hole: Hole; line: string } {
  for (let index = world.brief.length - 1; index >= 0; index -= 1) {
    const text = world.brief[index].toLowerCase()
    if (!aboutItem(text, item)) continue
    if (/\b(keep|spare|leave|ignore|save|except)\b/.test(text)) {
      return { hole: 'bin', line: 'You asked me to leave this.' }
    }
    if (/\b(throw|toss|clear|delete|remove|junk|purge)\b/.test(text)) {
      if (item.sea && item.seaLine) return { hole: 'sea', line: item.seaLine }
      return { hole: 'bin', line: 'You want this gone. The Locker can take it.' }
    }
  }
  if (item.sea && item.seaLine) return { hole: 'sea', line: item.seaLine }
  if (item.binLine) return { hole: 'bin', line: item.binLine }
  return { hole: 'bin', line: 'Walk it where you want it.' }
}

function postBird(world: World, id: BirdId, hole: Hole, line: string, now: number) {
  const b = being(world, id)
  b.awake = true
  b.mode = 'post'
  const spot = hole === 'sea' ? SPOTS.seaStand : SPOTS.binStand
  b.tx = spot.x
  b.ty = spot.y
  if (world.room === 'hold') {
    if (Math.hypot(b.x - spot.x, b.y - spot.y) > 400) {
      const door = SPOTS.entrance.hold
      b.x = door.x - (hole === 'sea' ? 40 : 90)
      b.y = door.y
    }
  }
  sayLine(b, line, now, 5000, true)
}

export function lift(world: World, id: string, now: number) {
  if (world.card || world.toss) return
  const item = itemById(world, id)
  if (!item || item.disposed === 'sea') return
  if (item.disposed === 'none' && !belongsHere(world, item)) return
  if (item.disposed === 'locker' && world.room !== 'locker') return
  world.carrying = item.id
  world.arguedAt = now
  world.pending = null
  touch(world, now)
  being(world, 'you').bubble = null
  if (!world.scout || item.disposed === 'locker') return
  const tip = advice(world, item)
  postBird(world, world.scout, tip.hole, tip.line, now)
  if (world.effort === 'high' || world.effort === 'xhigh') world.sheetItemId = item.id
}

export function goToHole(world: World, hole: Hole, now: number) {
  if (world.card || world.toss) return
  if (!world.carrying) {
    sayLine(being(world, 'you'), 'Pick something up first.', now, 2200)
    return
  }
  if (world.room !== 'hold') {
    sayLine(being(world, 'you'), 'Not from here.', now, 1800)
    return
  }
  const spot = hole === 'sea' ? SPOTS.seaStand : SPOTS.binStand
  walkTo(world, spot.x, spot.y, { type: 'hole', hole }, now)
}

function openHole(world: World, hole: Hole, now: number) {
  if (!world.carrying) return
  const item = itemById(world, world.carrying)
  if (!item) return
  const redirected = hole === 'sea' && !item.sea
  const kind = hole === 'sea' && item.sea ? 'sea' : 'bin'
  world.card = { kind, itemId: item.id, face: 1, lockedUntil: 0, redirected }
  world.pending = null
  touch(world, now)
}

export function pinSheet(world: World, birdId: BirdId, now: number) {
  if (!world.carrying) return
  const item = itemById(world, world.carrying)
  if (!item) return
  world.sheetItemId = item.id
  const b = being(world, birdId)
  sayLine(b, "It's on the sheet.", now, 5000, true)
  touch(world, now)
}

export function pokeBird(world: World, id: BirdId, now: number) {
  if (world.card || world.toss) return
  const b = being(world, id)
  if (!b.awake) {
    world.card = { kind: 'wake', birdId: id, face: 1, lockedUntil: 0 }
    touch(world, now)
    return
  }
  if (world.carrying) {
    const spot = { x: b.x, y: Math.max(BANDS[world.room].y0, b.y) }
    walkTo(world, spot.x, spot.y, { type: 'pin', birdId: id }, now)
    return
  }
  sayLine(b, 'Point at it. I am with you.', now, 3200)
  touch(world, now)
}

export function pokeNest(world: World, id: BirdId, now: number) {
  if (world.room !== 'quay' || world.card || world.toss) return
  const b = being(world, id)
  world.card = { kind: b.awake ? 'nest' : 'wake', birdId: id, face: 1, lockedUntil: 0 }
  touch(world, now)
}

export function bumpBuoy(world: World, now: number) {
  const scout = world.scout ? being(world, world.scout) : null
  if (scout?.awake) sayLine(scout, 'macOS. Leave it.', now, 2600)
  else sayLine(being(world, 'you'), 'macOS. Leave it.', now, 2600)
  touch(world, now)
}

export function sendHome(world: World, id: BirdId) {
  const b = being(world, id)
  b.awake = false
  b.mode = 'sleep'
  b.sticky = false
  b.bubble = null
  b.tx = b.home.x
  b.ty = b.home.y
}

function punchline(world: World, text: string, now: number) {
  const speaker = birds(world).find((b) => b.awake) ?? null
  if (speaker) sayLine(speaker, text, now, 4200)
}

function beginToss(world: World, itemId: string, now: number) {
  const you = being(world, 'you')
  const item = itemById(world, itemId)
  if (!item) return
  world.toss = {
    itemId,
    fromX: you.x + 18 * you.facing,
    fromY: you.y - 34,
    toX: SPOTS.chute.x,
    toY: SPOTS.chute.y,
    started: now,
    until: now + 450,
    facing: you.facing,
  }
  world.carrying = null
  world.card = null
  releasePosts(world)
}

function finishToss(world: World, now: number) {
  if (!world.toss || now < world.toss.until) return
  const toss = world.toss
  world.toss = null
  const item = itemById(world, toss.itemId)
  if (!item || item.disposed === 'sea') return
  if (item.disposed === 'locker') world.lockerTenths = Math.max(0, world.lockerTenths - item.tenths)
  item.disposed = 'sea'
  world.freeTenths += item.tenths
  world.splash = { until: now + 700, x: SPOTS.chute.x, y: SPOTS.chute.y }
  punchline(world, "It's gone.", now)
}

function finishEmpty(world: World, now: number) {
  if (!world.emptying || now < world.emptying.until) return
  const job = world.emptying
  world.emptying = null
  for (const id of job.ids) {
    const item = itemById(world, id)
    if (item && item.disposed === 'locker') item.disposed = 'sea'
  }
  world.freeTenths += job.tenths
  world.lockerTenths = 0
  world.splash = { until: now + 800, x: 640, y: 520 }
  punchline(world, "It's gone.", now)
}

export function answer(world: World, yes: boolean, now: number) {
  const card = world.card
  if (!card || world.toss) return
  touch(world, now)
  if (!yes) {
    world.card = null
    if (card.kind === 'sea' || card.kind === 'bin' || card.kind === 'restore') drop(world)
    return
  }
  if (now < card.lockedUntil) return
  if (card.kind === 'sea' && card.face === 1) {
    card.face = 2
    card.lockedUntil = now + 800
    return
  }
  if (card.kind === 'sea' && card.face === 2) {
    beginToss(world, card.itemId, now)
    return
  }
  if (card.kind === 'bin') {
    const item = itemById(world, card.itemId)
    world.card = null
    if (!item || item.disposed !== 'none') return
    item.disposed = 'locker'
    world.lockerTenths += item.tenths
    world.carrying = null
    releasePosts(world)
    punchline(world, "Still on the disk. It's in the Locker.", now)
    return
  }
  if (card.kind === 'restore') {
    const item = itemById(world, card.itemId)
    world.card = null
    if (!item || item.disposed !== 'locker') return
    item.disposed = 'none'
    world.lockerTenths = Math.max(0, world.lockerTenths - item.tenths)
    world.carrying = null
    releasePosts(world)
    arriveParty(world, 'quay')
    punchline(world, 'Back on the skiff.', now)
    return
  }
  if (card.kind === 'wake') {
    if (world.scout && world.scout !== card.birdId) sendHome(world, world.scout)
    const b = being(world, card.birdId)
    const you = being(world, 'you')
    world.scout = card.birdId
    b.awake = true
    b.mode = 'follow'
    if (world.room !== 'quay') {
      b.x = you.x - 60
      b.y = you.y
    }
    b.tx = you.x - 48
    b.ty = you.y
    world.card = null
    sayLine(b, 'I am with you.', now, 2200)
    return
  }
  if (card.kind === 'nest') {
    sendHome(world, card.birdId)
    world.card = null
    return
  }
  if (card.kind === 'empty' && card.face === 1) {
    card.face = 2
    card.lockedUntil = now + 800
    return
  }
  if (card.kind === 'empty' && card.face === 2) {
    const ids = world.items.filter((item) => item.disposed === 'locker').map((item) => item.id)
    world.emptying = { until: now + 700, tenths: world.lockerTenths, ids }
    world.card = null
  }
}

export function cardModel(world: World, now: number): CardView | null {
  const card = world.card
  if (!card) return null
  const locked = now < card.lockedUntil
  if (card.kind === 'wake' || card.kind === 'nest') {
    const b = being(world, card.birdId)
    const current = world.scout ? being(world, world.scout) : null
    const switching = card.kind === 'wake' && current && current.id !== b.id
    return {
      title: card.kind === 'wake' ? `Wake ${b.name}?` : `Send ${b.name} back to the nest?`,
      meta: switching
        ? `${current.name} goes back to the nest. One scout at a time.`
        : card.kind === 'wake'
          ? 'They will follow you around the harbor.'
          : 'The harbor keeps one scout.',
      path: '',
      note: '',
      yes: 'Yes',
      no: 'No',
      focus: 'yes',
      locked,
      icon: null,
    }
  }
  if (card.kind === 'empty') {
    const count = world.items.filter((item) => item.disposed === 'locker').length
    if (card.face === 1) {
      return {
        title: 'Empty the Locker into the sea?',
        meta: `${gbWord(world.lockerTenths)} · ${count} ${count === 1 ? 'thing' : 'things'}`,
        path: '',
        note: 'This is permanent.',
        yes: 'Yes',
        no: 'No',
        focus: 'no',
        locked,
        icon: 'crate',
      }
    }
    return {
      title: "It's gone if you do this.",
      meta: `${gbWord(world.lockerTenths)} freed on the pole, if macOS gives it back.`,
      path: '',
      note: 'The Locker cannot give these back.',
      yes: 'Throw them',
      no: 'No',
      focus: 'no',
      locked,
      icon: 'crate',
    }
  }
  if (!('itemId' in card)) return null
  const item = itemById(world, card.itemId)
  if (!item) return null
  if (card.kind === 'sea' && card.face === 2) {
    return {
      title: "It's gone if you do this.",
      meta: `${gbWord(item.tenths)} freed on the pole, if macOS gives it back.`,
      path: item.path,
      note: `${item.rebuild} No Locker.`.trim(),
      yes: 'Throw it',
      no: 'No',
      focus: 'no',
      locked,
      icon: item.form,
    }
  }
  if (card.kind === 'sea') {
    return {
      title: `Throw ${item.name} in the sea?`,
      meta: `${gbWord(item.tenths)} · ${item.phrase}`,
      path: item.path,
      note: 'This does not go to the Locker.',
      yes: 'Yes',
      no: 'No',
      focus: 'yes',
      locked,
      icon: item.form,
    }
  }
  if (card.kind === 'restore') {
    return {
      title: `Put ${item.name} back?`,
      meta: gbWord(item.tenths),
      path: `Back to ${item.path}`,
      note: 'The pole will not move.',
      yes: 'Yes',
      no: 'No',
      focus: 'yes',
      locked,
      icon: item.form,
    }
  }
  const base = 'You can take it back from the Locker. The pole will not move.'
  return {
    title: `Trash ${item.name}?`,
    meta: `${gbWord(item.tenths)} · ${item.phrase}`,
    path: item.path,
    note: card.kind === 'bin' && card.redirected ? `The chute won't take this. ${base}` : base,
    yes: 'Yes',
    no: 'No',
    focus: item.stale ? 'yes' : 'no',
    locked,
    icon: item.form,
  }
}

function isPlace(world: World, raw: string): boolean {
  const path = raw.trim().replace(/^["']|["']$/g, '')
  if (/^(?:~|home|mac|this mac|macintosh(?: hd)?|everything)$/i.test(path)) return true
  if (path.startsWith('~') || path.startsWith('/')) return true
  return world.repos.some(
    (repo) => repo.path === path || repo.label.toLowerCase() === path.toLowerCase() || path.endsWith('/' + repo.label),
  )
}

export function say(world: World, text: string, now: number) {
  const line = text.trim().slice(0, 80)
  if (!line || world.card || world.toss) return
  const you = being(world, 'you')
  sayLine(you, line, now, 5000)
  touch(world, now)
  const lower = line.toLowerCase()
  const named = (['claude', 'codex', 'cursor'] as const).find((id) => lower.startsWith(id))
  if (!world.scout) {
    world.snoreUntil = now + 1400
    return
  }
  const target = being(world, world.scout)
  if (!target.awake) {
    target.awake = true
    target.mode = 'follow'
    target.tx = you.x - 52
    target.ty = you.y
  }
  const look = lower.match(/^(?:look in|scan|repo)\s+(.+)$/)
  if (world.tool) {
    world.steering.push(line)
    if (world.steering.length > 6) world.steering.shift()
    return
  }
  if (look && isPlace(world, look[1])) {
    lookIn(world, look[1], now)
    return
  }
  if (named && named !== world.scout && (lower === named || lower.startsWith(`${named},`) || lower.startsWith(`${named} `) && lower.split(/\s+/).length <= 2)) {
    sayLine(target, "It's just me out here.", now, 4000)
    return
  }
  if (/^(?:throw|delete|clean|empty|purge|rm)(?:\s+it)?$/.test(lower)) {
    sayLine(target, "You'll have to throw it.", now, 4000)
    return
  }
  if (/^(?:caches|the big one|heavy one|disk|junk)$/.test(lower)) {
    if (world.room === 'quay') {
      target.mode = 'go'
      target.tx = SPOTS.bead.x
      target.ty = 630
      beginTool(world, 'the rope')
      sayLine(target, 'The heavy one is on the rope.', now, 4000)
    } else {
      sayLine(target, 'The heavy one is the closest sack.', now, 4000)
    }
    return
  }
  remember(world, line)
  sayLine(target, "I'll keep that in mind.", now, 3200)
}

function arrivalLine(world: World, previous: BirdId | null): string {
  const note = world.brief.at(-1)
  if (!previous || !note) return 'I am with you.'
  const clip = note.length > 36 ? `${note.slice(0, 34)}…` : note
  return `I have your note. “${clip}”`
}

function remember(world: World, line: string) {
  world.brief.push(line)
  if (world.brief.length > 6) world.brief.shift()
}

export function lookIn(world: World, raw: string, now: number) {
  const path = raw.trim().replace(/^["']|["']$/g, '')
  const scout = world.scout ? being(world, world.scout) : null
  if (/^(?:~|home|mac|this mac|macintosh(?: hd)?|everything)$/i.test(path)) {
    world.scope = MAC_SCOPE
    if (scout) sayLine(scout, "I'll map the whole Mac.", now, 4000)
    return
  }
  let scope = world.repos.find(
    (repo) => repo.path === path || repo.label.toLowerCase() === path.toLowerCase() || path.endsWith('/' + repo.label),
  )
  if (!scope) {
    const label = path.split('/').filter(Boolean).pop() || path
    scope = {
      id: `path-${world.repos.length + 1}`,
      kind: 'repo',
      label,
      path: path.startsWith('~') || path.startsWith('/') ? path : `~/${path}`,
      ...shedSlot(world.repos.length),
    }
    world.repos.push(scope)
  }
  world.scope = scope
  if (!scout) return
  if (world.room === 'quay') {
    scout.mode = 'go'
    scout.tx = scope.x
    scout.ty = 500
    beginTool(world, scope.label)
  }
  sayLine(scout, `I'll look in ${scope.label}.`, now, 4000)
}

export function beginTool(world: World, label: string, walk = true) {
  world.tool = { label, walk }
}

export function finishTool(world: World, now: number) {
  if (!world.tool) return
  world.tool = null
  const lines = world.steering.splice(0, world.steering.length)
  if (!lines.length || !world.scout) return
  for (const line of lines) remember(world, line)
  const newest = lines[lines.length - 1]
  const lower = newest.toLowerCase()
  const scout = being(world, world.scout)
  const look = lower.match(/^(?:look in|scan|repo)\s+(.+)$/)
  if (/^(?:stop|wait|come back|come home)$/.test(lower)) {
    scout.mode = 'follow'
    sayLine(scout, "Coming back. I'll use what you said.", now, 3600)
    return
  }
  if (look && isPlace(world, look[1])) {
    lookIn(world, look[1], now)
    return
  }
  if (/^(?:caches|the big one|heavy one|disk|junk)$/.test(lower)) {
    scout.mode = 'go'
    scout.tx = SPOTS.bead.x
    scout.ty = 630
    beginTool(world, 'the rope')
    sayLine(scout, 'The heavy one is on the rope.', now, 4000)
    return
  }
  if (/^(?:throw|delete|clean|empty|purge|rm)(?:\s+it)?$/.test(lower)) {
    sayLine(scout, "You'll have to throw it.", now, 3600)
    return
  }
  sayLine(scout, "Got it. I'll use that on the next one.", now, 3600)
}

export function requestScope(world: World, id: string, now: number) {
  if (world.room !== 'quay' || world.card || world.toss) return
  const scope = id === 'mac' ? MAC_SCOPE : world.repos.find((repo) => repo.id === id)
  if (!scope) return
  walkTo(world, scope.x, 500, { type: 'scope', id: scope.id }, now)
}

export function setScout(world: World, id: BirdId, now: number, customName?: string) {
  if (world.card || world.toss) return
  if (world.scout === id && id !== 'custom') return
  const previous = world.scout
  if (previous && previous !== id) sendHome(world, previous)
  if (id === 'custom' && customName?.trim()) {
    const name = customName.trim().slice(0, 24)
    being(world, 'custom').name = name
    world.customName = name
  }
  world.scout = id
  const b = being(world, id)
  const you = being(world, 'you')
  b.awake = true
  b.mode = 'follow'
  b.home = { ...NEST }
  b.x = NEST.x
  b.y = NEST.y
  b.tx = you.x - 52
  b.ty = you.y
  sayLine(b, arrivalLine(world, previous), now, 4200)
  const choices = modelsFor(world)
  if (!choices.some((choice) => choice.id === world.model)) world.model = choices[0].id
  touch(world, now)
}

export function modelChoice(world: World): ModelChoice {
  const choices = modelsFor(world)
  return choices.find((choice) => choice.id === world.model) ?? choices[0]
}

export function effortChoice(world: World): EffortChoice {
  return EFFORTS.find((choice) => choice.id === world.effort) ?? EFFORTS[2]
}

export function setModel(world: World, id: string, now: number) {
  if (world.card || world.toss || !world.scout) return
  const choice = modelsFor(world).find((item) => item.id === id)
  if (!choice) return
  world.model = choice.id
  const scout = being(world, world.scout)
  sayLine(scout, choice.line, now, 2800)
  touch(world, now)
}

export function setEffort(world: World, id: EffortId, now: number) {
  if (world.card || world.toss || !world.scout) return
  const next = EFFORTS.find((choice) => choice.id === id)
  if (!next || next.id === world.effort) return
  world.effort = next.id
  sayLine(being(world, world.scout), next.line, now, 2800)
  touch(world, now)
}

export function cycleEffort(world: World, now: number) {
  if (world.card || world.toss || !world.scout) return
  const index = EFFORTS.findIndex((choice) => choice.id === world.effort)
  const next = EFFORTS[(index + 1) % EFFORTS.length]
  world.effort = next.id
  const scout = being(world, world.scout)
  sayLine(scout, next.line, now, 2800)
  touch(world, now)
}

function moveBeing(b: Being, dt: number) {
  const dx = b.tx - b.x
  const dy = b.ty - b.y
  const dist = Math.hypot(dx, dy)
  if (dist < 4) {
    b.x = b.tx
    b.y = b.ty
    return
  }
  const speed = b.id === 'you' ? 320 : 500
  const stepDist = Math.min(dist, speed * dt)
  b.x += (dx / dist) * stepDist
  b.y += (dy / dist) * stepDist
  if (Math.abs(dx) > 3) b.facing = dx > 0 ? 1 : -1
}

function idleFidget(world: World, now: number) {
  const you = being(world, 'you')
  if (moving(you) || world.carrying || world.card || world.toss || sitting(world, you)) {
    world.fidget = null
    return
  }
  if (world.fidget) {
    if (world.fidget.until <= now) world.fidget = null
    return
  }
  if (world.lastInput === 0 || now - world.lastInput < 2500) return
  if (now - world.fidgetAt < 3600) return
  const kinds = ['wave', 'hop', 'wiggle'] as const
  const kind = kinds[world.fidgets % kinds.length]
  world.fidgets += 1
  world.fidgetAt = now
  world.fidget = { kind, until: now + 700 }
}

function follow(world: World) {
  const you = being(world, 'you')
  let slot = 0
  for (const b of birds(world)) {
    if (!b.awake || b.mode !== 'follow') continue
    slot += 1
    const back = world.trail[world.trail.length - 1 - (6 + slot * 5)]
    if (back) {
      b.tx = back.x
      b.ty = back.y
    } else {
      b.tx = you.x - 92 * slot
      b.ty = you.y
    }
  }
}

export function step(world: World, now: number, dt: number) {
  dt = Math.min(Math.max(dt, 0), 0.05)
  world.now = now
  const you = being(world, 'you')
  const beforeX = you.x
  const beforeY = you.y
  for (const b of world.beings) moveBeing(b, dt)
  for (const b of birds(world)) {
    if (b.mode === 'go' && !moving(b)) {
      b.mode = 'follow'
      if (world.tool?.walk && b.id === world.scout) finishTool(world, now)
    }
  }
  if (Math.hypot(you.x - beforeX, you.y - beforeY) > 0.8) {
    const last = world.trail[world.trail.length - 1]
    if (!last || Math.hypot(last.x - you.x, last.y - you.y) > 12) {
      world.trail.push({ x: you.x, y: you.y })
      if (world.trail.length > 48) world.trail.shift()
    }
  }
  follow(world)
  idleFidget(world, now)
  if (!moving(you)) tryPending(world, now)
  finishToss(world, now)
  finishEmpty(world, now)
  for (const b of world.beings) {
    if (b.bubble && !b.sticky && b.bubbleUntil < now) b.bubble = null
  }
  if (world.splash && world.splash.until < now) world.splash = null
  if (
    world.room === 'quay' &&
    !world.carrying &&
    !world.card &&
    world.lastInput > 0 &&
    now - world.lastInput > 45000
  ) {
    for (const b of birds(world)) if (b.awake) sendHome(world, b.id as BirdId)
  }
}

const LIVE_SPOTS: Point[] = [
  { x: 680, y: 655 },
  { x: 400, y: 650 },
  { x: 980, y: 640 },
  { x: 520, y: 560 },
  { x: 860, y: 560 },
  { x: 300, y: 560 },
  { x: 1100, y: 620 },
  { x: 680, y: 490 },
]

export function useRealDisk(world: World, freeTenths: number, capacityTenths: number) {
  world.freeTenths = freeTenths
  world.capacityTenths = capacityTenths
}

export function useRealCaches(world: World, rows: { name: string; path: string; bytes: number }[]) {
  if (rows.length === 0) return
  world.items = world.items.filter((item) => !(item.scopeId === 'mac' && item.hold === 'caches'))
  rows.slice(0, 8).forEach((row, index) => {
    const spot = LIVE_SPOTS[index] ?? { x: 640, y: 600 }
    const tenths = Math.max(1, Math.round(row.bytes / 1e8))
    world.items.push({
      id: `live-${index}`,
      hold: 'caches',
      form: 'sack',
      name: row.name,
      path: row.path,
      tenths,
      phrase: 'measured on this Mac',
      sea: true,
      stale: true,
      x: spot.x,
      y: spot.y,
      disposed: 'none',
      scopeId: 'mac',
      seaBird: 'claude',
      binBird: 'claude',
      seaLine: 'Cache. It rebuilds.',
      binLine: 'The Locker can still give it back.',
      rebuild: 'It rebuilds the next time it is needed.',
      sheet: `${row.path}. Measured on this Mac. The sea is permanent. The Locker can still give it back.`,
    })
  })
}

export function nearestLiftable(world: World): Item | undefined {
  const you = being(world, 'you')
  let best: Item | undefined
  let bestD = 220
  for (const item of world.items) {
    if (item.disposed === 'sea') continue
    if (item.disposed === 'none' && !belongsHere(world, item)) continue
    if (item.disposed === 'locker' && world.room !== 'locker') continue
    const d = Math.hypot(item.x - you.x, item.y - you.y)
    if (d < bestD) {
      best = item
      bestD = d
    }
  }
  return best
}
