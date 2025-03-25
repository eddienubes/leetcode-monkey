import { GoogleSpreadsheetApi } from '@/google/GoogleSpreadsheetApi'
import { GoogleAuthService } from '@/google'

describe('SpreadsheetsWorker', () => {
  const googleAuth = new GoogleAuthService()
  const refreshToken =
    '1//09wqRbVyNIL4gCgYIARAAGAkSNwF-L9IrDHu08ONLyJ-sPg-J2RtXJUVVna_8bmYVM3NPJ99oyD0Oo8gIi7_A-7orZJLPRAFKWno'
  // const accessToken = ''
  const sheetsApi = new GoogleSpreadsheetApi(googleAuth)

  describe('write', () => {
    it('should get', async () => {
      const id = '1S-GVb7bEwfUZR0LnEZjDlKMSevSwF2LlqQRe4eB7UYs'
      try {
        console.log(
          await sheetsApi.get(
            id,
            refreshToken,
          ),
        )
      } catch (e) {
        console.log(e)
      }
    })
  })
})
