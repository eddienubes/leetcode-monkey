'use client'

import { ReactElement, useEffect } from 'react'
import { SessionContextValue, signIn, useSession } from 'next-auth/react'

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

export const GoogleAuthGuard = (props: { children: ReactElement }) => {
  const session = useSession()

  useEffect(() => {
    if (session.status === 'unauthenticated') {
      void signIn('google')
    }
  }, [session.status])

  if (session.status === 'loading') {
    return <div>Loading...</div>
  }

  if (session.status === 'authenticated') {
    return props.children
  }
}
