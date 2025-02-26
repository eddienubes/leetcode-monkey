import { createHandler } from '@/bot/createHandler'
import { TgChatInsert, TgChatsDao } from '@/tg/TgChatsDao'

export const myChatMemberEvent = createHandler(
  async (bot, tgChatDao: TgChatsDao) => {
    bot.on('my_chat_member', async (ctx, next) => {
      const update = ctx.myChatMember
      const chat = update.chat

      console.log(
        `my_chat_member: ${chat.id}, status change from ${update.old_chat_member.status} to ${update.new_chat_member.status}`,
      )

      const props: TgChatInsert = {
        tgId: chat.id.toString(),
        type: chat.type,
        title: chat.title,
        username: chat.username,
        fullName: chat.first_name
          ? `${chat.first_name} ${chat.last_name}`
          : null,
        isForum: chat.is_forum,
      }

      if (
        ['member', 'creator', 'administrator'].includes(
          update.new_chat_member.status,
        )
      ) {
        await tgChatDao.upsert({
          ...props,
          isRemoved: false,
        })
        return await next()
      }

      if (['left', 'kicked'].includes(update.new_chat_member.status)) {
        await tgChatDao.upsert({
          ...props,
          isRemoved: true,
        })
        return await next()
      }

      await next()
    })
  },
)
