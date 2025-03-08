import crypto from 'node:crypto'

export const sleepForRandomMs = (min: number, max: number): Promise<void> => {
  const randomMs = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise((resolve) => setTimeout(resolve, randomMs))
}

export const randomAlphaNumStr = (length: number): string => {
  return crypto.randomBytes(length).toString('base64')
}
