import { parseIntOrDefault } from '@/common/utils'

export class PageCb {
  private readonly skipChar = 's'
  private readonly delimiter = '_'
  // readonly isSkip: boolean
  readonly page: number

  private constructor(match?: string | number) {
    if (typeof match === 'number') {
      this.page = match
      // this.isSkip = false
      return
    }

    // first load
    if (!match || !match.includes(this.delimiter)) {
      this.page = parseIntOrDefault(match, 0)
      // this.isSkip = true
      return
    }

    const [s, page] = match.split(this.delimiter)

    this.page = parseIntOrDefault(page, 0)
    // this.isSkip = s === this.skipChar
  }

  static from(match: string | undefined) {
    return new PageCb(match)
  }

  next(): PageCb {
    const next = this.page + 1
    return PageCb.from(next.toString())
  }

  prev(): PageCb {
    const prev = this.page - 1
    return PageCb.from(prev.toString())
  }

  // toSkip(): string {
  //   return `${this.skipChar}${this.delimiter}${this.page}`
  // }

  toString(): string {
    return this.page.toString()
  }
}
