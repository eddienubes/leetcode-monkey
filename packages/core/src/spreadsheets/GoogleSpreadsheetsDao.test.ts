import { GoogleSpreadsheetsDao } from '@/spreadsheets/GoogleSpreadsheetsDao'
import { randomAlphaNumStr } from '@/common'
import { TestSeedDao } from '../../test/TestSeedDao'
import { SpreadsheetToUpdate } from '@/spreadsheets/types'
import { createCoreTestContainer } from '../../test/coreTest'

describe('GoogleSpreadsheetsDao', () => {
  let testSeedDao: TestSeedDao
  let dao: GoogleSpreadsheetsDao

  beforeAll(async () => {
    const container = createCoreTestContainer()
    await container.start()

    dao = container.get(GoogleSpreadsheetsDao)
    testSeedDao = container.get(TestSeedDao)
  })

  describe('upsert', () => {
    it('should upsert', async () => {
      const userInChat = await testSeedDao.generateUserInChat()

      const spreadsheetName = randomAlphaNumStr(10)

      const spreadsheet = await dao.upsert({
        tgChatUuid: userInChat.tgChat.uuid,
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
        tgChatUuid: userInChat.tgChat.uuid,
        spreadsheetId: randomAlphaNumStr(10),
        spreadsheetName: newSpreadsheetName,
        refreshToken: randomAlphaNumStr(20),
        isConnected: true,
        isConnectedToggledAt: new Date(),
      })

      expect(upserted.spreadsheetName).toBe(newSpreadsheetName)
    })
  })

  describe('getSpreadsheetsToUpdate', () => {
    it('should pull submissions to notify', async () => {
      const userInChat = await testSeedDao.generateUserInChat()
      const submissions = await testSeedDao.generateSubmissions(
        userInChat.lcUser.uuid,
        2,
      )
      await testSeedDao.connectSpreadsheet(userInChat.tgChat.uuid)

      const hits = await dao.getSpreadsheetsToUpdate()

      expect(hits.length).toBeGreaterThanOrEqual(1)
      expect(hits).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            spreadsheetId: expect.any(String),
            spreadsheetName: expect.any(String),
            refreshToken: expect.any(String),
            isConnected: true,
            isConnectedToggledAt: expect.any(Date),
            newSubmissions: expect.arrayContaining([
              expect.objectContaining({
                submittedAt: submissions[0].submittedAt,
                lcProblemUuid: submissions[0].lcProblemUuid,
                lcUser: expect.objectContaining({
                  uuid: userInChat.lcUser.uuid,
                }),
                tgUser: expect.objectContaining({
                  uuid: userInChat.tgUser.uuid,
                }),
              }),
              expect.objectContaining({
                submittedAt: submissions[1].submittedAt,
                lcProblemUuid: submissions[1].lcProblemUuid,
                lcUser: expect.objectContaining({
                  uuid: userInChat.lcUser.uuid,
                }),
                tgUser: expect.objectContaining({
                  uuid: userInChat.tgUser.uuid,
                }),
              }),
            ]),
          } as SpreadsheetToUpdate),
        ]),
      )
    })
  })
})
