import { Bot } from '@/bot/Bot'
import { cbQueryEvent, myChatMemberEvent } from '@/bot/events'
import { PgService } from '@/pg/PgService'
import { LeetCodeUsersDao } from '@/leetcode-users/LeetCodeUsersDao'
import { TgChatsDao } from '@/tg/TgChatsDao'
import { connectLcCommand, disconnectLcCommand } from '@/bot/commands'
import { LeetCodeApiClient } from '@/leetcode/LeetCodeApiClient'
import { createRamConvoStorage } from '@/bot/ramConvoStorage'
import { TgUsersDao } from '@/tg/TgUsersDao'

export const main = async (): Promise<void> => {
  const convoStorage = createRamConvoStorage()
  const bot = new Bot(convoStorage)
  const tgBot = bot.getBot()
  const pgService = new PgService()
  const tgUsersDao = new TgUsersDao(pgService)
  const lcUsersDao = new LeetCodeUsersDao(pgService)
  const tgChatsDao = new TgChatsDao(pgService)
  const lcApi = new LeetCodeApiClient()

  const instances = [
    bot,
    tgBot,
    pgService,
    lcUsersDao,
    convoStorage,
    lcApi,
    tgChatsDao,
    tgUsersDao,
  ]

  await myChatMemberEvent(tgBot, convoStorage, tgChatsDao)
  await connectLcCommand(
    tgBot,
    convoStorage,
    lcApi,
    lcUsersDao,
    tgUsersDao,
    tgChatsDao,
  )
  await disconnectLcCommand(
    tgBot,
    convoStorage,
    tgUsersDao,
    lcUsersDao,
    tgChatsDao,
  )
  await cbQueryEvent(tgBot, convoStorage)

  for (const instance of instances) {
    if ('onModuleInit' in instance) {
      await instance.onModuleInit()
    }
  }
}

void main()
