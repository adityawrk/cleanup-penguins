import '@fontsource/fredoka/latin-500.css'
import '@fontsource/fredoka/latin-600.css'
import '@fontsource/fredoka/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import './style.css'
import { HarborAudio } from './audio'
import quayArt from './art/quay.svg?raw'
import quayFore from './art/quay-fore.svg?raw'
import holdArt from './art/hold.svg?raw'
import helloArt from './art/hello.svg?raw'
import lockerArt from './art/locker.svg?raw'
import glassArt from './art/glasshouse.svg?raw'
import mapArt from './art/map.svg?raw'
import { itemSvg, jitter, sizeScale } from './items'
import { EMOTES, emoteSvg } from './emotes'
import { HATS, NAVY, createNpcs, prefixIds, stepNpcs, talkTo, type Hat } from './npcs'
import { createDecor } from './decor'
import {
  SPOTS,
  answer,
  beadText,
  being,
  beginTool,
  bumpBuoy,
  cardModel,
  clampPoint,
  createWorld,
  drop,
  gbWord,
  goToHole,
  holdTitle,
  itemsHere,
  nearestLiftable,
  pokeBird,
  pokeNest,
  poleCap,
  poleFree,
  poleUsed,
  poseOf,
  propDraw,
  propVisible,
  requestBoard,
  requestEmpty,
  requestEnter,
  requestGang,
  requestLift,
  requestScope,
  say,
  scopeTenths,
  setScout,
  setModel,
  setEffort,
  liveReply,
  liveFailed,
  scoutIsLive,
  scoutSay,
  shedSlot,
  effortChoice,
  EFFORTS,
  effortScale,
  finishTool,
  modelsFor,
  modelChoice,
  signPath,
  sitting,
  skiffTenths,
  step,
  takeRope,
  useRealCaches,
  useRealDisk,
  useFolder,
  useRealHold,
  useRealRepos,
  travel,
  walkTo,
  type BeingId,
  type BirdId,
  type EffortId,
  type Hold,
  type Item,
  type Room,
  type World,
} from './sim'

const FORES = import.meta.glob('./art/*-fore.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const ART: Record<string, string> = {
  quay: quayArt,
  hold: holdArt,
  hello: helloArt,
  locker: lockerArt,
  glasshouse: glassArt,
  'quay-fore': quayFore,
  'locker-fore': FORES['./art/locker-fore.svg'] ?? '',
  'glasshouse-fore': FORES['./art/glasshouse-fore.svg'] ?? '',
  'hold-fore': FORES['./art/hold-fore.svg'] ?? '',
}
for (const host of document.querySelectorAll<HTMLElement>('[data-art]')) {
  host.innerHTML = ART[host.dataset.art ?? ''] ?? ''
}

// Light snow over the quay: a fixed set of flakes, each with its own lane, size, speed and sway.
for (const host of document.querySelectorAll<HTMLElement>('.snowfall')) {
  for (let i = 0; i < 26; i += 1) {
    const flake = document.createElement('i')
    const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
    flake.style.left = `${Math.round(r(1) * 1280)}px`
    flake.style.setProperty('--size', `${(3 + r(2) * 5).toFixed(1)}px`)
    flake.style.setProperty('--sway', `${Math.round(10 + r(3) * 26)}px`)
    flake.style.animationDuration = `${(9 + r(4) * 9).toFixed(1)}s, ${(2.4 + r(5) * 2).toFixed(1)}s`
    flake.style.animationDelay = `-${(r(6) * 18).toFixed(1)}s, -${(r(7) * 4).toFixed(1)}s`
    host.appendChild(flake)
  }
}

// One real, labelled button per painted hotspot, for keyboard and screen readers. Mouse clicks still land on the art.
for (const room of document.querySelectorAll<HTMLElement>('.room')) {
  for (const group of room.querySelectorAll<SVGGraphicsElement>('.paint .hot[data-act]')) {
    const roomBox = room.getBoundingClientRect()
    const unit = 1280 / roomBox.width
    const rect = group.getBoundingClientRect()
    const box = { x: (rect.left - roomBox.left) * unit, y: (rect.top - roomBox.top) * unit, width: rect.width * unit, height: rect.height * unit }
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'hotspot'
    Object.assign(button.dataset, group.dataset)
    button.setAttribute('aria-label', group.querySelector('title')?.textContent ?? group.dataset.act ?? '')
    button.style.left = `${box.x - 6}px`
    button.style.top = `${box.y - 6}px`
    button.style.width = `${box.width + 12}px`
    button.style.height = `${box.height + 12}px`
    const title = group.querySelector('title')
    if (title && !button.querySelector('title')) button.appendChild(title.cloneNode(true))
    room.appendChild(button)
  }
}

/** Sprites are drawn large and shown small, so the room reads as a big place. */
const YOU_SIZE = 0.48
const SCOUT_SIZE = 0.38
/** Items scale with the cast so a 9 GB sack is about the penguin's height, not twice it. */
const ITEM_SIZE = 0.8

const world = createWorld(__USERNAME__ || 'you')
const audio = new HarborAudio()
const fit = must<HTMLElement>('#fit')
const track = must<HTMLElement>('#track')
const sayInput = must<HTMLInputElement>('#say')
const count = must<HTMLElement>('#count')
const card = must<HTMLElement>('#card')
const who = must<HTMLElement>('#who')
const catcher = must<HTMLElement>('#catcher')
const live = must<HTMLElement>('#live')
const splash = must<HTMLElement>('#splash')
const hello = must<HTMLElement>('#hello')
let naming = false
/** Emotes and dancing are the player's own flourish. They live here, not in the sim: they change no rule. */
let emote: { id: string; until: number } | null = null
let danceUntil = 0
let shownCard = ''
let lastFoot = 0
let footHigh = false
let prevFree = world.freeTenths
let prevRoom = world.room
let prevSplash = 0
let prevSnore = 0
let prevCarry: string | null = null
let prevToss: string | null = null
let prevRehearsed = 0
let prevLocker = 0
const poseSeen = new Map<string, string>()
/** Last drawn position and whether we're seeing a being's back (walking away from the camera). */
const heading = new Map<string, { x: number; y: number; back: boolean }>()
const bubbleSeen = new Map<string, string | null>()

const beings = new Map<BeingId, HTMLElement>()
const props = new Map<string, HTMLElement>()

for (const [index, id] of (['you', 'claude', 'codex', 'cursor', 'custom'] as const).entries()) {
  const node = clone(`tpl-${id}`)
  node.querySelector<SVGElement>('.eyes')?.style.setProperty('animation-delay', `-${(index * 1.7) % 5.2}s`)
  node.querySelector('.name')!.textContent = id === 'you' ? world.beings[0].name : being(world, id).name
  beings.set(id, node)
}

for (const item of world.items) ensureProp(item)
createNpcs(must<HTMLTemplateElement>('#tpl-you'), roomObjects)
queueMicrotask(() => dressPlayer())
createDecor(roomObjects)
void loadThisMac()
void findAgents()


