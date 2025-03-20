import { PgService } from '@/pg/PgService'
import { seed as drizzleSeed, reset } from 'drizzle-seed'
import {
  acceptedSubmissions,
  lcChatSettings,
  lcProblems,
  lcUsers,
  lcUsersInTgChats,
  tgChats,
  tgUsers,
  tgUsersToTgChats,
} from '@/pg/schema'
import { getDatePlusDays, randomAlphaNumStr, randomInt } from '@/common/utils'
import postgres from 'postgres'
import * as schema from '@/pg/schema'

export const seed = async (): Promise<void> => {
  const pgService = new PgService()
  const client = pgService.getClient()
  await reset(client, schema)

  await pgService.wrapInTx(async () => {
    await drizzleSeed(client, schema, {
      count: 10,
      seed: randomInt(0, 99999999),
    })
  })

  // const testChatId = '-1002179584774'
  // const adminUserId = '488224131'
  // const usersCount = 100
  //
  // await pgService.wrapInTx(async () => {
  //   const tgChat = await client
  //     .insert(tgChats)
  //     .values({
  //       tgId: testChatId,
  //       type: 'supergroup',
  //       title: 'Test Chat',
  //       role: 'member',
  //       username: 'test_chat',
  //       fullName: 'Test Chat Full Name',
  //       isForum: false,
  //       description: 'Test chat description',
  //       bio: 'Test chat bio',
  //       joinByRequest: false,
  //       inviteLink: 'https://t.me/test_chat_invite_link',
  //     })
  //     .returning()
  //
  //   await client.insert(lcChatSettings).values({
  //     tgChatUuid: tgChat[0].uuid,
  //     isActive: true,
  //     isActiveToggledAt: getDatePlusDays(-1000),
  //     leaderboardStartedAt: getDatePlusDays(-1000),
  //   })
  //
  //   await client.insert(tgUsers).values({
  //     tgId: adminUserId,
  //     isBot: false,
  //     username: 'admin_user',
  //     firstName: 'Admin User Full Name',
  //   })
  //
  //   for (let i = 0; i < usersCount; i++) {
  //     const user = await client
  //       .insert(tgUsers)
  //       .values({
  //         tgId: `user_${i}`,
  //         isBot: false,
  //         username: `user_${i}`,
  //         firstName: `User ${i} Full Name`,
  //       })
  //       .returning()
  //
  //     const userInChat = await client
  //       .insert(tgUsersToTgChats)
  //       .values({
  //         tgUserUuid: user[0].uuid,
  //         tgChatUuid: tgChat[0].uuid,
  //       })
  //       .returning()
  //
  //     const lcUser = await client
  //       .insert(lcUsers)
  //       .values({
  //         slug: randomAlphaNumStr(10),
  //         realName: randomAlphaNumStr(10),
  //         avatarUrl: randomAlphaNumStr(10),
  //       })
  //       .returning()
  //
  //     const lcUserInChat = await client
  //       .insert(lcUsersInTgChats)
  //       .values({
  //         lcUserUuid: lcUser[0].uuid,
  //         userInChatUuid: userInChat[0].uuid,
  //         isActive: true,
  //         isActiveToggledAt: new Date(),
  //       })
  //       .returning()
  //
  //     const lcProblemInserts = Array.from(
  //       {
  //         length: randomInt(21, 25),
  //       },
  //       (_, i) =>
  //         ({
  //           slug: randomAlphaNumStr(10),
  //           difficulty: randomInt(1, 2) === 1 ? 'easy' : 'hard',
  //           lcId: randomAlphaNumStr(10),
  //           title: randomAlphaNumStr(10),
  //           topics: ['topic1', 'topic2'],
  //         }) satisfies LcProblemInsert,
  //     )
  //
  //     const lcProblemSelects = await client
  //       .insert(lcProblems)
  //       .values(lcProblemInserts)
  //       .returning()
  //
  //     const submissionInserts = Array.from(
  //       { length: randomInt(5, 20) },
  //       (_, i) =>
  //         ({
  //           lcProblemUuid:
  //             lcProblemSelects[randomInt(0, lcProblemSelects.length - 1)].uuid,
  //           lcUserUuid: lcUser[0].uuid,
  //           submittedAt: getDatePlusDays(-i),
  //         }) satisfies SubmissionInsert,
  //     )
  //
  //     const submissions = await client
  //       .insert(acceptedSubmissions)
  //       .values(submissionInserts)
  //       .returning()
  //   }
  // })
  //
  // console.log('Seeded')
  process.exit(0)
}

void seed()
