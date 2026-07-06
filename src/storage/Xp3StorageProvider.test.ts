import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Xp3StorageProvider } from './Xp3StorageProvider'

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

describe('xp3StorageProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads scripts and materializes asset urls from mounted archives', async () => {
    const fetchMock = await createArchiveFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    const provider = new Xp3StorageProvider({
      root: 'https://example.com/game',
      archives: ['scenario.xp3', 'bgimage.xp3'],
    })

    const script = await provider.readTextFile('prologue.ks', 'shift-jis')
    const imageUrl = await provider.resolveAssetUrl('prologue1')

    expect(script).toContain('*gameStart')
    expect(script).toContain('storage="prologue1"')
    expect(imageUrl.startsWith('blob:')).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
