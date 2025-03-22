export const serverConfig = {
  google: {
    clientCredentials: JSON.parse(process.env.GOOGLE_CLIENT_JSON as string),
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  },
  auth: {
    secret: process.env.AUTH_SECRET as string,
  }
}

