import { config } from '@/config'
import { Credentials, OAuth2Client } from 'google-auth-library'
import { Injectable } from "@/common";

@Injectable()
export class GoogleAuthService {
  private readonly client = new OAuth2Client({
    clientId: config.google.clientCredentials.web.client_id,
    clientSecret: config.google.clientCredentials.web.client_secret,
    projectId: config.google.projectId,

    redirectUri: 'http://localhost:3001',
  })

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

  getClient(accessToken: string): OAuth2Client {
    const client = new OAuth2Client({
      clientId: config.google.clientCredentials.web.client_id,
      clientSecret: config.google.clientCredentials.web.client_secret,
      projectId: config.google.projectId,
    })
    client.setCredentials({
      access_token: accessToken,
    })

    return client
  }
}
