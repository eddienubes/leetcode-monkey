import IoRedis from 'ioredis'
import { config } from '@/config'
import { SpreadsheetConnection } from '@/spreadsheets/types'

export class SpreadsheetsConnector {
  private readonly redis = new IoRedis({
    host: config.redis.host,
    port: config.redis.port,
    username: config.redis.user,
    password: config.redis.password,
    keyPrefix: 'spreadsheets:',
    showFriendlyErrorStack: true,
  })

  /**
   * Creates a new session for the spreadsheet connection.
   * @returns The session ID.
   */
  async createSpreadsheetConnectionSession(
    connection: SpreadsheetConnection,
  ): Promise<string> {
    const sessionId = crypto.randomUUID()
    await this.redis.set(sessionId, JSON.stringify(connection), 'EX', 3600) // Set expiration to 1 hour
    return sessionId
  }

  async getSpreadsheetConnectionSession(
    sessionId: string,
  ): Promise<SpreadsheetConnection | null> {
    const connection = await this.redis.get(sessionId)
    if (connection) {
      return JSON.parse(connection) as SpreadsheetConnection
    }
    return null
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }
}
