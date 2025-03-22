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
import { useGoogleAuth } from '@/app/_lib/google-auth-guard'
import './style.scss'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'drive-picker': DrivePickerAttributes
      'drive-picker-docs-view': DrivePickerDocsViewAttributes
    }
  }
}

interface Props {
  onPick?: (e: PickedEvent) => void
  onError?: (e: ErrorEvent) => void
  onCancel?: (e: CancelledEvent) => void
}

export const Picker = (props: Props) => {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const session = useGoogleAuth()

  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    void import('@googleworkspace/drive-picker-element')
  }, [])

  useEffect(() => {
    if (!ref.current) {
      return
    }

    ref.current.addEventListener('picker:picked', props.onPick as EventListener)
    ref.current.addEventListener('picker:error', props.onError as EventListener)
    ref.current.addEventListener(
      'picker:canceled',
      props.onCancel as EventListener,
    )

    return () => {
      ref.current?.removeEventListener(
        'picker:picked',
        props.onPick as EventListener,
      )
      ref.current?.removeEventListener(
        'picker:error',
        props.onError as EventListener,
      )
      ref.current?.removeEventListener(
        'picker:canceled',
        props.onCancel as EventListener,
      )
    }
  }, [ref.current])

  return (
    <drive-picker
      ref={ref}
      nav-hidden={true}
      origin={window.location.protocol + '//' + window.location.host}
      app-id={clientConfig.google.projectId}
      oauth-token={session.data.accessToken}
      multiselect={false}
    >
      <drive-picker-docs-view view-id="SPREADSHEETS"></drive-picker-docs-view>
    </drive-picker>
  )
}
