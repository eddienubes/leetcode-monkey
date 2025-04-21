import {
  boolean,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .$onUpdate(() => new Date())
    .defaultNow(),
}

export type TgMemberStatus =
  | 'creator'
  | 'administrator'
  | 'member'
  | 'restricted'
  | 'left'
  | 'kicked'

export const tgChats = pgTable('tg_chats', {
  uuid: uuid('uuid').primaryKey().defaultRandom(),
  tgId: varchar('tg_id').notNull().unique(),
  type: varchar('type').notNull(),
  title: varchar('title'),
  role: varchar('role').notNull().$type<TgMemberStatus>(),

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

export const tgUsers = pgTable('tg_users', {
  uuid: uuid('uuid').primaryKey().defaultRandom(),
  tgId: varchar('tg_id').notNull().unique(),
  isBot: boolean('is_bot').notNull().default(false),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name'),
  username: varchar('username'),
  languageCode: varchar('language_code'),
  isPremium: boolean('is_premium').notNull().default(false),

  ...timestamps,
})

export const tgUsersToTgChats = pgTable(
  'tg_users_to_tg_chats',
  {
    tgChatUuid: uuid('tg_chat_uuid')
      .notNull()
      .references(() => tgChats.uuid),
    tgUserUuid: uuid('tg_user_uuid')
      .notNull()
      .references(() => tgUsers.uuid),
    ...timestamps,
  },
  (t) => [unique().on(t.tgUserUuid, t.tgChatUuid)],
)

export const lcUsers = pgTable('lc_users', {
  uuid: uuid('uuid').defaultRandom().primaryKey(),
  slug: varchar().notNull().unique(),
  realName: varchar(),
  avatarUrl: varchar(),

  ...timestamps,
})

export const tgUsersToTgChatsRelation = relations(
  tgUsersToTgChats,
  ({ one }) => ({
    tgChat: one(tgChats, {
      fields: [tgUsersToTgChats.tgChatUuid],
      references: [tgChats.uuid],
    }),
    tgUser: one(tgUsers, {
      fields: [tgUsersToTgChats.tgUserUuid],
      references: [tgUsers.uuid],
    }),
  }),
)

export const lcUsersInTgChats = pgTable(
  'lc_users_in_tg_chats',
  {
    tgUserUuid: uuid('tg_user_uuid')
      .notNull()
      .references(() => tgUsers.uuid),
    tgChatUuid: uuid('tg_chat_uuid')
      .notNull()
      .references(() => tgChats.uuid),
    lcUserUuid: uuid('lc_user_uuid')
      .notNull()
      .references(() => lcUsers.uuid),
    // Per user per chat settings
    isConnected: boolean('is_connected').notNull().default(false),
    isConnectedToggledAt: timestamp('is_connected_toggled_at', {
      withTimezone: true,
    }),
    isNotificationsEnabled: boolean('is_notifications_enabled')
      .notNull()
      .default(true),
    isNotificationsEnabledToggledAt: timestamp(
      'is_notifications_enabled_toggled_at',
      {
        withTimezone: true,
      },
    ).notNull(),
    ...timestamps,
  },
  // you cannot have the same user in the same chat connected to different lc users
  (t) => [unique().on(t.tgChatUuid, t.tgUserUuid)],
)

export const lcChatSettings = pgTable('lc_chat_settings', {
  tgChatUuid: uuid('tg_chat_uuid')
    .notNull()
    .references(() => tgChats.uuid)
    .unique(),
  isNotificationsEnabled: boolean('is_notifications_enabled')
    .notNull()
    .default(true),
  isNotificationsEnabledToggledAt: timestamp(
    'is_notifications_enabled_toggled_at',
    { withTimezone: true },
  ).notNull(),
  leaderboardStartedAt: timestamp('leaderboard_started_at', {
    withTimezone: true,
  }).notNull(),
  ...timestamps,
})

export const acceptedSubmissions = pgTable('accepted_submissions', {
  uuid: uuid('uuid').primaryKey().defaultRandom(),
  lcUserUuid: uuid('lc_user_uuid')
    .notNull()
    .references(() => lcUsers.uuid),
  lcProblemUuid: uuid('lc_problem_uuid')
    .notNull()
    .references(() => lcProblems.uuid),
  submittedAt: timestamp('submitted_at', { withTimezone: true })
    .notNull()
    .unique(),
  ...timestamps,
  // No composite unique constraint on purpose. A single user may have multiple submissions for the same problem
})

export type LcProblemDifficulty = 'easy' | 'medium' | 'hard'

export const lcProblems = pgTable('lc_problems', {
  uuid: uuid('uuid').primaryKey().defaultRandom(),
  slug: varchar('slug').notNull().unique(),
  title: varchar().notNull(),
  difficulty: varchar().notNull().$type<LcProblemDifficulty>(),
  lcId: varchar('lc_id').notNull(),
  topics: varchar('topics').array().notNull().default([]),
  ...timestamps,
})

/**
 * A table of pointers to the latest notification date to prevent duplicates
 */
export const lcTgNotifications = pgTable(
  'lc_tg_notifications',
  {
    lcUserUuid: uuid('lc_user_uuid')
      .notNull()
      .references(() => lcUsers.uuid),
    tgChatUuid: uuid('tg_chat_uuid')
      .notNull()
      .references(() => tgChats.uuid),
    lastSentAt: timestamp('last_sent_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [unique().on(t.tgChatUuid, t.lcUserUuid)],
)

export const googleSpreadsheets = pgTable('google_spreadsheets', {
  uuid: uuid('uuid').primaryKey().defaultRandom(),
  // only 1 spreadsheet per chat
  tgChatUuid: uuid('tg_chat_uuid')
    .notNull()
    .unique()
    .references(() => tgChats.uuid),
  // spreadsheetId is the id of the spreadsheet in google drive
  spreadsheetId: varchar('spreadsheet_id').notNull().unique(),
  spreadsheetName: varchar('spreadsheet_name').notNull(),
  isConnected: boolean('is_connected').notNull().default(false),
  isConnectedToggledAt: timestamp('is_connected_toggled_at', {
    withTimezone: true,
  }).notNull(),
  /**
   * Google oauth refresh token.
   * It's permanent in google oauth implementation
   * This is a terrible practice to store refresh token in the sheets entity.
   * But this is what we do for now to mitigate complexities.
   * Consider rather storing it in the dedicated oauth connection table.
   * Otherwise, it leads to a plethora of other bad practices like putting refresh token inside
   * encrypted cookie (see auth.ts in the UI project)
   */
  refreshToken: varchar('refresh_token').notNull(),

  ...timestamps,
})

/**
 * A table of pointers to the latest google spreadsheet write to prevent duplicates
 */
export const googleSpreadsheetUpdates = pgTable(
  'google_spreadsheet_updates',
  {
    uuid: uuid('uuid').primaryKey().defaultRandom(),
    googleSpreadsheetUuid: uuid('google_spreadsheet_uuid')
      .notNull()
      .references(() => googleSpreadsheets.uuid),
    tgChatUuid: uuid('tg_chat_uuid')
      .notNull()
      .references(() => tgChats.uuid),
    lastUpdatedAt: timestamp('last_updated_at', {
      withTimezone: true,
    }).notNull(),

    ...timestamps,
  },
  (t) => [unique().on(t.tgChatUuid, t.googleSpreadsheetUuid)],
)
