import {describe, expect, jest, test} from '@jest/globals'
import {State} from '../src/state'

describe('basic subscription', () => {
  test('subscribes to basic state changes', () => {
    const state = new State<{value: number}>({value: 1})
    const signal = state.select(state => state)
    const listen = jest.fn()
    signal.subscribe(listen)
    expect(signal.valueOf()).toEqual({value: 1})
    state.set(state => ({...state, value: 2}))
    expect(signal.valueOf()).toEqual({value: 2})
    expect(listen).toHaveBeenCalledTimes(1)
  })

  test('subscribes to specific key state changes', () => {
    const state = new State<{value: number}>({value: 1})
    const signal = state.select(state => state.value)
    const listen = jest.fn()
    signal.subscribe(listen)
    expect(signal.valueOf()).toEqual(1)
    state.set(state => ({...state, value: 2}))
    state.set(state => ({...state, value: 3}))
    expect(signal.valueOf()).toEqual(3)
    expect(listen).toHaveBeenCalledTimes(2)
  })

  test('ignores non-updates by default', () => {
    const state = new State<{value: number}>({value: 1})
    const signal = state.select(state => state.value)
    const listen = jest.fn()
    signal.subscribe(listen)
    expect(signal.valueOf()).toEqual(1)
    state.set(state => ({...state, value: 1}))
    expect(signal.valueOf()).toEqual(1)
    expect(listen).toHaveBeenCalledTimes(0)
  })

  test.only('signals non-updates when comparison is disabled', () => {
    const state = new State<{value: []}>({value: []})
    const signal = state.select(state => state.value, {shallowCompare: false})
    const listen = jest.fn()
    signal.subscribe(listen)
    expect(signal.valueOf()).toEqual([])
    state.set(state => ({...state, value: []}))
    expect(signal.valueOf()).toEqual([])
    expect(listen).toHaveBeenCalledTimes(1)
  })
})
