import IoRedis from 'ioredis'
import { config } from '@/config'
import { SpreadsheetConnectionSession } from '@/spreadsheets/types'
import {
  GoogleSpreadsheetInsert,
  GoogleSpreadsheetsDao,
} from '@/spreadsheets/GoogleSpreadsheetsDao'
import { Injectable, NotFoundError } from '@/common'

@Injectable(GoogleSpreadsheetsDao)
export class SpreadsheetsConnector {
  private readonly spreadsheetConnectionSessionExpireTimeSec = 3600 // 1 hour
  private readonly redis = new IoRedis({
    host: config.redis.host,
    port: config.redis.port,
    username: config.redis.user,
    password: config.redis.password,
    keyPrefix: 'spreadsheets:',
    showFriendlyErrorStack: true,
  })

  constructor(private readonly googleSpreadsheetsDao: GoogleSpreadsheetsDao) {}

  /**
   * Creates a new session for the spreadsheet connection.
   * @returns The session ID.
   */
  async createSpreadsheetConnectionSession(
    connection: SpreadsheetConnectionSession,
  ): Promise<string> {
    const sessionId = crypto.randomUUID()
    await this.redis.set(
      sessionId,
      JSON.stringify(connection),
      'EX',
      this.spreadsheetConnectionSessionExpireTimeSec,
    )
    return sessionId
  }

  async getSpreadsheetConnectionSession(
    sessionId: string,
  ): Promise<SpreadsheetConnectionSession | null> {
    const connection = await this.redis.get(sessionId)
    if (connection) {
      return JSON.parse(connection) as SpreadsheetConnectionSession
    }
    return null
  }

  async expireSpreadsheetConnectionSession(sessionId: string): Promise<void> {
    await this.redis.del(sessionId)
  }

  async connectSpreadsheet(
    sessionId: string,
    params: Pick<
      GoogleSpreadsheetInsert,
      'spreadsheetName' | 'spreadsheetId' | 'refreshToken'
    >,
  ): Promise<void> {
    const session = await this.getSpreadsheetConnectionSession(sessionId)

    if (!session) {
      throw new NotFoundError(
        `Spreadsheet connection session with id ${sessionId} was not found`,
      )
    }

    await this.googleSpreadsheetsDao.upsert({
      tgChatUuid: session.tgChatUuid,
      spreadsheetId: params.spreadsheetId,
      spreadsheetName: params.spreadsheetName,
      refreshToken: params.refreshToken,
    })

    await this.expireSpreadsheetConnectionSession(sessionId)
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }
}
