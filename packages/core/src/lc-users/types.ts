import {
  LcUserInTgChatSelect,
  LcUserSelect,
  SubmissionSelect,
} from './LcUsersDao'
import { LcChatSettingsSelect, TgChatSelect, TgUserSelect } from '../tg'

export interface GetAllActiveLcChatUsersHit {
  lcUser: LcUserSelect
  lcUserInChats: {
    chatSettings: LcChatSettingsSelect
    entity: LcUserInTgChatSelect
    tgChat: TgChatSelect
  }[]
  tgUser: TgUserSelect
  latestSubmission: SubmissionSelect | null
}
