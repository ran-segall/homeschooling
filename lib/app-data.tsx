'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import * as store from './local-store'
import { loadStore, SUBJECTS } from './local-store'
import type { Profile, KidProgress, Subject } from './database.types'
import type { StoredLesson, StoredSession, StoredStep } from './local-store'

export type { StoredLesson, StoredSession, StoredStep }
export { SUBJECTS }

interface AppDataContextValue {
  // Loaded flag — false on SSR/first render, true after localStorage loads
  ready: boolean

  // Static reference
  subjects: Subject[]

  // Reads (return current snapshot)
  kids: Profile[]
  getKidById: (id: string) => Profile | null
  getLessons: (kidId: string, statuses: string[]) => StoredLesson[]
  getLessonsByKids: (kidIds: string[], statuses: string[]) => StoredLesson[]
  getLessonById: (id: string) => StoredLesson | null
  getNextApprovedLesson: (kidId: string) => StoredLesson | null
  getProgress: (kidId: string) => KidProgress | null
  getCompletedSessions: (kidId?: string) => StoredSession[]

  // Mutations — sync with localStorage then re-render
  addKid: (name: string, age: number, color: string) => Profile
  addLesson: (input: Parameters<typeof store.addLesson>[0]) => StoredLesson
  approveLesson: (id: string) => void
  deleteLesson: (id: string) => void
  markLessonCompleted: (id: string) => void
  createSession: (lessonId: string, kidId: string) => string
  addStepResponse: (sessionId: string, stepId: string, answer: unknown, isCorrect: boolean | null) => void
  completeSession: (sessionId: string, timeSpentSeconds: number) => void
  addFeedback: (sessionId: string, funRating: number, learnedSomething: string, difficulty: string) => void
  updateProgress: (kidId: string, updates: Partial<Omit<KidProgress, 'id' | 'kid_id'>>) => void

  refresh: () => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  // version triggers re-renders after mutations; data is re-read from localStorage
  const [version, setVersion] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Ensure localStorage is available (client only)
    setReady(true)
  }, [])

  const refresh = useCallback(() => setVersion(v => v + 1), [])

  // Wrap a store mutation so it triggers a re-render
  function mut<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => TReturn) {
    return (...args: TArgs): TReturn => {
      const result = fn(...args)
      refresh()
      return result
    }
  }

  // Re-read snapshot from localStorage on every render (synchronous, cheap)
  const snap = ready ? loadStore() : { profiles: [], lessons: [], sessions: [], progress: [] }

  const value: AppDataContextValue = {
    ready,
    subjects: SUBJECTS,

    kids: snap.profiles.filter(p => p.role === 'kid'),
    getKidById: store.getKidById,
    getLessons: store.getLessons,
    getLessonsByKids: store.getLessonsByKids,
    getLessonById: store.getLessonById,
    getNextApprovedLesson: store.getNextApprovedLesson,
    getProgress: store.getProgress,
    getCompletedSessions: store.getCompletedSessions,

    addKid: mut(store.addKid),
    addLesson: mut(store.addLesson),
    approveLesson: (id) => { store.updateLessonStatus(id, 'approved'); refresh() },
    deleteLesson: (id) => { store.deleteLesson(id); refresh() },
    markLessonCompleted: (id) => { store.updateLessonStatus(id, 'completed'); refresh() },
    createSession: mut(store.createSession),
    addStepResponse: mut(store.addStepResponse),
    completeSession: mut(store.completeSession),
    addFeedback: mut(store.addFeedback),
    updateProgress: mut(store.updateProgress),

    refresh,
  }

  // Silence unused warning — version is the re-render trigger
  void version

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
