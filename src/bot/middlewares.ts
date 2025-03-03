import { TgUsersDao } from '@/tg/TgUsersDao'
import { createMiddleware } from '@/bot/middleware'
import { TgChatsDao } from '@/tg/TgChatsDao'

export const tgUsersMiddleware = createMiddleware(
  async (ctx, next, convoStorage, tgUsers: TgUsersDao, tgChats: TgChatsDao) => {
    if (!ctx.from || !ctx.chatId) {
      return next()
    }

    const [user, chat] = await Promise.all([
      tgUsers.upsert({
        tgId: ctx.from.id.toString(),
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        isBot: ctx.from.is_bot,
        isPremium: ctx.from.is_premium,
        languageCode: ctx.from.language_code,
      }),
      tgChats.getByTgId(ctx.chatId.toString()),
    ])

    const userToChat = await tgChats.addUserToChat(user.uuid, chat.uuid)

    ctx.user = user
    ctx.tgChat = chat
    ctx.userToChat = userToChat

    return next()
  },
)
