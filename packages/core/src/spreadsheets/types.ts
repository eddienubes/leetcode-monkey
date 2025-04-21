import {
  GoogleSpreadsheetInsert,
  GoogleSpreadsheetSelect,
} from '@/spreadsheets/GoogleSpreadsheetsDao'
import { LcUserSelect, SubmissionSelect } from '@/lc-users'
import { LcProblemSelect } from '@/lc'
import { TgUserSelect } from '@/tg'

export type SpreadsheetConnectionSession = {
  tgChatUuid: string
  tgUserUuid: string
  tgMessageId: string
}

export type ConnectSpreadsheetParams = Pick<
  GoogleSpreadsheetInsert,
  'spreadsheetName' | 'spreadsheetId' | 'refreshToken'
>

export type SpreadsheetToUpdate = GoogleSpreadsheetSelect & {
  newSubmissions: (SubmissionSelect & {
    problem: LcProblemSelect
    lcUser: LcUserSelect
    tgUser: TgUserSelect
  })[]
}