must('#hello-line').textContent = `${being(world, 'you').name} and ${being(world, 'claude').name}`
must('#hello-go').addEventListener('click', (event) => {
  event.stopPropagation()
  dismissHello()
})
must<HTMLButtonElement>('#hello-go').focus()
fit.addEventListener('click', onClick)
must<HTMLFormElement>('#chat').addEventListener('submit', (event) => {
  event.preventDefault()
  const text = sayInput.value
  sayInput.value = ''
  count.hidden = true
  const now = performance.now()
  audio.unlock()
  if (naming) {
    naming = false
    const prompt = promptFor(world)
    sayInput.placeholder = prompt
    must('#say-label').textContent = prompt
    if (text.trim()) setScout(world, 'custom', now, text.trim())
    return
  }
  if (say(world, text, now) === 'ask') void askScout(text)
})
sayInput.addEventListener('input', () => {
  count.hidden = sayInput.value.length < 60
  count.textContent = `${sayInput.value.length}/80`
})
must('#card-yes').addEventListener('click', () => answer(world, true, performance.now()))
must('#card-no').addEventListener('click', () => answer(world, false, performance.now()))
must('#sound').addEventListener('click', () => {
  const on = audio.toggle()
  must('#sound').setAttribute('aria-pressed', on ? 'true' : 'false')
  must('#sound').setAttribute('aria-label', on ? 'Sound on' : 'Sound off')
})
must('#scout-btn').addEventListener('click', () => {
  audio.unlock()
  if (who.hidden) openWho()
  else closeWho()
})
must('#send-btn').addEventListener('click', () => must<HTMLFormElement>('#chat').requestSubmit())
// The map: a dock button and a panel with the drawn harbor. Built here so index.html stays the art's.
const mapButton = document.createElement('button')
mapButton.type = 'button'
mapButton.className = 'dock-btn'
mapButton.id = 'map-btn'
mapButton.setAttribute('aria-label', 'Map')
mapButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6l6-2l6 2l6-2v14l-6 2l-6-2l-6 2z" fill="#fff6e4" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="11" r="2" fill="#e24b3f"/></svg>'
must('#console').insertBefore(mapButton, must('#chat'))
const mapPanel = document.createElement('div')
mapPanel.id = 'map'
mapPanel.hidden = true
mapPanel.setAttribute('role', 'dialog')
mapPanel.setAttribute('aria-label', 'Map of the harbor')
mapPanel.innerHTML = `<h2>The harbor</h2><div class="map-frame">${mapArt}</div><div class="map-keys"></div>`
must('#fit').appendChild(mapPanel)
const mapKeys = mapPanel.querySelector<HTMLElement>('.map-keys')!
for (const place of mapPanel.querySelectorAll<SVGGElement>('.map-place')) {
  const button = document.createElement('button')
  button.type = 'button'
  button.dataset.go = place.dataset.go
  button.textContent = place.querySelector('title')?.textContent ?? place.dataset.go ?? ''
  mapKeys.appendChild(button)
}
const goTo = (place: string) => {
  if (travel(world, place as Room | Hold, performance.now())) closeMap()
  else if (world.carrying) closeMap()
}
mapPanel.addEventListener('click', (event) => {
  const target = (event.target as Element).closest<HTMLElement | SVGElement>('[data-go]')
  if (target?.dataset.go) goTo(target.dataset.go)
})
mapButton.addEventListener('click', () => {
  audio.unlock()
  if (mapPanel.hidden) openMap()
  else closeMap()
})
function openMap() {
  if (world.card) return
  closeWho()
  mapPanel.hidden = false
  catcher.hidden = false
  mapButton.classList.add('is-on')
  audio.card()
}
function closeMap() {
  mapPanel.hidden = true
  catcher.hidden = !world.card && who.hidden
  mapButton.classList.remove('is-on')
}

const MUSIC_KEY = 'harbor-music'
try {
  if (localStorage.getItem(MUSIC_KEY) === 'off') {
    audio.musicOn = false
    must('#music').setAttribute('aria-pressed', 'false')
  }
} catch {
  /* music stays on */
}
must('#music').addEventListener('click', () => {
  const on = audio.toggleMusic()
  must('#music').setAttribute('aria-pressed', String(on))
  must('#music').setAttribute('aria-label', on ? 'Music on' : 'Music off')
  try {
    localStorage.setItem(MUSIC_KEY, on ? 'on' : 'off')
  } catch {
    /* not remembered */
  }
})
const emotePanel = must<HTMLElement>('#emotes')
for (const choice of [...EMOTES, { id: 'dance', label: 'Dance', svg: '' }]) {
  const button = document.createElement('button')
  button.type = 'button'
  button.dataset.emote = choice.id
  button.setAttribute('aria-label', choice.label)
  button.title = choice.label
  button.innerHTML = choice.id === 'dance'
    ? '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M14 30V10l16-4v20" fill="none" stroke="#1a2332" stroke-width="3" stroke-linejoin="round"/><ellipse cx="10" cy="30" rx="6" ry="5" fill="#9b6bd6" stroke="#1a2332" stroke-width="3"/><ellipse cx="26" cy="26" rx="6" ry="5" fill="#9b6bd6" stroke="#1a2332" stroke-width="3"/></svg>'
    : emoteSvg(choice.id)
  emotePanel.appendChild(button)
}
must('#emote-btn').addEventListener('click', () => {
  audio.unlock()
  emotePanel.hidden = !emotePanel.hidden
  must('#emote-btn').classList.toggle('is-on', !emotePanel.hidden)
  must('#emote-btn').setAttribute('aria-expanded', String(!emotePanel.hidden))
})
emotePanel.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-emote]')
  if (!button?.dataset.emote) return
  playEmote(button.dataset.emote, performance.now())
  emotePanel.hidden = true
  must('#emote-btn').classList.remove('is-on')
  must('#emote-btn').setAttribute('aria-expanded', 'false')
})
must('#sc-close').addEventListener('click', () => closeWho())
must('#me-close').addEventListener('click', () => closeMe())
// Dress-up: the player picks a penguin color and a hat on their card. Remembered per browser.
// Each body is base, shade, light, then the outline: the four values that replace NAVY.
const COLORS: { id: string; label: string; body: [string, string, string, string] }[] = [
  { id: 'navy', label: 'Navy', body: NAVY },
  { id: 'red', label: 'Red', body: ['#d8463b', '#a8302a', '#f08a80', '#6e1a15'] },
  { id: 'green', label: 'Green', body: ['#3f9f63', '#2c7a4a', '#7fd09a', '#164a2a'] },
  { id: 'yellow', label: 'Yellow', body: ['#f4c534', '#c9981f', '#ffe7a0', '#7d5c0c'] },
  { id: 'purple', label: 'Purple', body: ['#8d62d6', '#6a46ad', '#b99af0', '#3a2170'] },
  { id: 'pink', label: 'Pink', body: ['#ef7fb0', '#c95a8c', '#ffb6d4', '#7e2a52'] },
  { id: 'aqua', label: 'Aqua', body: ['#2fb3c9', '#1f8a9c', '#86e0ee', '#0f5562'] },
  { id: 'black', label: 'Black', body: ['#2e3440', '#1c2129', '#5d6878', '#0b0e13'] },
]
const HAT_CHOICES: { id: Hat | 'none'; label: string }[] = [
  { id: 'none', label: 'No hat' },
  { id: 'beanie', label: 'Beanie' },
  { id: 'captain', label: "Captain's cap" },
  { id: 'souwester', label: "Sou'wester" },
]
const LOOK_KEY = 'harbor-look'
const playerBase = must<HTMLTemplateElement>('#tpl-you').content.querySelector('svg')!.innerHTML
let look = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(LOOK_KEY) ?? '{}') as { color?: string; hat?: string }
    return { color: COLORS.some((c) => c.id === saved.color) ? saved.color! : 'navy', hat: HAT_CHOICES.some((h) => h.id === saved.hat) ? saved.hat! : 'none' }
  } catch {
    return { color: 'navy', hat: 'none' }
  }
})()
function dressPlayer() {
  const color = COLORS.find((c) => c.id === look.color) ?? COLORS[0]
  let markup = playerBase
  NAVY.forEach((from, i) => (markup = markup.split(from).join(color.body[i])))
  const hat = look.hat !== 'none' ? HATS[look.hat as Hat] : ''
  // Each copy gets its own gradient ids (see prefixIds), so the recolored sprite never paints with the template's navy.
  const copies = [[beings.get('you')?.querySelector('svg'), 'self-'], [must('#me-portrait').querySelector('svg'), 'selfp-']] as const
  for (const [svg, prefix] of copies) {
    if (!svg) continue
    svg.innerHTML = prefixIds(markup + hat, prefix)
    svg.style.overflow = 'visible'
  }
  for (const button of document.querySelectorAll<HTMLElement>('#me-colors button')) button.classList.toggle('is-on', button.dataset.color === look.color)
  for (const button of document.querySelectorAll<HTMLElement>('#me-hats button')) button.classList.toggle('is-on', button.dataset.hat === look.hat)
  try {
    localStorage.setItem(LOOK_KEY, JSON.stringify(look))
  } catch {
    /* not remembered */
  }
}
{
  const me = must('#me')
  const wardrobe = document.createElement('div')
  wardrobe.className = 'me-wardrobe'
  wardrobe.innerHTML = '<h3>Color</h3><div class="me-swatches" id="me-colors"></div><h3>Hat</h3><div class="me-hats" id="me-hats"></div>'
  me.insertBefore(wardrobe, must('#me-foot'))
  for (const color of COLORS) {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.color = color.id
    button.title = color.label
    button.setAttribute('aria-label', color.label)
    button.style.setProperty('--swatch', color.body[0])
    must('#me-colors').appendChild(button)
  }
  for (const hat of HAT_CHOICES) {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.hat = hat.id
    button.textContent = hat.label
    must('#me-hats').appendChild(button)
  }
  wardrobe.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('button')
    if (!target) return
    if (target.dataset.color) look = { ...look, color: target.dataset.color }
    if (target.dataset.hat) look = { ...look, hat: target.dataset.hat }
    dressPlayer()
    audio.pop()
    const you = beings.get('you')
    if (you) pulse(you, 'is-hop', 700)
  })
}

