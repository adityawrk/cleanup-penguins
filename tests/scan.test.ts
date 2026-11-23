import { describe, expect, it } from 'vitest'
import { parseDu } from '../src/engine/scan'

describe('du output', () => {
  it('skips the root line and hidden names', () => {
    const rows = parseDu('1200\t/tmp/caches\n80000\t/tmp/caches/Google\n10\t/tmp/caches/.hidden\n', '/tmp/caches')
    expect(rows).toEqual([
      { name: 'Google', kb: 80000 },
    ])
  })
})
