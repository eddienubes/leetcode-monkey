import { Menu } from '@grammyjs/menu'
import { BotCtx } from '@/bot/Bot'
import { PageCb } from '@/common/PageCb'
import { Memo } from '@/common/Memo'

type FetchResult<T> = {
  total: number
  items: T
}

type Pagination<T, K> = {
  menu: Menu<BotCtx>
  run: <R>(
    ctx: BotCtx,
    cb: (ctx: BotCtx, fetch: FetchResult<T>, render: K) => Promise<R>,
  ) => Promise<R>
}

type PaginationOptions<T, K> = {
  fetch: (ctx: BotCtx, page: number) => Promise<FetchResult<T>>
  update: (
    ctx: BotCtx,
    fetch: FetchResult<T>,
    page: number,
    render: K,
  ) => Promise<void>
  render?: (ctx: BotCtx, fetch: FetchResult<T>, page: number) => Promise<K>
  limit: number
}

const getNamespace = (ctx: BotCtx): string => {
  const message = ctx.message || ctx.callbackQuery?.message
  const chat = ctx.chat

  if (!message?.message_id || !chat?.id) {
    // should not happen hopefully
    throw new Error(
      `Cannot create memo namespace out of given context where both message and chat are missing`,
      {
        cause: ctx,
      },
    )
  }

  return `${chat.id}-${message.message_id}`
}

export const createPagination = <T, K>(
  name: string,
  opts: PaginationOptions<T, K>,
): Pagination<T, K> => {
  // Let's cache the result to avoid double fetch
  // https://t.me/grammyjs/297229
  const memo = new Memo()

  const fetch = async (ctx: BotCtx, page: number) => {
    const namespace = getNamespace(ctx)
    const res = await memo.run<FetchResult<T>, unknown[]>(
      namespace,
      async () => {
        return await opts.fetch(ctx, page)
      },
      page,
    )

    return res
  }

  const runCycle = async (ctx: BotCtx, page: number) => {
    const res = await fetch(ctx, page)

    const render = await opts.render?.(ctx, res, page)
    await opts.update(ctx, res, page, render as K)
  }

  const menu = new Menu<BotCtx>(name, {
    onMenuOutdated: true,
  }).dynamic(async (ctx, range) => {
    /*
     * Dynamic cb is called twice per each callback query.
     * Once to reassemble the menu, and once to render it due to submenu
     */
    const cb = PageCb.from(ctx.match)
    const res = await fetch(ctx, cb.page)

    if (cb.page > 0) {
      range.submenu(
        {
          text: '⬅️',
          payload: cb.toString(),
        },
        name,
        async (ctx) => {
          const cb = PageCb.from(ctx.match)

          // Setup previous page render
          const prev = cb.prev()
          ctx.match = prev.toString()

          await runCycle(ctx, prev.page)
        },
      )
    }

    const totalPages = Math.ceil(res.total / opts.limit)
    // console.log(page, totalPages, page < totalPages - 1)

    // 1. skip rendering next on the last page
    // 2. totalPages counts from 1
    if (cb.page < totalPages - 1) {
      range.submenu(
        {
          text: '➡️',
          payload: cb.toString(),
        },
        name,
        async (ctx) => {
          const cb = PageCb.from(ctx.match)

          // Setup next page render
          const next = cb.next()
          ctx.match = next.toString()

          await runCycle(ctx, next.page)
        },
      )
    }
  })

  return {
    menu,
    run: async (ctx, cb) => {
      const namespace = getNamespace(ctx)

      const fetch = await memo.run<FetchResult<T>, unknown[]>(
        namespace,
        async (page) => {
          return await opts.fetch(ctx, 0)
        },
        0,
      )

      const render = await opts.render?.(ctx, fetch, 0)

      const message = await cb(ctx, fetch, render as K)
      return message
    },
  }
}
