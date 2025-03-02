import {
  boolean,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date())
    .defaultNow(),
}

export const tgChats = pgTable('tg_chats', {
  uuid: uuid('uuid').primaryKey().defaultRandom(),
  tgId: varchar('tg_id').notNull().unique(),
  type: varchar('type').notNull(),
  title: varchar('title'),
  role: varchar('role').notNull(),

  username: varchar('username'),
  /**
   * Full name of a user in case the chat is private
   */
  fullName: varchar('fullname'),

  /**
   * if the supergroup chat is a forum
   */
  isForum: boolean('is_forum').notNull().default(false),

  /**
   * Description, for supergroups and channel chats
   */
  description: varchar('description'),

  /**
   * Bio of the other party in a private chat
   */
  bio: varchar('bio'),

  /**
   * True, if the chat is a private chat and the other party can join the chat by request
   */
  joinByRequest: boolean('join_by_request').notNull().default(false),

  /**
   * Chat invite link, for supergroups and channel chats
   */
  inviteLink: varchar('invite_link'),

  ...timestamps,
})

export const leetCodeUsers = pgTable('leetcode_users', {
  uuid: uuid('uuid').primaryKey().defaultRandom(),
  slug: varchar().notNull().unique(),
  realName: varchar(),
  avatarUrl: varchar(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date())
    .defaultNow(),
})

export const leetCodeUsersToTgChats = pgTable(
  'leetcode_users_to_tg_chats',
  {
    leetcodeUserUuid: uuid('leetcode_user_uuid')
      .notNull()
      .references(() => leetCodeUsers.uuid),
    tgChatUuid: uuid('tg_chat_uuid')
      .notNull()
      .references(() => tgChats.uuid),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => [unique().on(t.leetcodeUserUuid, t.tgChatUuid)],
)

export const leetCodeUserSettingsEntries = pgTable(
  'leetcode_user_settings_entries',
  {
    notificationsEnabled: boolean().notNull().default(false),
    leetcodeUserUuid: uuid('leetcode_user_uuid')
      .notNull()
      .references(() => leetCodeUsers.uuid),
    ...timestamps,
  },
)

export const acceptedSubmissions = pgTable('accepted_submissions', {
  leetcodeUserUuid: uuid('leetcode_user_uuid')
    .notNull()
    .references(() => leetCodeUsers.uuid),
  problemSlug: varchar().notNull(),
  title: varchar().notNull(),
  leetCodeId: varchar().notNull(),
  ...timestamps,
})
