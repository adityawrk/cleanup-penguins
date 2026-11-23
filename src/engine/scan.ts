import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { statfs } from 'node:fs/promises'

export interface DiskReading {
  freeTenths: number
  capacityTenths: number
}

export interface ScannedCache {
  name: string
  path: string
  bytes: number
}

export function parseDu(stdout: string, root: string): { name: string; kb: number }[] {
  const rows: { name: string; kb: number }[] = []
  for (const line of stdout.split('\n')) {
    const match = line.trim().match(/^(\d+)\s+(.+)$/)
    if (!match) continue
    const kb = Number(match[1])
    const full = match[2]
    if (full === root || full === `${root}/`) continue
    const name = full.slice(root.length).replace(/^\//, '').split('/')[0]
    if (!name || name.startsWith('.')) continue
    rows.push({ name, kb })
  }
  return rows
}

export async function readDisk(): Promise<DiskReading> {
  const stats = await statfs('/')
  const unit = stats.bsize
  return {
    freeTenths: Math.round((stats.bavail * unit) / 1e8),
    capacityTenths: Math.round((stats.blocks * unit) / 1e8),
  }
}

function displayPath(path: string): string {
  const home = homedir()
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path
}

function du(dir: string): Promise<string> {
  return new Promise((resolve) => {
    execFile('du', ['-k', '-d', '1', dir], { timeout: 20000 }, (_error, stdout) => {
      resolve(stdout ?? '')
    })
  })
}

export async function scanCaches(): Promise<ScannedCache[]> {
  const home = homedir()
  const roots = [
    `${home}/Library/Caches`,
    `${home}/.npm`,
    `${home}/.bun/install/cache`,
    `${home}/.cache`,
    `${home}/Library/Developer/Xcode/DerivedData`,
  ]
  const found: ScannedCache[] = []
  for (const root of roots) {
    try {
      await access(root)
    } catch {
      continue
    }
    const rows = parseDu(await du(root), root)
    for (const row of rows) {
      if (row.kb < 50_000) continue
      found.push({
        name: row.name,
        path: displayPath(`${root}/${row.name}`),
        bytes: row.kb * 1024,
      })
    }
  }
  found.sort((a, b) => b.bytes - a.bytes)
  return found.slice(0, 8)
}
