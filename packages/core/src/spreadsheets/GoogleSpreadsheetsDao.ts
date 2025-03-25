import { googleSpreadsheets, PgDao, PgService } from '@/pg'
import { eq, InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { Injectable } from '@/common'

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
}
