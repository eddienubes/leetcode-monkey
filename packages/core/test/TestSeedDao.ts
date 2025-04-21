import { getDatePlusDays, Injectable } from '@/common'
import { PgDao, PgService } from '@/pg'
import { TgChatsTestDao } from '@/tg/TgChatsTestDao'
import { TgUsersTestDao } from '@/tg/TgUsersTestDao'
import { GoogleSpreadsheetsTestDao } from '@/spreadsheets/GoogleSpreadsheetsTestDao'
import { LcUsersTestDao } from '@/lc-users/LcUsersTestDao'
import { TgChatSelect, TgUserSelect } from '@/tg'
import { LcUserSelect, SubmissionSelect } from '@/lc-users'
import { LcProblemsTestDao } from '@/lc/LcProblemsTestDao'
import { GoogleSpreadsheetInsert } from '@/spreadsheets'

interface TestUserInChat {
  tgChat: TgChatSelect
  tgUser: TgUserSelect
  lcUser: LcUserSelect
}

@Injectable(
  PgService,
  TgChatsTestDao,
  TgUsersTestDao,
  GoogleSpreadsheetsTestDao,
  LcUsersTestDao,
  LcProblemsTestDao,
)
export class TestSeedDao extends PgDao {
  constructor(
    pg: PgService,
    private readonly tgChatsTestDao: TgChatsTestDao,
    private readonly tgUsersTestDao: TgUsersTestDao,
    private readonly googleSheetsTestDao: GoogleSpreadsheetsTestDao,
    private readonly lcUsersTestDao: LcUsersTestDao,
    private readonly lcProblemsTestDao: LcProblemsTestDao,
  ) {
    super(pg)
  }

  /**
   * Creates test user in chat with submissions
   */
  async generateUserInChat(): Promise<TestUserInChat> {
    const tgChat = await this.tgChatsTestDao.generateTgChat()
    const tgUser = await this.tgUsersTestDao.generateTgUser()
    const lcUser = await this.lcUsersTestDao.generateLcUser()

    await this.lcUsersTestDao.upsertLcUserInChat({
      tgUserUuid: tgUser.uuid,
      tgChatUuid: tgChat.uuid,
      lcUserUuid: lcUser.uuid,
      isConnected: true,
      isConnectedToggledAt: new Date(),
      isNotificationsEnabled: true,
      isNotificationsEnabledToggledAt: new Date(),
    })

    return {
      tgChat,
      tgUser,
      lcUser,
    }
  }

  async generateSubmissions(
    lcUserUuid: string,
    count = 1,
  ): Promise<SubmissionSelect[]> {
    // const lcUser = await this.lcUsersTestDao.getByUuidIfAny(lcUserUuid)
    const problems = await Promise.all(
      Array.from({ length: count }).map(
        async (_) => await this.lcProblemsTestDao.generateProblem(),
      ),
    )

    const map = new Map(problems.map((p, i) => [i, p]))

    return await this.lcUsersTestDao.addSubmissions(
      Array.from({ length: count }).map((_, i) => ({
        lcUserUuid,
        lcProblemUuid: map.get(i)!.uuid,
        submittedAt: getDatePlusDays(-i, true),
      })),
    )
  }

  async connectSpreadsheet(
    tgChatUuid: string,
    attrs?: Partial<GoogleSpreadsheetInsert>,
  ): Promise<void> {
    await this.googleSheetsTestDao.generateGoogleSpreadsheet(tgChatUuid, attrs)
  }
}
