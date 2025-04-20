export class GoogleSheetsApiError extends Error {
  constructor(message: string, cause?: Error) {
    super(message)
    this.name = 'GoogleSheetsApiError'
    this.cause = cause
  }
}
