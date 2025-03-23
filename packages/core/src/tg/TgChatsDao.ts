import {
  eq,
  getTableColumns,
  InferInsertModel,
  InferSelectModel,
  sql,
} from 'drizzle-orm'
import { lcChatSettings, tgChats, tgUsersToTgChats } from '../pg'
import { PgDao, PgService } from '../pg'
import { Injectable, NotFoundError } from '../common'

export type TgChatSelect = InferSelectModel<typeof tgChats>
export type TgChatInsert = InferInsertModel<typeof tgChats>
export type TgUsersToTgChatsSelect = InferSelectModel<typeof tgUsersToTgChats>
export type TgUsersToTgChatsInsert = InferInsertModel<typeof tgUsersToTgChats>
export type LcChatSettingsInsert = InferInsertModel<typeof lcChatSettings>
export type LcChatSettingsSelect = InferSelectModel<typeof lcChatSettings>

@Injectable(PgService)
export class TgChatsDao extends PgDao {
  constructor(pgService: PgService) {
    super(pgService)
  }

  async getByTgId(tgId: string): Promise<TgChatSelect> {
    const hit = await this.client.query.tgChats.findFirst({
      where: eq(tgChats.tgId, tgId),
    })

    if (!hit) {
      throw new NotFoundError(`TgChat with tgId ${tgId} not found`)
    }

    return hit
  }

  async upsert(
    chat: TgChatInsert,
    upsert?: Partial<TgChatInsert>,
  ): Promise<TgChatSelect & { isCreated: boolean }> {
    const [upserted] = await this.client
      .insert(tgChats)
      .values(chat)
      .onConflictDoUpdate({
        target: [tgChats.tgId],
        set: upsert || chat,
      })
      .returning({
        ...getTableColumns(tgChats),
        // a hack to figure out if the submission was created or updated
        // https://sigpwned.com/2023/08/10/postgres-upsert-created-or-updated/
        // https://stackoverflow.com/a/39204667
        isCreated: sql<boolean>`xmax = 0 as isCreated`,
      })
    return upserted
  }

  async addUserToChat(
    tgUserUuid: string,
    tgChatUuid: string,
  ): Promise<TgUsersToTgChatsSelect> {
    const [hit] = await this.client
      .insert(tgUsersToTgChats)
      .values({
        tgUserUuid,
        tgChatUuid,
      })
      .onConflictDoUpdate({
        target: [tgUsersToTgChats.tgUserUuid, tgUsersToTgChats.tgChatUuid],
        set: {
          tgUserUuid,
          tgChatUuid,
        },
      })
      .returning()
    return hit
  }

  async upsertSettings(
    insert: LcChatSettingsInsert,
    upsert?: Partial<LcChatSettingsInsert>,
  ): Promise<LcChatSettingsSelect> {
    const [upserted] = await this.client
      .insert(lcChatSettings)
      .values(insert)
      .onConflictDoUpdate({
        target: [lcChatSettings.tgChatUuid],
        set: upsert || insert,
      })
      .returning()
    return upserted
  }

  async getSettings(tgChatUuid: string): Promise<LcChatSettingsSelect> {
    const hit = await this.client.query.lcChatSettings.findFirst({
      where: eq(lcChatSettings.tgChatUuid, tgChatUuid),
    })

    if (!hit) {
      throw new NotFoundError(
        `LC Chat settings with tg chat uuid ${tgChatUuid} not found`,
      )
    }

    return hit
  }
}
