import { KirikiriEngine, Loglevel } from '../src/index'

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const engine = new KirikiriEngine({
  canvas,
  game: {
    entry: 'transparent-crossfade.ks',
    root: 'http://localhost:1337',
    files: {
      'jump.ks': null,
      'image.ks': null,
      'link.ks': null,
      'indent.ks': null,
      'transparent-crossfade.ks': null,
      'img': {
        'bosse.png': null,
        'transparent.png': null,
      },
    },
  },
  options: {
    loglevel: Loglevel.Debug,
  },
})

engine.run()
