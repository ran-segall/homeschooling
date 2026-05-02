import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { question, answer, kidName, kidAge } = await req.json()

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `You are a warm, Socratic tutor helping ${kidName}, age ${kidAge}.

The question was: "${question}"
Their answer: "${answer}"

Respond with a JSON object with two fields:

"feedback": A brief, encouraging response (2-3 sentences) that acknowledges something good about their thinking and asks ONE follow-up question to go deeper. Write directly to ${kidName} in simple language. Be warm and curious, not teacher-y.

"corrections": An array of spelling or grammar mistakes found in their answer. Each item should be a short string like "'recieve' → 'receive'" or "'they was' → 'they were'". If there are no mistakes, return an empty array [].

Return only valid JSON, no other text.`,
    }],
  })

  try {
    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'
    const parsed = JSON.parse(raw)
    return NextResponse.json({
      feedback: parsed.feedback ?? '',
      corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
    })
  } catch {
    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return NextResponse.json({ feedback: raw, corrections: [] })
  }
}
