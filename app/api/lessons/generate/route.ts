import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

type RecentSession = {
  lesson_id?: string
  subject_id?: string
  fun_rating?: number | null
  difficulty?: string | null
  score_pct?: number | null
}

export async function POST(req: NextRequest) {
  const { kidId, kidName, kidAge, recentSessions, queuedSubjects } = await req.json() as {
    kidId: string
    kidName: string
    kidAge: number
    recentSessions?: RecentSession[]
    queuedSubjects?: string[]
  }

  const sessions = recentSessions ?? []
  const queued = queuedSubjects ?? []

  const avgScore = sessions.filter(s => s.score_pct != null).length
    ? Math.round(sessions.filter(s => s.score_pct != null).reduce((sum, s) => sum + (s.score_pct ?? 0), 0) / sessions.filter(s => s.score_pct != null).length)
    : null

  const weakSubjects = sessions.filter(s => s.score_pct != null && (s.score_pct ?? 0) < 70).map(s => s.subject_id).filter(Boolean)
  const recentSubjects = sessions.map(s => s.subject_id).filter(Boolean)

  const recentLines = sessions.map(s =>
    `- subject: ${s.subject_id ?? 'unknown'}, score: ${s.score_pct ?? '?'}%, fun: ${s.fun_rating ?? '?'}/4, difficulty: ${s.difficulty ?? 'unknown'}`
  )

  const prompt = `You are a curriculum designer for Curio, a homeschool educational app.

Kid: ${kidName}, age ${kidAge}
${recentLines.length > 0
    ? `Recent lessons:\n${recentLines.join('\n')}\nAverage score: ${avgScore ?? '?'}%`
    : 'No lessons completed yet — this is their first lesson.'}
${weakSubjects.length > 0 ? `Struggling with: ${[...new Set(weakSubjects)].join(', ')}` : ''}
${recentSubjects.length > 0 ? `Recently covered: ${[...new Set(recentSubjects)].join(', ')}` : ''}
${queued.length > 0 ? `Already in queue (avoid): ${[...new Set(queued)].join(', ')}` : ''}

Generate ONE personalised micro-lesson. Prefer subjects not recently covered. If they struggled (score < 70%) in a subject, revisit it at a simpler angle. Choose a topic engaging for age ${kidAge}.

Available subjects (use lowercase id in JSON): philosophy, geography, writing, money, tech, history, science, art

Return ONLY valid JSON (no markdown fences):
{
  "subject": "one subject id from the list",
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
