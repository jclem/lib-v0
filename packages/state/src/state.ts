interface SignalOpts {
  shallowCompare: boolean
}

export class State<S extends object> extends EventTarget {
  #state: S

  constructor(initialState: S) {
    super()
    this.#state = initialState
  }

  select<V>(
    selector: (state: S) => V,
    partialOpts: Partial<SignalOpts> = {}
  ): Signal<S, V> {
    const keys = new Set<string | symbol>()
    const signalOpts: SignalOpts = {shallowCompare: true, ...partialOpts}

    const proxy = new Proxy(this.#state, {
      get(target, prop) {
        if (Reflect.has(target, prop)) keys.add(prop)
        // @ts-expect-error Type-checking will happen in userspace. We accept what keys we're given.
        return target[prop]
      }
    })

    const initialValue = selector(proxy)
    const signal = new Signal<S, V>(initialValue, selector, signalOpts)

    if (keys.size === 0) {
      this.addEventListener('change', () => signal.notify(this.#state))
    }

    for (const key of keys) {
      // TODO: A signal is updated once per key change, which is not ideal.
      this.addEventListener(this.#propEventKey(key), () =>
        signal.notify(this.#state)
      )
    }

    return signal
  }

  set(updater: (state: S) => S): void {
    const oldState = this.#state
    this.#state = updater(this.#state)

    this.dispatchEvent(new Event('change'))

    for (const key in this.#state) {
      if (!Object.is(this.#state[key], oldState[key])) {
        this.dispatchEvent(new Event(this.#propEventKey(key)))
      }
    }
  }

  #propEventKey(key: string | symbol): string {
    return `change:${String(key)}`
  }
}

class Signal<S extends object, V> {
  #value: V
  #subscriptions: (() => void)[] = []
  #selector: (state: S) => V
  #opts: SignalOpts

  constructor(initialValue: V, selector: (state: S) => V, opts: SignalOpts) {
    this.#value = initialValue
    this.#selector = selector
    this.#opts = opts
  }

  valueOf(): V {
    return this.#value
  }

  notify(newState: S): void {
    const oldValue = this.#value
    const newValue = this.#selector(newState)

    if (!this.#opts.shallowCompare || !shallowCompare(oldValue, newValue)) {
      this.#value = newValue
      this.#subscriptions.forEach(subscription => subscription())
    }
  }

  subscribe(listener: () => void): void {
    this.#subscriptions.push(listener)
  }
}

function shallowCompare<T>(a: T, b: T): boolean {
  // Identity comparison.
  if (Object.is(a, b)) {
    return true
  }

  // Iterate over object/array properties (null checks to satisfy TS).
  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    a != null &&
    b != null
  ) {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) {
      return false
    }

    for (const key in a) {
      // `Reflect.has` check in order to ensure `key` is also enumerable for `b`.
      if (!Reflect.has(b, key) || !Object.is(a[key], b[key])) {
        return false
      }
    }
    return true
  } else {
    return Object.is(a, b)
  }
}
