import {
  GoogleSpreadsheetsDao,
  PgService,
  SpreadsheetsConnector,
} from '@repo/core'

export const createContainer = async () => {
  const pg = new PgService()
  const googleSpreadsheetsDao = new GoogleSpreadsheetsDao(pg)
  const spreadsheetConnector = new SpreadsheetsConnector(googleSpreadsheetsDao)
}
