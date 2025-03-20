'use server'
import { GoogleAuthService } from '@repo/core'

const auth = new GoogleAuthService()

export const exchangeCode = async (code: string): Promise<string> => {
  const tokens = await auth.exchangeAuthCode(code)

  if (!tokens.access_token) {
    throw new Error('No access token received from Google')
  }

  return tokens.access_token
}
