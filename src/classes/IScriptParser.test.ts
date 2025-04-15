import { IScriptParser } from './IScriptParser'

describe('iScriptParser', () => {
  it('should convert an empty script to javascript', () => {
    const parser = new IScriptParser({})
    const script = ``
    const expected = ``
    const result = parser.parse(script)
    expect(result).toEqual(expected)
  })

  it('should convert semicolon to javascript', () => {
    const parser = new IScriptParser({})
    const script = `;`
    const expected = `;`
    const result = parser.parse(script)
    expect(result).toEqual(expected)
  })

  it('should convert assignments to javascript', () => {
    const parser = new IScriptParser({})
    const script = `a = 1;`
    const expected = `a = 1;`
    const result = parser.parse(script)
    expect(result).toEqual(expected)
  })

  it('should convert multiple lines to javascript', () => {
    const parser = new IScriptParser({})
    const script = `
    a = 1;
    b = 2;
    c = 3;`
    const expected = `
    a = 1;
    b = 2;
    c = 3;`
    const result = parser.parse(script)
    expect(result).toEqual(expected)
  })

  it('should convert arithmetic operations to javascript', () => {
    const parser = new IScriptParser({})
    const script = `a = b + c;`
    const expected = `a = b + c;`
    const result = parser.parse(script)
    expect(result).toEqual(expected)
  })

  it('should work with boolean checks', () => {
    const parser = new IScriptParser({})
    const script = `1 == 1;`
    const expected = `1 == 1;`
    const result = parser.parse(script)
    expect(result).toEqual(expected)
  })

  it('should convert single-line conditionals to javascript', () => {
    const parser = new IScriptParser({})
    const script = `if (a == b) a = c;`
    const expected = `if (a == b) a = c;`
    const result = parser.parse(script)
    expect(result).toEqual(expected)
  })

  it('should convert multi-line conditionals to javascript', () => {
    const parser = new IScriptParser({})
    const script = `if (a == b) {
      a = c;
      b = d;
    }`
    const expected = `if (a == b) {
      a = c;
      b = d;
    }`
    const result = parser.parse(script)
    expect(result).toEqual(expected)
  })

  it('should convert void to undefined', () => {
    const parser = new IScriptParser({})
    const script = `if (a == void) x = y;`
    const expected = `if (a == undefined) x = y;`
    const result = parser.parse(script)
    expect(result).toEqual(expected)
  })

  it('should convert functions to javascript', () => {
    const parser = new IScriptParser({})
    const script = `function test(a, b) {
      return a + b;
    }`
    const expected = `function test(a, b) {
      return a + b;
    }`
    const result = parser.parse(script)
    expect(result).toEqual(expected)
  })

  it('should run a simple javascript function correctly', () => {
    const parser = new IScriptParser({})
    const script = `function test(a, b) {
      return a + b;
    }
    test(1, 2);`
    const converted = parser.parse(script)
    const result = parser.run(converted)
    expect(result).toEqual(3)
  })

  it('should run a function with a conditional correctly', () => {
    const parser = new IScriptParser({})
    const script = `
    var c = 3;
    var d;
    function test(a, b) {
      if (d == void) {
        return a + b + c;
      } else {
        return a + b + c + d;
      }
    }
    test(1, 2);`
    const converted = parser.parse(script)
    const result = parser.run(converted)
    expect(result).toEqual(6)
  })

  it('should work with objects', () => {
    const context = {
      myObj: {
        a: 1,
        b: 2,
      },
    }
    const parser = new IScriptParser(context)
    const script = `myObj.a = 3; myObj.b = 4;`
    const converted = parser.parse(script)
    parser.run(converted)
    expect(context).toEqual({
      myObj: {
        a: 3,
        b: 4,
      },
    })
  })

  it('can run a function', () => {
    const context = {
      kag: {
        bgm: {
          buf1: {
            volume2: undefined,
          },
        },
        keyDownHook: {
          add: () => null,
          remove: () => null,
        },
        stopAllTransitions: () => null,
      },
    }
    const parser = new IScriptParser(context)
    const script = `
    function myKeyDownHook(key,shift){
      if(key == VK_SHIFT)
        kag.stopAllTransitions();
        return 0;
    }
    myKeyDownHook();
    `
    const converted = parser.parse(script)
    expect(() => parser.run(converted)).not.toThrow()
  })
})
