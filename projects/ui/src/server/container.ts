import 'server-only'
import {
  createProvidersContainer,
  SpreadsheetsConnector,
  GoogleSpreadsheetsDao,
  PgService,
} from '@repo/core'

export const container = createProvidersContainer([
  SpreadsheetsConnector,
  GoogleSpreadsheetsDao,
  PgService,
]).build()
