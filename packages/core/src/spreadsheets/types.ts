import {
  GoogleSpreadsheetInsert,
  GoogleSpreadsheetSelect,
} from '@/spreadsheets/GoogleSpreadsheetsDao'
import { LcUserInTgChatSelect, SubmissionSelect } from '@/lc-users'
import { LcProblemSelect } from '@/lc'

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
  })[]
  lcUserInTgChat: LcUserInTgChatSelect
}
