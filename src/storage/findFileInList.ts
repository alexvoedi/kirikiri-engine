import { removeFileExtension } from '../utils/removeFileExtension'

/**
 * Find a file path inside a flat list using Kirikiri-style case-insensitive matching.
 */
export function findFileInList(file: string, paths: string[]): string | undefined {
  const normalizedFile = file.toLowerCase()
  const fileWithoutExtension = removeFileExtension(file).toLowerCase()

  const exactMatch = paths.find((entry) => {
    const normalizedEntry = entry.replaceAll('\\', '/').toLowerCase()
    return normalizedEntry === normalizedFile || normalizedEntry.endsWith(`/${normalizedFile}`)
  })

  if (exactMatch) {
    return exactMatch
  }

  return paths.find((entry) => {
    const normalizedEntry = entry.replaceAll('\\', '/')
    const fileName = normalizedEntry.substring(normalizedEntry.lastIndexOf('/') + 1)
    return removeFileExtension(fileName).toLowerCase() === fileWithoutExtension
  })
}
