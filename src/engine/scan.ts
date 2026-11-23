import { execFile } from 'node:child_process'
import { access, readdir, realpath, stat } from 'node:fs/promises'
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
  /** Days since the folder last changed (its own mtime). Undefined when it couldn't be read. */
  days?: number
}

export function parseDu(stdout: string, root: string, hidden = false): { name: string; kb: number }[] {
  const rows: { name: string; kb: number }[] = []
  for (const line of stdout.split('\n')) {
    const match = line.trim().match(/^(\d+)\s+(.+)$/)
    if (!match) continue
    const kb = Number(match[1])
    const full = match[2]
    if (full === root || full === `${root}/`) continue
    const name = full.slice(root.length).replace(/^\//, '').split('/')[0]
    if (!name || (!hidden && name.startsWith('.')) || name === '.git') continue
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
      let days: number | undefined
      try {
        days = Math.max(0, Math.round((Date.now() - (await stat(`${root}/${row.name}`)).mtimeMs) / 86_400_000))
      } catch {
        days = undefined
      }
      found.push({
        name: row.name,
        path: displayPath(`${root}/${row.name}`),
        bytes: row.kb * 1024,
        days,
      })
    }
  }
  found.sort((a, b) => b.bytes - a.bytes)
  return found.slice(0, 8)
}

/** What a folder inside a repo or project is, by name. Build output can go to the sea; dependencies go to the Locker. */
export type FolderKind = 'build' | 'deps' | 'other' | 'file'

const BUILD = new Set(['dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', '.turbo', '.parcel-cache', '.cache', 'target', 'coverage', '.vite', 'DerivedData', '__pycache__', '.pytest_cache', '.gradle'])
const DEPS = new Set(['node_modules', '.venv', 'venv', 'Pods', 'vendor', '.pnpm-store'])

/** Build output only counts inside a project: a folder named "build" in Documents is somebody's work. */
export function folderKind(name: string, inProject = true): FolderKind {
  if (BUILD.has(name) && inProject) return 'build'
  if (DEPS.has(name)) return 'deps'
  return 'other'
}

const PROJECT_MARKERS = ['package.json', 'Cargo.toml', 'pyproject.toml', 'go.mod', 'Gemfile', 'pom.xml', 'build.gradle', 'Package.swift', 'composer.json', 'Makefile']

export interface ScannedFolder extends ScannedCache {
  kind: FolderKind
  days?: number
}

/**
 * Measure one folder the player asked about ("look in ~/projects/app"). Read only: du over its first level.
 * Only folders inside the home directory, and never the home directory itself.
 */
export async function scanFolder(raw: string): Promise<{ path: string; items: ScannedFolder[] }> {
  const home = homedir()
  const expanded = raw.startsWith('~') ? home + raw.slice(1) : raw
  const real = await realpath(expanded)
  if (real === home || !real.startsWith(home + '/')) throw new Error('outside home')
  if (!(await stat(real)).isDirectory()) throw new Error('not a folder')
  const entries = await readdir(real, { withFileTypes: true })
  const inProject = entries.some((entry) => entry.isFile() && PROJECT_MARKERS.includes(entry.name)) || entries.some((entry) => entry.name.endsWith('.xcodeproj'))
  const daysOf = async (path: string) => {
    try {
      return Math.max(0, Math.round((Date.now() - (await stat(path)).mtimeMs) / 86_400_000))
    } catch {
      return undefined
    }
  }
  const items: ScannedFolder[] = []
  for (const row of parseDu(await du(real), real, true)) {
    if (row.kb < 1_000) continue
    items.push({ name: row.name, path: displayPath(`${real}/${row.name}`), bytes: row.kb * 1024, kind: folderKind(row.name, inProject), days: await daysOf(`${real}/${row.name}`) })
  }
  // du -d 1 lists folders only; big loose files (an installer, a recording) matter too.
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith('.')) continue
    try {
      const info = await stat(`${real}/${entry.name}`)
      if (info.size < 50_000_000) continue
      items.push({ name: entry.name, path: displayPath(`${real}/${entry.name}`), bytes: info.size, kind: 'file', days: Math.max(0, Math.round((Date.now() - info.mtimeMs) / 86_400_000)) })
    } catch {
      continue
    }
  }
  items.sort((a, b) => b.bytes - a.bytes)
  return { path: displayPath(real), items: items.slice(0, 8) }
}

export interface ScannedThing {
  name: string
  path: string
  bytes: number
  /** Days since macOS last saw it opened (apps) or since it was saved (files). Null when unknown. */
  days: number | null
  form: 'crate' | 'trunk' | 'disk'
}

function run(cmd: string, args: string[], timeout = 20000): Promise<string> {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout, maxBuffer: 8 * 1024 * 1024 }, (_error, stdout) => resolve(stdout ?? ''))
  })
}

function daysSince(date: Date | null): number | null {
  if (!date || Number.isNaN(date.getTime())) return null
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 86_400_000))
}

/** The biggest apps in /Applications, with the last-opened date Spotlight keeps. Read only. */
export async function scanApps(): Promise<ScannedThing[]> {
  const root = '/Applications'
  const rows = parseDu(await run('du', ['-k', '-d', '1', root], 40000), root)
    .filter((row) => row.name.endsWith('.app') && row.kb >= 200_000)
    .sort((a, b) => b.kb - a.kb)
    .slice(0, 6)
  const out: ScannedThing[] = []
  for (const row of rows) {
    const path = `${root}/${row.name}`
    const used = (await run('mdls', ['-raw', '-name', 'kMDItemLastUsedDate', path], 5000)).trim()
    out.push({ name: row.name.replace(/\.app$/, ''), path, bytes: row.kb * 1024, days: used && used !== '(null)' ? daysSince(new Date(used)) : null, form: 'crate' })
  }
  return out
}
