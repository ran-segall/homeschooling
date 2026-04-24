import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { word } = await req.json()
  if (!word) return NextResponse.json({ error: 'Missing word' }, { status: 400 })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 128,
    messages: [{
      role: 'user',
      content: `Translate the English word "${word}" to Hebrew. Reply with ONLY a JSON object in this exact format, nothing else:
{"hebrew": "the Hebrew word", "transliteration": "pronunciation in English letters", "meaning": "brief meaning in English (max 6 words)"}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ hebrew: '—', transliteration: '', meaning: word }, { status: 200 })
  }
}
