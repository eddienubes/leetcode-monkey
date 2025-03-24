import 'server-only'
import 'next-auth/jwt'
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { serverConfig } from '@/server/config'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    accessTokenExpiresAt: number
    refreshToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
    accessTokenExpiresAt: number
    refreshToken: string
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: serverConfig.google.clientId,
      clientSecret: serverConfig.google.clientSecret,
      // https://authjs.dev/getting-started/deployment#securing-a-preview-deployment
      // We don't use proxies, but it's a nice way to use custom config for redirect URI
      authorization: {
        params: {
          scope:
            'openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file',
          prompt: 'consent',
          access_type: 'offline',
        },
      },
    }),
  ],
  trustHost: true,
  secret: serverConfig.auth.secret,
  callbacks: {
    jwt: async (props) => {
      if (props.account) {
        props.token.accessTokenExpiresAt = props.account.expires_at!
        props.token.accessToken = props.account.access_token!
        props.token.refreshToken = props.account.refresh_token!
      }
      // we're sure that the token is not null here
      // we request the access token from the account
      return props.token
    },
    session: async (props) => {
      props.session.accessToken = props.token.accessToken
      props.session.accessTokenExpiresAt = props.token.accessTokenExpiresAt
      props.session.refreshToken = props.token.refreshToken
      return props.session
    },
  },
})
