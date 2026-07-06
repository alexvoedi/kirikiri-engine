import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Xp3StorageProvider } from '../storage/Xp3StorageProvider'
import { KirikiriEngine } from './KirikiriEngine'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dirname, '../..')

async function createArchiveFetchMock() {
  const archiveCache = new Map<string, Uint8Array>()

  return vi.fn(async (input: string | URL) => {
    const url = String(input)
    const archiveName = url.substring(url.lastIndexOf('/') + 1)
    const archivePath = path.join(repoRoot, 'raw', archiveName)

    let bytes = archiveCache.get(archiveName)

    if (!bytes) {
      bytes = new Uint8Array(await fs.readFile(archivePath))
      archiveCache.set(archiveName, bytes)
    }

    const body = new Uint8Array(bytes.byteLength)
    body.set(bytes)
    return new Response(body.buffer)
  })
}

describe('kirikiriEngine XP3 integration', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads scenario files from mounted XP3 archives', async () => {
    vi.stubGlobal('fetch', await createArchiveFetchMock())

    const engine = new KirikiriEngine({
      canvas: document.createElement('canvas'),
      game: {
        root: 'https://example.com/game',
        entry: 'part_A.ks',
        storage: new Xp3StorageProvider({
          root: 'https://example.com/game',
          archives: ['scenario.xp3', 'bgimage.xp3'],
        }),
      },
    })

    vi.spyOn(engine.renderer, 'loadAssets').mockResolvedValue(undefined)
    vi.spyOn(engine.logger, 'error').mockImplementation(() => engine.logger)

    const loaded = await engine.loadFile('prologue.ks', 'gameStart')

    expect(loaded.file).toBe('prologue')
    expect(loaded.index).toBeGreaterThan(0)
    expect(loaded.lines.some(line => line.includes('*gameStart'))).toBe(true)
    expect(engine.renderer.loadAssets).toHaveBeenCalled()
  })
})
