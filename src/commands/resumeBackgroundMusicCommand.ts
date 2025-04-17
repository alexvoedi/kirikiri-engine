import type { KirikiriEngine } from '../classes/KirikiriEngine'
import { z } from 'zod'
import { EngineEvent } from '../constants'

const schema = z.object({}).strict()

/**
 * Implements the `resubebgm` command.
 *
 * Resumes the currently paused background music.
 */
export async function resumeBackgroundMusicCommand(_: KirikiriEngine, props?: Record<string, string>): Promise<void> {
  schema.parse(props)

  window.dispatchEvent(new CustomEvent(EngineEvent.RESUME_BGM))
}
