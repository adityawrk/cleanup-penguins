import './style.css'
import { HarborAudio } from './audio'
import {
  SPOTS,
  answer,
  beadText,
  being,
  bumpBuoy,
  cardModel,
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
  signPath,
  sitting,
  skiffTenths,
  step,
  takeRope,
  walkTo,
  waterPx,
  type BeingId,
  type BirdId,
  type Hold,
  type Item,
  type Room,
} from './sim'

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
let naming = false
let shownCard = ''
let lastFoot = 0
let footHigh = false
let prevFree = world.freeTenths
let prevRoom = world.room
let prevSplash = 0
let prevSnore = 0
const bubbleSeen = new Map<string, string | null>()

const beings = new Map<BeingId, HTMLElement>()
const props = new Map<string, HTMLElement>()

for (const id of ['you', 'claude', 'codex', 'cursor', 'custom'] as const) {
  const node = clone(`tpl-${id}`)
  node.querySelector('.name')!.textContent = id === 'you' ? world.beings[0].name : being(world, id).name
  beings.set(id, node)
}

for (const item of world.items) {
  const node = clone('tpl-prop')
  node.dataset.id = item.id
  node.querySelector('.art')!.classList.add(item.form)
  props.set(item.id, node)
}

placeSpot(must('#spot-bin'), SPOTS.bin)
placeSpot(must('#spot-chute'), SPOTS.chute)
must<HTMLElement>('#nest').style.left = '900px'
must<HTMLElement>('#nest').style.top = '600px'

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
    sayInput.placeholder = 'Tell your scout what matters'
    if (text.trim()) setScout(world, 'custom', now, text.trim())
    return
  }
  say(world, text, now)
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
who.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-scout]')
  if (!button) return
  const id = button.dataset.scout as BirdId
  if (id === 'custom') {
    naming = true
    closeWho()
    sayInput.placeholder = 'What should I call them?'
    sayInput.focus()
    return
  }
  setScout(world, id, performance.now())
  closeWho()
})
window.addEventListener('keydown', onKey)
window.addEventListener('resize', layout)
layout()
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
  must<HTMLElement>('#sea').style.height = `${waterPx(world)}px`
  renderFlap(must('#flaps'), poleFree(world))
  renderFlap(must('#mini-flaps'), poleFree(world))
  const sub = `${poleUsed(world)} of ${poleCap(world)}`
  must('#pole-sub').textContent = sub
  must('#mini-sub').textContent = sub
  must('#label-caches').textContent = `Caches · ${gbWord(skiffTenths(world, 'caches'))}`
  must('#label-apps').textContent = `Applications · ${gbWord(skiffTenths(world, 'apps'))}`
  must('#label-stuff').textContent = `Your stuff · ${gbWord(skiffTenths(world, 'stuff'))}`
  const bead = beadText(world)
  must('#bead').textContent = bead ?? 'This Mac'
  must('#path-sign').textContent = world.room === 'hold' ? signPath(world) : ''
  must('#locker-count').textContent = world.lockerTenths > 0 ? gbWord(world.lockerTenths) : 'empty'
  const scout = world.scout ? being(world, world.scout) : null
  must('#plaque-name').textContent = scout?.name ?? 'Nobody'
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
    const depth = 0.86 + Math.min(1, Math.max(0, (actor.y - 480) / 220)) * 0.2
    el.style.transform = `translate(${actor.x}px, ${actor.y}px) scale(${depth})`
    el.style.zIndex = String(Math.round(actor.y))
    const turn = el.querySelector<HTMLElement>('.turn')!
    turn.style.setProperty('--face', String(actor.facing))
    const pose = poseOf(world, actor)
    el.classList.toggle('is-walking', pose === 'walk')
    el.classList.toggle('is-sleeping', pose === 'sleep')
    el.classList.toggle('is-sitting', sitting(world, actor))
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

  for (const item of world.items) {
    const el = props.get(item.id)!
    const draw = propDraw(world, item, now)
    const visible = propVisible(world, item) && !draw.hide
    el.hidden = !visible
    if (!visible) continue
    const parent = item.disposed === 'locker' && world.carrying !== item.id ? roomObjects('locker') : roomObjects('hold')
    if (el.parentElement !== parent) parent.appendChild(el)
    const depth = draw.scale * (0.9 + Math.min(1, Math.max(0, (draw.y - 470) / 220)) * 0.16)
    el.style.transform = `translate(${draw.x}px, ${draw.y}px) rotate(${draw.rot}deg) scale(${depth})`
    el.style.zIndex = world.toss?.itemId === item.id ? '900' : String(Math.round(draw.y))
    el.querySelector('.t-size')!.textContent = gbWord(item.tenths)
    el.querySelector('.t-name')!.textContent = item.name
    el.querySelector('.t-phrase')!.textContent = item.phrase
  }

  if (world.splash) {
    splash.hidden = false
    splash.style.left = `${world.splash.x}px`
    splash.style.top = `${world.splash.y}px`
  } else splash.hidden = true
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
function syncSheds() {
  const key = world.repos.map((repo) => `${repo.id}:${scopeTenths(world, repo.id)}`).join('|')
  if (key === shedKey) return
  shedKey = key
  const host = must('#sheds')
  host.replaceChildren()
  for (const repo of world.repos) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'hit shed'
    button.dataset.act = 'scope'
    button.dataset.scope = repo.id
    button.style.left = `${repo.x - 56}px`
    button.style.top = `${repo.y}px`
    button.innerHTML = `<span class="shed-name"></span><span class="shed-meta"></span>`
    button.querySelector('.shed-name')!.textContent = repo.label
    const tenths = scopeTenths(world, repo.id)
    button.querySelector('.shed-meta')!.textContent = tenths > 0 ? gbWord(tenths) : repo.path
    host.appendChild(button)
  }
}

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
  const icon = must('#card-icon')
  icon.className = model.icon ? `card-icon art ${model.icon}` : 'card-icon'
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
    audio.foot(footHigh)
  }
  if (world.room !== prevRoom) {
    prevRoom = world.room
    audio.creak()
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
    audio.card()
  }
  if (!world.card) bubbleSeen.set('card', '')
}

function onClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('#console') || target.closest('#card') || target.closest('#who')) return
  if (naming) return
  const now = performance.now()
  audio.unlock()
  if (world.card || !who.hidden) return
  const hit = target.closest<HTMLElement>('[data-act]')
  if (!hit) return
  const act = hit.dataset.act
  if (act === 'ground') {
    const room = document.getElementById(`room-${world.room}`)
    if (!room) return
    const rect = room.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 1280
    const y = ((event.clientY - rect.top) / rect.height) * 708
    walkTo(world, x, y, null, now)
    return
  }
  if (act === 'rope') takeRope(world, now)
  if (act === 'board') requestBoard(world, hit.dataset.hold as Hold, now)
  if (act === 'enter') requestEnter(world, hit.dataset.room as Room, now)
  if (act === 'gang') requestGang(world, now)
  if (act === 'empty') requestEmpty(world, now)
  if (act === 'hole') goToHole(world, hit.dataset.hole === 'sea' ? 'sea' : 'bin', now)
  if (act === 'scope' && hit.dataset.scope) requestScope(world, hit.dataset.scope, now)
  if (act === 'lift' && hit.dataset.id) requestLift(world, hit.dataset.id, now)
  if (act === 'who') openWho()
  if (act === 'fda') bumpBuoy(world, now)
  if (act === 'buoy') bumpBuoy(world, now)
  if (act === 'bird' && hit.dataset.bird && hit.dataset.bird !== 'you') {
    const id = hit.dataset.bird as BirdId
    if (world.room === 'quay' && !being(world, id).awake) pokeNest(world, id, now)
    else pokeBird(world, id, now)
  }
}

function onKey(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement) {
    if (event.key === 'Escape') event.target.blur()
    return
  }
  const now = performance.now()
  const key = event.key.toLowerCase()
  if (!who.hidden) {
    if (key === 'escape') closeWho()
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
  if (key === 'e') {
    const item = nearestLiftable(world)
    if (item) requestLift(world, item.id, now)
  }
  if (key === 'x') goToHole(world, 'sea', now)
  if (key === 'b') goToHole(world, 'bin', now)
  if (key === 'f') {
    if (world.room === 'quay') takeRope(world, now)
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
  who.hidden = false
  catcher.hidden = false
}
function closeWho() {
  who.hidden = true
  catcher.hidden = !world.card
}

function layout() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 800)
  fit.style.transform = `scale(${scale})`
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

function placeSpot(el: HTMLElement, point: { x: number; y: number }) {
  el.style.left = `${point.x}px`
  el.style.top = `${point.y}px`
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
})
