import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

interface Props {
  params: Promise<{ missionId: string }>
}

export default async function MarkerRulesConfigPage({ params }: Props) {
  const { missionId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: mission } = await supabase.from('missions').select('title').eq('id', missionId).single()
  if (!mission) notFound()

  // Get current rules
  const { data: rulesRow } = await supabase.from('marker_rules').select('rules').eq('mission_id', missionId).single()

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

  async function updateRules(formData: FormData) {
    'use server'
    const newRulesRaw = formData.get('rules') as string
    try {
      const newRules = JSON.parse(newRulesRaw)
      const sb = await createClient()
      await sb.from('marker_rules').upsert({ mission_id: missionId, rules: newRules }, { onConflict: 'mission_id' })
      revalidatePath(`/admin/missions/${missionId}/markers`)
    } catch (e) {
      console.error('Invalid JSON format')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin/missions" className="text-sm font-medium text-indigo-600 hover:underline mb-4 inline-block">
          &larr; Kembali ke Daftar Misi
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Konfigurasi Markers AI</h1>
        <p className="text-slate-600 mb-6">Misi: {mission.title}</p>

        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden p-6">
          <p className="text-sm text-slate-500 mb-4">
            Edit aturan ekstraksi _behavioral markers_ (tahap 4). Konfigurasi ini dibaca saat sistem mengagregasi *trace* setiap sesi untuk menentukan *raw score* tiap indikator.
          </p>

          <form action={updateRules}>
            <textarea
              name="rules"
              rows={20}
              className="w-full text-sm font-mono p-4 border border-slate-300 rounded bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              defaultValue={JSON.stringify(currentRules, null, 2)}
            />
            <div className="flex justify-end">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded font-medium hover:bg-indigo-700">
                Simpan Aturan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
