import { PgDao } from '@/pg/PgDao'
import { PgService } from '@/pg/PgService'
import {
  and,
  desc,
  eq,
  gt,
  gte,
  InferInsertModel,
  InferSelectModel,
  isNull,
  or,
} from 'drizzle-orm'
import { Injectable } from '@/common'
import { SpreadsheetToUpdate } from '@/spreadsheets/types'
import {
  acceptedSubmissions,
  googleSpreadsheets,
  googleSpreadsheetUpdates,
  lcChatSettings,
  lcProblems,
  lcUsers,
  lcUsersInTgChats,
  tgChats,
  tgUsers,
} from '@/pg/schema'

export type GoogleSpreadsheetSelect = InferSelectModel<
  typeof googleSpreadsheets
>
export type GoogleSpreadsheetInsert = InferInsertModel<
  typeof googleSpreadsheets
>
export type GoogleSpreadsheetUpdateSelect = InferSelectModel<
  typeof googleSpreadsheetUpdates
>
export type GoogleSpreadsheetUpdateInsert = InferInsertModel<
  typeof googleSpreadsheetUpdates
>

@Injectable(PgService)
export class GoogleSpreadsheetsDao extends PgDao {
  constructor(pgService: PgService) {
    super(pgService)
  }

  async upsert(
    insert: GoogleSpreadsheetInsert,
  ): Promise<GoogleSpreadsheetSelect> {
    const hits = await this.client
      .insert(googleSpreadsheets)
      .values(insert)
      .onConflictDoUpdate({
        target: [googleSpreadsheets.tgChatUuid],
        set: insert,
      })
      .returning()

    return hits[0]
  }

  async updateByUuid(
    uuid: string,
    update: Partial<GoogleSpreadsheetInsert>,
  ): Promise<GoogleSpreadsheetSelect> {
    const hits = await this.client
      .update(googleSpreadsheets)
      .set(update)
      .where(eq(googleSpreadsheets.uuid, uuid))
      .returning()

    return hits[0]
  }

  async updateByChatUuid(
    tgChatUuid: string,
    update: Partial<GoogleSpreadsheetInsert>,
  ): Promise<GoogleSpreadsheetSelect> {
    const hits = await this.client
      .update(googleSpreadsheets)
      .set(update)
      .where(eq(googleSpreadsheets.tgChatUuid, tgChatUuid))

    return hits[0]
  }

  /**
   * Pull spreadsheets to notify about new submissions
   */
  async getSpreadsheetsToUpdate(): Promise<SpreadsheetToUpdate[]> {
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

    const query = this.client
      .select()
      .from(googleSpreadsheets)
      // get all spreadsheets with connected lc users
      .innerJoin(
        lcUsersInTgChats,
        and(
          eq(lcUsersInTgChats.tgChatUuid, googleSpreadsheets.tgChatUuid),
          eq(lcUsersInTgChats.isConnected, true),
        ),
      )
      .innerJoin(tgUsers, eq(tgUsers.uuid, lcUsersInTgChats.tgUserUuid))
      .innerJoin(lcUsers, eq(lcUsers.uuid, lcUsersInTgChats.lcUserUuid))
      .innerJoin(
        lcChatSettings,
        eq(lcUsersInTgChats.tgChatUuid, lcChatSettings.tgChatUuid),
      )
      // get distinct submissions only after leaderboard started_at
      .innerJoin(
        distinctSubmissions,
        and(
          eq(distinctSubmissions.lcUserUuid, lcUsersInTgChats.lcUserUuid),
          gte(
            distinctSubmissions.submittedAt,
            lcChatSettings.leaderboardStartedAt,
          ),
        ),
      )
      .innerJoin(
        lcProblems,
        eq(lcProblems.uuid, distinctSubmissions.lcProblemUuid),
      )
      .leftJoin(
        googleSpreadsheetUpdates,
        and(
          eq(
            googleSpreadsheets.uuid,
            googleSpreadsheetUpdates.googleSpreadsheetUuid,
          ),
          eq(lcUsersInTgChats.tgChatUuid, googleSpreadsheetUpdates.tgChatUuid),
        ),
      )
      // prevent duplicates for old submissions using extra table
      .where(
        and(
          eq(googleSpreadsheets.isConnected, true),
          or(
            isNull(googleSpreadsheetUpdates),
            gt(
              distinctSubmissions.submittedAt,
              googleSpreadsheetUpdates.lastUpdatedAt,
            ),
          ),
        ),
      )
      .orderBy(distinctSubmissions.submittedAt)

    const hits = await query

    const map = new Map<string, SpreadsheetToUpdate>()

    for (const hit of hits) {
      const sheetUuid = hit.google_spreadsheets.uuid
      const sheet = map.get(sheetUuid)

      if (!sheet) {
        map.set(sheetUuid, {
          ...hit.google_spreadsheets,
          newSubmissions: [],
        })
      }

      map.get(sheetUuid)!.newSubmissions.push({
        ...hit.submissions,
        problem: hit.lc_problems,
        lcUser: hit.lc_users,
        tgUser: hit.tg_users,
      })
    }

    return Array.from(map.values())
  }

  async upsertSpreadsheetUpdate(
    upsert: GoogleSpreadsheetUpdateInsert,
  ): Promise<GoogleSpreadsheetUpdateSelect> {
    const hits = await this.client
      .insert(googleSpreadsheetUpdates)
      .values(upsert)
      .onConflictDoUpdate({
        target: [
          googleSpreadsheetUpdates.tgChatUuid,
          googleSpreadsheetUpdates.googleSpreadsheetUuid,
        ],
        set: {
          lastUpdatedAt: new Date(),
        },
      })
      .returning()

    return hits[0]
  }

  async getByTgChatUuidIfAny(
    tgChatUuid: string,
  ): Promise<GoogleSpreadsheetSelect | null> {
    const hit = await this.client.query.googleSpreadsheets.findFirst({
      where: eq(googleSpreadsheets.tgChatUuid, tgChatUuid),
    })

    return hit || null
  }
}
