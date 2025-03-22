'use client'
import { useGoogleAuth } from '@/app/_components/GoogleAuthGuard'

export const SomeClient = () => {
  const session = useGoogleAuth()

  return (
    <div>
      <h1>Some Client</h1>
      <p className="whitespace-normal break-all">{JSON.stringify(session)}</p>
    </div>
  )
}
