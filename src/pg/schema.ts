import {
  boolean,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { TgMemberStatus } from '@/bot/types'

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
    isActive: boolean('is_active').notNull().default(true),
    isActiveToggledAt: timestamp('is_active_toggled_at').notNull(),
    ...timestamps,
  },
  // you cannot have the same user in the same chat connected to different lc users
  (t) => [unique().on(t.tgChatUuid, t.lcUserUuid)],
)

export const lcChatSettings = pgTable('lc_chat_settings', {
  tgChatUuid: uuid('tg_chat_uuid')
    .notNull()
    .references(() => tgChats.uuid)
    .unique(),
  isActive: boolean('is_active').notNull().default(true),
  isActiveToggledAt: timestamp('is_active_toggled_at').notNull(),
  leaderboardStartedAt: timestamp('leaderboard_started_at').notNull(),
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
  submittedAt: timestamp('submitted_at').notNull().unique(),
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

export const lcTgNotifications = pgTable(
  'lc_tg_notifications',
  {
    lcUserUuid: uuid('lc_user_uuid')
      .notNull()
      .references(() => lcUsers.uuid),
    tgChatUuid: uuid('tg_chat_uuid')
      .notNull()
      .references(() => tgChats.uuid),
    lastSentAt: timestamp('last_sent_at').notNull(),
    ...timestamps,
  },
  (t) => [unique().on(t.tgChatUuid, t.lcUserUuid)],
)
