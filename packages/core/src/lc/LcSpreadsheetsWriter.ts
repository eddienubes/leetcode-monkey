import { GoogleSpreadsheetApi } from '@/google/GoogleSpreadsheetApi'
import {
  createCronQueue,
  Injectable,
  JobOfQueue,
  Lifecycle,
  ToJsonType,
} from '@/common'
import { SpreadsheetsConnector } from '@/spreadsheets/SpreadsheetsConnector'
import { LcSpreadsheetWriteQueue } from '@/lc/queues'
import { GoogleSpreadsheetsDao, SpreadsheetToUpdate } from '@/spreadsheets'
import { tgUsers } from '@/pg'
import { LcProblemsService } from '@/lc/LcProblemsService'
import { GoogleSheetsSpreadsheetNotFoundError } from '@/spreadsheets/errors'

@Injectable(GoogleSpreadsheetApi, SpreadsheetsConnector, GoogleSpreadsheetsDao)
export class LcSpreadsheetsWriter implements Lifecycle {
  static submissionsSpreadsheetName = 'Submissions'
  private readonly cron = createCronQueue(
    'spreadsheets-writer-cron',
    this.pull.bind(this),
  )
  private readonly queue = LcSpreadsheetWriteQueue.connect(
    this.write.bind(this),
  )

  constructor(
    private readonly sheetsApi: GoogleSpreadsheetApi,
    private readonly connector: SpreadsheetsConnector,
    private readonly googleSheetsDao: GoogleSpreadsheetsDao,
  ) {}

  async pull() {
    try {
      const sheets = await this.googleSheetsDao.getSpreadsheetsToUpdate()

      await this.queue.addBulk(
        sheets.map((sheet) => ({
          name: `${sheet.spreadsheetId}-${sheet.tgChatUuid}`,
          data: {
            sheet,
          },
        })),
      )
    } catch (e) {
      console.error('Error pulling spreadsheets to update:', e)
    }
  }

  async write(job: JobOfQueue<LcSpreadsheetWriteQueue>) {
    console.log('Writing spreadsheet:', job.data.sheet.spreadsheetId)
    const sheet = job.data.sheet

    const write = async () => {
      await this.sheetsApi.append(
        sheet.spreadsheetId,
        LcSpreadsheetsWriter.submissionsSpreadsheetName,
        sheet.refreshToken,
        sheet.newSubmissions.map((submission) => [
          submission.tgUser.username ||
            submission.tgUser.firstName ||
            tgUsers.lastName,
          submission.lcUser.slug,
          submission.problem.slug,
          LcProblemsService.getLcProblemUrl(submission.problem.slug),
          submission.problem.difficulty,
          submission.submittedAt,
        ]),
      )
      await this.googleSheetsDao.upsertSpreadsheetUpdate({
        lastUpdatedAt: new Date(),
        googleSpreadsheetUuid: sheet.uuid,
        tgChatUuid: sheet.tgChatUuid,
      })
    }

    try {
      await write()
    } catch (e) {
      if (!(e instanceof GoogleSheetsSpreadsheetNotFoundError)) {
        console.error(
          'Unknown error writing to spreadsheet, disconnecting',
          sheet.spreadsheetId,
          e,
        )
        await this.connector.disconnect(sheet.uuid)
        return
      }

      const created = await this.createSpreadsheetSafe(sheet)

      if (!created) {
        console.error(`Disconnecting the spreadsheet ${sheet.spreadsheetId}...`)
        await this.connector.disconnect(sheet.uuid)
        return
      }

      console.log(
        `2nd attempt to write to the spreadsheet: ${sheet.spreadsheetId}`,
      )
      await write()
    }
  }

  private async createSpreadsheetSafe(
    sheet: ToJsonType<SpreadsheetToUpdate>,
  ): Promise<boolean> {
    try {
      await this.sheetsApi.createSheetIfNotExists(
        sheet.spreadsheetId,
        sheet.refreshToken,
        LcSpreadsheetsWriter.submissionsSpreadsheetName,
      )
      return true
    } catch (e) {
      console.error(
        `${this.createSpreadsheetSafe.name}: unable to create a spreadsheet`,
        e,
      )
      return false
    }
  }

  async onModuleInit() {
    // pull every 45 seconds
    await this.cron.schedule('*/50 * * * * *')
    await this.queue.start()
  }

  async onModuleDestroy() {
    await this.cron.stop()
    await this.queue.stop()
  }
}
