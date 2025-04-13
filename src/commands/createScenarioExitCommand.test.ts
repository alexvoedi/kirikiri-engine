import { describe, expect, it, vi } from 'vitest'
import { KirikiriEngine } from '../KirikiriEngine'
import { createScenarioExitCommand } from './createScenarioExitCommand'

describe('createScenarioExitCommand', () => {
  const engine = new KirikiriEngine({
    container: document.createElement('div'),
    game: {
      root: '',
      entry: '',
      files: {},
    },
  })

  it('should run the command without errors', () => {
    const command = createScenarioExitCommand(engine)

    expect(() => command()).not.toThrow()
  })
})
