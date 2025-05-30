import { createHandler } from '@/bot/handler'
import { createConversation } from '@grammyjs/conversations'
import { BotCtx, BotCtxExtra, Convo } from '@/bot/Bot'
import {
  bold,
  fmt,
  FormattedString,
  italic,
  link,
  mentionUser,
} from '@grammyjs/parse-mode'
import { createConvoHelper } from '@/bot/convoHelper'
import { tgUsersMiddleware } from '@/bot/middlewares'
import { createPagination, getPerMessageNamespace } from '@/bot/pagination'
import { Menu } from '@grammyjs/menu'
import { Context, InlineKeyboard } from 'grammy'
import {
  buildMentionNameFromCtx,
  isAdmin,
  isMenuOwner,
  isTgChatAdminByStatus,
} from '@/bot/utils'
import {
  arrToHashTags,
  diffInWeeks,
  getDatePlusDays,
  LC_DIFFEMOJI,
  LcApiClient,
  LcProblemsService,
  LcUsersDao,
  Memo,
  noop,
  TgChatsDao,
  TgUsersDao,
  SpreadsheetsConnector,
  GoogleSpreadsheetsDao,
  LcSpreadsheetsWriter,
} from '@repo/core'
import { Chat } from 'grammy/types'

const commandsChatScope = [
  'private',
  'group',
  'supergroup',
] as const satisfies Chat['type'][]

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
Let's connect your ${link('LeetCode', 'https://leetcode.com')} account! 👋
Please send me your ${link('username', 'https://leetcode.com/profile')} or profile URL.
    `
      const messagesToDelete: number[] = await convo.external(async () => [
        ctx.message?.message_id!,
      ])

      const menu = convo.menu().text('Cancel', async (ctx) => {
        helper.abort()
        await ctx.deleteMessages(messagesToDelete).catch(noop)
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
          // const msg = await ctx.replyFmt(
          //   fmt`I couldn't find your profile. Please try again.`,
          //   {
          //     reply_to_message_id: ctx.message.message_id,
          //   },
          // )
          // messagesToDelete.push(msg.message_id, ctx.message.message_id)
        },
        finally: async (ctx) => {
          await ctx.deleteMessages(messagesToDelete).catch(noop)
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

        await lcUsersDao.upsertLcUserInChat({
          lcUserUuid: lcUser.uuid,
          tgUserUuid: tgUser.uuid,
          tgChatUuid: tgChat.uuid,
          isNotificationsEnabled: true,
          isNotificationsEnabledToggledAt: new Date(),
          isConnected: true,
          isConnectedToggledAt: new Date(),
        })
      })

      await ctx.replyFmt(
        fmt`Connected! ${mentionUser(buildMentionNameFromCtx(ctx), ctx.message!.from.id)} added their LeetCode account 🎉`,
      )
    }

    const m = await tgUsersMiddleware(convoStorage, tgUsersDao, tgChatsDao)

    bot.filter(
      Context.has.chatType(commandsChatScope),
      createConversation(convoImpl, name),
    )

    bot
      .chatType(commandsChatScope)
      .command(['sign', 'sing', 'connect'], m, async (ctx) => {
        await ctx.conversation.exitAll()
        await ctx.conversation.enter(name, {
          user: ctx.user!,
          tgChat: ctx.tgChat!,
        } satisfies BotCtxExtra)
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
          getDatePlusDays(new Date(), -7).getTime(),
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
            week: diffInWeeks(new Date(chatSettings.leaderboardStartedAt), now),
            hits: lb.hits,
          },
        }
      },
      render: async (ctx, fetch, page) => {
        return fmt`
🔥${bold(`Leaderboard - Week ${fetch.items.week + 1}`)}
${
  fetch.items.hits
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
    .join('\n')
    .trim() || "It's so empty here. 😔"
}
        `
      },
      update: async (ctx, fetch, page, render) => {
        await ctx.editFmtMessageText(render)
      },
    })

    bot.filter(Context.has.chatType(commandsChatScope), m, pag.menu)

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

export const dailyCommand = createHandler(
  async (bot, convoStorage, lcApi: LcApiClient) => {
    bot.command(['daily', 'dly'], async (ctx) => {
      const daily = await lcApi.getDaily()
      const question = daily.question

      if (!daily) {
        return ctx.replyFmt(fmt`No daily challenge found.`)
      }

      const message = fmt`
🌼 You daily challenge!
${LC_DIFFEMOJI[question.difficulty]} ${link(question.title, LcProblemsService.getLcProblemUrl(question.titleSlug))}
${arrToHashTags(question.topicTags.map((t) => t.slug))}
`
      await ctx.replyFmt(message, {
        reply_to_message_id: ctx.message?.message_id,
        link_preview_options: {
          is_disabled: true,
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Get it 🚀',
                url: LcProblemsService.getLcProblemUrl(question.titleSlug),
              },
            ],
          ],
        },
      })
    })
  },
)

