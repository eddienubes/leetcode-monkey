import { GoogleAuthService } from '@/google/GoogleAuthService'
import { GoogleSpreadsheetApi } from '@/google/GoogleSpreadsheetApi'

describe('GoogleSpreadsheetApi', () => {
  const token =
    'ya29.a0AeXRPp4NROXEfOC3jzealye8ZkgIUKMmfcohfvBltKcnrScRP0oPkmHx6x0IvUin2WJHp7EZq3U2tezUokIk6iuYjzZCtfIJYuoBI2pTyS_seslMvGMH-SwbdLaVUW8bmwLCF5hM3D6G5dT62XFHtFrD8zvzpWHG-CUljpShaCgYKAR0SARASFQHGX2MiKRedSbwms1L-adfQ8CAJqQ0175'

  const auth = new GoogleAuthService()
  const sheets = new GoogleSpreadsheetApi(auth.getClient(token))

  it('should get', async () => {
    const s1 = '17jd50B6wSf9oLBhI1JtLLTupjvcTSeyST5iOqNjyzAU'
    // const s2 = '1rv0GmckRobrXRlvvl0tpvXvsb3TTqFBO2zUwYDBm1d4'
    // const s3 = '1Z8WK5bQd33bPKNfLnnHlKUtGWMJCc5WNvq88bzpEK48'
    const sh = await sheets.get(s1)

    console.log(sh)
  })
})
