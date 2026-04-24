import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { question, answer, kidName, kidAge } = await req.json()

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `You are a warm, Socratic tutor helping ${kidName}, age ${kidAge}.

The question was: "${question}"
Their answer: "${answer}"

Give a brief, encouraging response (2-3 sentences max) that:
1. Acknowledges something good about their thinking
2. Asks ONE follow-up question to go deeper

Write directly to ${kidName}, in simple language they can understand. No jargon. Be warm and curious, not teacher-y.`,
    }],
  })

  const feedback = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  return NextResponse.json({ feedback })
}