export const helpCommand = createHandler(async (bot) => {
  bot.chatType(commandsChatScope).command(['help', 'start'], async (ctx) => {
    if (ctx.match.includes('spreadsheet')) {
      await ctx.replyFmt(fmt`
     🎉 Connected spreadsheet! Now return to your chat and try solving a few LeetCode problems, and check your spreadsheet again later.
      `)
      return
    }

    const message = fmt`
Hey, I'm a ${bold('LeetCode Monkey')}! 👋
I make learning algorithms and data structures more fun.
I'm also ${link('open-source', 'https://github.com/eddienubes/leetcode-monkey')}!

${bold('How to use me?')}
1. Connect your LeetCode account with /connect command to receive notifications.
2. Encourage your top performers with /leaderboard.
3. ${bold('NEW!')} Connect Google /spreadsheet to further track your progress!
4. Get /daily challenges.
5. Manage your notification /settings and more.
6. You have suggestions? Just /feedback me!

Additionally, you can promote me to an admin to keep your chat nice and clean.

That's it! 🎉

${italic('by @carny_plant for FLG')}
    `

    await ctx.replyFmt(message, {
      link_preview_options: {
        is_disabled: true,
      },
      reply_to_message_id: ctx.message?.message_id,
    })
  })
})

export const feedbackCommand = createHandler(async (bot) => {
  bot.chatType(commandsChatScope).command(['feedback', 'fb'], async (ctx) => {
    const message = fmt`
Hi! I love feedback. ❤️
Message me with your suggestions, bugs, or anything you want to share at @carny_plant.
`

    await ctx.replyFmt(message, {
      reply_to_message_id: ctx.message?.message_id,
      link_preview_options: {
        is_disabled: true,
      },
    })
  })
})

