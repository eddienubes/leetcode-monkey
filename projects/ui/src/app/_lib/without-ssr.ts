import { FunctionComponent } from 'react'
import dynamic from 'next/dynamic'

/**
 * Doesn't seem to work at all without an explicit dynamic import
 * @param comp
 */
export const withoutSsr = <P extends {}>(comp: FunctionComponent<P>) => {
  return dynamic(() => Promise.resolve({ default: comp }), {
    ssr: false,
  })
}
