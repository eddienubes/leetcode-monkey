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
import Image from 'next/image'
import './style.scss'

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

  const gotoBot = (payload = '') => {
    router.replace(`https://t.me/leetcode_monkey_bot?start=${payload}`)
  }

  const onPick = async (e: PickedEvent) => {
    if (e.detail.docs[0].driveSuccess) {
      const fileId = e.detail.docs[0].id
      router.replace(`/spreadsheets/${fileId}`)
    }
    gotoBot()
  }

  return (
    <GoogleAuthGuard>
      <div className="spreadsheets">
        <button
          className="spreadsheets__image-container"
          onClick={() => gotoBot()}
        >
          <Image
            className="spreadsheets__image"
            src="/leetcode-monkey.webp"
            priority
            fill
            alt={'LeetCode monkey looking at the screen with a question'}
          ></Image>
        </button>
        {session.status === 'authenticated' && (
          <div className="spreadsheets-controls">
            <Button
              type="button"
              className="spreadsheets-controls__button"
              onClick={() => setShowPicker((prev) => !prev)}
            >
              Open Picker
            </Button>
            <Button
              type="button"
              className="spreadsheets-controls__button"
              onClick={() => void signOut()}
            >
              Sign Out
            </Button>
          </div>
        )}
        <Picker
          onPick={onPick}
          show={showPicker}
          onCancel={() => setShowPicker(false)}
        />
      </div>
    </GoogleAuthGuard>
  )
}
