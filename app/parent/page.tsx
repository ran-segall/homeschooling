'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppData, SUBJECTS, type StoredLesson, type StoredSession } from '@/lib/app-data'
import type { Profile } from '@/lib/database.types'

// ─── Design tokens ────────────────────────────────────────────
const C = {
  bg: '#F6F3EC', bg2: '#EFEBE0', ink: '#16140F', ink2: '#3A3830',
  ink3: '#6B685E', ink4: '#9B988C', line: '#E2DDCF', card: '#FFFFFF',
  lime: 'oklch(0.86 0.17 120)', limeInk: 'oklch(0.28 0.08 125)',
  violet: 'oklch(0.62 0.18 295)', amber: 'oklch(0.78 0.16 60)',
  rose: 'oklch(0.78 0.12 20)',
}

const AVATAR_COLORS = ['#4F7942', '#3B5FA0', '#8B4513', '#6B3FA0', '#1A7A6E', '#A0522D']

// ─── Primitives ───────────────────────────────────────────────

function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill={C.ink} />
      <circle cx="16" cy="16" r="5.5" fill={C.lime} />
      <circle cx="22" cy="10" r="2" fill={C.bg} />
    </svg>
  )
}

function Avatar({ color, initial, size = 36 }: { color: string; initial: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'var(--font-body)' }}>
      {initial}
    </div>
  )
}

function Chip({ children, tone = 'ghost', style: s }: { children: React.ReactNode; tone?: string; style?: React.CSSProperties }) {
  const styles: Record<string, React.CSSProperties> = {
    ghost:  { background: C.bg2,                       color: C.ink2,    border: `1px solid ${C.line}` },
    lime:   { background: 'oklch(0.93 0.06 120)',       color: C.limeInk, border: '1px solid oklch(0.82 0.12 120)' },
    violet: { background: 'oklch(0.95 0.025 295)',      color: 'oklch(0.40 0.16 295)', border: '1px solid oklch(0.88 0.05 295)' },
    amber:  { background: 'oklch(0.96 0.04 80)',        color: 'oklch(0.42 0.12 65)', border: '1px solid oklch(0.88 0.08 65)' },
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 100, fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap', ...styles[tone], ...s }}>
      {children}
    </span>
  )
}

function Btn({ children, onClick, tone = 'ghost', size = 'md', disabled, style: s }: { children: React.ReactNode; onClick?: () => void; tone?: string; size?: string; disabled?: boolean; style?: React.CSSProperties }) {
  const base: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, transition: 'opacity 120ms', opacity: disabled ? 0.5 : 1 }
  const tones: Record<string, React.CSSProperties> = {
    ink:   { background: C.ink, color: '#F6F3EC' },
    lime:  { background: C.lime, color: C.limeInk },
    ghost: { background: C.bg2, color: C.ink2, border: `1px solid ${C.line}` },
  }
  const sizes: Record<string, React.CSSProperties> = {
    sm: { fontSize: 12, padding: '7px 12px' },
    md: { fontSize: 13, padding: '9px 16px' },
  }
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...tones[tone], ...sizes[size], ...s }}>{children}</button>
}

const SUBJECT_COLORS: Record<string, { bg: string; fg: string }> = {
  'Philosophy':  { bg: 'oklch(0.92 0.04 295)', fg: 'oklch(0.42 0.14 295)' },
  'Geography':   { bg: 'oklch(0.92 0.06 180)', fg: 'oklch(0.35 0.10 185)' },
  'Writing':     { bg: 'oklch(0.93 0.04 40)',  fg: 'oklch(0.42 0.12 50)'  },
  'Money':       { bg: 'oklch(0.93 0.05 120)', fg: 'oklch(0.32 0.10 125)' },
  'Tech':        { bg: 'oklch(0.92 0.04 220)', fg: 'oklch(0.38 0.14 220)' },
  'History':     { bg: 'oklch(0.93 0.04 40)',  fg: 'oklch(0.42 0.12 50)'  },
  'Science':     { bg: 'oklch(0.92 0.06 180)', fg: 'oklch(0.35 0.10 185)' },
  'Art':         { bg: 'oklch(0.94 0.04 350)', fg: 'oklch(0.42 0.12 350)' },
}

const SUBJECT_ICONS: Record<string, string> = {
  philosophy: '💭', geography: '🌍', writing: '✍️', money: '💰',
  tech: '💻', history: '📜', science: '🔬', art: '🎨',
}

const STEP_BG: Record<string, { bg: string; fg: string }> = {
  'Read':           { bg: '#F0EDE4',                    fg: C.ink3 },
  'Multiple choice':{ bg: 'oklch(0.92 0.04 295)',       fg: 'oklch(0.42 0.14 295)' },
  'Drag to order':  { bg: 'oklch(0.93 0.04 40)',        fg: 'oklch(0.42 0.12 50)'  },
  'Drag to match':  { bg: 'oklch(0.93 0.04 40)',        fg: 'oklch(0.42 0.12 50)'  },
  'Interactive':    { bg: 'oklch(0.92 0.06 180)',       fg: 'oklch(0.35 0.10 185)' },
  'Written answer': { bg: 'oklch(0.95 0.025 295)',      fg: 'oklch(0.42 0.14 295)' },
  'Socratic':       { bg: 'oklch(0.93 0.05 120)',       fg: 'oklch(0.32 0.10 125)' },
}

// ─── Add Child Modal ──────────────────────────────────────────

