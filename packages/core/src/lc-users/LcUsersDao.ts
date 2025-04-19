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
  isNull,
  or,
  sql,
} from 'drizzle-orm'
import {
  acceptedSubmissions,
  lcChatSettings,
  lcProblems,
  lcTgNotifications,
  lcUsers,
  lcUsersInTgChats,
  PgDao,
  PgService,
  tgChats,
  tgUsers,
} from '../pg'
import { GetAllActiveLcChatUsersHit } from './types'
import { LC_SCORE_COEFFICIENTS } from '../lc'
import { Injectable } from '@/common'

export type LcUserSelect = InferSelectModel<typeof lcUsers>
export type LcUserInsert = InferInsertModel<typeof lcUsers>
export type LcUserInTgChatSelect = InferSelectModel<typeof lcUsersInTgChats>
export type LcUserInTgChatInsert = InferInsertModel<typeof lcUsersInTgChats>
export type SubmissionInsert = InferInsertModel<typeof acceptedSubmissions>
export type SubmissionSelect = InferSelectModel<typeof acceptedSubmissions>

@Injectable(PgService)
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

    const query = this.client
      .select()
      .from(lcUsers)
      .leftJoin(lcUsersInTgChats, eq(lcUsers.uuid, lcUsersInTgChats.lcUserUuid))
      .innerJoin(tgUsers, eq(lcUsersInTgChats.tgUserUuid, tgUsers.uuid))
      .innerJoin(tgChats, eq(lcUsersInTgChats.tgChatUuid, tgChats.uuid))
      .innerJoin(lcChatSettings, eq(lcChatSettings.tgChatUuid, tgChats.uuid))
      .leftJoin(latestSubmission, eq(lcUsers.uuid, latestSubmission.lcUserUuid))
      .where(
        and(
          isNotNull(lcUsersInTgChats.lcUserUuid),
          eq(lcUsersInTgChats.isConnected, true),
        ),
      )
      // prioritise active users
      .orderBy(sql`${latestSubmission.submittedAt} desc nulls last`)

    // console.log(query.toSQL().sql)

    const hits = await query

    const map = hits.reduce((acc, hit) => {
      const key = hit.lc_users.uuid
      const lcUser =
        acc.get(key) ||
        ({
          lcUser: hit.lc_users,
          lcUserInChats: [],
          tgUser: hit.tg_users,
          latestSubmission: hit.latest_submission,
        } satisfies GetAllActiveLcChatUsersHit)

      lcUser.lcUserInChats.push({
        chatSettings: hit.lc_chat_settings,
        entity: hit.lc_users_in_tg_chats!,
        tgChat: hit.tg_chats,
      })

      acc.set(key, lcUser)

      return acc
    }, new Map<string, GetAllActiveLcChatUsersHit>())

    return Array.from(map.values())
  }

  async upsertLcUserInChat(
    entry: LcUserInTgChatInsert,
  ): Promise<LcUserInTgChatSelect> {
    const [hit] = await this.client
      .insert(lcUsersInTgChats)
      .values(entry)
      .onConflictDoUpdate({
        target: [lcUsersInTgChats.tgChatUuid, lcUsersInTgChats.tgUserUuid],
        set: entry,
      })
      .returning()

    return hit
  }

  async disconnectLcUserFromUserInChat(
    tgUserUuid: string,
    tgChatUuid: string,
  ): Promise<void> {
    await this.client
      .update(lcUsersInTgChats)
      .set({
        isConnected: false,
        isConnectedToggledAt: new Date(),
      })
      .where(
        and(
          eq(lcUsersInTgChats.tgUserUuid, tgUserUuid),
          eq(lcUsersInTgChats.tgChatUuid, tgChatUuid),
        ),
      )
  }

  async addSubmissions(
    submissions: SubmissionInsert[],
  ): Promise<(SubmissionSelect & { isCreated: boolean })[]> {
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
      .returning({
        ...getTableColumns(acceptedSubmissions),
        // a hack to figure out if the submission was created or updated
        // https://sigpwned.com/2023/08/10/postgres-upsert-created-or-updated/
        // https://stackoverflow.com/a/39204667
        isCreated: sql<boolean>`xmax = 0 as isCreated`,
      })

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
      .selectDistinctOn([
        acceptedSubmissions.lcProblemUuid,
        acceptedSubmissions.lcUserUuid,
      ])
      .from(acceptedSubmissions)
      .orderBy(
        acceptedSubmissions.lcProblemUuid,
        acceptedSubmissions.lcUserUuid,
        desc(acceptedSubmissions.submittedAt),
      )
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
        .from(lcUsersInTgChats)
        .innerJoin(tgChats, eq(tgChats.uuid, lcUsersInTgChats.tgChatUuid))
        .innerJoin(tgUsers, eq(tgUsers.uuid, lcUsersInTgChats.tgUserUuid))
        .innerJoin(lcUsers, eq(lcUsers.uuid, lcUsersInTgChats.lcUserUuid))
        .innerJoin(lcChatSettings, eq(lcChatSettings.tgChatUuid, tgChats.uuid))
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
            gte(distinctSubmissions.submittedAt, since),
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

    // console.log(query.toSQL().sql)

    const hits = await query

    const countHit = await this.client
      .with(statsQuery)
      .select({
        count: count(),
      })
      .from(statsQuery)

    return { hits, total: countHit[0].count }
  }

  /**
   * Gets all leetcode users in chats to send notifications
   * about recent submissions
   */
  async getLcUsersInChatsToNotify() {
    const hits = await this.client
      .select()
      .from(lcUsersInTgChats)
      .innerJoin(lcUsers, eq(lcUsers.uuid, lcUsersInTgChats.lcUserUuid))
      .innerJoin(tgChats, eq(tgChats.uuid, lcUsersInTgChats.tgChatUuid))
      .innerJoin(tgUsers, eq(tgUsers.uuid, lcUsersInTgChats.tgUserUuid))
      .innerJoin(lcChatSettings, eq(lcChatSettings.tgChatUuid, tgChats.uuid))
      .innerJoin(
        acceptedSubmissions,
        eq(acceptedSubmissions.lcUserUuid, lcUsers.uuid),
      )
      .innerJoin(
        lcProblems,
        eq(lcProblems.uuid, acceptedSubmissions.lcProblemUuid),
      )
      .leftJoin(
        lcTgNotifications,
        and(
          eq(lcTgNotifications.lcUserUuid, lcUsers.uuid),
          eq(lcTgNotifications.tgChatUuid, tgChats.uuid),
        ),
      )
      .where(
        and(
          // only chats where bot is present
          inArray(tgChats.role, ['member', 'administrator']),
          // only active users
          eq(lcUsersInTgChats.isNotificationsEnabled, true),
          gt(
            acceptedSubmissions.submittedAt,
            lcUsersInTgChats.isNotificationsEnabledToggledAt,
          ),
          // only active chats
          eq(lcChatSettings.isNotificationsEnabled, true),
          gt(
            acceptedSubmissions.submittedAt,
            lcChatSettings.isNotificationsEnabledToggledAt,
          ),
          // notifications hasn't been sent yet
          // or it's a new submission
          or(
            isNull(lcTgNotifications.lcUserUuid),
            gt(acceptedSubmissions.submittedAt, lcTgNotifications.lastSentAt),
          ),
        ),
      )

    return hits
  }

  async getLcUserInChat(tgUserUuid: string, tgChatUuid: string) {
    const [hit] = await this.client
      .select({
        lcUserInChat: lcUsersInTgChats,
        lcUser: lcUsers,
      })
      .from(lcUsersInTgChats)
      .innerJoin(lcUsers, eq(lcUsers.uuid, lcUsersInTgChats.lcUserUuid))
      .where(
        and(
          eq(lcUsersInTgChats.tgUserUuid, tgUserUuid),
          eq(lcUsersInTgChats.tgChatUuid, tgChatUuid),
        ),
      )

    return hit || null
  }
}
