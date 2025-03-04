import { LeetCodeUsersDao } from '@/leetcode-users/LeetCodeUsersDao'
import { PgService } from '@/pg/PgService'
import crypto from 'node:crypto'

describe('LeetCodeUsersDao', () => {
  const pgService = new PgService()
  const dao = new LeetCodeUsersDao(pgService)

  describe('CRUD', () => {
    it('should crud', async () => {
      const user = await dao.create({
        slug: crypto.randomUUID(),
      })

      expect(user.slug).toBeDefined()
      expect(user.uuid).toBeDefined()
    })
  })

  describe('getAllActiveLeetCodeChatUsers', () => {
    it('should get', async () => {
      const users = await dao.getAllActiveLeetCodeChatUsers()

      expect(users).toBeDefined()
    })
  })
})
