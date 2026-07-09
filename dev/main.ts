import { KirikiriEngine, Loglevel, Xp3StorageProvider } from '../src/index'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const gameShell = document.getElementById('game-shell') as HTMLDivElement
const sidebar = document.getElementById('dev-sidebar') as HTMLDivElement
const GAME_WIDTH = 1600
const GAME_HEIGHT = 1200
const SIDEBAR_WIDTH = 360
const SHELL_GAP = 16
const SHELL_PADDING = 16

document.body.style.margin = '0'
document.body.style.background = '#161616'
document.body.style.color = '#f3f3f3'
document.body.style.fontFamily = '"Iosevka", "Fira Code", monospace'
document.body.style.overflow = 'hidden'

const appShell = document.getElementById('app-shell') as HTMLDivElement
appShell.style.display = 'grid'
appShell.style.gap = '16px'
appShell.style.alignItems = 'start'
appShell.style.justifyContent = 'center'
appShell.style.padding = '16px'
appShell.style.boxSizing = 'border-box'
appShell.style.minHeight = '100vh'

gameShell.style.position = 'relative'
gameShell.style.border = '1px solid rgba(255, 255, 255, 0.14)'
gameShell.style.background = '#000'
gameShell.style.boxShadow = '0 18px 48px rgba(0, 0, 0, 0.35)'
gameShell.style.overflow = 'hidden'
gameShell.style.transformOrigin = 'top left'

canvas.style.display = 'block'
canvas.style.width = `${GAME_WIDTH}px`
canvas.style.height = `${GAME_HEIGHT}px`

sidebar.style.display = 'grid'
sidebar.style.gap = '12px'
sidebar.style.alignContent = 'start'
sidebar.style.overflow = 'auto'
sidebar.style.maxHeight = `calc(100vh - ${2 * SHELL_PADDING}px)`

function layoutShell() {
  const availableWidth = window.innerWidth - 2 * SHELL_PADDING
  const availableHeight = window.innerHeight - 2 * SHELL_PADDING
  const canUseTwoColumns = availableWidth >= 960

  if (!canUseTwoColumns) {
    const width = Math.min(GAME_WIDTH, availableWidth)
    const height = Math.min(GAME_HEIGHT, width * (GAME_HEIGHT / GAME_WIDTH), availableHeight * 0.65)
    const scaledWidth = height * (GAME_WIDTH / GAME_HEIGHT)

    appShell.style.gridTemplateColumns = '1fr'
    appShell.style.justifyContent = 'center'

    gameShell.style.width = `${scaledWidth}px`
    gameShell.style.height = `${height}px`

    canvas.style.width = `${scaledWidth}px`
    canvas.style.height = `${height}px`

    sidebar.style.width = `${Math.min(availableWidth, SIDEBAR_WIDTH)}px`
    sidebar.style.maxWidth = '100%'
    sidebar.style.maxHeight = `${Math.max(180, availableHeight - height - SHELL_GAP)}px`
    return
  }

  const sidebarWidth = Math.min(SIDEBAR_WIDTH, Math.max(320, availableWidth * 0.24))
  const gameAvailableWidth = availableWidth - sidebarWidth - SHELL_GAP
  const widthFromHeight = availableHeight * (GAME_WIDTH / GAME_HEIGHT)
  const gameWidth = Math.min(GAME_WIDTH, gameAvailableWidth, widthFromHeight)
  const gameHeight = gameWidth * (GAME_HEIGHT / GAME_WIDTH)

  appShell.style.gridTemplateColumns = `${gameWidth}px ${sidebarWidth}px`
  appShell.style.justifyContent = 'center'

  gameShell.style.width = `${gameWidth}px`
  gameShell.style.height = `${gameHeight}px`

  canvas.style.width = `${gameWidth}px`
  canvas.style.height = `${gameHeight}px`

  sidebar.style.width = `${sidebarWidth}px`
  sidebar.style.maxWidth = `${sidebarWidth}px`
  sidebar.style.maxHeight = `${availableHeight}px`
}

layoutShell()
window.addEventListener('resize', layoutShell)

const status = document.createElement('pre')
status.style.margin = '0'
status.style.padding = '10px 12px'
status.style.whiteSpace = 'pre-wrap'
status.style.font = '12px/1.4 monospace'
status.style.color = '#f3f3f3'
status.style.background = 'rgba(0, 0, 0, 0.72)'
status.style.border = '1px solid rgba(255, 255, 255, 0.16)'
status.textContent = 'Booting XP3-backed dev build...'
sidebar.append(status)

const launchOverlay = document.createElement('button')
launchOverlay.type = 'button'
launchOverlay.textContent = 'Click to start game'
launchOverlay.style.position = 'absolute'
launchOverlay.style.inset = '0'
launchOverlay.style.zIndex = '10000'
launchOverlay.style.display = 'none'
launchOverlay.style.border = '0'
launchOverlay.style.width = '100%'
launchOverlay.style.height = '100%'
launchOverlay.style.padding = '24px'
launchOverlay.style.cursor = 'pointer'
launchOverlay.style.font = '600 24px/1.2 sans-serif'
launchOverlay.style.color = '#f7f7f7'
launchOverlay.style.background = 'rgba(0, 0, 0, 0.82)'
launchOverlay.style.backdropFilter = 'blur(4px)'
gameShell.append(launchOverlay)

