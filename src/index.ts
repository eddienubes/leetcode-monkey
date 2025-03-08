import { Bot } from '@/bot/Bot'
import { cbQueryEvent, myChatMemberEvent } from '@/bot/events'
import { PgService } from '@/pg/PgService'
import { LcUsersDao } from '@/lc-users/LcUsersDao'
import { TgChatsDao } from '@/tg/TgChatsDao'
import { connectLcCommand, disconnectLcCommand } from '@/bot/commands'
import { LcApiClient } from '@/lc/LcApiClient'
import { createRamConvoStorage } from '@/bot/ramConvoStorage'
import { TgUsersDao } from '@/tg/TgUsersDao'
import { LcPullSubmissionsCronJob } from '@/lc/LcPullSubmissionsCronJob'
import { TgSubmissionsNotifier } from '@/lc/TgSubmissionsNotifier'
import { LcProblemsDao } from '@/lc/LcProblemsDao'
import { LcSaveSubmissionsWorker } from '@/lc/LcSaveSubmissionsWorker'

export const main = async (): Promise<void> => {
  const convoStorage = createRamConvoStorage()
  const bot = new Bot(convoStorage)
  const tgBot = bot.getBot()
  const pgService = new PgService()
  const lcProblemsDao = new LcProblemsDao(pgService)
  const tgUsersDao = new TgUsersDao(pgService)
  const lcUsersDao = new LcUsersDao(pgService)
  const tgChatsDao = new TgChatsDao(pgService)
  const lcApi = new LcApiClient()
  const tgSubmissionsNotifier = new TgSubmissionsNotifier(tgBot)
  const lcSaveSubmissionsWorker = new LcSaveSubmissionsWorker(
    lcUsersDao,
    lcApi,
    tgSubmissionsNotifier,
  )
  const lcCronJob = new LcPullSubmissionsCronJob(
    lcUsersDao,
    lcApi,
    lcSaveSubmissionsWorker,
  )

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
    tgSubmissionsNotifier,
    lcProblemsDao,
    lcSaveSubmissionsWorker,
  ]

  const inject = {
    bot: tgBot,
    convoStorage,
    pgService,
  }

  await myChatMemberEvent(inject, tgChatsDao)
  await connectLcCommand(inject, lcApi, lcUsersDao, tgUsersDao, tgChatsDao)
  await disconnectLcCommand(inject, tgUsersDao, lcUsersDao, tgChatsDao)
  await cbQueryEvent(inject)

  for (const instance of instances) {
    if ('onModuleInit' in instance) {
      await instance.onModuleInit()
    }
  }
}

void main()
