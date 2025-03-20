import {
  LcChatSettingsSelect,
  LcProblemSelect,
  LcUserInTgChatSelect,
  LcUserSelect,
  SubmissionSelect,
  TgChatSelect,
  TgUserSelect,
} from '@repo/core'

export type TgSubmissionNotifyJob = {
  submission: SubmissionSelect
  tgUser: TgUserSelect
  tgChat: TgChatSelect
  lcUser: LcUserSelect
  lcUserInChat: LcUserInTgChatSelect
  lcChatSettings: LcChatSettingsSelect
  lcProblem: LcProblemSelect
}
