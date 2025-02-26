import { createHandler } from '@/bot/createHandler'
import { LeetCodeUsersDao } from '@/leetcode-users/LeetCodeUsersDao'

export const myChatMemberHandler = createHandler(
  async (bot, leetCodeUsersDao: LeetCodeUsersDao) => {
    bot.on('my_chat_member', async (ctx, next) => {
      console.log(ctx.myChatMember)
      await next()
    })
  },
)