export const settingsCommand = createHandler(
  async (
    bot,
    convoStorage,
    lcUsersDao: LcUsersDao,
    tgUsersDao: TgUsersDao,
    tgChatsDao: TgChatsDao,
  ) => {
    const m = await tgUsersMiddleware(convoStorage, tgUsersDao, tgChatsDao)
    const memo = new Memo()

    const disconnectMenuConfirmationName = 'lc-dis-c'
    const mainMenuName = 'settings'
    const disconnectMenuConfirmation = new Menu<BotCtx>(
      disconnectMenuConfirmationName,
    )
      .text(`Yes`, async (ctx) => {
        const tgChat = ctx.tgChat!
        const tgUser = ctx.user!

        await lcUsersDao.disconnectLcUserFromUserInChat(
          tgUser.uuid,
          tgChat.uuid,
        )

        await ctx.replyFmt(
          fmt`Disconnected! ${mentionUser(buildMentionNameFromCtx(ctx), ctx.from.id)} removed their LeetCode account. 😔
`,
        )
        const messageId =
          ctx.callbackQuery.message?.reply_to_message?.message_id
        if (messageId) {
          await ctx.deleteMessages([messageId]).catch(noop)
        }
        ctx.menu.close()
      })
      .text(`No`, async (ctx) => {
        ctx.menu.back()
      })

    const menu = new Menu<BotCtx>(mainMenuName).dynamic(async (ctx, range) => {
      const tgChat = ctx.tgChat!
      const tgUser = ctx.user!

      const namespace = getPerMessageNamespace(ctx)
      const payload = await memo.run(
        namespace,
        async (cacheKey) => {
          const lcUser = await lcUsersDao.getLcUserInChat(
            ctx.user!.uuid,
            ctx.tgChat!.uuid,
          )
          const chatSettings = await tgChatsDao.getSettings(tgChat.uuid)
          const member = await ctx.getChatMember(ctx.from!.id)
          return {
            lcUser,
            member,
            chatSettings,
          }
        },
        ctx.match || '',
      )

      if (payload.lcUser.lcUserInChat.isNotificationsEnabled) {
        range.text(
          {
            text: `🔔 Submission notifications`,
            payload: 'disable',
          },
          async (ctx) => {
            await lcUsersDao.updateLcUserInChat(tgChat.uuid, tgUser.uuid, {
              isNotificationsEnabled: false,
              isNotificationsEnabledToggledAt: new Date(),
            })
            ctx.match = 'enabled'
            ctx.menu.update()
          },
        )
      }

      if (!payload.lcUser.lcUserInChat.isNotificationsEnabled) {
        range.text(
          {
            text: `🔕 Submission notifications`,
            payload: 'enable',
          },
          async (ctx) => {
            await lcUsersDao.updateLcUserInChat(tgChat.uuid, tgUser.uuid, {
              isNotificationsEnabled: true,
              isNotificationsEnabledToggledAt: new Date(),
            })
            ctx.match = 'disabled'
            ctx.menu.update()
          },
        )
      }

      range.row()

      if (
        isTgChatAdminByStatus(payload.member.status) &&
        payload.chatSettings.isNotificationsEnabled
      ) {
        range.text(
          {
            text: `🔔 Chat-wide submission notifications`,
            payload: 'disable-chat-wide',
          },
          async (ctx) => {
            await tgChatsDao.upsertSettings(
              {
                tgChatUuid: tgChat.uuid,
                isNotificationsEnabled: false,
                isNotificationsEnabledToggledAt: new Date(),
                leaderboardStartedAt: new Date(),
              },
              {
                isNotificationsEnabled: false,
                isNotificationsEnabledToggledAt: new Date(),
              },
            )

            ctx.match = 'disabled-chat-wide'
            ctx.menu.update()
          },
        )
      }

      if (
        isTgChatAdminByStatus(payload.member.status) &&
        !payload.chatSettings.isNotificationsEnabled
      ) {
        range.text(
          {
            text: `🔕 Chat-wide submission notifications`,
            payload: 'enable-chat-wide',
          },
          async (ctx) => {
            await tgChatsDao.upsertSettings(
              {
                tgChatUuid: tgChat.uuid,
                isNotificationsEnabled: true,
                isNotificationsEnabledToggledAt: new Date(),
                leaderboardStartedAt: new Date(),
              },
              {
                isNotificationsEnabled: true,
                isNotificationsEnabledToggledAt: new Date(),
              },
            )

            ctx.match = 'enabled-chat-wide'
            ctx.menu.update()
          },
        )
      }

      range.row()

      range.submenu(
        '🚶Disconnect',
        disconnectMenuConfirmationName,
        async (innerCtx) => {
          await innerCtx.editFmtMessageText(
            `Are you sure you want to disconnect your ${bold('LeetCode')} account?`,
          )
        },
      )
    })

    menu.register(disconnectMenuConfirmation)
    bot.filter(Context.has.chatType(commandsChatScope), m, isMenuOwner, menu)

    bot.chatType(commandsChatScope).command(['settings'], async (ctx) => {
      const tgChat = ctx.tgChat!
      const tgUser = ctx.user!
      const member = await ctx.getChatMember(ctx.from!.id)
      const lcUser = await lcUsersDao.getLcUserInChat(tgUser.uuid, tgChat.uuid)

      if (!lcUser || !lcUser.lcUserInChat.isConnected) {
        return ctx.replyFmt(
          fmt`You haven't connected your account yet. Use /connect command or /help for more info.`,
          {
            reply_to_message_id: ctx.message?.message_id,
            link_preview_options: {
              is_disabled: true,
            },
          },
        )
      }

      await ctx.replyFmt(
        fmt`
${bold('Your settings')} ${isTgChatAdminByStatus(member.status) ? italic('- Admin access granted') : ''}

      `,
        {
          reply_to_message_id: ctx.message?.message_id,
          reply_markup: menu,
        },
      )
    })
  },
)

export const disconnectLcCommand = createHandler(
  async (
    bot,
    convoStorage,
    lcUsersDao: LcUsersDao,
    tgUsersDao: TgUsersDao,
    tgChatsDao: TgChatsDao,
  ) => {
    const m = await tgUsersMiddleware(convoStorage, tgUsersDao, tgChatsDao)

    bot
      .chatType(commandsChatScope)
      .command(['disconnect', 'signout'], m, async (ctx, next) => {
        const tgChat = ctx.tgChat!
        const tgUser = ctx.user!

        await lcUsersDao.disconnectLcUserFromUserInChat(
          tgUser.uuid,
          tgChat.uuid,
        )

        const username = ctx.message?.from?.username || ''
        const firstName = ctx.message?.from?.first_name || ''
        const lastName = ctx.message?.from?.last_name || ''
        const name = username || `${firstName} ${lastName}`.trim()

        await ctx.replyFmt(
          fmt`Disconnected! ${mentionUser(name, ctx.message!.from.id)}, you won't get notifications for your lc submissions anymore and your progress won't be tracked.
Sorry to see you go! 😔
`,
          {
            reply_to_message_id: ctx.message?.message_id,
          },
        )
      })
  },
)

