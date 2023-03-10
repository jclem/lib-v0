import {describe, expect, test} from '@jest/globals'
import {
  assert,
  assertEquals,
  assertInstance,
  assertString,
  assertType
} from '../src/assert'

describe('assert', () => {
  test('passes with a value', () => {
    expect(assert('foo')).toBe('foo')
  })

  test('passes with a falsey value', () => {
    expect(assert(false)).toBe(false)
  })

  test('raises with null', () => {
    expect(() => assert(null)).toThrow()
  })

  test('raises with undefined', () => {
    expect(() => assert(undefined)).toThrow()
  })

  test('accepts a custom message', () => {
    expect(() => assert(null, 'Given null')).toThrow('Given null')
  })
})

describe('assertString', () => {
  test('passes with a string', () => {
    expect(assertString('foo')).toBe('foo')
  })

  test('passes with an empty string', () => {
    expect(assertString('')).toBe('')
  })

  test('raises with a non-string', () => {
    expect(() => assertString(1)).toThrow()
  })

  test('accepts a custom message', () => {
    expect(() => assertString(1, 'Given 1')).toThrow('Given 1')
  })
})

describe('assertType', () => {
  test('passes with a passing type', () => {
    expect(assertType(1n, 'bigint')).toBe(1n)
  })

  test('raises with a non-type', () => {
    expect(() => assertType(1, 'string')).toThrow(
      'Expected a string, but got 1'
    )
  })
})

describe('assertInstance', () => {
  test('passes with an instance', () => {
    class Foo {}
    const foo = new Foo()
    expect(assertInstance(foo, Foo)).toBe(foo)
  })

  test('raises with a non-instance', () => {
    class Foo {}
    const foo = {}
    expect(() => assertInstance(foo, Foo)).toThrow(
      'Expected a Foo, but got [object Object]'
    )
  })
})

describe('assertEquals', () => {
  test('passes with equal values', () => {
    expect(assertEquals(1, 1)).toBe(1)
  })

  test('raises with non-equal values', () => {
    expect(() => assertEquals(1, 2)).toThrow('Expected 1 to equal 2')
  })

  test('returns the type of the second input', () => {
    const check = (input: 'a' | 'b') => input
    const input = 'a'
    const output = assertEquals(input, 'a')
    check(output)
  })
})
