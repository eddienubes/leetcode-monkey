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
import { Menu } from '@grammyjs/menu'
import { incStrInt, parseIntOrDefault } from '@/common/utils'
import { Memo } from '@/common/Memo'
import { PageCb } from '@/common/PageCb'

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
          console.log('try is called')
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
          console.log('finally is called')
          await ctx.deleteMessages(messagesToDelete)
        },
      })

      await convo.external(async () => {
        const lcUser = await lcUsersDao.upsert({
          slug: profile.matchedUser?.username!,
          realName: profile.matchedUser?.profile.realName,
          avatarUrl: profile.matchedUser?.profile.userAvatar,
        })

        await lcUsersDao.connectlcUserToUserInChat({
          lcUserUuid: lcUser.uuid,
          userInChatUuid: extra.userToChat!.uuid,
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
        userToChat: ctx.userToChat!,
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
      const userToChat = ctx.userToChat!

      await lcUsersDao.disconnectlcUserFromUserInChat(userToChat.uuid)

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

    const memo = new Memo()
    const leaderboardMenuName = 'leaderboard'
    const limit = 10

    const leaderboardMenu = new Menu<BotCtx>(leaderboardMenuName, {
      onMenuOutdated: false,
    }).dynamic(async (ctx, range) => {
      let page = parseIntOrDefault(ctx.match, 0)

      const tgChat = ctx.tgChat!
      const chatSettings = await tgChatsDao.getSettings(tgChat.uuid)

      // Dynamic cb is called twice per each callback query.
      // Once to reassemble the menu, and once to render it due to submenu
      // https://t.me/grammyjs/297229
      const leaderboard = await memo.run(
        async (chatUuid, since, offset, limit) => {
          return await lcUsersDao.getLeaderboard(chatUuid, since, offset, limit)
        },
        tgChat.uuid,
        chatSettings.leaderboardStartedAt,
        page * limit,
        limit,
      )

      const totalPages = Math.ceil(leaderboard.total / limit)

      console.log('Render dynamic menu', ctx.match, totalPages)

      if (totalPages <= 1) {
        return range
      }

      // first page
      if (!page) {
        range.text(
          {
            text: '➡️',
            payload: incStrInt(page, 1),
          },
          // leaderboardMenuName,
          (ctx) => {
            console.log(`Next page: ${ctx.match}`)
          },
        )
        return range
      }

      // in the middle
      if (page < totalPages) {
        range
          .submenu(
            {
              text: '⬅️',
              payload: incStrInt(page, -1),
            },
            leaderboardMenuName,
            (ctx) => {
              console.log(`Prev page: ${ctx.match}`)
            },
          )
          .submenu(
            {
              text: '➡️',
              payload: incStrInt(page, 1),
            },
            leaderboardMenuName,
            (ctx) => {
              console.log(`Next page: ${ctx.match}`)
            },
          )
        return range
      }

      // last page
      if (page === totalPages) {
        range.submenu(
          {
            text: '⬅️',
            payload: incStrInt(page, -1),
          },
          leaderboardMenuName,
          (ctx) => {
            console.log(`Prev page: ${ctx.match}`)
          },
        )
        return range
      }
    })

    bot.use(m, leaderboardMenu)

    bot.command(
      ['leaderboard', 'lederboard', 'lb', 'ld', 'scoreboard', 'rating'],
      m,
      async (ctx) => {
        await ctx.replyFmt(fmt`Leaderboard`, {
          reply_markup: leaderboardMenu,
          reply_to_message_id: ctx.message?.message_id,
        })
      },
    )
  },
)

export const testCommand = createHandler(
  async (
    bot,
    convoStorage,
    tgUsersDao: TgUsersDao,
    tgChatsDao: TgChatsDao,
    lcUsersDao: LcUsersDao,
  ) => {
    const m = await tgUsersMiddleware(convoStorage, tgUsersDao, tgChatsDao)

    const testMenuName = 'test-menu'
    const memo = new Memo()

    const menu = new Menu<BotCtx>(testMenuName, {
      onMenuOutdated: false,
    }).dynamic(async (ctx, range) => {
      console.log('Render dynamic menu', ctx.match)
      const cb = PageCb.fromMatch(ctx.match)

      const message = ctx.message || ctx.callbackQuery?.message

      const total = await memo.run(message?.message_id!, async () => {
        return 100
      })

      if (cb.page > 0) {
        range.submenu(
          {
            text: '⬅️',
            payload: cb.prev().toSkip(),
          },
          testMenuName,
          async (ctx) => {
            ctx.match = PageCb.fromMatch(ctx.match).toString()
          },
        )
      }

      if (cb.page < total) {
        range.submenu(
          {
            text: '➡️',
            payload: cb.next().toSkip(),
          },
          testMenuName,
          async (ctx) => {
            ctx.match = PageCb.fromMatch(ctx.match).toString()
          },
        )
      }
    })

    bot.use(m, menu)

    bot.command(['test'], m, async (ctx) => {
      await ctx.replyFmt(fmt`Test`, {
        reply_markup: menu,
        reply_to_message_id: ctx.message?.message_id,
      })
    })
  },
)
