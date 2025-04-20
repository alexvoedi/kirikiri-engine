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

  // Ensure the part after the last dot is a valid file extension starting with a letter
  if (lastDotIndex > lastSlashIndex) {
    const extension = file.slice(lastDotIndex + 1)
    if (/^[a-z][a-z0-9]*$/i.test(extension)) {
      return file.slice(0, lastDotIndex)
    }
  }

  return file
}
