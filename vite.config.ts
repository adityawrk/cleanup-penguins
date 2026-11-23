import os from 'node:os'
import { defineConfig, type Plugin } from 'vitest/config'
import { readDisk, scanCaches, scanFolder } from './src/engine/scan'
import { askClaude, detectAgents, type ScoutAsk } from './src/engine/scout'

let scoutBusy = false

function localHost(host: string | undefined): boolean {
  if (!host) return false
  const name = host.replace(/:\d+$/, '').toLowerCase()
  return name === 'localhost' || name === '127.0.0.1' || name === '[::1]' || name.endsWith('.localhost')
}

function harborApi(): Plugin {
  return {
    name: 'harbor-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // The harbor API answers only to this machine's own names. A page that rebinds its DNS to
        // 127.0.0.1 still sends its own Host header, so this stops it reading the disk or spending the scout.
        if (req.url?.startsWith('/api/') && !localHost(req.headers.host)) {
          res.statusCode = 403
          res.end('{}')
          return
        }
        if (req.url === '/api/disk') {
          readDisk()
            .then((disk) => {
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify(disk))
            })
            .catch(() => {
              res.statusCode = 500
              res.end('{}')
            })
          return
        }
        if (req.url?.startsWith('/api/look?')) {
          const path = new URL(req.url, 'http://local').searchParams.get('path') ?? ''
          scanFolder(path)
            .then((result) => {
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify(result))
            })
            .catch((error: Error) => {
              res.statusCode = 404
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ error: error.message }))
            })
          return
        }
        if (req.url === '/api/agents') {
          detectAgents()
            .then((scan) => {
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify(scan))
            })
            .catch(() => {
              res.statusCode = 500
              res.end('{}')
            })
          return
        }
        if (req.url === '/api/scout' && req.method === 'POST') {
          // Only this page may spend the player's agent: same origin, JSON, one call at a time.
          const origin = req.headers.origin
          const host = req.headers.host
          const sameOrigin = !origin || (host !== undefined && new URL(origin).host === host)
          if (!sameOrigin || !String(req.headers['content-type'] ?? '').startsWith('application/json') || req.headers['sec-fetch-site'] === 'cross-site') {
            res.statusCode = 403
            res.end('{}')
            return
          }
          if (scoutBusy) {
            res.statusCode = 429
            res.end('{"error":"busy"}')
            return
          }
          scoutBusy = true
          const abort = new AbortController()
          // If the page goes away mid-answer, stop the claude process too.
          res.on('close', () => {
            scoutBusy = false
            abort.abort()
          })
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
            if (body.length > 200_000) req.destroy()
          })
          req.on('end', () => {
            let ask: ScoutAsk
            try {
              ask = JSON.parse(body) as ScoutAsk
            } catch {
              res.statusCode = 400
              res.end('{}')
              return
            }
            askClaude(ask, abort.signal)
              .then((reply) => {
                res.setHeader('content-type', 'application/json')
                res.end(JSON.stringify(reply))
              })
              .catch((error: Error) => {
                res.statusCode = 502
                res.setHeader('content-type', 'application/json')
                res.end(JSON.stringify({ error: error.message.slice(0, 200) }))
              })
          })
          return
        }
        if (req.url === '/api/scan') {
          scanCaches()
            .then((items) => {
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ items }))
            })
            .catch(() => {
              res.statusCode = 500
              res.end('{"items":[]}')
            })
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [harborApi()],
  define: {
    __USERNAME__: JSON.stringify(os.userInfo().username || 'you'),
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
