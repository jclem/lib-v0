/**
 * Assert that `value` is not null or undefined.
 *
 * @param value The value to assert on
 * @param message An error message thrown when `value` is null or undefined
 * @returns The non-null-non-undefined value
 */
export function assert<T>(
  value: T | undefined | null,
  message = `Expected value, but got none`
): T {
  if (value == null) {
    throw new Error(message)
  }

  return value
}

/**
 * Assert that `value` is a string and return it.
 *
 * @param value The value to assert on, of unknown type
 * @param message An error message thrown when `value` is not a string
 * @returns A string
 */
export function assertString(
  value: unknown,
  message = `Expected a string, but got ${value}`
): string {
  return assertType(value, 'string', message)
}

type TypeofMap = {
  string: string
  number: number
  bigint: bigint
  boolean: boolean
  symbol: symbol
  undefined: undefined
  object: object | null
  // eslint-disable-next-line @typescript-eslint/ban-types
  function: Function
}

/**
 * Assert that `value` is of type `type` and return it.
 *
 * @param value The value to assert on, of unknown type
 * @param type The type to assert on, as a string, such as "string" or "number"
 * @param message An error message thrown when `value` is not of type `type`
 * @returns The value, of type `type`
 */
export function assertType<K extends keyof TypeofMap>(
  value: unknown,
  type: K,
  message = `Expected a ${type}, but got ${value}`
): TypeofMap[K] {
  if (typeof value === type) {
    return value as TypeofMap[K]
  }

  throw new Error(message)
}

/**
 * Assert that `value` is an instance of `type` and return it.
 *
 * @param value The value to assert on, of unknown type
 * @param type The type to assert `value` is an instance of
 * @param message An error message thrown when `value` is not a string
 * @returns A string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assertInstance<T extends abstract new (...args: any) => any>(
  value: unknown,
  type: T,
  message = `Expected a ${type.name}, but got ${value}`
): InstanceType<T> {
  if (value instanceof type) {
    return value
  }

  throw new Error(message)
}
