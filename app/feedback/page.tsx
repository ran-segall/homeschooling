'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppData } from '@/lib/app-data'

const FUN_OPTIONS = [
  { rating: 1, emoji: '😐', label: 'Meh' },
  { rating: 2, emoji: '🙂', label: 'OK' },
  { rating: 3, emoji: '😄', label: 'Fun!' },
  { rating: 4, emoji: '🤩', label: 'Amazing!' },
]

const LEARNED_OPTIONS = [
  { value: 'yes_lots', label: 'Yes, loads!' },
  { value: 'a_bit', label: 'A little bit' },
  { value: 'already_knew', label: 'I already knew it' },
]

const DIFFICULTY_OPTIONS = [
  { value: 'too_easy', label: 'Too easy' },
  { value: 'just_right', label: 'Just right' },
  { value: 'a_bit_hard', label: 'A bit hard' },
  { value: 'too_hard', label: 'Really hard' },
]

function FeedbackForm() {
  const router = useRouter()
  const params = useSearchParams()
  const sessionId = params.get('session')
  const lessonId = params.get('lesson')
  const { addFeedback } = useAppData()

  const [fun, setFun] = useState<number | null>(null)
  const [learned, setLearned] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit() {
    if (!fun || !learned || !difficulty || !sessionId) return
    setSubmitting(true)
    addFeedback(sessionId, fun, learned, difficulty)
    router.push(`/complete?lesson=${lessonId}`)
  }

  const allAnswered = fun !== null && learned !== null && difficulty !== null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 36 }}>

        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 400, color: 'var(--ink)', margin: '0 0 6px' }}>
            Quick check-in
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink2)', margin: 0 }}>3 questions, takes 10 seconds.</p>
        </div>

        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: '0 0 12px' }}>Was it fun?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {FUN_OPTIONS.map(o => (
              <button key={o.rating} onClick={() => setFun(o.rating)} style={{
                flex: 1, padding: '14px 8px',
                border: `2px solid ${fun === o.rating ? 'var(--ink)' : 'var(--line)'}`,
                background: fun === o.rating ? 'var(--ink)' : 'var(--card)',
                color: fun === o.rating ? '#fff' : 'var(--ink)',
                borderRadius: 12, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                fontFamily: 'var(--font-body)', transition: 'all 120ms',
              }}>
                <span style={{ fontSize: 24 }}>{o.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: '0 0 12px' }}>Did you learn something new?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LEARNED_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setLearned(o.value)} style={{
                padding: '12px 16px', textAlign: 'left', fontSize: 15,
                border: `2px solid ${learned === o.value ? 'var(--ink)' : 'var(--line)'}`,
                background: learned === o.value ? 'var(--ink)' : 'var(--card)',
                color: learned === o.value ? '#fff' : 'var(--ink)',
                borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 120ms',
              }}>{o.label}</button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: '0 0 12px' }}>How hard was it?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {DIFFICULTY_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setDifficulty(o.value)} style={{
                flex: 1, padding: '12px 8px', fontSize: 13, fontWeight: 500,
                border: `2px solid ${difficulty === o.value ? 'var(--ink)' : 'var(--line)'}`,
                background: difficulty === o.value ? 'var(--ink)' : 'var(--card)',
                color: difficulty === o.value ? '#fff' : 'var(--ink)',
                borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 120ms',
              }}>{o.label}</button>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={!allAnswered || submitting} style={{
          padding: '16px 32px', fontSize: 16, fontWeight: 600,
          background: allAnswered ? 'var(--ink)' : 'var(--line)',
          color: allAnswered ? '#fff' : 'var(--ink3)',
          border: 'none', borderRadius: 12,
          cursor: allAnswered ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-body)',
        }}>
          {submitting ? 'Saving…' : 'Done →'}
        </button>
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  return <Suspense><FeedbackForm /></Suspense>
}
