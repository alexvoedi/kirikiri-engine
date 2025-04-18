import type { Game } from './types/Game'
import { KirikiriEngine } from './classes/KirikiriEngine'

export async function setupEngine(): Promise<KirikiriEngine> {
  const mockFiles = vi.fn(() => ({
    'first.ks': null,
    'second.ks': null,
    'mock.ks': null,
  }))

  const mockEntry = vi.fn(() => 'first.ks')

  const game: Game = {
    root: '/mock/root',
    entry: mockEntry(),
    files: mockFiles(),
  }

  const container = document.createElement('div')

  return new KirikiriEngine({ container, game })
}
