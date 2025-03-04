import { PgDao } from '@/pg/PgDao'
import {
  and,
  desc,
  eq,
  inArray,
  InferInsertModel,
  InferSelectModel,
  ne,
  not,
} from 'drizzle-orm'
import {
  acceptedSubmissions,
  leetCodeChatSettings,
  leetCodeUsers,
  leetCodeUsersToUsersInChats,
  tgChats,
  tgUsers,
  tgUsersToTgChats,
} from '@/pg/schema'
import { PgService } from '@/pg/PgService'
import { TgUsersToTgChatsSelect } from '@/tg/TgChatsDao'
import { LeetCodeApiClient } from '@/leetcode/LeetCodeApiClient'

export type LeetCodeUserSelect = InferSelectModel<typeof leetCodeUsers>
export type LeetCodeUserInsert = InferInsertModel<typeof leetCodeUsers>
export type LeetCodeUserToUserInChatSelect = InferSelectModel<
  typeof leetCodeUsersToUsersInChats
>
export type LeetCodeUserToUserInChatSelectWithRelations = {
  leetCodeUser: LeetCodeUserSelect
  userInChat: TgUsersToTgChatsSelect
}
export type SubmissionInsert = InferInsertModel<typeof acceptedSubmissions>
export type SubmissionSelect = InferSelectModel<typeof acceptedSubmissions>

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

  async getAllActiveLeetCodeChatUsers() {
    const lcUsers = this.client
      .select()
      .from(leetCodeUsersToUsersInChats)
      .innerJoin(
        leetCodeUsers,
        eq(leetCodeUsersToUsersInChats.leetCodeUserUuid, leetCodeUsers.uuid),
      )
      .innerJoin(
        tgUsersToTgChats,
        eq(leetCodeUsersToUsersInChats.userInChatUuid, tgUsersToTgChats.uuid),
      )
      .innerJoin(tgUsers, eq(tgUsersToTgChats.tgUserUuid, tgUsers.uuid))
      .innerJoin(tgChats, eq(tgUsersToTgChats.tgChatUuid, tgChats.uuid))
      .innerJoin(
        leetCodeChatSettings,
        eq(leetCodeChatSettings.tgChatUuid, tgChats.uuid),
      )
      .where(eq(leetCodeUsersToUsersInChats.isActive, true))

    return lcUsers
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

  async addSubmissions(
    submissions: SubmissionInsert[],
  ): Promise<SubmissionSelect[]> {
    const ss = await this.client
      .insert(acceptedSubmissions)
      .values(submissions)
      .onConflictDoUpdate({
        target: [acceptedSubmissions.slug],
        set: {
          updatedAt: new Date(),
        },
      })
      .returning()
    return ss
  }

  async getSubmissionsBySlugs(
    lcUserUuid: string,
    slugs: string[],
  ): Promise<SubmissionSelect[]> {
    const ss = await this.client
      .select()
      .from(acceptedSubmissions)
      .where(
        and(
          eq(acceptedSubmissions.leetcodeUserUuid, lcUserUuid),
          inArray(acceptedSubmissions.slug, slugs),
        ),
      )
      .orderBy(desc(acceptedSubmissions.createdAt))
      .limit(LeetCodeApiClient.MAX_RECENT_SUBMISSIONS)

    return ss
  }
}
