import { config } from '@/config'
import { Bot as TgBot, Context, session, SessionFlavor } from 'grammy'
import {
  Conversation,
  ConversationFlavor,
  conversations,
  uniformStorage,
} from '@grammyjs/conversations'
import { hydrateReply, ParseModeFlavor } from '@grammyjs/parse-mode'
import { hydrate, HydrateFlavor } from '@grammyjs/hydrate'
import { createSession, Session } from '@/bot/session'
import { MenuFlavor } from '@grammyjs/menu'
import { FileAdapter } from '@grammyjs/storage-file'
import { createRamStorage } from '@/bot/ramStorage'

export type BotCtx = ParseModeFlavor<
  HydrateFlavor<
    ConversationFlavor<Context & SessionFlavor<Session> & MenuFlavor>
  >
>

export type Convo = Conversation<BotCtx, BotCtx>

export class Bot {
  private readonly bot = new TgBot<BotCtx>(config.bot.token)

  constructor() {
    this.bot.use(createSession())
    this.bot.use(
      conversations<BotCtx, BotCtx>({
        plugins: [hydrateReply, hydrate()],
        storage: createRamStorage(),
      }),
    )
    this.bot.use(hydrateReply)
    this.bot.use(hydrate())
  }

  getBot(): TgBot<BotCtx> {
    return this.bot
  }

  async onModuleInit(): Promise<void> {
    await this.bot.start()
  }
}
