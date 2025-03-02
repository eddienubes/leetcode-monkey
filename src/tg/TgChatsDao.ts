import { PgDao } from '@/pg/PgDao'
import { PgService } from '@/pg/PgService'
import { eq, InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { tgChats } from '@/pg/schema'
import { NotFoundError } from '@/common/errors'

export type TgChatSelect = InferSelectModel<typeof tgChats>
export type TgChatInsert = InferInsertModel<typeof tgChats>

export class TgChatsDao extends PgDao {
  constructor(pgService: PgService) {
    super(pgService)
  }

  async getByTgId(tgId: string): Promise<TgChatSelect> {
    const hit = await this.client.query.tgChats.findFirst({
      where: eq(tgChats.tgId, tgId),
    })

    if (!hit) {
      throw new NotFoundError(`TgChat with tgId ${tgId} not found`)
    }

    return hit
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
