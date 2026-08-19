import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import WorkspaceClient from '@/components/workspace/WorkspaceClient'
import type { Mission, StepAnswer } from '@/types/workspace'
import { TelemetryProvider } from '@/lib/telemetry'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function WorkspaceSessionPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load session + mission
  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, status, student_id, missions(id, title, jenjang, scenario, dataset, steps)')
    .eq('id', sessionId)
    .single()

  if (error || !session || session.student_id !== user.id) notFound()

  const mission = session.missions as any as Mission

  // Load existing step answers
  const { data: savedAnswers } = await supabase
    .from('step_answers')
    .select('step_number, answer_text, evidence_links')
    .eq('session_id', sessionId)
    .order('step_number')

  const stepAnswers: StepAnswer[] = (savedAnswers ?? []).map((a) => ({
    step_number: a.step_number,
    answer_text: a.answer_text ?? '',
    evidence_links: Array.isArray(a.evidence_links) ? a.evidence_links : [],
  }))

  // Load profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <TelemetryProvider sessionId={sessionId} missionId={mission.id}>
      <WorkspaceClient
        session={{ id: sessionId, status: session.status }}
        mission={mission}
        savedAnswers={stepAnswers}
        studentName={profile?.full_name ?? 'Mahasiswa'}
      />
    </TelemetryProvider>
  )
}
