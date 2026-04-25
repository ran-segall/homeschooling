// Local data store backed by localStorage.
// Mirrors the Supabase schema so swapping is a drop-in later.

import type { Profile, KidProgress, Subject } from './database.types'

// ─── Static reference data ─────────────────────────────────────

export const SUBJECTS: Subject[] = [
  { id: 'philosophy', label: 'Philosophy', color: 'oklch(0.72 0.12 295)' },
  { id: 'geography',  label: 'Geography',  color: 'oklch(0.72 0.12 180)' },
  { id: 'writing',    label: 'Writing',    color: 'oklch(0.72 0.12 40)'  },
  { id: 'money',      label: 'Money',      color: 'oklch(0.72 0.12 125)' },
  { id: 'tech',       label: 'Tech',       color: 'oklch(0.72 0.12 220)' },
  { id: 'history',    label: 'History',    color: 'oklch(0.72 0.12 30)'  },
  { id: 'science',    label: 'Science',    color: 'oklch(0.72 0.12 155)' },
  { id: 'art',        label: 'Art',        color: 'oklch(0.72 0.12 350)' },
]

export function getSubjectById(id: string): Subject | undefined {
  return SUBJECTS.find(s => s.id === id)
}

// ─── Store types ───────────────────────────────────────────────

export interface StoredStep {
  id: string
  lesson_id: string
  step_order: number
  type: string
  content: Record<string, unknown>
}

export interface StoredLesson {
  id: string
  title: string
  subject_id: string
  assigned_to: string
  status: 'pending' | 'approved' | 'completed'
  why_now: string | null
  xp_reward: number
  order_index: number
  created_at: string
  description?: string
  steps: StoredStep[]
}

export interface StoredStepResponse {
  step_id: string
  answer: unknown
  is_correct: boolean | null
}

export interface StoredFeedback {
  fun_rating: number
  learned_something: string
  difficulty: string
}

export interface StoredSession {
  id: string
  lesson_id: string
  kid_id: string
  started_at: string
  completed_at: string | null
  time_spent_seconds: number | null
  responses: StoredStepResponse[]
  feedback: StoredFeedback | null
}

interface Store {
  profiles: Profile[]
  lessons: StoredLesson[]
  sessions: StoredSession[]
  progress: KidProgress[]
}

// ─── Storage helpers ───────────────────────────────────────────

const KEY = 'curio:store'

function empty(): Store {
  return { profiles: [], lessons: [], sessions: [], progress: [] }
}

export function loadStore(): Store {
  if (typeof window === 'undefined') return empty()
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Store) : empty()
  } catch {
    return empty()
  }
}

function save(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store))
}

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ─── Profiles ──────────────────────────────────────────────────

export function getKids(): Profile[] {
  return loadStore().profiles.filter(p => p.role === 'kid')
}

export function getKidById(id: string): Profile | null {
  return loadStore().profiles.find(p => p.id === id) ?? null
}

export function addKid(name: string, age: number, avatar_color: string): Profile {
  const store = loadStore()
  const profile: Profile = {
    id: uid(), name, role: 'kid', age, avatar_color,
    created_at: new Date().toISOString(),
  }
  const progress: KidProgress = {
    id: uid(), kid_id: profile.id, xp: 0, level: 1,
    streak_days: 0, last_lesson_at: null, updated_at: new Date().toISOString(),
  }
  store.profiles.push(profile)
  store.progress.push(progress)
  save(store)
  return profile
}

// ─── Lessons ───────────────────────────────────────────────────

export function getLessons(kidId: string, statuses: string[]): StoredLesson[] {
  return loadStore().lessons
    .filter(l => l.assigned_to === kidId && statuses.includes(l.status))
    .sort((a, b) => a.order_index - b.order_index)
}

export function getLessonsByKids(kidIds: string[], statuses: string[]): StoredLesson[] {
  return loadStore().lessons
    .filter(l => kidIds.includes(l.assigned_to) && statuses.includes(l.status))
    .sort((a, b) => a.order_index - b.order_index)
}

