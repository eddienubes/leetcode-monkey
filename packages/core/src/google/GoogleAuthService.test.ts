import { GoogleAuthService } from '@/google/GoogleAuthService'

describe('GoogleAuthService', () => {
  const service = new GoogleAuthService()

  describe('revoke', () => {
    it('should revoke a token', async () => {
      await service.revoke('')
    })
  })
})
