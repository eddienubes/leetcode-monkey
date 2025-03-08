import {
  LcUserSelect,
  LcUserToUserInChatSelect,
  SubmissionSelect,
} from '@/lc-users/LcUsersDao'
import { TgUserSelect } from '@/tg/TgUsersDao'
import { lcChatSettingsSelect, TgChatSelect } from '@/tg/TgChatsDao'

export interface LcRecentAcceptedSubmissions {
  recentAcSubmissionList: {
    id: string
    title: string
    titleSlug: string
    timestamp: string
  }[]
}

export interface TgSubmissionNotifyJob {
  submission: SubmissionSelect
  tgUser: TgUserSelect
  tgChat: TgChatSelect
  lcUser: LcUserSelect
  lcUserInChat: LcUserToUserInChatSelect
  lcChatSettings: lcChatSettingsSelect
}

export interface LcSaveSubmissionJob {
  entries: {
    submission: LcRecentAcceptedSubmissions['recentAcSubmissionList'][number]
    tgUser: TgUserSelect
    tgChat: TgChatSelect
    lcUser: LcUserSelect
    lcUserInChat: LcUserToUserInChatSelect
    lcChatSettings: lcChatSettingsSelect
  }[]
}