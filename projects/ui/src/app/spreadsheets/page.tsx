'use client'

// import { Picker } from '@/app/spreadsheets/_components/picker'
import { GoogleAuthGuard } from '@/app/_components/google-auth-guard'
import { withoutSsr } from '@/app/_components/without-ssr'
import dynamic from 'next/dynamic'
import { Picker } from "@/app/spreadsheets/_components/picker";
// import { PickerComponent } from "@/app/spreadsheets/_components/picker";

// const Picker = dynamic(
//   () =>
//     import('@/app/spreadsheets/_components/picker').then(
//       (m) => m.PickerComponent,
//     ),
//   { ssr: false },
// )

export default () => {
  return (
    <GoogleAuthGuard>
      <Picker />
    </GoogleAuthGuard>
  )
}
