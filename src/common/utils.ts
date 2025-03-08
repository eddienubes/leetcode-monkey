import crypto from 'node:crypto'
import { ToJsonType } from '@/common/types'

export const sleepForRandomMs = (min: number, max: number): Promise<void> => {
  const randomMs = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise((resolve) => setTimeout(resolve, randomMs))
}

export const randomAlphaNumStr = (length: number): string => {
  return crypto.randomBytes(length).toString('base64')
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
