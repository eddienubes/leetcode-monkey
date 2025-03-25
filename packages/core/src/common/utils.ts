import crypto from 'node:crypto'
import type { ToJsonType } from './types'

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

export const arrToHashTags = (arr: string[]): string => {
  return arr
    .map((item) => {
      const hashTag = item.replaceAll('-', '')
      return `#${hashTag}`
    })
    .join(' ')
}

export const isConstructorFunction = (
  value: unknown,
): value is new (...args: any[]) => any => {
  const isFunction = typeof value === 'function'
  // @ts-ignore ts doesn't know about the prototype property, since it's unknown
  const isClass = value?.prototype && value?.prototype?.constructor === value

  return isFunction && isClass
}
