import 'server-only'

export const serverConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  },
  auth: {
    secret: process.env.AUTH_SECRET as string,
    redirectProxyUrl: process.env.UI_BASE_URL as string,
  },
}
