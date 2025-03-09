import { createHandler } from '@/bot/handler'
import { TgChatsDao } from '@/tg/TgChatsDao'
import { TgMemberStatus } from '@/bot/types'

export const myChatMemberEvent = createHandler(
  async (bot, convoStorage, tgChatDao: TgChatsDao) => {
    bot.on('my_chat_member', async (ctx, next) => {
      const update = ctx.myChatMember
      const chat = update.chat

      console.log(
        `my_chat_member: ${chat.id}, status change from ${update.old_chat_member.status} to ${update.new_chat_member.status}`,
      )

      const tgChat = await tgChatDao.upsert({
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

      if (tgChat.isCreated) {
        await tgChatDao.upsertSettings({
          tgChatUuid: tgChat.uuid,
          isActive: true,
          isActiveToggledAt: new Date(),
          leaderboardStartedAt: new Date(),
        })
      }

      ctx.tgChat = tgChat

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
