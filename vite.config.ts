import os from 'node:os'
import { defineConfig, type Plugin } from 'vitest/config'
import { readDisk, scanCaches } from './src/engine/scan'

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
