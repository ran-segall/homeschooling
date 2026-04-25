'use client'

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { useKid } from '@/lib/context'
import { useAppData } from '@/lib/app-data'

// ─── Hebrew Translation Popup ─────────────────────────────────

function ReadableText({ text }: { text: string }) {
  const [popup, setPopup] = useState<{ word: string; x: number; y: number } | null>(null)
  const [translation, setTranslation] = useState<{ hebrew: string; transliteration: string; meaning: string } | null>(null)
  const [loadingWord, setLoadingWord] = useState(false)

  async function handleWordClick(word: string, e: React.MouseEvent) {
    const clean = word.replace(/[^a-zA-Z'-]/g, '')
    if (!clean) return
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setPopup({ word: clean, x: rect.left + rect.width / 2, y: rect.top })
    setTranslation(null)
    setLoadingWord(true)
    try {
      const res = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word: clean }) })
      const data = await res.json()
      setTranslation(data)
    } finally {
      setLoadingWord(false)
    }
  }

  const words = text.split(/(\s+)/)

  return (
    <div style={{ position: 'relative' }}>
      <p style={{ fontSize: 18, lineHeight: 1.75, color: 'var(--ink)', margin: 0 }}>
        {words.map((w, i) =>
          /\s/.test(w) ? w : (
            <span key={i} onClick={(e) => handleWordClick(w, e)} style={{ cursor: 'pointer', borderBottom: '1px dotted var(--ink3)', paddingBottom: 1 }}>
              {w}
            </span>
          )
        )}
      </p>
      {popup && (
        <>
          <div onClick={() => setPopup(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'fixed',
            left: Math.min(Math.max(popup.x - 110, 16), window.innerWidth - 236),
            top: popup.y - 90,
            zIndex: 50, background: 'var(--ink)', color: '#fff',
            borderRadius: 12, padding: '12px 16px', width: 220,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
          }}>
            {loadingWord ? (
              <div style={{ fontSize: 13, opacity: 0.6 }}>Translating…</div>
            ) : translation ? (
              <>
                <div style={{ fontFamily: 'var(--font-hebrew)', fontSize: 24, marginBottom: 2, direction: 'rtl' }}>{translation.hebrew}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{translation.transliteration}</div>
                <div style={{ fontSize: 12, opacity: 0.55 }}>{translation.meaning}</div>
              </>
            ) : null}
            <div style={{ fontSize: 11, opacity: 0.4, marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 6 }}>
              Tap anywhere to close
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Step Components ──────────────────────────────────────────

function StepRead({ content, onNext }: { content: Record<string, unknown>; onNext: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <ReadableText text={content.text as string} />
      <p style={{ fontSize: 13, color: 'var(--ink3)', margin: 0 }}>Tap any word for its Hebrew translation.</p>
      <NextButton onClick={onNext} label="Continue" />
    </div>
  )
}

function StepMultipleChoice({ content, onNext }: { content: Record<string, unknown>; onNext: (answer: unknown, correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const options = content.options as string[]
  const correct = content.correct as number
  const isCorrect = selected === correct

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>{content.question as string}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt, i) => {
          const isSelected = selected === i
          const showCorrect = checked && i === correct
          const showWrong = checked && isSelected && !isCorrect
          return (
            <button key={i} disabled={checked} onClick={() => setSelected(i)} style={{
              padding: '14px 18px', borderRadius: 12, textAlign: 'left', fontSize: 15,
              border: `2px solid ${showCorrect ? 'var(--lime)' : showWrong ? '#ef4444' : isSelected ? 'var(--ink)' : 'var(--line)'}`,
              background: showCorrect ? 'var(--lime-bg)' : showWrong ? '#fef2f2' : isSelected ? 'var(--ink)' : 'var(--card)',
              color: showCorrect ? 'var(--lime-fg)' : showWrong ? '#dc2626' : isSelected ? '#fff' : 'var(--ink)',
              cursor: checked ? 'default' : 'pointer', transition: 'all 120ms', fontFamily: 'var(--font-body)',
            }}>{opt}</button>
          )
        })}
      </div>
      {checked && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: isCorrect ? 'var(--lime-bg)' : '#fef2f2', border: `1px solid ${isCorrect ? 'var(--lime)' : '#fecaca'}` }}>
          <p style={{ margin: 0, fontSize: 15, color: isCorrect ? 'var(--lime-fg)' : '#dc2626', fontWeight: 500 }}>
            {isCorrect ? '✓ Correct!' : `Not quite — the answer is: ${options[correct]}`}
          </p>
        </div>
      )}
      {!checked
        ? <NextButton onClick={() => setChecked(true)} label="Check" disabled={selected === null} />
        : <NextButton onClick={() => onNext(selected, isCorrect)} label="Continue" />
      }
    </div>
  )
}

