import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    sourcemap: true,
    treeshake: true,
    clean: true,
    external: [
      'konva',
    ],
  },
  {
    entry: ['src/cli.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    sourcemap: true,
    treeshake: true,
    clean: true,
  },
])
