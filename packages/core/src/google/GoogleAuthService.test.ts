import { GoogleAuthService } from '@/google/GoogleAuthService'

describe('GoogleAuthService', () => {
  const service = new GoogleAuthService()

  describe.skip('revoke', () => {
    it('should revoke a token', async () => {
      await service.revoke('')
    })
  })
})
