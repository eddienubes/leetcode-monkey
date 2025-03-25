import IoRedis from 'ioredis'
import { config } from '@/config'
import {
  ConnectSpreadsheetParams,
  SpreadsheetConnectionSession,
} from '@/spreadsheets/types'
import { GoogleSpreadsheetsDao } from '@/spreadsheets/GoogleSpreadsheetsDao'
import { Injectable, Lifecycle, NotFoundError } from '@/common'
import { EditMessageQueue } from '@/tg'
import { bold, fmt } from '@grammyjs/parse-mode'

@Injectable(GoogleSpreadsheetsDao)
export class SpreadsheetsConnector implements Lifecycle {
  private readonly spreadsheetConnectionSessionExpireTimeSec = 3600 // 1 hour
  private readonly redis = new IoRedis({
    host: config.redis.host,
    port: config.redis.port,
    username: config.redis.user,
    password: config.redis.password,
    keyPrefix: 'spreadsheets:',
    showFriendlyErrorStack: true,
  })
  private readonly editMessageQueue = EditMessageQueue.connect()

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
    params: ConnectSpreadsheetParams,
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
      isConnected: true,
      isConnectedToggledAt: new Date(),
    })

    const msg = fmt`🚀 Spreadsheet ${bold(params.spreadsheetName)} connected!`

    await this.editMessageQueue.add(
      `${session.tgChatUuid}-${session.tgUserUuid}-${session.tgMessageId}`,
      {
        tgChatUuid: session.tgChatUuid,
        tgMessageId: session.tgMessageId.toString(),
        contents: {
          message: msg.text,
          entities: msg.entities,
          replyMarkup: [],
        },
      },
    )

    await this.expireSpreadsheetConnectionSession(sessionId)
  }

  async getSpreadsheetConnectUrl(sessionId: string): Promise<string> {
    const session = await this.getSpreadsheetConnectionSession(sessionId)

    if (!session) {
      throw new NotFoundError(
        `Spreadsheet connection session with id ${sessionId} was not found`,
      )
    }

    const url = new URL('/spreadsheets', config.ui.baseUrl)
    url.searchParams.set(`id`, sessionId)

    return url.toString()
  }

  async disconnectSpreadsheet(sheetUuid: string): Promise<void> {
    await this.googleSpreadsheetsDao.updateByUuid(sheetUuid, {
      isConnected: false,
      isConnectedToggledAt: new Date(),
    })
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }
}
