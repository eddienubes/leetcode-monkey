import { GoogleSpreadsheetsDao } from '@/spreadsheets/GoogleSpreadsheetsDao'
import { PgService } from '@/pg'
import { TgChatsDao } from '@/tg'
import { randomAlphaNumStr } from '@/common'

describe('GoogleSpreadsheetsDao', () => {
  const pg = new PgService()
  const tgChatsDao = new TgChatsDao(pg)
  const dao = new GoogleSpreadsheetsDao(pg)

  describe('upsert', () => {
    it('should upsert', async () => {
      const chat = await tgChatsDao.upsert({
        tgId: randomAlphaNumStr(10),
        type: 'supergroup',
        role: 'member',
      })

      const spreadsheetName = randomAlphaNumStr(10)

      const spreadsheet = await dao.upsert({
        tgChatUuid: chat.uuid,
        spreadsheetId: randomAlphaNumStr(10),
        spreadsheetName,
        refreshToken: randomAlphaNumStr(20),
        isConnected: false,
        isConnectedToggledAt: new Date(),
      })

      expect(spreadsheet).toBeDefined()
      expect(spreadsheet.spreadsheetName).toBe(spreadsheetName)

      const newSpreadsheetName = randomAlphaNumStr(10)

      const upserted = await dao.upsert({
        tgChatUuid: chat.uuid,
        spreadsheetId: randomAlphaNumStr(10),
        spreadsheetName: newSpreadsheetName,
        refreshToken: randomAlphaNumStr(20),
        isConnected: true,
        isConnectedToggledAt: new Date(),
      })

      expect(upserted.spreadsheetName).toBe(newSpreadsheetName)
    })
  })
})
