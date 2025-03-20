'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { exchangeCode } from '@/server/google'
import '@googleworkspace/drive-picker-element'
import { clientConfig } from '@/app/config'
import {
  CancelledEvent,
  DrivePickerAttributes,
  DrivePickerDocsViewAttributes,
  PickedEvent,
} from '@/types'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'drive-picker': DrivePickerAttributes
      'drive-picker-docs-view': DrivePickerDocsViewAttributes
    }
  }
}

export const Picker = () => {
  console.log('Picker')
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const ref = useRef<HTMLElement>(null)
  const [state, setState] = useState<{
    code: string | null
    error: string | null
    isLoading: boolean
    accessToken: string | null
  }>({
    code: params.get('code'),
    error: null,
    isLoading: true,
    accessToken: null,
  })

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
    const accessToken = localStorage.getItem('g_at')
    if (accessToken) {
      void router.replace(pathname)
      setState((prev) => ({
        ...prev,
        accessToken: accessToken,
        isLoading: false,
      }))
      return
    }

    if (!state.code) {
      return
    }

    exchangeCode(state.code)
      .then((token) => {
        localStorage.setItem('g_at', token)
        setState((prev) => ({
          ...prev,
          accessToken: token,
          isLoading: false,
        }))
      })
      .catch((err) => {
        void router.replace(pathname)
        setState((prev) => ({
          ...prev,
          error: err.message,
          isLoading: false,
        }))
      })
  }, [state.code, state.accessToken])

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

  if (state.error) {
    return <div>{state.error}</div>
  }

  console.log('state', clientConfig.google)
  return (
    <>
      {state.isLoading && <progress className="progress w-56"></progress>}
      {!state.isLoading && (
        <drive-picker
          ref={ref}
          origin={window.location.protocol + '//' + window.location.host}
          app-id={clientConfig.google.projectId}
          oauth-token={state.accessToken as string}
          multiselect={false}
        >
          <drive-picker-docs-view view-id="SPREADSHEETS"></drive-picker-docs-view>
        </drive-picker>
      )}
    </>
  )
}
