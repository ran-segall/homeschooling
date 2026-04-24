'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── Design tokens ────────────────────────────────────────────
const C = {
  bg: '#F6F3EC', bg2: '#EFEBE0', ink: '#16140F', ink2: '#3A3830',
  ink3: '#6B685E', ink4: '#9B988C', line: '#E2DDCF', card: '#FFFFFF',
  lime: 'oklch(0.86 0.17 120)', limeInk: 'oklch(0.28 0.08 125)',
  violet: 'oklch(0.62 0.18 295)', amber: 'oklch(0.78 0.16 60)',
  rose: 'oklch(0.78 0.12 20)',
}

const KID_IDS = {
  reef: '00000000-0000-0000-0000-000000000001',
  tommy: '00000000-0000-0000-0000-000000000002',
}

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

function Avatar({ kid, size = 36 }: { kid: 'reef' | 'tommy'; size?: number }) {
  const color = kid === 'reef' ? '#4F7942' : '#3B5FA0'
  const letter = kid === 'reef' ? 'R' : 'T'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'var(--font-body)' }}>
      {letter}
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

// ─── Lesson Preview Modal ─────────────────────────────────────

type StepContent = Record<string, unknown>
type PreviewStep = { type: string; step_order?: number; content: StepContent }
type LessonRow = { id: string; title: string; subject_id?: string; subject?: { label: string }; description?: string; why_now?: string | null; xp_reward?: number; status: string; steps?: PreviewStep[] }

const STEP_BG: Record<string, { bg: string; fg: string }> = {
  'Read':           { bg: '#F0EDE4',                    fg: C.ink3 },
  'Multiple choice':{ bg: 'oklch(0.92 0.04 295)',       fg: 'oklch(0.42 0.14 295)' },
  'Drag to order':  { bg: 'oklch(0.93 0.04 40)',        fg: 'oklch(0.42 0.12 50)'  },
  'Drag to match':  { bg: 'oklch(0.93 0.04 40)',        fg: 'oklch(0.42 0.12 50)'  },
  'Interactive':    { bg: 'oklch(0.92 0.06 180)',       fg: 'oklch(0.35 0.10 185)' },
  'Written answer': { bg: 'oklch(0.95 0.025 295)',      fg: 'oklch(0.42 0.14 295)' },
  'Socratic':       { bg: 'oklch(0.93 0.05 120)',       fg: 'oklch(0.32 0.10 125)' },
}

