import { ServerComponentProps } from '@/app/_lib/types'
import notFound from '@/app/not-found'
import { GoogleAuthGuard } from '@/app/_lib/google-auth-guard'
import { Spreadsheets } from '@/app/spreadsheets/spreadsheets'

export default async (props: ServerComponentProps) => {
  const params = await props.searchParams
  const id = params?.['id']

  if (typeof id !== 'string') {
    return notFound()
  }

  return (
    <GoogleAuthGuard>
      <Spreadsheets sessionId={id} />
    </GoogleAuthGuard>
  )
}
