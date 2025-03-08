import { PgDao } from '@/pg/PgDao'
import { desc, eq, InferInsertModel, InferSelectModel } from 'drizzle-orm'
import {
  acceptedSubmissions,
  lcChatSettings,
  lcUsers,
  lcUsersToUsersInChats,
  tgChats,
  tgUsers,
  tgUsersToTgChats,
} from '@/pg/schema'
import { PgService } from '@/pg/PgService'
import { TgUsersToTgChatsSelect } from '@/tg/TgChatsDao'
import { GetAllActiveLcChatUsersHit } from '@/lc-users/types'

export type LcUserSelect = InferSelectModel<typeof lcUsers>
export type LcUserInsert = InferInsertModel<typeof lcUsers>
export type LcUserToUserInChatSelect = InferSelectModel<
  typeof lcUsersToUsersInChats
>
export type lcUserToUserInChatSelectWithRelations = {
  lcUser: LcUserSelect
  userInChat: TgUsersToTgChatsSelect
}
export type SubmissionInsert = InferInsertModel<typeof acceptedSubmissions>
export type SubmissionSelect = InferSelectModel<typeof acceptedSubmissions>

export type lcUserToUserInChatInsert = InferInsertModel<
  typeof lcUsersToUsersInChats
>

export class LcUsersDao extends PgDao {
  constructor(pgService: PgService) {
    super(pgService)
  }

  async create(user: LcUserInsert): Promise<LcUserSelect> {
    const [created] = await this.client.insert(lcUsers).values(user).returning()
    return created
  }

  async update(user: LcUserInsert): Promise<LcUserSelect> {
    const [updated] = await this.client.update(lcUsers).set(user).returning()
    return updated
  }

  async upsert(user: LcUserInsert): Promise<LcUserSelect> {
    const [upserted] = await this.client
      .insert(lcUsers)
      .values(user)
      .onConflictDoUpdate({
        target: [lcUsers.slug],
        set: user,
      })
      .returning()
    return upserted
  }

  async getAllActiveLcChatUsers(): Promise<GetAllActiveLcChatUsersHit[]> {
    const latestSubmission = this.client
      .selectDistinctOn([acceptedSubmissions.lcUserUuid])
      .from(acceptedSubmissions)
      .orderBy(
        acceptedSubmissions.lcUserUuid,
        desc(acceptedSubmissions.submittedAt),
      )
      .as('latest_submission')

    const hits = this.client
      .select()
      .from(lcUsersToUsersInChats)
      .innerJoin(lcUsers, eq(lcUsersToUsersInChats.lcUserUuid, lcUsers.uuid))
      .innerJoin(
        tgUsersToTgChats,
        eq(lcUsersToUsersInChats.userInChatUuid, tgUsersToTgChats.uuid),
      )
      .innerJoin(tgUsers, eq(tgUsersToTgChats.tgUserUuid, tgUsers.uuid))
      .innerJoin(tgChats, eq(tgUsersToTgChats.tgChatUuid, tgChats.uuid))
      .innerJoin(lcChatSettings, eq(lcChatSettings.tgChatUuid, tgChats.uuid))
      .leftJoin(
        latestSubmission,
        eq(lcUsersToUsersInChats.lcUserUuid, latestSubmission.lcUserUuid),
      )
      .where(eq(lcUsersToUsersInChats.isActive, true))

    return hits
  }

  async connectlcUserToUserInChat(
    entry: lcUserToUserInChatInsert,
  ): Promise<LcUserToUserInChatSelect> {
    const [hit] = await this.client
      .insert(lcUsersToUsersInChats)
      .values(entry)
      .onConflictDoUpdate({
        target: [lcUsersToUsersInChats.userInChatUuid],
        set: entry,
      })
      .returning()

    return hit
  }

  async disconnectlcUserFromUserInChat(userInChatUuid: string): Promise<void> {
    await this.client
      .update(lcUsersToUsersInChats)
      .set({
        isActive: false,
      })
      .where(eq(lcUsersToUsersInChats.userInChatUuid, userInChatUuid))
  }

  async addSubmissions(
    submissions: SubmissionInsert[],
  ): Promise<SubmissionSelect[]> {
    if (!submissions.length) {
      return []
    }

    const ss = await this.client
      .insert(acceptedSubmissions)
      .values(submissions)
      .onConflictDoUpdate({
        target: [
          acceptedSubmissions.submittedAt,
        ],
        set: {
          updatedAt: new Date(),
        },
      })
      .returning()

    return ss
  }

  async getLatestSubmission(
    lcUserUuid: string,
  ): Promise<SubmissionSelect | null> {
    const ss = await this.client
      .select()
      .from(acceptedSubmissions)
      .where(eq(acceptedSubmissions.lcUserUuid, lcUserUuid))
      .orderBy(desc(acceptedSubmissions.submittedAt))
      .limit(1)

    return ss[0] || null
  }
}