const STILL_KEY = 'harbor-still'
const setStill = (on: boolean) => {
  fit.classList.toggle('is-still', on)
  must('#me-still').setAttribute('aria-pressed', String(on))
  must('#me-still').textContent = on ? 'Still harbor: on' : 'Still harbor: off'
}
try {
  setStill(localStorage.getItem(STILL_KEY) === 'on' || matchMedia('(prefers-reduced-motion: reduce)').matches)
} catch {
  setStill(false)
}
must('#me-still').addEventListener('click', () => {
  const on = !fit.classList.contains('is-still')
  setStill(on)
  try {
    localStorage.setItem(STILL_KEY, on ? 'on' : 'off')
  } catch {
    /* not remembered */
  }
})
for (const mini of document.querySelectorAll<HTMLElement>('#scout-choices .mini')) {
  mini.appendChild(faceOf(mini.dataset.face as BirdId))
}
who.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
  const now = performance.now()
  const modelButton = target.closest<HTMLElement>('[data-model]')
  if (modelButton?.dataset.model) {
    setModel(world, modelButton.dataset.model, now)
    audio.pop()
    return
  }
  const effortButton = target.closest<HTMLElement>('[data-effort]')
  if (effortButton?.dataset.effort) {
    setEffort(world, effortButton.dataset.effort as EffortId, now)
    audio.pop()
    return
  }
  const button = target.closest<HTMLElement>('[data-scout]')
  if (!button) return
  const id = button.dataset.scout as BirdId
  if (id === 'custom' && !button.dataset.name) {
    naming = true
    closeWho()
    sayInput.placeholder = 'OpenCode, Antigravity, or a name'
    must('#say-label').textContent = 'Name your scout'
    sayInput.focus()
    return
  }
  setScout(world, id, performance.now(), button.dataset.name)
  audio.pop()
})
window.addEventListener('keydown', onKey)
document.addEventListener('visibilitychange', () => audio.setHidden(document.hidden))
;(window as unknown as { harborAudio: HarborAudio }).harborAudio = audio
window.addEventListener('resize', layout)
layout()
void document.fonts.load('700 28px Fredoka')
void document.fonts.load('500 14px "IBM Plex Mono"')
requestAnimationFrame(frame)
let lastFrame = performance.now()

function frame(now: number) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000))
  lastFrame = now
  step(world, now, dt)
  serveLook()
  sync(now)
  stepNpcs(now, dt, world.room, YOU_SIZE, fit.classList.contains('is-still'), being(world, 'you'))
  sound(now)
  requestAnimationFrame(frame)
}

let inertRoom = ''
function sync(now: number) {
  if (inertRoom !== world.room) {
    inertRoom = world.room
    // Only the current room takes focus and is read out; the others sit off-stage on the track.
    for (const room of document.querySelectorAll<HTMLElement>('.room')) room.inert = room.id !== `room-${world.room}`
  }
  fit.dataset.room = world.room
  fit.classList.toggle('has-card', Boolean(world.card))
  track.dataset.room = world.room
  renderFlap(must('#flaps'), poleFree(world))
  renderFlap(must('#mini-flaps'), poleFree(world))
  const sub = `${poleUsed(world)} used of ${poleCap(world)} GB`
  must('#pole-sub').textContent = sub
  must('#mini-sub').textContent = sub
  setText('#label-caches', gbWord(skiffTenths(world, 'caches')))
  setText('#label-apps', gbWord(skiffTenths(world, 'apps')))
  setText('#label-stuff', gbWord(skiffTenths(world, 'stuff')))
  must('#bead-detail').textContent = beadText(world) ?? ''
  must('#path-sign').textContent = world.room === 'hold' && !world.sheetItemId ? signPath(world) : ''
  must('#locker-count').textContent = world.lockerTenths > 0 ? gbWord(world.lockerTenths) : 'empty'
  const steer = must<HTMLElement>('#steer')
  const waiting = world.steering.at(-1)
  steer.hidden = !world.tool || !waiting
  steer.textContent = waiting && world.tool ? `After ${world.tool.label} · ${waiting}` : ''
  syncTuning()
  syncGuide(now)
  syncBrief()
  syncSheds()
  syncSheet()
  syncCard(now)
  syncEmpty()
  for (const [id, el] of beings) {
    const actor = being(world, id)
    const visible = id === 'you' || id === world.scout
    el.hidden = !visible
    if (!visible) continue
    const room: Room = id !== 'you' && !actor.awake ? 'quay' : world.room
    const parent = roomObjects(room)
    if (el.parentElement !== parent) parent.appendChild(el)
    // Farther up the floor reads farther away: characters scale 0.84 at the back edge to 1.06 at the front.
    const depth = (0.84 + Math.min(1, Math.max(0, (actor.y - 480) / 220)) * 0.22) * (id === 'you' ? YOU_SIZE : SCOUT_SIZE)
    el.style.transform = `translate(${actor.x}px, ${actor.y}px) scale(${depth})`
    el.style.setProperty('--inv', String(1 / depth))
    // Keep bubbles on the stage: slide them in from the edges, in the sprite's own (scaled) units.
    let edge = Math.max(0, 150 - actor.x) - Math.max(0, actor.x - 1130)
    // A scout's bubble leans away from the penguin when they stand close, so it never covers the player.
    if (id !== 'you') {
      const you = being(world, 'you')
      if (Math.abs(actor.x - you.x) < 170 && Math.abs(actor.y - you.y) < 80) edge += (actor.x <= you.x ? -1 : 1) * 70
      edge = Math.max(150 - actor.x, Math.min(1130 - actor.x, edge))
    }
    el.style.setProperty('--bx', `${edge / depth}px`)
    el.style.setProperty('--bxs', `${edge}px`)
    if (id !== 'you') {
      const you = being(world, 'you')
      const close = Math.abs(actor.x - you.x) < 110 && Math.abs(actor.y - you.y) < 50
      // Keep the label on the bird; when it would meet the player's, stack it a line lower instead.
      el.style.setProperty('--nx', '0px')
      el.style.setProperty('--ny', '0px')
      el.classList.toggle('is-near-you', close)
    }
    el.style.zIndex = String(Math.round(actor.y))
    const heft = id === world.scout ? effortScale(world.effort) : 1
    el.style.setProperty('--heft', String(heft))
    const turn = el.querySelector<HTMLElement>('.turn')!
    turn.style.setProperty('--face', String(actor.facing))
    const pose = poseOf(world, actor)
    const previousPose = poseSeen.get(id)
    if (previousPose === 'walk' && pose !== 'walk') {
      if (id !== 'you' && actor.mode === 'post') {
        pulse(el, 'is-posted')
        audio.chirp()
      } else pulse(el, 'is-settle')
    }
    poseSeen.set(id, pose)
    const last = heading.get(id) ?? { x: actor.x, y: actor.y, back: false }
    const dx = actor.x - last.x
    const dy = actor.y - last.y
    if (pose !== 'walk' && pose !== 'carry') last.back = false
    else if (Math.hypot(dx, dy) > 0.5) last.back = dy < 0 && Math.abs(dy) > Math.abs(dx) * 0.7
    last.x = actor.x
    last.y = actor.y
    heading.set(id, last)
    el.classList.toggle('is-back', last.back)
    el.classList.toggle('is-walking', pose === 'walk')
    el.classList.toggle('is-sleeping', pose === 'sleep')
    el.classList.toggle('is-sitting', sitting(world, actor))
    el.classList.toggle('is-carrying', id === 'you' && Boolean(world.carrying))
    el.classList.toggle('is-wave', id === 'you' && world.fidget?.kind === 'wave')
    el.classList.toggle('is-hop', id === 'you' && world.fidget?.kind === 'hop')
    el.classList.toggle('is-wiggle', id === 'you' && world.fidget?.kind === 'wiggle')
    if (id === 'you') {
      const dancing = danceUntil > now && pose !== 'walk' && !world.carrying
      if (!dancing && danceUntil > now && pose === 'walk') danceUntil = 0
      el.classList.toggle('is-dancing', dancing)
      const badge = el.querySelector<HTMLElement>('.emote')!
      const showing = emote && emote.until > now && !actor.bubble ? emote.id : ''
      if (badge.dataset.id !== showing) {
        badge.dataset.id = showing
        badge.hidden = !showing
        badge.innerHTML = showing ? emoteSvg(showing) : ''
      }
    } else if (world.scout === id) {
      el.classList.toggle('is-dancing', danceUntil > now && pose !== 'walk' && Math.hypot(actor.x - being(world, 'you').x, actor.y - being(world, 'you').y) < 220)
    }
    if (id === world.scout) {
      el.dataset.model = world.model
      el.dataset.effort = world.effort
    } else {
      delete el.dataset.model
      delete el.dataset.effort
    }
    const bubble = el.querySelector<HTMLElement>('.bubble')!
    if (actor.bubble) {
      bubble.hidden = false
      if (bubble.textContent !== actor.bubble) {
        bubble.textContent = actor.bubble
        bubble.classList.remove('pop')
        void bubble.offsetWidth
        bubble.classList.add('pop')
      }
    } else bubble.hidden = true
  }
  let spoken = ''
  for (const actor of world.beings) if (actor.bubble) spoken = `${actor.name}: ${actor.bubble}`
  if (live.textContent !== spoken) live.textContent = spoken

  const nearId = world.room === 'hold' || world.room === 'locker' ? nearestLiftable(world)?.id ?? null : null
  for (const item of world.items) {
    const el = ensureProp(item)
    const draw = propDraw(world, item, now)
    const visible = propVisible(world, item) && !draw.hide
    el.hidden = !visible
    if (!visible) continue
    const parent = world.carrying === item.id ? roomObjects(world.room) : item.disposed === 'locker' ? roomObjects('locker') : roomObjects('hold')
    if (el.parentElement !== parent) parent.appendChild(el)
    const flying = Boolean(world.emptying?.ids.includes(item.id))
    const held = world.carrying === item.id || world.toss?.itemId === item.id || flying
    const depth = ITEM_SIZE * draw.scale * (held && !flying ? 0.9 : sizeScale(item.tenths)) * (0.9 + Math.min(1, Math.max(0, (draw.y - 470) / 220)) * 0.16)
    const nudge = held || item.disposed === 'locker' ? { dx: 0, dy: 0, tilt: 0, sx: 1 } : jitter(item.name)
    el.style.transform = `translate(${draw.x + nudge.dx}px, ${draw.y + nudge.dy}px) rotate(${draw.rot + nudge.tilt}deg) scale(${depth * nudge.sx}, ${depth})`
    el.style.setProperty('--inv', String(1 / depth))
    const you = being(world, 'you')
    el.style.zIndex = world.carrying === item.id ? String(Math.round(you.y) + 2) : world.toss?.itemId === item.id ? '900' : String(Math.round(draw.y) + (nearId === item.id ? 400 : 0))
    el.classList.toggle('is-held', held)
    const standingOn = Math.hypot(draw.x - being(world, 'you').x, draw.y - being(world, 'you').y) < 80
    el.classList.toggle('is-near', !held && nearId === item.id && !standingOn)
    setNodeText(el.querySelector('.t-size')!, gbWord(item.tenths))
    setNodeText(el.querySelector('.t-name')!, item.name)
    setNodeText(el.querySelector('.t-phrase')!, item.phrase)
  }

  if (world.splash) {
    splash.hidden = false
    splash.style.left = `${world.splash.x}px`
    splash.style.top = `${world.splash.y}px`
  } else splash.hidden = true
  if (world.toss && world.toss.itemId !== prevToss) {
    const youEl = beings.get('you')
    if (youEl) pulse(youEl, 'is-throw', 820)
  }
  prevToss = world.toss?.itemId ?? null
  // Celebrate a finished throw: a rising size number and a burst of confetti where it landed.
  if (world.rehearsedTenths > prevRehearsed) {
    const at = world.splash ?? { x: 1180, y: 392 }
    // The ticket rises in the clear wall space above the map poster, left of the sea door.
    void at
    celebrate(990, 205, `+${gbWord(world.rehearsedTenths - prevRehearsed)}`, 'practice')
  }
  prevRehearsed = world.rehearsedTenths
  if (world.lockerTenths > prevLocker && world.room === 'hold') celebrate(248, 360, `+${gbWord(world.lockerTenths - prevLocker)}`, 'kept')
  prevLocker = world.lockerTenths
  if (world.carrying !== prevCarry) {
    const youEl = beings.get('you')
    if (world.carrying && youEl) {
      pulse(youEl, 'is-heave')
      const sack = props.get(world.carrying)
      if (sack) pulse(sack, 'is-heave')
      audio.heave()
    } else if (prevCarry) audio.setDown()
    prevCarry = world.carrying
  }
}

