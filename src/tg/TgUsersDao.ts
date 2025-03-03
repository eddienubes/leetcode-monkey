import { PgService } from '@/pg/PgService'
import { PgDao } from '@/pg/PgDao'
import { tgUsers } from '@/pg/schema'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export type TgUserSelect = InferSelectModel<typeof tgUsers>
export type TgUserInsert = InferInsertModel<typeof tgUsers>

export class TgUsersDao extends PgDao {
  constructor(pgService: PgService) {
    super(pgService)
  }

  async upsert(user: TgUserInsert): Promise<TgUserSelect> {
    const [upserted] = await this.client
      .insert(tgUsers)
      .values(user)
      .onConflictDoUpdate({
        target: [tgUsers.tgId],
        set: user,
      })
      .returning()
    return upserted
  }
}
