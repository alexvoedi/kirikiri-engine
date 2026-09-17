import { describe, expect, it, vi } from 'vitest'
import { AsdSpriteAnimation } from '../classes/AsdSpriteAnimation'
import { setupEngine } from '../testSetup'
import { waitForTextClickWithPageBreakCommand } from './waitForTextClickWithPageBreakCommand'

describe('waitForTextClickWithPageBreakCommand', () => {
  it('shows the glyph while waiting for the next game click', async () => {
    const engine = await setupEngine()
    const getAssetUrl = vi.spyOn(engine, 'getAssetUrl').mockResolvedValue('blob:pageBreak_a')
    const readTextFile = vi.spyOn(engine.storage, 'readTextFile').mockResolvedValue('*start\n@copy sx=0 sy=0 sw=24 sh=24 dx=0 dy=2\n@wait time=50\n@jump target=*start')
    const showGlyph = vi.spyOn(AsdSpriteAnimation.prototype, 'show').mockResolvedValue(undefined)
    const hideGlyph = vi.spyOn(AsdSpriteAnimation.prototype, 'hide')
    const waitForGameClick = vi.spyOn(engine, 'waitForGameClick').mockResolvedValue(undefined)

    await waitForTextClickWithPageBreakCommand(engine, {})

    expect(getAssetUrl).toHaveBeenCalledWith('pageBreak_a.png')
    expect(readTextFile).toHaveBeenCalledWith('pageBreak.asd')
    expect(showGlyph).toHaveBeenCalledOnce()
    expect(showGlyph).toHaveBeenCalledWith(expect.objectContaining({
      animation: expect.any(Object),
      file: 'blob:pageBreak_a',
      floatAmplitude: engine.renderer.SCALE * 2,
      label: 'page-break-glyph',
      scale: engine.renderer.SCALE,
      zIndex: 99999,
    }))
    expect(waitForGameClick).toHaveBeenCalledOnce()
    expect(hideGlyph).toHaveBeenCalledOnce()
    expect(showGlyph.mock.invocationCallOrder[0]).toBeLessThan(waitForGameClick.mock.invocationCallOrder[0])
    expect(waitForGameClick.mock.invocationCallOrder[0]).toBeLessThan(hideGlyph.mock.invocationCallOrder[0])
  })
})
