'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { clientConfig } from '@/app/config'
import {
  CancelledEvent,
  DrivePickerAttributes,
  DrivePickerDocsViewAttributes,
  PickedEvent,
} from '@/types'
import { useGoogleAuth } from '@/app/_components/google-auth-guard'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'drive-picker': DrivePickerAttributes
      'drive-picker-docs-view': DrivePickerDocsViewAttributes
    }
  }
}

export const Picker = () => {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const session = useGoogleAuth()

  const ref = useRef<HTMLElement>(null)

  const onPick = (e: PickedEvent) => {
    console.log(e)
  }

  const onError = (e: ErrorEvent) => {
    console.error(e)
  }

  const onCancel = (e: CancelledEvent) => {
    console.log(e)
  }

  useEffect(() => {
    if (!ref.current) {
      return
    }

    ref.current.addEventListener('picker:picked', onPick as EventListener)
    ref.current.addEventListener('picker:error', onError as EventListener)
    ref.current.addEventListener('picker:canceled', onCancel as EventListener)

    return () => {
      ref.current?.removeEventListener('picker:picked', onPick as EventListener)
      ref.current?.removeEventListener('picker:error', onError as EventListener)
      ref.current?.removeEventListener(
        'picker:canceled',
        onCancel as EventListener,
      )
    }
  }, [ref.current])

  return (
    <drive-picker
      ref={ref}
      origin={window.location.protocol + '//' + window.location.host}
      app-id={clientConfig.google.projectId}
      oauth-token={session.data.accessToken}
      multiselect={false}
    >
      <drive-picker-docs-view view-id="SPREADSHEETS"></drive-picker-docs-view>
    </drive-picker>
  )
}
