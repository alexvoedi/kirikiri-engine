import 'ses'

/**
 * Run JavaScript code in a sandboxed environment.
 */

export class IScriptParser {
  constructor(
    private readonly context: Record<string, unknown>,
  ) { }

  parse(script: string) {
    let parsed = this.convertVoidToUndefined(script)

    parsed = this.escapeBackslashes(parsed)

    return parsed
  }

  run(script: string) {
    const compartment = new Compartment({
      ...this.context,
    })
    return compartment.evaluate(script)
  }

  /**
   * Convert `void` to `undefined`.
   */
  convertVoidToUndefined(text: string) {
    const regex = /\bvoid\b/g
    return text.replace(regex, 'undefined')
  }

  /**
   * The backslashes are already escaped in the script.
   */
  escapeBackslashes(text: string) {
    return text
  }
}
