import { LcUsersDao } from '@/lc-users/LcUsersDao'
import { LcApiClient } from '@/lc/LcApiClient'
import { config } from '@/config'
import { Job, Queue, Worker } from 'bullmq'
import { sleepForRandomMs, unixTimestampToDate } from '@/common/utils'
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

    const lcUsers = await this.lcUsersDao.getAllActiveLcUsers()
    console.log('processing', lcUsers.length, 'users')

    for (const user of lcUsers) {
      console.log('processing', user.lcUser.slug)

      const latestSubmission = user.latestSubmission

      const ss = await this.lcApi.getAcceptedSubmissions(user.lcUser.slug)

      const newSubmissions = ss.recentAcSubmissionList.filter(
        (s) =>
          // no latest submission or the submission is newer than the latest submission
          !latestSubmission ||
          unixTimestampToDate(s.timestamp) > latestSubmission.submittedAt,
      )

      console.log(newSubmissions)

      console.log(
        `Got ${newSubmissions.length} new submissions for ${user.lcUser.slug}`,
      )

      // Push submission notifications to each LC chat
      await this.lcSaveSubmissionsWorker.add(
        user.lcUserInChats.flatMap((userInChat) =>
          newSubmissions.map((s) => ({
            lcUser: user.lcUser,
            lcUserInChat: userInChat.entity,
            lcChatSettings: userInChat.chatSettings,
            submission: s,
            tgUser: user.tgUser,
            tgChat: userInChat.tgChat,
          })),
        ),
      )

      await sleepForRandomMs(400, 1300)

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
