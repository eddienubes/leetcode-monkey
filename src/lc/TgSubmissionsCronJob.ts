import { Job, Queue, Worker } from 'bullmq'
import { TgSubmissionNotifyJob } from '@/lc/types/types'
import { Bot } from 'grammy'
import { BotCtx } from '@/bot/Bot'
import { bold, fmt, link, mentionUser } from '@grammyjs/parse-mode'
import { LcProblemDifficulty } from '@/pg/schema'
import { LcProblemsService } from '@/lc/LcProblemsService'
import { ToJsonType } from '@/common/types'
import { LC_SCORE_COEFFICIENTS } from '@/lc/constants'
import { connection, defaultJobOptions } from '@/common/bullmq'
import { config } from '@/config'
import { LcUsersDao } from '@/lc-users/LcUsersDao'
import {
  LcTgNotificationsDao,
  LcTgNotificationsSelect,
} from '@/lc/LcTgNotificationsDao'

export class TgSubmissionsCronJob {
  private readonly cronName = 'tg-submissions-notify-cron'
  private readonly cron = new Queue(this.cronName, {
    connection,
    defaultJobOptions,
  })
  private readonly cronWorker = new Worker(
    this.cronName,
    this.tick.bind(this),
    {
      connection,
    },
  )
  private readonly queueName = 'tg-submissions-notify'
  private readonly queue = new Queue(this.queueName, {
    connection,
    defaultJobOptions,
  })
  private readonly queueWorker = new Worker(
    this.queueName,
    this.run.bind(this),
    {
      connection,
    },
  )

  constructor(
    private readonly bot: Bot<BotCtx>,
    private readonly lcUsersDao: LcUsersDao,
    private readonly lcTgNotificationsDao: LcTgNotificationsDao,
  ) {}

  async tick(): Promise<void> {
    const lcUsersInChatsToNotify =
      await this.lcUsersDao.getLcUsersInChatsToNotify()

    if (!lcUsersInChatsToNotify.length) {
      console.log(
        `${TgSubmissionsCronJob.name} no users to notify, exiting`,
      )
      return
    }

    console.log(
      `${TgSubmissionsCronJob.name} notifying ${lcUsersInChatsToNotify.length} users`,
    )

    await this.add(
      lcUsersInChatsToNotify.map(
        (u) =>
          ({
            lcUser: u.lc_users,
            lcProblem: u.lc_problems,
            lcChatSettings: u.lc_chat_settings,
            lcUserInChat: u.lc_users_in_tg_chats,
            tgChat: u.tg_chats,
            tgUser: u.tg_users,
            submission: u.accepted_submissions,
          }) satisfies TgSubmissionNotifyJob,
      ),
    )

    const lcTgNotifications = new Map<string, LcTgNotificationsSelect>(
      lcUsersInChatsToNotify.map((u) => [
        `${u.lc_users.uuid}:${u.tg_chats.uuid}`,
        {
          lcUserUuid: u.lc_users.uuid,
          tgChatUuid: u.tg_chats.uuid,
          lastSentAt: new Date(),
        } as LcTgNotificationsSelect,
      ]),
    )

    await this.lcTgNotificationsDao.upsertMany(
      Array.from(lcTgNotifications.values()),
    )
  }

  async add(job: TgSubmissionNotifyJob[]): Promise<void> {
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
        `${TgSubmissionsCronJob.name} notifications disabled for user ${data.lcUser.slug} in chat ${data.tgChat.title}`,
      )
      return
    }

    // send notifications only after user or admin toggled isActive
    // whenever bot or user joins the chat, we consider it as a toggle for the first time
    // 1. Bot joins -> chat settings created with isActive = true
    // 2. User joins -> connects leetcode account -> per user settings created with isActive = true

    const latestNotificationCutoffDate = new Date(
      [
        new Date(data.lcChatSettings.isActiveToggledAt).getTime(),
        new Date(data.lcUserInChat.isActiveToggledAt).getTime(),
      ].sort()[1],
    )

    console.log(
      `${TgSubmissionsCronJob.name} notifying ${data.lcUser.slug} in chat ${data.tgChat.title}`,
    )

    const submittedAt = new Date(data.submission.submittedAt)

    if (submittedAt < latestNotificationCutoffDate) {
      console.log(
        `${TgSubmissionsCronJob.name} skipping notification for ${data.lcUser.slug} in chat ${data.tgChat.title}`,
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
🔥${mentionUser(mention, parseInt(data.tgUser.tgId, 10))} has ${bold('solved')} ${diffemojimap[data.lcProblem.difficulty]} ${link(data.lcProblem.title, LcProblemsService.getLcProblemUrl(data.lcProblem.slug))}! (+${LC_SCORE_COEFFICIENTS[data.lcProblem.difficulty]})
${data.lcProblem.topics.map((t) => `#${t}`.replaceAll('-', '')).join(' ')}
    `

    await this.bot.api.sendMessage(data.tgChat.tgId, msg.text, {
      entities: msg.entities,
      link_preview_options: {
        is_disabled: true,
      },
    })
  }

  async onModuleInit(): Promise<void> {
    await this.cron.upsertJobScheduler(`${this.cronName}-scheduler`, {
      pattern: config.cron.tgSubmissionsCronJobInterval,
    })

    console.log(`${TgSubmissionsCronJob.name} started + queue`)
  }
}
