'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useKid } from '@/lib/context'
import { useAppData } from '@/lib/app-data'
import type { Profile } from '@/lib/database.types'

const C = {
  bg: '#F6F3EC',
  ink: '#16140F',
  ink3: '#6B685E',
  line: '#E2DDCF',
  lime: 'oklch(0.86 0.17 120)',
}

function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill={C.ink} />
      <circle cx="16" cy="16" r="5.5" fill={C.lime} />
      <circle cx="22" cy="10" r="2" fill={C.bg} />
    </svg>
  )
}

function Avatar({ color, initial, size = 88 }: { color: string; initial: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      letterSpacing: '-0.02em', fontFamily: 'var(--font-body)', flexShrink: 0,
    }}>
      {initial}
    </div>
  )
}

export default function LoginPage() {
  const { kid, setKid } = useKid()
  const { kids, ready } = useAppData()
  const router = useRouter()
  const [tapped, setTapped] = useState<string | null>(null)

  const dateLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  useEffect(() => {
    if (kid) router.replace('/home')
  }, [kid, router])

  function handleSelect(profile: Profile) {
    setTapped(profile.id)
    setKid(profile)
    setTimeout(() => router.push('/home'), 280)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>

      <div style={{
        padding: '20px 40px', marginTop: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={28} />
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: C.ink }}>Curio</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, color: C.ink3, border: `1px solid ${C.line}`, borderRadius: 100, padding: '4px 12px' }}>
          {dateLabel}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 40px 60px' }}>
        <div style={{ width: '100%', maxWidth: 700 }}>

          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: C.ink3, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
              Who&apos;s learning today?
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px, 6vw, 56px)', lineHeight: 1.05, marginTop: 10, letterSpacing: '-0.025em', color: C.ink }}>
              Pick your profile.
            </div>
          </div>

          {!ready ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${C.line}`, borderTopColor: C.ink, animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : kids.length === 0 ? (
            <div style={{ padding: '48px 32px', textAlign: 'center', background: '#FFF', borderRadius: 24, border: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>👋</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: C.ink, marginBottom: 8 }}>No profiles yet</div>
              <div style={{ fontSize: 14, color: C.ink3, lineHeight: 1.6 }}>Ask a parent to set up your profile in the parent view.</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: kids.length === 1 ? '1fr' : 'repeat(2, 1fr)',
              gap: 20,
              maxWidth: kids.length === 1 ? 340 : 700,
            }}>
              {kids.map((k) => {
                const isActive = tapped === k.id
                const initial = k.name[0]?.toUpperCase() ?? '?'
                return (
                  <button
                    key={k.id}
                    onClick={() => handleSelect(k)}
                    style={{
                      textAlign: 'left', background: '#FFF',
                      border: `1.5px solid ${isActive ? C.ink : C.line}`,
                      borderRadius: 24, padding: 32, cursor: 'pointer',
                      transform: isActive ? 'scale(0.97)' : 'scale(1)',
                      transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                      boxShadow: isActive ? '0 8px 28px rgba(0,0,0,0.09)' : '0 1px 0 rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'rgba(22,20,15,0.2)' } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.boxShadow = '0 1px 0 rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = C.line } }}
                  >
                    <Avatar color={k.avatar_color} initial={initial} size={88} />
                    <div style={{ marginTop: 22 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1, color: C.ink }}>
                        {k.name}
                      </div>
                      <div style={{ fontSize: 13, color: C.ink3, marginTop: 6 }}>age {k.age}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: 36 }}>
            <button
              onClick={() => router.push('/parent')}
              style={{ background: 'transparent', border: 0, color: C.ink3, fontSize: 13, padding: 0, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.ink)}
              onMouseLeave={e => (e.currentTarget.style.color = C.ink3)}
            >
              ← Parent view
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
