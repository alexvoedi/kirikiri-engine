/**
 * Find all placeholders.
 *
 * A placeholder has the form "key=%value"
 */
export function getPlacholders(text: string): Record<string, string> {
  const regex = /(\w+)=(%\w+)/g
  const matches = text.matchAll(regex)
  const result: Record<string, string> = {}

  for (const match of matches) {
    const key = match[1]
    const value = match[2]

    result[key] = value
  }

  return result
}
