import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { AsdAnimation } from '../classes/AsdAnimation'
import { AsdSpriteAnimation } from '../classes/AsdSpriteAnimation'

const schema = z.object({}).strict()

/**
 * Implements the `p` command.
 *
 * Waits for a click after showing text and inserts a page break.
 *
 * A page break is indicated by a special symbol that is visible in the message layer like an arrow.
 */
export async function waitForTextClickWithPageBreakCommand(engine: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  const pageBreakFile = await engine.getAssetUrl('pageBreak_a.png')
  const pageBreakAnimation = new AsdAnimation(await engine.storage.readTextFile('pageBreak.asd'))
  const glyph = new AsdSpriteAnimation(
    engine.renderer.getClickGlyphOverlay(),
    engine.renderer.app.ticker,
  )

  await glyph.show({
    file: pageBreakFile,
    animation: pageBreakAnimation,
    floatAmplitude: engine.renderer.SCALE * 2,
    label: 'page-break-glyph',
    placeFrame: (frame, sprite) => {
      const page = engine.renderer.getCurrentMessagePageContainer()
      const pageMetrics = engine.renderer.getCurrentMessagePageMetrics()
      const pageWidth = pageMetrics.width !== undefined
        ? engine.renderer.SCALE * pageMetrics.width
        : engine.renderer.renderedWidth - engine.renderer.SCALE * (2 * engine.renderer.globalOffset.x)
      const pageHeight = pageMetrics.height !== undefined
        ? engine.renderer.SCALE * pageMetrics.height
        : engine.renderer.renderedHeight - engine.renderer.SCALE * (2 * engine.renderer.globalOffset.y)

      sprite.x = page.x + Math.max(
        engine.renderer.SCALE * engine.renderer.messageLayerMargins.left,
        pageWidth - engine.renderer.SCALE * engine.renderer.messageLayerMargins.right - sprite.width - engine.renderer.SCALE * 4,
      ) + (engine.renderer.SCALE * frame.dx)
      sprite.y = page.y + Math.max(
        engine.renderer.SCALE * engine.renderer.messageLayerMargins.top,
        pageHeight - engine.renderer.SCALE * engine.renderer.messageLayerMargins.bottom - sprite.height - engine.renderer.SCALE * 2,
      ) + (engine.renderer.SCALE * frame.dy)
    },
    scale: engine.renderer.SCALE,
    zIndex: 99999,
  })

  try {
    await engine.waitForGameClick()
  }
  finally {
    glyph.hide()
  }
}
