import crypto from 'node:crypto'

type MemoNamespace = {
  /**
   * Namespace expiration date is expiresAt of the last entry
   */
  expiresAt: Date
  entries: Map<string, MemoEntry>
}

type MemoEntry = {
  value: unknown
  expiresAt: Date
}

type MemoOptions = {
  /**
   * @default 5
   */
  size: number
  /**
   * @default 30 * 1000
   */
  ttlMs: number

  /**
   * @default false
   */
  logger: boolean
}

/**
 * Caches N latest objects in memory.
 * Useful for API calls
 */
export class Memo {
  private readonly cache: Map<string, MemoNamespace> = new Map()
  private readonly opts: MemoOptions = {
    size: 5,
    ttlMs: 30 * 1000,
    logger: false,
  }

  constructor(opts?: Partial<MemoOptions>) {
    this.opts = {
      ...this.opts,
      ...(opts || {}),
    }
  }

  /**
   * @param namespace Namespace for the cache.
   * E.g. you may want to store N different entries for each telegram message or chat
   * @param cb
   * @param args
   */
  async run<T, A extends unknown[]>(
    namespace: string | number,
    cb: (...args: A) => Promise<T>,
    ...args: A
  ): Promise<T> {
    const value = this.get(namespace, args)

    if (value && this.opts.logger) {
      console.log(`Memo: ${namespace} ${this.getKey(args)} hit`, this.cache)
    }

    if (value) {
      return value as T
    }

    const result = await cb(...args)
    this.add(namespace, args, result)

    if (this.opts.logger) {
      console.log(
        `Memo: ${namespace} ${this.getKey(args)} added to cache`,
        this.cache,
      )
    }

    return result
  }

  private add(
    namespace: string | number,
    args: unknown[],
    value: unknown,
  ): void {
    namespace = namespace.toString()

    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.opts.ttlMs)

    // get or create space
    const space = this.cache.get(namespace) ?? {
      expiresAt,
      entries: new Map<string, MemoEntry>(),
    }

    // delete oldest entry if size limit is reached
    if (space.entries.size >= this.opts.size) {
      const [key] = space.entries.entries().next().value as [string, MemoEntry]
      space.entries.delete(key)
    }

    const key = this.getKey(args)

    space.entries.set(key, { value, expiresAt })
    // update expiresAt of the space
    space.expiresAt = expiresAt

    this.cache.set(namespace, space)
    this.cleanup()
  }

  private get(namespace: string | number, args: unknown[]): unknown | null {
    namespace = namespace.toString()
    const space = this.cache.get(namespace)

    const now = new Date()

    if (space?.expiresAt && space.expiresAt < now) {
      this.cache.delete(namespace)
      return null
    }

    const key = this.getKey(args)
    const entry = space?.entries.get(key)

    if (!entry) {
      return null
    }

    if (entry.expiresAt < now) {
      space?.entries.delete(key)

      return null
    }

    return entry.value
  }

  /**
   * Remove empty and expired spaces
   * @private
   */
  private cleanup(): void {
    const now = new Date()

    for (const [namespace, space] of this.cache.entries()) {
      if (space.expiresAt < now) {
        this.cache.delete(namespace)
      }

      if (space.entries.size === 0) {
        this.cache.delete(namespace)
      }
    }
  }

  private getKey(args: unknown[]): string {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(args))
      .digest('base64')
    return `${hash}`
  }
}
