import { PageCb } from '@/common/PageCb'

describe('PageCb', () => {
  it('should do page things', async () => {
    const cb = PageCb.fromMatch('1')

    expect(cb.page).toBe(1)
    expect(cb.isSkip).toBe(false)
    expect(cb.toString()).toBe('1')
    expect(cb.toSkip()).toBe('s_1')

    const next = cb.next()

    expect(next.page).toBe(2)
    expect(next.isSkip).toBe(false)
    expect(next.toString()).toBe('2')
    expect(next.toSkip()).toBe('s_2')
    expect(next === cb).toBe(false)

    const prev = cb.prev()
    expect(prev.page).toBe(0)
    expect(prev.isSkip).toBe(false)
    expect(prev.toString()).toBe('0')
    expect(prev.toSkip()).toBe('s_0')
    expect(prev === cb).toBe(false)
  })

  it('should work with negative numbers', async () => {
    const cb = PageCb.fromMatch('-1')

    expect(cb.page).toBe(-1)
    expect(cb.isSkip).toBe(false)
    expect(cb.toString()).toBe('-1')
    expect(cb.toSkip()).toBe('s_-1')

    const next = cb.next()

    expect(next.page).toBe(0)
    expect(next.isSkip).toBe(false)
    expect(next.toString()).toBe('0')
    expect(next.toSkip()).toBe('s_0')
    expect(next === cb).toBe(false)

    const prev = cb.prev()
    expect(prev.page).toBe(-2)
    expect(prev.isSkip).toBe(false)
    expect(prev.toString()).toBe('-2')
    expect(prev.toSkip()).toBe('s_-2')
  })
})
