import { GaxiosError } from 'gaxios'

export class GoogleSheetsApiError extends Error {
  constructor(message: string, cause?: Error) {
    super(message)
    this.name = 'GoogleSheetsApiError'
    this.cause = cause
  }

  static fromGaxios(e: GaxiosError): GoogleSheetsApiError {
    if (e.message.includes('Unable to parse range')) {
      return new GoogleSheetsSpreadsheetNotFoundError(e.message, e)
    }

    return new GoogleSheetsApiError(e.message, e)
  }
}

export class GoogleSheetsSpreadsheetNotFoundError extends GoogleSheetsApiError {
  constructor(message?: string, cause?: Error) {
    super(message || 'Google spreadsheet not found', cause)

    this.name = GoogleSheetsSpreadsheetNotFoundError.name
  }
}