function LessonPreviewModal({ lesson, onClose, onApprove, onReject }: { lesson: LessonRow; onClose: () => void; onApprove: () => void; onReject: () => void }) {
  const [steps, setSteps] = useState<PreviewStep[]>(lesson.steps ?? [])
  const [loadingSteps, setLoadingSteps] = useState(!lesson.steps)
  const isApproved = lesson.status === 'approved'
  const subjectLabel = lesson.subject?.label ?? lesson.subject_id ?? ''

  useEffect(() => {
    if (lesson.steps) return
    supabase.from('lesson_steps').select('*').eq('lesson_id', lesson.id).order('step_order')
      .then(({ data }) => { if (data) setSteps(data as PreviewStep[]); setLoadingSteps(false) })
  }, [lesson.id, lesson.steps])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(22,20,15,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 660, maxHeight: '88vh', background: C.bg, borderRadius: 24, boxShadow: '0 32px 80px rgba(0,0,0,.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
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

        {/* Steps */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {loadingSteps ? (
            <div style={{ textAlign: 'center', color: C.ink3, fontSize: 13, padding: '32px 0' }}>Loading lesson…</div>
          ) : steps.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.ink3, fontSize: 13, padding: '32px 0' }}>Preview not available for this lesson yet.</div>
          ) : (
            <>
              <div style={{ fontSize: 10.5, color: C.ink4, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 14, fontFamily: 'var(--font-body)' }}>{steps.length} steps · lesson content</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {steps.map((step, i) => {
                  const tone = STEP_BG[step.type] ?? STEP_BG['Read']
                  const c = step.content
                  return (
                    <div key={i} style={{ background: '#FFF', borderRadius: 16, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
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

        {/* Footer */}
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

function LessonCard({ lesson, onApprove, onReject, onPreview }: { lesson: LessonRow; onApprove: () => void; onReject: () => void; onPreview: () => void }) {
  const [open, setOpen] = useState(false)
  const isApproved = lesson.status === 'approved'
  const subjectLabel = lesson.subject?.label ?? lesson.subject_id ?? ''
  const subColors = SUBJECT_COLORS[subjectLabel] ?? { bg: C.bg2, fg: C.ink3 }

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${isApproved ? 'oklch(0.82 0.12 140)' : C.line}`, background: isApproved ? 'oklch(0.97 0.02 140)' : C.card, overflow: 'hidden' }}>
      {/* Header */}
      <div onClick={() => setOpen(o => !o)} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: subColors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
          {subjectLabel === 'Philosophy' ? '💭' : subjectLabel === 'Geography' ? '🌍' : subjectLabel === 'Writing' ? '✍️' : subjectLabel === 'Money' ? '💰' : subjectLabel === 'Tech' ? '💻' : subjectLabel === 'History' ? '📜' : subjectLabel === 'Science' ? '🔬' : '🎨'}
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

      {/* Expanded */}
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

// ─── Generated lesson card ────────────────────────────────────

type GeneratedLesson = { id: string; subject: string; title: string; description: string; why_now: string; xp_reward: number; steps: PreviewStep[]; status: string; assigned_to: string }

function GenerateCard({ kidId, kidName, onAdded }: { kidId: string; kidName: string; onAdded: () => void }) {
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<GeneratedLesson | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  async function generate() {
    setLoading(true)
    setGenerated(null)
    const res = await fetch('/api/lessons/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kidId, kidName, kidAge: kidName === 'Reef' ? 9 : 11 }) })
    const data = await res.json()
    if (data.lesson) setGenerated(data.lesson)
    setLoading(false)
  }

  async function addToQueue() {
    if (!generated) return
    setSaving(true)
    const lessonId = `gen-${Date.now()}`
    await supabase.from('lessons').insert({ id: lessonId, title: generated.title, subject_id: generated.subject.toLowerCase(), assigned_to: kidId, status: 'pending', why_now: generated.why_now, xp_reward: generated.xp_reward, order_index: 99 })
    if (generated.steps?.length) {
      await supabase.from('lesson_steps').insert(generated.steps.map((s, i) => ({ lesson_id: lessonId, step_order: i + 1, type: s.type, content: s.content })))
    }
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
              <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 1 }}>Based on {kidName}&apos;s recent performance</div>
            </div>
          </div>
          <Btn tone="ink" onClick={generate} style={{ width: '100%', justifyContent: 'center' }}>Generate for {kidName} →</Btn>
        </>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: 99, background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✦</div>
          <div style={{ fontSize: 13, color: C.ink, textAlign: 'center' }}>Analysing {kidName}&apos;s performance…</div>
          <div style={{ fontSize: 10.5, color: C.ink3, letterSpacing: '.12em' }}>building personalised lesson</div>
        </div>
      )}

      {generated && !loading && (
        <>
          <div style={{ fontSize: 10, color: C.lime, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-body)' }}>Generated for {kidName}</div>
          <Chip tone="lime" style={{ marginBottom: 10 }}>{generated.subject}</Chip>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, letterSpacing: '-.02em', lineHeight: 1.15, color: '#F6F3EC', marginTop: 8 }}>{generated.title}</div>
          <div style={{ fontSize: 13, color: '#BEB9AA', marginTop: 8, lineHeight: 1.5 }}>{generated.description}</div>
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ fontSize: 9.5, color: '#9B988C', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 4 }}>Why now</div>
            <div style={{ fontSize: 12.5, color: '#CCC6B4', lineHeight: 1.45 }}>{generated.why_now}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => setPreviewOpen(true)} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#BEB9AA', fontSize: 12, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Preview</button>
            <Btn tone="lime" onClick={addToQueue} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
              {saving ? 'Adding…' : '✓ Add to queue'}
            </Btn>
            <Btn tone="ghost" onClick={() => setGenerated(null)} style={{ border: '1px solid rgba(255,255,255,.15)', color: '#BEB9AA' }}>Discard</Btn>
          </div>
          {previewOpen && (
            <LessonPreviewModal
              lesson={{ ...generated, subject: { label: generated.subject } } as unknown as LessonRow}
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

// ─── Kid column ───────────────────────────────────────────────

function KidColumn({ kid, progress, lessons, onApprove, onReject, onRefresh }: {
  kid: 'reef' | 'tommy'
  progress: { xp: number; level: number; streak_days: number } | null
  lessons: LessonRow[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onRefresh: () => void
}) {
  const [preview, setPreview] = useState<LessonRow | null>(null)
  const name = kid === 'reef' ? 'Reef' : 'Tommy'
  const age = kid === 'reef' ? 9 : 11
  const pending = lessons.filter(l => l.status === 'pending').length
  const approved = lessons.filter(l => l.status === 'approved').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Kid header */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar kid={kid} size={48} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.01em', color: C.ink }}>{name}</div>
            <div style={{ fontSize: 12, color: C.ink3 }}>age {age} · Level {progress?.level ?? 1}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {(progress?.streak_days ?? 0) > 0 && <Chip tone="amber">🔥 {progress?.streak_days}-day streak</Chip>}
            <Chip tone={pending > 0 ? 'violet' : 'ghost'}>{pending} pending</Chip>
            <Chip tone="lime">{approved} approved</Chip>
          </div>
        </div>
      </div>

      {/* Lesson queue */}
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
              onApprove={() => onApprove(lesson.id)}
              onReject={() => onReject(lesson.id)}
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

      {/* Generate */}
      <GenerateCard kidId={KID_IDS[kid]} kidName={name} onAdded={onRefresh} />

      {preview && (
        <LessonPreviewModal
          lesson={preview}
          onClose={() => setPreview(null)}
          onApprove={() => { onApprove(preview.id); setPreview(null) }}
          onReject={() => { onReject(preview.id); setPreview(null) }}
        />
      )}
    </div>
  )
}

// ─── Completed Lessons ────────────────────────────────────────

type SessionRow = {
  id: string; lesson_id: string; kid_id: string; completed_at: string; time_spent_seconds: number | null
  lesson?: { id: string; title: string; subject_id?: string; subject?: { label: string } } | null
  feedback?: { fun_rating?: number; learned_something?: string; difficulty?: string }[]
  responses?: { is_correct: boolean | null }[]
}

function CompletedLessons({ sessions }: { sessions: SessionRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'reef' | 'tommy'>('all')

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.kid_id === KID_IDS[filter])

  const FUN_EMOJI: Record<number, string> = { 1: '😐', 2: '🙂', 3: '😄', 4: '🤩' }
  const DIFFICULTY_LABEL: Record<string, string> = { too_easy: 'Too easy', just_right: 'Just right', too_hard: 'Hard' }
  const LEARNED_LABEL: Record<string, string> = { yes_lots: 'Learnt loads!', a_bit: 'A little', already_knew: 'Already knew it' }
  const RESULT_COLORS = { correct: 'oklch(0.93 0.06 140)', wrong: 'oklch(0.95 0.04 20)', partial: 'oklch(0.95 0.04 60)', strong: 'oklch(0.93 0.05 295)' }
  const RESULT_FG = { correct: 'oklch(0.35 0.12 140)', wrong: 'oklch(0.45 0.12 20)', partial: 'oklch(0.42 0.12 60)', strong: 'oklch(0.42 0.14 295)' }

  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>Completed lessons</div>
          <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{sessions.length} lessons · notes, scores & feedback</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'reef', 'tommy'] as const).map(k => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '6px 13px', borderRadius: 99, fontSize: 12.5, fontWeight: 500, background: filter === k ? C.ink : 'transparent', color: filter === k ? '#F6F3EC' : C.ink2, border: `1px solid ${filter === k ? C.ink : C.line}`, cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'var(--font-body)' }}>
              {k === 'all' ? 'Both' : k === 'reef' ? 'Reef' : 'Tommy'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '40px 22px', textAlign: 'center', color: C.ink3, fontSize: 13 }}>No completed lessons yet.</div>
      ) : (
        filtered.map((s, i) => {
          const isOpen = expanded === s.id
          const correct = s.responses?.filter(r => r.is_correct).length ?? 0
          const total = s.responses?.length ?? 0
          const pct = total > 0 ? Math.round(correct / total * 100) : 0
          const scoreColor = pct >= 80 ? 'oklch(0.65 0.14 140)' : pct >= 60 ? 'oklch(0.65 0.14 60)' : C.rose
          const fb = s.feedback?.[0]
          const kidKey = s.kid_id === KID_IDS.reef ? 'reef' : 'tommy'
          const mins = s.time_spent_seconds ? Math.ceil(s.time_spent_seconds / 60) : '?'
          const date = new Date(s.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

          return (
            <div key={s.id} style={{ borderTop: i ? `1px solid ${C.line}` : 'none' }}>
              <div onClick={() => setExpanded(isOpen ? null : s.id)} style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', alignItems: 'center', gap: 16, cursor: 'pointer', background: isOpen ? '#FFFDF8' : 'transparent' }}>
                <Avatar kid={kidKey} size={34} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{s.lesson?.title ?? 'Unknown lesson'}</span>
                    {s.lesson?.subject && <Chip>{s.lesson.subject.label}</Chip>}
                  </div>
                  <div style={{ fontSize: 12, color: C.ink3, marginTop: 3 }}>{kidKey === 'reef' ? 'Reef' : 'Tommy'} · {date} · {mins} min</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 56 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: scoreColor, fontFamily: 'var(--font-serif)' }}>{pct}%</div>
                  <div style={{ fontSize: 9.5, color: C.ink4, letterSpacing: '.1em' }}>{correct}/{total}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 56 }}>
                  <div style={{ fontSize: 20 }}>{FUN_EMOJI[fb?.fun_rating ?? 0] ?? '—'}</div>
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
                          return (
                            <div key={j} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 12, background: RESULT_COLORS[result as keyof typeof RESULT_COLORS] ?? C.bg }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: RESULT_FG[result as keyof typeof RESULT_FG] ?? C.ink3, textTransform: 'capitalize', whiteSpace: 'nowrap', marginTop: 1 }}>{result}</div>
                              <div style={{ fontSize: 12, fontWeight: 500, color: C.ink }}>{`Step ${j + 1}`}</div>
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
    </div>
  )
}

// ─── Dinner prompts ───────────────────────────────────────────

const DINNER_PROMPTS = [
  { kid: 'Both',  subject: 'Philosophy', q: 'If we replaced every part of our car over time — would it still be our car?',             meta: 'From today\'s lesson' },
  { kid: 'Tommy', subject: 'Money',      q: 'If you save money and it earns interest each year, why do you end up with way more than you saved?', meta: 'Tommy got stuck here' },
  { kid: 'Reef',  subject: 'Geography',  q: 'Why do maps always lie a little — and which lie is the most useful?',                     meta: 'Helps unlock next lesson' },
]

function ConversationPanel() {
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
        {DINNER_PROMPTS.map((p, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 9.5, color: C.lime, letterSpacing: '.14em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>{p.kid}</span>
              <span style={{ fontSize: 11, color: '#9B988C' }}>· {p.subject}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: '#F6F3EC', lineHeight: 1.3 }}>{p.q}</div>
            <div style={{ fontSize: 11, color: '#7A7770', marginTop: 6 }}>{p.meta}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Struggle panel ───────────────────────────────────────────

function StrugglePanel({ sessions }: { sessions: SessionRow[] }) {
  const struggles = sessions
    .filter(s => {
      const correct = s.responses?.filter(r => r.is_correct).length ?? 0
      const total = s.responses?.length ?? 1
      return correct / total < 0.7
    })
    .slice(0, 4)
    .map(s => ({
      kid: s.kid_id === KID_IDS.reef ? 'reef' : 'tommy' as 'reef' | 'tommy',
      subject: s.lesson?.subject?.label ?? 'Unknown',
      title: s.lesson?.title ?? 'Unknown',
      score: s.responses?.length ? Math.round((s.responses.filter(r => r.is_correct).length / s.responses.length) * 100) : 0,
    }))

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
                <Avatar kid={it.kid} size={24} />
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

// ─── Main Parent Page ─────────────────────────────────────────

export default function ParentPage() {
  const router = useRouter()
  const [reefLessons, setReefLessons] = useState<LessonRow[]>([])
  const [tommyLessons, setTommyLessons] = useState<LessonRow[]>([])
  const [reefProgress, setReefProgress] = useState<{ xp: number; level: number; streak_days: number } | null>(null)
  const [tommyProgress, setTommyProgress] = useState<{ xp: number; level: number; streak_days: number } | null>(null)
  const [completedSessions, setCompletedSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  const load = useCallback(async () => {
    try {
      // Simple, flat queries first — avoids nested join failures
      const [reefRes, tommyRes, reefProg, tommyProg] = await Promise.all([
        supabase.from('lessons').select('*, subject:subjects(*)').eq('assigned_to', KID_IDS.reef).in('status', ['pending', 'approved']).order('order_index'),
        supabase.from('lessons').select('*, subject:subjects(*)').eq('assigned_to', KID_IDS.tommy).in('status', ['pending', 'approved']).order('order_index'),
        supabase.from('kid_progress').select('*').eq('kid_id', KID_IDS.reef).single(),
        supabase.from('kid_progress').select('*').eq('kid_id', KID_IDS.tommy).single(),
      ])

      if (reefRes.data) setReefLessons(reefRes.data as LessonRow[])
      if (tommyRes.data) setTommyLessons(tommyRes.data as LessonRow[])
      if (reefProg.data) setReefProgress(reefProg.data as { xp: number; level: number; streak_days: number })
      if (tommyProg.data) setTommyProgress(tommyProg.data as { xp: number; level: number; streak_days: number })

      // Fetch completed sessions separately (shallow — no nested step responses)
      const { data: sessions } = await supabase
        .from('lesson_sessions')
        .select('*, lesson:lessons(id, title, subject_id, subject:subjects(label)), feedback:lesson_feedback(*), responses:step_responses(is_correct)')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(20)

      if (sessions) setCompletedSessions(sessions as SessionRow[])
    } catch (err) {
      console.error('Parent dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function approve(lessonId: string) {
    await supabase.from('lessons').update({ status: 'approved' }).eq('id', lessonId)
    load()
  }

  async function reject(lessonId: string) {
    await supabase.from('lessons').delete().eq('id', lessonId)
    load()
  }

  const totalPending = reefLessons.filter(l => l.status === 'pending').length + tommyLessons.filter(l => l.status === 'pending').length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E2DDCF', borderTopColor: C.ink, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.ink }}>

      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${C.line}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFDF8', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={22} />
          <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Curio <span style={{ color: C.ink3, fontWeight: 400 }}>/ Parents</span></span>
          <span style={{ fontSize: 10.5, color: C.ink4, letterSpacing: '.15em', textTransform: 'uppercase', marginLeft: 10 }}>{today}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {totalPending > 0 && (
            <span style={{ fontSize: 10.5, color: C.ink4, letterSpacing: '.1em' }}>{totalPending} lesson{totalPending !== 1 ? 's' : ''} awaiting review</span>
          )}
          <button onClick={() => router.push('/')} style={{ background: 'transparent', border: `1px solid ${C.line}`, fontSize: 12, color: C.ink3, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Kids view</button>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ padding: '32px 28px 56px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 1280, margin: '0 auto' }}>

        <KidColumn kid="reef" progress={reefProgress} lessons={reefLessons} onApprove={approve} onReject={reject} onRefresh={load} />
        <KidColumn kid="tommy" progress={tommyProgress} lessons={tommyLessons} onApprove={approve} onReject={reject} onRefresh={load} />

        <div style={{ gridColumn: '1 / -1' }}>
          <CompletedLessons sessions={completedSessions} />
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          <ConversationPanel />
          <StrugglePanel sessions={completedSessions} />
        </div>
      </div>
    </div>
  )
}
