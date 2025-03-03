import { PgDao } from '@/pg/PgDao'
import { eq, InferInsertModel, InferSelectModel } from 'drizzle-orm'
import {
  leetCodeUsers,
  leetCodeUsersToUsersInChats,
  tgUsersToTgChats,
} from '@/pg/schema'
import { PgService } from '@/pg/PgService'

export type LeetCodeUserSelect = InferSelectModel<typeof leetCodeUsers>
export type LeetCodeUserInsert = InferInsertModel<typeof leetCodeUsers>
export type LeetCodeUserToUserInChatSelect = InferSelectModel<
  typeof leetCodeUsersToUsersInChats
>
export type LeetCodeUserToUserInChatInsert = InferInsertModel<
  typeof leetCodeUsersToUsersInChats
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

  async connectLeetCodeUserToUserInChat(
    entry: LeetCodeUserToUserInChatInsert,
  ): Promise<LeetCodeUserToUserInChatSelect> {
    const [hit] = await this.client
      .insert(leetCodeUsersToUsersInChats)
      .values(entry)
      .onConflictDoUpdate({
        target: [leetCodeUsersToUsersInChats.userInChatUuid],
        set: entry,
      })
      .returning()

    return hit
  }

  async disconnectLeetCodeUserFromUserInChat(
    userInChatUuid: string,
  ): Promise<void> {
    await this.client
      .update(leetCodeUsersToUsersInChats)
      .set({
        isActive: false,
      })
      .where(eq(leetCodeUsersToUsersInChats.userInChatUuid, userInChatUuid))
  }
}
