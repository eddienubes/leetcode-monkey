import { FunctionComponent } from 'react'
import dynamic from 'next/dynamic'

export const withoutSsr = <P extends {}>(comp: FunctionComponent<P>) => {
  return dynamic(() => Promise.resolve({ default: comp }), {
    ssr: false,
  })
}