import type { Game } from '../types/Game'
import type { StorageProvider } from '../types/StorageProvider'
import { HttpStorageProvider } from './HttpStorageProvider'

export function createStorageProvider(game: Game): StorageProvider {
  if (game.storage) {
    return game.storage
  }

  if (!game.files) {
    throw new Error('Game must provide either files or a storage provider')
  }

  return new HttpStorageProvider(game.root, game.files)
}
