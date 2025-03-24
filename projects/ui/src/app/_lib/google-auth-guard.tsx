'use client'

import { ReactElement, useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'

export const useGoogleAuth = () => {
  const session = useSession()

  // should not happen basically
  useEffect(() => {
    if (session.status === 'unauthenticated') {
      void signIn('google')
    }
  }, [session.status])

  if (session.status !== 'authenticated') {
    throw new Error(
      'Please wrap component in GoogleAuthGuard in order ot use this useGoogleAuth hook',
    )
  }

  return session
}

interface Props {
  children: ReactElement
}

/**
 * BEWARE: Throws the user back to the sign-in page if the access token has expired
 * @param props
 * @constructor
 */
export const GoogleAuthGuard = (props: Props) => {
  const session = useSession()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session.status === 'unauthenticated') {
      void signIn('google')
    }

    if (session.status === 'authenticated') {
      if (!session.data.accessTokenExpiresAt) {
        void signIn('google')
        return
      }

      const hasAccessTokenExpired =
        session.data.accessTokenExpiresAt * 1000 < Date.now()

      if (hasAccessTokenExpired) {
        void signIn('google')
        return
      }
    }

    if (session.status === 'authenticated') {
      setLoading(false)
    }
  }, [session.status])

  if (loading) {
    return <p>Loading...</p>
  }

  if (session.status === 'authenticated') {
    return props.children
  }
}
