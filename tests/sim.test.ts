import { describe, expect, it } from 'vitest'
import {
  advice,
  answer,
  beadText,
  being,
  cardModel,
  clampPoint,
  createWorld,
  goToHole,
  lift,
  lookIn,
  pokeNest,
  poleFree,
  requestLift,
  requestScope,
  say,
  setModel,
  setScout,
  cycleEffort,
  effortScale,
  modelsFor,
  skiffTenths,
  step,
  takeRope,
  walkTo,
  SPOTS,
  travel,
  useRealRepos,
  useRealHold,
  useRealCaches,
  finishTool,
  useFolder,
  liveReply,
  liveFailed,
  requestEmpty,
  type World,
} from '../src/sim'

function settle(world: World, ms: number, start = 0): number {
  let now = start
  const frames = Math.ceil(ms / 16)
  for (let i = 0; i < frames; i += 1) {
    now += 16
    step(world, now, 0.016)
  }
  return now
}

describe('harbor rules', () => {
  it('points the rope at the largest cache and keeps the pole honest', () => {
    const world = createWorld('ada')
    expect(beadText(world)).toBe('mostly Codex cache · 2.1 GB')
    expect(skiffTenths(world, 'caches')).toBe(70)
    expect(poleFree(world)).toBe('43.8')
    expect(world.freeTenths + 4682).toBe(world.capacityTenths)
  })

  it('throws a cache in the sea only after both faces, and leaves the pole alone in practice', () => {
    const world = createWorld('ada')
    world.room = 'hold'
    world.hold = 'caches'
    const you = being(world, 'you')
    you.x = you.tx = SPOTS.seaStand.x
    you.y = you.ty = SPOTS.seaStand.y
    lift(world, 'codex', 1000)
    expect(world.carrying).toBe('codex')
    expect(world.scout).toBe('claude')
    expect(being(world, 'claude').bubble).toMatch(/rebuild/i)
    expect(being(world, 'codex').awake).toBe(false)
    goToHole(world, 'sea', 1000)
    expect(world.card).toBeNull()
    step(world, 1700, 0.016)
    const face = cardModel(world, 1700)
    expect(face?.title).toBe('Throw Codex cache in the sea?')
    expect(face?.focus).toBe('yes')
    answer(world, true, 1700)
    expect(cardModel(world, 1800)?.focus).toBe('no')
    expect(cardModel(world, 1800)?.locked).toBe(true)
    answer(world, true, 1800)
    expect(world.card?.kind).toBe('sea')
    expect(world.freeTenths).toBe(438)
    answer(world, true, 2600)
    expect(world.toss).not.toBeNull()
    step(world, 3300, 0.016)
    expect(world.rehearsal).toBe(true)
    expect(world.freeTenths).toBe(438)
    expect(poleFree(world)).toBe('43.8')
    expect(world.rehearsedTenths).toBe(21)
    expect(being(world, 'claude').bubble).toMatch(/still on your disk/)
    expect(world.items.find((item) => item.id === 'codex')?.disposed).toBe('sea')
  })

  it('refuses the chute for an app and parks it in the locker without moving the pole', () => {
    const world = createWorld('ada')
    world.room = 'hold'
    world.hold = 'apps'
    const you = being(world, 'you')
    you.x = you.tx = SPOTS.seaStand.x
    you.y = you.ty = SPOTS.seaStand.y
    lift(world, 'wow', 1000)
    goToHole(world, 'sea', 1000)
    step(world, 2000, 0.016)
    const face = cardModel(world, 2000)
    expect(face?.title).toBe('Trash World of Warcraft?')
    expect(face?.note).toMatch(/chute won't take this/)
    answer(world, true, 2000)
    expect(world.freeTenths).toBe(438)
    expect(world.lockerTenths).toBe(490)
    expect(world.items.find((item) => item.id === 'wow')?.disposed).toBe('locker')
  })

  it('puts a recent file down when the card is refused', () => {
    const world = createWorld('ada')
    world.room = 'hold'
    world.hold = 'stuff'
    lift(world, 'recording', 500)
    world.card = { kind: 'bin', itemId: 'recording', face: 1, lockedUntil: 0, redirected: false }
    expect(cardModel(world, 500)?.focus).toBe('no')
    answer(world, false, 600)
    expect(world.carrying).toBeNull()
    expect(world.card).toBeNull()
    expect(world.lockerTenths).toBe(0)
  })

  it('keeps the glasshouse behind a rope', () => {
    const spot = clampPoint('glasshouse', 400, 200)
    expect(spot.oof).toBe(true)
    expect(spot.y).toBe(560)
  })

  it('keeps a single scout and will not throw from the chat bar', () => {
    const alone = createWorld('ada', null)
    say(alone, 'delete everything', 1000)
    expect(alone.snoreUntil).toBeGreaterThan(1000)
    expect(alone.items.every((item) => item.disposed === 'none')).toBe(true)

    const world = createWorld('ada')
    expect(world.scout).toBe('claude')
    expect(being(world, 'codex').awake).toBe(false)
    takeRope(world, 1000)
    expect(world.lookRequest).toEqual({ scopeId: 'mac', path: '~' })
    const now = settle(world, 2500, 1000)
    expect(world.room).toBe('hold')
    finishTool(world, now) // the page finished the rescan the bell asked for
    say(world, 'throw it', now)
    expect(being(world, 'claude').bubble).toBe("You'll have to throw it.")
    say(world, 'codex hello', now + 10)
    expect(being(world, 'claude').bubble).toBe("It's just me out here.")
    expect(being(world, 'codex').awake).toBe(false)
    expect(world.items.every((item) => item.disposed === 'none')).toBe(true)
  })

  it('switches scouts by sending the current one home', () => {
    const world = createWorld('ada')
    pokeNest(world, 'codex', 50)
    expect(cardModel(world, 50)?.title).toBe('Wake Codex?')
    expect(cardModel(world, 50)?.meta).toMatch(/Claude goes back/)
    answer(world, true, 50)
    expect(world.scout).toBe('codex')
    expect(being(world, 'claude').awake).toBe(false)
    expect(being(world, 'codex').awake).toBe(true)
  })

  it('keeps a custom brief and can start inside a repo', () => {
    const world = createWorld('ada')
    say(world, 'leave the chrome cache alone, I still use it', 100)
    expect(world.brief).toEqual(['leave the chrome cache alone, I still use it'])
    expect(being(world, 'claude').bubble).toBe("I'll keep that in mind.")
    world.room = 'hold'
    world.hold = 'caches'
    const chrome = world.items.find((item) => item.id === 'chrome')
    expect(chrome).toBeTruthy()
    expect(advice(world, chrome!).hole).toBe('bin')
    expect(advice(world, world.items.find((item) => item.id === 'codex')!).hole).toBe('sea')
    say(world, 'throw the npm cache', 150)
    expect(advice(world, world.items.find((item) => item.id === 'npm')!).hole).toBe('sea')
    expect(advice(world, chrome!).hole).toBe('bin')
    say(world, 'check with me before throwing anything', 180)
    expect(world.repos.some((repo) => repo.label.includes('throwing'))).toBe(false)
    expect(world.brief.at(-1)).toMatch(/check with me/)

    lookIn(world, 'lighthouse', 200)
    expect(world.scope.label).toBe('lighthouse')
    expect(world.room).toBe('hold')
    world.room = 'quay'
    requestScope(world, 'lighthouse', 300)
    const you = being(world, 'you')
    you.x = you.tx
    you.y = you.ty
    settle(world, 2000, 300)
    expect(world.room).toBe('hold')
    expect(world.scope.id).toBe('lighthouse')
    expect(world.items.find((item) => item.id === 'next' && item.disposed === 'none')).toBeTruthy()
  })

  it('walks up to a sack before lifting it', () => {
    const world = createWorld('ada')
    world.room = 'hold'
    world.hold = 'caches'
    const you = being(world, 'you')
    you.x = you.tx = 230
    you.y = you.ty = 640
    requestLift(world, 'codex', 100)
    expect(world.carrying).toBeNull()
    settle(world, 2000, 100)
    expect(world.carrying).toBe('codex')
  })

  it('changes the model and how hard the scout looks', () => {
    const world = createWorld('ada')
    expect(world.model).toBe('opus')
    expect(world.effort).toBe('high')
    expect(effortScale(world.effort)).toBeGreaterThan(1)
    cycleEffort(world, 10)
    expect(world.effort).toBe('xhigh')
    expect(being(world, 'claude').bubble).toMatch(/very hard/)
    setModel(world, 'fable', 20)
    expect(world.model).toBe('fable')
    expect(being(world, 'claude').bubble).toMatch(/top of this satchel/)
    expect(modelsFor(world).map((choice) => choice.id)).toEqual(['fable', 'opus', 'sonnet'])

    world.room = 'hold'
    world.hold = 'caches'
    world.effort = 'xhigh'
    lift(world, 'codex', 40)
    expect(world.sheetItemId).toBe('codex')

    const quiet = createWorld('ada')
    quiet.room = 'hold'
    quiet.hold = 'caches'
    quiet.effort = 'low'
    lift(quiet, 'codex', 40)
    expect(quiet.sheetItemId).toBeNull()

    setScout(quiet, 'codex', 50)
    expect(quiet.model).toBe('astra')
    expect(modelsFor(quiet).map((choice) => choice.id)).toEqual(['astra', 'sol', 'terra'])
    setModel(quiet, 'opus', 60)
    expect(quiet.model).toBe('astra')
    setScout(quiet, 'cursor', 70)
    expect(modelsFor(quiet).map((choice) => choice.id)).toEqual(['grok-4.7', 'grok-4.6', 'grok-4.5'])
    setScout(quiet, 'custom', 80, 'Antigravity')
    expect(quiet.model).toBe('neon')
    expect(modelsFor(quiet).map((choice) => choice.id)).toEqual(['neon', 'carbon', 'argon'])
  })

  it('gives the next scout the notes you already gave', () => {
    const world = createWorld('ada')
    say(world, 'leave the chrome cache alone', 10)
    setScout(world, 'codex', 20)
    expect(world.scout).toBe('codex')
    expect(being(world, 'claude').awake).toBe(false)
    expect(being(world, 'codex').bubble).toMatch(/chrome cache/)
    const chrome = world.items.find((item) => item.id === 'chrome')!
    expect(advice(world, chrome)).toMatchObject({ hole: 'bin', line: 'You asked me to leave this.' })
    say(world, 'the installer can go', 30)
    expect(world.brief).toEqual(['leave the chrome cache alone', 'the installer can go'])
    expect(advice(world, chrome).line).toBe('You asked me to leave this.')
  })

  it('sends a new instruction after the look the scout is already on', () => {
    const world = createWorld('ada')
    lookIn(world, 'lighthouse', 100)
    const scout = being(world, 'claude')
    expect(world.tool?.label).toBe('lighthouse')
    expect(scout.mode).toBe('go')
    say(world, 'leave the chrome cache alone', 120)
    expect(world.brief).toEqual([])
    expect(world.steering).toEqual(['leave the chrome cache alone'])
    expect(scout.bubble).toBe("I'll look in lighthouse.")
    expect(scout.tx).toBe(world.repos.find((repo) => repo.label === 'lighthouse')!.x)
    scout.x = scout.tx
    scout.y = scout.ty
    step(world, 200, 0.016)
    // Arriving isn't the end of a look: the folder scan is.
    expect(world.tool?.label).toBe('lighthouse')
    expect(world.lookRequest).toEqual({ scopeId: 'lighthouse', path: '~/projects/lighthouse' })
    useFolder(world, 'lighthouse', [{ name: '.next', path: '~/projects/lighthouse/.next', bytes: 1.6e9, kind: 'build' }], 210)
    finishTool(world, 210)
    expect(world.tool).toBeNull()
    expect(world.steering).toEqual([])
    expect(world.brief).toEqual(['leave the chrome cache alone'])
    expect(scout.bubble).toBe("Got it. I'll use that on the next one.")
    const chrome = world.items.find((item) => item.id === 'chrome')!
    expect(advice(world, chrome).hole).toBe('bin')

    lookIn(world, 'lighthouse', 300)
    say(world, 'look in cleanup-penguins', 320)
    finishTool(world, 400)
    expect(world.scope.label).toBe('cleanup-penguins')
    expect(world.tool?.label).toBe('cleanup-penguins')
    expect(scout.bubble).toBe("I'll look in cleanup-penguins.")
  })

  it('lets you waddle while the scout is still out', () => {
    const world = createWorld('ada')
    lookIn(world, 'lighthouse', 100)
    const you = being(world, 'you')
    const scout = being(world, 'claude')
    const errand = scout.tx
    walkTo(world, 220, 640, null, 150)
    expect(you.tx).not.toBe(you.x)
    expect(scout.tx).toBe(errand)
    expect(scout.mode).toBe('go')
    expect(world.tool?.label).toBe('lighthouse')
    you.x = you.tx
    you.y = you.ty
    step(world, 4200, 0.016)
    expect(world.fidget?.kind).toBe('wave')
  })

  it('asks the live scout only when Claude Code was found, and never notes a question', () => {
    const scripted = createWorld('ada')
    expect(say(scripted, 'which cache is biggest?', 10)).toBe('note')
    expect(scripted.brief).toEqual([])
    expect(being(scripted, 'claude').bubble).not.toMatch(/keep that in mind/)

    const world = createWorld('ada')
    world.live = { claude: true, cursor: false, codex: false }
    expect(say(world, 'leave the chrome cache alone', 20)).toBe('ask')
    expect(world.tool?.label).toBe('Thinking')
    expect(world.brief).toEqual(['leave the chrome cache alone'])
    expect(say(world, 'and the npm one?', 30)).toBe('queued')
    liveReply(world, { say: 'Noted. Chrome stays.', item: null, hole: null }, 40)
    expect(world.tool).toBeNull()
    expect(world.brief).toEqual(['leave the chrome cache alone'])
    expect(being(world, 'claude').bubble).toBe('Noted. Chrome stays.')
  })

  it('says plainly when the live scout cannot be reached', () => {
    const world = createWorld('ada')
    world.live = { claude: true, cursor: false, codex: false }
    say(world, 'which one first', 10)
    liveFailed(world, 20)
    expect(world.tool).toBeNull()
    expect(being(world, 'claude').bubble).toBe("I couldn't reach Claude Code just now.")
  })

  it('a live reply speaks and points, but cannot throw', () => {
    const world = createWorld('ada')
    world.live = { claude: true, cursor: false, codex: false }
    world.room = 'hold'
    say(world, 'which one first', 10)
    liveReply(world, { say: 'The Codex cache.', item: 'codex', hole: 'sea' }, 20)
    expect(being(world, 'claude').bubble).toBe('The Codex cache.')
    expect(being(world, 'claude').mode).toBe('go')
    expect(world.items.every((item) => item.disposed === 'none')).toBe(true)
    expect(world.carrying).toBeNull()
  })

  it('tips only sea-safe things from the Locker, as practice, and keeps the rest', () => {
    const world = createWorld('ada')
    world.items.find((item) => item.id === 'wow')!.disposed = 'locker'
    world.items.find((item) => item.id === 'codex')!.disposed = 'locker'
    world.lockerTenths = 490 + 21
    world.room = 'locker'
    const you = being(world, 'you')
    you.x = you.tx = SPOTS.tip.x
    you.y = you.ty = SPOTS.tip.y
    requestEmpty(world, 100)
    expect(world.card?.kind).toBe('empty')
    expect(cardModel(world, 150)?.meta).toBe('2.1 GB · 1 thing')
    expect(cardModel(world, 150)?.note).toMatch(/1 thing stays/)
    answer(world, true, 200)
    expect(cardModel(world, 300)?.title).toBe('This would be for good.')
    answer(world, true, 400)
    expect(world.card?.kind).toBe('empty')
    answer(world, true, 1100)
    settle(world, 1200, 1100)
    expect(world.items.find((item) => item.id === 'codex')?.disposed).toBe('sea')
    expect(world.items.find((item) => item.id === 'wow')?.disposed).toBe('locker')
    expect(world.freeTenths).toBe(438)
    expect(world.rehearsedTenths).toBe(21)
    expect(world.lockerTenths).toBe(490)
  })

  it('refuses to tip a Locker that holds nothing sea-safe', () => {
    const world = createWorld('ada')
    world.items.find((item) => item.id === 'wow')!.disposed = 'locker'
    world.lockerTenths = 490
    world.room = 'locker'
    const you = being(world, 'you')
    you.x = you.tx = SPOTS.tip.x
    you.y = you.ty = SPOTS.tip.y
    requestEmpty(world, 100)
    expect(world.card).toBeNull()
    expect(you.bubble).toMatch(/Nothing in here can go to the sea/)
  })

  it('turns a measured folder into cargo: build output can go to the sea, dependencies cannot', () => {
    const world = createWorld('ada')
    useFolder(world, 'penguins', [
      { name: 'node_modules', path: '~/projects/cleanup-penguins/node_modules', bytes: 4.2e9, kind: 'deps' },
      { name: 'dist', path: '~/projects/cleanup-penguins/dist', bytes: 8e8, kind: 'build' },
    ], 10)
    const mine = world.items.filter((item) => item.scopeId === 'penguins')
    expect(mine.map((item) => [item.name, item.sea, item.form])).toEqual([['node_modules', false, 'crate'], ['dist', true, 'sack']])
    expect(being(world, 'claude').bubble).toBe('cleanup-penguins: 5 GB in 2 folders.')
  })

  it('a rescan keeps what was thrown, kept or carried', () => {
    const world = createWorld('ada')
    useRealCaches(world, [{ name: 'Google', path: '~/Library/Caches/Google', bytes: 1.4e9 }, { name: 'pip', path: '~/Library/Caches/pip', bytes: 6e8 }])
    world.items.find((item) => item.name === 'Google')!.disposed = 'locker'
    useRealCaches(world, [{ name: 'Google', path: '~/Library/Caches/Google', bytes: 1.4e9 }, { name: 'uv', path: '~/Library/Caches/uv', bytes: 9e8 }])
    const caches = world.items.filter((item) => item.scopeId === 'mac' && item.hold === 'caches')
    expect(caches.map((item) => `${item.name}:${item.disposed}`).sort()).toEqual(['Google:locker', 'uv:none'])
  })

  it('travels by the map, but not while carrying something', () => {
    const world = createWorld('ada')
    expect(travel(world, 'apps', 10)).toBe(true)
    expect(world.room).toBe('hold')
    expect(world.hold).toBe('apps')
    lift(world, 'wow', 20)
    expect(travel(world, 'glasshouse', 30)).toBe(false)
    expect(world.room).toBe('hold')
    expect(being(world, 'you').bubble).toBe('Put it down first.')
  })

  it('fills the apps boat with real apps that can only go to the Locker, and empties your stuff honestly', () => {
    const world = createWorld('ada')
    useRealHold(world, 'apps', [
      { name: 'Big Game', path: '/Applications/Big Game.app', bytes: 4.9e10, days: 330, form: 'crate' },
      { name: 'Editor', path: '/Applications/Editor.app', bytes: 9e8, days: 2, form: 'crate' },
      { name: 'Mystery', path: '/Applications/Mystery.app', bytes: 5e8, days: null, form: 'crate' },
    ])
    useRealHold(world, 'stuff', [])
    const apps = world.items.filter((item) => item.hold === 'apps')
    expect(apps.map((item) => item.name)).toEqual(['Big Game', 'Editor', 'Mystery'])
    expect(apps.every((item) => !item.sea)).toBe(true)
    expect(apps.map((item) => item.phrase)).toEqual(['last opened 11 months ago', 'last opened 2 days ago', 'no last-opened date on record'])
    expect(advice(world, apps[0]).line).toBe("You haven't opened this in 11 months.")
    expect(world.items.filter((item) => item.hold === 'stuff')).toEqual([])
  })

  it('looks in your own folders for the Your stuff boat, without making a shed', () => {
    const world = createWorld('ada')
    useRealHold(world, 'stuff', []) // the live page clears the made-up fixtures on first load
    const sheds = world.repos.length
    lookIn(world, '~/Downloads', 10)
    expect(world.lookRequest).toEqual({ scopeId: 'stuff', path: '~/Downloads' })
    expect(world.repos.length).toBe(sheds)
    expect(being(world, 'claude').bubble).toMatch(/macOS may ask you first/)
    useRealHold(world, 'stuff', [{ name: 'Big.dmg', path: '~/Downloads/Big.dmg', bytes: 3e9, days: 120, form: 'disk' }], '~/Downloads')
    expect(world.items.filter((item) => item.hold === 'stuff' && item.disposed === 'none').map((item) => item.name)).toEqual(['Big.dmg'])
  })

  it('really looks when you walk into a shed nothing has measured yet', () => {
    const world = createWorld('ada')
    lookIn(world, '~/projects/fresh-repo', 10)
    world.lookRequest = null
    finishTool(world, 20)
    const shed = world.repos.find((repo) => repo.label === 'fresh-repo')!
    requestScope(world, shed.id, 30)
    settle(world, 3000, 30)
    expect(world.room).toBe('hold')
    expect(world.lookRequest).toEqual({ scopeId: shed.id, path: '~/projects/fresh-repo' })
  })

  it('swaps the made-up starter sheds for real repos, keeping sheds the player asked about', () => {
    const world = createWorld('ada')
    lookIn(world, '~/work/side-project', 10)
    useRealRepos(world, [{ label: 'harbor', path: '~/projects/harbor' }, { label: 'notes', path: '~/code/notes' }])
    expect(world.repos.map((repo) => repo.label)).toEqual(['harbor', 'notes', 'side-project'])
    expect(world.items.some((item) => item.scopeId === 'penguins' || item.scopeId === 'lighthouse')).toBe(false)
  })
})
