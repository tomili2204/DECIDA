import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import MarkerEditorClient from './MarkerEditorClient'

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

export default async function MarkerRulesConfigPage({ params }: Props) {
  const { missionId } = await params
  const supabase = await createClient()
  const admin = getAdmin()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: mission } = await admin.from('missions').select('title').eq('id', missionId).single()
  if (!mission) notFound()

  // Get current rules
  const { data: rulesRow } = await admin.from('marker_rules').select('rules').eq('mission_id', missionId).single()

  // Default rules structure
  const defaultRules = {
    interpretasi: { step1_keywords: ['rata-rata', 'sebaran', 'tertinggi', 'terendah'] },
    analisis: { min_unique_formulas: 2, step2_keywords: ['mean', 'median', 'rata-rata', 'beda'] },
    evaluasi: { spread_formulas: ['STDEV', 'VAR', 'MAX', 'MIN'], step3_keywords: ['outlier', 'ekstrem', 'kelemahan', 'kurang'] },
    inferensi: { min_evidence_links: 2 },
    eksplanasi: { step5_keywords: ['karena', 'berdasarkan grafik', 'tabel menunjukkan'] },
    regulasi_diri: { step6_keywords: ['mungkin', 'belum tentu', 'kurang data', 'batas'] }
  }

  const currentRules = rulesRow?.rules || defaultRules

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin/missions" className="text-sm font-medium text-indigo-600 hover:underline mb-4 inline-block">
          &larr; Kembali ke Daftar Misi
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Konfigurasi Markers AI</h1>
        <p className="text-slate-600 mb-8">Misi: {mission.title}</p>
        
        <MarkerEditorClient missionId={missionId} initialRules={currentRules} />
      </div>
    </div>
  )
}
