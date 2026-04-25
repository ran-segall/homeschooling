import { createServiceClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { name, age, avatar_color } = await req.json()

  if (!name?.trim() || !age || !avatar_color) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({ name: name.trim(), role: 'kid', age: Number(age), avatar_color })
    .select()
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }

  await supabase
    .from('kid_progress')
    .insert({ kid_id: profile.id, xp: 0, level: 1, streak_days: 0 })

  return NextResponse.json({ profile })
}
