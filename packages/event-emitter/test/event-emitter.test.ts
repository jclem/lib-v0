import {describe, expect, jest, test} from '@jest/globals'
import {EventEmitter} from '../src/event-emitter'

class MyEmitter extends EventEmitter<{myEvent: [string]}> {}

describe('EventEmitter#on', () => {
  test('subscribes to an event', () => {
    const emitter = new MyEmitter()
    const listener = jest.fn()
    emitter.on('myEvent', listener)
    emitter.emit('myEvent', ['foo'])
    expect(listener).toHaveBeenCalledWith('foo')
  })

  test('returns a deregistration function', () => {
    const emitter = new MyEmitter()
    const listener = jest.fn()
    const off = emitter.on('myEvent', listener)
    off()
    emitter.emit('myEvent', ['foo'])
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('EventEmitter#once', () => {
  test('subscribes to an event once', () => {
    const emitter = new MyEmitter()
    const listener = jest.fn()
    emitter.once('myEvent', listener)
    emitter.emit('myEvent', ['foo'])
    emitter.emit('myEvent', ['bar'])
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('foo')
  })

  test('returns a deregistration function', () => {
    const emitter = new MyEmitter()
    const listener = jest.fn()
    const off = emitter.once('myEvent', listener)
    off()
    emitter.emit('myEvent', ['foo'])
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('EventEmitter#off', () => {
  test('deregisters an "on" listener', () => {
    const emitter = new MyEmitter()
    const listener = jest.fn()
    emitter.on('myEvent', listener)
    emitter.off('myEvent', listener)
    emitter.emit('myEvent', ['foo'])
    expect(listener).not.toHaveBeenCalled()
  })

  test('deregisters an "once" listener', () => {
    const emitter = new MyEmitter()
    const listener = jest.fn()
    emitter.once('myEvent', listener)
    emitter.off('myEvent', listener)
    emitter.emit('myEvent', ['foo'])
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('EventEmitter#emit', () => {
  test('emits an event', () => {
    const emitter = new MyEmitter()
    const listener = jest.fn()
    emitter.on('myEvent', listener)
    emitter.emit('myEvent', ['foo'])
    expect(listener).toHaveBeenCalledWith('foo')
  })

  test('does not emit to concurrently-created "on" listeners', () => {
    const emitter = new MyEmitter()
    const listener = jest.fn()
    emitter.on('myEvent', () => {
      emitter.on('myEvent', listener)
    })
    emitter.emit('myEvent', ['foo'])
    expect(listener).not.toHaveBeenCalled()
  })

  test('does not emit to concurrently-created "once" listeners', () => {
    const emitter = new MyEmitter()
    const listener = jest.fn()
    emitter.on('myEvent', () => {
      emitter.once('myEvent', listener)
    })
    emitter.emit('myEvent', ['foo'])
    expect(listener).not.toHaveBeenCalled()
  })
})
