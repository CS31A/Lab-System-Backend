import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      modules: true,
      scriptPath: './src/index.ts',
    },
  },
})
