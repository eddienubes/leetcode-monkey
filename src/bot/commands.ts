import { createHandler } from '@/bot/createHandler'

export const signUpCommand = createHandler(async (bot) => {
  bot.command(['sign', 'sing', 'connect'], async (ctx) => {
    await ctx.reply(`Let's connect your LeetCode account!`)
  })
})
