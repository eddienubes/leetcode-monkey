import { MemorySessionStorage, session } from 'grammy'
import { BotCtx } from '@/bot/Bot'

export type Session = {
  leaderboardPage?: number
}

/**
 * Per chat per user session.
 */
export const createSession = () => {
  return session<Session, BotCtx>({
    initial: () => ({}),
    getSessionKey: (ctx) => `${ctx.chat?.id || ctx.from?.id}`,
    storage: new MemorySessionStorage<Session>(60 * 60 * 1000), // 1-hour TTL
  })
}
