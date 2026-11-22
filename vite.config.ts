import os from 'node:os'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __USERNAME__: JSON.stringify(os.userInfo().username || 'you'),
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
