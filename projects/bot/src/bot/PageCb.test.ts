import { PageCb } from "./PageCb";

describe('PageCb', () => {
  it('should do page things', async () => {
    const cb = PageCb.from('1')

    expect(cb.page).toBe(1)
    expect(cb.toString()).toBe('1')

    const next = cb.next()

    expect(next.page).toBe(2)
    expect(next.toString()).toBe('2')
    expect(next === cb).toBe(false)

    const prev = cb.prev()
    expect(prev.page).toBe(0)
    expect(prev.toString()).toBe('0')
    expect(prev === cb).toBe(false)
  })

  it('should work with negative numbers', async () => {
    const cb = PageCb.from('-1')

    expect(cb.page).toBe(-1)
    expect(cb.toString()).toBe('-1')

    const next = cb.next()

    expect(next.page).toBe(0)
    expect(next.toString()).toBe('0')
    expect(next === cb).toBe(false)

    const prev = cb.prev()
    expect(prev.page).toBe(-2)
    expect(prev.toString()).toBe('-2')
  })
})
