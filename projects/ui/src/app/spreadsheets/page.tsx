'use client'

import { GoogleAuthGuard } from '@/app/_lib/google-auth-guard'
import { Picker } from '@/app/spreadsheets/_components/picker'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/app/_lib/ui/button'
import { useRouter } from 'next/navigation'

export default () => {
  const session = useSession()
  const router = useRouter()

  return (
    <div>
      {session.status === 'authenticated' && (
        <Button onClick={() => void signOut()}>Sign Out</Button>
      )}
      <GoogleAuthGuard>
        <Picker
          onPick={(e) => {
            console.log(e.detail.docs)
            router.replace('https://t.me/leetcode_monkey_bot?help=task_name')
          }}
        />
      </GoogleAuthGuard>
    </div>
  )
}
