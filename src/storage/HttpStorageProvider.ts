import type { FileTree } from '../types/FileTree'
import type { StorageProvider } from '../types/StorageProvider'
import { findFileInTree } from '../utils/findFileInTree'

export class HttpStorageProvider implements StorageProvider {
  constructor(
    private readonly root: string,
    private readonly fileTree: FileTree,
  ) {}

  async readTextFile(filename: string, encoding = 'shift-jis'): Promise<string> {
    const bytes = await this.readBinaryFile(filename)
    return new TextDecoder(encoding).decode(bytes)
  }

  async readBinaryFile(filename: string): Promise<Uint8Array> {
    const foundFile = findFileInTree(filename, this.fileTree)

    if (!foundFile) {
      throw new Error(`File ${filename} not found`)
    }

    const url = new URL(foundFile, this.root.endsWith('/') ? this.root : `${this.root}/`)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`)
    }

    return new Uint8Array(await response.arrayBuffer())
  }

  async resolveAssetUrl(filename: string): Promise<string> {
    const foundFile = findFileInTree(filename, this.fileTree)

    if (!foundFile) {
      throw new Error(`File ${filename} not found`)
    }

    return `${this.root}/${foundFile}`
  }
}
