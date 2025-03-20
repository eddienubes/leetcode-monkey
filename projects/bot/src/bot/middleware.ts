import { Middleware } from 'grammy'
import { BotCtx } from '@/bot/Bot'
import { ConvoStorage } from '@/bot/ramConvoStorage'

export const createMiddleware = <T extends any[]>(
  cb: (
    ctx: BotCtx,
    next: () => Promise<void>,
    convoStorage: ConvoStorage,
    ...args: T
  ) => Promise<void>,
): ((
  convoStorage: ConvoStorage,
  ...args: T
) => Promise<Middleware<BotCtx>>) => {
  return async (convoRegistry, ...args) => {
    return async (ctx, next) => {
      await cb(ctx, next, convoRegistry, ...args)
    }
  }
}
