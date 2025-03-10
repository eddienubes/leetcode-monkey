import { parseIntOrDefault } from '@/common/utils'

export class PageCb {
  private readonly skipChar = 's'
  private readonly delimiter = '_'
  readonly isSkip: boolean
  readonly page: number

  private constructor(match?: string | number) {
    if (typeof match === 'number') {
      this.page = match
      this.isSkip = false
      return
    }

    if (!match || !match.includes(this.delimiter)) {
      this.isSkip = false
      this.page = parseIntOrDefault(match, 0)
      return
    }

    const [s, page] = match.split(this.delimiter)

    this.page = parseIntOrDefault(page, 0)
    this.isSkip = s === this.skipChar
  }

  static fromMatch(match: string | undefined) {
    return new PageCb(match)
  }

  next(): PageCb {
    const next = this.page + 1
    return PageCb.fromMatch(next.toString())
  }

  prev(): PageCb {
    const prev = this.page - 1
    return PageCb.fromMatch(prev.toString())
  }

  toSkip(): string {
    return `${this.skipChar}${this.delimiter}${this.page}`
  }

  toString(): string {
    return this.page.toString()
  }
}
