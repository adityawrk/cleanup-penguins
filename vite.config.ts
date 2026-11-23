import os from 'node:os'
import { defineConfig, type Plugin } from 'vitest/config'
import { readDisk, scanCaches } from './src/engine/scan'
import { askClaude, detectAgents, type ScoutAsk } from './src/engine/scout'

function harborApi(): Plugin {
  return {
    name: 'harbor-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
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
            askClaude(ask)
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