export function getLessonById(id: string): StoredLesson | null {
  return loadStore().lessons.find(l => l.id === id) ?? null
}

export function getNextApprovedLesson(kidId: string): StoredLesson | null {
  return loadStore().lessons
    .filter(l => l.assigned_to === kidId && l.status === 'approved')
    .sort((a, b) => a.order_index - b.order_index)[0] ?? null
}

export function addLesson(input: {
  id?: string
  title: string
  subject_id: string
  assigned_to: string
  status?: StoredLesson['status']
  why_now?: string | null
  xp_reward?: number
  order_index?: number
  description?: string
  steps: { type: string; content: Record<string, unknown> }[]
}): StoredLesson {
  const store = loadStore()
  const lessonId = input.id ?? uid()
  const lesson: StoredLesson = {
    id: lessonId,
    title: input.title,
    subject_id: input.subject_id,
    assigned_to: input.assigned_to,
    status: input.status ?? 'pending',
    why_now: input.why_now ?? null,
    xp_reward: input.xp_reward ?? 50,
    order_index: input.order_index ?? 99,
    description: input.description,
    created_at: new Date().toISOString(),
    steps: input.steps.map((s, i) => ({
      id: uid(),
      lesson_id: lessonId,
      step_order: i + 1,
      type: s.type,
      content: s.content,
    })),
  }
  store.lessons.push(lesson)
  save(store)
  return lesson
}

export function updateLessonStatus(id: string, status: StoredLesson['status']) {
  const store = loadStore()
  const lesson = store.lessons.find(l => l.id === id)
  if (lesson) lesson.status = status
  save(store)
}

export function deleteLesson(id: string) {
  const store = loadStore()
  store.lessons = store.lessons.filter(l => l.id !== id)
  save(store)
}

// ─── Sessions ──────────────────────────────────────────────────

export function createSession(lessonId: string, kidId: string): string {
  const store = loadStore()
  const session: StoredSession = {
    id: uid(), lesson_id: lessonId, kid_id: kidId,
    started_at: new Date().toISOString(),
    completed_at: null, time_spent_seconds: null,
    responses: [], feedback: null,
  }
  store.sessions.push(session)
  save(store)
  return session.id
}

export function addStepResponse(sessionId: string, stepId: string, answer: unknown, isCorrect: boolean | null) {
  const store = loadStore()
  const session = store.sessions.find(s => s.id === sessionId)
  if (session) session.responses.push({ step_id: stepId, answer, is_correct: isCorrect })
  save(store)
}

export function completeSession(sessionId: string, timeSpentSeconds: number) {
  const store = loadStore()
  const session = store.sessions.find(s => s.id === sessionId)
  if (session) {
    session.completed_at = new Date().toISOString()
    session.time_spent_seconds = timeSpentSeconds
  }
  save(store)
}

export function addFeedback(sessionId: string, funRating: number, learnedSomething: string, difficulty: string) {
  const store = loadStore()
  const session = store.sessions.find(s => s.id === sessionId)
  if (session) session.feedback = { fun_rating: funRating, learned_something: learnedSomething, difficulty }
  save(store)
}

export function getCompletedSessions(kidId?: string): StoredSession[] {
  const all = loadStore().sessions.filter(s => s.completed_at !== null)
  return kidId ? all.filter(s => s.kid_id === kidId) : all
}

// ─── Progress ──────────────────────────────────────────────────

export function getProgress(kidId: string): KidProgress | null {
  return loadStore().progress.find(p => p.kid_id === kidId) ?? null
}

export function updateProgress(kidId: string, updates: Partial<Omit<KidProgress, 'id' | 'kid_id'>>) {
  const store = loadStore()
  const prog = store.progress.find(p => p.kid_id === kidId)
  if (prog) Object.assign(prog, updates, { updated_at: new Date().toISOString() })
  save(store)
}
