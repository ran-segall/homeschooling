export type Role = 'kid' | 'parent'
export type LessonStatus = 'pending' | 'approved' | 'completed'
export type Difficulty = 'too_easy' | 'just_right' | 'too_hard'

export interface Profile {
  id: string
  name: string
  role: Role
  age: number | null
  avatar_color: string
  created_at: string
}

export interface Subject {
  id: string
  label: string
  color: string
}

export interface Lesson {
  id: string
  title: string
  subject_id: string
  assigned_to: string
  status: LessonStatus
  why_now: string | null
  xp_reward: number
  order_index: number
  created_at: string
  // joined
  subject?: Subject
  steps?: LessonStep[]
}

export interface LessonStep {
  id: string
  lesson_id: string
  step_order: number
  type: 'Read' | 'Multiple choice' | 'Drag to order' | 'Drag to match' | 'Interactive' | 'Written answer' | 'Socratic'
  content: Record<string, unknown>
  created_at: string
}

export interface LessonSession {
  id: string
  lesson_id: string
  kid_id: string
  started_at: string
  completed_at: string | null
  time_spent_seconds: number | null
  // joined
  lesson?: Lesson
  responses?: StepResponse[]
  feedback?: LessonFeedback
}

export interface StepResponse {
  id: string
  session_id: string
  step_id: string
  answer: unknown
  is_correct: boolean | null
  feedback_note: string | null
  created_at: string
}

export interface LessonFeedback {
  id: string
  session_id: string
  fun_rating: number | null
  learned_something: string | null
  difficulty: Difficulty | null
  created_at: string
}

export interface Trait {
  id: string
  kid_id: string
  trait_name: string
  score: number
  updated_at: string
}

export interface KidProgress {
  id: string
  kid_id: string
  xp: number
  level: number
  streak_days: number
  last_lesson_at: string | null
  updated_at: string
}

// Supabase Database generic (used by createClient)
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'id' | 'created_at'>; Update: Partial<Profile> }
      subjects: { Row: Subject; Insert: Subject; Update: Partial<Subject> }
      lessons: { Row: Lesson; Insert: Omit<Lesson, 'created_at' | 'subject' | 'steps'>; Update: Partial<Lesson> }
      lesson_steps: { Row: LessonStep; Insert: Omit<LessonStep, 'id' | 'created_at'>; Update: Partial<LessonStep> }
      lesson_sessions: { Row: LessonSession; Insert: Omit<LessonSession, 'id' | 'started_at' | 'lesson' | 'responses' | 'feedback'>; Update: Partial<LessonSession> }
      step_responses: { Row: StepResponse; Insert: Omit<StepResponse, 'id' | 'created_at'>; Update: Partial<StepResponse> }
      lesson_feedback: { Row: LessonFeedback; Insert: Omit<LessonFeedback, 'id' | 'created_at'>; Update: Partial<LessonFeedback> }
      traits: { Row: Trait; Insert: Omit<Trait, 'id' | 'updated_at'>; Update: Partial<Trait> }
      kid_progress: { Row: KidProgress; Insert: Omit<KidProgress, 'id' | 'updated_at'>; Update: Partial<KidProgress> }
    }
  }
}
