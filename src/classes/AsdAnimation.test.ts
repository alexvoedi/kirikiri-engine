import { describe, expect, it } from 'vitest'
import { AsdAnimation } from './AsdAnimation'

describe('asdAnimation', () => {
  it('parses macro-expanded copy and wait frames from a looped script', () => {
    const content = `@loadcell
@loop
;
@macro name=copyone
@copy dx=0 dy=2 sx=%x sy=0 sw=24 sh=24
@wait time=50
@endmacro
;
*start
@copyone x=0
@copyone x=24
@wait time=200
@jump target=*start
`

    const animation = new AsdAnimation(content)
    const frames = animation.getFrames()

    expect(frames).toStrictEqual([
      {
        dx: 0,
        dy: 2,
        sx: 0,
        sy: 0,
        sw: 24,
        sh: 24,
        duration: 50,
      },
      {
        dx: 0,
        dy: 2,
        sx: 24,
        sy: 0,
        sw: 24,
        sh: 24,
        duration: 200,
      },
    ])
  })
})
