import { Injectable, randomAlphaNumStr } from '@/common'
import { TgChatInsert, TgChatsDao, TgChatSelect } from '@/tg/TgChatsDao'
import { PgService } from '@/pg'

@Injectable(PgService)
export class TgChatsTestDao extends TgChatsDao {
  constructor(pg: PgService) {
    super(pg)
  }

  async generateTgChat(attrs?: Partial<TgChatInsert>): Promise<TgChatSelect> {
    return await this.upsert({
      tgId: randomAlphaNumStr(10),
      type: 'supergroup',
      role: 'member',
      ...(attrs || {}),
    })
  }
}
