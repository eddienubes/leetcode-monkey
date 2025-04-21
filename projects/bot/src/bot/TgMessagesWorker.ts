import { Bot } from '@/bot/Bot'
import {
  DeleteMessageQueue,
  Injectable,
  JobOfQueue,
  EditMessageQueue,
  Lifecycle,
  createCronQueue,
  TgChatsDao,
} from '@repo/core'

@Injectable(Bot, TgChatsDao)
export class TgMessagesWorker implements Lifecycle {
  private readonly tgBot
  private readonly deleteMessageQueue = DeleteMessageQueue.connect(
    this.postponeMessageDeletion.bind(this),
  )
  private readonly editMessageQueue = EditMessageQueue.connect(
    this.editMessage.bind(this),
  )

  protected readonly inMemoryExpireCron = createCronQueue(
    'tg-delete-in-memory-expires-cron',
    this.inMemoryExpireTick.bind(this),
  )

  // Let's store batches in memory for now, since we don't have bullmq pro.
  // We could implement our own batch redis queue, but I'm not sure if it's worth it.
  /**
   * Map of chatId to an array of messages to delete.
   * @private
   */
  private readonly messagesToDelete = new Map<string, DeleteMessageQueue[]>()
  private readonly messageToDeleteMaxSize = 90

  constructor(
    private readonly bot: Bot,
    private readonly tgChatsDao: TgChatsDao,
  ) {
    this.tgBot = bot.getBot()
  }

  async inMemoryExpireTick(): Promise<void> {
    for (const [chatId, messages] of this.messagesToDelete.entries()) {
      await this.bulkDeleteMessages(chatId, messages)
      this.messagesToDelete.delete(chatId)
    }
  }

  async bulkDeleteMessages(
    chatUuid: string,
    jobs: DeleteMessageQueue[],
  ): Promise<void> {
    if (!jobs.length) {
      return
    }
    try {
      const chat = await this.tgChatsDao.getByUuid(chatUuid)

      const tgId = parseInt(chat.tgId, 10)

      await this.tgBot.api.deleteMessages(
        tgId,
        jobs.map((j) => parseInt(j.tgMessageId, 10)),
      )
    } catch (e) {
      console.error(`Error deleting messages in ${chatUuid}`, e)
    }
  }

  async postponeMessageDeletion(
    job: JobOfQueue<DeleteMessageQueue>,
  ): Promise<void> {
    const data = job.data
    const chatId = data.tgChatUuid

    const messages = this.messagesToDelete.get(chatId) || []
    messages.push(data)
    this.messagesToDelete.set(chatId, messages)

    if (messages.length >= this.messageToDeleteMaxSize) {
      await this.bulkDeleteMessages(chatId, messages)
      this.messagesToDelete.delete(chatId)
    }
  }

  async editMessage(job: JobOfQueue<EditMessageQueue>): Promise<void> {
    const data = job.data
    const chatId = data.tgChatUuid

    const chat = await this.tgChatsDao.getByUuid(chatId)
    const tgId = parseInt(chat.tgId, 10)
    const messageId = parseInt(data.tgMessageId, 10)

    try {
      const replyMarkup = data.contents.replyMarkup || []

      await this.tgBot.api.editMessageText(
        tgId,
        messageId,
        data.contents.message,
        {
          entities: data.contents.entities,
          reply_markup: {
            inline_keyboard: replyMarkup,
          },
        },
      )
    } catch (e) {
      console.error(`Error editing message: ${messageId} in ${chatId}`, e)
    }
  }

  async onModuleInit(): Promise<void> {
    await this.deleteMessageQueue.start()
    await this.editMessageQueue.start()
    await this.inMemoryExpireCron.schedule('*/7 * * * * *')
  }

  async onModuleDestroy(): Promise<void> {
    await this.deleteMessageQueue.stop()
    await this.editMessageQueue.stop()
    await this.inMemoryExpireCron.stop()
  }
}
