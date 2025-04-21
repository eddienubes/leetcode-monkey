export const clientConfig = {
  bot: {
    baseUrl: process.env.NEXT_PUBLIC_BOT_BASE_URL as string,
  },
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    projectId: process.env.NEXT_PUBLIC_GOOGLE_PROJECT_ID as string,
  },
}
