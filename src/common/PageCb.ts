import { parseIntOrDefault } from '@/common/utils'

/**
 * Pagination utility class for handling page numbers in a format suitable for
 * grammy menu btn payload which is involved in reassembling the menu.
 */
export class PageCb {
  private readonly delimiter = '_'
  readonly page: number
  readonly nextPage: number

  private constructor(match?: string) {
    if (!match) {
      this.page = 0
      this.nextPage = 1
      return
    }

    if (!match.includes('_')) {
      this.page = parseIntOrDefault(match, 0)
      this.nextPage = this.page + 1
      return
    }

    const [page, next] = match.split(this.delimiter)
    this.page = parseIntOrDefault(page, 0)
    this.nextPage = parseIntOrDefault(next, 1)
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

  toString(): string {
    return this.page.toString()
  }
}
