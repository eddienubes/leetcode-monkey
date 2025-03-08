import {
  LcUserSelect,
  LcUserToUserInChatSelect,
} from '@/lc-users/LcUsersDao'
import {
  lcChatSettingsSelect,
  TgChatSelect,
  TgUsersToTgChatsSelect,
} from '@/tg/TgChatsDao'
import { TgUserSelect } from '@/tg/TgUsersDao'

export interface GetAllActiveLcChatUsersHit {
  lc_users_to_users_in_chats: LcUserToUserInChatSelect
  lc_users: LcUserSelect
  tg_users_to_tg_chats: TgUsersToTgChatsSelect
  tg_users: TgUserSelect
  tg_chats: TgChatSelect
  lc_chat_settings: lcChatSettingsSelect
}
