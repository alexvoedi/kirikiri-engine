import type { FileTree } from 'src/types/FileTree'
import { removeFileExtension } from './removeFileExtension'

function search(file: string, tree: FileTree | null, path: string, results: string[]): void {
  if (tree === null) {
    return
  }

  for (const [key, value] of Object.entries(tree)) {
    const currentPath = path ? `${path}/${key}` : key

    const keyWithoutExtension = removeFileExtension(key)
    const fileWithoutExtension = removeFileExtension(file)

    if (keyWithoutExtension.toLowerCase() === fileWithoutExtension.toLowerCase()) {
      results.push(currentPath)
    }

    if (typeof value === 'object') {
      search(file, value, currentPath, results)
    }
  }
}

/**
 * Find the file with the given name in the file tree.
 * If a file extension is provided, it tries to find the file with the extension first.
 * If not found, it falls back to finding the file without the extension.
 */
export function findFileInTree(
  file: string,
  tree: FileTree,
): string | undefined {
  const foundFiles: string[] = []

  search(file, tree, '', foundFiles)

  // Prioritize exact matches with the provided file name (including extension)
  const withExtension = foundFiles.find(f => f.toLowerCase().endsWith(`/${file.toLowerCase()}`))
  if (withExtension) {
    return withExtension
  }

  // Fallback to matches without considering the extension
  const fileWithoutExtension = removeFileExtension(file)

  const withoutExtension = foundFiles.find((f) => {
    const fileName = f.substring(f.lastIndexOf('/') + 1)
    const fileNameWithoutExtension = removeFileExtension(fileName)
    return fileNameWithoutExtension.toLowerCase() === fileWithoutExtension.toLowerCase()
  })

  return withoutExtension
}
