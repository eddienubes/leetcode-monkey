import { createHandler } from '@/bot/handler'
import { TgChatInsert, TgChatsDao } from '@/tg/TgChatsDao'
import * as util from 'node:util'

export const myChatMemberEvent = createHandler(
  async (bot, convoStorage, tgChatDao: TgChatsDao) => {
    bot.on('my_chat_member', async (ctx, next) => {
      const update = ctx.myChatMember
      const chat = update.chat

      // console.log(`my_chat_member`, ctx)

      console.log(
        `my_chat_member: ${chat.id}, status change from ${update.old_chat_member.status} to ${update.new_chat_member.status}`,
      )

      const tgChat = await tgChatDao.getByTgId(chat.id.toString())

      const tgChatProps = {
        role: update.new_chat_member.status,
        tgId: chat.id.toString(),
        type: chat.type,
        title: chat.title,
        username: chat.username,
        fullName: chat.first_name
          ? `${chat.first_name} ${chat.last_name}`
          : null,
        isForum: chat.is_forum,
      } satisfies TgChatInsert

      if (tgChat) {
        await tgChatDao.updateByUuid(tgChat.uuid, tgChatProps)
      }

      const tgChat = await tgChatDao.upsert(tgChatProps, {
        ...tgChatProps,
      })

      if (tgChat.isCreated) {
        await tgChatDao.upsertSettings({
          tgChatUuid: tgChat.uuid,
          isNotificationsEnabled: true,
          isNotificationsEnabledToggledAt: new Date(),
          leaderboardStartedAt: new Date(),
        })
      }

      return await next()
    })

    bot.on('message:migrate_to_chat_id', async (ctx) => {
      console.log(util.inspect(ctx, { depth: null }))
    })
  },
)

export const cbQueryEvent = createHandler(async (bot) => {
  bot.on('callback_query', async (ctx) => {
    await ctx.answerCallbackQuery()
  })
})
