export interface StorageProvider {
  readTextFile: (filename: string, encoding?: string) => Promise<string>
  readBinaryFile: (filename: string) => Promise<Uint8Array>
  resolveAssetUrl: (filename: string) => Promise<string>
}
