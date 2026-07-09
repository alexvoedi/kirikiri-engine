# kirikiri-engine

`kirikiri-engine` is a TypeScript reimplementation of the Kirikiri / KAG runtime for the browser.

The project is aimed at running existing scenario scripts and assets with behavior that feels like Kirikiri, not at building a brand-new VN framework with a Kirikiri-inspired API. Most of the code follows that constraint: commands are implemented one by one, script parsing is intentionally conservative, and renderer behavior tends to favor compatibility over cleanup.

## Current state

What is already here:

- a browser runtime built around `KirikiriEngine`
- Pixi-based rendering for layers, text, transitions, quake effects, and links
- script execution with support for plain text, inline commands, block commands, macros, and `iscript`
- save/load support
- HTTP-backed file loading
- XP3-backed storage support, including TLG5 decoding
- a small Vite playground under `dev/` for manual testing
- a test suite that covers parser utilities, renderer behavior, engine flow, and XP3 handling

If you need a complete drop-in Kirikiri runtime, this repo is not there yet. If you need a serious base for browser-side Kirikiri compatibility work, it is already useful.

## Installation

```bash
pnpm install
```

## Development

The repo has two common workflows.

Build and test the library itself:

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

Run the browser playground:

```bash
pnpm serve
```

That starts Vite against `dev/` on port `1337`.

The playground expects local assets and archive data to be available under the paths used by `dev/main.ts`. Those files are not treated as part of the distributable library, so you may need to provide your own local test data before the playground is useful.

There is also a combined check target:

```bash
pnpm check
```

## Basic usage

At the public API level, the package is intentionally small.

```ts
import { KirikiriEngine, Loglevel } from 'kirikiri-engine'

const canvas = document.querySelector('canvas') as HTMLCanvasElement

const engine = new KirikiriEngine({
  canvas,
  game: {
    root: '/game',
    entry: 'first.ks',
    files: {
      data: {
        scenario: {
          'first.ks': null,
        },
      },
    },
  },
  options: {
    loglevel: Loglevel.Debug,
  },
})

await engine.init()
await engine.start()
```

The `game` object takes:

- `root`: base path for game assets
- `entry`: initial scenario file
- `files`: file tree used by the default HTTP storage provider
- `storage`: optional custom storage backend if you do not want to use the default one

If `storage` is provided, it takes precedence over `files`.

## Storage backends

Two storage backends are exported:

- `HttpStorageProvider`: for loose files exposed through a file tree
- `Xp3StorageProvider`: for archived game data in `.xp3` containers

The default storage selection only works when a `files` tree is available. If your game data comes from somewhere else, pass a custom `storage` instance explicitly.

## License

MIT
