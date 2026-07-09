import { describe, expect, it } from 'vitest'
import { resolveTransitionProfile } from './resolveTransitionProfile'

describe('resolveTransitionProfile', () => {
  it('maps rule-based transitions used by the game', () => {
    expect(resolveTransitionProfile({ rule: 'trans01' })).toEqual({ kind: 'wipe', direction: 'left' })
    expect(resolveTransitionProfile({ rule: 'circle1' })).toEqual({ kind: 'circle', mode: 'shrink' })
    expect(resolveTransitionProfile({ rule: 'blind_01' })).toEqual({ kind: 'blinds' })
  })

  it('maps method-based transitions used by the game', () => {
    expect(resolveTransitionProfile({ method: 'wave' })).toEqual({ kind: 'wave' })
    expect(resolveTransitionProfile({ method: 'mosaic' })).toEqual({ kind: 'mosaic' })
    expect(resolveTransitionProfile({ method: 'rotatezoom' })).toEqual({ kind: 'rotatezoom' })
  })
})
