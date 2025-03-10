import {
  LcUserSelect,
  LcUserToUserInChatSelect,
  SubmissionSelect,
} from '@/lc-users/LcUsersDao'
import {
  LcChatSettingsSelect,
  TgChatSelect,
  TgUsersToTgChatsSelect,
} from '@/tg/TgChatsDao'
import { TgUserSelect } from '@/tg/TgUsersDao'

export interface GetAllActiveLcChatUsersHit {
  lcUser: LcUserSelect
  lcUserInChats: {
    chatSettings: LcChatSettingsSelect
    entity: LcUserToUserInChatSelect
    tgChat: TgChatSelect
  }[]
  tgUser: TgUserSelect
  latestSubmission: SubmissionSelect | null
}
