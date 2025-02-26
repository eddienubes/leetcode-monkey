import { Bot } from 'grammy'

export const createHandler = <T extends any[]>(
  cb: (bot: Bot, ...args: T) => Promise<void>,
): ((bot: Bot, ...args: T) => Promise<void>) => {
  return async (bot: Bot, ...args: T) => {
    await cb(bot, ...args)
  }
}
