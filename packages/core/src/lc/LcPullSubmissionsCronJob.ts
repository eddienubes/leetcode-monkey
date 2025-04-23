import { Job } from 'bullmq'
import {
  createCronQueue,
  Injectable,
  JobOfQueue,
  Lifecycle,
  sleepForRandomMs,
  unixTimestampToDate,
} from '@/common'
import { LcUsersDao } from '@/lc-users'
import { LcApiClient } from './LcApiClient'
import { LcProblemsService } from './LcProblemsService'
import { config } from '@/config'
import { LcPullSubmissionsQueue } from '@/lc/queues'

@Injectable(LcUsersDao, LcApiClient, LcProblemsService)
export class LcPullSubmissionsCronJob implements Lifecycle {
  private readonly cronQueue = createCronQueue(
    'lc-pull-submissions-cron',
    this.tick.bind(this),
  )
  private readonly queue = LcPullSubmissionsQueue.connect(this.run.bind(this))

  constructor(
    private readonly lcUsersDao: LcUsersDao,
    private readonly lcApi: LcApiClient,
    private readonly lcProblemsService: LcProblemsService,
  ) {}

  async tick(job: Job): Promise<void> {
    const lcUsers = await this.lcUsersDao.getAllActiveLcUsers()
    // console.log('processing', lcUsers.length, 'users')

    for (const user of lcUsers) {
      // console.log('processing', user.lcUser.slug)

      const latestSubmission = user.latestSubmission

      const ss = await this.lcApi.getAcceptedSubmissions(user.lcUser.slug)

      const newSubmissions = ss.recentAcSubmissionList.filter(
        (s) =>
          // no latest submission or the submission is newer than the latest submission
          !latestSubmission ||
          unixTimestampToDate(s.timestamp) > latestSubmission.submittedAt,
      )

      // console.log(
      //   `Got ${newSubmissions.length} new submissions for ${user.lcUser.slug}`,
      // )

      const submissionsToSave = newSubmissions.map((s) => ({
        lcUser: user.lcUser,
        submission: s,
        tgUser: user.tgUser,
      }))

      void this.queue.addBulk(
        submissionsToSave.map((s) => ({
          name: `${s.lcUser.slug}-${s.submission.id}`,
          data: s,
        })),
      )

      // Random jitter to mitigate accidental rate limits, if any?
      await sleepForRandomMs(400, 1300)
    }
  }

  async run(job: JobOfQueue<LcPullSubmissionsQueue>): Promise<void> {
    const data = job.data

    const problem = await this.lcProblemsService.getOrCreate(
      data.submission.titleSlug,
    )

    const submission = await this.lcUsersDao.addSubmissions([
      {
        lcSubmissionId: data.submission.id,
        lcProblemUuid: problem.uuid,
        lcUserUuid: data.lcUser.uuid,
        submittedAt: unixTimestampToDate(data.submission.timestamp),
      },
    ])

    if (submission[0].isCreated) {
      console.log(`Saved submission ${problem.slug} for ${data.lcUser.slug}`)
    }
  }

  async onModuleInit(): Promise<void> {
    await this.cronQueue.schedule(config.cron.lcCronJobInterval)
    await this.queue.start()

    console.log(`${LcPullSubmissionsCronJob.name} started + queue`)
  }

  async onModuleDestroy(): Promise<void> {
    await this.cronQueue.stop()
    await this.queue.stop()

    console.log(`${LcPullSubmissionsCronJob.name} stopped + queue`)
  }
}
