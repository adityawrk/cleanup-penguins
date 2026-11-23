import { describe, expect, it } from 'vitest'
import { claimsAnAction, clean, type ScoutAsk } from '../src/engine/scout'

const ask: ScoutAsk = {
  text: 'which one?',
  model: 'opus',
  effort: 'high',
  room: 'quay',
  carrying: null,
  brief: [],
  items: [
    { id: 'chrome', name: 'Chrome cache', path: '~/Library/Caches/Google/Chrome', gb: 1.4, kind: 'caches', sea: true, note: '' },
    { id: 'wow', name: 'World of Warcraft', path: '/Applications/World of Warcraft', gb: 49, kind: 'apps', sea: false, note: '' },
  ],
}

describe('live scout reply check', () => {
  it('keeps a grounded reply as it is', () => {
    expect(clean('{"say":"Chrome cache can go in the sea.","item":"chrome","hole":"sea"}', ask)).toEqual({
      say: 'Chrome cache can go in the sea.',
      item: 'chrome',
      hole: 'sea',
    })
  })

  it('drops an item id that was not in the facts', () => {
    expect(clean('{"say":"Try the npm cache.","item":"npm","hole":"sea"}', ask)).toEqual({ say: 'Try the npm cache.', item: null, hole: null })
  })

  it('never points a sea=false item at the sea', () => {
    expect(clean('{"say":"Sink the game.","item":"wow","hole":"sea"}', ask).hole).toBe('bin')
  })

  it('replaces a claim of having deleted something', () => {
    expect(clean('{"say":"I deleted the Chrome cache for you.","item":null,"hole":null}', ask).say).toBe("I can't throw things. You'll have to carry it.")
  })

  it('keeps lines short and survives prose around the JSON', () => {
    const reply = clean(`Sure! {"say":"${'a'.repeat(140)}","item":null,"hole":null} hope that helps`, ask)
    expect(reply.say.length).toBe(90)
  })
})

describe('claimed actions', () => {
  it('catches the ways a model might claim it threw something', () => {
    for (const line of ["I've just deleted it.", 'Deleted it for you!', 'I already cleared the Chrome cache.', "It's gone now.", 'We removed the npm cache.', 'Trashed them already.'])
      expect([line, claimsAnAction(line)]).toEqual([line, true])
  })
  it('leaves advice alone', () => {
    for (const line of ['The Chrome cache can go in the sea.', 'Throw the npm cache if you like.', 'Keep the game in the Locker.', "Deleting it is up to you."])
      expect([line, claimsAnAction(line)]).toEqual([line, false])
  })
})
