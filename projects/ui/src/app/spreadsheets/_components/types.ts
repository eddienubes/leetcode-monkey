import { HTMLAttributes, RefObject } from 'react'

export type PickerEvent = PickedEvent | ErrorEvent | CancelledEvent

export type GoogleMimeType =
  | 'application/vnd.google-apps.folder'
  | 'application/vnd.google-apps.document'

export interface PickedEvent extends CustomEvent {
  type: 'picker:picked'
  detail: {
    action: 'picked'
    viewToken: [
      string,
      null,
      {
        parent: string
        mimeTypes: string
        selectFolder: boolean
        dr: boolean
      },
    ]
    docs: Array<{
      id: string
      serviceId: string
      mimeType: string
      name: string
      description: string
      type: string
      lastEditedUtc: number
      iconUrl: string
      url: string
      embedUrl: string
      driveSuccess: boolean
      sizeBytes: number
      parentId: string
    }>
  }
}

export interface ErrorEvent extends CustomEvent {
  type: 'picker:error'
  detail: {
    action: 'picked'
    error: string
  }
}

export interface CancelledEvent extends CustomEvent {
  type: 'picker:canceled'
  detail: {
    action: 'cancel'
  }
}

export interface DrivePickerAttributes extends HTMLAttributes<HTMLElement> {
  'app-id'?: string
  'client-id'?: string
  'developer-key'?: string
  'hide-title-bar'?: 'default' | 'true' | 'false'
  locale?: string
  'max-items'?: number
  'mine-only'?: boolean
  multiselect?: boolean
  'nav-hidden'?: boolean
  'oauth-token'?: string
  origin?: string
  'relay-url'?: string
  scope?: string
  title?: string
  visible?: boolean
  ref?: RefObject<HTMLElement | null>
}

export interface DrivePickerDocsViewAttributes
  extends HTMLAttributes<HTMLElement> {
  'enable-drives'?: 'default' | 'true' | 'false'
  'include-folders'?: 'default' | 'true' | 'false'
  'mime-types'?: GoogleMimeType
  parent?: string
  mode?: 'GRID' | 'LIST'
  'owned-by-me'?: 'default' | 'true' | 'false'
  query?: string
  'select-folder-enabled'?: 'default' | 'true' | 'false'
  starred?: 'default' | 'true' | 'false'
  'view-id'?: string
}
