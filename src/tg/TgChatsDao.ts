import { PgDao } from '@/pg/PgDao'
import { PgService } from '@/pg/PgService'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { tgChats } from '@/pg/schema'

export type TgChatSelect = InferSelectModel<typeof tgChats>
export type TgChatInsert = InferInsertModel<typeof tgChats>

export class TgChatsDao extends PgDao {
  constructor(pgService: PgService) {
    super(pgService)
  }

  async upsert(chat: TgChatInsert): Promise<TgChatSelect> {
    const [upserted] = await this.client
      .insert(tgChats)
      .values(chat)
      .onConflictDoUpdate({
        target: [tgChats.tgId],
        set: chat,
      })
      .returning()
    return upserted
  }
}
