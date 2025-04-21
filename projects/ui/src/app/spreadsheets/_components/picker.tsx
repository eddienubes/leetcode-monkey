'use client'

import { useEffect, useRef } from 'react'
import { clientConfig } from '@/app/config'
import {
  CancelledEvent,
  DrivePickerAttributes,
  DrivePickerDocsViewAttributes,
  PickedEvent,
} from './types'
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
  show?: boolean
}

export const Picker = (props: Props) => {
  const session = useGoogleAuth()

  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    void import('@googleworkspace/drive-picker-element')
  }, [])

  useEffect(() => {
    if (!ref.current) {
      return
    }

    const ac = new AbortController()

    ref.current.addEventListener(
      'picker:picked',
      props.onPick as EventListener,
      { signal: ac.signal },
    )
    ref.current.addEventListener(
      'picker:error',
      props.onError as EventListener,
      { signal: ac.signal },
    )
    ref.current.addEventListener(
      'picker:canceled',
      props.onCancel as EventListener,
      { signal: ac.signal },
    )

    return () => {
      ac.abort()
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
      visible={!!props.show}
    >
      <drive-picker-docs-view view-id="SPREADSHEETS"></drive-picker-docs-view>
    </drive-picker>
  )
}
