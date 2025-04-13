import type { FileTree } from 'src/types/FileTree'

/**
 * Find the file with the given name in the file tree.
 *
 *
 */
export function findFileInTree(
  file: string,
  tree: FileTree,
  options: {
    recursive?: boolean
    ignoreCase?: boolean
  },
): string[] {
  const { recursive = false, ignoreCase = false } = options

  const result: string[] = []

  function search(tree: FileTree | null, path: string) {
    if (tree === null) {
      return
    }

    for (const [key, value] of Object.entries(tree)) {
      const currentPath = path ? `${path}/${key}` : key

      if (
        (ignoreCase ? key.toLowerCase() : key)
        === (ignoreCase ? file.toLowerCase() : file)
      ) {
        result.push(currentPath)
      }

      if (recursive && typeof value === 'object') {
        search(value, currentPath)
      }
    }
  }

  search(tree, '')

  return result
}