function AddChildModal({ onClose }: { onClose: () => void }) {
  const { addKid } = useAppData()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [colorIdx, setColorIdx] = useState(0)
  const [saving, setSaving] = useState(false)

  function handleSave() {
    if (!name.trim() || !age) return
    setSaving(true)
    addKid(name.trim(), parseInt(age), AVATAR_COLORS[colorIdx])
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(22,20,15,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: C.bg, borderRadius: 24, padding: 28, boxShadow: '0 32px 80px rgba(0,0,0,.28)' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 400, color: C.ink, margin: '0 0 20px' }}>Add a child</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.ink2, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Reef"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, fontSize: 15, color: C.ink, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.ink2, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Age</label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="e.g. 9"
              min={4} max={18}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, fontSize: 15, color: C.ink, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.ink2, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 8 }}>Colour</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {AVATAR_COLORS.map((col, i) => (
                <button key={col} onClick={() => setColorIdx(i)} style={{ width: 36, height: 36, borderRadius: '50%', background: col, border: i === colorIdx ? `3px solid ${C.ink}` : '3px solid transparent', cursor: 'pointer', outline: 'none' }} />
              ))}
            </div>
          </div>

          {name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: C.bg2, borderRadius: 12 }}>
              <Avatar color={AVATAR_COLORS[colorIdx]} initial={name[0].toUpperCase()} size={44} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{name}</div>
                {age && <div style={{ fontSize: 12, color: C.ink3 }}>age {age}</div>}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Btn tone="ink" onClick={handleSave} disabled={!name.trim() || !age || saving} style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? 'Adding…' : 'Add child'}
          </Btn>
          <Btn tone="ghost" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Lesson Preview Modal ─────────────────────────────────────

