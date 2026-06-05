#!/usr/bin/env node

/* eslint-disable no-console */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    help: {
      short: 'h',
      type: 'boolean',
    },
    input: {
      short: 'i',
      type: 'string',
    },
    output: {
      short: 'o',
      type: 'string',
    },
    version: {
      short: 'v',
      type: 'boolean',
    },
  },
})

function printHelp() {
  console.log(`Usage: ks-to-json --input <directory> --output <file>

Convert .ks files to .json format

Options:
  -i, --input <directory>  Path to the input directory for .ks files
  -o, --output <file>      Path and name of the output file
  -v, --version            Print version
  -h, --help               Print help`)
}

if (values.version) {
  console.log('1.0.0')
  process.exit(0)
}

if (values.help) {
  printHelp()
  process.exit(0)
}

if (!values.input || !values.output) {
  printHelp()
  process.exit(1)
}

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

writeFileTreeToJson(values.input, values.output)
