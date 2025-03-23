import { Bot as TgBot, Context, SessionFlavor } from 'grammy'
import {
  Conversation,
  ConversationFlavor,
  conversations,
} from '@grammyjs/conversations'
import { hydrateReply, ParseModeFlavor } from '@grammyjs/parse-mode'
import { hydrate, HydrateFlavor } from '@grammyjs/hydrate'
import { MenuFlavor } from '@grammyjs/menu'
import { createSession, Session } from '@/bot/session'
import { CONVO_STORAGE_ID, ConvoStorage } from '@/bot/ramConvoStorage'
import { config } from '@/config'
import { Injectable, TgChatSelect, TgUserSelect } from '@repo/core'

export type BotCtxExtra = {
  user?: TgUserSelect
  tgChat?: TgChatSelect
}

export type BotCtx = ParseModeFlavor<
  HydrateFlavor<
    ConversationFlavor<Context & SessionFlavor<Session> & MenuFlavor>
  >
> &
  BotCtxExtra

export type Convo = Conversation<BotCtx, BotCtx>

@Injectable(CONVO_STORAGE_ID)
export class Bot {
  private readonly bot = new TgBot<BotCtx>(config.bot.token)

  constructor(convoStorage: ConvoStorage) {
    this.bot.catch(async (error) => {
      console.log(error.message)
    })
    this.bot.use(createSession())
    this.bot.use(
      conversations<BotCtx, BotCtx>({
        plugins: [hydrateReply, hydrate()],
        storage: convoStorage,
        onEnter(id, ctx) {
          convoStorage.add(ctx)
        },
        onExit(id, ctx) {
          convoStorage.delete(ctx)
        },
      }),
    )
    this.bot.use(hydrateReply)
    this.bot.use(hydrate())
  }

  getBot(): TgBot<BotCtx> {
    return this.bot
  }

  async onModuleInit(): Promise<void> {
    void this.bot.start()
  }
}
