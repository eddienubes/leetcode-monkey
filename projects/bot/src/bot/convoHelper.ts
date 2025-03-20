import { FilterQuery, Filter, GrammyError, Context } from 'grammy'
import { BotCtx, Convo } from '@/bot/Bot'
import { ConvoStorage } from '@/bot/ramConvoStorage'
import { TgCannotDeleteMessageError } from '@repo/core'

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
  convoStorage: ConvoStorage,
  ctx: BotCtx,
): Promise<ConvoHelper> => {
  const createFinally = async (cb?: (ctx: BotCtx) => Promise<unknown>) => {
    return async (ctx: BotCtx) => {
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
      }
    }
  }

  return {
    abort: () => convoStorage.delete(ctx),
    waitFor: async (opts) => {
      let attempts = opts.maxAttempts ?? 1

      const finallyCb = await createFinally(opts.finally)

      if (opts.timeoutMs) {
        await convo.external(async (ctx) => {
          setTimeout(async () => {
            convoStorage.delete(ctx)
            await finallyCb(ctx)
          }, opts.timeoutMs)
        })
      }
      if (!convoStorage.has(ctx)) {
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
            await finallyCb(eventCtx)
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
          await finallyCb(eventCtx)
          break
        }
      }

      return await convo.halt()
    },
  }
}
