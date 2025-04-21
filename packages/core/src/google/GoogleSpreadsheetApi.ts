import { sheets } from '@googleapis/sheets'
import { GoogleAuthService } from '@/google/GoogleAuthService'
import { sheets_v4 } from '@googleapis/sheets/v4'
import { GaxiosError } from 'gaxios'
import { GoogleSheetsApiError } from '@/spreadsheets/errors'
import Schema$BatchUpdateSpreadsheetResponse = sheets_v4.Schema$BatchUpdateSpreadsheetResponse
import Schema$AppendValuesResponse = sheets_v4.Schema$AppendValuesResponse
import { Injectable } from '@/common'

@Injectable(GoogleAuthService)
export class GoogleSpreadsheetApi {
  constructor(private readonly auth: GoogleAuthService) {}

  async createSheetIfNotExists(
    id: string,
    refreshToken: string,
    sheetName: string,
  ): Promise<Schema$BatchUpdateSpreadsheetResponse> {
    try {
      const client = await this.getSheetsClient(refreshToken)
      const res = await client.spreadsheets.batchUpdate({
        spreadsheetId: id,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      })

      return res.data
    } catch (e) {
      if (e instanceof GaxiosError) {
        throw GoogleSheetsApiError.fromGaxios(e)
      }
      throw e
    }
  }

  /**
   * Append values to a sheet starting from the first empty row.
   * @param id
   * @param sheetName
   * @param refreshToken
   * @param values
   */
  async append(
    id: string,
    sheetName: string,
    refreshToken: string,
    values: unknown[][],
  ): Promise<Schema$AppendValuesResponse> {
    try {
      const client = await this.getSheetsClient(refreshToken)
      const res = await client.spreadsheets.values.append({
        spreadsheetId: id,
        range: `'${sheetName}'!A:A`,
        // https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueInputOption
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      })

      return res.data
    } catch (e) {
      if (e instanceof GaxiosError) {
        throw GoogleSheetsApiError.fromGaxios(e)
      }
      throw e
    }
  }

  async get(id: string, refreshToken: string): Promise<any> {
    try {
      const client = await this.getSheetsClient(refreshToken)
      const response = await client.spreadsheets.get({
        spreadsheetId: id,
      })
      return response.data
    } catch (e) {
      if (e instanceof GaxiosError) {
        throw GoogleSheetsApiError.fromGaxios(e)
      }
      throw e
    }
  }

  async getSheetsClient(refreshToken: string): Promise<sheets_v4.Sheets> {
    try {
      const client = await this.auth.getAuthClient(refreshToken)
      return sheets({
        auth: client,
        version: 'v4',
      })
    } catch (e) {
      if (e instanceof GaxiosError) {
        throw GoogleSheetsApiError.fromGaxios(e)
      }
      throw e
    }
  }
}
