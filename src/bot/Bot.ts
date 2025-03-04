import { config } from '@/config'
import { Bot as TgBot, Context, SessionFlavor } from 'grammy'
import {
  Conversation,
  ConversationFlavor,
  conversations,
} from '@grammyjs/conversations'
import { hydrateReply, ParseModeFlavor } from '@grammyjs/parse-mode'
import { hydrate, HydrateFlavor } from '@grammyjs/hydrate'
import { createSession, Session } from '@/bot/session'
import { MenuFlavor } from '@grammyjs/menu'
import { ConvoStorage } from '@/bot/ramConvoStorage'
import { TgUserSelect } from '@/tg/TgUsersDao'
import { TgChatSelect, TgUsersToTgChatsSelect } from '@/tg/TgChatsDao'

export type BotCtxExtra = {
  user?: TgUserSelect
  tgChat?: TgChatSelect
  userToChat?: TgUsersToTgChatsSelect
}

export type BotCtx = ParseModeFlavor<
  HydrateFlavor<
    ConversationFlavor<Context & SessionFlavor<Session> & MenuFlavor>
  >
> &
  BotCtxExtra

export type Convo = Conversation<BotCtx, BotCtx>

export class Bot {
  private readonly bot = new TgBot<BotCtx>(config.bot.token)

  constructor(convoStorage: ConvoStorage) {
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
