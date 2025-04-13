import type { FileTree } from './FileTree'

export interface Game {
  /**
   * The root directory of the game.
   */
  root: string

  /**
   * The name of the initial file to load.
   */
  entry: string

  /**
   * The file tree.
   */
  files: FileTree
}
