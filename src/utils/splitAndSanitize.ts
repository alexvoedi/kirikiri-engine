import { isComment } from './isComment'
import { sanitizeLine } from './sanitizeLine'
import { splitMultiCommandLine } from './splitMultiCommandLine'

export function splitAndSanitize(content: string): string[] {
  return content
    .split('\n')
    .flatMap(line => splitMultiCommandLine(sanitizeLine(line)))
    .filter(line => !isComment(line) && line.length > 0)
}
