import crypto from 'node:crypto'
import { ToJsonType } from '@/common/types'

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
