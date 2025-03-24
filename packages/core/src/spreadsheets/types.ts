import { GoogleSpreadsheetInsert } from '@/spreadsheets/GoogleSpreadsheetsDao'

export type SpreadsheetConnectionSession = {
  tgChatUuid: string
  tgUserUuid: string
  tgMessageId: string
}

export type ConnectSpreadsheetParams = Pick<
  GoogleSpreadsheetInsert,
  'spreadsheetName' | 'spreadsheetId' | 'refreshToken'
>
