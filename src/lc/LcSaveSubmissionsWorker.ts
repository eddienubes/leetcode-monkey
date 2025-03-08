import { LcUsersDao, SubmissionSelect } from '@/lc-users/LcUsersDao'
import { LcApiClient } from '@/lc/LcApiClient'
import { config } from '@/config'
import { Job, Queue, Worker } from 'bullmq'
import { fakeSerialize, sleepForRandomMs, unixTimestampToDate } from '@/common/utils'
import { TgSubmissionsNotifier } from '@/lc/TgSubmissionsNotifier'
import { LcSaveSubmissionJob } from '@/lc/types/types'
import { LcProblemsService } from '@/lc/LcProblemsService'
import { ToJsonType } from '@/common/types'

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
    private readonly lcProblemsService: LcProblemsService,
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

  async run(job: Job<ToJsonType<LcSaveSubmissionJob>>) {
    const data = job.data

    const problem = await this.lcProblemsService.getOrCreate(
      data.submission.titleSlug,
    )

    const submissions = (await this.lcUsersDao.addSubmissions([
      {
        lcProblemUuid: problem.uuid,
        lcUserUuid: data.lcUser.uuid,
        submittedAt: unixTimestampToDate(data.submission.timestamp),
      },
    ]))

    await this.tgSubmissionsNotifier.add([
      {
        submission: fakeSerialize(submissions[0]),
        tgUser: data.tgUser,
        tgChat: data.tgChat,
        lcUser: data.lcUser,
        lcUserInChat: data.lcUserInChat,
        lcChatSettings: data.lcChatSettings,
        lcProblem: fakeSerialize(problem),
      },
    ])
  }

  async onModuleInit(): Promise<void> {
    console.log(`${LcSaveSubmissionsWorker.name} started`)
  }
}
