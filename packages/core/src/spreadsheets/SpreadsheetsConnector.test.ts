import { SpreadsheetsConnector } from './SpreadsheetsConnector'
import { SpreadsheetConnectionSession } from '@/spreadsheets/types'
import { afterAll } from 'vitest'
import { GoogleSpreadsheetsDao } from '@/spreadsheets/GoogleSpreadsheetsDao'
import { PgService } from '@/pg'

describe('SpreadsheetsConnector', () => {
  let pg = new PgService()
  let dao = new GoogleSpreadsheetsDao(pg)
  let connector: SpreadsheetsConnector

  const testConnection: SpreadsheetConnectionSession = {
    tgChatUuid: 'chat-123',
    tgUserUuid: 'user-456',
    tgMessageId: 'message-789',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    connector = new SpreadsheetsConnector(dao)
  })

  afterAll(async () => {
    await connector.onModuleDestroy()
  })

  describe('createSpreadsheetConnectionSession', () => {
    it('should create a new session and return session ID', async () => {
      const sessionId =
        await connector.createSpreadsheetConnectionSession(testConnection)

      expect(sessionId).toEqual(expect.any(String))

      const session = await connector.getSpreadsheetConnectionSession(sessionId)

      expect(session).toEqual(testConnection)
    })

    it('should expire session', async () => {
      const sessionId =
        await connector.createSpreadsheetConnectionSession(testConnection)

      await connector.expireSpreadsheetConnectionSession(sessionId)

      const session = await connector.getSpreadsheetConnectionSession(sessionId)

      expect(session).toBeNull()
    })
  })
})
