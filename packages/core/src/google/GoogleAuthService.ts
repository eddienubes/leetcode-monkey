import { config } from '@/config'
import { Credentials, OAuth2Client } from 'google-auth-library'
import { Injectable, Memo } from '@/common'

@Injectable()
export class GoogleAuthService {
  private readonly accessTokenMemo = new Memo({
    ttlMs: 1000 * 60 * 58, // 58 minutes (to be safe < 60 minutes)
  })
  private readonly client = new OAuth2Client({
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    projectId: config.google.projectId,

    redirectUri: config.ui.baseUrl,
  })

  async revoke(token: string): Promise<void> {
    await this.client.revokeToken(token)
  }

  getAuthUrl(scopes: string[]): string {
    return this.client.generateAuthUrl({
      scope: scopes,
      access_type: 'offline',
    })
  }

  async exchangeAuthCode(code: string): Promise<Credentials> {
    const { tokens } = await this.client.getToken(code)
    this.client.setCredentials(tokens)

    return tokens
  }

  getBaseClient(): OAuth2Client {
    return this.client
  }

  async getAuthClient(refreshToken: string): Promise<OAuth2Client> {
    const client = new OAuth2Client({
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
      projectId: config.google.projectId,
    })

    client.setCredentials({
      refresh_token: refreshToken,
    })

    const accessToken = await this.accessTokenMemo.run(
      refreshToken,
      async () => {
        const res = await client.refreshAccessToken()
        return res.credentials.access_token!
      },
    )

    client.setCredentials({
      access_token: accessToken,
    })

    return client
  }
}
