import { session } from 'grammy'
import { BotCtx } from '@/bot/Bot'

export type Session = {
  convos: {
    toExit: string[]
  }
}

export const createSession = () => {
  return session<Session, BotCtx>({
    initial: () => ({
      convos: {
        toExit: [],
      },
    }),
  })
}
