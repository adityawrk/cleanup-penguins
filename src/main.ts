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
import { itemSvg, sizeScale } from './items'
import { EMOTES, emoteSvg } from './emotes'
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
  walkTo,
  type BeingId,
  type BirdId,
  type EffortId,
  type Hold,
  type Item,
  type Room,
  type World,
} from './sim'

const ART: Record<string, string> = { quay: quayArt, 'quay-fore': quayFore, hold: holdArt, hello: helloArt }
for (const host of document.querySelectorAll<HTMLElement>('[data-art]')) {
  host.innerHTML = ART[host.dataset.art ?? ''] ?? ''
}

/** Sprites are drawn large and shown small, so the room reads as a big place. */
const YOU_SIZE = 0.56
const SCOUT_SIZE = 0.46

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
const poseSeen = new Map<string, string>()
/** Last drawn position and whether we're seeing a being's back (walking away from the camera). */
const heading = new Map<string, { x: number; y: number; back: boolean }>()
const bubbleSeen = new Map<string, string | null>()

const beings = new Map<BeingId, HTMLElement>()
const props = new Map<string, HTMLElement>()

for (const id of ['you', 'claude', 'codex', 'cursor', 'custom'] as const) {
  const node = clone(`tpl-${id}`)
  node.querySelector('.name')!.textContent = id === 'you' ? world.beings[0].name : being(world, id).name
  beings.set(id, node)
}

for (const item of world.items) ensureProp(item)
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
  sync(now)
  sound(now)
  requestAnimationFrame(frame)
}

function sync(now: number) {
  fit.dataset.room = world.room
  track.dataset.room = world.room
  renderFlap(must('#flaps'), poleFree(world))
  renderFlap(must('#mini-flaps'), poleFree(world))
  const sub = `${poleUsed(world)} of ${poleCap(world)}`
  must('#pole-sub').textContent = sub
  must('#mini-sub').textContent = sub
  setText('#label-caches', gbWord(skiffTenths(world, 'caches')))
  setText('#label-apps', gbWord(skiffTenths(world, 'apps')))
  setText('#label-stuff', gbWord(skiffTenths(world, 'stuff')))
  must('#bead-detail').textContent = beadText(world) ?? ''
  must('#path-sign').textContent = world.room === 'hold' ? signPath(world) : ''
  must('#locker-count').textContent = world.lockerTenths > 0 ? gbWord(world.lockerTenths) : 'empty'
  const steer = must<HTMLElement>('#steer')
  const waiting = world.steering.at(-1)
  steer.hidden = !world.tool || !waiting
  steer.textContent = waiting && world.tool ? `After ${world.tool.label} · ${waiting}` : ''
  syncTuning()
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
    const depth = (0.88 + Math.min(1, Math.max(0, (actor.y - 480) / 220)) * 0.16) * (id === 'you' ? YOU_SIZE : SCOUT_SIZE)
    el.style.transform = `translate(${actor.x}px, ${actor.y}px) scale(${depth})`
    el.style.setProperty('--inv', String(1 / depth))
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
    const held = world.carrying === item.id || world.toss?.itemId === item.id
    const depth = draw.scale * sizeScale(item.tenths) * (0.9 + Math.min(1, Math.max(0, (draw.y - 470) / 220)) * 0.16)
    el.style.transform = `translate(${draw.x}px, ${draw.y}px) rotate(${draw.rot}deg) scale(${depth})`
    el.style.setProperty('--inv', String(1 / depth))
    const you = being(world, 'you')
    el.style.zIndex = world.carrying === item.id ? String(Math.round(you.y) + 2) : world.toss?.itemId === item.id ? '900' : String(Math.round(draw.y))
    el.classList.toggle('is-held', held)
    el.classList.toggle('is-near', !held && nearId === item.id)
    setNodeText(el.querySelector('.t-size')!, gbWord(item.tenths))
    setNodeText(el.querySelector('.t-name')!, item.name)
    setNodeText(el.querySelector('.t-phrase')!, item.phrase)
  }

  if (world.splash) {
    splash.hidden = false
    splash.style.left = `${world.splash.x}px`
    splash.style.top = `${world.splash.y}px`
  } else splash.hidden = true
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
    const prompt = look ? `Tell ${look.label} what matters` : 'Tell your scout what matters'
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
  return `Tell ${modelChoice(game).label} what matters`
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
  must('#sheet-body').textContent = item.sheet
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
  const iconKey = model.icon ? `${model.icon}|${cardItem?.name ?? 'locker'}|${cardItem?.tenths ?? world.lockerTenths}` : ''
  if (icon.dataset.key !== iconKey) {
    icon.dataset.key = iconKey
    icon.className = model.icon ? 'card-icon art' : 'card-icon'
    icon.innerHTML = model.icon ? itemSvg({ form: model.icon, name: cardItem?.name ?? 'The Locker', tenths: cardItem?.tenths ?? world.lockerTenths }) : ''
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
    : `The ${holdTitle(world.hold).toLowerCase()} skiff is clear.`
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

function pulse(el: HTMLElement, cls: string) {
  el.classList.remove(cls)
  void el.offsetWidth
  el.classList.add(cls)
  window.setTimeout(() => el.classList.remove(cls), 340)
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
  if (world.card || !who.hidden || !must<HTMLElement>('#me').hidden) return
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
  if (act === 'who') openWho()
  if (act === 'model') openWho()
  if (act === 'effort') openWho()
  if (act === 'fda') bumpBuoy(world, now)
  if (act === 'buoy') bumpBuoy(world, now)
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

async function loadThisMac() {
  const scout = world.scout ? being(world, world.scout) : null
  if (scout?.awake) {
    beginTool(world, 'This Mac', false)
    scout.mode = 'go'
    scout.tx = SPOTS.bead.x
    scout.ty = 630
    scout.bubble = 'Counting the quay.'
    scout.bubbleUntil = performance.now() + 4000
  }
  try {
    const disk = await fetch('/api/disk').then((response) => response.json() as Promise<{ freeTenths: number; capacityTenths: number }>)
    if (disk.capacityTenths > 0) useRealDisk(world, disk.freeTenths, disk.capacityTenths)
    const scan = await fetch('/api/scan').then((response) => response.json() as Promise<{ items: { name: string; path: string; bytes: number }[] }>)
    useRealCaches(world, scan.items ?? [])
    for (const item of world.items) ensureProp(item)
    finishTool(world, performance.now())
  } catch {
    finishTool(world, performance.now())
    if (scout) scout.bubble = 'I could not read this Mac yet.'
  }
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
