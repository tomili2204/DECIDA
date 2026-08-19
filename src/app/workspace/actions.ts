'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { EvidenceLink } from '@/types/workspace'

export async function startMission(missionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check for existing active session
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('student_id', user.id)
    .eq('mission_id', missionId)
    .eq('status', 'active')
    .single()

  if (existing) {
    redirect(`/workspace/${existing.id}`)
  }

  // Create new session
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({ student_id: user.id, mission_id: missionId, status: 'active' })
    .select('id')
    .single()

  if (error || !session) throw new Error('Gagal membuat sesi.')
  redirect(`/workspace/${session.id}`)
}

export async function saveStepAnswer(
  sessionId: string,
  stepNumber: number,
  answerText: string,
  evidenceLinks: EvidenceLink[]
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('step_answers')
    .upsert(
      {
        session_id: sessionId,
        step_number: stepNumber,
        answer_text: answerText,
        evidence_links: evidenceLinks,
      },
      { onConflict: 'session_id,step_number' }
    )
  if (error) console.error('Save step answer error:', error)
}

export async function submitDecision(sessionId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'completed', ended_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) throw new Error('Gagal menyimpan keputusan.')
  
  // Trigger rule-based behavioral markers aggregation synchronously
  // so the process doesn't get killed by the redirect.
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabaseAdmin = createAdminClient()
  const { aggregateMarkers } = await import('@/lib/markers/aggregate')
  await aggregateMarkers(sessionId, supabaseAdmin)

  revalidatePath('/workspace')
  redirect(`/workspace/hasil/${sessionId}`)
}
