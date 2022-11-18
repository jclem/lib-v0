# @jclem/result

Provides simple utilities for working with result types, which contain either a
value returned by an operation or an error occurring during the unsuccessful
execution of that operation.

## Installation

```shell
npm install @jclem/result
```

## Usage

### Basic Usage

The purpose of this package is to provide a simple way to work with operations
that may succeed or fail. Rather than having to try/catch these operations, it
is frequently simpler and easier to read when we instead of a single `Result`
value that may be successful (containing the return value of the operation) or
an error (containing the error itself).

```typescript
import {
  resultOk,
  resultErr,
  unwrap,
  unwrapErr
} from '@jclem/result'

// Create a successful result with a value.
const ok = resultOk('Hello')

// Create an unsuccessful result with an error.
const err = resultErr(new Error('Something went wrong'))

// Unwrap a result, retrieving its value, or throw if it is an error.
const value = unwrap(ok)
// => 'Hello'
const error = unwrap(err)
// => raises: Error: Something went wrong

// Unwrap a result, retrieving its error, or throw if it is a value.
const error2 = unwrapErr(err)
// => *value*: Error: Something went wrong
const value2 = unwrapErr(ok)
// => raises: Error: Expected error, but got 'Hello'

// Check if a result is successful.
const result = resultOk('Hello')
if (result.ok) {
  console.log(result.value)
  // => 'Hello'
} else {
  console.error('Whoops', result.error)
  // => never reached, but would log an error on an unsuccessful result
}
```

### Acting on Results

Given a result, you may want to do one thing if the result is successful and
another if it is not. The `either` function allows you to do this
(alternatively, one can use an if/else block, as seen above).

```typescript
import {
  Result,
  either
} from '@jclem/result'

declare const myResult: Result<string, Error> // Either contains a string or an error

either(
  myResult,
  (value) => console.log('Success:', value),
  (error) => console.error('Error:', error)
)
```

Instead of acting on a result, you can also map its possible outcomes to a new
result.

```typescript
import {
  Result,
  map
} from '@jclem/result'

declare const myResult: Result<boolean, Error>

const myNewResult = map(
  myResult,
  (value) => !value
  (error) => null
)

// myNewResult is now a Result<boolean, null>, with the value inverted if the
// operation was successful.
```

### Asynchronicity

The package can work with asynchronous values, as well.

```typescript
import {
  Result,
  fromPromise
} from '@jclem/result'

declare const myPromise: Promise<string>
const myPromiseResult = fromPromise(myPromise)
// myPromiseResult is now a Promise<Result<string, unknown>>
// The error type is `unknown`, because there is no generic type for the
// rejected value of a Promise.
```

One can map over the result of a promise, as well.

```typescript
import {
  Result,
  mapAsync,
  mapPromise,
  mapAwait,
  fromPromise
} from '@jclem/result'

declare const myPromise: Promise<string>
const myNewPromise = mapAsync(
  fromPromise(myPromise),
  (value) => value.toUpperCase(),
  (error) => null
)
// myNewPromise is now a Promise<Result<string, null>>
// Note that the map functions can also be asynchronous, if need be.

// There is a convenience function to do this with a promise directly
const myNewPromise2 = mapPromise(
  myPromise,
  (value) => value.toUpperCase(),
  (error) => null
)

// There is also a convenience function simply to await the result value or
// rejection value of a promise contained in a result.
const myFoo = resultOk(new Promise(resolve => resolve('ok')))
const awaitedResult = await mapAwait(myFoo)
// awaitedResult is now a Result<string, unknown>
```