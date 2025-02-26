import { Bot } from '@/bot/Bot'
import { myChatMemberHandler } from '@/bot/events'
import { PgService } from '@/pg/PgService'
import { LeetCodeUsersDao } from '@/leetcode-users/LeetCodeUsersDao'
import { TgChatsDao } from '@/tg/TgChatsDao'
import { signUpCommand } from '@/bot/commands'

export const main = async (): Promise<void> => {
  const bot = new Bot()
  const tgBot = bot.getBot()
  const pgService = new PgService()
  const lcUsersDao = new LeetCodeUsersDao(pgService)
  const tgChatsDao = new TgChatsDao(pgService)

  const instances = [bot, tgBot, pgService, lcUsersDao]

  await myChatMemberHandler(tgBot, tgChatsDao)
  await signUpCommand(tgBot)

  for (const instance of instances) {
    if ('onModuleInit' in instance) {
      await instance.onModuleInit()
    }
  }
}

void main()
