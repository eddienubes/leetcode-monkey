import { createHandler } from '@/bot/handler'
import { TgChatsDao } from '@/tg/TgChatsDao'

export const myChatMemberEvent = createHandler(
  async (bot, convoStorage, tgChatDao: TgChatsDao) => {
    bot.on('my_chat_member', async (ctx, next) => {
      const update = ctx.myChatMember
      const chat = update.chat

      console.log(
        `my_chat_member: ${chat.id}, status change from ${update.old_chat_member.status} to ${update.new_chat_member.status}`,
      )

      await tgChatDao.upsert({
        role: update.new_chat_member.status,
        tgId: chat.id.toString(),
        type: chat.type,
        title: chat.title,
        username: chat.username,
        fullName: chat.first_name
          ? `${chat.first_name} ${chat.last_name}`
          : null,
        isForum: chat.is_forum,
      })

      return await next()
    })
  },
)

export const cbQueryEvent = createHandler(async (bot, convoStorage) => {
  bot.on('callback_query', async (ctx, next) => {
    await ctx.answerCallbackQuery()
    // no-op
  })
})
