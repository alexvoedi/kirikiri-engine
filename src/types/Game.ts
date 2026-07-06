import type { FileTree } from './FileTree'
import type { StorageProvider } from './StorageProvider'

export interface Game {
  /**
   * The root directory of the game. This is where the game data foldeers are located.
   */
  root: string

  /**
   * The name of the initial file to load.
   */
  entry: string

  /**
   * The file tree.
   */
  files?: FileTree

  /**
   * Optional custom storage backend.
   */
  storage?: StorageProvider
}