let tuningKey = ''
function syncTuning() {
  if (world.card && !who.hidden) closeWho()
  const look = world.scout ? modelChoice(world) : null
  const effort = effortChoice(world)
  const scout = world.scout ? being(world, world.scout) : null
  const key = `${world.scout}|${scout?.name}|${look?.id}|${effort.id}|${JSON.stringify(world.live)}`
  if (key !== tuningKey) {
    tuningKey = key
    const face = must('#dock-face')
    face.replaceChildren(world.scout ? faceOf(world.scout) : document.createTextNode('?'))
    must('#scout-btn').setAttribute('aria-label', scout ? `Your scout, ${scout.name}` : 'Choose a scout')
    must('#sc-name').textContent = scout?.name ?? 'No scout'
    must('#sc-line').textContent = look ? `${look.label} · ${effort.label} effort` : 'Pick one below.'
    const status = must<HTMLElement>('#sc-live')
    const live = scoutIsLive(world)
    status.dataset.live = String(live)
    status.textContent = !world.scout ? '' : live ? 'Live · Claude Code on this Mac' : world.live === null ? 'Looking for agents…' : 'Scripted · not connected yet'
    must('#sc-note').textContent = live ? 'Each line you send asks Claude once, on your own plan. It has no tools: it can only talk.' : ''
    const portrait = must<HTMLElement>('#sc-portrait')
    portrait.replaceChildren()
    if (world.scout) {
      const art = faceOf(world.scout)
      art.style.setProperty('--heft', String(effortScale(effort.id)))
      portrait.appendChild(art)
    }
    portrait.dataset.effort = effort.id
    const modelsHost = must('#model-choices')
    modelsHost.replaceChildren()
    if (world.scout) {
      for (const choice of modelsFor(world)) {
        const button = document.createElement('button')
        button.type = 'button'
        button.dataset.model = choice.id
        button.textContent = choice.label
        button.classList.toggle('is-on', choice.id === look?.id)
        button.setAttribute('aria-pressed', String(choice.id === look?.id))
        modelsHost.appendChild(button)
      }
    }
    const effortHost = must('#effort-choices')
    effortHost.replaceChildren()
    const level = EFFORTS.findIndex((choice) => choice.id === effort.id)
    EFFORTS.forEach((choice, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.effort = choice.id
      button.setAttribute('aria-label', choice.label)
      button.setAttribute('aria-pressed', String(choice.id === effort.id))
      button.classList.toggle('is-on', index <= level)
      button.classList.toggle('is-current', choice.id === effort.id)
      button.innerHTML = FISH_SVG + `<span></span>`
      button.querySelector('span')!.textContent = choice.label
      effortHost.appendChild(button)
    })
    for (const button of document.querySelectorAll<HTMLElement>('#scout-choices [data-scout]')) {
      const id = button.dataset.scout
      const name = button.dataset.name
      const on = id === world.scout && (id !== 'custom' || !name || name === world.customName)
      button.classList.toggle('is-on', on)
    }
  }
  if (!naming && document.activeElement !== sayInput) {
    const prompt = look && scout ? `Tell ${scout.name} (${look.label}) what matters` : 'Tell your scout what matters'
    if (sayInput.placeholder !== prompt) sayInput.placeholder = prompt
    must('#say-label').textContent = prompt
  }
}

const FISH_SVG = '<svg viewBox="0 0 48 28" aria-hidden="true"><path d="M6 14C12 4 30 2 38 14C30 26 12 24 6 14Z" class="fish-body"/><path d="M38 14L47 6V22Z" class="fish-body"/><circle cx="15" cy="12" r="2.2" fill="#1a2332"/><path d="M22 9c2 3 2 7 0 10" fill="none" stroke="#1a2332" stroke-width="2" stroke-linecap="round" opacity=".5"/></svg>'

