import { LcUsersDao } from '@/lc-users/LcUsersDao'
import { LcApiClient } from '@/lc/LcApiClient'
import { config } from '@/config'
import { Job, Queue, Worker } from 'bullmq'
import { sleepForRandomMs, unixTimestampToDate } from '@/common/utils'
import { LcPullSubmissionJob } from '@/lc/types/types'
import { ToJsonType } from '@/common/types'
import { LcProblemsService } from '@/lc/LcProblemsService'
import { connection, defaultJobOptions } from '@/common/bullmq'

export class LcPullSubmissionsCronJob {
  private readonly cronName = 'lc-pull-submissions-cron'
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
  private readonly queueName = 'lc-pull-submissions-queue'
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
    private readonly lcUsersDao: LcUsersDao,
    private readonly lcApi: LcApiClient,
    private readonly lcProblemsService: LcProblemsService,
  ) {}

  async tick(job: Job): Promise<void> {
    // console.log('Running job', job.id)

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

      console.log(
        `Got ${newSubmissions.length} new submissions for ${user.lcUser.slug}`,
      )

      const submissionsToSave = newSubmissions.map((s) => ({
        lcUser: user.lcUser,
        submission: s,
        tgUser: user.tgUser,
      }))

      void this.add(submissionsToSave)

      // Random jitter to mitigate accidental rate limits, if any?
      await sleepForRandomMs(400, 1300)
    }
  }

  async add(jobs: LcPullSubmissionJob[]): Promise<void> {
    if (!jobs.length) {
      return
    }

    await this.cron.addBulk(
      jobs.map((job) => ({
        name: `${job.lcUser.slug}-${job.submission.id}`,
        data: job,
      })),
    )
  }

  async run(job: Job<ToJsonType<LcPullSubmissionJob>>): Promise<void> {
    const data = job.data

    const problem = await this.lcProblemsService.getOrCreate(
      data.submission.titleSlug,
    )

    const submission = await this.lcUsersDao.addSubmissions([
      {
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
    await this.cron.upsertJobScheduler(`${this.queueName}-scheduler`, {
      pattern: config.cron.lcCronJobInterval,
    })

    console.log(`${LcPullSubmissionsCronJob.name} started + queue`)
  }
}
