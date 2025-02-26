import { LeetCodeApiClient } from './LeetCodeApiClient'

describe('Leetcode Api Client', () => {
  const lc = new LeetCodeApiClient()

  describe('getProfile', () => {
    it('should get profile', async () => {
      const profile = await lc.getProfile('eddienubes')
      console.log(profile.matchedUser.profile.userAvatar)
    })
  })

  describe('getAcceptedSubmissions', () => {
    it('get recent accepted submissions', async () => {
      const submissions = await lc.getAcceptedSubmissions('eddienubes')
      console.log(submissions.recentAcSubmissionList)
    })
  })
})
