import { Injectable, randomAlphaNumStr } from '@/common'
import { PgService } from '@/pg'
import { LcUserInsert, LcUsersDao, LcUserSelect } from '@/lc-users/LcUsersDao'

@Injectable(PgService)
export class LcUsersTestDao extends LcUsersDao {
  constructor(pg: PgService) {
    super(pg)
  }

  async generateLcUser(attrs?: Partial<LcUserInsert>): Promise<LcUserSelect> {
    return await this.upsert({
      slug: randomAlphaNumStr(15),
      ...(attrs || {}),
    })
  }
}