function StepDragToOrder({ content, onNext }: { content: Record<string, unknown>; onNext: (answer: unknown, correct: boolean) => void }) {
  const originalItems = content.items as string[]
  const [items, setItems] = useState(() => [...originalItems].sort(() => Math.random() - 0.5))
  const [checked, setChecked] = useState(false)

  function move(index: number, dir: -1 | 1) {
    const next = [...items]
    const swap = index + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap], next[index]]
    setItems(next)
  }

  const isCorrect = JSON.stringify(items) === JSON.stringify(originalItems)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>{content.question as string}</p>
      <p style={{ fontSize: 13, color: 'var(--ink3)', margin: '-12px 0 0' }}>Use the arrows to reorder.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
            <div style={{ flex: 1, padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 15, color: 'var(--ink)' }}>{item}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <button disabled={checked || i === 0} onClick={() => move(i, -1)} style={{ width: 28, height: 28, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--card)', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, fontSize: 12 }}>↑</button>
              <button disabled={checked || i === items.length - 1} onClick={() => move(i, 1)} style={{ width: 28, height: 28, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--card)', cursor: i === items.length - 1 ? 'default' : 'pointer', opacity: i === items.length - 1 ? 0.3 : 1, fontSize: 12 }}>↓</button>
            </div>
          </div>
        ))}
      </div>
      {checked && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: isCorrect ? 'var(--lime-bg)' : '#fef2f2', border: `1px solid ${isCorrect ? 'var(--lime)' : '#fecaca'}` }}>
          <p style={{ margin: 0, fontSize: 15, color: isCorrect ? 'var(--lime-fg)' : '#dc2626', fontWeight: 500 }}>
            {isCorrect ? '✓ Perfect order!' : 'Not quite — here\'s the correct order:'}
          </p>
          {!isCorrect && originalItems.map((item, i) => <p key={i} style={{ margin: '4px 0 0', fontSize: 13, color: '#dc2626' }}>{i + 1}. {item}</p>)}
        </div>
      )}
      {!checked
        ? <NextButton onClick={() => setChecked(true)} label="Check" />
        : <NextButton onClick={() => onNext(items, isCorrect)} label="Continue" />
      }
    </div>
  )
}

