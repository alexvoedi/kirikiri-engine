import { KirikiriEngine, Loglevel } from '../src/index'

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const engine = new KirikiriEngine({
  canvas,
  game: {
    entry: 'indent.ks',
    root: 'http://127.0.0.1:5173',
    files: {
      'jump.ks': null,
      'image.ks': null,
      'link.ks': null,
      'indent.ks': null,
      'img': {
        'bosse.png': null,
      },
    },
  },
  options: {
    loglevel: Loglevel.Debug,
  },
})

engine.run()
