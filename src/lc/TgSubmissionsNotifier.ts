import { config } from '@/config'
import { Job, Queue, Worker } from 'bullmq'
import { TgSubmissionNotifyJob } from '@/lc/types/types'
import { Bot } from 'grammy'
import { BotCtx } from '@/bot/Bot'
import { bold, fmt, link, mentionUser } from '@grammyjs/parse-mode'
import { LcProblemDifficulty } from '@/pg/schema'
import { LcProblemsService } from '@/lc/LcProblemsService'
import { ToJsonType } from '@/common/types'

export class TgSubmissionsNotifier {
  private readonly queueName = 'tg-submissions-notify'
  private readonly queue = new Queue(this.queueName, {
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

  async add(job: ToJsonType<TgSubmissionNotifyJob>[]): Promise<void> {
    if (!job.length) {
      return
    }

    await this.queue.addBulk(
      job.map((j) => ({
        name: `${j.lcUser.slug}:${j.lcProblem.slug}`,
        data: j,
      })),
    )
  }

  async run(job: Job<ToJsonType<TgSubmissionNotifyJob>>): Promise<void> {
    const data = job.data

    if (!data.lcChatSettings.isActive || !data.lcUserInChat.isActive) {
      console.log(
        `${TgSubmissionsNotifier.name} notifications disabled for user ${data.lcUser.slug} in chat ${data.tgChat.title}`,
      )
      return
    }

    // send notifications only after user or admin toggled isActive
    // whenever bot or user joins the chat, we consider it as a toggle for the first time
    // 1. Bot joins -> chat settings created with isActive = true
    // 2. User joins -> connects leetcode account -> per user settings created with isActive = true

    console.log('toggledAt', [
      data.lcChatSettings.isActiveToggledAt,
      data.lcUserInChat.isActiveToggledAt,
    ])

    const latestNotificationCutoffDate = [
      data.lcChatSettings.isActiveToggledAt,
      data.lcUserInChat.isActiveToggledAt,
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]

    console.log(
      `${TgSubmissionsNotifier.name} notifying ${data.lcUser.slug} in chat ${data.tgChat.title}`,
    )

    if (data.submission.submittedAt < latestNotificationCutoffDate) {
      console.log(
        `${TgSubmissionsNotifier.name} skipping notification for ${data.lcUser.slug} in chat ${data.tgChat.title}`,
      )
      return
    }

    const diffemojimap: Record<LcProblemDifficulty, string> = {
      easy: '🟢',
      medium: '🟡',
      hard: '🔴',
    }

    const mention =
      data.tgUser.firstName ||
      data.tgUser.username ||
      data.lcUser.realName ||
      data.lcUser.slug

    //     const msg = fmt`
    // 🔥${mentionUser(data.lcUser.slug, parseInt(data.tgUser.tgId, 10))} has ${bold('solved')} a problem! 🎉
    // ${diffemojimap[data.lcProblem.difficulty]} ${link(data.lcProblem.title, LcProblemsService.getLcProblemUrl(data.lcProblem.slug))}
    // ${data.lcProblem.topics.map((t) => `#${t}`.replaceAll('-', '')).join(' ')}
    //     `
    const msg = fmt`
🔥${mentionUser(mention, parseInt(data.tgUser.tgId, 10))} has ${bold('solved')} ${diffemojimap[data.lcProblem.difficulty]} ${link(data.lcProblem.title, LcProblemsService.getLcProblemUrl(data.lcProblem.slug))}! 
${data.lcProblem.topics.map((t) => `#${t}`.replaceAll('-', '')).join(' ')}
    `

    await this.bot.api.sendMessage(data.tgChat.tgId, msg.text, {
      entities: msg.entities,
      link_preview_options: {
        is_disabled: true,
      },
    })
  }

  onModuleInit(): void {
    console.log(`${TgSubmissionsNotifier.name} started`)
  }
}