function LessonPreviewModal({ lesson, onClose, onApprove, onReject }: { lesson: StoredLesson; onClose: () => void; onApprove: () => void; onReject: () => void }) {
  const isApproved = lesson.status === 'approved'
  const subjectLabel = SUBJECTS.find(s => s.id === lesson.subject_id)?.label ?? lesson.subject_id
  const steps = lesson.steps ?? []

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(22,20,15,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 660, maxHeight: '88vh', background: C.bg, borderRadius: 24, boxShadow: '0 32px 80px rgba(0,0,0,.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ padding: '22px 24px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Chip tone="ghost">{subjectLabel}</Chip>
              {lesson.xp_reward && <span style={{ fontSize: 11, color: C.ink4 }}>+{lesson.xp_reward} XP</span>}
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, letterSpacing: '-.02em', lineHeight: 1.15, color: C.ink }}>{lesson.title}</div>
            {lesson.description && <div style={{ fontSize: 13, color: C.ink3, marginTop: 6, lineHeight: 1.5 }}>{lesson.description}</div>}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, background: C.bg2, border: 0, cursor: 'pointer', fontSize: 16, color: C.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {steps.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.ink3, fontSize: 13, padding: '32px 0' }}>No steps yet.</div>
          ) : (
            <>
              <div style={{ fontSize: 10.5, color: C.ink4, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 14, fontFamily: 'var(--font-body)' }}>{steps.length} steps · lesson content</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {steps.map((step, i) => {
                  const tone = STEP_BG[step.type] ?? STEP_BG['Read']
                  const c = step.content
                  return (
                    <div key={step.id} style={{ background: '#FFF', borderRadius: 16, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
                      <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.line}`, background: '#FFFDF8' }}>
                        <div style={{ width: 22, height: 22, borderRadius: 99, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, color: C.bg, fontWeight: 600 }}>{i + 1}</div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: C.ink2 }}>{step.type}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 500, padding: '3px 8px', borderRadius: 999, background: tone.bg, color: tone.fg }}>{step.type}</span>
                      </div>
                      <div style={{ padding: '14px 16px' }}>
                        {!!c.text && <p style={{ margin: 0, fontSize: 14, color: C.ink2, lineHeight: 1.55 }}>{String(c.text)}</p>}
                        {!!c.prompt && <p style={{ margin: 0, fontSize: 14, color: C.ink2, lineHeight: 1.55 }}>{String(c.prompt)}</p>}
                        {!!c.question && <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.4 }}>{String(c.question)}</p>}
                        {Array.isArray(c.options) && (
                          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(c.options as string[]).map((o, j) => (
                              <div key={j} style={{ padding: '9px 12px', borderRadius: 10, fontSize: 13, background: j === c.correct ? 'oklch(0.93 0.06 120)' : C.bg, border: `1px solid ${j === c.correct ? 'oklch(0.72 0.14 120)' : C.line}`, color: j === c.correct ? C.limeInk : C.ink2, display: 'flex', gap: 8, alignItems: 'center' }}>
                                {j === c.correct && <span style={{ fontSize: 11, fontWeight: 700 }}>✓</span>}
                                {o}
                              </div>
                            ))}
                            <div style={{ fontSize: 10, color: C.ink4, letterSpacing: '.1em', marginTop: 2 }}>GREEN = correct answer</div>
                          </div>
                        )}
                        {Array.isArray(c.items) && (
                          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(c.items as string[]).map((item, j) => (
                              <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 11px', borderRadius: 10, background: C.bg, border: `1px solid ${C.line}` }}>
                                <span style={{ width: 18, height: 18, borderRadius: 99, background: C.ink, color: C.bg, fontSize: 9.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 600 }}>{j + 1}</span>
                                <span style={{ fontSize: 13, color: C.ink }}>{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {Array.isArray(c.pairs) && (
                          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(c.pairs as [string, string][]).map(([a, b], j) => (
                              <div key={j} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
                                <div style={{ padding: '8px 11px', borderRadius: 8, background: C.bg, fontSize: 13, fontWeight: 500, color: C.ink }}>{a}</div>
                                <span style={{ color: C.ink4, fontSize: 12 }}>→</span>
                                <div style={{ padding: '8px 11px', borderRadius: 8, background: 'oklch(0.92 0.04 295)', fontSize: 13, color: 'oklch(0.42 0.14 295)' }}>{b}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {!!c.note && <div style={{ marginTop: 10, fontSize: 11.5, color: C.ink3, fontStyle: 'italic', padding: '8px 10px', background: C.bg, borderRadius: 8, borderLeft: `2px solid ${C.violet}` }}>Note: {String(c.note)}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.line}`, background: '#FFFDF8', display: 'flex', gap: 10, alignItems: 'center' }}>
          {!isApproved ? (
            <>
              <Btn tone="ink" onClick={() => { onApprove(); onClose() }} style={{ flex: 1, justifyContent: 'center' }}>✓ Approve lesson</Btn>
              <Btn tone="ghost" onClick={() => { onReject(); onClose() }}>Remove</Btn>
            </>
          ) : (
            <>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: 'oklch(0.65 0.14 140)' }} />
                <span style={{ fontSize: 13, color: 'oklch(0.40 0.10 140)' }}>Approved — appears in next session</span>
              </div>
              <Btn tone="ghost" onClick={() => { onReject(); onClose() }}>Revoke</Btn>
            </>
          )}
          <button onClick={onClose} style={{ background: 'transparent', border: 0, fontSize: 13, color: C.ink3, cursor: 'pointer', padding: '0 8px' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ─── Lesson Card ──────────────────────────────────────────────

function LessonCard({ lesson, onApprove, onReject, onPreview }: { lesson: StoredLesson; onApprove: () => void; onReject: () => void; onPreview: () => void }) {
  const [open, setOpen] = useState(false)
  const isApproved = lesson.status === 'approved'
  const subjectLabel = SUBJECTS.find(s => s.id === lesson.subject_id)?.label ?? lesson.subject_id
  const subColors = SUBJECT_COLORS[subjectLabel] ?? { bg: C.bg2, fg: C.ink3 }

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${isApproved ? 'oklch(0.82 0.12 140)' : C.line}`, background: isApproved ? 'oklch(0.97 0.02 140)' : C.card, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: subColors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
          {SUBJECT_ICONS[lesson.subject_id] ?? '📚'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.ink }}>{lesson.title}</div>
          <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 2 }}>{subjectLabel} · +{lesson.xp_reward ?? 50} XP</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isApproved ? <Chip tone="lime">✓ Approved</Chip> : <Chip>Pending</Chip>}
          <span style={{ color: C.ink3, fontSize: 12, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', display: 'inline-block' }}>▾</span>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${C.line}`, padding: '14px 16px', background: '#FFFDF8' }}>
          {lesson.description && <div style={{ fontSize: 13.5, color: C.ink2, lineHeight: 1.55, marginBottom: 10 }}>{lesson.description}</div>}
          {lesson.why_now && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: 99, background: C.violet, marginTop: 5, flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: C.ink3, lineHeight: 1.5 }}><b style={{ color: C.ink2 }}>Why now:</b> {lesson.why_now}</div>
            </div>
          )}
          {!isApproved && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn tone="ghost" size="sm" onClick={onPreview}>📖 Preview</Btn>
              <Btn tone="ink" size="sm" onClick={onApprove} style={{ flex: 1, justifyContent: 'center' }}>✓ Approve</Btn>
              <Btn tone="ghost" size="sm" onClick={onReject}>Remove</Btn>
            </div>
          )}
          {isApproved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ width: 8, height: 8, borderRadius: 99, background: 'oklch(0.65 0.14 140)', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: 'oklch(0.40 0.10 140)', flex: 1 }}>Approved — appears in next session</div>
              <Btn tone="ghost" size="sm" onClick={onPreview}>📖 Review</Btn>
              <button onClick={onReject} style={{ background: 'transparent', border: 0, fontSize: 11.5, color: C.ink3, cursor: 'pointer' }}>Revoke</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Generate Card ────────────────────────────────────────────

type GeneratedLesson = { id: string; subject: string; title: string; description: string; why_now: string; xp_reward: number; steps: StoredLesson['steps']; status: string; assigned_to: string }

const LOADING_PHASES = [
  { label: 'Reviewing recent lessons', sub: 'analysing scores & feedback patterns' },
  { label: 'Choosing subject & topic', sub: 'finding the right angle for right now' },
  { label: 'Writing lesson content', sub: 'crafting the reading and questions' },
  { label: 'Building interactive steps', sub: 'drag, match & socratic activities' },
  { label: 'Finalising lesson', sub: 'polishing and wrapping up' },
]

