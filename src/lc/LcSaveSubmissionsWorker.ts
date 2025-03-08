import { LcUsersDao } from '@/lc-users/LcUsersDao'
import { LcApiClient } from '@/lc/LcApiClient'
import { config } from '@/config'
import { Job, Queue, Worker } from 'bullmq'
import { sleepForRandomMs } from '@/common/utils'
import { TgSubmissionsNotifier } from '@/lc/TgSubmissionsNotifier'

export class LcSaveSubmissionsWorker {
  private readonly queueName = 'lc-save-submissions-cron'
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

  constructor(
    private readonly lcUsersDao: LcUsersDao,
    private readonly lcApi: LcApiClient,
    private readonly tgSubmissionsNotifier: TgSubmissionsNotifier,
  ) {}

  async run(job: Job) {
    console.log('Running job', job.id)

    const lcUsers = await this.lcUsersDao.getAllActivelcChatUsers()
    console.log('processing', lcUsers.length, 'users')

    for (const lcUser of lcUsers) {
      console.log('processing', lcUser.lc_users.slug)

      const ss = await this.lcApi.getAcceptedSubmissions(
        lcUser.lc_users.slug,
      )

      const submissions = await this.lcUsersDao.addSubmissions(
        ss.recentAcSubmissionList.map((s) => ({
          lcUserUuid: lcUser.lc_users.uuid,
          slug: s.titleSlug,
          title: s.title,
          lcId: s.id,
          // s.timestamp is unix in seconds
          submittedAt: new Date(parseInt(s.timestamp, 10) * 1000),
        })),
      )

      const newSubmissions = submissions.filter((s) => s.isCreated)

      await this.tgSubmissionsNotifier.add(
        newSubmissions.map((s) => ({
          tgUser: lcUser.tg_users,
          tgChat: lcUser.tg_chats,
          lcUser: lcUser.lc_users,
          lcUserInChat: lcUser.lc_users_to_users_in_chats,
          lcChatSettings: lcUser.lc_chat_settings,
          submission: s,
        })),
      )

      await sleepForRandomMs(1000, 3000)
    }
  }

  async onModuleInit(): Promise<void> {
    console.log(`${lcPullSubmissionsCronJob.name} started`)
  }
}
