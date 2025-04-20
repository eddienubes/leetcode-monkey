import { GoogleSpreadsheetApi } from '@/google/GoogleSpreadsheetApi'
import { createCronQueue, Injectable, JobOfQueue, Lifecycle } from '@/common'
import { SpreadsheetsConnector } from '@/spreadsheets/SpreadsheetsConnector'
import { LcSpreadsheetWriteQueue } from '@/lc/queues'

@Injectable(GoogleSpreadsheetApi, SpreadsheetsConnector)
export class LcSpreadsheetsWorker implements Lifecycle {
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
  ) {}

  async pull() {
    try {
    } catch (e) {}
  }

  async write(job: JobOfQueue<LcSpreadsheetWriteQueue>) {}

  async onModuleInit() {
    // pull every 30 seconds
    await this.cron.schedule('*/30 * * * * *')
    await this.queue.start()
  }

  async onModuleDestroy() {
    await this.cron.stop()
    await this.queue.stop()
  }
}
