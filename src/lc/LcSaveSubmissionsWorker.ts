import { LcUsersDao } from '@/lc-users/LcUsersDao'
import { LcApiClient } from '@/lc/LcApiClient'
import { config } from '@/config'
import { Job, Queue, Worker } from 'bullmq'
import { sleepForRandomMs } from '@/common/utils'
import { TgSubmissionsNotifier } from '@/lc/TgSubmissionsNotifier'
import { LcSaveSubmissionJob } from '@/lc/types/types'

export class LcSaveSubmissionsWorker {
  private readonly queueName = 'lc-save-submissions'
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

  async add(jobs: LcSaveSubmissionJob[]): Promise<void> {
    await this.queue.addBulk(
      jobs.map((job) => ({
        name: `${job.lcUser.slug}-${job.submission.id}`,
        data: job,
        opts: {
          // removeOnComplete: true,
          // removeOnFail: true,
        },
      })),
    )
  }

  async run(job: Job<LcSaveSubmissionJob>) {
    const submissions = await this.lcUsersDao.addSubmissions(
      ss.recentAcSubmissionList.map((s) => ({
        lcUserUuid: lcUser.lc_users.uuid,
        // slug: s.titleSlug,
        // title: s.title,
        // lcId: s.id,
        // // s.timestamp is unix in seconds
        // submittedAt: new Date(parseInt(s.timestamp, 10) * 1000),
      })),
    )
  }

  async onModuleInit(): Promise<void> {
    console.log(`${lcPullSubmissionsCronJob.name} started`)
  }
}
