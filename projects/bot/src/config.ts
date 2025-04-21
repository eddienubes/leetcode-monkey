export const config = {
  server: {
    env: process.env.NODE_ENV as string,
  },
  bot: {
    token: process.env.TG_BOT_TOKEN as string,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    projectId: process.env.GOOGLE_PROJECT_ID as string,
  },
  ui: {
    url: process.env.UI_BASE_URL as string,
  },
}