function GenerateCard({ kid, onAdded }: { kid: Profile; onAdded: () => void }) {
  const { getCompletedSessions, getLessons, addLesson, enabledTopicIds } = useAppData()
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState(0)
  const [generated, setGenerated] = useState<GeneratedLesson | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [applyingFeedback, setApplyingFeedback] = useState(false)
  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startPhaseTimer() {
    setPhase(0)
    const delays = [1400, 2400, 3000, 2400]
    function advance(i: number) {
      if (i >= LOADING_PHASES.length - 1) return
      phaseTimerRef.current = setTimeout(() => {
        setPhase(i + 1)
        advance(i + 1)
      }, delays[i] ?? 2000)
    }
    advance(0)
  }

  function stopPhaseTimer() {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
    setPhase(LOADING_PHASES.length - 1)
  }

  function buildPayload() {
    const rawSessions = getCompletedSessions(kid.id).slice(0, 6)
    const queued = getLessons(kid.id, ['pending', 'approved']).map(l => l.subject_id)
    const recentSessions = rawSessions.map(s => ({
      lesson_id: s.lesson_id,
      subject_id: SUBJECTS.find(() => true)?.id ?? '',
      fun_rating: s.feedback?.fun_rating ?? null,
      difficulty: s.feedback?.difficulty ?? null,
      score_pct: s.responses?.length
        ? Math.round((s.responses.filter(r => r.is_correct).length / s.responses.length) * 100)
        : null,
    }))
    return { kidId: kid.id, kidName: kid.name, kidAge: kid.age, recentSessions, queuedSubjects: queued, enabledTopics: enabledTopicIds }
  }

  async function generate() {
    setLoading(true)
    setGenerated(null)
    setFeedbackOpen(false)
    setFeedbackText('')
    startPhaseTimer()
    const res = await fetch('/api/lessons/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload()),
    })
    const data = await res.json()
    stopPhaseTimer()
    if (data.lesson) setGenerated(data.lesson)
    setLoading(false)
  }

  async function applyFeedback() {
    if (!generated || !feedbackText.trim()) return
    setApplyingFeedback(true)
    setFeedbackOpen(false)
    setLoading(true)
    startPhaseTimer()
    const res = await fetch('/api/lessons/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...buildPayload(), feedback: feedbackText.trim(), existingLesson: generated }),
    })
    const data = await res.json()
    stopPhaseTimer()
    if (data.lesson) setGenerated(data.lesson)
    setLoading(false)
    setApplyingFeedback(false)
    setFeedbackText('')
  }

  function addToQueue() {
    if (!generated) return
    setSaving(true)
    addLesson({
      title: generated.title,
      subject_id: generated.subject.toLowerCase(),
      assigned_to: kid.id,
      status: 'pending',
      why_now: generated.why_now,
      xp_reward: generated.xp_reward,
      order_index: 99,
      description: generated.description,
      steps: (generated.steps ?? []).map(s => ({ type: s.type, content: s.content })),
    })
    setGenerated(null)
    setSaving(false)
    onAdded()
  }

  const isDark = !!generated && !loading

  return (
    <div style={{ borderRadius: 16, border: `1px solid ${isDark ? C.ink : C.line}`, background: isDark ? C.ink : C.card, padding: 18, transition: 'all 300ms' }}>
      {!generated && !loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>Generate next lesson</div>
              <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 1 }}>Based on {kid.name}&apos;s recent performance</div>
            </div>
          </div>
          <Btn tone="ink" onClick={generate} style={{ width: '100%', justifyContent: 'center' }}>Generate for {kid.name} →</Btn>
        </>
      )}

      {loading && (
        <div style={{ padding: '4px 0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✦</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{applyingFeedback ? 'Applying your feedback…' : `Building lesson for ${kid.name}…`}</div>
              <div style={{ fontSize: 11, color: C.ink4, marginTop: 1 }}>{LOADING_PHASES[phase].sub}</div>
            </div>
          </div>

          {/* Progress steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LOADING_PHASES.map((p, i) => {
              const done = i < phase
              const active = i === phase
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 99, flexShrink: 0,
                    background: done ? C.ink : active ? C.lime : C.bg2,
                    border: `2px solid ${done ? C.ink : active ? 'oklch(0.72 0.14 120)' : C.line}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 400ms',
                  }}>
                    {done && <svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#F6F3EC" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    {active && <div style={{ width: 6, height: 6, borderRadius: 99, background: C.limeInk, animation: 'pulse 1s ease-in-out infinite' }} />}
                  </div>
                  <span style={{ fontSize: 12.5, color: done ? C.ink3 : active ? C.ink : C.ink4, fontWeight: active ? 600 : 400, transition: 'color 400ms' }}>{p.label}</span>
                </div>
              )
            })}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 16, height: 3, borderRadius: 99, background: C.line, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: C.lime, width: `${Math.round(((phase + 0.5) / LOADING_PHASES.length) * 100)}%`, transition: 'width 800ms ease' }} />
          </div>

          <style>{`@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .6; transform: scale(.75); } }`}</style>
        </div>
      )}

      {generated && !loading && (
        <>
          <div style={{ fontSize: 10, color: C.lime, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-body)' }}>Generated for {kid.name}</div>
          <Chip tone="lime" style={{ marginBottom: 10 }}>{generated.subject}</Chip>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, letterSpacing: '-.02em', lineHeight: 1.15, color: '#F6F3EC', marginTop: 8 }}>{generated.title}</div>
          <div style={{ fontSize: 13, color: '#BEB9AA', marginTop: 8, lineHeight: 1.5 }}>{generated.description}</div>
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ fontSize: 9.5, color: '#9B988C', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 4 }}>Why now</div>
            <div style={{ fontSize: 12.5, color: '#CCC6B4', lineHeight: 1.45 }}>{generated.why_now}</div>
          </div>

          {/* Feedback panel */}
          {feedbackOpen && (
            <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)' }}>
              <div style={{ fontSize: 11, color: C.lime, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-body)' }}>Your feedback</div>
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="e.g. Make it harder, use a different topic, add more about X…"
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.07)', color: '#F6F3EC', fontSize: 13, fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none', lineHeight: 1.5 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={applyFeedback}
                  disabled={!feedbackText.trim()}
                  style={{ flex: 1, background: C.lime, border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: C.limeInk, cursor: feedbackText.trim() ? 'pointer' : 'not-allowed', opacity: feedbackText.trim() ? 1 : 0.5, fontFamily: 'var(--font-body)' }}
                >
                  Apply feedback →
                </button>
                <button
                  onClick={() => { setFeedbackOpen(false); setFeedbackText('') }}
                  style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#BEB9AA', fontSize: 12, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button onClick={() => setPreviewOpen(true)} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#BEB9AA', fontSize: 12, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Preview</button>
            {!feedbackOpen && (
              <button onClick={() => setFeedbackOpen(true)} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#BEB9AA', fontSize: 12, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Give feedback</button>
            )}
            <Btn tone="lime" onClick={addToQueue} disabled={saving} style={{ flex: 1, justifyContent: 'center', minWidth: 120 }}>
              {saving ? 'Adding…' : '✓ Add to queue'}
            </Btn>
            <Btn tone="ghost" onClick={() => setGenerated(null)} style={{ border: '1px solid rgba(255,255,255,.15)', color: '#BEB9AA' }}>Discard</Btn>
          </div>
          {previewOpen && generated && (
            <LessonPreviewModal
              lesson={{ id: 'preview', title: generated.title, subject_id: generated.subject.toLowerCase(), description: generated.description, why_now: generated.why_now, xp_reward: generated.xp_reward, status: generated.status, assigned_to: kid.id, steps: generated.steps ?? [], order_index: 99 }}
              onClose={() => setPreviewOpen(false)}
              onApprove={() => { addToQueue(); setPreviewOpen(false) }}
              onReject={() => { setGenerated(null); setPreviewOpen(false) }}
            />
          )}
        </>
      )}
    </div>
  )
}

// ─── Topics Panel ─────────────────────────────────────────────

function TopicsPanel() {
  const { allTopics, enabledTopicIds, setEnabledTopicIds, addCustomTopic, removeCustomTopic } = useAppData()
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')

  function toggle(id: string) {
    if (enabledTopicIds.includes(id)) {
      if (enabledTopicIds.length <= 1) return // keep at least one
      setEnabledTopicIds(enabledTopicIds.filter(t => t !== id))
    } else {
      setEnabledTopicIds([...enabledTopicIds, id])
    }
  }

  function handleAdd() {
    const label = newLabel.trim()
    if (!label) return
    addCustomTopic(label)
    setNewLabel('')
    setAdding(false)
  }

  const defaultIds = new Set(SUBJECTS.map(s => s.id))
  const customTopics = allTopics.filter(t => !defaultIds.has(t.id))

  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: '18px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Lesson topics</div>
          <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{enabledTopicIds.length} of {allTopics.length} active · AI picks from these when generating lessons</div>
        </div>
        <button
          onClick={() => { setAdding(a => !a); setNewLabel('') }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.line}`, background: adding ? C.bg2 : 'transparent', color: C.ink2, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
        >
          {adding ? '✕ Cancel' : '+ Add topic'}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {allTopics.map(topic => {
          const enabled = enabledTopicIds.includes(topic.id)
          const isCustom = !defaultIds.has(topic.id)
          return (
            <div
              key={topic.id}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', userSelect: 'none',
                background: enabled ? C.ink : C.bg2,
                color: enabled ? '#F6F3EC' : C.ink3,
                border: `1px solid ${enabled ? C.ink : C.line}`,
                transition: 'all 150ms',
                opacity: enabled ? 1 : 0.6,
              }}
              onClick={() => toggle(topic.id)}
            >
              {enabled && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#F6F3EC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {topic.label}
              {isCustom && enabled && (
                <span
                  onClick={e => { e.stopPropagation(); removeCustomTopic(topic.id) }}
                  style={{ marginLeft: 2, fontSize: 11, opacity: 0.7, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                  title="Remove topic"
                >✕</span>
              )}
              {isCustom && !enabled && (
                <span
                  onClick={e => { e.stopPropagation(); removeCustomTopic(topic.id) }}
                  style={{ marginLeft: 2, fontSize: 11, opacity: 0.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                  title="Remove topic"
                >✕</span>
              )}
            </div>
          )
        })}
      </div>

      {adding && (
        <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            autoFocus
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewLabel('') } }}
            placeholder="e.g. Logic, Astronomy, Chess…"
            style={{ flex: 1, padding: '9px 13px', borderRadius: 10, border: `1px solid ${C.line}`, background: C.bg, fontSize: 13.5, color: C.ink, fontFamily: 'var(--font-body)', outline: 'none' }}
          />
          <button
            onClick={handleAdd}
            disabled={!newLabel.trim()}
            style={{ padding: '9px 16px', borderRadius: 10, background: newLabel.trim() ? C.ink : C.bg2, color: newLabel.trim() ? '#F6F3EC' : C.ink4, border: 'none', fontSize: 13, fontWeight: 600, cursor: newLabel.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)' }}
          >
            Add
          </button>
        </div>
      )}

      {customTopics.length === 0 && !adding && (
        <div style={{ marginTop: 10, fontSize: 12, color: C.ink4 }}>
          Click a topic to toggle it on or off. Add custom topics with the button above.
        </div>
      )}
    </div>
  )
}

// ─── Kid Column ───────────────────────────────────────────────

function KidColumn({ kid, onRefresh }: { kid: Profile; onRefresh: () => void }) {
  const { getLessons, getProgress, approveLesson, deleteLesson } = useAppData()
  const [preview, setPreview] = useState<StoredLesson | null>(null)

  const progress = getProgress(kid.id)
  const lessons = getLessons(kid.id, ['pending', 'approved'])
  const pending = lessons.filter(l => l.status === 'pending').length
  const approved = lessons.filter(l => l.status === 'approved').length
  const lowQueue = approved <= 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar color={kid.avatar_color} initial={kid.name[0]?.toUpperCase() ?? '?'} size={48} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.01em', color: C.ink }}>{kid.name}</div>
            <div style={{ fontSize: 12, color: C.ink3 }}>age {kid.age} · Level {progress?.level ?? 1}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {(progress?.streak_days ?? 0) > 0 && <Chip tone="amber">🔥 {progress?.streak_days}-day streak</Chip>}
            <Chip tone={pending > 0 ? 'violet' : 'ghost'}>{pending} pending</Chip>
            <Chip tone="lime">{approved} approved</Chip>
          </div>
        </div>
      </div>

      {lowQueue && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'oklch(0.96 0.04 80)', border: '1px solid oklch(0.88 0.08 65)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 13, color: 'oklch(0.38 0.12 65)' }}>
            {approved === 0 ? `${kid.name} has no approved lessons — generate and approve one below.` : `Only 1 lesson left for ${kid.name} — generate more soon.`}
          </span>
        </div>
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>Lesson queue</div>
          <div style={{ fontSize: 10.5, color: C.ink4, letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>{lessons.length} lessons</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onApprove={() => { approveLesson(lesson.id); onRefresh() }}
              onReject={() => { deleteLesson(lesson.id); onRefresh() }}
              onPreview={() => setPreview(lesson)}
            />
          ))}
          {lessons.length === 0 && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: C.ink3, fontSize: 13, background: C.card, borderRadius: 14, border: `1px solid ${C.line}` }}>
              No lessons in queue. Generate one below.
            </div>
          )}
        </div>
      </div>

      <GenerateCard kid={kid} onAdded={onRefresh} />

      {preview && (
        <LessonPreviewModal
          lesson={preview}
          onClose={() => setPreview(null)}
          onApprove={() => { approveLesson(preview.id); setPreview(null); onRefresh() }}
          onReject={() => { deleteLesson(preview.id); setPreview(null); onRefresh() }}
        />
      )}
    </div>
  )
}

// ─── Completed Lessons ────────────────────────────────────────

const FUN_EMOJI: Record<number, string> = { 1: '😐', 2: '🙂', 3: '😄', 4: '🤩' }
const DIFFICULTY_LABEL: Record<string, string> = { too_easy: 'Too easy', just_right: 'Just right', a_bit_hard: 'A bit hard', too_hard: 'Really hard' }
const LEARNED_LABEL: Record<string, string> = { yes_lots: 'Learnt loads!', a_bit: 'A little', already_knew: 'Already knew it' }

function CompletedLessons({ sessions, kids }: { sessions: StoredSession[]; kids: Profile[] }) {
  const { getLessonById } = useAppData()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterKid, setFilterKid] = useState<string>('all')
  const [showAll, setShowAll] = useState(false)

  const sorted = [...sessions].sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
  const filtered = (filterKid === 'all' ? sorted : sorted.filter(s => s.kid_id === filterKid))
  const visible = showAll ? filtered : filtered.slice(0, 6)
  const hiddenCount = filtered.length - 6

  const RESULT_COLORS = { correct: 'oklch(0.93 0.06 140)', wrong: 'oklch(0.95 0.04 20)', partial: 'oklch(0.95 0.04 60)' }
  const RESULT_FG = { correct: 'oklch(0.35 0.12 140)', wrong: 'oklch(0.45 0.12 20)', partial: 'oklch(0.42 0.12 60)' }

  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>Completed lessons</div>
          <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{sessions.length} lessons · notes, scores & feedback</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setFilterKid('all')} style={{ padding: '6px 13px', borderRadius: 99, fontSize: 12.5, fontWeight: 500, background: filterKid === 'all' ? C.ink : 'transparent', color: filterKid === 'all' ? '#F6F3EC' : C.ink2, border: `1px solid ${filterKid === 'all' ? C.ink : C.line}`, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Both
          </button>
          {kids.map(k => (
            <button key={k.id} onClick={() => setFilterKid(k.id)} style={{ padding: '6px 13px', borderRadius: 99, fontSize: 12.5, fontWeight: 500, background: filterKid === k.id ? C.ink : 'transparent', color: filterKid === k.id ? '#F6F3EC' : C.ink2, border: `1px solid ${filterKid === k.id ? C.ink : C.line}`, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              {k.name}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '40px 22px', textAlign: 'center', color: C.ink3, fontSize: 13 }}>No completed lessons yet.</div>
      ) : (
        visible.map((s, i) => {
          const isOpen = expanded === s.id
          const lesson = getLessonById(s.lesson_id)
          const subjectLabel = lesson ? (SUBJECTS.find(sub => sub.id === lesson.subject_id)?.label ?? lesson.subject_id) : '—'
          const correct = s.responses?.filter(r => r.is_correct).length ?? 0
          const total = s.responses?.length ?? 0
          const pct = total > 0 ? Math.round(correct / total * 100) : 0
          const scoreColor = pct >= 80 ? 'oklch(0.65 0.14 140)' : pct >= 60 ? 'oklch(0.65 0.14 60)' : C.rose
          const fb = s.feedback ?? null
          const kidProfile = kids.find(k => k.id === s.kid_id)
          const mins = s.time_spent_seconds ? Math.ceil(s.time_spent_seconds / 60) : '?'
          const date = s.completed_at ? new Date(s.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

          return (
            <div key={s.id} style={{ borderTop: i ? `1px solid ${C.line}` : 'none' }}>
              <div onClick={() => setExpanded(isOpen ? null : s.id)} style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', alignItems: 'center', gap: 16, cursor: 'pointer', background: isOpen ? '#FFFDF8' : 'transparent' }}>
                {kidProfile
                  ? <Avatar color={kidProfile.avatar_color} initial={kidProfile.name[0]?.toUpperCase() ?? '?'} size={34} />
                  : <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.bg2 }} />
                }
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{lesson?.title ?? 'Unknown lesson'}</span>
                    {subjectLabel && <Chip>{subjectLabel}</Chip>}
                  </div>
                  <div style={{ fontSize: 12, color: C.ink3, marginTop: 3 }}>{kidProfile?.name ?? '—'} · {date} · {mins} min</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 56 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: scoreColor, fontFamily: 'var(--font-serif)' }}>{pct}%</div>
                  <div style={{ fontSize: 9.5, color: C.ink4, letterSpacing: '.1em' }}>{correct}/{total}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 56 }}>
                  <div style={{ fontSize: 20 }}>{fb?.fun_rating ? FUN_EMOJI[fb.fun_rating] : '—'}</div>
                  <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 2 }}>{DIFFICULTY_LABEL[fb?.difficulty ?? ''] ?? '—'}</div>
                </div>
                <span style={{ color: C.ink3, fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s', display: 'inline-block' }}>▾</span>
              </div>

              {isOpen && (
                <div style={{ padding: '0 22px 22px', borderTop: `1px solid ${C.line}`, background: '#FFFDF8' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginTop: 18 }}>
                    <div>
                      <div style={{ fontSize: 10, color: C.ink4, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 10 }}>Step-by-step results</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(s.responses ?? []).map((r, j) => {
                          const result = r.is_correct === true ? 'correct' : r.is_correct === false ? 'wrong' : 'partial'
                          const matchedStep = lesson?.steps.find(st => st.id === r.step_id)
                          const isWritten = matchedStep?.type === 'Written answer'
                          const isSocratic = matchedStep?.type === 'Socratic'
                          const writtenData = isWritten && r.answer && typeof r.answer === 'object' && r.answer !== null ? r.answer as { text?: string; corrections?: string[] } : null
                          const writtenText = writtenData?.text ?? (isWritten || isSocratic ? (typeof r.answer === 'string' ? r.answer : null) : null)
                          const corrections = writtenData?.corrections ?? []
                          const stepQuestion = matchedStep?.content?.question as string | undefined

                          return (
                            <div key={j} style={{ borderRadius: 12, border: `1px solid ${C.line}`, overflow: 'hidden', background: C.bg }}>
                              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, background: RESULT_COLORS[result as keyof typeof RESULT_COLORS] ?? C.bg }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: RESULT_FG[result as keyof typeof RESULT_FG] ?? C.ink3, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{result}</div>
                                <div style={{ fontSize: 12, fontWeight: 500, color: C.ink, flex: 1 }}>
                                  {matchedStep ? matchedStep.type : `Step ${j + 1}`}
                                </div>
                              </div>
                              {(isWritten || isSocratic) && writtenText && (
                                <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.line}` }}>
                                  {stepQuestion && <p style={{ margin: '0 0 6px', fontSize: 11, color: C.ink4, fontStyle: 'italic' }}>{stepQuestion}</p>}
                                  <p style={{ margin: 0, fontSize: 13, color: C.ink2, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{writtenText}</p>
                                  {corrections.length > 0 && (
                                    <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'oklch(0.97 0.02 60)', border: '1px solid oklch(0.88 0.08 65)' }}>
                                      <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 600, color: 'oklch(0.42 0.12 60)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Writing tips ✏️</p>
                                      {corrections.map((c, k) => (
                                        <p key={k} style={{ margin: k === 0 ? 0 : '3px 0 0', fontSize: 12, color: 'oklch(0.38 0.10 60)' }}>{c}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {fb && (
                        <div>
                          <div style={{ fontSize: 10, color: C.ink4, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 8 }}>Kid&apos;s feedback</div>
                          <div style={{ background: '#FFF', borderRadius: 12, border: `1px solid ${C.line}`, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {fb.fun_rating && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ color: C.ink3 }}>Fun?</span><span style={{ fontWeight: 500, color: C.ink }}>{FUN_EMOJI[fb.fun_rating]} {fb.fun_rating}/4</span></div>}
                            {fb.learned_something && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ color: C.ink3 }}>Learnt?</span><span style={{ fontWeight: 500, color: C.ink }}>{LEARNED_LABEL[fb.learned_something] ?? fb.learned_something}</span></div>}
                            {fb.difficulty && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ color: C.ink3 }}>Difficulty</span><span style={{ fontWeight: 500, color: C.ink }}>{DIFFICULTY_LABEL[fb.difficulty] ?? fb.difficulty}</span></div>}
                          </div>
                        </div>
                      )}
                      <div style={{ padding: '10px 14px', borderRadius: 12, background: '#FFF', border: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: C.ink3 }}>Time in lesson</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{mins} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
      {!showAll && hiddenCount > 0 && (
        <div style={{ padding: '16px 22px', borderTop: `1px solid ${C.line}`, textAlign: 'center' }}>
          <button onClick={() => setShowAll(true)} style={{ fontSize: 13, fontWeight: 500, color: C.ink2, background: 'transparent', border: `1px solid ${C.line}`, borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Show all ({hiddenCount} more)
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Struggle Panel ───────────────────────────────────────────

function StrugglePanel({ sessions, kids }: { sessions: StoredSession[]; kids: Profile[] }) {
  const { getLessonById } = useAppData()

  const struggles = sessions
    .filter(s => {
      const correct = s.responses?.filter(r => r.is_correct).length ?? 0
      const total = s.responses?.length ?? 1
      return total > 0 && correct / total < 0.7
    })
    .slice(0, 4)
    .map(s => {
      const lesson = getLessonById(s.lesson_id)
      const kid = kids.find(k => k.id === s.kid_id)
      const subjectLabel = lesson ? (SUBJECTS.find(sub => sub.id === lesson.subject_id)?.label ?? lesson.subject_id) : '—'
      return {
        kid,
        subject: subjectLabel,
        title: lesson?.title ?? 'Unknown',
        score: s.responses?.length ? Math.round((s.responses.filter(r => r.is_correct).length / s.responses.length) * 100) : 0,
      }
    })

  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Where they struggled</div>
      <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>Lessons above are adjusted for these.</div>
      {struggles.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: C.ink3, fontSize: 13 }}>No struggles yet — keep learning!</div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {struggles.map((it, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 14, background: '#FFFDF8', border: `1px solid ${C.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {it.kid && <Avatar color={it.kid.avatar_color} initial={it.kid.name[0]?.toUpperCase() ?? '?'} size={24} />}
                <Chip>{it.subject}</Chip>
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: C.rose }}>{it.score}%</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 8, color: C.ink }}>{it.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Dinner prompts ───────────────────────────────────────────

function ConversationPanel({ sessions, kids }: { sessions: StoredSession[]; kids: Profile[] }) {
  const { getLessonById } = useAppData()

  const prompts = sessions
    .slice(0, 10)
    .flatMap(s => {
      const lesson = getLessonById(s.lesson_id)
      if (!lesson) return []
      const kid = kids.find(k => k.id === s.kid_id)
      const subjectLabel = SUBJECTS.find(sub => sub.id === lesson.subject_id)?.label ?? lesson.subject_id
      return lesson.steps
        .filter(step => step.type === 'Socratic')
        .map(step => ({
          kidName: kid?.name ?? '—',
          subject: subjectLabel,
          q: String(step.content.question ?? ''),
        }))
    })
    .slice(0, 3)

  if (prompts.length === 0) return null

  return (
    <div style={{ background: C.ink, borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✦</div>
        <div>
          <div style={{ fontSize: 10, color: C.lime, letterSpacing: '.18em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Tonight</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#F6F3EC' }}>Dinner prompts</div>
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {prompts.map((p, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 9.5, color: C.lime, letterSpacing: '.14em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>{p.kidName}</span>
              <span style={{ fontSize: 11, color: '#9B988C' }}>· {p.subject}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: '#F6F3EC', lineHeight: 1.3 }}>{p.q}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Parent Page ─────────────────────────────────────────

export default function ParentPage() {
  const router = useRouter()
  const { kids, getCompletedSessions, ready } = useAppData()
  const [showAddChild, setShowAddChild] = useState(false)
  const [, forceRender] = useState(0)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  const completedSessions = getCompletedSessions()

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E2DDCF', borderTopColor: C.ink, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.ink }}>

      <div style={{ borderBottom: `1px solid ${C.line}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFDF8', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={22} />
          <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Curio <span style={{ color: C.ink3, fontWeight: 400 }}>/ Parents</span></span>
          <span style={{ fontSize: 10.5, color: C.ink4, letterSpacing: '.15em', textTransform: 'uppercase', marginLeft: 10 }}>{today}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Btn tone="ghost" size="sm" onClick={() => setShowAddChild(true)}>+ Add child</Btn>
          <button onClick={() => router.push('/')} style={{ background: 'transparent', border: `1px solid ${C.line}`, fontSize: 12, color: C.ink3, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Kids view</button>
        </div>
      </div>

      {kids.length === 0 ? (
        <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: C.ink, marginBottom: 10 }}>Welcome to Curio</div>
          <div style={{ fontSize: 15, color: C.ink3, lineHeight: 1.6, marginBottom: 28 }}>Add your first child to get started. You&apos;ll be able to generate and approve lessons for them right here.</div>
          <Btn tone="ink" onClick={() => setShowAddChild(true)} style={{ fontSize: 15, padding: '12px 28px' }}>Add your first child →</Btn>
        </div>
      ) : (
        <div style={{ padding: '32px 28px 56px', display: 'grid', gridTemplateColumns: kids.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: 20, maxWidth: 1280, margin: '0 auto' }}>

          <div style={{ gridColumn: '1 / -1' }}>
            <TopicsPanel />
          </div>

          {kids.map(kid => (
            <KidColumn key={kid.id} kid={kid} onRefresh={() => forceRender(n => n + 1)} />
          ))}

          {completedSessions.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <CompletedLessons sessions={completedSessions} kids={kids} />
            </div>
          )}

          {(completedSessions.length > 0) && (
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
              <ConversationPanel sessions={completedSessions} kids={kids} />
              <StrugglePanel sessions={completedSessions} kids={kids} />
            </div>
          )}
        </div>
      )}

      {showAddChild && <AddChildModal onClose={() => setShowAddChild(false)} />}
    </div>
  )
}
