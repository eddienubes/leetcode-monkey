import { config } from '@/config'
import { Bot as TgBot } from 'grammy'

export class Bot {
  private readonly bot = new TgBot(config.bot.token)

  getBot(): TgBot {
    return this.bot
  }

  async onModuleInit(): Promise<void> {
    await this.bot.start()
  }
}