/** A copy of a scout's drawn sprite, for the dock button and the scout card. */
function faceOf(id: BirdId): SVGElement {
  const svg = must<HTMLTemplateElement>(`#tpl-${id}`).content.querySelector('svg')!.cloneNode(true) as SVGElement
  svg.classList.add('face-art')
  return svg
}

function promptFor(game: World): string {
  if (!game.scout) return 'Tell your scout what matters'
  return `Tell ${being(game, game.scout).name} (${modelChoice(game).label}) what matters`
}

function syncBrief() {
  const box = must<HTMLElement>('#brief')
  const list = must('#brief-list')
  box.hidden = world.brief.length === 0
  list.replaceChildren()
  for (const line of world.brief) {
    const li = document.createElement('li')
    li.textContent = line
    list.appendChild(li)
  }
}

let shedKey = ''
const SHED_COLORS = ['#e15b4a', '#3aa0f2', '#5bb04b', '#f08a2c', '#9b6bd6', '#f4c534']
function syncSheds() {
  const key = world.repos.map((repo) => `${repo.id}:${scopeTenths(world, repo.id)}:${world.scope.id === repo.id}`).join('|')
  if (key === shedKey) return
  shedKey = key
  const host = must('#sheds')
  host.replaceChildren()
  world.repos.forEach((repo, index) => {
    const slot = shedSlot(index)
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'hit shed'
    button.dataset.act = 'scope'
    button.dataset.scope = repo.id
    button.style.left = `${slot.x}px`
    button.style.top = `${slot.y}px`
    button.style.setProperty('--wall', SHED_COLORS[index % SHED_COLORS.length])
    button.style.zIndex = index < 2 ? '1' : '2'
    if (index >= 2) {
      button.style.scale = '0.82'
      button.classList.add('is-extra')
    }
    button.classList.toggle('is-scope', world.scope.id === repo.id)
    const tenths = scopeTenths(world, repo.id)
    button.setAttribute('aria-label', `${repo.label}, ${tenths > 0 ? gbWord(tenths) : 'not mapped yet'}`)
    button.innerHTML = `${SHED_SVG}<span class="shed-sign"><span class="shed-name"></span><span class="shed-meta"></span></span>`
    button.querySelector('.shed-name')!.textContent = repo.label
    button.querySelector('.shed-meta')!.textContent = tenths > 0 ? gbWord(tenths) : 'not mapped'
    host.appendChild(button)
  })
}

const SHED_SVG = `<svg class="shed-art" viewBox="0 0 64 74" aria-hidden="true">
  <g stroke="#1a2332" stroke-linejoin="round" stroke-linecap="round">
    <rect x="8" y="30" width="48" height="42" fill="var(--wall)" stroke-width="3.6"/>
    <rect x="40" y="32" width="15" height="38" fill="#1a2332" opacity=".16" stroke="none"/>
    <path d="M14 32v38M22 32v38M30 32v38M38 32v38M46 32v38" stroke="#1a2332" stroke-width="1.4" opacity=".28"/>
    <rect x="8" y="30" width="48" height="42" fill="none" stroke-width="3.6"/>
    <path d="M2 34L32 8L62 34Z" fill="#5a4636" stroke-width="3.6"/>
    <path d="M32 8L62 34H46Z" fill="#45352a" stroke="none"/>
    <path d="M2 34L32 8L62 34" fill="none" stroke-width="3.6"/>
    <path d="M6 32C14 24 24 16 32 10C40 16 50 24 58 32C52 29 46 30 42 33C38 28 30 28 26 32C22 28 12 28 6 32Z" fill="#fff" stroke-width="2.6"/>
    <rect x="24" y="46" width="16" height="26" rx="2" fill="#7a4a27" stroke-width="3"/>
    <circle cx="36" cy="60" r="1.8" fill="#f4c534" stroke="none"/>
    <rect x="12" y="38" width="9" height="9" rx="1.5" fill="#ffe27a" stroke-width="2.4"/>
  </g>
</svg>`

function syncSheet() {
  const sheet = must<HTMLElement>('#sheet')
  const item: Item | undefined = world.sheetItemId ? world.items.find((entry) => entry.id === world.sheetItemId) : undefined
  sheet.hidden = !item
  if (!item) return
  must('#sheet-title').textContent = item.name
  must('#sheet-path').textContent = item.path
  // The path is already on its own line; don't say it twice.
  must('#sheet-body').textContent = item.sheet.replace(`${item.path}. `, '')
  const brief = must<HTMLElement>('#sheet-brief')
  brief.hidden = world.brief.length === 0
  brief.textContent = world.brief.length ? `You said: ${world.brief[world.brief.length - 1]}` : ''
}

function syncCard(now: number) {
  const model = cardModel(world, now)
  card.hidden = !model
  catcher.hidden = !model && who.hidden
  if (!model) {
    shownCard = ''
    return
  }
  must('#card-title').textContent = model.title
  must('#card-meta').textContent = model.meta
  const path = must<HTMLElement>('#card-path')
  path.hidden = !model.path
  path.textContent = model.path
  must('#card-note').textContent = model.note
  const yes = must<HTMLButtonElement>('#card-yes')
  const no = must<HTMLButtonElement>('#card-no')
  yes.textContent = model.yes
  no.textContent = model.no
  yes.classList.toggle('is-focus', model.focus === 'yes')
  no.classList.toggle('is-focus', model.focus === 'no')
  yes.classList.toggle('locked', model.locked)
  card.classList.toggle('face-2', model.yes === 'Throw it' || model.yes === 'Throw them')
  const icon = must<HTMLElement>('#card-icon')
  const cardItem = world.card && 'itemId' in world.card ? world.items.find((entry) => entry.id === (world.card as { itemId: string }).itemId) : undefined
  const iconKey = model.icon ? `${model.icon}|${cardItem?.name ?? 'locker'}|${cardItem?.tenths ?? world.lockerTenths}|${world.card?.kind}` : ''
  if (icon.dataset.key !== iconKey) {
    icon.dataset.key = iconKey
    icon.className = model.icon ? 'card-icon art' : 'card-icon'
    // For the tip card, the stamp shows only what can actually go: the sea-safe part of the Locker.
    const seaSafe = world.items.filter((entry) => entry.disposed === 'locker' && entry.sea).reduce((sum, entry) => sum + entry.tenths, 0)
    icon.innerHTML = model.icon ? itemSvg({ form: model.icon, name: cardItem?.name ?? 'The Locker', tenths: cardItem?.tenths ?? seaSafe }) : ''
  }
  const key = `${model.title}|${model.yes}|${model.focus}`
  if (key !== shownCard) {
    shownCard = key
    sayInput.blur()
    ;(model.focus === 'yes' ? yes : no).focus()
  }
}

function syncEmpty() {
  const note = must<HTMLElement>('#empty-note')
  if (world.room !== 'hold') {
    note.hidden = true
    return
  }
  const any = itemsHere(world).some((item) => item.disposed === 'none')
  note.hidden = any
  note.textContent = world.scope.kind === 'repo'
    ? `Nothing mapped in ${world.scope.label} yet. Your scout will look through ${world.scope.path}.`
    : world.hold === 'stuff'
      ? 'Your own files stay private until you ask. Tell your scout "look in ~/Downloads".'
      : `The ${holdTitle(world.hold).toLowerCase()} boat is clear.`
}

function sound(now: number) {
  const you = being(world, 'you')
  if (poseOf(world, you) === 'walk' && now - lastFoot > 180) {
    lastFoot = now
    footHigh = !footHigh
    audio.foot(footHigh, world.room)
  }
  if (world.room !== prevRoom) {
    prevRoom = world.room
    audio.creak()
    audio.ambience(world.room)
    audio.music(world.room)
    const wipe = must<HTMLElement>('#wipe')
    wipe.style.setProperty('--wx', `${you.x}px`)
    wipe.style.setProperty('--wy', `${you.y - 50}px`)
    wipe.classList.remove('run')
    void wipe.offsetWidth
    wipe.classList.add('run')
  }
  if (world.freeTenths !== prevFree) {
    prevFree = world.freeTenths
    audio.flap()
    audio.splash()
  }
  if (world.splash && world.splash.until !== prevSplash) {
    prevSplash = world.splash.until
    audio.splash()
  }
  if (world.snoreUntil !== prevSnore) {
    prevSnore = world.snoreUntil
    audio.snore()
  }
  for (const actor of world.beings) {
    const previous = bubbleSeen.get(actor.id)
    if (actor.bubble && actor.bubble !== previous) audio.pop()
    bubbleSeen.set(actor.id, actor.bubble)
  }
  if (you.bubble === 'Oof.' && bubbleSeen.get('oof') !== you.bubble) audio.oof()
  bubbleSeen.set('oof', you.bubble)
  if (world.card && shownCard && bubbleSeen.get('card') !== shownCard) {
    bubbleSeen.set('card', shownCard)
    if (card.classList.contains('face-2')) audio.tide()
    else audio.card()
  }
  if (!world.card) bubbleSeen.set('card', '')
}

