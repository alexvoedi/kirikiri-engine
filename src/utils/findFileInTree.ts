import type { FileTree } from 'src/types/FileTree'

/**
 * Find the file with the given name in the file tree.
 */
export function findFileInTree(
  file: string,
  tree: FileTree,
): string[] {
  // remove the stuff after the last dot if there is a dot
  const fileWithoutExtension = file.includes('.') ? file.substring(0, file.lastIndexOf('.')) : file

  const result: string[] = []

  function search(tree: FileTree | null, path: string) {
    if (tree === null) {
      return
    }

    for (const [key, value] of Object.entries(tree)) {
      const currentPath = path ? `${path}/${key}` : key

      const keyWithoutExtension = key.includes('.') ? key.substring(0, key.lastIndexOf('.')) : key

      if (
        keyWithoutExtension.toLowerCase() === fileWithoutExtension.toLowerCase()
      ) {
        result.push(currentPath)
      }

      if (typeof value === 'object') {
        search(value, currentPath)
      }
    }
  }

  search(tree, '')

  return result
}
