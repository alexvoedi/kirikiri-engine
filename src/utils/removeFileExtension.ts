import { VALID_FILE_EXTENSIONS } from '../constants'

/**
 * Removes the file extension from a string if it has one.
 *
 * @param file - The file name or path to remove the extension from.
 * @returns The file name or path without the extension.
 */
export function removeFileExtension(file: string) {
  const lastDotIndex = file.lastIndexOf('.')
  const lastSlashIndex = Math.max(file.lastIndexOf('/'), file.lastIndexOf('\\'))

  // Check if the text contains only dots
  if (/^\.+$/.test(file)) {
    return file
  }

  // Ensure the part after the last dot is a valid file extension
  if (lastDotIndex > lastSlashIndex) {
    const extension = file.substring(lastDotIndex + 1).toLowerCase()
    if (VALID_FILE_EXTENSIONS.includes(extension)) {
      return file.substring(0, lastDotIndex)
    }
  }

  return file
}
