import { BotCtx } from '@/bot/Bot'
import { TgMemberStatus } from '@repo/core'
import { NextFunction } from 'grammy'

export const isTgChatAdminByStatus = (status: TgMemberStatus): boolean => {
  const tgAdminStatuses = ['administrator', 'creator']
  return tgAdminStatuses.includes(status)
}

export const isAdmin = async (ctx: BotCtx): Promise<boolean> => {
  const author = await ctx.getAuthor()
  return isTgChatAdminByStatus(author.status)
}

/**
 * TODO: Fix, doesn't work when the reply message is deleted
 * @param ctx
 * @param next
 */
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

/**
 * Parses grammy menu cb data.
 * https://github.com/grammyjs/menu/blob/c276d79a93c9318aeb900fbe9c092e24a2dae642/src/menu.ts#L889
 * @param cbData
 */
export const extractMenuDataFromCb = (
  cbData: string,
): {
  id: string
  rowStr: string
  colStr: string
  payload: string
  rest: string[]
} => {
  const [id, rowStr, colStr, payload, ...rest] = cbData.split(':')
  return {
    id,
    rowStr,
    colStr,
    payload,
    rest,
  }
}