export const spreadsheetCommand = createHandler(
  async (
    bot,
    convoStorage,
    tgUsers: TgUsersDao,
    tgChatsDao: TgChatsDao,
    spreadsheetsConnector: SpreadsheetsConnector,
    googleSpreadsheetDao: GoogleSpreadsheetsDao,
  ) => {
    const m = await tgUsersMiddleware(convoStorage, tgUsers, tgChatsDao)
    const memo = new Memo({
      ttlMs: SpreadsheetsConnector.spreadsheetConnectionSessionExpireTimeMs,
    })
    const getDisconnectMsg = (sheetName: string): FormattedString =>
      fmt`${bold(sheetName)} is already attached! Would you like to disconnect it?`

    const ssDisconnectConfirmMenuName = 'ss-conn-conf'
    const ssDisconnectConfirmMenu = new Menu<BotCtx>(
      ssDisconnectConfirmMenuName,
    )
      .text('Yes', async (ctx) => {
        const tgChat = ctx.tgChat!
        const msg = ctx.callbackQuery.message!
        await spreadsheetsConnector.disconnectByTgChatUuid(tgChat.uuid)
        const text = `Disconnected! Removed spreadsheet from your chat!`
        await ctx
          .deleteMessages([msg.message_id, msg.reply_to_message?.message_id!])
          .catch(noop)

        await ctx.replyFmt(text)
        ctx.menu.close()
      })
      .text('No', async (ctx) => {
        const msg = ctx.callbackQuery.message!
        const sheet = await googleSpreadsheetDao.getByTgChatUuidIfAny(
          ctx.tgChat!.uuid,
        )

        await ctx
          .deleteMessages([msg.message_id, msg.reply_to_message?.message_id!])
          .catch(async () => {
            if (sheet) {
              await ctx.editFmtMessageText(
                getDisconnectMsg(sheet.spreadsheetName),
              )
            }
            ctx.menu.back()
          })
      })
    const disconnectSheetMenuName = 'ss-connect'
    const disconnectSheetMenu = new Menu<BotCtx>(
      disconnectSheetMenuName,
    ).submenu('🚶Disconnect', ssDisconnectConfirmMenuName, async (ctx) => {
      const tgChat = ctx.tgChat!
      const sheet = await googleSpreadsheetDao.getByTgChatUuidIfAny(tgChat.uuid)

      if (!sheet) {
        ctx.menu.close()
        return
      }

      await ctx.editFmtMessageText(
        fmt`Are you sure you want to disconnect ${bold(sheet.spreadsheetName)} from this chat?`,
      )
    })

    disconnectSheetMenu.register(ssDisconnectConfirmMenu)

    bot
      .filter(Context.has.chatType(commandsChatScope))
      .filter(isAdmin, isMenuOwner, m, disconnectSheetMenu)

    bot
      .filter(Context.has.chatType(commandsChatScope))
      .filter(isAdmin)
      .command(['spreadsheet', 'ss'], m, async (ctx) => {
        const tgChat = ctx.tgChat!
        const tgUser = ctx.user!

        const sheet = await googleSpreadsheetDao.getByTgChatUuidIfAny(
          tgChat.uuid,
        )

        if (sheet?.isConnected) {
          await ctx.replyFmt(getDisconnectMsg(sheet.spreadsheetName), {
            reply_to_message_id: ctx.message.message_id,
            reply_markup: disconnectSheetMenu,
            link_preview_options: {
              is_disabled: true,
            },
          })
          return
        }

        const fmtmsg = fmt`
Let's connect your spreadsheet! ${bold('LeetCode Monkey')} will write all submissions to a separate sheet/list called ${italic(LcSpreadsheetsWriter.submissionsSpreadsheetName)}!
Feel free to use this ${link('template', 'https://docs.google.com/spreadsheets/d/1fMDKZPZPZD83PK5_6InjhyNLYHue261x-ydw1reBVo4/edit?usp=sharing')} to begin with!
      `

        const msg = await ctx.replyFmt(fmtmsg, {
          reply_to_message_id: ctx.message.message_id,
        })

        const sessionId =
          await spreadsheetsConnector.createSpreadsheetConnectionSession({
            tgUserUuid: tgUser.uuid,
            tgChatUuid: tgChat.uuid,
            tgMessageId: msg.message_id.toString(),
          })

        const url =
          await spreadsheetsConnector.getSpreadsheetConnectUrl(sessionId)

        await msg.editText(fmtmsg.text, {
          entities: fmtmsg.entities,
          reply_markup: new InlineKeyboard([
            [
              {
                text: 'Connect',
                url: url.toString(),
              },
            ],
          ]),
          link_preview_options: {
            is_disabled: true,
          },
        })
      })
  },
)
