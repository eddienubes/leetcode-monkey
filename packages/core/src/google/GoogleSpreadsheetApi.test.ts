import { GoogleAuthService } from '@/google/GoogleAuthService'
import { GoogleSpreadsheetApi } from '@/google/GoogleSpreadsheetApi'

describe('GoogleSpreadsheetApi', () => {
  const token = ''

  const auth = new GoogleAuthService()
  const sheets = new GoogleSpreadsheetApi(auth.getAuthClient(token))

  it('should get', async () => {
    const s1 = '17jd50B6wSf9oLBhI1JtLLTupjvcTSeyST5iOqNjyzAU'
    // const s2 = '1rv0GmckRobrXRlvvl0tpvXvsb3TTqFBO2zUwYDBm1d4'
    // const s3 = '1Z8WK5bQd33bPKNfLnnHlKUtGWMJCc5WNvq88bzpEK48'
    const sh = await sheets.get(s1)

    console.log(sh)
  })
})