function setStatus(text: string) {
  status.textContent = text
}

function createButton(label: string, onClick: () => void | Promise<void>, options?: {
  disabled?: boolean
}) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = label
  button.style.border = '1px solid rgba(255, 255, 255, 0.18)'
  button.style.background = 'rgba(255, 255, 255, 0.08)'
  button.style.color = '#f5f5f5'
  button.style.padding = '6px 8px'
  button.style.cursor = 'pointer'
  button.style.font = '12px/1.2 monospace'
  button.disabled = options?.disabled ?? false

  if (button.disabled) {
    button.style.opacity = '0.45'
    button.style.cursor = 'not-allowed'
  }

  button.addEventListener('click', () => {
    if (button.disabled) {
      return
    }

    void onClick()
  })
  return button
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

async function main() {
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

    const tools = document.createElement('div')
    tools.style.padding = '10px 12px'
    tools.style.border = '1px solid rgba(255, 255, 255, 0.16)'
    tools.style.background = 'rgba(0, 0, 0, 0.76)'
    tools.style.color = '#f3f3f3'
    tools.style.font = '12px/1.4 monospace'
    tools.style.display = 'grid'
    tools.style.gap = '8px'
    sidebar.prepend(tools)

    const toolsTitle = document.createElement('strong')
    toolsTitle.textContent = 'Dev Save Tools'
    tools.append(toolsTitle)

    const snapshotRow = document.createElement('div')
    snapshotRow.style.display = 'grid'
    snapshotRow.style.gridTemplateColumns = '1fr auto'
    snapshotRow.style.gap = '8px'
    tools.append(snapshotRow)

    const snapshotName = document.createElement('input')
    snapshotName.type = 'text'
    snapshotName.value = 'Manual snapshot'
    snapshotName.placeholder = 'Snapshot name'
    snapshotName.style.minWidth = '0'
    snapshotName.style.padding = '6px 8px'
    snapshotName.style.border = '1px solid rgba(255, 255, 255, 0.18)'
    snapshotName.style.background = 'rgba(255, 255, 255, 0.08)'
    snapshotName.style.color = '#f5f5f5'
    snapshotName.style.font = '12px/1.2 monospace'
    snapshotRow.append(snapshotName)

    const snapshotsList = document.createElement('div')
    snapshotsList.style.display = 'grid'
    snapshotsList.style.gap = '6px'
    tools.append(snapshotsList)

    const slotRow = document.createElement('div')
    slotRow.style.display = 'grid'
    slotRow.style.gridTemplateColumns = 'repeat(3, auto)'
    slotRow.style.gap = '8px'
    tools.append(slotRow)

    function renderSnapshotTools() {
      snapshotsList.replaceChildren()

      const saveSlots = engine.listSaveGames(3)
      const slot1 = saveSlots[0]
      slotRow.replaceChildren(
        createButton('Save Slot 1', () => {
          engine.saveGame(1)
          renderSnapshotTools()
          setStatus('Saved current state to slot 1.')
        }),
        createButton('Load Slot 1', async () => {
          await engine.loadSaveGame(1, { resume: true })
          renderSnapshotTools()
          setStatus('Loaded save slot 1.')
        }, {
          disabled: !slot1,
        }),
        createButton('Create Snapshot', () => {
          const entry = engine.createSnapshot(snapshotName.value)
          renderSnapshotTools()
          setStatus(`Created snapshot "${entry.title}".`)
        }),
      )

      const slotInfo = document.createElement('div')
      slotInfo.textContent = `Slot 1: ${slot1?.title ?? 'empty'}`
      snapshotsList.append(slotInfo)

      const snapshots = engine.listSnapshots()

      if (snapshots.length === 0) {
        const empty = document.createElement('div')
        empty.textContent = 'No snapshots yet.'
        snapshotsList.append(empty)
        return
      }

      snapshots.forEach((entry) => {
        const row = document.createElement('div')
        row.style.display = 'grid'
        row.style.gridTemplateColumns = '1fr auto auto'
        row.style.gap = '8px'
        row.style.alignItems = 'center'

        const label = document.createElement('div')
        label.textContent = `${entry.title} | ${entry.preview}`
        label.style.minWidth = '0'
        row.append(label)

        row.append(createButton('Load', async () => {
          await engine.loadSnapshot(entry.id, { resume: true })
          renderSnapshotTools()
          setStatus(`Loaded snapshot "${entry.title}".`)
        }))

        row.append(createButton('Delete', () => {
          engine.deleteSnapshot(entry.id)
          renderSnapshotTools()
          setStatus(`Deleted snapshot "${entry.title}".`)
        }))

        snapshotsList.append(row)
      })
    }

    snapshotRow.append(createButton('Create', () => {
      const entry = engine.createSnapshot(snapshotName.value)
      renderSnapshotTools()
      setStatus(`Created snapshot "${entry.title}".`)
    }))

    try {
      setStatus('Initializing renderer...')
      await engine.init()
      renderSnapshotTools()

      await waitForLaunchClick()

      setStatus('Starting script from XP3 archives...')
      await engine.start()

      renderSnapshotTools()
      setStatus('Engine started. Use the dev save tools in the top-left to create and load snapshots.')
    }
    catch (error) {
      const message = error instanceof Error ? error.stack ?? error.message : String(error)
      setStatus(`Startup failed\n${message}`)
      throw error
    }
  }
}

void main()
