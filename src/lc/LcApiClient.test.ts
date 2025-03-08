import { LcApiClient } from './LcApiClient'

describe('lc Api Client', () => {
  const lc = new LcApiClient()

  describe('getProfile', () => {
    it('should get profile', async () => {
      const profile = await lc.getProfile('eddienubes')
      console.log(profile.matchedUser?.profile.userAvatar)
    })
  })

  describe('getAcceptedSubmissions', () => {
    it('get recent accepted submissions', async () => {
      const submissions = await lc.getAcceptedSubmissions('eddienubes')
      console.log(submissions.recentAcSubmissionList)
    })
  })

  describe('getProblem', () => {
    it('get problem', async () => {
      const problem = await lc.getProblem('two-sum')
      console.log(problem)
    })
  })
})
