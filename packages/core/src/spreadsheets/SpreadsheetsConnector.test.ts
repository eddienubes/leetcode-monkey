import { SpreadsheetsConnector } from './SpreadsheetsConnector'
import { SpreadsheetConnection } from '@/spreadsheets/types'
import { afterAll } from 'vitest'

describe('SpreadsheetsConnector', () => {
  let connector: SpreadsheetsConnector

  const testConnection: SpreadsheetConnection = {
    tgChatUuid: 'chat-123',
    tgUserUuid: 'user-456',
    tgMessageId: 'message-789',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    connector = new SpreadsheetsConnector()
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
  })
})
