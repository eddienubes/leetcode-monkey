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

  describe('getAllActiveLcUsers', () => {
    it('should get', async () => {
      const users = await dao.getAllActiveLcUsers()

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

  describe('getLeaderboard', () => {
    it('should get leaderboard', async () => {
      const tgChat = 'ec1890b6-58dd-4558-afcb-feb8bcf1e7e9'
      const hits = await dao.getLeaderboard(tgChat, new Date('2023-01-01'))

      // console.log(hits.hits[0])

      expect(hits.hits.length).toBeGreaterThanOrEqual(0)
      expect(hits.total).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getLcUsersInChatsToNotify', () => {
    it('should get lc users in chats', async () => {
      const hits = await dao.getLcUsersInChatsToNotify()

      expect(hits.length).toBeGreaterThanOrEqual(0)
    })
  })
})
