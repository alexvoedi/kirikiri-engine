import type { LinkCommandProps } from '../commands/linkCommand'

export interface CommandStorage {
  playse?: {
    playing?: boolean
  }
  playbgm?: {
    audio?: HTMLAudioElement
    cleanup?: () => void
    playing?: boolean
  }
  trans?: {
    transitioning?: boolean
  }
  move?: {
    moving?: boolean
  }
  video?: {
    visible?: boolean
    left?: number
    top?: number
    width?: number
    height?: number
  }
  resetWait?: {
    timestamp?: number
  }
  rclick?: {
    call?: boolean
    jump?: boolean
    target?: string
    storage?: string
    enabled?: boolean
  }
  history?: {
    output?: boolean
    enabled?: boolean
  }
  startanchor?: {
    enabled: boolean
    file?: string
    index?: number
  }
  style?: {
    align?: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'default'
  }
  delay?: {
    speed?: 'nowait' | 'user' | number
  }
  clickskip?: {
    enabled?: boolean
  }
  link?: {
    choices?: Array<{
      text: string
      data: LinkCommandProps
    }>
  }
  indent?: {
    enabled?: boolean
  }
}
