import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'es-toolkit'
import { z } from 'zod'
import { createBooleanSchema, createIntegerSchema } from '../schemas'

const schema = z.object({
  visible: createBooleanSchema().optional(),
  left: createIntegerSchema().optional(),
  top: createIntegerSchema().optional(),
  width: createIntegerSchema().optional(),
  height: createIntegerSchema().optional(),
}).strict()

/**
 * Implements the `video` command.
 *
 * Sets the video properties.
 */
export async function videoCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)

  merge(engine.commandStorage, {
    video: parsed,
  })

  const element = engine.commandStorage.video?.element

  if (!element) {
    return
  }

  const rect = engine.canvas.getBoundingClientRect()
  const displayScaleX = rect.width > 0
    ? rect.width / engine.renderer.RESOLUTION.WIDTH
    : engine.renderer.SCALE
  const displayScaleY = rect.height > 0
    ? rect.height / engine.renderer.RESOLUTION.HEIGHT
    : engine.renderer.SCALE

  element.style.display = parsed.visible === false ? 'none' : 'block'

  if (parsed.left !== undefined) {
    element.style.left = `${rect.left + (parsed.left * displayScaleX)}px`
  }

  if (parsed.top !== undefined) {
    element.style.top = `${rect.top + (parsed.top * displayScaleY)}px`
  }

  if (parsed.width !== undefined) {
    element.style.width = `${parsed.width * displayScaleX}px`
  }

  if (parsed.height !== undefined) {
    element.style.height = `${parsed.height * displayScaleY}px`
  }
}
