import { BotCtx, Convo } from '@/bot/Bot'
import { FilterQuery, Filter, GrammyError, Context } from 'grammy'
import { TgCannotDeleteMessageError } from '@/common/errors'

export type WaitForOptions<E extends FilterQuery, R> = {
  event: E
  beforeTry?: (ctx: Filter<BotCtx, E>) => Promise<unknown>
  try: (ctx: Filter<BotCtx, E>) => R
  success?: (ctx: Filter<BotCtx, E>) => Promise<unknown>
  catch?: (ctx: Filter<BotCtx, E>) => Promise<unknown>
  finally?: (ctx: BotCtx) => Promise<unknown>
  timeoutMs?: number
  maxAttempts?: number
}

export type ConvoHelper = {
  waitFor: <E extends FilterQuery, R>(
    opts: WaitForOptions<E, R>,
  ) => Promise<Exclude<Awaited<R>, undefined | null>>
  abort: () => void
}

export const createConvoHelper = async <C extends Convo>(
  convo: C,
): Promise<ConvoHelper> => {
  const ctx = await convo.external(async (ctx) => ctx)

  const execFinally = async (cb?: (ctx: BotCtx) => Promise<unknown>) => {
    try {
      await cb?.(ctx)
    } catch (e) {
      if (e instanceof GrammyError) {
        console.log(
          new TgCannotDeleteMessageError(
            `convoHelper: finally failed, ${e.message}`,
          ),
        )
        return
      }
      console.log(
        new TgCannotDeleteMessageError(`convoHelper: finally failed`, e),
      )
    }
  }

  const timeouts: NodeJS.Timeout[] = await convo.external(async () => [])

  const controller = await convo.external(async () => {
    console.log('creating controller')
    const controller = new AbortController()

    controller.signal.addEventListener(
      'abort',
      async () => {
        for (const timeout of timeouts) {
          clearTimeout(timeout)
        }
      },
      { once: true },
    )

    return controller
  })

  return {
    abort: () => controller.abort(),
    waitFor: async (opts) => {
      let attempts = opts.maxAttempts ?? 1

      if (opts.timeoutMs) {
        await convo.external(async () => {
          const timeout = setTimeout(async () => {
            controller.abort()
            await execFinally(opts.finally)
          }, opts.timeoutMs)

          timeouts.push(timeout)
        })
      }

      if (controller?.signal.aborted) {
        console.log('sync aborted')
        await convo.halt({ next: true })
      }

      while (attempts > 0) {
        const eventCtx = await convo
          .waitFor(opts.event)
          .unless(Context.has.filterQuery('::bot_command'), {
            next: true,
          })

        try {
          await opts.beforeTry?.(eventCtx)
          const value = await convo.external(
            async () => await opts.try(eventCtx),
          )
          if (value !== null && value !== undefined) {
            await opts.success?.(eventCtx)
            await execFinally(opts.finally)
            return value as Exclude<Awaited<typeof value>, undefined | null>
          } else {
            await opts.catch?.(eventCtx)
            attempts -= 1
          }
        } catch (e) {
          await opts.catch?.(eventCtx)
          attempts -= 1
        }

        if (attempts <= 0) {
          controller.abort()
        }
      }

      return await convo.halt()
    },
  }
}
