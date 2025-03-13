import { Bot } from '@/bot/Bot'
import { cbQueryEvent, myChatMemberEvent } from '@/bot/events'
import { PgService } from '@/pg/PgService'
import { LcUsersDao } from '@/lc-users/LcUsersDao'
import { TgChatsDao } from '@/tg/TgChatsDao'
import {
  connectLcCommand,
  dailyCommand,
  disconnectLcCommand,
  feedbackCommand,
  helpCommand,
  leaderboardCommand,
} from '@/bot/commands'
import { LcApiClient } from '@/lc/LcApiClient'
import { createRamConvoStorage } from '@/bot/ramConvoStorage'
import { TgUsersDao } from '@/tg/TgUsersDao'
import { LcPullSubmissionsCronJob } from '@/lc/LcPullSubmissionsCronJob'
import { LcProblemsDao } from '@/lc/LcProblemsDao'
import { LcProblemsService } from '@/lc/LcProblemsService'
import { LcTgNotificationsDao } from '@/lc/LcTgNotificationsDao'
import { TgSubmissionsCronJob } from '@/lc/TgSubmissionsCronJob'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { config } from '@/config'

export const main = async (): Promise<void> => {
  const convoStorage = createRamConvoStorage()
  const bot = new Bot(convoStorage)
  const tgBot = bot.getBot()
  const pgService = new PgService()

  await migrate(pgService.getClient(), {
    migrationsFolder: config.pg.migrations.out,
    migrationsTable: config.pg.migrations.table,
    migrationsSchema: config.pg.migrations.schema,
  })

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
  ]

  const inject = {
    bot: tgBot,
    convoStorage,
    pgService,
  }

  await myChatMemberEvent(inject, tgChatsDao)
  await connectLcCommand(inject, lcApi, lcUsersDao, tgUsersDao, tgChatsDao)
  await disconnectLcCommand(inject, tgUsersDao, lcUsersDao, tgChatsDao)
  await leaderboardCommand(inject, tgUsersDao, tgChatsDao, lcUsersDao)
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
