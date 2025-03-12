import { TgUsersDao } from '@/tg/TgUsersDao'
import { createMiddleware } from '@/bot/middleware'
import { TgChatInsert, TgChatsDao } from '@/tg/TgChatsDao'

export const tgUsersMiddleware = createMiddleware(
  async (ctx, next, convoStorage, tgUsers: TgUsersDao, tgChats: TgChatsDao) => {
    if (!ctx.from || !ctx.chat) {
      return next()
    }
    const chat = ctx.chat
    const user = ctx.from

    const tgChatUpsert: Partial<TgChatInsert> = {
      type: chat.type,
      title: chat.title,
      username: chat.username,
      fullName: chat.first_name ? `${chat.first_name} ${chat.last_name}` : null,
      isForum: chat.is_forum,
    }

    const [upsertedUser, upsertedChat] = await Promise.all([
      tgUsers.upsert({
        tgId: user.id.toString(),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        isBot: user.is_bot,
        isPremium: user.is_premium,
        languageCode: user.language_code,
      }),
      tgChats.upsert(
        {
          ...tgChatUpsert,
          role: 'member',
          tgId: chat.id.toString(),
        } as TgChatInsert,
        {
          ...tgChatUpsert,
          updatedAt: new Date(),
        },
      ),
    ])

    await Promise.all([
      tgChats.addUserToChat(upsertedUser.uuid, upsertedChat.uuid),
      tgChats.upsertSettings({
        tgChatUuid: upsertedChat.uuid,
        isActive: true,
        isActiveToggledAt: new Date(),
        leaderboardStartedAt: new Date(),
      }),
    ])

    ctx.user = upsertedUser
    ctx.tgChat = upsertedChat

    return next()
  },
)
