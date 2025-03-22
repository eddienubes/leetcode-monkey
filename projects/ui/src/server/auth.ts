import 'next-auth/jwt'
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { serverConfig } from '@/server/config'

declare module 'next-auth' {
  interface Session {
    accessToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: serverConfig.google.clientId,
      clientSecret: serverConfig.google.clientSecret,
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
  secret: serverConfig.auth.secret,
  callbacks: {
    jwt: async (props) => {
      if (props.account) {
        props.token.accessToken = props.account.access_token!
      }
      // we're sure that the token is not null here
      // we request the access token from the account
      return props.token
    },
    session: async (props) => {
      props.session.accessToken = props.token.accessToken
      return props.session
    },
  },
})
