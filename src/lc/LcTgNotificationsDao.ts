import { PgDao } from '@/pg/PgDao'
import { PgService } from '@/pg/PgService'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { lcTgNotifications } from '@/pg/schema'

export type LcTgNotificationsInsert = InferInsertModel<typeof lcTgNotifications>
export type LcTgNotificationsSelect = InferSelectModel<typeof lcTgNotifications>

export class LcTgNotificationsDao extends PgDao {
  constructor(pgService: PgService) {
    super(pgService)
  }

  async upsert(
    notification: LcTgNotificationsInsert,
  ): Promise<LcTgNotificationsSelect> {
    const hits = await this.client
      .insert(lcTgNotifications)
      .values(notification)
      .onConflictDoUpdate({
        target: [lcTgNotifications.tgChatUuid, lcTgNotifications.lcUserUuid],
        set: {
          lastSentAt: new Date(),
        },
      })
      .returning()

    return hits[0]
  }

  async upsertMany(
    notifications: LcTgNotificationsInsert[],
  ): Promise<LcTgNotificationsSelect[]> {
    if (!notifications.length) {
      return []
    }

    const hits = await this.client
      .insert(lcTgNotifications)
      .values(notifications)
      .onConflictDoUpdate({
        target: [lcTgNotifications.tgChatUuid, lcTgNotifications.lcUserUuid],
        set: {
          lastSentAt: new Date(),
        },
      })
      .returning()

    return hits
  }
}
