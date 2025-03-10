import { Menu } from '@grammyjs/menu'
import { BotCtx } from '@/bot/Bot'
import { PageCb } from '@/common/PageCb'
import { randomAlphaNumStr } from '@/common/utils'
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
  opts: PaginationOptions<T, K>,
): Pagination<T, K> => {
  // grammy doesn't allow slashes in menu names
  const name = `p-${randomAlphaNumStr(4)}`.replace(/\//g, '_')
  const memo = new Memo()

  const menu = new Menu<BotCtx>(name, {
    onMenuOutdated: false,
  }).dynamic(async (ctx, range) => {
    console.log('Render dynamic menu', ctx.match)
    const cb = PageCb.from(ctx.match)

    const namespace = getNamespace(ctx)

    // Dynamic cb is called twice per each callback query.
    // Once to reassemble the menu, and once to render it due to submenu
    // Let's cache the result to avoid double fetch
    // https://t.me/grammyjs/297229
    const fetch = await memo.run<FetchResult<T>, unknown[]>(
      namespace,
      async () => {
        return await opts.fetch(ctx, cb.page)
      },
      cb.page,
    )

    if (cb.page > 0) {
      range.submenu(
        {
          text: '⬅️',
          payload: cb.prev().toString(),
        },
        name,
        async (ctx) => {
          const cb = PageCb.from(ctx.match)
          ctx.match = cb.toString()
          const render = await opts.render?.(ctx, fetch, cb.page)
          await opts.update(ctx, fetch, cb.page, render as K)
        },
      )
    }

    const totalPages = Math.ceil(fetch.total / opts.limit)
    console.log(cb.page, totalPages, cb.page < totalPages - 1)

    // 1. skip rending next on the last page
    // 2. totalPages counts from 1
    if (cb.page < totalPages - 1) {
      range.submenu(
        {
          text: '➡️',
          payload: cb.next().toString(),
        },
        name,
        async (ctx) => {
          const cb = PageCb.from(ctx.match)
          ctx.match = cb.toString()
          const render = await opts.render?.(ctx, fetch, cb.page)
          await opts.update(ctx, fetch, cb.page, render as K)
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
