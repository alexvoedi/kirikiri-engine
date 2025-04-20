import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    treeshake: true,
  },
  {
    entry: ['src/cli.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    treeshake: true,
  },
])
