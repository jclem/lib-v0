/** Represents an OK or not OK state, wrapping a value or an error */
export type Result<T, E> = ResultOk<T> | ResultError<E>

/** An OK state, wrapping a value */
export type ResultOk<T> = {ok: true; value: T}

/** A not OK state, wrapping an error */
export type ResultError<E> = {ok: false; error: E}

/**
 * Wrap the given value in a {@link ResultOk}.
 *
 * @param value The value to wrap in an OK result
 * @returns The value wrapped in a {@link ResultOk}
 */
export const resultOk = <T>(value: T): ResultOk<T> => ({ok: true, value})

/**
 * Wrap the given value in a {@link ResultError}.
 *
 * @param error The error to wrap in a not OK result
 * @returns The value wrapped in a {@link ResultError}
 */
export const resultError = <E>(error: E): ResultError<E> => ({ok: false, error})

/**
 * Unwrap a {@link Result}'s value or throw its error.
 *
 * @param result A result to unwrap the value of
 * @returns The value of the result
 */
export const unwrap = <T>(result: Result<T, unknown>): T => {
  if (result.ok) {
    return result.value
  }

  throw result.error
}

/**
 * Unwrap a {@link Result}'s error or throw an error.
 *
 * @param result A result to unwrap the error of
 * @returns The error of the result
 */
export const unwrapError = <E>(result: Result<unknown, E>): E => {
  if (!result.ok) {
    return result.error
  }

  throw new Error(`Expected error, but got ${result.value}`)
}

/**
 * Create a {@link Result} from a {@link Promise}.
 *
 * @param promise A promise that may resolve to a value or reject with an error
 * @returns A promise that resolves to a {@link Result} wrapping the original promise's value or error
 */
export const fromPromise = <T>(
  promise: Promise<T>
): Promise<Result<T, unknown>> => promise.then(resultOk).catch(resultError)

/**
 * Run `onOk` if the given {@link Result} is an {@link ResultOk}, or `onError`
 * if it is a {@link ResultError}.
 *
 * @param result The result to unwrap
 * @param onOk The function to call when the result is OK
 * @param onError The function to call when the result is not OK
 */
export const either = <T, E>(
  result: Result<T, E>,
  onOk: (value: T) => unknown,
  onError: (error: E) => unknown
): void => {
  if (result.ok) {
    onOk(result.value)
  } else {
    onError(result.error)
  }
}

/**
 * Map a {@link Result} to a new {@link Result} by applying the OK or error
 * function to the value or error, respectively.
 *
 * @param result The result to map
 * @param onOk The function to map the value through when the result is OK
 * @param onError The function to map the error through when the result is not OK
 * @returns A new {@link Result} wrapping the mapped value and error type
 */
export const map = <T, E, R, RE>(
  result: Result<T, E>,
  onOk: (value: T) => R,
  onError: (error: E) => RE
): Result<R, RE> => {
  if (result.ok) {
    return resultOk(onOk(result.value))
  } else {
    return resultError(onError(result.error))
  }
}

/**
 * Map a {@link Result} or a {@link Promise} resolving to a result to a new
 * {@link Result} by applying the optionally async OK or error function to the
 * value or error, respectively.
 *
 * @param result The result to map
 * @param onOk The optionally async function to map the value through when the result is OK
 * @param onError The optionally async function to map the error through when the result is not OK
 * @returns A promise resolving to a new {@link Result} wrapping the mapped value and error type
 */
export const mapAsync = async <T, E, R, RE>(
  result:
    | Promise<Result<T | Promise<T>, E | Promise<E>>>
    | Result<T | Promise<T>, E | Promise<E>>,
  onOk: (value: T) => R,
  onError: (error: E) => RE
): Promise<Result<R, RE>> => {
  const awaitedResult = await result

  if (awaitedResult.ok) {
    return resultOk(await onOk(await awaitedResult.value))
  } else {
    return resultError(await onError(await awaitedResult.error))
  }
}

/**
 * Map a {@link Promise} through optionally asynchronous functions.
 *
 * @param promise The promise to map
 * @param onOk The function to map the value through when the promise resolves
 * @param onError The function to map the error through when the promise rejects
 * @returns A {@link Promise} resolving to a result wrapping the value and error type
 */
export const mapPromise = async <T, T2, E2>(
  promise: Promise<T>,
  onOk: (value: T) => T2,
  onError: (error: unknown) => E2
): Promise<Result<T2, E2>> => mapAsync(fromPromise(promise), onOk, onError)

/**
 * Map a result whose values are possibly promises by awaiting those promises.
 *
 * @param result The result to map through an await
 * @returns A new result, with promises awaited
 */
export const mapAwait = async <T, E>(
  result:
    | Promise<Result<T | Promise<T>, E | Promise<E>>>
    | Result<T | Promise<T>, E | Promise<E>>
): Promise<Result<T, E>> => {
  const awaitedResult = await result

  if (awaitedResult.ok) {
    return resultOk(await awaitedResult.value)
  } else {
    return resultError(await awaitedResult.error)
  }
}
