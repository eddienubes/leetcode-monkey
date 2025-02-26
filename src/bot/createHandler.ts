import { Bot } from 'grammy'
import { BotCtx } from '@/bot/Bot'

export const createHandler = <T extends any[]>(
  cb: (bot: Bot<BotCtx>, ...args: T) => Promise<void>,
): ((bot: Bot<BotCtx>, ...args: T) => Promise<void>) => {
  return async (bot: Bot<BotCtx>, ...args: T) => {
    await cb(bot, ...args)
  }
}
