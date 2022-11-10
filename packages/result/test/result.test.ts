import {describe, expect, test} from '@jest/globals'
import {
  either,
  fromPromise,
  map,
  mapAsync,
  mapAwait,
  mapPromise,
  resultError,
  resultOk,
  unwrap,
  unwrapError
} from '../src/result'

describe('resultOk', () => {
  test('creates an OK result', () => {
    expect(resultOk(true).value).toBe(true)
  })
})

describe('resultError', () => {
  test('creates an error result', () => {
    expect(resultError(true).error).toBe(true)
  })
})

describe('fromPromise', () => {
  test('creates an OK result from a resolved promise', () => {
    expect(fromPromise(Promise.resolve(true))).resolves.toEqual(resultOk(true))
  })

  test('creates an error result from a rejected promise', () => {
    expect(fromPromise(Promise.reject(true))).resolves.toEqual(
      resultError(true)
    )
  })
})

describe('either', () => {
  test('calls onOk when OK', () => {
    expect.assertions(1)

    either(
      resultOk(true),
      value => expect(value).toBe(true),
      () => null
    )
  })

  test('calls onError when not OK', () => {
    expect.assertions(1)

    either(
      resultError(true),
      () => null,
      value => expect(value).toBe(true)
    )
  })
})

describe('unwrap', () => {
  test('returns the value when OK', () => {
    expect(unwrap(resultOk(true))).toBe(true)
  })

  test('throws the error when not OK', () => {
    const err = new Error('oops')
    expect(() => unwrap(resultError(err))).toThrow(err)
  })
})

describe('unwrapError', () => {
  test('returns the error when not OK', () => {
    const err = new Error('oops')
    expect(unwrapError(resultError(err))).toBe(err)
  })

  test('throws an error when OK', () => {
    expect(() => unwrapError(resultOk(true))).toThrow(
      'Expected error, but got true'
    )
  })
})

describe('map', () => {
  test('maps an OK result', () => {
    expect(
      map(
        resultOk(true),
        value => !value,
        () => null
      )
    ).toEqual(resultOk(false))
  })

  test('maps an error result', () => {
    expect(
      map(
        resultError(true),
        () => null,
        value => !value
      )
    ).toEqual(resultError(false))
  })
})

describe('mapAsync', () => {
  test('maps a promise result', async () => {
    expect(
      await mapAsync(
        fromPromise(Promise.resolve(true)),
        value => !value,
        () => null
      )
    ).toEqual(resultOk(false))
  })

  test('maps an OK result', async () => {
    expect(
      await mapAsync(
        resultOk(true),
        value => Promise.resolve(!value),
        () => null
      )
    ).toEqual(resultOk(false))
  })

  test('maps an error result', async () => {
    expect(
      await mapAsync(
        resultError(true),
        () => null,
        value => Promise.resolve(!value)
      )
    ).toEqual(resultError(false))
  })
})

describe('mapPromise', () => {
  test('maps a resolved result', async () => {
    expect(
      await mapPromise(
        Promise.resolve(true),
        value => !value,
        () => null
      )
    ).toEqual(resultOk(false))
  })

  test('maps a rejected result', async () => {
    expect(
      await mapPromise(
        Promise.reject(true),
        () => null,
        value => !value
      )
    ).toEqual(resultError(false))
  })
})

describe('mapAwait', () => {
  test('maps a resolved result', async () => {
    expect(await mapAwait(resultOk(Promise.resolve(true)))).toEqual(
      resultOk(true)
    )
  })

  test('maps a rejected result', async () => {
    expect(await mapAwait(resultError(Promise.resolve(true)))).toEqual(
      resultError(true)
    )
  })
})
