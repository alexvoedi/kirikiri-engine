import { describe, expect, it, vi } from 'vitest'
import { KirikiriEngine } from '../KirikiriEngine'
import { createTextWaitForClickCommand } from './createTextWaitForClickCommand'

describe('createTextWaitForClickCommand', () => {
  const engine = new KirikiriEngine({
    container: document.createElement('div'),
    game: {
      root: '',
      entry: '',
      files: {},
    },
  })

  it('should run the command without errors', () => {
    const command = createTextWaitForClickCommand(engine)

    expect(() => command()).not.toThrow()
  })
})