function showMarker(x: number, y: number) {
  const marker = must<HTMLElement>('#marker')
  marker.hidden = false
  marker.style.left = `${x}px`
  marker.style.top = `${y}px`
  marker.classList.remove('show')
  void marker.offsetWidth
  marker.classList.add('show')
}

function pulse(el: HTMLElement, cls: string, ms = 360) {
  el.classList.remove(cls)
  void el.offsetWidth
  el.classList.add(cls)
  window.setTimeout(() => el.classList.remove(cls), ms)
}

function dismissHello() {
  if (hello.hidden || hello.classList.contains('is-gone')) return
  hello.classList.add('is-gone')
  audio.unlock()
  audio.pop()
  window.setTimeout(() => {
    hello.hidden = true
  }, 380)
}

function onClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!hello.hidden) {
    dismissHello()
    return
  }
  if (target.closest('#console') || target.closest('#card') || target.closest('#who') || target.closest('#models')) return
  if (naming) return
  const now = performance.now()
  audio.unlock()
  if (world.card || !who.hidden || !must<HTMLElement>('#me').hidden || !mapPanel.hidden) return
  const hit = target.closest<HTMLElement>('[data-act]')
  if (!hit) return
  const act = hit.dataset.act
  if (act === 'ground') {
    const room = document.getElementById(`room-${world.room}`)
    if (!room) return
    const rect = room.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 1280
    const y = ((event.clientY - rect.top) / rect.height) * 708
    const spot = clampPoint(world.room, x, y)
    walkTo(world, spot.x, spot.y, null, now)
    showMarker(spot.x, spot.y)
    return
  }
  if (act === 'rope') {
    audio.bell()
    takeRope(world, now)
  }
  if (act === 'board') requestBoard(world, hit.dataset.hold as Hold, now)
  if (act === 'enter') requestEnter(world, hit.dataset.room as Room, now)
  if (act === 'gang') requestGang(world, now)
  if (act === 'empty') requestEmpty(world, now)
  if (act === 'hole') goToHole(world, hit.dataset.hole === 'sea' ? 'sea' : 'bin', now)
  if (act === 'scope' && hit.dataset.scope) requestScope(world, hit.dataset.scope, now)
  if (act === 'lift' && hit.dataset.id) {
    const item = world.items.find((entry) => entry.id === hit.dataset.id)
    if (item) {
      const draw = propDraw(world, item, now)
      const spot = clampPoint(world.room, draw.x, draw.y)
      showMarker(spot.x, spot.y)
    }
    requestLift(world, hit.dataset.id, now)
  }
  if (act === 'toy') playToy(hit.dataset.toy ?? '', now)
  if (act === 'npc' && hit.dataset.npc && talkTo(hit.dataset.npc, now, being(world, 'you').x)) audio.pop()
  if (act === 'who') openWho()
  if (act === 'model') openWho()
  if (act === 'effort') openWho()
  if (act === 'fda') bumpBuoy(world, now, 'panes')
  if (act === 'buoy') {
    const title = (hit.querySelector('title')?.textContent ?? '').toLowerCase()
    bumpBuoy(world, now, title.includes('docker') ? 'docker' : title.includes('photo') ? 'photos' : 'macos')
  }
  if (act === 'bird' && hit.dataset.bird === 'you' && !world.carrying) openMe()
  if (act === 'bird' && hit.dataset.bird && hit.dataset.bird !== 'you') {
    const id = hit.dataset.bird as BirdId
    if (world.room === 'quay' && !being(world, id).awake) pokeNest(world, id, now)
    else pokeBird(world, id, now)
  }
}

function onKey(event: KeyboardEvent) {
  if (!hello.hidden && (event.key === 'Enter' || event.key === 'Escape')) {
    event.preventDefault()
    dismissHello()
    return
  }
  if (event.target instanceof HTMLInputElement) {
    if (event.key === 'Escape') {
      event.target.blur()
      if (naming) {
        naming = false
        sayInput.value = ''
        sayInput.placeholder = promptFor(world)
        must('#say-label').textContent = promptFor(world)
      }
    }
    return
  }
  const now = performance.now()
  const key = event.key.toLowerCase()
  if (!who.hidden) {
    if (key === 'escape') closeWho()
    return
  }
  if (!must<HTMLElement>('#me').hidden) {
    if (key === 'escape') closeMe()
    return
  }
  if (!mapPanel.hidden) {
    if (key === 'escape' || key === 'm') closeMap()
    return
  }
  if (key === 'm') {
    openMap()
    return
  }
  if (world.card) {
    if (key === 'escape' || key === 'n') {
      event.preventDefault()
      answer(world, false, now)
    }
    if (key === 'y' && !event.repeat) {
      event.preventDefault()
      answer(world, true, now)
    }
    if (key === 'enter' && !event.repeat) {
      event.preventDefault()
      const yesFocused = must<HTMLButtonElement>('#card-yes').classList.contains('is-focus')
      answer(world, yesFocused, now)
    }
    return
  }
  if (key === 'escape') drop(world)
  if (key === 'd' && !event.repeat) playEmote('dance', now)
  if (key === 'e') {
    const item = nearestLiftable(world)
    if (item) requestLift(world, item.id, now)
  }
  if (key === 'x') goToHole(world, 'sea', now)
  if (key === 'b') goToHole(world, 'bin', now)
  if (key === 'f') {
    if (world.room === 'quay') {
      audio.bell()
      takeRope(world, now)
    }
    else {
      const item = nearestLiftable(world)
      if (item) requestLift(world, item.id, now)
    }
  }
  if (world.room === 'quay' && key === '1') requestBoard(world, 'caches', now)
  if (world.room === 'quay' && key === '2') requestBoard(world, 'apps', now)
  if (world.room === 'quay' && key === '3') requestBoard(world, 'stuff', now)
  if (key === '4') requestEnter(world, 'locker', now)
  if (key === 'g' && world.room === 'quay') requestEnter(world, 'glasshouse', now)
  if (key === 'q') {
    if (world.room === 'locker') requestGang(world, now)
    else if (world.room !== 'quay') requestEnter(world, 'quay', now)
  }
  if (key === 't' && world.room === 'locker') requestEmpty(world, now)
}

function openWho() {
  if (world.card) return
  tuningKey = ''
  who.hidden = false
  catcher.hidden = false
  must('#scout-btn').classList.add('is-on')
}
function closeWho() {
  who.hidden = true
  catcher.hidden = !world.card
  must('#scout-btn').classList.remove('is-on')
}

function layout() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 800)
  fit.style.transform = 'none'
  fit.style.setProperty('zoom', String(scale))
}

function roomObjects(room: Room): HTMLElement {
  const node = document.querySelector<HTMLElement>(`#room-${room} .objects`)
  if (!node) throw new Error(`missing objects for ${room}`)
  return node
}

function renderFlap(el: HTMLElement, text: string) {
  if (el.dataset.value === text && el.childElementCount === text.length) return
  const previous = el.dataset.value ?? ''
  el.dataset.value = text
  ;[...text].forEach((char, index) => {
    let cell = el.children[index] as HTMLElement | undefined
    if (!cell) {
      cell = document.createElement('span')
      cell.className = 'flap-cell'
      el.appendChild(cell)
    }
    cell.classList.toggle('dot', char === '.')
    if (cell.dataset.ch !== char) {
      cell.dataset.ch = char
      cell.textContent = char
      if (previous) {
        cell.classList.remove('tick')
        void cell.offsetWidth
        cell.classList.add('tick')
      }
    }
  })
  while (el.childElementCount > text.length) el.lastElementChild?.remove()
}

function ensureProp(item: Item): HTMLElement {
  const existing = props.get(item.id)
  if (existing) return existing
  const node = clone('tpl-prop')
  node.dataset.id = item.id
  node.querySelector('.art')!.innerHTML = itemSvg(item)
  node.dataset.form = item.form
  props.set(item.id, node)
  return node
}

