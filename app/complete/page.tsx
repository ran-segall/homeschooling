'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useKid } from '@/lib/context'
import { supabase } from '@/lib/supabase'
import type { Lesson, KidProgress, Subject } from '@/lib/database.types'

function CompleteScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const lessonId = params.get('lesson')
  const { kid } = useKid()

  const [lesson, setLesson] = useState<(Lesson & { subject?: Subject }) | null>(null)
  const [progress, setProgress] = useState<KidProgress | null>(null)
  const [xpAnimated, setXpAnimated] = useState(0)

  useEffect(() => {
    if (!kid || !lessonId) return
    loadAndUpdate()
  }, [kid, lessonId])

  async function loadAndUpdate() {
    if (!kid || !lessonId) return

    const [lessonRes, progressRes] = await Promise.all([
      supabase.from('lessons').select('*, subject:subjects(*)').eq('id', lessonId).single(),
      supabase.from('kid_progress').select('*').eq('kid_id', kid.id).single(),
    ])

    const lessonData = (lessonRes.data ?? null) as unknown as Lesson & { subject?: Subject }
    const progressData = (progressRes.data ?? null) as unknown as KidProgress

    setLesson(lessonData)

    if (lessonData && progressData) {
      const newXp = progressData.xp + lessonData.xp_reward
      const newLevel = Math.floor(newXp / 100) + 1

      await supabase.from('kid_progress').update({
        xp: newXp,
        level: newLevel,
        last_lesson_at: new Date().toISOString(),
        streak_days: progressData.streak_days + 1,
        updated_at: new Date().toISOString(),
      }).eq('kid_id', kid.id)

      await supabase.from('lessons').update({ status: 'completed' }).eq('id', lessonId)

      setProgress({ ...progressData, xp: newXp, level: newLevel })

      // Animate XP counter
      let count = 0
      const target = lessonData.xp_reward
      const step = Math.ceil(target / 30)
      const interval = setInterval(() => {
        count = Math.min(count + step, target)
        setXpAnimated(count)
        if (count >= target) clearInterval(interval)
      }, 40)
    }
  }

  if (!kid) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>

      {/* XP burst */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 12 }}>✦</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 72, color: 'var(--lime)', lineHeight: 1, marginBottom: 4 }}>
          +{xpAnimated}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          XP earned
        </div>
      </div>

      {/* Lesson info */}
      {lesson && (
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Lesson complete
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: '#fff', margin: 0, fontWeight: 400 }}>
            {lesson.title}
          </h1>
        </div>
      )}

      {/* Stats */}
      {progress && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 48 }}>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Level {progress.level}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Current level</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>🔥 {progress.streak_days}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Day streak</div>
          </div>
        </div>
      )}

      <button
        onClick={() => router.push('/home')}
        style={{
          padding: '16px 40px', fontSize: 16, fontWeight: 600,
          background: 'var(--lime)', color: 'var(--lime-fg)',
          border: 'none', borderRadius: 100, cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        Back to home
      </button>
    </div>
  )
}

export default function CompletePage() {
  return (
    <Suspense>
      <CompleteScreen />
    </Suspense>
  )
}
