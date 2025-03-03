import { VersionedState } from '@grammyjs/conversations/out/storage'
import { BotCtx } from '@/bot/Bot'
import { ConversationStorage } from '@grammyjs/conversations'

export type ConvoStorage<S = any> = ConversationStorage<BotCtx, S> & {
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
    add: (ctx) => registry.add(getStorageKey(ctx)),
    has: (ctx) => registry.has(getStorageKey(ctx)),
    delete: (ctx) => registry.delete(getStorageKey(ctx)),
    adapter: {
      read: (key) => {
        // console.log('Read from ram convo storage', key)
        return stateStore.get(key)
      },
      write: (key, state) => {
        // console.log('Write to ram convo storage', key)
        stateStore.set(key, state)
        registry.add(key)
      },
      delete: (key) => {
        // console.log('Delete from ram convo storage', key)
        stateStore.delete(key)
        registry.delete(key)
      },
    },
  }
}
