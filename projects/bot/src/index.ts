import {
  CONVO_STORAGE_ID,
  ConvoStorage,
  createRamConvoStorage,
} from '@/bot/ramConvoStorage'
import { Bot } from '@/bot/Bot'
import { cbQueryEvent, myChatMemberEvent } from '@/bot/events'
import {
  connectLcCommand,
  dailyCommand,
  disconnectLcCommand,
  feedbackCommand,
  helpCommand,
  leaderboardCommand,
  settingsCommand,
  spreadsheetCommand,
} from '@/bot/commands'
import { TgSubmissionsCronJob } from '@/bot/TgSubmissionsCronJob'
import { TgMessagesWorker } from '@/bot/TgMessagesWorker'
import {
  LcApiClient,
  LcProblemsDao,
  LcProblemsService,
  LcUsersDao,
  PgService,
  SpreadsheetsConnector,
  TgChatsDao,
  TgUsersDao,
  createCoreContainer,
  GoogleSpreadsheetsDao,
} from '@repo/core'

export const main = async (): Promise<void> => {
  const container = createCoreContainer([
    Bot,
    {
      id: CONVO_STORAGE_ID,
      value: createRamConvoStorage(),
    },
    TgSubmissionsCronJob,
    TgMessagesWorker,
  ]).build()

  const inject = {
    bot: container.get(Bot).getBot(),
    convoStorage: container.get<ConvoStorage>(CONVO_STORAGE_ID),
    pgService: container.get(PgService),
  }
  const tgChatsDao = container.get(TgChatsDao)
  const tgUsersDao = container.get(TgUsersDao)
  const lcUsersDao = container.get(LcUsersDao)
  const lcApi = container.get(LcApiClient)
  const lcProblemsDao = container.get(LcProblemsDao)
  const lcProblemsService = container.get(LcProblemsService)
  const spreadsheetsConnector = container.get(SpreadsheetsConnector)
  const googleSheetsDao = container.get(GoogleSpreadsheetsDao)

  await myChatMemberEvent(inject, tgChatsDao)
  await connectLcCommand(inject, lcApi, lcUsersDao, tgUsersDao, tgChatsDao)
  await disconnectLcCommand(inject, lcUsersDao, tgUsersDao, tgChatsDao)
  await leaderboardCommand(inject, tgUsersDao, tgChatsDao, lcUsersDao)
  await settingsCommand(inject, lcUsersDao, tgUsersDao, tgChatsDao)
  await spreadsheetCommand(
    inject,
    tgUsersDao,
    tgChatsDao,
    spreadsheetsConnector,
    googleSheetsDao,
  )
  await dailyCommand(inject, lcApi)
  await helpCommand(inject)
  await feedbackCommand(inject)
  await cbQueryEvent(inject)

  await container.start()
}

void main()
