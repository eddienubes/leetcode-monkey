import { createHandler } from '@/bot/handler'
import { createConversation } from '@grammyjs/conversations'
import { BotCtx, BotCtxExtra, Convo } from '@/bot/Bot'
import { bold, fmt, link, mentionUser } from '@grammyjs/parse-mode'
import { LcApiClient } from '@/lc/LcApiClient'
import { createConvoHelper } from '@/bot/convoHelper'
import { LcUsersDao } from '@/lc-users/LcUsersDao'
import { TgChatsDao } from '@/tg/TgChatsDao'
import { tgUsersMiddleware } from '@/bot/middlewares'
import { TgUsersDao } from '@/tg/TgUsersDao'
import { createPagination } from '@/bot/pagination'
import { diffInWeeks, getDatePlusDays } from '@/common/utils'

export const connectLcCommand = createHandler(
  async (
    bot,
    convoStorage,
    lcApi: LcApiClient,
    lcUsersDao: LcUsersDao,
    tgUsersDao: TgUsersDao,
    tgChatsDao: TgChatsDao,
  ) => {
    const name = 'connect'

    const convoImpl = async (convo: Convo, ctx: BotCtx, extra: BotCtxExtra) => {
      const helper = await createConvoHelper(convo, convoStorage, ctx)

      const message = fmt`
Let's connect your ${link('LeetCode', 'https://lc.com')} account! 👋
Please send me your ${link('username', 'https://lc.com/profile')} or profile URL.
    `
      const messagesToDelete: number[] = await convo.external(async () => [
        ctx.message?.message_id!,
      ])

      const menu = convo.menu().text('Cancel', async (ctx) => {
        helper.abort()
        await ctx.deleteMessages(messagesToDelete)
      })

      {
        const msg = await ctx.replyFmt(message, {
          reply_markup: menu,
          reply_to_message_id: ctx.message?.message_id,
          link_preview_options: {
            is_disabled: true,
          },
        })

        messagesToDelete.push(msg.message_id)
      }

      // await ctx.api.sendAnimation(
      //   reply.chat.id,
      //   new InputFile('./src/assets/signup.gif'),
      //   {
      //     width: 1920,
      //     height: 1080,
      //     caption: 'hello world',
      //   },
      // )

      const profile = await helper.waitFor({
        event: 'message:text',
        maxAttempts: 3,
        timeoutMs: 60 * 1000, // 1 minute
        beforeTry: async (ctx) => {
          messagesToDelete.push(ctx.message.message_id)
          await ctx.react('👀')
        },
        try: async (ctx) => {
          const text = ctx.message.text

          let userSlug: string

          try {
            const url = new URL(text)
            const slug = url.toString().split('/u/')[1]?.replaceAll(/\//g, '')

            if (!slug) {
              return null
            }

            userSlug = slug
          } catch (e) {
            userSlug = text
          }

          const profile = await lcApi.getProfile(userSlug)

          if (!profile.matchedUser) {
            return null
          }

          messagesToDelete.push(ctx.message.message_id)

          return profile
        },
        catch: async (ctx) => {
          await ctx.react('👎')
          const msg = await ctx.replyFmt(
            fmt`I couldn't find your profile. Please try again.`,
            {
              reply_to_message_id: ctx.message.message_id,
            },
          )
          messagesToDelete.push(msg.message_id, ctx.message.message_id)
        },
        finally: async (ctx) => {
          await ctx.deleteMessages(messagesToDelete)
        },
      })

      await convo.external(async () => {
        const tgChat = extra.tgChat!
        const tgUser = extra.user!

        const lcUser = await lcUsersDao.upsert({
          slug: profile.matchedUser?.username!,
          realName: profile.matchedUser?.profile.realName,
          avatarUrl: profile.matchedUser?.profile.userAvatar,
        })

        await lcUsersDao.connectLcUserToUserInChat({
          lcUserUuid: lcUser.uuid,
          tgUserUuid: tgUser.uuid,
          tgChatUuid: tgChat.uuid,
          isActive: true,
          isActiveToggledAt: new Date(),
        })
      })

      const username = ctx.message?.from?.username || ''
      const firstName = ctx.message?.from?.first_name || ''
      const lastName = ctx.message?.from?.last_name || ''
      const name = username || `${firstName} ${lastName}`.trim()

      await ctx.replyFmt(
        fmt`Connected! Now ${bold(profile.matchedUser?.profile.realName!)} (${mentionUser(name, ctx.message!.from.id)}) will get notifications for their LeetCode submissions. 🎉`,
      )
    }

    const m = await tgUsersMiddleware(convoStorage, tgUsersDao, tgChatsDao)

    bot.use(createConversation(convoImpl, name))

    bot.command(['sign', 'sing', 'connect'], m, async (ctx) => {
      await ctx.conversation.exitAll()
      await ctx.conversation.enter(name, {
        user: ctx.user!,
        tgChat: ctx.tgChat!,
      } satisfies BotCtxExtra)
    })
  },
)

export const disconnectLcCommand = createHandler(
  async (
    bot,
    convoStorage,
    tgUsersDao: TgUsersDao,
    lcUsersDao: LcUsersDao,
    tgChatsDao: TgChatsDao,
  ) => {
    const m = await tgUsersMiddleware(convoStorage, tgUsersDao, tgChatsDao)

    bot.command(['disconnect', 'signout'], m, async (ctx) => {
      const tgChat = ctx.tgChat!
      const tgUser = ctx.user!

      await lcUsersDao.disconnectLcUserFromUserInChat(tgUser.uuid, tgChat.uuid)

      const username = ctx.message?.from?.username || ''
      const firstName = ctx.message?.from?.first_name || ''
      const lastName = ctx.message?.from?.last_name || ''
      const name = username || `${firstName} ${lastName}`.trim()

      await ctx.replyFmt(
        fmt`Disconnected! ${mentionUser(name, ctx.message!.from.id)}, you won't get notifications for your lc submissions anymore. 😔`,
      )
    })
  },
)

export const leaderboardCommand = createHandler(
  async (
    bot,
    convoStorage,
    tgUsersDao: TgUsersDao,
    tgChatsDao: TgChatsDao,
    lcUsersDao: LcUsersDao,
  ) => {
    const m = await tgUsersMiddleware(convoStorage, tgUsersDao, tgChatsDao)

    const limit = 10

    const pag = createPagination('ldb', {
      limit,
      fetch: async (ctx, page) => {
        const tgChat = ctx.tgChat!
        const chatSettings = await tgChatsDao.getSettings(tgChat.uuid)

        const [first, latestTs] = [
          chatSettings.leaderboardStartedAt.getTime(),
          getDatePlusDays(-7).getTime(),
        ].sort()

        const latestDate = new Date(latestTs)
        const now = new Date()

        const lb = await lcUsersDao.getLeaderboard(
          tgChat.uuid,
          latestDate,
          page * limit,
          limit,
        )

        return {
          total: lb.total,
          items: {
            week: diffInWeeks(latestDate, now),
            hits: lb.hits,
          },
        }
      },
      render: async (ctx, fetch, page) => {
        return fmt`
🔥${bold(`Leaderboard - Week ${fetch.items.week + 1}`)}
${fetch.items.hits
  .map((item, i) => {
    const mention =
      item.user.firstName ||
      item.user.username ||
      item.lcUser.realName ||
      item.lcUser.slug

    const emojimap: Record<number, string> = {
      0: '🥇',
      1: '🥈',
      2: '🥉',
    }

    i = i + limit * page

    const order = emojimap[i] || `${i + 1}.`

    return `${order} ${mentionUser(mention, parseInt(item.user.tgId, 10))} - ${item.easy}/${item.medium}/${item.hard} (+${item.score})`
  })
  .join('\n')}
        `
      },
      update: async (ctx, fetch, page, render) => {
        await ctx.editFmtMessageText(render)
      },
    })

    bot.use(m, pag.menu)

    bot.command(
      ['leaderboard', 'lederboard', 'lb', 'ld', 'scoreboard', 'rating'],
      async (ctx) => {
        await pag.run(ctx, async (ctx, fetch, render) => {
          await ctx.replyFmt(render, {
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: pag.menu,
          })
        })
      },
    )
  },
)
