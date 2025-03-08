import { LcUsersDao } from '@/lc-users/LcUsersDao'
import { LcApiClient } from '@/lc/LcApiClient'
import { config } from '@/config'
import { Job, Queue, Worker } from 'bullmq'
import { sleepForRandomMs } from '@/common/utils'
import { LcSaveSubmissionsWorker } from '@/lc/LcSaveSubmissionsWorker'

export class LcPullSubmissionsCronJob {
  private readonly queueName = 'lc-pull-submissions-cron'
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
    private readonly lcSaveSubmissionsWorker: LcSaveSubmissionsWorker,
  ) {}

  async run(job: Job) {
    console.log('Running job', job.id)

    const lcUsers = await this.lcUsersDao.getAllActiveLcChatUsers()
    console.log('processing', lcUsers.length, 'users')

    for (const lcUser of lcUsers) {
      console.log('processing', lcUser.lc_users.slug)

      const ss = await this.lcApi.getAcceptedSubmissions(lcUser.lc_users.slug)

      console.log(
        `Got ${ss.recentAcSubmissionList.length} submissions for ${lcUser.lc_users.slug}`,
      )

      await this.lcSaveSubmissionsWorker.add(
        ss.recentAcSubmissionList.map((s) => ({
          lcUser: lcUser.lc_users,
          lcUserInChat: lcUser.lc_users_to_users_in_chats,
          lcChatSettings: lcUser.lc_chat_settings,
          submission: s,
          tgUser: lcUser.tg_users,
          tgChat: lcUser.tg_chats,
        })),
      )

      await sleepForRandomMs(1000, 3000)


      // const newSubmissions = submissions.filter((s) => s.isCreated)

      // await this.tgSubmissionsNotifier.add(
      //   newSubmissions.map((s) => ({
      //     tgUser: lcUser.tg_users,
      //     tgChat: lcUser.tg_chats,
      //     lcUser: lcUser.lc_users,
      //     lcUserInChat: lcUser.lc_users_to_users_in_chats,
      //     lcChatSettings: lcUser.lc_chat_settings,
      //     submission: s,
      //   })),
      // )
    }
  }

  async onModuleInit(): Promise<void> {
    await this.queue.upsertJobScheduler(`${this.queueName}-scheduler`, {
      pattern: config.cron.lcCronJobInterval,
    })

    console.log(`${LcPullSubmissionsCronJob.name} started`)
  }
}
