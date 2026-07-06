import process from 'node:process'
import { defineConfig, searchForWorkspaceRoot } from 'vite'

export default defineConfig({
  base: './',
  root: 'dev',
  publicDir: '../raw',
  server: {
    port: 1337,
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
      ],
    },
  },
})
