'use client'

import { KidProvider } from '@/lib/context'

export function Providers({ children }: { children: React.ReactNode }) {
  return <KidProvider>{children}</KidProvider>
}
