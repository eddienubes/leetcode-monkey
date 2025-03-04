import { PgDao } from '@/pg/PgDao'
import { PgService } from '@/pg/PgService'
import { eq, InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { leetCodeChatSettings, tgChats, tgUsersToTgChats } from '@/pg/schema'
import { NotFoundError } from '@/common/errors'

export type TgChatSelect = InferSelectModel<typeof tgChats>
export type TgChatInsert = InferInsertModel<typeof tgChats>
export type TgUsersToTgChatsSelect = InferSelectModel<typeof tgUsersToTgChats>
export type TgUsersToTgChatsInsert = InferInsertModel<typeof tgUsersToTgChats>
export type LeetCodeChatSettingsInsert = InferInsertModel<
  typeof leetCodeChatSettings
>
export type LeetCodeChatSettingsSelect = InferSelectModel<
  typeof leetCodeChatSettings
>

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

  async upsert(chat: TgChatInsert): Promise<TgChatSelect> {
    const [upserted] = await this.client
      .insert(tgChats)
      .values(chat)
      .onConflictDoUpdate({
        target: [tgChats.tgId],
        set: chat,
      })
      .returning()
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

  async createSettings(
    insert: LeetCodeChatSettingsInsert,
  ): Promise<LeetCodeChatSettingsSelect> {
    const [created] = await this.client
      .insert(leetCodeChatSettings)
      .values(insert)
      .onConflictDoUpdate({
        target: [leetCodeChatSettings.tgChatUuid],
        set: {
          tgChatUuid: insert.tgChatUuid,
        },
      })
      .returning()
    return created
  }

  async upsertSettings(
    insert: LeetCodeChatSettingsInsert,
  ): Promise<LeetCodeChatSettingsSelect> {
    const [upserted] = await this.client
      .insert(leetCodeChatSettings)
      .values(insert)
      .onConflictDoUpdate({
        target: [leetCodeChatSettings.tgChatUuid],
        set: insert,
      })
      .returning()
    return upserted
  }
}
