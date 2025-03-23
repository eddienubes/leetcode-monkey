'use client'

import { GoogleAuthGuard } from '@/app/_lib/google-auth-guard'
import { Picker } from '@/app/spreadsheets/_components/picker'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/app/_lib/ui/button'
import {
  notFound,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import { PickedEvent } from '@/app/spreadsheets/_components/types'
import { useState } from 'react'

export default () => {
  const session = useSession()
  const router = useRouter()
  const params = useSearchParams()
  const pathname = usePathname()
  const [showPicker, setShowPicker] = useState(true)

  const id = params.get('id')

  if (!id) {
    notFound()
  }

  const onPick = async (e: PickedEvent) => {
    if (e.detail.docs[0].driveSuccess) {
      const fileId = e.detail.docs[0].id
      router.replace(`/spreadsheets/${fileId}`)
    }
    router.replace('https://t.me/leetcode_monkey_bot?help=task_name')
  }

  return (
    <div>
      {session.status === 'authenticated' && (
        <>
          <Button onClick={() => void signOut()}>Sign Out</Button>
          <Button onClick={() => setShowPicker((prev) => !prev)}>
            Open Picker
          </Button>
        </>
      )}
      <GoogleAuthGuard>
        <Picker
          onPick={onPick}
          show={showPicker}
          onCancel={() => setShowPicker(false)}
        />
      </GoogleAuthGuard>
    </div>
  )
}
