import { Container } from '@/common'
import { TestSeedDao } from './TestSeedDao'
import { TgChatsTestDao } from '@/tg/TgChatsTestDao'
import { TgUsersTestDao } from '@/tg/TgUsersTestDao'
import { GoogleSpreadsheetsTestDao } from '@/spreadsheets/GoogleSpreadsheetsTestDao'
import { LcUsersTestDao } from '@/lc-users/LcUsersTestDao'
import { LcProblemsTestDao } from '@/lc/LcProblemsTestDao'
import { createCoreContainer } from '@/coreContainer'

export const createCoreTestContainer = (): Container => {
  const container = createCoreContainer()

  const testDeps = [
    TestSeedDao,
    TgChatsTestDao,
    TgUsersTestDao,
    GoogleSpreadsheetsTestDao,
    LcUsersTestDao,
    LcProblemsTestDao,
  ]

  for (const dep of testDeps) {
    container.add(dep)
  }

  return container.build()
}
