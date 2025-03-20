import { BotCtx } from '@/bot/Bot'
import { TgMemberStatus } from '@repo/core'
import { NextFunction } from 'grammy'

export const isTgChatAdmin = (status: TgMemberStatus): boolean => {
  return status === 'administrator' || status === 'creator'
}

export const isMenuOwner = async (ctx: BotCtx, next: NextFunction) => {
  const menuMsg = ctx.callbackQuery?.message
  const originalMsg = menuMsg?.reply_to_message

  if (!originalMsg || !ctx.callbackQuery) {
    return next() // Allow - no menu
  }

  if (originalMsg?.from?.id === ctx.from?.id) {
    return next() // Allow - same user
  } else {
    return ctx.answerCallbackQuery("This menu isn't for you, sorry")
  }
}

export const buildMentionNameFromCtx = (ctx: BotCtx): string => {
  const messageFrom = ctx.message?.from || ctx.callbackQuery?.from

  const username = messageFrom?.username || ''
  const firstName = messageFrom?.first_name || ''
  const lastName = messageFrom?.last_name || ''

  const name = username || `${firstName} ${lastName}`.trim()

  return name
}

export const noopCbAnswer = async (ctx: BotCtx): Promise<void> => {
  await ctx.answerCallbackQuery()
}
