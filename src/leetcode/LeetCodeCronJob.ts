import { LeetCodeUsersDao } from '@/leetcode-users/LeetCodeUsersDao'
import { LeetCodeApiClient } from '@/leetcode/LeetCodeApiClient'
import { CronJob } from 'cron'
import { config } from '@/config'

export class LeetCodeCronJob {
  private readonly job = CronJob.from({
    cronTime: config.cron.leetcodeCronJobInterval,
    onTick: this.run.bind(this),
    // skip subsequent runs if the previous one is still running
    waitForCompletion: true,
  })

  constructor(
    private readonly lcUsersDao: LeetCodeUsersDao,
    private readonly lcApi: LeetCodeApiClient,
  ) {} // private readonly

  async run() {
    const lcUsers = await this.lcUsersDao.getAllActiveLeetCodeChatUsers()
    console.log('processing', lcUsers.length, 'users')

    for (const lcUser of lcUsers) {
      console.log('processing', lcUser.leetcode_users.slug)

      const ss = await this.lcApi.getAcceptedSubmissions(
        lcUser.leetcode_users.slug,
      )

      await this.lcUsersDao.addSubmissions(
        ss.recentAcSubmissionList.map((s) => ({
          leetcodeUserUuid: lcUser.leetcode_users.uuid,
          slug: s.titleSlug,
          title: s.title,
          leetCodeId: s.id,
          submittedAt: new Date(s.timestamp)
        })),
      )
    }
  }

  onModuleInit() {
    console.log('starting lc cron job')
    this.job.start()
  }
}
