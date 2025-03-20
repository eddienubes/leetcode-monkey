import { sheets } from '@googleapis/sheets'
import { OAuth2Client } from 'google-auth-library'

export class GoogleSpreadsheetApi {
  private readonly client

  constructor(private readonly auth: OAuth2Client) {
    this.client = sheets({
      auth,
      version: 'v4',
    })
  }

  public async get(id: string): Promise<any> {
    const response = await this.client.spreadsheets.get({
      spreadsheetId: id,
    })
    return response.data
  }
}
