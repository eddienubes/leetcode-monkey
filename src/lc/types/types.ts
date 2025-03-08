import {
  LcUserSelect,
  LcUserToUserInChatSelect,
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

export type TgSubmissionNotifyJob = ToJsonType<{
  submission: SubmissionSelect
  tgUser: TgUserSelect
  tgChat: TgChatSelect
  lcUser: LcUserSelect
  lcUserInChat: LcUserToUserInChatSelect
  lcChatSettings: LcChatSettingsSelect
  lcProblem: LcProblemSelect
}>

export interface LcSaveSubmissionJob {
  submission: LcRecentAcceptedSubmissions['recentAcSubmissionList'][number]
  tgUser: TgUserSelect
  tgChat: TgChatSelect
  lcUser: LcUserSelect
  lcUserInChat: LcUserToUserInChatSelect
  lcChatSettings: LcChatSettingsSelect
}
