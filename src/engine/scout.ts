import { execFile, spawn } from 'node:child_process'
import os from 'node:os'

/**
 * The live scout. Node only, served by the dev middleware in vite.config.ts.
 *
 * The scout is a signed-in agent CLI on this Mac, run one line at a time with NO tools at all
 * (`claude -p --tools ""`). It can only read the facts the harbor hands it and answer in words.
 * It cannot list folders, run a shell, move or delete anything. Only the player throws, in the harbor.
 */

export interface AgentScan {
  claude: boolean
  cursor: boolean
  codex: boolean
}

export interface ScoutFact {
  id: string
  name: string
  path: string
  gb: number
  kind: string
  sea: boolean
  note: string
}

export interface ScoutAsk {
  text: string
  model: string
  effort: string
  room: string
  carrying: string | null
  brief: string[]
  items: ScoutFact[]
}

export interface ScoutReply {
  say: string
  item: string | null
  hole: 'sea' | 'bin' | null
}

const CLAUDE_MODELS: Record<string, string> = {
  fable: 'claude-fable-5-2',
  opus: 'claude-opus-5-5',
  sonnet: 'claude-sonnet-5-5',
}

function onPath(bin: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('/bin/sh', ['-lc', `command -v ${bin}`], { timeout: 4000 }, (error, stdout) => resolve(!error && stdout.trim().length > 0))
  })
}

let cached: { at: number; scan: AgentScan } | null = null

export async function detectAgents(): Promise<AgentScan> {
  if (cached && Date.now() - cached.at < 60_000) return cached.scan
  const [claude, cursor, codex] = await Promise.all([onPath('claude'), onPath('cursor-agent'), onPath('codex')])
  cached = { at: Date.now(), scan: { claude, cursor, codex } }
  return cached.scan
}

const SYSTEM = `You are the scout in Cleanup Harbor, a Mac disk-cleanup game. The player is a penguin. You are a small bird who follows them and gives advice in a speech bubble.

What you can do: read the facts below and answer in one short line. That is all. You have no tools. You cannot look in folders, run commands, move, delete, or throw anything. Only the player throws things, by carrying them to the sea (permanent, only for caches and build output) or the Locker (kept, can be carried back).

Rules:
- Only state what the facts say. Never claim you scanned, opened, deleted, moved or freed anything.
- If the player asks you to throw or delete, tell them they have to throw it themselves.
- Things marked sea=false (apps, personal files, node_modules) must never be advised for the sea. Advise the Locker or keeping them.
- Respect the player's notes ("brief"). A note like "leave X alone" wins.
- Talk like a friendly harbor bird: plain words, no jargon, no emoji, at most 90 characters.

Reply with JSON only, no prose around it: {"say": "<line, max 90 chars>", "item": "<an id from the facts, or null>", "hole": "sea" | "bin" | null}.
"item" and "hole" are optional pointers when you recommend one specific thing. Use null when you don't.`

function facts(ask: ScoutAsk): string {
  const lines = ask.items.map((item) => `- id=${item.id} | ${item.name} | ${item.gb} GB | ${item.kind} | sea=${item.sea} | ${item.path} | ${item.note}`)
  return [
    `Room: ${ask.room}. Carrying: ${ask.carrying ?? 'nothing'}.`,
    ask.brief.length ? `Player's notes, oldest first:\n${ask.brief.map((line) => `- ${line}`).join('\n')}` : 'No notes yet.',
    `Things in reach:\n${lines.join('\n') || '- none'}`,
    `The player says: ${ask.text}`,
  ].join('\n\n')
}

/** Check a raw model reply against the facts it was given. Exported for tests. */
export function clean(raw: string, ask: ScoutAsk): ScoutReply {
  const match = raw.match(/\{[\s\S]*\}/)
  let parsed: Partial<ScoutReply> = {}
  try {
    parsed = match ? JSON.parse(match[0]) : {}
  } catch {
    parsed = {}
  }
  let say = typeof parsed.say === 'string' ? parsed.say.replace(/\s+/g, ' ').trim() : ''
  if (!say) say = raw.replace(/\s+/g, ' ').trim()
  // A scout never claims an action it cannot take.
  if (/\b(i|i've|i have|i just)\s+(deleted|removed|threw|tossed|cleared|freed|moved|cleaned)\b/i.test(say)) {
    say = "I can't throw things. You'll have to carry it."
  }
  say = say.slice(0, 90)
  const known = new Map(ask.items.map((item) => [item.id, item]))
  const item = typeof parsed.item === 'string' && known.has(parsed.item) ? parsed.item : null
  let hole: ScoutReply['hole'] = parsed.hole === 'sea' || parsed.hole === 'bin' ? parsed.hole : null
  if (item && hole === 'sea' && !known.get(item)!.sea) hole = 'bin'
  return { say, item, hole: item ? hole : null }
}

export function askClaude(ask: ScoutAsk): Promise<ScoutReply> {
  const model = CLAUDE_MODELS[ask.model] ?? CLAUDE_MODELS.opus
  const effort = ['low', 'medium', 'high', 'xhigh'].includes(ask.effort) ? ask.effort : 'high'
  const args = [
    '-p',
    '--tools', '',
    '--strict-mcp-config',
    '--no-session-persistence',
    '--output-format', 'json',
    '--model', model,
    '--effort', effort,
    '--system-prompt', SYSTEM,
  ]
  return new Promise((resolve, reject) => {
    const child = spawn('claude', args, { cwd: os.tmpdir(), stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error('The scout took too long.'))
    }, 90_000)
    child.stdout.on('data', (chunk) => (out += chunk))
    child.stderr.on('data', (chunk) => (err += chunk))
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      try {
        const envelope = JSON.parse(out) as { result?: string; is_error?: boolean }
        if (envelope.is_error || typeof envelope.result !== 'string') throw new Error(envelope.result || err || `claude exited ${code}`)
        resolve(clean(envelope.result, ask))
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
    child.stdin.end(facts(ask))
  })
}
