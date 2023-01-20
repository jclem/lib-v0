# @jclem/event-emitter

Provides a set of TypeScript-friendly event emitter.

## Installation

```shell
npm install @jclem/event-emitter
```

## Usage

This package exposes a simple EventEmitter class that can be extended with a
custom set of type-friendly event names and parameter tuples.

```typescript
import {EventEmitter} from '@jclem/event-emitter'

class MyEmitter extends EventEmitter<{foo: [string, number]}> {}

const emitter = new MyEmitter()

const listener = (a: string, b: number) => console.log(a, b)

const off = emitter.on('foo', listener)
emitter.emit('foo', ['Hello', 5]) // => 'Hello' 5
off() // Or `emitter.off('foo', listener)`
```
