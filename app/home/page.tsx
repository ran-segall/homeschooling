'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useKid } from '@/lib/context'
import { useAppData } from '@/lib/app-data'

const XP_PER_LEVEL = 100

const SUBJECT_ICONS: Record<string, string> = {
  philosophy: '💭', geography: '🌍', writing: '✍️',
  money: '💰', tech: '💻', history: '📜', science: '🔬', art: '🎨',
}

const WEEKLY_GOALS = [
  { label: 'Complete 3 lessons', target: 3 },
  { label: 'Try a new subject', target: 1 },
  { label: '3-day streak', target: 3 },
]

export default function HomePage() {
  const { kid, logout } = useKid()
  const { getProgress, getNextApprovedLesson, getCompletedSessions, subjects } = useAppData()
  const router = useRouter()

  useEffect(() => {
    if (!kid) router.replace('/')
  }, [kid, router])

  if (!kid) return null

  const progress = getProgress(kid.id)
  const nextLesson = getNextApprovedLesson(kid.id)
  const subject = nextLesson ? subjects.find(s => s.id === nextLesson.subject_id) : null

  const xp = progress?.xp ?? 0
  const level = progress?.level ?? 1
  const streak = progress?.streak_days ?? 0
  const xpIntoLevel = xp % XP_PER_LEVEL
  const xpPct = (xpIntoLevel / XP_PER_LEVEL) * 100

  // Weekly goals — derive from completed sessions this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const recentSessions = getCompletedSessions(kid.id).filter(s => (s.completed_at ?? '') >= weekAgo)
  const lessonsThisWeek = recentSessions.length
  const subjectsThisWeek = new Set(recentSessions.map(s => {
    // find subject_id via lesson lookup would need context — use count as proxy
    return s.lesson_id
  })).size

  const weeklyGoalsDone = [
    Math.min(lessonsThisWeek, 3),
    Math.min(subjectsThisWeek >= 1 ? 1 : 0, 1),
    Math.min(streak, 3),
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 48px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0 32px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
            Hi, {kid.name} 👋
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {streak > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--amber-bg)', borderRadius: 20, padding: '5px 12px' }}>
                <span style={{ fontSize: 14 }}>🔥</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber-fg)' }}>{streak}</span>
              </div>
            )}
            <button
              onClick={() => { logout(); router.push('/') }}
              style={{ fontSize: 13, color: 'var(--ink3)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Switch
            </button>
          </div>
        </div>

        {/* Level + XP bar */}
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--line)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Level {level}
            </span>
            <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{xpIntoLevel} / {XP_PER_LEVEL} XP</span>
          </div>
          <div style={{ height: 8, background: 'var(--lime-bg)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${xpPct}%`, background: 'var(--lime)', borderRadius: 4, transition: 'width 1s ease' }} />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink3)' }}>
            {XP_PER_LEVEL - xpIntoLevel} XP to level {level + 1}
          </p>
        </div>

        {/* Next lesson card */}
        {nextLesson ? (
          <button
            onClick={() => router.push(`/lesson/${nextLesson.id}`)}
            style={{
              width: '100%', background: 'var(--ink)', borderRadius: 20,
              padding: '28px 28px', border: 'none', cursor: 'pointer',
              textAlign: 'left', marginBottom: 20, display: 'block',
              transition: 'opacity 100ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.92')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>
                {subject ? SUBJECT_ICONS[subject.id] ?? '📚' : '📚'}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {subject?.label ?? 'Lesson'}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
              {nextLesson.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>+{nextLesson.xp_reward} XP</span>
              <div style={{ background: 'var(--lime)', color: 'var(--lime-fg)', fontWeight: 700, fontSize: 13, borderRadius: 100, padding: '8px 20px' }}>
                Start →
              </div>
            </div>
          </button>
        ) : (
          <div style={{ background: 'var(--card)', borderRadius: 20, padding: '28px', border: '1px solid var(--line)', marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: 'var(--ink2)', margin: 0 }}>No lessons ready yet — ask a parent to approve one.</p>
          </div>
        )}

        {/* Weekly goals */}
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--line)' }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            This week
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {WEEKLY_GOALS.map((g, i) => {
              const done = weeklyGoalsDone[i]
              const pct = Math.min((done / g.target) * 100, 100)
              const complete = done >= g.target
              return (
                <div key={g.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, color: complete ? 'var(--ink2)' : 'var(--ink)', textDecoration: complete ? 'line-through' : 'none' }}>
                      {g.label}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{done}/{g.target}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--lime-bg)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--lime)', borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