/** Count this Mac: free space and the biggest caches. On first load the scout walks to the bell while it counts. */
async function loadThisMac(first = true) {
  const scout = world.scout ? being(world, world.scout) : null
  if (first && scout?.awake) {
    beginTool(world, 'This Mac', false)
    scout.mode = 'go'
    scout.tx = SPOTS.bead.x
    scout.ty = 630
    scoutSay(world, 'Counting the quay.', performance.now(), 4000)
  }
  try {
    const disk = await fetch('/api/disk').then((response) => response.json() as Promise<{ freeTenths: number; capacityTenths: number }>)
    if (disk.capacityTenths > 0) {
      useRealDisk(world, disk.freeTenths, disk.capacityTenths)
      // Reading the disk isn't bytes coming back: no flap, no splash, first count or rescan.
      prevFree = world.freeTenths
    }
    const scan = await fetch('/api/scan').then((response) => response.json() as Promise<{ items: { name: string; path: string; bytes: number }[] }>)
    useRealCaches(world, scan.items ?? [])
    syncPropNodes()
    // Apps are measured after the caches, so the first count isn't held up by them.
    // Your own files are private: macOS guards Downloads, Desktop and Documents, so the harbor never lists them
    // on its own. "Your stuff" starts empty; "look in ~/Downloads" measures it when the player asks.
    if (first) useRealHold(world, 'stuff', [])
    if (first) {
      void fetch('/api/repos')
        .then((response) => response.json() as Promise<{ repos: { label: string; path: string }[] }>)
        .then((result) => {
          useRealRepos(world, result.repos ?? [])
          syncPropNodes()
        })
        .catch(() => undefined)
    }
    void fetch('/api/apps')
      .then((response) => response.json() as Promise<{ items: Parameters<typeof useRealHold>[2] }>)
      .then((apps) => {
        useRealHold(world, 'apps', apps.items ?? [])
        syncPropNodes()
      })
      .catch(() => undefined)
    finishTool(world, performance.now())
    if (!first) scoutSay(world, `Counted again. The biggest is ${beadText(world)?.replace('mostly ', '') ?? 'gone'}.`, performance.now(), 4200)
  } catch {
    finishTool(world, performance.now())
    scoutSay(world, 'I could not read this Mac yet.', performance.now(), 4200)
  }
}

/** Measure a shed's folder for real (read-only) and fill its hold. */
async function lookInFolder(scopeId: string, path: string) {
  try {
    const response = await fetch(`/api/look?path=${encodeURIComponent(path)}`, { signal: AbortSignal.timeout(30_000) })
    if (!response.ok) throw new Error(String(response.status))
    const result = (await response.json()) as { items: { name: string; path: string; bytes: number; kind: 'build' | 'deps' | 'other' }[] }
    useFolder(world, scopeId, result.items, performance.now())
    syncPropNodes()
    finishTool(world, performance.now())
  } catch {
    finishTool(world, performance.now())
    scoutSay(world, `I couldn't look in ${path}. Is it a folder in your home?`, performance.now(), 4600)
  }
}

/** Measure one of the player's own folders (they asked) and put its big things on the "Your stuff" boat. */
async function lookInOwnFolder(path: string) {
  try {
    const response = await fetch(`/api/look?path=${encodeURIComponent(path)}`, { signal: AbortSignal.timeout(30_000) })
    if (!response.ok) throw new Error(String(response.status))
    const result = (await response.json()) as { path: string; items: { name: string; path: string; bytes: number; kind: string; days?: number }[] }
    const rows = result.items.map((row) => ({
      name: row.name,
      path: row.path,
      bytes: row.bytes,
      days: row.days ?? null,
      form: (/\.(dmg|pkg|iso|img)$/i.test(row.name) ? 'disk' : row.kind === 'deps' ? 'crate' : 'trunk') as Item['form'],
    }))
    useRealHold(world, 'stuff', rows, result.path)
    syncPropNodes()
    finishTool(world, performance.now())
    const total = rows.reduce((sum, row) => sum + row.bytes, 0)
    scoutSay(world, rows.length ? `${rows.length} big ${rows.length === 1 ? 'thing' : 'things'} in there, ${gbWord(Math.max(1, Math.round(total / 1e8)))}. They're on the green boat.` : 'Nothing big in there. Tidy!', performance.now(), 4800)
  } catch {
    finishTool(world, performance.now())
    scoutSay(world, `I couldn't look in ${path}. If macOS asked, it needs a yes.`, performance.now(), 4800)
  }
}

/** Do the look the sim asked for. */
function serveLook() {
  const request = world.lookRequest
  if (!request) return
  world.lookRequest = null
  if (request.scopeId === 'mac') void loadThisMac(false)
  else if (request.scopeId === 'stuff') void lookInOwnFolder(request.path)
  else void lookInFolder(request.scopeId, request.path)
}

/** Make sure every item has a node, and drop nodes for items a rescan removed (no ghost sacks). */
function syncPropNodes() {
  const alive = new Set(world.items.map((item) => item.id))
  for (const [id, node] of props) {
    if (alive.has(id)) continue
    node.remove()
    props.delete(id)
  }
  for (const item of world.items) ensureProp(item)
}

function clone(id: string): HTMLElement {
  const template = must<HTMLTemplateElement>(`#${id}`)
  return template.content.firstElementChild!.cloneNode(true) as HTMLElement
}

function must<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector)
  if (!node) throw new Error(`missing ${selector}`)
  return node
}

catcher.addEventListener('click', () => {
  if (!who.hidden) closeWho()
  if (!must<HTMLElement>('#me').hidden) closeMe()
  if (!mapPanel.hidden) closeMap()
})

function setText(selector: string, text: string) {
  const node = document.querySelector(selector)
  if (node && node.textContent !== text) node.textContent = text
}

function setNodeText(node: Element, text: string) {
  if (node.textContent !== text) node.textContent = text
}

function playEmote(id: string, now: number) {
  audio.unlock()
  if (id === 'dance') {
    danceUntil = danceUntil > now ? 0 : now + 6000
    if (danceUntil) audio.chirp()
    return
  }
  emote = { id, until: now + 3200 }
  audio.pop()
  const scoutEl = world.scout ? beings.get(world.scout) : undefined
  if (scoutEl) window.setTimeout(() => pulse(scoutEl, 'is-posted'), 260)
}

/** Find signed-in agent CLIs on this Mac. Only the dev server can look, so a built page stays scripted. */
async function findAgents() {
  try {
    const scan = await fetch('/api/agents').then((response) => response.json() as Promise<{ claude: boolean; cursor: boolean; codex: boolean }>)
    world.live = { claude: Boolean(scan.claude), cursor: Boolean(scan.cursor), codex: Boolean(scan.codex) }
  } catch {
    world.live = { claude: false, cursor: false, codex: false }
  }
  tuningKey = ''
}

