import { VersionedState } from '@grammyjs/conversations/out/storage'
import { BotCtx } from '@/bot/Bot'
import { ConversationStorage } from '@grammyjs/conversations'

/**
 * Creates a ram convo storage to disambiguate conversations between bot and mltipler users in the same chat group
 */
export const createRamStorage = <S>(): ConversationStorage<BotCtx, S> => {
  const store = new Map<string, VersionedState<S>>()

  return {
    version: undefined,
    type: 'key',
    getStorageKey: (ctx) => {
      console.log(`${ctx.chat?.id}-${ctx.from?.id}`)
      return `${ctx.chat?.id}-${ctx.from?.id}`
    },
    adapter: {
      read: (key) => store.get(key),
      write: (key, state) => void store.set(key, state),
      delete: (key) => void store.delete(key),
    },
  }
}
