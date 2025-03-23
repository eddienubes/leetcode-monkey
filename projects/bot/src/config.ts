export const config = {
  bot: {
    token: process.env.TG_BOT_TOKEN as string,
  },
  google: {
    clientCredentials: JSON.parse(process.env.GOOGLE_CLIENT_JSON as string)
  },
  ui: {
    url: process.env.UI_BASE_URL as string,
  }
}
