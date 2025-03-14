import { ToJsonType } from '@/common/types'
import { BotCtx } from '@/bot/Bot'
import crypto from 'node:crypto'
import { TgMemberStatus } from '@/bot/types'
import { NextFunction } from 'grammy'

export const sleepForRandomMs = (min: number, max: number): Promise<void> => {
  const randomMs = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise((resolve) => setTimeout(resolve, randomMs))
}

export const randomAlphaNumStr = (length: number): string => {
  return crypto.randomBytes(length).toString('base64')
}

export const randomInt = (min = 0, max = Number.MAX_SAFE_INTEGER): number => {
  return crypto.randomInt(min, max)
}

export const unixTimestampToDate = (timestamp: number | string): Date => {
  if (typeof timestamp === 'string') {
    timestamp = parseInt(timestamp, 10)

    if (isNaN(timestamp)) {
      throw new Error(`Invalid timestamp: ${timestamp}`)
    }
  }

  return new Date(timestamp * 1000)
}

/**
 * Used to make typescript happy since bullmq serializes under the hood anyway.
 * @param obj
 */
export const fakeSerialize = <T>(obj: T): ToJsonType<T> => {
  return obj as ToJsonType<T>
}

export const getDatePlusDays = (days: number, jitter = false): Date => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setTime(
    date.getTime() +
      (jitter ? randomInt(-1000 * 60 * 60 * 24, 1000 * 60 * 60 * 24) : 0),
  )
  return date
}

export const diffInHours = (date1: Date, date2: Date): number => {
  const diff = date2.getTime() - date1.getTime()
  return Math.floor(diff / (1000 * 60 * 60))
}

export const diffInWeeks = (date1: Date, date2: Date): number => {
  const diff = date2.getTime() - date1.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7))
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

export const parseIntOrDefault = (
  str: string | undefined | null,
  defaultValue: number,
): number => {
  if (!str) {
    return defaultValue
  }

  const parsed = parseInt(str, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Increment string integer
 * @param str
 * @param inc
 */
export const incStrInt = (
  str: string | undefined | null | number,
  inc = 1,
): string => {
  if (!str) {
    return inc.toString()
  }

  const parsed = parseInt(str.toString(), 10)
  return isNaN(parsed) ? inc.toString() : (parsed + inc).toString()
}

export const noop = (): void => {
  // noop
}

export const noopCbAnswer = async (ctx: BotCtx): Promise<void> => {
  await ctx.answerCallbackQuery()
}

export const arrToHashTags = (arr: string[]): string => {
  return arr
    .map((item) => {
      const hashTag = item.replaceAll('-', '')
      return `#${hashTag}`
    })
    .join(' ')
}

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
