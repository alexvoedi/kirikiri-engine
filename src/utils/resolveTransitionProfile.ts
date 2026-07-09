export interface TransitionOptions {
  method?: string
  rule?: string
}

export type TransitionProfile
  = | { kind: 'crossfade' }
    | { kind: 'wipe', direction: 'left' | 'right' | 'up' | 'down' | 'diagonal' }
    | { kind: 'circle', mode: 'shrink' | 'expand' }
    | { kind: 'blinds' }
    | { kind: 'wave' }
    | { kind: 'mosaic' }
    | { kind: 'rotatezoom' }
    | { kind: 'rotatevanish' }
    | { kind: 'rotateswap' }

export function resolveTransitionProfile(options: TransitionOptions): TransitionProfile {
  if (options.rule) {
    switch (options.rule) {
      case 'trans01':
        return { kind: 'wipe', direction: 'left' }
      case 'trans02':
        return { kind: 'wipe', direction: 'right' }
      case 'trans03':
        return { kind: 'wipe', direction: 'up' }
      case 'trans04':
        return { kind: 'wipe', direction: 'down' }
      case 'trans05':
        return { kind: 'wipe', direction: 'diagonal' }
      case 'circle1':
        return { kind: 'circle', mode: 'shrink' }
      case 'circle2':
        return { kind: 'circle', mode: 'expand' }
      case 'blind_01':
        return { kind: 'blinds' }
      default:
        return { kind: 'crossfade' }
    }
  }

  switch (options.method) {
    case 'wave':
      return { kind: 'wave' }
    case 'mosaic':
      return { kind: 'mosaic' }
    case 'turn':
      return { kind: 'wipe', direction: 'diagonal' }
    case 'rotatezoom':
      return { kind: 'rotatezoom' }
    case 'rotatevanish':
      return { kind: 'rotatevanish' }
    case 'rotateswap':
      return { kind: 'rotateswap' }
    default:
      return { kind: 'crossfade' }
  }
}
