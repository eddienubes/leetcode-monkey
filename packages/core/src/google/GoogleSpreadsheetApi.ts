import { sheets } from '@googleapis/sheets'
import { GoogleAuthService } from '@/google/GoogleAuthService'
import { sheets_v4 } from '@googleapis/sheets/v4'

export class GoogleSpreadsheetApi {
  constructor(private readonly auth: GoogleAuthService) {}

  public async get(id: string, refreshToken: string): Promise<any> {
    const client = await this.getSheetsClient(refreshToken)
    const response = await client.spreadsheets.get({
      spreadsheetId: id,
    })
    return response.data
  }

  async getSheetsClient(refreshToken: string): Promise<sheets_v4.Sheets> {
    const client = await this.auth.getAuthClient(refreshToken)
    return sheets({
      auth: client,
      version: 'v4',
    })
  }
}
