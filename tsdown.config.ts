import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm', 'cjs'],
  dts: false, // disabled until ts7 is supported
  deps: {
    neverBundle: [/^[^./]/],
    dts: {
      neverBundle: [/^[^./]/],
    },
  },
  sourcemap: true,
})
