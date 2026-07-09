import { describe, expect, it, vi } from 'vitest'
import { setupEngine } from '../testSetup'
import { fgZoomCommand } from './fgZoomCommand'
import { waitForFgZoomCommand } from './waitForFgZoomCommand'

describe('fgZoomCommand', () => {
  it('renders a cropped image and resolves wfgzoom after the configured time', async () => {
    vi.useFakeTimers()

    try {
      const engine = await setupEngine()

      vi.spyOn(engine, 'getAssetUrl').mockResolvedValue('blob:zoomed')
      const setZoomedImage = vi.spyOn(engine.renderer, 'setZoomedImage').mockResolvedValue(undefined)

      await fgZoomCommand(engine, {
        storage: 'sample',
        layer: '1',
        time: '200',
        sl: '100',
        st: '50',
        sw: '120',
        sh: '90',
        dl: '0',
        dt: '0',
        dw: '800',
        dh: '600',
      })

      expect(setZoomedImage).toHaveBeenCalledWith({
        file: 'blob:zoomed',
        storage: 'sample',
        layer: '1',
        page: 'fore',
        sourceX: 100,
        sourceY: 50,
        sourceWidth: 120,
        sourceHeight: 90,
        destX: 0,
        destY: 0,
        destWidth: 800,
        destHeight: 600,
      })
      expect(engine.commandStorage.fgzoom?.zooming).toBe(true)

      const waitPromise = waitForFgZoomCommand(engine, {})
      await vi.advanceTimersByTimeAsync(200)

      await expect(waitPromise).resolves.toBeUndefined()
      expect(engine.commandStorage.fgzoom?.zooming).toBe(false)
    }
    finally {
      vi.useRealTimers()
    }
  })
})
