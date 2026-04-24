'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Profile } from './database.types'

interface KidContextValue {
  kid: Profile | null
  setKid: (kid: Profile | null) => void
  logout: () => void
}

const KidContext = createContext<KidContextValue>({
  kid: null,
  setKid: () => {},
  logout: () => {},
})

export function KidProvider({ children }: { children: ReactNode }) {
  const [kid, setKidState] = useState<Profile | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('curio:kid')
    if (stored) {
      try { setKidState(JSON.parse(stored)) } catch {}
    }
  }, [])

  const setKid = (profile: Profile | null) => {
    setKidState(profile)
    if (profile) {
      localStorage.setItem('curio:kid', JSON.stringify(profile))
    } else {
      localStorage.removeItem('curio:kid')
    }
  }

  const logout = () => setKid(null)

  return (
    <KidContext.Provider value={{ kid, setKid, logout }}>
      {children}
    </KidContext.Provider>
  )
}

export const useKid = () => useContext(KidContext)
