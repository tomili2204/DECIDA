import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import RubricEditorClient from './RubricEditorClient'

interface Props {
  params: Promise<{ missionId: string }>
}

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function RubricsConfigPage({ params }: Props) {
  const { missionId } = await params
  const supabase = await createClient()
  const admin = getAdmin()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: mission } = await admin.from('missions').select('title, difficulty').eq('id', missionId).single()
  if (!mission) notFound()

  // Get current rubrics
  const { data: rubrics } = await admin.from('rubrics').select('*').eq('mission_id', missionId)
  
  const defaultRubricIndicators = {
    interpretasi: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'berkembang' }, { max: 2, level: 'mahir' }] },
    analisis: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'berkembang' }, { max: 2, level: 'mahir' }] },
    evaluasi: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'berkembang' }, { max: 2, level: 'mahir' }] },
    inferensi: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'mahir' }] },
    eksplanasi: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'mahir' }] },
    regulasi_diri: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'berkembang' }, { max: 2, level: 'mahir' }] }
  }

  // We map the legacy 'SD', 'SMP', 'SMA' to Mudah, Sedang, Tinggi for display purposes
  const mudahRubric = rubrics?.find(r => r.jenjang === 'SD')?.indicators || defaultRubricIndicators
  const sedangRubric = rubrics?.find(r => r.jenjang === 'SMP')?.indicators || defaultRubricIndicators
  const tinggiRubric = rubrics?.find(r => r.jenjang === 'SMA')?.indicators || defaultRubricIndicators

  const initialData = {
    'SD': mudahRubric,
    'SMP': sedangRubric,
    'SMA': tinggiRubric
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <Link href="/admin/missions" className="text-sm font-medium text-indigo-600 hover:underline mb-4 inline-block">
          &larr; Kembali ke Daftar Misi
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Konfigurasi Rubrik AI</h1>
        <p className="text-slate-600 mb-8">Misi: {mission.title}</p>
        
        <RubricEditorClient missionId={missionId} initialData={initialData} />
      </main>
    </div>
  )
}

