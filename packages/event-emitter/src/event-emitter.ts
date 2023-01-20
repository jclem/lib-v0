type Event<P extends unknown[]> = {
  listeners: Set<(...args: P) => void>
  listenersOnce: Set<(...args: P) => void>
}

type EventMap = {
  [key: string]: [...args: unknown[]]
}

/**
 * An object which calls listeners when events are emitted.
 *
 * @example
 * ```ts
 * class Foo extends EventEmitter<{foo: [value: string]}> {}
 *
 * const listener = (value: string) => console.log(value)
 * const f = new Foo()
 * const off = f.on('foo', listener)
 * f.emit('foo', ['a']) // logs 'a'
 * off()
 * ```
 */
export class EventEmitter<EM extends EventMap> {
  readonly #subscriptions: Partial<{
    [key in keyof EM]: Event<EM[key]>
  }> = {}

  /**
   * Add a listener to an event.
   *
   * @param event The event to listen to.
   * @param listener A function to call when the event is emitted.
   * @returns A function to remove the listener.
   */
  on<K extends keyof EM>(
    event: K,
    listener: (...args: EM[K]) => void
  ): () => void {
    const eventListeners = (this.#subscriptions[event] ??= {
      listeners: new Set(),
      listenersOnce: new Set()
    })

    eventListeners.listeners.add(listener)

    return () => this.off(event, listener)
  }

  /**
   * Add a listener to an event that will be called only once.
   *
   * @param event The event to listen to.
   * @param listener A function to call when the event is emitted.
   * @returns A function to remove the listener.
   */
  once<K extends keyof EM>(
    event: K,
    listener: (...args: EM[K]) => void
  ): () => void {
    const eventListeners = (this.#subscriptions[event] ??= {
      listeners: new Set(),
      listenersOnce: new Set()
    })

    eventListeners.listenersOnce.add(listener)

    return () => this.off(event, listener)
  }

  /**
   * Remove a listener from an event.
   *
   * @param event The event to remove the listener from.
   * @param listener The listener to remove.
   */
  off<K extends keyof EM>(event: K, listener: (...args: EM[K]) => void): void {
    const eventListeners = this.#subscriptions[event]
    if (eventListeners) {
      eventListeners.listeners.delete(listener)
      eventListeners.listenersOnce.delete(listener)
    }
  }

  /**
   * Emit an event.
   *
   * @param event The event to emit.
   * @param args The arguments to pass to the listeners.
   */
  emit<K extends keyof EM>(event: K, args: EM[K]): void {
    const eventListeners = this.#subscriptions[event]
    if (eventListeners) {
      // Copy the listeners to avoid concurrent modification (during callbacks).
      const listeners = Array.from(eventListeners.listeners)
      const listenersOnce = Array.from(eventListeners.listenersOnce)
      eventListeners.listenersOnce.clear()

      listeners.forEach(listener => listener(...args))
      listenersOnce.forEach(listener => listener(...args))
    }
  }

  /**
   * Remove all listeners.
   */
  teardown(): void {
    for (const key in this.#subscriptions) {
      delete this.#subscriptions[key]
    }
  }
}
