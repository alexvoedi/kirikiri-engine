import type { FileTree } from '../types/FileTree'
import { findFileInTree } from './findFileInTree'

/**
 * Load the content of a file from a given root URL.
 */
export async function loadFileContent(filename: string, root: string, fileTree: FileTree) {
  const foundFile = findFileInTree(filename, fileTree)

  if (!foundFile) {
    throw new Error(`File ${filename} not found`)
  }

  const url = new URL(foundFile, root.endsWith('/') ? root : `${root}/`)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to load file: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()

  const content = new TextDecoder('shift-jis').decode(arrayBuffer)

  return content
}
