export interface ProcessedFile {
  jumpPoints: Array<{ name: string, index: number }>
  commands: Array<(props: Record<string, string>) => Promise<void>>
}
