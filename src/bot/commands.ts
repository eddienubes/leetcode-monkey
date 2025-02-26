import { createHandler } from '@/bot/createHandler'
import { createConversation } from '@grammyjs/conversations'
import { Context, InputFile } from 'grammy'
import dedent from 'dedent'
import { BotCtx, Convo } from '@/bot/Bot'
import { fmt, link } from '@grammyjs/parse-mode'
import { LeetCodeApiClient } from '@/leetcode/LeetCodeApiClient'

export const signUpCommand = createHandler(
  async (bot, lcApi: LeetCodeApiClient) => {
    const name = 'signup'
    const convoImpl = async (convo: Convo, ctx: BotCtx) => {
      const message = fmt`
Let's connect your ${link('LeetCode', 'https://leetcode.com')} account! 👋
Please send me your ${link('username', 'https://leetcode.com/profile')} or profile URL.
    `
      await ctx.replyFmt(message, {
        link_preview_options: {
          is_disabled: true,
        },
      })
      // await ctx.api.sendAnimation(
      //   reply.chat.id,
      //   new InputFile('./src/assets/signup.gif'),
      //   {
      //     width: 1920,
      //     height: 1080,
      //     caption: 'hello world',
      //   },
      // )

      const urlCtx = await convo.waitFor('message:text', {
        maxMilliseconds: 60 * 1000, // 1 minute
      })

      try {
        const url = new URL(urlCtx.message.text)
        const [domain, userSlug] = url.toString().split('/u/')
        const submissions = convo.external(
          async () => await lcApi.getAcceptedSubmissions(userSlug),
        )
        console.log(submissions)
      } catch (e) {
        const submissions = convo.external(
          async () => await lcApi.getAcceptedSubmissions(urlCtx.message.text),
        )
        console.log(submissions)
      }
    }

    bot.use(createConversation(convoImpl, name))

    bot.command(['sign', 'sing', 'connect'], async (ctx) => {
      await ctx.conversation.enter(name)
    })
  },
)
