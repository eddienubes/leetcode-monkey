import { BullQueue } from '@/common'
import { GoogleSpreadsheetSelect } from '@/spreadsheets/GoogleSpreadsheetsDao'

export class SpreadsheetWriteQueue extends BullQueue {
  static queueName = 'spreadsheets-writer-queue'

  sheet: GoogleSpreadsheetSelect
  // add solved problems. Plural per spreadsheet
}
