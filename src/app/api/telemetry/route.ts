import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const events = await request.json()
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Ensure all events belong to the authenticated user
    const sanitizedEvents = events.map((event: any) => ({
      session_id: event.session_id,
      student_id: user.id, // Force student_id to be the authenticated user
      mission_id: event.mission_id,
      event_type: event.event_type,
      timestamp: event.timestamp || new Date().toISOString(),
      payload: event.payload || {}
    }))

    const { error } = await supabase
      .from('activity_logs')
      .insert(sanitizedEvents)

    if (error) {
      console.error('Telemetry insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, count: sanitizedEvents.length })
  } catch (err: any) {
    console.error('Telemetry exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
