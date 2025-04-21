import { Injectable, randomAlphaNumStr, randomInt } from '@/common'
import { PgService } from '@/pg'
import {
  LcProblemInsert,
  LcProblemsDao,
  LcProblemSelect,
} from '@/lc/LcProblemsDao'

@Injectable(PgService)
export class LcProblemsTestDao extends LcProblemsDao {
  constructor(pg: PgService) {
    super(pg)
  }

  async generateProblem(
    attrs?: Partial<LcProblemInsert>,
  ): Promise<LcProblemSelect> {
    return this.upsert({
      slug: randomAlphaNumStr(10),
      title: randomAlphaNumStr(50),
      difficulty: randomInt(0, 2) ? 'medium' : 'easy',
      lcId: randomAlphaNumStr(10),
      ...(attrs || {}),
    })
  }
}