function StepDragToMatch({ content, onNext }: { content: Record<string, unknown>; onNext: (answer: unknown, correct: boolean) => void }) {
  const pairs = content.pairs as [string, string][]
  const [selected, setSelected] = useState<number | null>(null)
  const [matches, setMatches] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState(false)
  const rightIndexes = useRef(pairs.map(p => p[1]).sort(() => Math.random() - 0.5))

  function handleLeft(i: number) { if (!checked) setSelected(i) }
  function handleRight(j: number) {
    if (checked || selected === null) return
    setMatches(m => ({ ...m, [selected]: j }))
    setSelected(null)
  }

  const allMatched = Object.keys(matches).length === pairs.length
  const correctMatches = pairs.filter((p, i) => matches[i] !== undefined && rightIndexes.current[matches[i]] === p[1]).length
  const isCorrect = correctMatches === pairs.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>{content.question as string}</p>
      <p style={{ fontSize: 13, color: 'var(--ink3)', margin: '-12px 0 0' }}>Click a left item, then click its match on the right.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pairs.map((p, i) => (
            <button key={i} onClick={() => handleLeft(i)} disabled={checked} style={{
              padding: '12px 14px', borderRadius: 10, textAlign: 'left', fontSize: 14,
              border: `2px solid ${selected === i ? 'var(--ink)' : matches[i] !== undefined ? 'var(--lime)' : 'var(--line)'}`,
              background: selected === i ? 'var(--ink)' : matches[i] !== undefined ? 'var(--lime-bg)' : 'var(--card)',
              color: selected === i ? '#fff' : 'var(--ink)', cursor: checked ? 'default' : 'pointer',
              fontFamily: 'var(--font-body)', transition: 'all 120ms',
            }}>{p[0]}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rightIndexes.current.map((item, j) => {
            const matchedBy = Object.entries(matches).find(([, v]) => v === j)
            return (
              <button key={j} onClick={() => handleRight(j)} disabled={checked || (matchedBy !== undefined && selected === null)} style={{
                padding: '12px 14px', borderRadius: 10, textAlign: 'left', fontSize: 14,
                border: `2px solid ${matchedBy ? 'var(--lime)' : selected !== null ? 'var(--violet)' : 'var(--line)'}`,
                background: matchedBy ? 'var(--lime-bg)' : selected !== null ? 'var(--violet-bg)' : 'var(--card)',
                color: 'var(--ink)', cursor: checked ? 'default' : 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 120ms',
              }}>{item}</button>
            )
          })}
        </div>
      </div>
      {checked && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: isCorrect ? 'var(--lime-bg)' : '#fef2f2', border: `1px solid ${isCorrect ? 'var(--lime)' : '#fecaca'}` }}>
          <p style={{ margin: 0, fontSize: 15, color: isCorrect ? 'var(--lime-fg)' : '#dc2626', fontWeight: 500 }}>
            {isCorrect ? `✓ All ${pairs.length} matched correctly!` : `${correctMatches} of ${pairs.length} correct.`}
          </p>
        </div>
      )}
      {!checked
        ? <NextButton onClick={() => setChecked(true)} label="Check" disabled={!allMatched} />
        : <NextButton onClick={() => onNext(matches, isCorrect)} label="Continue" />
      }
    </div>
  )
}

function StepInteractive({ content, onNext }: { content: Record<string, unknown>; onNext: () => void }) {
  const [interacted, setInteracted] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--ink)', margin: 0 }}>{content.prompt as string}</p>
      <div onClick={() => setInteracted(true)} style={{
        background: 'var(--violet-bg)', border: `1px solid ${interacted ? 'var(--violet)' : 'var(--line)'}`,
        borderRadius: 16, padding: '32px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 200ms',
      }}>
        {interacted
          ? <p style={{ margin: 0, fontSize: 15, color: 'var(--violet-fg)', fontWeight: 500 }}>Great — you explored it!</p>
          : <><div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div><p style={{ margin: 0, fontSize: 15, color: 'var(--ink2)' }}>Tap to explore this idea</p></>
        }
      </div>
      <NextButton onClick={onNext} label="Continue" disabled={!interacted} />
    </div>
  )
}

function StepWrittenAnswer({ content, kid, onNext }: { content: Record<string, unknown>; kid: { name: string; age: number | null }; onNext: (answer: unknown, correct: boolean) => void }) {
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function getAIFeedback() {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: content.question, answer, kidName: kid.name, kidAge: kid.age }) })
      const data = await res.json()
      setFeedback(data.feedback)
      setSubmitted(true)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>{content.question as string}</p>
      {!!content.note && <p style={{ fontSize: 13, color: 'var(--ink3)', margin: '-12px 0 0' }}>{String(content.note)}</p>}
      <textarea value={answer} onChange={e => setAnswer(e.target.value)} disabled={submitted} placeholder="Write your answer here…" rows={5} style={{ width: '100%', padding: '14px 16px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 15, lineHeight: 1.6, color: 'var(--ink)', background: 'var(--card)', resize: 'vertical', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }} />
      {feedback && (
        <div style={{ padding: '16px 18px', borderRadius: 12, background: 'var(--violet-bg)', border: '1px solid var(--violet)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: 'var(--violet-fg)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Curio says</p>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--ink)', lineHeight: 1.6 }}>{feedback}</p>
        </div>
      )}
      {!submitted
        ? <NextButton onClick={getAIFeedback} label={loading ? 'Thinking…' : 'Get feedback'} disabled={!answer.trim() || loading} />
        : <NextButton onClick={() => onNext(answer, true)} label="Continue" />
      }
    </div>
  )
}

function StepSocratic({ content, onNext }: { content: Record<string, unknown>; onNext: (answer: unknown, correct: boolean) => void }) {
  const [reflection, setReflection] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--ink)', lineHeight: 1.4 }}>
        &ldquo;{content.question as string}&rdquo;
      </div>
      <textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="What do you think? There's no wrong answer…" rows={4} style={{ width: '100%', padding: '14px 16px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 15, lineHeight: 1.6, color: 'var(--ink)', background: 'var(--card)', resize: 'vertical', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }} />
      <NextButton onClick={() => onNext(reflection, true)} label="Continue" disabled={!reflection.trim()} />
    </div>
  )
}

function NextButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '14px 28px', background: disabled ? 'var(--line)' : 'var(--ink)',
      color: disabled ? 'var(--ink3)' : '#fff', border: 'none', borderRadius: 12,
      fontSize: 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-body)', transition: 'opacity 120ms', alignSelf: 'flex-start',
    }}>{label}</button>
  )
}

