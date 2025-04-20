import {
  LcApiClient,
  LcProblemsDao,
  LcProblemsService,
  LcPullSubmissionsCronJob,
  LcTgNotificationsDao,
} from '@/lc'
import { PgService } from '@/pg'
import { TgChatsDao, TgUsersDao } from '@/tg'
import { LcUsersDao } from '@/lc-users'
import { GoogleAuthService } from '@/google'
import { GoogleSpreadsheetsDao, SpreadsheetsConnector } from '@/spreadsheets'
import { Container, createProvidersContainer, Provider } from '@/common'

export const createCoreContainer = (providers: Provider[] = []): Container => {
  const container = createProvidersContainer([
    PgService,
    LcProblemsDao,
    TgUsersDao,
    LcUsersDao,
    TgChatsDao,
    LcApiClient,
    LcProblemsService,
    LcPullSubmissionsCronJob,
    LcTgNotificationsDao,
    GoogleAuthService,
    SpreadsheetsConnector,
    GoogleSpreadsheetsDao,
    ...providers,
  ]).build()

  return container
}
