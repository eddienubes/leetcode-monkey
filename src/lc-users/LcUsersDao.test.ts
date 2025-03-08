import { LcUsersDao } from '@/lc-users/LcUsersDao'
import { PgService } from '@/pg/PgService'
import crypto from 'node:crypto'
import { randomAlphaNumStr } from '@/common/utils'
import { LcProblemsDao } from '@/lc/LcProblemsDao'

describe('LcUsersDao', () => {
  const pgService = new PgService()
  const lcProblemsDao = new LcProblemsDao(pgService)
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

  describe('getAllActiveLcChatUsers', () => {
    it('should get', async () => {
      const users = await dao.getAllActiveLcChatUsers()

      console.log(users)

      expect(users).toBeDefined()
    })
  })

  describe('addSubmissions', () => {
    it('should add submissions with hacky update identifier xmax', async () => {
      const user = await dao.create({
        slug: crypto.randomUUID(),
      })
      const problem = await lcProblemsDao.create({
        slug: randomAlphaNumStr(10),
        title: randomAlphaNumStr(10),
        difficulty: 'medium',
        lcId: randomAlphaNumStr(10),
      })

      const ss = await dao.addSubmissions([
        {
          lcUserUuid: user.uuid,
          submittedAt: new Date(1710865483 * 1000),
          lcProblemUuid: problem.uuid,
        },
      ])
      expect(ss[0].submittedAt).toEqual(expect.any(Date))
    })
  })
})
