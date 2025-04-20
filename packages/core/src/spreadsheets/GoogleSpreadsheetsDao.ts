import {
  acceptedSubmissions,
  googleSpreadsheets,
  googleSpreadsheetUpdates,
  lcProblems,
  lcUsersInTgChats,
  PgDao,
  PgService,
} from '@/pg'
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

export type GoogleSpreadsheetSelect = InferSelectModel<
  typeof googleSpreadsheets
>
export type GoogleSpreadsheetInsert = InferInsertModel<
  typeof googleSpreadsheets
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

  /**
   * Pull spreadsheets to notify about new submissions
   */
  async pullSpreadsheetsToUpdate(since?: Date): Promise<SpreadsheetToUpdate[]> {
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
      .innerJoin(
        lcUsersInTgChats,
        eq(lcUsersInTgChats.tgChatUuid, googleSpreadsheets.tgChatUuid),
      )
      .innerJoin(
        distinctSubmissions,
        eq(distinctSubmissions.lcUserUuid, lcUsersInTgChats.lcUserUuid),
      )
      .innerJoin(
        lcProblems,
        eq(lcProblems.uuid, distinctSubmissions.lcProblemUuid),
      )
      .leftJoin(
        googleSpreadsheetUpdates,
        and(
          eq(lcUsersInTgChats.lcUserUuid, googleSpreadsheetUpdates.lcUserUuid),
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
          since ? gte(distinctSubmissions.submittedAt, since) : undefined,
        ),
      )

    const hits = await query

    const map = new Map<string, SpreadsheetToUpdate>()

    for (const hit of hits) {
      const sheetUuid = hit.google_spreadsheets.uuid
      const sheet = map.get(sheetUuid)

      if (!sheet) {
        map.set(sheetUuid, {
          ...hit.google_spreadsheets,
          newSubmissions: [],
          lcUserInTgChat: hit.lc_users_in_tg_chats,
        })
      }

      map.get(sheetUuid)!.newSubmissions.push({
        ...hit.submissions,
        problem: hit.lc_problems,
      })
    }

    return Array.from(map.values())
  }
}
