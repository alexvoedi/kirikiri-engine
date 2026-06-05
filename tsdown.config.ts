import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  deps: {
    neverBundle: [/^[^./]/],
    dts: {
      neverBundle: [/^[^./]/],
    },
  },
  sourcemap: true,
})
