import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { EngineState } from '../enums/EngineState'
import { extractCommand } from '../utils/extractCommand'
import { fontCommand } from './fontCommand'
import { jumpCommand } from './jumpCommand'
import { storePositionCommand } from './storePositionCommand'

const schema = z.object({
  storage: z.string().optional(),
  target: z.string().optional(),
}).strict()

export type LinkCommandProps = z.infer<typeof schema>

async function applyInlineLinkCommand(engine: KirikiriEngine, command: string, props: Record<string, string>): Promise<void> {
  switch (command) {
    case 'locate':
      await storePositionCommand(engine, props)
      break
    case 'font':
      await fontCommand(engine, props)
      break
  }
}

async function prepareLinkText(engine: KirikiriEngine, lines: string[]): Promise<{
  text: string
  afterTextCommands: Array<() => Promise<void>>
}> {
  const content = lines.join('\n')
  const afterTextCommands: Array<() => Promise<void>> = []
  let text = ''
  let index = 0
  let hasText = false

  while (index < content.length) {
    const opening = content.indexOf('[', index)

    if (opening === -1) {
      const tail = content.slice(index)
      text += tail
      hasText ||= tail.length > 0
      break
    }

    const plainText = content.slice(index, opening)
    text += plainText
    hasText ||= plainText.length > 0

    const closing = content.indexOf(']', opening)
    if (closing === -1) {
      text += content.slice(opening)
      break
    }

    const tag = content.slice(opening, closing + 1)
    const { command, props } = extractCommand(tag)
    const callback = async () => await applyInlineLinkCommand(engine, command, props)

    if (hasText) {
      afterTextCommands.push(callback)
    }
    else {
      await callback()
    }

    index = closing + 1
  }

  return {
    text,
    afterTextCommands,
  }
}

/**
 * Implements the `link` command.
 *
 * A link is a text fragment that can be clicked to jump to a subroutine.
 */
export async function linkCommand(engine: KirikiriEngine, lines: string[], props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  if (lines.length > 1) {
    throw new Error('Link command must be on a single line')
  }

  const { text, afterTextCommands } = await prepareLinkText(engine, lines)

  if (engine.commandStorage.link?.choices) {
    engine.commandStorage.link.choices.push({
      text,
      data: parsed,
    })
  }

  engine.renderer.addLink(text, async () => {
    const { ...jumpData } = parsed
    globalThis.dispatchEvent(new CustomEvent(EngineEvent.CHOICE))
    await jumpCommand(engine, jumpData)
    engine.setState(EngineState.RUNNING)
    await engine.run()
  })

  for (const command of afterTextCommands) {
    await command()
  }

  globalThis.addEventListener(EngineEvent.CHOICE, () => {
    engine.commandStorage.link = {}
  }, { once: true })
}
