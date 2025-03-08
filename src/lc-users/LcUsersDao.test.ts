import { LcUsersDao } from '@/lc-users/LcUsersDao'
import { PgService } from '@/pg/PgService'
import crypto from 'node:crypto'
import { randomAlphaNumStr } from '@/common/utils'

describe('LcUsersDao', () => {
  const pgService = new PgService()
  const dao = new LcUsersDao(pgService)

  describe('CRUD', () => {
    it('should crud', async () => {
      const user = await dao.create({
        slug: crypto.randomUUID(),
      })

      expect(user.slug).toBeDefined()
      expect(user.uuid).toBeDefined()
    })
  })

  describe('getAllActivelcChatUsers', () => {
    it('should get', async () => {
      const users = await dao.getAllActivelcChatUsers()

      expect(users).toBeDefined()
    })
  })

  describe('addSubmissions', () => {
    it('should add submissions with hacky update identifier xmax', async () => {
      const user = await dao.create({
        slug: crypto.randomUUID(),
      })
      const slug = randomAlphaNumStr(10)
      const ss = await dao.addSubmissions([
        {
          slug,
          lcUserUuid: user.uuid,
          title: randomAlphaNumStr(10),
          lcId: randomAlphaNumStr(10),
          submittedAt: new Date(1710865483 * 1000),
        },
      ])
      expect(ss[0].slug).toEqual(slug)
      expect(ss[0].isCreated).toEqual(true)

      const ss2 = await dao.addSubmissions(ss)

      expect(ss2[0].slug).toEqual(slug)
      expect(ss2[0].isCreated).toEqual(false)
    })
  })
})
