'use client'

import { KidProvider } from '@/lib/context'
import { AppDataProvider } from '@/lib/app-data'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <KidProvider>{children}</KidProvider>
    </AppDataProvider>
  )
}
