import { VersionedState } from '@grammyjs/conversations/out/storage'
import { ConversationStorage } from '@grammyjs/conversations'
import { BotCtx } from '@/bot/Bot'

export type ConvoStorage<S = any> = ConversationStorage<BotCtx, S> & {
  getAll: () => unknown[]
  has: (ctx: BotCtx) => boolean
  delete: (ctx: BotCtx) => void
  add: (ctx: BotCtx) => void
}

/**
 * Creates a ram convo storage to disambiguate conversations between bot and multiple users in the same chat group
 */
export const createRamConvoStorage = <S>(): ConvoStorage<S> => {
  // stores the state of conversations between replays
  const stateStore = new Map<string, VersionedState<S>>()
  const registry = new Set()

  const getStorageKey = (ctx: BotCtx) => `${ctx.chat?.id}-${ctx.from?.id}`

  return {
    version: undefined,
    type: 'key',
    getStorageKey,
    getAll: () => Array.from(registry.values()),
    add: (ctx) => registry.add(getStorageKey(ctx)),
    has: (ctx) => registry.has(getStorageKey(ctx)),
    delete: (ctx) => registry.delete(getStorageKey(ctx)),
    adapter: {
      read: (key) => {
        return stateStore.get(key)
      },
      write: (key, state) => {
        stateStore.set(key, state)
      },
      delete: (key) => {
        stateStore.delete(key)
      },
    },
  }
}
