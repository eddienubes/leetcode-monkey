import { PgDao } from '@/pg/PgDao'
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  inArray,
  InferInsertModel,
  InferSelectModel,
  isNotNull,
  sql,
} from 'drizzle-orm'
import {
  acceptedSubmissions,
  lcChatSettings,
  lcProblems,
  lcUsers,
  lcUsersToUsersInChats,
  tgChats,
  tgUsers,
  tgUsersToTgChats,
} from '@/pg/schema'
import { PgService } from '@/pg/PgService'
import { TgUsersToTgChatsSelect } from '@/tg/TgChatsDao'
import { GetAllActiveLcChatUsersHit } from '@/lc-users/types'
import { LC_SCORE_COEFFICIENTS } from '@/lc/constants'

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

  async getAllActiveLcUsers(): Promise<GetAllActiveLcChatUsersHit[]> {
    const latestSubmission = this.client
      .selectDistinctOn([acceptedSubmissions.lcUserUuid])
      .from(acceptedSubmissions)
      .orderBy(
        acceptedSubmissions.lcUserUuid,
        desc(acceptedSubmissions.submittedAt),
      )
      .as('latest_submission')

    const hits = await this.client
      .select()
      .from(lcUsers)
      .leftJoin(
        lcUsersToUsersInChats,
        eq(lcUsers.uuid, lcUsersToUsersInChats.lcUserUuid),
      )
      .innerJoin(
        tgUsersToTgChats,
        eq(lcUsersToUsersInChats.userInChatUuid, tgUsersToTgChats.uuid),
      )
      .innerJoin(tgUsers, eq(tgUsersToTgChats.tgUserUuid, tgUsers.uuid))
      .innerJoin(tgChats, eq(tgUsersToTgChats.tgChatUuid, tgChats.uuid))
      .innerJoin(lcChatSettings, eq(lcChatSettings.tgChatUuid, tgChats.uuid))
      .leftJoin(latestSubmission, eq(lcUsers.uuid, latestSubmission.lcUserUuid))
      .where(
        and(
          isNotNull(lcUsersToUsersInChats.lcUserUuid),
          eq(lcUsersToUsersInChats.isActive, true),
          eq(lcChatSettings.isActive, true),
        ),
      )
      // prioritise active users
      .orderBy(sql`${latestSubmission.submittedAt} desc nulls last`)

    const map = hits.reduce((acc, hit) => {
      const key = hit.lc_users.uuid
      const lcUser =
        acc.get(key) ||
        ({
          lcUser: hit.lc_users,
          lcUserInChats: [],
          tgUser: hit.tg_users,
          tgChat: hit.tg_chats,
          latestSubmission: hit.latest_submission,
        } satisfies GetAllActiveLcChatUsersHit)

      lcUser.lcUserInChats.push({
        chatSettings: hit.lc_chat_settings,
        entity: hit.lc_users_to_users_in_chats!,
      })

      acc.set(key, lcUser)

      return acc
    }, new Map<string, GetAllActiveLcChatUsersHit>())

    return Array.from(map.values())
  }

  async connectLcUserToUserInChat(
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

  async disconnectLcUserFromUserInChat(userInChatUuid: string): Promise<void> {
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
        target: [acceptedSubmissions.submittedAt],
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

  /**
   * should retrieve all LC users in the chat
   * count unique submissions across difficulties
   * sort by the number of unique submissions
   * group by tgUserUuid
   * calculate score based on the number of unique submissions
   * @param tgChatUuid
   * @param since
   * @param offset
   * @param limit
   */
  async getLeaderboard(
    tgChatUuid: string,
    since: Date,
    offset = 0,
    limit = 10,
  ) {
    const distinctSubmissions = this.client
      .selectDistinctOn([acceptedSubmissions.lcProblemUuid])
      .from(acceptedSubmissions)
      .as('submissions')

    const statsQuery = this.client.$with('stats').as(
      this.client
        .select({
          tgUserUuid: sql`${tgUsers.uuid}`.as('tg_user_uuid'),
          lcUserUuid: sql`${lcUsers.uuid}`.as('lc_user_uuid'),
          easy: sql<number>`(count(${lcProblems.difficulty}) filter ( where ${lcProblems.difficulty} = 'easy' ))::integer`.as(
            'easy',
          ),
          medium:
            sql<number>`(count(${lcProblems.difficulty}) filter ( where ${lcProblems.difficulty} = 'medium' ))::integer`.as(
              'medium',
            ),
          hard: sql<number>`(count(${lcProblems.difficulty}) filter ( where ${lcProblems.difficulty} = 'hard' ))::integer`.as(
            'hard',
          ),
        })
        .from(lcUsersToUsersInChats)
        .innerJoin(
          tgUsersToTgChats,
          eq(tgUsersToTgChats.uuid, lcUsersToUsersInChats.userInChatUuid),
        )
        .innerJoin(tgChats, eq(tgChats.uuid, tgUsersToTgChats.tgChatUuid))
        .innerJoin(lcChatSettings, eq(lcChatSettings.tgChatUuid, tgChats.uuid))
        .innerJoin(tgUsers, eq(tgUsers.uuid, tgUsersToTgChats.tgUserUuid))
        .innerJoin(lcUsers, eq(lcUsers.uuid, lcUsersToUsersInChats.lcUserUuid))
        .leftJoin(
          distinctSubmissions,
          eq(distinctSubmissions.lcUserUuid, lcUsers.uuid),
        )
        .leftJoin(
          lcProblems,
          eq(lcProblems.uuid, distinctSubmissions.lcProblemUuid),
        )
        .where(
          and(
            inArray(tgChats.role, ['member', 'administrator']),
            gte(lcChatSettings.leaderboardStartedAt, since),
            eq(tgChats.uuid, tgChatUuid),
          ),
        )
        .groupBy(tgUsers.uuid, lcUsers.uuid),
    )

    const query = this.client
      .with(statsQuery)
      .select({
        easy: statsQuery.easy,
        medium: statsQuery.medium,
        hard: statsQuery.hard,
        user: tgUsers,
        lcUser: lcUsers,
        score:
          sql<number>`(${statsQuery.easy} * ${LC_SCORE_COEFFICIENTS.easy} + ${statsQuery.medium} * ${LC_SCORE_COEFFICIENTS.medium} + ${statsQuery.hard} * ${LC_SCORE_COEFFICIENTS.hard})::integer`.as(
            'score',
          ),
      })
      .from(statsQuery)
      .innerJoin(tgUsers, eq(tgUsers.uuid, statsQuery.tgUserUuid))
      .innerJoin(lcUsers, eq(lcUsers.uuid, statsQuery.lcUserUuid))
      .orderBy(desc(sql`score`))
      .offset(offset)
      .limit(limit)

    const hits = await query

    const countHit = await this.client
      .with(statsQuery)
      .select({
        count: count(),
      })
      .from(statsQuery)

    return { hits, total: countHit[0].count }
  }
}
