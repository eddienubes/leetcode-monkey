import {
  LcUserSelect,
  LcUserInTgChatSelect,
  SubmissionSelect,
} from '@/lc-users/LcUsersDao'
import { TgUserSelect } from '@/tg/TgUsersDao'
import { LcChatSettingsSelect, TgChatSelect } from '@/tg/TgChatsDao'
import { LcProblemSelect } from '@/lc/LcProblemsDao'
import { ToJsonType } from '@/common/types'

export interface LcRecentAcceptedSubmissions {
  recentAcSubmissionList: {
    id: string
    title: string
    titleSlug: string
    timestamp: string
  }[]
}

export type TgSubmissionNotifyJob = {
  submission: SubmissionSelect
  tgUser: TgUserSelect
  tgChat: TgChatSelect
  lcUser: LcUserSelect
  lcUserInChat: LcUserInTgChatSelect
  lcChatSettings: LcChatSettingsSelect
  lcProblem: LcProblemSelect
}

export interface LcPullSubmissionJob {
  submission: LcRecentAcceptedSubmissions['recentAcSubmissionList'][number]
  tgUser: TgUserSelect
  lcUser: LcUserSelect
}
