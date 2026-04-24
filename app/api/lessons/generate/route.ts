import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { kidId, kidName, kidAge } = await req.json()
  const supabase = createServiceClient()

  // Fetch recent completed sessions for context
  const { data: sessions } = await supabase
    .from('lesson_sessions')
    .select('*, lesson:lessons(title, subject_id), feedback:lesson_feedback(*), responses:step_responses(is_correct)')
    .eq('kid_id', kidId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(6)

  // Fetch current pending/approved lessons to avoid duplicating subjects
  const { data: queued } = await supabase
    .from('lessons')
    .select('subject_id')
    .eq('assigned_to', kidId)
    .in('status', ['pending', 'approved'])

  const queuedSubjects = queued?.map((l: { subject_id: string }) => l.subject_id) ?? []

  type SessionRow = {
    lesson?: { title?: string; subject_id?: string } | null
    responses?: { is_correct: boolean | null }[] | null
    feedback?: { fun_rating?: number | null; difficulty?: string | null }[] | null
  }

  const recentLessons = (sessions as SessionRow[] ?? []).map(s => ({
    title: s.lesson?.title ?? 'Unknown',
    subject: s.lesson?.subject_id ?? 'unknown',
    score: s.responses?.length
      ? Math.round(s.responses.filter(r => r.is_correct).length / s.responses.length * 100)
      : null,
    fun: s.feedback?.[0]?.fun_rating ?? null,
    difficulty: s.feedback?.[0]?.difficulty ?? null,
  }))

  const avgScore = recentLessons.filter(l => l.score !== null).length
    ? Math.round(recentLessons.filter(l => l.score !== null).reduce((sum, l) => sum + (l.score ?? 0), 0) / recentLessons.filter(l => l.score !== null).length)
    : null

  const weakSubjects = recentLessons.filter(l => l.score !== null && (l.score ?? 0) < 70).map(l => l.subject)
  const recentSubjects = recentLessons.map(l => l.subject)

  const prompt = `You are a curriculum designer for Curio, a homeschool educational app.

Kid: ${kidName}, age ${kidAge}
${recentLessons.length > 0
  ? `Recent lessons:\n${recentLessons.map(l => `- "${l.title}" (${l.subject}): score ${l.score ?? '?'}%, fun ${l.fun ?? '?'}/4, difficulty: ${l.difficulty ?? 'unknown'}`).join('\n')}\nAverage score: ${avgScore ?? '?'}%`
  : 'No lessons completed yet.'}
${weakSubjects.length > 0 ? `Struggling with: ${weakSubjects.join(', ')}` : ''}
${queuedSubjects.length > 0 ? `Already in queue (avoid): ${queuedSubjects.join(', ')}` : ''}

Generate ONE personalised micro-lesson. Prefer subjects not recently covered or where score was low. Pick an engaging real-world topic appropriate for age ${kidAge}.

Available subjects: Philosophy, Geography, Writing, Money, Tech, History, Science, Art

Return ONLY valid JSON (no markdown fences):
{
  "subject": "one subject from the list",
  "title": "compelling title under 6 words",
  "description": "one sentence what this lesson teaches",
  "why_now": "one sentence why this lesson is right for ${kidName} right now",
  "xp_reward": 50,
  "steps": [
    {"type": "Read", "content": {"text": "2-3 engaging sentences introducing the topic, written for age ${kidAge}"}},
    {"type": "Multiple choice", "content": {"question": "question text", "options": ["A","B","C","D"], "correct": 1}},
    {"type": "Drag to order", "content": {"question": "order these...", "items": ["item1","item2","item3","item4"]}},
    {"type": "Written answer", "content": {"question": "open-ended reflective question", "note": "No right answer. Assessed for reasoning."}},
    {"type": "Socratic", "content": {"question": "a deep follow-up question with no single correct answer"}}
  ]
}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const lesson = JSON.parse(jsonMatch[0])
    lesson.id = `gen-${Date.now()}`
    lesson.status = 'pending'
    lesson.assigned_to = kidId
    return NextResponse.json({ lesson })
  } catch {
    return NextResponse.json({ error: 'Failed to generate lesson' }, { status: 500 })
  }
}
