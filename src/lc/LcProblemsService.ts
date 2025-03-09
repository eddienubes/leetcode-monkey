import { LcProblemsDao, LcProblemSelect } from '@/lc/LcProblemsDao'
import { LcApiClient } from '@/lc/LcApiClient'
import { LcProblemDifficulty } from '@/pg/schema'
import { Problem } from 'leetcode-query'

export class LcProblemsService {
  constructor(
    private readonly lcProblemsDao: LcProblemsDao,
    private readonly lcApi: LcApiClient,
  ) {}

  static getLcProblemUrl(slug: string): string {
    return `https://leetcode.com/problems/${slug}`
  }

  async getOrCreate(slug: string): Promise<LcProblemSelect> {
    const problem = await this.lcProblemsDao.getBySlug(slug)

    if (problem) {
      return problem
    }

    const lcProblem = await this.lcApi.getProblem(slug)

    const diffmap: Record<Problem['difficulty'], LcProblemDifficulty> = {
      Easy: 'easy',
      Medium: 'medium',
      Hard: 'hard',
    }

    const created = await this.lcProblemsDao.upsert({
      slug,
      title: lcProblem.title,
      difficulty: diffmap[lcProblem.difficulty],
      lcId: lcProblem.questionId,
      topics: lcProblem.topicTags.map((t) => t.slug),
    })

    return created
  }
}
