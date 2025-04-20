import { GoogleAuthService } from '@/google/GoogleAuthService'
import { GoogleSpreadsheetApi } from '@/google/GoogleSpreadsheetApi'
import * as util from 'node:util'
import { randomAlphaNumStr } from '@/common'

describe.skip('GoogleSpreadsheetApi', () => {
  const googleAuth = new GoogleAuthService()
  const refreshToken =
    '1//094HC3GGqm8rYCgYIARAAGAkSNwF-L9IrgOvfbhdBH7Uqotm4h0yhEyUHniz-lpqFVO-yf7SFqMD69x5q6cTZEu5tS5LzUgEilyE'
  const spreadsheetId = '1S-GVb7bEwfUZR0LnEZjDlKMSevSwF2LlqQRe4eB7UYs'
  // const accessToken = ''
  const sheetsApi = new GoogleSpreadsheetApi(googleAuth)

  describe('createSheetIfNotExists', () => {
    it('should create sheet if not exists', async () => {
      const sheetName = 'Submissions'
      try {
        const res = await sheetsApi.createSheetIfNotExists(
          spreadsheetId,
          refreshToken,
          sheetName,
        )
        console.log(res)
      } catch (e) {
        console.log(e)
      }
    })
  })

  describe('append', () => {
    it('should write', async () => {
      try {
        const sheet = await sheetsApi.get(spreadsheetId, refreshToken)
        const res = await sheetsApi.append(
          sheet.spreadsheetId,
          'Submissions',
          refreshToken,
          [
            ['test', 'test', 'test', 'test', 'hello world', 'overwrite'],
            ['test', 'test'],
          ],
        )

        console.log(util.inspect(res, { depth: null }))
      } catch (e) {
        console.log(e)
      }
    })

    it('should throw an error', async () => {
      try {
        const res = await sheetsApi.append(
          spreadsheetId,
          // non existing sheet name
          randomAlphaNumStr(10),
          refreshToken,
          [
            ['test', 'test', 'test', 'test', 'hello world', 'overwrite'],
            ['test', 'test'],
          ],
        )
        console.log(res)
      } catch (e) {
        console.log(e)
      }
    })
  })
})
