'use client'

import { Picker } from '@/app/spreadsheets/_components/picker'
import { signOut } from 'next-auth/react'
import { Button } from '@/app/_lib/ui/button'
import { useRouter } from 'next/navigation'
import { PickedEvent } from '@/app/spreadsheets/_components/types'
import Image from 'next/image'
import './style.scss'
import { connectSpreadsheet } from '@/server/spreadsheet-connector'
import { useState } from 'react'
import { useGoogleAuth } from '@/app/_lib/google-auth-guard'
import { clientConfig } from '../config'

interface Props {
  sessionId: string
}

export const Spreadsheets = (props: Props) => {
  const session = useGoogleAuth()
  const [showPicker, setShowPicker] = useState(true)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const gotoBot = (payload = '') => {
    const url = new URL(clientConfig.bot.baseUrl)
    url.searchParams.set('start', payload)
    window.location.href = url.toString()
  }

  const onPick = async (e: PickedEvent) => {
    if (!e.detail.docs[0]?.driveSuccess) {
      return
    }

    const fileId = e.detail.docs[0].id
    const res = await connectSpreadsheet(props.sessionId, {
      refreshToken: session.data.refreshToken,
      spreadsheetId: fileId,
      spreadsheetName: e.detail.docs[0].name,
    })

    if (res.status === 'error') {
      setError(true)
      return
    }

    gotoBot('spreadsheet')
  }

  if (error) {
    return (
      <div>
        Most likely you spreadsheet connection session has expired. Please
        request a new URL from the bot and try again.
      </div>
    )
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
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
  )
}
