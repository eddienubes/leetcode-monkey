import { Bot } from '@/bot/Bot'
import { myChatMemberHandler } from '@/bot/events'
import { PgService } from '@/pg/PgService'
import { LeetCodeUsersDao } from '@/leetcode-users/LeetCodeUsersDao'

export const main = async (): Promise<void> => {
  const bot = new Bot()
  const tgBot = bot.getBot()
  const pgService = new PgService()
  const lcUsersDao = new LeetCodeUsersDao(pgService)

  const instances = [bot, tgBot, pgService, lcUsersDao]

  await myChatMemberHandler(tgBot, lcUsersDao)

  for (const instance of instances) {
    if ('onModuleInit' in instance) {
      await instance.onModuleInit()
    }
  }
}

void main()