/** Ask the live scout about a line. It gets the facts in reach and the player's notes; it has no tools. */
async function askScout(text: string) {
  const reach = (world.room === 'hold' ? itemsHere(world) : world.items.filter((item) => item.scopeId === world.scope.id || world.scope.kind === 'mac' && item.scopeId === 'mac'))
    .filter((item) => item.disposed === 'none')
    .sort((a, b) => b.tenths - a.tenths)
    .slice(0, 14)
  const body = {
    text,
    model: world.model,
    effort: world.effort,
    room: world.room === 'hold' ? `the ${holdTitle(world.hold).toLowerCase()} hold` : world.room,
    carrying: world.carrying ? world.items.find((item) => item.id === world.carrying)?.name ?? null : null,
    brief: world.brief,
    items: reach.map((item) => ({ id: item.id, name: item.name, path: item.path, gb: item.tenths / 10, kind: item.hold, sea: item.sea, note: item.phrase })),
  }
  try {
    const response = await fetch('/api/scout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.ok) throw new Error(String(response.status))
    const reply = (await response.json()) as { say: string; item: string | null; hole: 'sea' | 'bin' | null }
    liveReply(world, reply, performance.now())
    audio.chirp()
  } catch {
    liveFailed(world, performance.now())
    // Don't keep calling the scout live after a failed call; look again in two minutes.
    if (world.live) world.live = { ...world.live, claude: false }
    tuningKey = ''
    window.setTimeout(() => void findAgents(), 120_000)
  }
}

function openMe() {
  if (world.card) return
  closeWho()
  const me = must<HTMLElement>('#me')
  const you = being(world, 'you')
  must('#me-name').textContent = you.name
  const portrait = must('#me-portrait')
  if (!portrait.firstChild) {
    const art = must<HTMLTemplateElement>('#tpl-you').content.querySelector('svg')!.cloneNode(true) as SVGElement
    art.classList.add('face-art')
    portrait.appendChild(art)
  }
  dressPlayer()
  must('#me-free').textContent = `${gbWord(world.freeTenths)} of ${gbWord(world.capacityTenths)}`
  must('#me-practice').textContent = world.rehearsedTenths > 0 ? gbWord(world.rehearsedTenths) : 'nothing yet'
  const locked = world.items.filter((item) => item.disposed === 'locker').length
  must('#me-locker').textContent = locked ? `${gbWord(world.lockerTenths)} · ${locked} ${locked === 1 ? 'thing' : 'things'}` : 'empty'
  must('#me-notes').textContent = world.brief.length ? String(world.brief.length) : 'none'
  must('#me-foot').textContent = world.rehearsal
    ? 'This harbor is a practice run. Throws leave your disk as it is, so the free space above does not change.'
    : 'Free space comes from your disk and moves only when bytes come back.'
  me.hidden = false
  catcher.hidden = false
  audio.card()
}
function closeMe() {
  must<HTMLElement>('#me').hidden = true
  catcher.hidden = !world.card && who.hidden
}

/**
 * First-run guide. The scout walks a new player through one full loop with bouncing arrows:
 * board the caches boat, pick something up, then choose the sea or the Locker. Remembered per browser.
 */
type GuideStep = 'board' | 'lift' | 'drop' | 'done'
const GUIDE_KEY = 'harbor-guide-v1'
let guide: GuideStep = (() => {
  try {
    return localStorage.getItem(GUIDE_KEY) === 'done' ? 'done' : 'board'
  } catch {
    return 'board'
  }
})()
let guideSaid = ''
const POINTER_SVG = '<svg viewBox="0 0 40 46" aria-hidden="true"><path d="M12 2h16v20h10L20 44L2 22h10z" fill="#ffd23f" stroke="#1a2332" stroke-width="3.4" stroke-linejoin="round"/><path d="M16 6v18" stroke="#fff6c2" stroke-width="3" stroke-linecap="round"/></svg>'

function syncGuide(now: number) {
  const a = must<HTMLElement>('#pointer-a')
  const b = must<HTMLElement>('#pointer-b')
  if (!a.firstChild) {
    a.innerHTML = POINTER_SVG
    b.innerHTML = POINTER_SVG
  }
  const point = (el: HTMLElement, spot: { x: number; y: number } | null) => {
    el.hidden = !spot
    if (spot) {
      el.style.left = `${spot.x}px`
      el.style.top = `${spot.y}px`
    }
  }
  const talking = world.beings.some((b) => b.bubble)
  const settled = hello.hidden && !world.card && !world.toss && !world.splash && who.hidden && world.scout !== null && world.lastInput > 0 && !talking
  if (guide === 'done' || !settled) {
    point(a, null)
    point(b, null)
    return
  }
  const line = (key: string, text: string) => {
    if (guideSaid === key) return
    guideSaid = key
    scoutSay(world, text, now, 5200)
  }
  if (guide === 'board') {
    if (world.room === 'hold') guide = 'lift'
    else {
      point(a, world.room === 'quay' ? { x: 424, y: 300 } : null)
      point(b, null)
      if (world.room === 'quay' && !world.tool) line('board', 'Caches ride on the red boat. Hop aboard!')
      return
    }
  }
  if (guide === 'lift') {
    if (world.carrying) guide = 'drop'
    else {
      // Point at what E would lift, so the arrow and the key agree.
      const top = world.room === 'hold' ? nearestLiftable(world) : undefined
      point(a, top ? { x: top.x, y: top.y - 96 } : null)
      point(b, null)
      if (top) line('lift', "Pick one up. I'll tell you what it is.")
      return
    }
  }
  if (guide === 'drop') {
    if (world.rehearsedTenths > 0 || world.lockerTenths > 0) {
      guide = 'done'
      try {
        localStorage.setItem(GUIDE_KEY, 'done')
      } catch {
        /* the guide just shows again next time */
      }
      point(a, null)
      point(b, null)
      window.setTimeout(() => scoutSay(world, "That's the whole job. The bell on the quay recounts this Mac.", performance.now(), 5600), 2600)
      return
    }
    if (!world.carrying) {
      guide = 'lift'
      return
    }
    point(a, world.room === 'hold' ? { x: 1181, y: 300 } : null)
    point(b, world.room === 'hold' ? { x: 248, y: 316 } : null)
  }
}

/** Little toys on the quay. Pure delight: none of them change a rule. */
function playToy(toy: string, now: number) {
  if (toy === 'gull') {
    const gull = document.querySelector<SVGElement>('.q-gull')
    if (!gull || gull.classList.contains('flown')) return
    gull.classList.add('flown')
    audio.gullCall()
    window.setTimeout(() => gull.classList.remove('flown'), 5200)
  }
  if (toy === 'lighthouse') {
    const beam = document.querySelector<SVGElement>('.q-beam')
    beam?.classList.remove('flash')
    void (beam as unknown as HTMLElement | null)?.getBoundingClientRect()
    beam?.classList.add('flash')
    audio.horn()
    window.setTimeout(() => beam?.classList.remove('flash'), 2400)
  }
  if (toy === 'cat') {
    const cat = document.querySelector<SVGElement>('.h-cat')
    cat?.classList.remove('awake')
    void cat?.getBoundingClientRect()
    cat?.classList.add('awake')
    audio.meow()
    window.setTimeout(() => cat?.classList.remove('awake'), 2600)
    if (world.scout && Math.random() < 0.5) window.setTimeout(() => scoutSay(world, 'The cat is on watch. Mostly napping.', performance.now(), 2800), 600)
  }
  if (toy === 'clock') {
    const hands = document.querySelector<SVGElement>('.l-hands')
    hands?.classList.remove('spin')
    void hands?.getBoundingClientRect()
    hands?.classList.add('spin')
    audio.chime()
    window.setTimeout(() => hands?.classList.remove('spin'), 1300)
  }
  if (toy === 'basket') {
    const basket = document.querySelector<SVGElement>('.g-sway')
    basket?.classList.remove('rustle')
    void basket?.getBoundingClientRect()
    basket?.classList.add('rustle')
    audio.rustle()
    window.setTimeout(() => basket?.classList.remove('rustle'), 900)
  }
  if (toy === 'fish') {
    emote = { id: 'fish', until: now + 2600 }
    audio.chomp()
    const you = beings.get('you')
    if (you) pulse(you, 'is-hop')
    if (world.scout && Math.random() < 0.5) window.setTimeout(() => scoutSay(world, 'Save one for me.', performance.now(), 2600), 700)
  }
}

const CONFETTI = ['#ffd23f', '#e24b3f', '#3aa0f2', '#5bb04b', '#f08a2c', '#fff', '#8d62d6']

/** A finished throw or keep: a number floats up and confetti pops. Quieter under Still harbor. */
function celebrate(x: number, y: number, text: string, kind: 'practice' | 'kept') {
  const stage = must('#stage')
  const tag = document.createElement('div')
  tag.className = `celebrate celebrate-${kind}`
  tag.style.left = `${x}px`
  tag.style.top = `${y}px`
  tag.innerHTML = `<b></b><small>${kind === 'practice' ? 'practice throw' : 'in the Locker'}</small>`
  tag.querySelector('b')!.textContent = text
  stage.appendChild(tag)
  if (!fit.classList.contains('is-still')) {
    for (let i = 0; i < 18; i += 1) {
      const bit = document.createElement('i')
      bit.className = 'confetti'
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.3
      const dist = 60 + Math.random() * 70
      bit.style.left = `${x}px`
      bit.style.top = `${y}px`
      bit.style.background = CONFETTI[i % CONFETTI.length]
      bit.style.setProperty('--cx', `${Math.cos(angle) * dist}px`)
      bit.style.setProperty('--cy', `${Math.sin(angle) * dist - 50}px`)
      bit.style.setProperty('--cr', `${Math.round(Math.random() * 720 - 360)}deg`)
      stage.appendChild(bit)
      window.setTimeout(() => bit.remove(), 1300)
    }
    const scoutEl = world.scout ? beings.get(world.scout) : undefined
    if (scoutEl) pulse(scoutEl, 'is-posted', 500)
  }
  audio.chirp()
  window.setTimeout(() => tag.remove(), 1900)
}
