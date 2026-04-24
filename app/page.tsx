'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useKid } from '@/lib/context'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/database.types'

// Design tokens matching the prototype
const C = {
  bg: '#F6F3EC',
  ink: '#16140F',
  ink3: '#6B685E',
  line: '#E2DDCF',
  lime: 'oklch(0.86 0.17 120)',
}

const KIDS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Reef',
    age: 9,
    color: '#4F7942',
    initial: 'R',
    sub: 'Lvl 2 · 3-day streak 🔥',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Tommy',
    age: 11,
    color: '#3B5FA0',
    initial: 'T',
    sub: 'Lvl 3 · 5-day streak 🔥',
  },
]

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
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: 700,
      color: '#fff',
      letterSpacing: '-0.02em',
      fontFamily: 'var(--font-body)',
      flexShrink: 0,
    }}>
      {initial}
    </div>
  )
}

export default function LoginPage() {
  const { kid, setKid } = useKid()
  const router = useRouter()
  const [tapped, setTapped] = useState<string | null>(null)

  // Date label e.g. "Apr 24"
  const dateLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  useEffect(() => {
    if (kid) router.replace('/home')
  }, [kid, router])

  async function handleSelect(kidId: string) {
    setTapped(kidId)
    const { data } = await supabase.from('profiles').select('*').eq('id', kidId).single()
    if (data) {
      setKid(data as Profile)
      setTimeout(() => router.push('/home'), 280)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>

      {/* Top nav */}
      <div style={{
        padding: '20px 40px',
        marginTop: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={28} />
          <span style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: C.ink,
          }}>
            Curio
          </span>
        </div>
        <div style={{
          fontSize: 12,
          fontWeight: 500,
          color: C.ink3,
          background: 'transparent',
          border: `1px solid ${C.line}`,
          borderRadius: 100,
          padding: '4px 12px',
          letterSpacing: '0.02em',
        }}>
          {dateLabel}
        </div>
      </div>

      {/* Centered content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 40px 60px',
      }}>
        <div style={{ width: '100%', maxWidth: 700 }}>

          {/* Headline */}
          <div style={{ marginBottom: 48 }}>
            <div style={{
              fontSize: 11,
              color: C.ink3,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
            }}>
              Who&apos;s learning today?
            </div>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(40px, 6vw, 56px)',
              lineHeight: 1.05,
              marginTop: 10,
              letterSpacing: '-0.025em',
              color: C.ink,
            }}>
              Pick your profile.
            </div>
          </div>

          {/* Profile cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}>
            {KIDS.map((k) => {
              const isActive = tapped === k.id
              return (
                <button
                  key={k.id}
                  onClick={() => handleSelect(k.id)}
                  style={{
                    textAlign: 'left',
                    background: '#FFF',
                    border: `1.5px solid ${isActive ? C.ink : C.line}`,
                    borderRadius: 24,
                    padding: 32,
                    cursor: 'pointer',
                    transform: isActive ? 'scale(0.97)' : 'scale(1)',
                    transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                    boxShadow: isActive
                      ? '0 8px 28px rgba(0,0,0,0.09)'
                      : '0 1px 0 rgba(0,0,0,0.02)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'
                      e.currentTarget.style.borderColor = 'rgba(22,20,15,0.2)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.boxShadow = '0 1px 0 rgba(0,0,0,0.02)'
                      e.currentTarget.style.borderColor = C.line
                    }
                  }}
                >
                  <Avatar color={k.color} initial={k.initial} size={88} />
                  <div style={{ marginTop: 22 }}>
                    <div style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 40,
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      color: C.ink,
                    }}>
                      {k.name}
                    </div>
                    <div style={{ fontSize: 13, color: C.ink3, marginTop: 6 }}>age {k.age}</div>
                  </div>
                  <div style={{ fontSize: 13, color: C.ink3, marginTop: 12 }}>{k.sub}</div>
                </button>
              )
            })}
          </div>

          {/* Parent link */}
          <div style={{ marginTop: 36 }}>
            <button
              onClick={() => router.push('/parent')}
              style={{
                background: 'transparent',
                border: 0,
                color: C.ink3,
                fontSize: 13,
                padding: 0,
                cursor: 'pointer',
              }}
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
