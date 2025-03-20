import { createRamConvoStorage } from '@/bot/ramConvoStorage'
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
import {
  GoogleAuthService,
  LcApiClient,
  LcProblemsDao,
  LcProblemsService,
  LcPullSubmissionsCronJob,
  LcTgNotificationsDao,
  LcUsersDao,
  PgService,
  TgChatsDao,
  TgUsersDao,
} from '@repo/core'

export const main = async (): Promise<void> => {
  const convoStorage = createRamConvoStorage()
  const bot = new Bot(convoStorage)
  const tgBot = bot.getBot()
  const pgService = new PgService()

  await pgService.migrate()

  const lcProblemsDao = new LcProblemsDao(pgService)
  const tgUsersDao = new TgUsersDao(pgService)
  const lcUsersDao = new LcUsersDao(pgService)
  const tgChatsDao = new TgChatsDao(pgService)
  const lcApi = new LcApiClient()
  const lcProblemsService = new LcProblemsService(lcProblemsDao, lcApi)
  const lcCronJob = new LcPullSubmissionsCronJob(
    lcUsersDao,
    lcApi,
    lcProblemsService,
  )
  const lcTgNotificationsDao = new LcTgNotificationsDao(pgService)
  const tgSubmissionsCronJob = new TgSubmissionsCronJob(
    bot.getBot(),
    lcUsersDao,
    lcTgNotificationsDao,
  )
  const googleAuth = new GoogleAuthService()

  const instances = [
    bot,
    tgBot,
    pgService,
    lcUsersDao,
    convoStorage,
    lcApi,
    tgChatsDao,
    tgUsersDao,
    lcCronJob,
    lcProblemsDao,
    lcProblemsService,
    lcTgNotificationsDao,
    tgSubmissionsCronJob,
    googleAuth,
  ]

  const inject = {
    bot: tgBot,
    convoStorage,
    pgService,
  }

  await myChatMemberEvent(inject, tgChatsDao)
  await connectLcCommand(inject, lcApi, lcUsersDao, tgUsersDao, tgChatsDao)
  await disconnectLcCommand(inject, lcUsersDao, tgUsersDao, tgChatsDao)
  await leaderboardCommand(inject, tgUsersDao, tgChatsDao, lcUsersDao)
  await settingsCommand(inject, lcUsersDao, tgUsersDao, tgChatsDao)
  await spreadsheetCommand(inject, tgUsersDao, tgChatsDao, googleAuth)
  await dailyCommand(inject, lcApi)
  await helpCommand(inject)
  await feedbackCommand(inject)
  await cbQueryEvent(inject)

  for (const instance of instances) {
    if ('onModuleInit' in instance) {
      await instance.onModuleInit()
    }
  }

  console.log('Bot started')
}

void main()
