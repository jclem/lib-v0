import {describe, expect, test} from '@jest/globals'
import {assert, assertInstance, assertString} from '../src/assert'

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
