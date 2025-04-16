/**
 * Removes the file extension from a string if it has one.
 */
export function removeFileExtension(file: string) {
  const lastDotIndex = file.lastIndexOf('.')
  const lastSlashIndex = Math.max(file.lastIndexOf('/'), file.lastIndexOf('\\'))

  // Check if the text contains only dots
  if (/^\.+$/.test(file)) {
    return file
  }

  if (lastDotIndex > lastSlashIndex) {
    return file.slice(0, lastDotIndex)
  }

  return file
}
