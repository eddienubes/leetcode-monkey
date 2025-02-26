import { PgDao } from '@/pg/PgDao'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { leetCodeUsers, leetCodeUsersToTgChats } from '@/pg/schema'
import { PgService } from '@/pg/PgService'

export type LeetCodeUserSelect = InferSelectModel<typeof leetCodeUsers>
export type LeetCodeUserInsert = InferInsertModel<typeof leetCodeUsers>
export type LeetCodeUserToTgChatSelect = InferSelectModel<
  typeof leetCodeUsersToTgChats
>
export type LeetCodeUserToTgChatInsert = InferInsertModel<
  typeof leetCodeUsersToTgChats
>

export class LeetCodeUsersDao extends PgDao {
  constructor(pgService: PgService) {
    super(pgService)
  }

  async create(user: LeetCodeUserInsert): Promise<LeetCodeUserSelect> {
    const [created] = await this.client
      .insert(leetCodeUsers)
      .values(user)
      .returning()
    return created
  }

  async update(user: LeetCodeUserInsert): Promise<LeetCodeUserSelect> {
    const [updated] = await this.client
      .update(leetCodeUsers)
      .set(user)
      .returning()
    return updated
  }

  async upsertTgChatReference(
    to: LeetCodeUserToTgChatInsert,
  ): Promise<LeetCodeUserToTgChatSelect> {
    const [upserted] = await this.client
      .insert(leetCodeUsersToTgChats)
      .values(to)
      .onConflictDoUpdate({
        target: [
          leetCodeUsersToTgChats.leetcodeUserUuid,
          leetCodeUsersToTgChats.tgChatUuid,
        ],
        set: to,
      })
      .returning()
    return upserted
  }

  async upsert(user: LeetCodeUserInsert): Promise<LeetCodeUserSelect> {
    const [upserted] = await this.client
      .insert(leetCodeUsers)
      .values(user)
      .onConflictDoUpdate({
        target: [leetCodeUsers.slug],
        set: user,
      })
      .returning()
    return upserted
  }
}
