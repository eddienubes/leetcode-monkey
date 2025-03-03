import { Bot } from 'grammy'
import { BotCtx } from '@/bot/Bot'
import { ConvoStorage } from '@/bot/ramConvoStorage'

export const createHandler = <T extends any[]>(
  cb: (
    bot: Bot<BotCtx>,
    convoStorage: ConvoStorage,
    ...args: T
  ) => Promise<void>,
): ((
  bot: Bot<BotCtx>,
  convoStorage: ConvoStorage,
  ...args: T
) => Promise<void>) => {
  return async (bot, convoRegistry, ...args: T) => {
    await cb(bot, convoRegistry, ...args)
  }
}
