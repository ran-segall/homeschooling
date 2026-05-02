'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useKid } from '@/lib/context'
import { useAppData } from '@/lib/app-data'

function CompleteScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const lessonId = params.get('lesson')
  const { kid } = useKid()
  const { getLessonById, subjects, getProgress, updateProgress, markLessonCompleted, getNextApprovedLesson } = useAppData()

  const [xpAnimated, setXpAnimated] = useState(0)
  const [done, setDone] = useState(false)

  const lesson = lessonId ? getLessonById(lessonId) : null
  const subject = lesson ? subjects.find(s => s.id === lesson.subject_id) : null
  const progress = kid ? getProgress(kid.id) : null
  const nextLesson = kid ? getNextApprovedLesson(kid.id) : null
  const hasNextLesson = nextLesson !== null && nextLesson.id !== lessonId

  useEffect(() => {
    if (!kid || !lesson || !progress || done) return
    setDone(true)

    const newXp = progress.xp + lesson.xp_reward
    const newLevel = Math.floor(newXp / 100) + 1

    updateProgress(kid.id, {
      xp: newXp,
      level: newLevel,
      streak_days: progress.streak_days + 1,
      last_lesson_at: new Date().toISOString(),
    })
    if (lessonId) markLessonCompleted(lessonId)

    // Animate XP counter
    let count = 0
    const target = lesson.xp_reward
    const step = Math.ceil(target / 30)
    const interval = setInterval(() => {
      count = Math.min(count + step, target)
      setXpAnimated(count)
      if (count >= target) clearInterval(interval)
    }, 40)

    return () => clearInterval(interval)
  }, [kid?.id, lessonId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!kid) return null

  const displayProgress = progress
    ? { level: Math.floor((progress.xp + (lesson?.xp_reward ?? 0)) / 100) + 1, streak: progress.streak_days + 1 }
    : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 12 }}>✦</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 72, color: 'var(--lime-fg)', lineHeight: 1, marginBottom: 4 }}>
          +{xpAnimated}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          XP earned
        </div>
      </div>

      {lesson && (
        <div style={{ marginBottom: 40 }}>
          {subject && (
            <p style={{ fontSize: 13, color: 'var(--ink3)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {subject.label} · Lesson complete
            </p>
          )}
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--ink)', margin: 0, fontWeight: 400 }}>
            {lesson.title}
          </h1>
        </div>
      )}

      {displayProgress && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 48 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>Level {displayProgress.level}</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>Current level</div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>🔥 {displayProgress.streak}</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>Day streak</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => router.push('/home')} style={{
          padding: '16px 32px', fontSize: 15, fontWeight: 600,
          background: 'transparent', color: 'var(--ink)',
          border: '1px solid var(--line)', borderRadius: 100, cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}>
          Back to home
        </button>
        {hasNextLesson && (
          <button onClick={() => router.push(`/lesson/${nextLesson!.id}`)} style={{
            padding: '16px 32px', fontSize: 15, fontWeight: 600,
            background: 'var(--ink)', color: '#fff',
            border: 'none', borderRadius: 100, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>
            Next lesson →
          </button>
        )}
      </div>
    </div>
  )
}

export default function CompletePage() {
  return <Suspense><CompleteScreen /></Suspense>
}
