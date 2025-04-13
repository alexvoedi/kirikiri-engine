#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Command } from 'commander'

const program = new Command()

program
  .name('ks-to-json')
  .description('Convert .ks files to .json format')
  .version('1.0.0')
  .requiredOption('-i, --input <directory>', 'Path to the input directory for .ks files')
  .requiredOption('-o, --output <file>', 'Path and name of the output file')

program.parse(process.argv)

/**
 * Generate a json file that contains the file tree of the input directory.
 */
export function generateFileTree(dir: string) {
  const result: any = {}

  fs.readdirSync(dir).forEach((file: string) => {
    if (file.endsWith('Zone.Identifier')) {
      return // Skip Zone.Identifier files
    }

    const fullPath = path.join(dir, file)
    if (fs.statSync(fullPath).isDirectory()) {
      result[file] = generateFileTree(fullPath)
    }
    else {
      result[file] = null
    }
  })

  return result
}

/**
 * Write the file tree to a json file
 */
export function writeFileTreeToJson(inputDir: string, outputFile: string) {
  const fileTree = generateFileTree(inputDir)
  const json = JSON.stringify(fileTree, null, 2)

  fs.writeFileSync(outputFile, json)
  console.log(`File tree written to ${outputFile}`)
  console.log(`File tree size: ${JSON.stringify(fileTree, null, 2).length} bytes`)
}

writeFileTreeToJson(program.opts().input, program.opts().output)
