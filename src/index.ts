import { Bot } from '@/bot/Bot'
import { myChatMemberEvent } from '@/bot/events'
import { PgService } from '@/pg/PgService'
import { LeetCodeUsersDao } from '@/leetcode-users/LeetCodeUsersDao'
import { TgChatsDao } from '@/tg/TgChatsDao'
import { connectLcCommand } from '@/bot/commands'
import { LeetCodeApiClient } from "@/leetcode/LeetCodeApiClient";

export const main = async (): Promise<void> => {
  const bot = new Bot()
  const tgBot = bot.getBot()
  const pgService = new PgService()
  const lcUsersDao = new LeetCodeUsersDao(pgService)
  const tgChatsDao = new TgChatsDao(pgService)
  const lcApi = new LeetCodeApiClient()

  const instances = [bot, tgBot, pgService, lcUsersDao]

  await myChatMemberEvent(tgBot, tgChatsDao)
  await connectLcCommand(tgBot, lcApi, lcUsersDao, tgChatsDao)

  for (const instance of instances) {
    if ('onModuleInit' in instance) {
      await instance.onModuleInit()
    }
  }
}

void main()
