/**
 * Assert that `value` is not null or undefined.
 *
 * @param value The value to assert on
 * @param message An error message thrown when `value` is null or undefined
 * @returns The non-null-non-undefined value
 */
export const assert = <T>(
  value: T | undefined | null,
  message = `Expected value, but got none`
): T => {
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
export const assertString = (
  value: unknown,
  message = `Expected a string, but got ${value}`
): string => {
  if (typeof value !== 'string') {
    throw new Error(message)
  }

  return value
}

/**
 * Assert that `value` is an instance of `type`.
 *
 * @param value The value to assert on, of unknown type
 * @param type The type to assert `value` is an instance of
 * @param message An error message thrown when `value` is not a string
 * @returns A string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const assertInstance = <T extends abstract new (...args: any) => any>(
  value: unknown,
  type: T,
  message = `Expected a ${type.name}, but got ${value}`
): InstanceType<T> => {
  if (value instanceof type) {
    return value
  }

  throw new Error(message)
}
