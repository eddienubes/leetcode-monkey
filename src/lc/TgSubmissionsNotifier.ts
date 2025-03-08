import { config } from '@/config'
import { Job, Queue, Worker } from 'bullmq'
import { TgSubmissionNotifyJob } from '@/lc/types/types'
import { Bot } from 'grammy'
import { BotCtx } from '@/bot/Bot'
import { bold, fmt, mentionUser } from '@grammyjs/parse-mode'
import { tgUsers } from '@/pg/schema'

export class TgSubmissionsNotifier {
  private readonly queueName = 'tg-submissions-notify'
  private readonly queue = new Queue<TgSubmissionNotifyJob>(this.queueName, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
    },
  })
  private readonly worker = new Worker(this.queueName, this.run.bind(this), {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
    },
  })

  constructor(private readonly bot: Bot<BotCtx>) {}

  async add(job: TgSubmissionNotifyJob[]): Promise<void> {
    await this.queue.addBulk(
      job.map((j) => ({
        name: `${j.lcUser.slug}:${j.submission.slug}`,
        data: j,
      })),
    )
  }

  async run(job: Job<TgSubmissionNotifyJob>): Promise<void> {
    const data = job.data
    if (
      !data.lcChatSettings.isActive ||
      !data.lcUserInChat.isActive
    ) {
      console.log(
        `${TgSubmissionsNotifier.name} notifications disabled for user ${data.lcUser.slug} in chat ${data.tgChat.title}`,
      )
      return
    }

    console.log(
      `${TgSubmissionsNotifier.name} notifying ${data.lcUser.slug} in chat ${data.tgChat.title}`,
    )

    // await this.bot.api(
    //   data.tgChat.tgId,
    //   fmt`User ${mentionUser(data.lcUser.slug, parseInt(data.tgUser.tgId, 10))} has solved ${bold()}`,
    // )
  }

  onModuleInit(): void {
    console.log(`${TgSubmissionsNotifier.name} started`)
  }
}
