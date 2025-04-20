import { Injectable, randomAlphaNumStr } from '@/common'
import { PgService } from '@/pg'
import { TgUserInsert, TgUsersDao, TgUserSelect } from '@/tg/TgUsersDao'

@Injectable(PgService)
export class TgUsersTestDao extends TgUsersDao {
  constructor(pg: PgService) {
    super(pg)
  }

  async generateTgUser(attrs?: Partial<TgUserInsert>): Promise<TgUserSelect> {
    return await this.upsert({
      tgId: randomAlphaNumStr(10),
      firstName: randomAlphaNumStr(10),
      ...(attrs || {}),
    })
  }
}
