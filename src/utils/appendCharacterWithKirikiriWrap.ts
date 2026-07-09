const KINSOKU_FOLLOWING = `%),:;]}!?.、。，．・：；？！ヽヾゝゞ々ーァィゥェォッャュョヮぁぃぅぇぉっゃゅょゎ）〕］｝〉》」』】〙〗〟'"\u2019\u201D｠»`
const KINSOKU_FOLLOWING_WEAK = `!?.。．…・：；？！`
const KINSOKU_LEADING = `\\$([{（〔［｛〈《「『【〘〖〝'"\u2018\u201C`

export function appendCharacterWithKirikiriWrap({
  text,
  character,
  firstLineWidth,
  wrappedLineWidth,
  reserveWidth,
  measureText,
}: {
  text: string
  character: string
  firstLineWidth: number
  wrappedLineWidth: number
  reserveWidth: number
  measureText: (text: string) => number
}) {
  if (character === '\n') {
    return `${text}\n`
  }

  const lines = text.split('\n')
  const currentLine = lines.at(-1) ?? ''
  const currentLineIndex = Math.max(lines.length - 1, 0)
  const availableWidth = currentLineIndex === 0 ? firstLineWidth : wrappedLineWidth
  const currentWidth = measureText(currentLine)
  const relinexpos = Math.max(0, availableWidth - reserveWidth)
  const lastDrawnCh = currentLine.at(-1) ?? ''

  if (currentWidth >= relinexpos) {
    const canBreakBeforeCharacter = (
      ((lastDrawnCh === '' || !KINSOKU_LEADING.includes(lastDrawnCh)) && !KINSOKU_FOLLOWING.includes(character))
      || (lastDrawnCh !== '' && KINSOKU_FOLLOWING_WEAK.includes(lastDrawnCh) && KINSOKU_FOLLOWING_WEAK.includes(character))
    )

    if (canBreakBeforeCharacter || currentWidth > availableWidth) {
      return `${text}\n${character}`
    }
  }

  return `${text}${character}`
}
