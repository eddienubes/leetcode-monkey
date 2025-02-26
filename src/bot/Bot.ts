import { config } from '@/config'
import { Bot as TgBot, Context } from 'grammy'
import {
  Conversation,
  ConversationFlavor,
  conversations,
} from '@grammyjs/conversations'
import { hydrateReply, ParseModeFlavor } from '@grammyjs/parse-mode'
import { hydrate, HydrateFlavor } from '@grammyjs/hydrate'

export type BotCtx = ParseModeFlavor<HydrateFlavor<ConversationFlavor<Context>>>
export type Convo = Conversation<BotCtx, BotCtx>

export class Bot {
  private readonly bot = new TgBot<BotCtx>(config.bot.token)

  constructor() {
    this.bot.use(
      conversations<BotCtx, BotCtx>({
        plugins: [hydrateReply, hydrate()],
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
