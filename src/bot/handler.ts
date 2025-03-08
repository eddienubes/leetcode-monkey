import { Bot } from 'grammy'
import { BotCtx } from '@/bot/Bot'
import { ConvoStorage } from '@/bot/ramConvoStorage'
import { PgService } from '@/pg/PgService'

export const createHandler = <T extends any[]>(
  cb: (
    bot: Bot<BotCtx>,
    convoStorage: ConvoStorage,
    ...args: T
  ) => Promise<void>,
): ((
  inject: {
    bot: Bot<BotCtx>
    convoStorage: ConvoStorage
    pgService: PgService
  },
  ...args: T
) => Promise<void>) => {
  return async (inject, ...args: T) => {
    return inject.pgService.wrapInTx(async () => {
      return await cb(inject.bot, inject.convoStorage, ...args)
    })
  }
}
