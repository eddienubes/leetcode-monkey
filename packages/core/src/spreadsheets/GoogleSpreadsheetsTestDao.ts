import {
  GoogleSpreadsheetInsert,
  GoogleSpreadsheetsDao,
  GoogleSpreadsheetSelect,
} from '@/spreadsheets/GoogleSpreadsheetsDao'
import { Injectable, randomAlphaNumStr } from '@/common'
import { PgService } from '@/pg'

@Injectable(PgService)
export class GoogleSpreadsheetsTestDao extends GoogleSpreadsheetsDao {
  constructor(pg: PgService) {
    super(pg)
  }

  async generateGoogleSpreadsheet(
    tgChatUuid: string,
    attrs?: Partial<GoogleSpreadsheetInsert>,
  ): Promise<GoogleSpreadsheetSelect> {
    return await this.upsert({
      tgChatUuid,
      spreadsheetId: randomAlphaNumStr(10),
      spreadsheetName: randomAlphaNumStr(30),
      refreshToken: randomAlphaNumStr(20),
      isConnected: true,
      isConnectedToggledAt: new Date(),
      ...(attrs || {}),
    })
  }
}
