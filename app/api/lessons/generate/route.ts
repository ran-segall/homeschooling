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
  const { kidId, kidName, kidAge, recentSessions, queuedSubjects, enabledTopics, feedback, existingLesson } = await req.json() as {
    kidId: string
    kidName: string
    kidAge: number
    recentSessions?: RecentSession[]
    queuedSubjects?: string[]
    enabledTopics?: string[]
    feedback?: string
    existingLesson?: Record<string, unknown>
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

  const stepSchema = `[
    {"type": "Read", "content": {"text": "A rich introductory passage of 5-7 sentences covering the topic broadly. Use vivid examples and engaging language for age ${kidAge}. Make it feel like a story or discovery, not a textbook."}},
    {"type": "Multiple choice", "content": {"question": "Comprehension question from the reading above", "options": ["A","B","C","D"], "correct": 1}},
    {"type": "Drag to order OR Drag to match", "content": {"question": "...", "items": ["item1","item2","item3","item4"] (for order) OR "pairs": [["left1","right1"],["left2","right2"],["left3","right3"]] (for match)}},
    {"type": "Read", "content": {"text": "A second passage of 5-7 sentences going deeper — a surprising fact, a different angle, or a real-world connection. Keep it engaging and age-appropriate."}},
    {"type": "Multiple choice", "content": {"question": "A new question testing understanding of the second reading", "options": ["A","B","C","D"], "correct": 0}},
    {"type": "Written answer", "content": {"question": "An open-ended question asking ${kidName} to connect the topic to their own life or opinions", "note": "No right answer — share your thoughts."}},
    {"type": "Socratic", "content": {"question": "A big, thought-provoking question about the topic with no single correct answer — the kind you'd discuss at dinner"}},
    {"type": "Written answer", "content": {"question": "What are the 2 or 3 most important things you learned in this lesson? Explain them in your own words.", "note": "Try to write at least 3 sentences."}}
  ]`

  const prompt = feedback && existingLesson ? `You are a curriculum designer for Curio, a homeschool educational app.

Kid: ${kidName}, age ${kidAge}

You previously generated this lesson:
${JSON.stringify(existingLesson, null, 2)}

The parent has reviewed it and given this feedback:
"${feedback}"

Revise the lesson to address the feedback. Keep what works, fix what was flagged. The lesson should take around 15 minutes to complete. Return the full revised lesson as valid JSON (no markdown fences):
{
  "subject": "one subject id from the list",
  "title": "compelling title under 6 words",
  "description": "one sentence what this lesson teaches",
  "why_now": "one sentence why this lesson is right for ${kidName} right now",
  "xp_reward": 75,
  "steps": ${stepSchema}
}` : `You are a curriculum designer for Curio, a homeschool educational app.

Kid: ${kidName}, age ${kidAge}
${recentLines.length > 0
    ? `Recent lessons:\n${recentLines.join('\n')}\nAverage score: ${avgScore ?? '?'}%`
    : 'No lessons completed yet — this is their first lesson.'}
${weakSubjects.length > 0 ? `Struggling with: ${[...new Set(weakSubjects)].join(', ')}` : ''}
${recentSubjects.length > 0 ? `Recently covered: ${[...new Set(recentSubjects)].join(', ')}` : ''}
${queued.length > 0 ? `Already in queue (avoid): ${[...new Set(queued)].join(', ')}` : ''}

Generate ONE personalised lesson designed to take around 15 minutes. Prefer subjects not recently covered. If they struggled (score < 70%) in a subject, revisit it at a simpler angle. Choose a topic engaging for age ${kidAge}.

Available subjects (use exact id from this list in JSON): ${(enabledTopics && enabledTopics.length > 0 ? enabledTopics : ['philosophy', 'geography', 'writing', 'money', 'tech', 'history', 'science', 'art']).join(', ')}

Return ONLY valid JSON (no markdown fences):
{
  "subject": "one subject id from the list",
  "title": "compelling title under 6 words",
  "description": "one sentence what this lesson teaches",
  "why_now": "one sentence why this lesson is right for ${kidName} right now",
  "xp_reward": 75,
  "steps": ${stepSchema}
}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
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