// ─── Main Lesson Page ─────────────────────────────────────────

const STEP_TYPE_LABELS: Record<string, string> = {
  'Read': 'Read', 'Multiple choice': 'Quiz', 'Drag to order': 'Order it',
  'Drag to match': 'Match up', 'Interactive': 'Explore', 'Written answer': 'Reflect', 'Socratic': 'Think',
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { kid } = useKid()
  const { getLessonById, subjects, createSession, addStepResponse, completeSession } = useAppData()
  const router = useRouter()

  const lesson = getLessonById(id)
  const steps = lesson?.steps ?? []
  const subject = lesson ? (subjects.find(s => s.id === lesson.subject_id) ?? null) : null

  const [currentStep, setCurrentStep] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const startTime = useRef(Date.now())

  useEffect(() => {
    if (!kid) { router.replace('/'); return }
    if (!lesson) { router.replace('/home'); return }
    const sid = createSession(id, kid.id)
    setSessionId(sid)
    startTime.current = Date.now()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  if (!kid || !lesson) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--ink)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  async function handleStepComplete(answer: unknown, isCorrect: boolean) {
    const step = steps[currentStep]
    if (sessionId && step) {
      addStepResponse(sessionId, step.id, answer, isCorrect)
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000)
      if (sessionId) completeSession(sessionId, timeSpent)
      router.push(`/feedback?session=${sessionId}&lesson=${id}`)
    }
  }

  const step = steps[currentStep]
  const progress = (currentStep / steps.length) * 100

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ position: 'sticky', top: 0, background: 'var(--bg)', borderBottom: '1px solid var(--line)', zIndex: 10 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 56 }}>
            <button onClick={() => router.push('/home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
            <div style={{ flex: 1, height: 4, background: 'var(--lime-bg)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--lime)', borderRadius: 2, transition: 'width 300ms ease' }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>{currentStep + 1} / {steps.length}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>
        {currentStep === 0 && (
          <div style={{ marginBottom: 36 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{subject?.label}</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, color: 'var(--ink)', margin: '6px 0 0', lineHeight: 1.2 }}>{lesson.title}</h1>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--violet-fg)', background: 'var(--violet-bg)', borderRadius: 6, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {STEP_TYPE_LABELS[step?.type] ?? step?.type}
          </span>
        </div>

        {step?.type === 'Read' && <StepRead content={step.content} onNext={() => handleStepComplete(null, true)} />}
        {step?.type === 'Multiple choice' && <StepMultipleChoice content={step.content} onNext={handleStepComplete} />}
        {step?.type === 'Drag to order' && <StepDragToOrder content={step.content} onNext={handleStepComplete} />}
        {step?.type === 'Drag to match' && <StepDragToMatch content={step.content} onNext={handleStepComplete} />}
        {step?.type === 'Interactive' && <StepInteractive content={step.content} onNext={() => handleStepComplete(null, true)} />}
        {step?.type === 'Written answer' && <StepWrittenAnswer content={step.content} kid={{ name: kid.name, age: kid.age }} onNext={handleStepComplete} />}
        {step?.type === 'Socratic' && <StepSocratic content={step.content} onNext={handleStepComplete} />}
      </div>
    </div>
  )
}
