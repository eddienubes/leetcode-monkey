import { Memo } from './Memo'

describe('Memo', () => {
  beforeAll(() => {
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('run', () => {
    it('should cache values', async () => {
      const value = 'some value'
      const args = ['arg1', 'arg2']
      const mockFn = vi.fn((...args) => Promise.resolve(value))

      const ttlMs = 30000
      const memo = new Memo({
        size: 5,
        ttlMs,
        logger: false,
      })

      const run = async (...args: unknown[]) => {
        return await memo.run(
          'namespace',
          async (...args) => {
            return mockFn(...args)
          },
          ...args,
        )
      }

      const hit = await run(...args)

      expect(hit).toBe(value)
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith(args[0], args[1])

      const hit2 = await run(...args)

      expect(hit2).toBe(value)
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith(args[0], args[1])

      vi.advanceTimersByTime(ttlMs + 1)

      const miss = await run(...args)

      expect(miss).toBe(value)
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenCalledWith(args[0], args[1])

      const miss2 = await run('extra', ...args)

      expect(miss2).toBe(value)
      expect(mockFn).toHaveBeenCalledTimes(3)
      expect(mockFn).toHaveBeenCalledWith('extra', args[0], args[1])
    })

    it('should cache with empty dependency array', async () => {
      const value = 'some value'
      const args: unknown[] = []
      const mockFn = vi.fn((...args) => Promise.resolve(value))

      const ttlMs = 30000
      const memo = new Memo({
        size: 5,
        ttlMs,
        logger: false,
      })

      const run = async (...args: unknown[]) => {
        return await memo.run(
          'namespace',
          async (...args) => {
            return mockFn(...args)
          },
          ...args,
        )
      }

      const hit = await run(...args)

      expect(hit).toBe(value)
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith()

      const hit2 = await run(...args)

      expect(hit2).toBe(value)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })
})
