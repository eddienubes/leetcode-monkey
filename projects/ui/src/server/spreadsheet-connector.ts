'use server'

import { type ConnectSpreadsheetParams } from '@repo/core'
import { container } from '@/server/container'
import { SpreadsheetsConnector } from '@repo/core'
import { action } from '@/server/utils'

export const connectSpreadsheet = action(
  async (sessionId: string, params: ConnectSpreadsheetParams) => {
    const connector = container.get(SpreadsheetsConnector)

    await connector.connectSpreadsheet(sessionId, params)
  },
)
