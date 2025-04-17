export interface CommandStorage {
  playse?: {
    playing?: boolean
  }
  playbgm?: {
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
  delay?: {
    speed?: 'nowait' | 'user' | number
  }
  clickskip?: {
    enabled?: boolean
  }
}
