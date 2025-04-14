import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { createMacro } from './macroCommand'

describe('macroCommand', () => {
  it('can create a macro from lines', () => {
    const lines = [
      '[ct]',
      '[position layer=message0 page=back frame="" opacity=0]',
      '[image storage=%storage page=back layer=base]',
      '[trans time=%time method=crossfade]',
      '[wt]',
    ]

    const macro = createMacro({
      macros: {},
    } as KirikiriEngine, {
      name: 'changeType_cross',
      lines,
    })

    expect(macro.name).toBe('changeType_cross')
    expect(() => macro.macro({
      storage: 'test',
      time: '1000',
    })).not.toThrowError()
  })
})
