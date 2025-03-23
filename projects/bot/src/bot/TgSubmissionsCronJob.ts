import { Job, Queue, Worker } from 'bullmq'
import { bold, fmt, link, mentionUser } from '@grammyjs/parse-mode'
import {
  arrToHashTags,
  config,
  connection,
  defaultJobOptions,
  LC_DIFFEMOJI,
  LC_SCORE_COEFFICIENTS,
  LcProblemsService,
  LcTgNotificationsDao,
  LcTgNotificationsSelect,
  LcUsersDao,
  sleepForRandomMs,
  ToJsonType,
} from '@repo/core'
import { TgSubmissionNotifyJob } from '@/bot/types'
import { Bot } from '@/bot/Bot'
import { Injectable } from "@repo/core";

@Injectable(
  Bot,
  LcUsersDao,
  LcTgNotificationsDao
)
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
  private readonly tgBot

  constructor(
    private readonly bot: Bot,
    private readonly lcUsersDao: LcUsersDao,
    private readonly lcTgNotificationsDao: LcTgNotificationsDao,
  ) {
    this.tgBot = bot.getBot()
  }

  async tick(): Promise<void> {
    const lcUsersInChatsToNotify =
      await this.lcUsersDao.getLcUsersInChatsToNotify()

    if (!lcUsersInChatsToNotify.length) {
      // console.log(`${TgSubmissionsCronJob.name} no users to notify, exiting`)
      return
    }

    const notifications = lcUsersInChatsToNotify.filter((l) => {
      if (
        !l.lc_chat_settings.isNotificationsEnabled ||
        !l.lc_users_in_tg_chats.isNotificationsEnabled
      ) {
        console.log(
          `${TgSubmissionsCronJob.name} notifications disabled for user ${l.lc_users.slug} in chat ${l.tg_chats.title}`,
        )
        return false
      }

      // send notifications only after user or admin toggled isActive
      // whenever bot or user joins the chat, we consider it as a toggle for the first time
      // 1. Bot joins -> chat settings created with isActive = true
      // 2. User joins -> connects leetcode account -> per user settings created with isActive = true
      const latestNotificationCutoffDate = new Date(
        [
          new Date(
            l.lc_chat_settings.isNotificationsEnabledToggledAt,
          ).getTime(),
          new Date(
            l.lc_users_in_tg_chats.isNotificationsEnabledToggledAt,
          ).getTime(),
        ].sort()[1],
      )

      const submittedAt = new Date(l.accepted_submissions.submittedAt)

      if (submittedAt < latestNotificationCutoffDate) {
        console.log(
          `${TgSubmissionsCronJob.name} skipping notification for ${l.lc_users.slug} in chat ${l.tg_chats.title}`,
        )
        return false
      }

      return true
    })

    console.log(
      `${TgSubmissionsCronJob.name} notifying ${notifications.length} lc users`,
    )

    await this.add(
      notifications.map(
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
    // Try to tolerate potential Telegram API rate limits
    await sleepForRandomMs(500, 2500)

    const data = job.data

    console.log(
      `${TgSubmissionsCronJob.name} notifying ${data.lcUser.slug} in chat ${data.tgChat.title}`,
    )

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
🔥${mentionUser(mention, parseInt(data.tgUser.tgId, 10))} has ${bold('solved')} ${LC_DIFFEMOJI[data.lcProblem.difficulty]} ${link(data.lcProblem.title, LcProblemsService.getLcProblemUrl(data.lcProblem.slug))}! (+${LC_SCORE_COEFFICIENTS[data.lcProblem.difficulty]})
${arrToHashTags(data.lcProblem.topics)}
    `

    await this.tgBot.api.sendMessage(data.tgChat.tgId, msg.text, {
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
