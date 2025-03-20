export const serverConfig = {
  google: {
    clientCredentials: JSON.parse(process.env.GOOGLE_CLIENT_JSON as string),
  },
}

