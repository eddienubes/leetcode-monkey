import { BullQueue } from '@/common'
import { LcChatSettingsSelect, TgChatSelect, TgUserSelect } from '@/tg'
import {
  LcUserInTgChatSelect,
  LcUserSelect,
  SubmissionSelect,
} from '@/lc-users'
import { LcRecentAcceptedSubmissions } from '@/lc/types/types'
import { LcProblemSelect } from '@/lc/LcProblemsDao'
import { GoogleSpreadsheetSelect } from '@/spreadsheets/GoogleSpreadsheetsDao'
import { SpreadsheetToUpdate } from '@/spreadsheets'

export class LcPullSubmissionsQueue extends BullQueue {
  static queueName = 'lc-pull-submissions'

  submission: LcRecentAcceptedSubmissions['recentAcSubmissionList'][number]
  tgUser: TgUserSelect
  lcUser: LcUserSelect
}

export class TgSubmissionsNotifyQueue extends BullQueue {
  static queueName = 'tg-submissions-notify'

  submission: SubmissionSelect
  tgUser: TgUserSelect
  tgChat: TgChatSelect
  lcUser: LcUserSelect
  lcUserInChat: LcUserInTgChatSelect
  lcChatSettings: LcChatSettingsSelect
  lcProblem: LcProblemSelect
}

export class LcSpreadsheetWriteQueue extends BullQueue {
  static queueName = 'spreadsheets-writer-queue'

  sheet: SpreadsheetToUpdate
}
