import { KirikiriEngine, Loglevel, Xp3StorageProvider } from '../src/index'

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const status = document.createElement('pre')
status.style.position = 'fixed'
status.style.left = '12px'
status.style.bottom = '12px'
status.style.zIndex = '9999'
status.style.margin = '0'
status.style.padding = '10px 12px'
status.style.maxWidth = 'min(80vw, 720px)'
status.style.whiteSpace = 'pre-wrap'
status.style.font = '12px/1.4 monospace'
status.style.color = '#f3f3f3'
status.style.background = 'rgba(0, 0, 0, 0.72)'
status.style.border = '1px solid rgba(255, 255, 255, 0.16)'
status.textContent = 'Booting XP3-backed dev build...'
document.body.append(status)

const launchOverlay = document.createElement('button')
launchOverlay.type = 'button'
launchOverlay.textContent = 'Click to start game'
launchOverlay.style.position = 'fixed'
launchOverlay.style.inset = '0'
launchOverlay.style.zIndex = '10000'
launchOverlay.style.display = 'none'
launchOverlay.style.border = '0'
launchOverlay.style.width = '100vw'
launchOverlay.style.height = '100vh'
launchOverlay.style.padding = '24px'
launchOverlay.style.cursor = 'pointer'
launchOverlay.style.font = '600 24px/1.2 sans-serif'
launchOverlay.style.color = '#f7f7f7'
launchOverlay.style.background = 'rgba(0, 0, 0, 0.82)'
launchOverlay.style.backdropFilter = 'blur(4px)'
document.body.append(launchOverlay)

function setStatus(text: string) {
  status.textContent = text
}

async function waitForLaunchClick() {
  launchOverlay.style.display = 'block'
  setStatus('Click anywhere to start the game.')

  await new Promise<void>((resolve) => {
    launchOverlay.addEventListener('click', () => resolve(), { once: true })
  })

  launchOverlay.style.display = 'none'
}

const previewExamples = [
  'prologue1',
  'bg090',
  'bg066',
  'eyecatch',
  'd_04',
]

const storage = new Xp3StorageProvider({
  root: 'http://localhost:1337',
  archives: [
    'scenario.xp3',
    'system.xp3',
    'image.xp3',
    'bgimage.xp3',
    'fgimage.xp3',
    'sound.xp3',
    'bgm.xp3',
    'video.xp3',
  ],
})

globalThis.addEventListener('error', (event) => {
  setStatus(`Unhandled error\n${event.message}`)
})

globalThis.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason instanceof Error ? event.reason.stack ?? event.reason.message : String(event.reason)
  setStatus(`Unhandled promise rejection\n${reason}`)
})

const preview = new URLSearchParams(location.search).get('preview')

if (preview) {
  const image = document.createElement('img')
  image.alt = preview
  image.style.display = 'block'
  image.style.maxWidth = '100vw'
  image.style.maxHeight = '100vh'
  image.style.objectFit = 'contain'
  image.style.margin = '24px auto'
  image.style.border = '1px solid rgba(255, 255, 255, 0.35)'
  image.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.35)'
  document.body.style.margin = '0'
  document.body.style.background = 'linear-gradient(135deg, #d7d7d7 25%, #f2f2f2 25%, #f2f2f2 50%, #d7d7d7 50%, #d7d7d7 75%, #f2f2f2 75%, #f2f2f2 100%)'
  document.body.style.backgroundSize = '32px 32px'
  document.body.append(image)

  try {
    setStatus(`Decoding preview asset "${preview}" from XP3...\nExamples: ${previewExamples.join(', ')}`)
    image.src = await storage.resolveAssetUrl(preview)
    await new Promise<void>((resolve, reject) => {
      image.addEventListener('load', () => resolve(), { once: true })
      image.addEventListener('error', () => reject(new Error(`Image element failed to load "${preview}"`)), { once: true })
    })
    setStatus(`Decoded preview asset "${preview}" (${image.naturalWidth}x${image.naturalHeight}).\nExamples: ${previewExamples.join(', ')}`)
  }
  catch (error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error)
    setStatus(`Preview failed\n${message}\n\nTry one of: ${previewExamples.join(', ')}`)
    throw error
  }
}
else {
  const engine = new KirikiriEngine({
    canvas,
    game: {
      entry: 'first.ks',
      root: 'http://localhost:1337',
      storage,
    },
    options: {
      loglevel: Loglevel.Debug,
    },
  })

  try {
    setStatus('Initializing renderer...')
    await engine.init()

    await waitForLaunchClick()

    setStatus('Starting script from XP3 archives...')
    await engine.start()

    setStatus('Engine started. If the screen is blank, check browser console for unsupported commands or media.')
  }
  catch (error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error)
    setStatus(`Startup failed\n${message}`)
    throw error
  }
}
