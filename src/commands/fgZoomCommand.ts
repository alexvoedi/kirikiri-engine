import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { merge } from 'es-toolkit'
import { z } from 'zod'
import { EngineEvent } from '../constants'
import { createIntegerSchema } from '../schemas'

const schema = z.object({
  storage: z.string(),
  layer: z.string(),
  time: createIntegerSchema().optional().default(0),
  sl: createIntegerSchema(),
  st: createIntegerSchema(),
  sw: createIntegerSchema(),
  sh: createIntegerSchema(),
  dl: createIntegerSchema().optional().default(0),
  dt: createIntegerSchema().optional().default(0),
  dw: createIntegerSchema(),
  dh: createIntegerSchema(),
}).strict()

/**
 * Implements the `fgzoom` command.
 *
 * The original plugin animates a cropped region into a destination rectangle.
 * This implementation renders the cropped region immediately and preserves
 * the command timing via `wfgzoom`.
 */
export async function fgZoomCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  const parsed = schema.parse(props)
  const file = await engine.getAssetUrl(parsed.storage)

  merge(engine.commandStorage, {
    fgzoom: {
      zooming: true,
    },
  })

  await engine.renderer.setZoomedImage({
    file,
    storage: parsed.storage,
    layer: parsed.layer,
    page: 'fore',
    sourceX: parsed.sl,
    sourceY: parsed.st,
    sourceWidth: parsed.sw,
    sourceHeight: parsed.sh,
    destX: parsed.dl,
    destY: parsed.dt,
    destWidth: parsed.dw,
    destHeight: parsed.dh,
  })

  setTimeout(() => {
    merge(engine.commandStorage, {
      fgzoom: {
        zooming: false,
      },
    })

    globalThis.dispatchEvent(new CustomEvent(EngineEvent.FGZOOM_ENDED))
  }, parsed.time)
}
