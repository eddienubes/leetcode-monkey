import { createHandler } from '@/bot/handle'
import { createConversation } from '@grammyjs/conversations'
import { BotCtx, Convo } from '@/bot/Bot'
import { bold, fmt, link, mentionUser } from '@grammyjs/parse-mode'
import { LeetCodeApiClient } from '@/leetcode/LeetCodeApiClient'
import { createConvoHelper } from '@/bot/convoHelper'
import { LeetCodeUsersDao } from '@/leetcode-users/LeetCodeUsersDao'
import { TgChatsDao } from '@/tg/TgChatsDao'

export const connectLcCommand = createHandler(
  async (
    bot,
    lcApi: LeetCodeApiClient,
    lcUsersDao: LeetCodeUsersDao,
    tgChatsDao: TgChatsDao,
  ) => {
    const name = 'connect'

    const convoImpl = async (convo: Convo, ctx: BotCtx) => {
      const helper = await createConvoHelper(convo)

      const message = fmt`
Let's connect your ${link('LeetCode', 'https://leetcode.com')} account! 👋
Please send me your ${link('username', 'https://leetcode.com/profile')} or profile URL.
    `
      const messagesToDelete: number[] = await convo.external(async () => [
        ctx.message?.message_id!,
      ])

      const menu = convo.menu().text('Cancel', async (ctx) => {
        await ctx.deleteMessages(messagesToDelete)
        helper.abort()
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
        timeoutMs: 300 * 1000, // 1 minute
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

          const submissions = await lcApi.getProfile(userSlug)

          messagesToDelete.push(ctx.message.message_id)

          return submissions
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

      const tgChat = await tgChatsDao.getByTgId(ctx.chatId?.toString()!)

      const lcUser = await lcUsersDao.upsert({
        slug: profile.matchedUser.username,
        realName: profile.matchedUser.profile.realName,
        avatarUrl: profile.matchedUser.profile.userAvatar,
      })

      await lcUsersDao.upsertTgChatReference({
        leetcodeUserUuid: lcUser.uuid,
        tgChatUuid: tgChat.uuid,
        isActive: false,
      })

      const username = ctx.message?.from?.username || ''
      const firstName = ctx.message?.from?.first_name || ''
      const lastName = ctx.message?.from?.last_name || ''
      const name = username || `${firstName} ${lastName}`.trim()

      await ctx.replyFmt(
        fmt`Connected! Now ${bold(profile.matchedUser.profile.realName)} (${mentionUser(name, ctx.message!.from.id)}) will get notifications for their LeetCode submissions. 🎉`,
      )
    }

    bot.use(createConversation(convoImpl, name))

    bot.command(['sign', 'sing', 'connect'], async (ctx) => {
      await ctx.conversation.exitAll()
      await ctx.conversation.enter(name)
    })
  },
)

export const disconnectLcCommand = createHandler(
  async (bot, lcUsersDao: LeetCodeUsersDao, tgChatsDao: TgChatsDao) => {
    const name = 'disconnect'
    const convoImpl = async (convo: Convo, ctx: BotCtx) => {
      // const helper = createConvoHelper(convo)
    }

    bot.use(createConversation(convoImpl, name))

    bot.command(['disconnect', 'signout'], async (ctx) => {
      await ctx.conversation.enter(name)
    })
  },
)
